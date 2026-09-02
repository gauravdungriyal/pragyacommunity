# Pragya Yog API — tested endpoint reference

`index.html` is a self-contained reference for the live Pragya Yog API
(`https://pragya-yog.com/api.php`). Open it in any browser; it needs no server
and loads nothing from the network.

It differs from the published reference at <https://pragya-yog.com/docs/> in one
way: **every entry records what the live call actually returned**, rather than
what the documentation predicts.

## What was tested

Each of the 70 request presets in the API workbench
(<https://pragya-yog.com/test_main_api.php>) was sent to the live API with its own
request body. The three `emergency-contact` variants are merged into a single
entry, giving 68 documented actions.

| Result | Count | Meaning |
|--------|-------|---------|
| Working | 21 | Returned real data |
| Auth required | 17 | Confirmed to reject an invalid token |
| Errors | 8 | Failed for a reason recorded against the entry |
| Not called | 22 | Writes real data — deliberately not executed |

Two limits are stated on the page itself and are worth repeating:

- **Nothing that writes was called.** Bookings, payments, reviews, tickets,
  device registrations, favourite toggles and the profile writers are documented
  from their request shape only. No live records were created.
- **Auth-gated responses are unverified.** Each was proven to reject an invalid
  token, but no test account was available, so their success payloads are not
  documented. `get-booked-classes` and `bookings` are the two this app needs.

## Faults found

Recorded in full on the page, under "Note from testing":

- `publicClassByDate` — the workbench preset sends `date`, which returns **zero
  schedules and no error**. The parameter that works is `event_date` or
  `selected_date`.
- `media-album-detail` — takes `id`; the preset sends `album_id` and gets
  "Album not found or access denied".
- `get-package-detail` — takes `package_id`; `id` is rejected.
- `classesTypeDetail` — returns an empty body for every parameter tried.
- `get-yoga-poses` — fails: the `pyshk.yoga_poses` table does not exist.

## Which actions this app uses

Wired to the live API: `login`, `check-token`, `reset-password`,
`passwrod_change`, `get-profile`, `edit_user_details`,
`update-notification-settings`, `upcoming-events`, `upcoming-event-detail`,
`event-toggle-favorite`, `event-favorites`, `teachers`, `today-class`,
`get-daily-quote` and `faqs`.

Available and not yet used: `get-instructor-reviews` (real mentor ratings), the
`media-*` set (albums, videos and audio for the Resource Library),
`get-packages`, and the check-in actions.

The Community Feed, Courses, group chat, direct messages and the Admin Portal
have no equivalent in this API and are served by the local backend in `backend/`.

## Files

| File | Contents |
|------|----------|
| `index.html` | The reference page — open it directly in a browser |
| `endpoints.json` | The same data as JSON: request parameters, verdict and observed response per action |

`endpoints.json` is the machine-readable source; the page is generated from it.
Re-running the tests and regenerating the page will overwrite both.
