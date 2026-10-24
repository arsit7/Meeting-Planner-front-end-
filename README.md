# Meeting Planner — Frontend (React)

React single-page app for the Meeting Planner prototype. Users can sign up and log in, upload a profile
picture, create and edit meetings, and manage participants.

It talks to the Spring Boot API in the companion repository **`Meeting Planner-back-end`**. That README
documents the API, data model, authorization rules and security design in detail.

> **Stack note:** the frontend uses **React** as specified in the build brief. If your assignment requires
> Angular, flag it before review. The backend API doesn't depend on the frontend framework.

---

## Features

- Signup and login pages with client-side validation and server error display
- Protected routes: unauthenticated users are redirected to `/login` and returned to the page they wanted
  after logging in
- Dashboard listing upcoming and past meetings, with Organizer or "Invited by …" badges
- Create meeting, optionally adding participants in the same form (saved in a single request)
- Edit meeting details (organizer only)
- Meeting details page: add and remove participants, delete the meeting (organizer only; read-only for
  invitees)
- Profile page with avatar upload (type and size checked before upload)
- Logout, plus automatic logout when the JWT expires or the API returns `401`
- Loading, empty, success and error states throughout; responsive layout down to phone width

## Technology stack

| Concern     | Choice                                                         |
|-------------|----------------------------------------------------------------|
| UI          | React 19, plain CSS (no UI framework)                          |
| Routing     | React Router 7 (`react-router-dom`)                            |
| HTTP        | Axios (shared instance with auth and 401 interceptors)         |
| Build/dev   | Vite 6                                                         |
| Tests       | Vitest 3, React Testing Library, user-event, jsdom             |

## Folder structure

```
src/
├── main.jsx, App.jsx        entry point and route table
├── styles.css               all styling (CSS variables, responsive rules)
├── api/                     client.js (Axios instance + interceptors), auth.js, users.js, meetings.js, errors.js
├── auth/                    AuthContext.jsx (session state), ProtectedRoute.jsx, tokenStorage.js
├── components/              Layout, MeetingForm, ParticipantList, AddParticipantForm, Avatar, FormField, Alert, Spinner
├── pages/                   Login, Signup, Dashboard, NewMeeting, EditMeeting, MeetingDetail, Profile, NotFound
├── utils/                   validation.js (mirrors backend rules), dates.js (local ↔ ISO conversions)
└── test/                    setup.js, renderWithAuth.jsx (test helper)
```

Tests sit next to the code they cover (`*.test.jsx` / `*.test.js`).

## Routes

| Path                  | Access     | Page                                   |
|-----------------------|------------|----------------------------------------|
| `/login`, `/signup`   | Public     | Auth forms (redirect away if logged in) |
| `/meetings`           | Protected  | Dashboard / meeting list               |
| `/meetings/new`       | Protected  | Create meeting                         |
| `/meetings/:id`       | Protected  | Details + participant management       |
| `/meetings/:id/edit`  | Protected  | Edit meeting (organizer)               |
| `/profile`            | Protected  | Profile + avatar upload                |

## How authentication works in the client

1. Login or signup calls the API, which returns `{ token, user }`. The token is kept in `localStorage`
   and the user in React context.
2. An Axios request interceptor adds `Authorization: Bearer <token>` to every API call.
3. On page load, an existing token is checked with `GET /api/users/me`, and a "Checking your session…"
   state shows meanwhile.
4. A timer logs the user out when the token's `exp` passes. Any `401` from the API also logs out and shows
   "Your session has expired".
5. The client reads the token's `exp` only for UX. It never verifies tokens and holds no secrets: the
   signing key exists only on the server, and the **backend enforces all authentication and
   authorization**.
6. Avatars are fetched with the bearer token as a blob (the image endpoint is protected), so `<img src>`
   never needs a public URL.

## Prerequisites

- **Node.js 20.x (≥ 20.0)** and npm. Tested with Node 20.10.0 and npm 10.2.4.
- The backend running on `http://localhost:8080` (see the backend README).

## Quick start (full system)

```bash
# Terminal 1 — backend
cd "Meeting Planner-back-end"
export JWT_SECRET="$(openssl rand -base64 48)"    # PowerShell: see backend README
./mvnw spring-boot:run                            # Windows: mvnw.cmd spring-boot:run

# Terminal 2 — frontend
cd "Meeting Planner-front-end"
npm install
npm run dev
```

Open **http://localhost:5173**, create an account and start adding meetings.

The Vite dev server proxies `/api/*` to `http://localhost:8080`, so no CORS or URL configuration is needed.
The backend also allows CORS from `http://localhost:5173` in case you call it directly.

## Scripts

| Command              | What it does                                   |
|----------------------|------------------------------------------------|
| `npm run dev`        | Start the dev server on port 5173              |
| `npm test`           | Run all tests once (Vitest)                    |
| `npm run test:watch` | Run tests in watch mode                        |
| `npm run build`      | Production build into `dist/`                  |
| `npm run preview`    | Serve the production build locally             |

## Configuration (optional)

There are no secrets. Copy `.env.example` to `.env.local` only if you need to change these defaults:

| Variable            | Default                  | Purpose                                       |
|---------------------|--------------------------|-----------------------------------------------|
| `VITE_API_BASE_URL` | `/api`                   | Base URL the browser uses for API calls       |
| `VITE_BACKEND_URL`  | `http://localhost:8080`  | Where the dev proxy forwards `/api`           |

## Tests

```bash
npm test
```

| File                          | Covers                                                                    |
|-------------------------------|---------------------------------------------------------------------------|
| `LoginPage.test.jsx`          | Required-field and email validation, 401 message, unreachable backend, successful redirect, expired-session notice |
| `ProtectedRoute.test.jsx`     | Redirect when logged out (remembers target), renders when logged in, loading state |
| `MeetingForm.test.jsx`        | Blank title, missing times, end before or equal to start, participant email and duplicate checks, payload shape, edit pre-fill + server errors |
| `MeetingDetailPage.test.jsx`  | Renders details and participants, organizer vs invitee controls, empty state, add participant, 409 duplicate message, load error |
| `validation.test.js`          | Validation helpers, JWT expiry detection                                  |

Last run: **27 tests in 5 files, all passing**. `npm run build` also succeeds. The full UI flow was also run in a real browser (Microsoft Edge, via Playwright): 20 of 20 steps passed.

## Known limitations

- The token lives in `localStorage`, which is simple for a prototype but readable by any script on the
  page if an XSS bug existed. A production version would use short-lived access tokens plus an
  `HttpOnly` refresh cookie.
- Times are entered in the browser's local time zone and sent as UTC.
- No pagination or search on the meeting list.
- `npm audit` reports advisories in **Vitest 3's** dependencies (`tinypool`, `@vitest/mocker`). They
  affect only the local test runner, not the app bundle. The fix is Vitest 5, which needs Node ≥ 20.19.
  Upgrade Node and run `npm i -D vitest@latest` to clear them.

## Troubleshooting

| Problem                                         | Fix                                                                   |
|-------------------------------------------------|-----------------------------------------------------------------------|
| "Cannot reach the server. Is the backend running?" | Start the backend on port 8080 (or set `VITE_BACKEND_URL`)         |
| `Port 5173 is already in use`                   | Stop the other process. The port is fixed because the backend's CORS setting expects it |
| Logged out unexpectedly                         | Tokens expire after 60 minutes by default. Log in again               |
| `npm install` fails on an engine check          | Use Node 20 or newer                                                  |
