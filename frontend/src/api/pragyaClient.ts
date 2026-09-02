/**
 * Client for the live Pragya Yog API (https://pragya-yog.com/api.php).
 *
 * Protocol notes, taken from https://pragya-yog.com/docs/:
 *  - One entry point; the operation is chosen by the `action` field in the body.
 *  - Protected actions read the JWT from the body field `token`, NOT from an
 *    Authorization header.
 *  - The JWT carries `email`, `iat` and `exp` — there is no user id in the token.
 *  - Uploaded media is served from https://pragya-yog.com/uploads/.
 */

export const PRAGYA_API_URL =
  import.meta.env.VITE_PRAGYA_API_URL || 'https://pragya-yog.com/api.php';

export const PRAGYA_UPLOADS_URL =
  import.meta.env.VITE_PRAGYA_UPLOADS_URL || 'https://pragya-yog.com/uploads/';

/**
 * Booking and payment actions write to the live system. They stay disabled
 * unless VITE_PRAGYA_ALLOW_WRITES is explicitly set to "true", so testing the
 * app cannot create real bookings or payment records by accident.
 */
export const PRAGYA_WRITES_ENABLED =
  String(import.meta.env.VITE_PRAGYA_ALLOW_WRITES || '').toLowerCase() === 'true';

/** Actions that create real records on the live system. */
const WRITE_ACTIONS = new Set([
  'book',
  'book_dropin',
  'create_payment',
  'reserve_package',
  'reserve_bundle',
  'guest_reserve_package',
  'guest_reserve_bundle',
  'renew-package',
  'billing-wallet-payment',
  'billing-upload-receipt',
  'guestBooking',
]);

export class PragyaApiError extends Error {
  constructor(message: string, public action: string, public payload?: unknown) {
    super(message);
    this.name = 'PragyaApiError';
  }
}

/** Raised instead of calling a live write while the safety flag is off. */
export class PragyaWriteBlockedError extends PragyaApiError {
  constructor(action: string) {
    super(
      `"${action}" writes to the live Pragya Yog system and is currently disabled. ` +
        'Set VITE_PRAGYA_ALLOW_WRITES=true in frontend/.env to enable it.',
      action
    );
    this.name = 'PragyaWriteBlockedError';
  }
}

/**
 * The stored token, but only when it was issued by the live API. A token from
 * the local backend is meaningless here and must not be sent on.
 */
export const getPragyaToken = (): string | null => {
  const source = localStorage.getItem('auth_source') || 'pragya';
  if (source !== 'pragya') return null;
  return localStorage.getItem('access_token') || localStorage.getItem('token');
};

const REQUEST_TIMEOUT = 20000;

async function send(action: string, body: BodyInit, headers: Record<string, string>) {
  if (WRITE_ACTIONS.has(action) && !PRAGYA_WRITES_ENABLED) {
    throw new PragyaWriteBlockedError(action);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const res = await fetch(PRAGYA_API_URL, {
      method: 'POST',
      headers,
      body,
      signal: controller.signal,
    });

    // 401 carries a JSON body describing the token problem; surface it as-is
    const text = await res.text();
    let data: any;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      throw new PragyaApiError(
        `The API returned a non-JSON response for "${action}".`,
        action,
        text.slice(0, 300)
      );
    }

    if (!res.ok && data?.status === undefined && !data?.error) {
      throw new PragyaApiError(`Request failed (HTTP ${res.status}) for "${action}".`, action, data);
    }

    return data;
  } catch (err: any) {
    if (err instanceof PragyaApiError) throw err;
    if (err?.name === 'AbortError') {
      throw new PragyaApiError(`The API did not respond in time for "${action}".`, action);
    }
    throw new PragyaApiError(
      `Could not reach the Pragya Yog API for "${action}". Check the connection.`,
      action
    );
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Call an action with a JSON body. The auth token is attached automatically
 * when one is stored, since the API expects it in the body.
 */
export async function pragyaPost<T = any>(
  action: string,
  payload: Record<string, unknown> = {},
  options: { auth?: boolean } = {}
): Promise<T> {
  const token = getPragyaToken();
  const withAuth = options.auth !== false && token;

  const body = JSON.stringify({
    action,
    ...(withAuth ? { token } : {}),
    ...payload,
  });

  return send(action, body, { 'Content-Type': 'application/json' });
}

/**
 * Call an action with multipart/form-data. `edit_user_details` reads from
 * $_POST and $_FILES, so it cannot accept a JSON body.
 */
export async function pragyaPostForm<T = any>(
  action: string,
  fields: Record<string, string | number | undefined | null> = {},
  files: Record<string, File | null | undefined> = {}
): Promise<T> {
  const form = new FormData();
  form.append('action', action);

  const token = getPragyaToken();
  if (token) form.append('token', token);

  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null) form.append(key, String(value));
  });
  Object.entries(files).forEach(([key, file]) => {
    if (file) form.append(key, file);
  });

  // The browser sets the multipart boundary itself; do not set Content-Type
  return send(action, form, {});
}

/** Resolve a stored filename to its full URL on the uploads host. */
export const pragyaUpload = (file?: string | null, folder = ''): string => {
  if (!file) return '';
  if (/^https?:\/\//i.test(file)) return file;
  return PRAGYA_UPLOADS_URL + folder + String(file).replace(/^\/+/, '');
};

/**
 * Much of the content is authored in a rich-text editor and comes back as HTML.
 * Rendering it as plain text avoids injecting markup into the page.
 */
export const htmlToText = (html?: string | null): string => {
  if (!html) return '';
  return String(html)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&rsquo;/gi, "'")
    .replace(/&ldquo;|&rdquo;/gi, '"')
    .replace(/&mdash;/gi, '—')
    .replace(/&ndash;/gi, '–')
    .replace(/&hellip;/gi, '…')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

/** "2026-09-03 12:30:00" -> { date: "2026-09-03", time: "12:30 PM" } */
export const splitDateTime = (value?: string | null): { date: string; time: string } => {
  if (!value) return { date: '', time: '' };

  const [datePart, timePart = ''] = String(value).split(' ');
  if (!timePart) return { date: datePart || '', time: '' };

  const [hRaw, m = '00'] = timePart.split(':');
  const hour = Number(hRaw);
  if (Number.isNaN(hour)) return { date: datePart, time: '' };

  const suffix = hour >= 12 ? 'PM' : 'AM';
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return { date: datePart, time: `${display}:${m} ${suffix}` };
};
