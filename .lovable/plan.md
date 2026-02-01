
Goal
- Add a real “homepage” at `/` (no sidebar), and make the app automatically redirect to `/dashboard` when the user is already signed in.

What’s happening now (why you can’t “go home”)
- Your router does not currently define a public homepage route (`/`).
- Everything except the login routes is under `path="/*"` and wrapped by `AuthGuard`, and the “index” route redirects to `dashboard`.
- So “home” effectively equals “dashboard”, and there’s no separate landing page to redirect to.

Proposed UX (based on your answers)
- Homepage URL: `/`
- If logged in and visit `/`: automatically redirect to `/dashboard`
- Homepage should be clean/public: no sidebar/layout

Implementation plan (frontend)
1) Create a public homepage component
   - Add a new component (e.g. `frontend/src/pages/HomePage.tsx` or `frontend/src/components/home/HomePage.tsx`)
   - UI content (simple + fast):
     - App title + short description
     - Primary button: “Sign in” → navigates to `/login`
     - Optional secondary: “Learn more” / “Contact” (can be added later)

2) Add a “home route” outside AuthGuard
   - Update `frontend/src/App.tsx` routing:
     - Add a new `<Route path="/" element={<HomeRoute />} />` before the protected `path="/*"` route.
   - `HomeRoute` behavior:
     - Reads auth state from `useAuth()` (already available via `AuthProvider`)
     - If `loading`: render a minimal blank/neutral state (no full-screen spinner)
     - If authenticated: `<Navigate to="/dashboard" replace />`
     - Else: render `<HomePage />`

3) Ensure `/login` stays accessible and old login URLs don’t break
   - Keep only a single login entry point:
     - `/login` → `UnifiedLoginPage`
   - Add a compatibility redirect:
     - `/login/*` → redirect to `/login`
   - This prevents “extra login pages” from being reachable and ensures any old bookmarks still work.

4) Fix AuthGuard redirect state (so users return to where they came from)
   - Update `frontend/src/components/auth/SimpleAuthGuard.tsx` so that when redirecting to `/login`, it passes the attempted route in navigation state:
     - `navigate('/login', { replace: true, state: { from: location } })`
   - Update `UnifiedLoginPage` (if not already) to:
     - If already authenticated (like after refresh): immediately redirect to `state.from` (or `/dashboard` as fallback)

5) Quick verification checklist (manual)
   - Logged out:
     - Visit `/` → see homepage (no sidebar)
     - Click “Sign in” → `/login`
     - Log in → goes to `/dashboard`
   - Logged in:
     - Visit `/` → immediately redirects to `/dashboard`
     - Refresh on `/login` while logged in → immediately goes to `/dashboard` (or back to previous route if present)

Files that will likely be touched
- frontend/src/App.tsx (add `/` route; add `/login/*` redirect; keep protected area unchanged)
- frontend/src/components/auth/SimpleAuthGuard.tsx (store “from” location when redirecting)
- frontend/src/components/auth/UnifiedLoginPage.tsx (auto-redirect if already logged in; honor `state.from`)
- New file: a homepage component (`HomePage.tsx`) with clean public UI

Notes / edge cases handled
- No sidebar on `/` because it is rendered outside `MainLayout`.
- Authenticated users will never “get stuck” on the homepage; they’ll be sent straight to the dashboard.
- Backward compatibility: any old `/login/employee`, `/login/admin`, etc. bookmarks will still land on `/login`.

If you approve, I’ll implement the homepage route + redirect behavior and clean up login routing so `/` becomes the true homepage.