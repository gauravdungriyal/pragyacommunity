import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000, // 8 second timeout to avoid indefinite hanging
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getStoredToken = (): string | null => {
  return (
    localStorage.getItem('access_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('pragya_token')
  );
};

export const getStoredRefreshToken = (): string | null => {
  return localStorage.getItem('refresh_token');
};

// Attach JWT Token to every request if available
apiClient.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercept responses for standardized error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('Session expired or unauthorized.');
    }
    return Promise.reject(error);
  }
);

/**
 * Universal helper to execute action-based requests against backend
 */
export const apiPhpPost = async <T = any>(
  action: string,
  payload: Record<string, any> | FormData = {},
  options: { isMultipart?: boolean } = {}
): Promise<T> => {
  const token = getStoredToken();

  if (payload instanceof FormData) {
    if (!payload.has('action')) {
      payload.append('action', action);
    }
    if (token && !payload.has('token')) {
      payload.append('token', token);
    }
    const res = await axios.post<T>('/api_v2.php', payload, {
      timeout: 8000,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    return res.data;
  }

  const requestBody = {
    action,
    ...(token ? { token } : {}),
    ...payload,
  };

  const res = await axios.post<T>('/api_v2.php', requestBody, {
    timeout: 8000,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  return res.data;
};
