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
- Protected routes: unauthenticated users are redirected to `/login`; every login lands on the dashboard
- Dashboard with summary tiles (completed, upcoming, invited to, last 30 days), a meetings-per-month chart
  (organized vs invited, last 6 months, with hover details and a table view), and the next and most recently
  completed meetings. Figures come from `GET /api/meetings/stats` (bucketed in the user's time zone); the two
  short lists are the first page of the upcoming and completed tabs.
- Admin-style layout: collapsible sidebar with all sections (remembered per browser), slide-out drawer on
  phones, top bar with breadcrumbs and an account menu
- Meetings page with filter tabs (All, Upcoming, Completed, Organized by me, Invited), search and
  pagination, all done by the API (`GET /api/meetings?q=&filter=&page=&size=`). Search is sent after a short
  pause in typing, tab badges use the server's per-tab counts, and the tab, search, page and page size live in
  the URL, so dashboard tiles link straight to a filtered list
- Create meeting, optionally adding participants in the same form (saved in a single request)
- Edit meeting details (organizer only)
- Completed meetings are read-only: once a meeting has ended, Edit and the participant controls disappear,
  the edit page shows a locked notice, and the page locks itself if the meeting ends while it is open. The
  backend enforces the same rule (`409`), so this is not UI-only. The organizer can still delete it
- Meeting details page: add and remove participants, delete the meeting (organizer only; read-only for
  invitees)
- Profile page with avatar upload (type and size checked before upload)
- Logout, plus automatic logout when the JWT expires or the API returns `401`
- Loading, empty, success and error states throughout; responsive layout down to phone width

## Technology stack

| Concern     | Choice                                                         |
|-------------|----------------------------------------------------------------|
| UI          | React 19, Tailwind CSS 4 (via `@tailwindcss/vite`), inline SVG icons |
| Routing     | React Router 7 (`react-router-dom`)                            |
| HTTP        | Axios (shared instance with auth and 401 interceptors)         |
| Build/dev   | Vite 6                                                         |
| Tests       | Vitest 3, React Testing Library, user-event, jsdom             |

## Folder structure

```
src/
├── main.jsx, App.jsx        entry point and route table
├── styles.css               Tailwind entry: theme tokens plus shared primitives (btn, card, badge, field, alert, chart)
├── api/                     client.js (Axios instance + interceptors), auth.js, users.js, meetings.js, errors.js
├── auth/                    AuthContext.jsx (session state), ProtectedRoute.jsx, tokenStorage.js
├── components/              Layout (sidebar + top bar), AuthLayout, MeetingForm + MeetingSummary, DatePicker,
│                            TimePicker, MeetingCard, MonthlyMeetingsChart, Pagination, ParticipantList,
│                            AddParticipantForm, Avatar, FormField, Alert, ConfirmDialog, BackLink, Icon, Spinner
├── pages/                   Login, Signup, Dashboard, Meetings, NewMeeting, EditMeeting, MeetingDetail, Profile, NotFound
├── utils/                   validation.js (rules and LIMITS mirroring the backend), dates.js (local ↔ ISO, formatting),
│                            meetings.js (useMeeting loader, completed-meeting lock rules), meetingStats.js (chart
│                            labels), ui.js (page title, focus, flash-message and dismiss hooks)
└── test/                    setup.js, renderWithAuth.jsx (test helper)
```

Tests sit next to the code they cover (`*.test.jsx` / `*.test.js`).

## Routes

| Path                  | Access     | Page                                   |
|-----------------------|------------|----------------------------------------|
| `/login`, `/signup`   | Public     | Auth forms (redirect away if logged in) |
| `/dashboard`          | Protected  | Dashboard (landing page after login)   |
| `/meetings`           | Protected  | Full meeting list                      |
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

Tests sit next to the code they cover. The API is mocked, so the backend doesn't need to be running.

| Area | Files | Covers |
|------|-------|--------|
| Pages | `LoginPage`, `DashboardPage`, `MeetingsPage`, `MeetingDetailPage`, `EditMeetingPage`, `ProfilePage` | Validation and server errors, dashboard stats and chart, server-side search/tabs/paging, organizer vs invitee controls, completed-meeting lock, avatar upload |
| Components | `MeetingForm`, `Pagination`, `ProtectedRoute` | Date/time pickers and duration logic, keyboard calendar, payload shape, page-number window, auth redirect |
| API layer | `errors`, `requestSharing` | User-facing error messages, one network call for overlapping identical requests, avatar cache |
| Helpers | `validation`, `meetings`, `meetingStats` | Validation rules, lock rules, chart month labels, token expiry |

Last run: **74 tests in 15 files, all passing**. `npm run build` also succeeds. Tests build expected
dates and times with the app's own formatters, so they pass in any locale.

## Design decisions

- **The server does the work.** Search, filter tabs and pagination call `GET /api/meetings`, and the
  dashboard uses `GET /api/meetings/stats`, so the browser never downloads every meeting.
- **State in the URL.** The Meetings page keeps tab, search, page and page size in the query string, so
  refreshes, the back button and dashboard links all land on the same view.
- **No global state library.** Auth lives in one React context; each page loads its own data. Identical
  requests that overlap (e.g. React StrictMode in development) share one network call, and the avatar is
  downloaded once per session.
- **Tailwind CSS 4.** Layouts use utility classes in JSX; repeated primitives (buttons, cards, badges,
  fields, alerts, chart) are defined once with `@apply` in `styles.css`. Icons are inline SVG, so there's
  no icon library.
- **Rules mirrored, not trusted.** Client validation and the completed-meeting lock give instant feedback,
  but the backend enforces the same rules; the UI also handles the API's `409` if a meeting ends while a
  page is open.
- **Accessible custom controls.** The date and time pickers, confirm dialog and menus support the keyboard
  (arrows, Enter, Escape) and focus management.

## Assumptions

- Users work in their browser's time zone; times are entered and shown locally and sent to the API as UTC.
- Every login lands on the dashboard (requested behaviour), rather than returning to the page that asked
  for login.
- Completed meetings stay visible as a record but are read-only; organizers can still delete them.
- A new meeting defaults to the next half-hour slot for one hour; times are offered in 15-minute steps.

## Known limitations

- The token lives in `localStorage`, which is simple for a prototype but readable by any script on the
  page if an XSS bug existed. A production version would use short-lived access tokens plus an
  `HttpOnly` refresh cookie.
- The Inter font loads from Google Fonts, so the UI falls back to the system font when offline.
- No profile editing (name, e-mail, password), matching the backend.
- The UI was checked with automated tests and headless-browser screenshots, not end-to-end browser tests.
- `npm audit` reports advisories in **Vitest 3's** dependencies (`tinypool`, `@vitest/mocker`). They
  affect only the local test runner, not the app bundle. The fix is Vitest 5, which needs Node ≥ 20.19.
  Upgrade Node and run `npm i -D vitest@latest` to clear them.

## What I would improve with more time

- End-to-end tests (Playwright) running against the real backend in CI.
- Profile editing, and a refresh-token flow so users aren't logged out after 60 minutes.
- A dark theme, plus saved filters and sorting options on the Meetings page.
- Optimistic updates for adding and removing participants.
- Upgrade to Node 20.19+ and Vitest 5 to clear the dev-only audit advisories.

## Troubleshooting

| Problem                                         | Fix                                                                   |
|-------------------------------------------------|-----------------------------------------------------------------------|
| "Cannot reach the server…"                      | Start the backend on port 8080 (or set `VITE_BACKEND_URL`)            |
| `Port 5173 is already in use`                   | Stop the other process. The port is fixed because the backend's CORS setting expects it |
| Logged out unexpectedly                         | Tokens expire after 60 minutes by default. Log in again               |
| `npm install` fails on an engine check          | Use Node 20 or newer                                                  |
