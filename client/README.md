# Zym Fitness Client

React 19, Vite, JavaScript, Tailwind CSS 4, React Router, Redux Toolkit, and RTK Query frontend for the existing gym-management API.

## Run locally

Requirements: Node.js 20.19+ and the backend running locally. The Express backend defaults to `http://localhost:4000`.

```powershell
cd client
npm install
Copy-Item .env.example .env
npm run dev
```

Set `VITE_API_BASE_URL` in `.env` to the backend API origin, including `/api/v1`, for example `http://localhost:4000/api/v1`. Configure the backend `FRONTEND_ORIGINS` to include the exact client origin printed by Vite. The browser must be able to reach the backend directly. Keep Cloudinary, SMTP, WhatsApp, JWT, and database credentials in the server environment only.

```powershell
npm run lint
npm run build
npm run preview
```

## App structure

- `src/app/store.js` configures Redux and RTK Query middleware.
- `src/features/api/apiSlice.js` defines the shared base URL, cookie credentials, CSRF header, and cache tags.
- `src/features/auth/authSlice.js` stores the current user's non-secret identity and role only. Passwords, OTPs, and tokens are never put in Redux or local storage.
- `src/features/auth/authApi.js` handles authentication and synchronizes the session identity.
- `src/features/api/gymApi.js` injects gym endpoints into the shared RTK Query API. RTK Query owns server data, loading/error states, and mutation invalidation.
- `src/components/routing/RouteGuards.jsx` checks the backend session before rendering member/admin routes. The backend remains the authority for every permission.
- `src/pages` groups public, auth, member, and admin screens. Shared UI and layouts live under `src/components`.

The backend uses an HttpOnly `accessToken` cookie and a readable `csrfToken` cookie. RTK Query includes cookies and sends `X-CSRF-Token` for state-changing requests. Login/session state is initialized from `GET /auth/me` on app load.

Socket.IO pushes cache-invalidation events after successful changes. The server authenticates socket handshakes with the same HttpOnly access cookie and current database token version as REST requests; member events go only to the affected member, operations events go to admins, and only plan/trainer catalog invalidations go to anonymous public clients. Events contain tag names only, never private record data. RTK Query refetches its active query for the invalidated tag. On reconnect, the client refetches the signed-in role's relevant data. Admin lists also poll every 7 seconds while open as a recovery fallback, pausing when the tab is unfocused.

## Workflows

New accounts verify email once with an OTP; successful verification sets the session cookies and signs the member in automatically. Password recovery verifies an OTP and uses the backend's short-lived reset cookie. Membership requests remain pending until the gym records offline payment. Admin payment creation records and confirms payment in one backend operation. Refunds are admin-only. The member profile form supports multipart image uploads using `image`; Cloudinary must be configured on the server.

Known backend constraints and exact endpoint mappings are documented in [docs/API_MAPPING.md](docs/API_MAPPING.md). Manual workflow and responsive checks are listed in [docs/TESTING_CHECKLIST.md](docs/TESTING_CHECKLIST.md).
