# AGENTS.md

## Scope

- This repository is frontend-only (`loopy-frontend`) on React/TypeScript/Vite.
- No backend source files were found in this repo (`src/` + config files only).

## Tech Stack (from `package.json`)

- React 19 (latest).
- TypeScript (ES2022 target, strict mode).
- Vite 8.x (build tool).
- React Router DOM v7 (latest) (client-side routing).
- Vitest + @testing-library/react + jsdom (testing).
- ESLint with typescript-eslint, react-hooks, react-refresh plugins.
- Prettier (code formatting).
- Styling: CSS Modules (`.module.css`) + global CSS with CSS custom properties.
- HTTP client: native `fetch` with a custom wrapper (`apiClient`).
- State management: React Context (no Redux, no Zustand).
- Package manager: npm.

## Project Structure

- `src/main.tsx` — application entry point, `createRoot` + global CSS imports + `<App />`.
- `src/app/App.tsx` — composition root: `BrowserRouter` + `AuthProvider` + `AppRouter`.
- `src/app/AppRouter.tsx` — route definitions (`<Routes>`, guards, pages).
- `src/app/paths.ts` — route path constants (dashboard, decks, cards, study sessions, statistics, profile).
- `src/api/apiClient.ts` — generic `fetch` wrapper with JWT auth, error parsing, base URL from env.
- `src/api/apiError.ts` — typed `ApiError` class (`code`, `message`, `status`, `isNetworkError`).
- `src/api/authApi.ts` — auth endpoints: `login`, `register`, `currentUser`.
- `src/services/tokenStorage.ts` — `localStorage` JWT token management (`loopy.access-token` key).
- `src/types/auth.ts` — `LoginRequest`, `RegisterRequest`, `AuthResponse`.
- `src/types/backendError.ts` — `BackendErrorResponse`.
- `src/types/user.ts` — `UserProfileResponse`, `CurrentUserResponse`.
- `src/types/dashboard.ts` — `DashboardResponse`, `StudyAvailability`, `TodayStudy`, `CardStateDistribution`, `ActiveStudySession`, `RecentStudySession`, `Streak`, `ActivityDay`.
- `src/context/AuthContext/` — auth state machine (unknown/authenticated/unauthenticated), provider, hook, types, tests.
- `src/components/ui/` — reusable UI primitives (Button, Input, Select, Textarea, Card, Badge, ProgressBar, Spinner, Skeleton, EmptyState, ErrorState, IconButton).
- `src/components/dashboard/` — dashboard-specific feature components (MetricCard, ActivityChart, StreakCard, DailyLimitProgress, ActiveSessionCard, RecentSessionItem).
- `src/components/layout/` — layout shell components (AppShell, AppSidebar, SidebarItem, AuthLayout, PageHeader).
- `src/components/routing/` — route guards (ProtectedRoute, PublicOnlyRoute, RouteLoader, routing tests).
- `src/pages/DashboardPage/` — dashboard with viewState pattern (loading/error/empty/active/normal).
- `src/pages/LoginPage/` — email/password login form.
- `src/pages/RegisterPage/` — name/email/password registration form.
- `src/pages/NotFoundPage/` — 404 page.
- `src/mocks/dashboardMock.ts` — mock data for dashboard development/testing.
- `src/styles/reset.css` — minimal CSS reset.
- `src/styles/tokens.css` — design tokens as CSS custom properties on `:root` (dark theme colors, spacing, radii, typography, layout).
- `src/styles/global.css` — body styles, focus-visible, `.srOnly`, `.page`, `.grid` utility classes.
- `src/test/setup.ts` — Vitest setup (`@testing-library/jest-dom/vitest`).

## Architectural Patterns

### Component Pattern: Banana-in-a-Box

Every component follows this structure:

```
ComponentName/
├── ComponentName.tsx          # Implementation
├── ComponentName.module.css   # Scoped styles (if styled)
├── ComponentName.test.tsx     # Co-located tests (if present)
└── index.ts                   # Barrel re-export
```

- The `index.ts` simply does: `export { ComponentName } from './ComponentName';`
- Import paths always reference the directory: `import { Button } from '../../ui/Button';`
- Components are plain function declarations, NOT `React.FC`.
- All exports are **named exports** (no `export default`).

### Routing

```
BrowserRouter (App.tsx)
  AuthProvider
    Routes
      PublicOnlyRoute
        /login    → LoginPage
        /register → RegisterPage
      ProtectedRoute
        AppShell (sidebar + content)
          /dashboard → DashboardPage
      * → NotFoundPage
```

- Route paths defined in `paths.ts` as a readonly const object.
- Future routes (decks, cards, study sessions, statistics, profile) are declared in `paths.ts` but not yet wired in the router. Sidebar renders them as `disabled` items.

### Auth Flow

1. On mount, `AuthProvider.restoreSession()` checks `localStorage` for a JWT token.
2. If no token → `unauthenticated` immediately.
3. If token → calls `GET /users/me` to validate.
4. On 401 (invalid/expired token) → clears token, sets `unauthenticated`.
5. On success → sets `user`, sets `authenticated`.
6. `login()` / `register()` → call API, store JWT, fetch current user, set `authenticated`.
7. `logout()` → clears token and state, sets `unauthenticated`.
8. Route guards (`ProtectedRoute`, `PublicOnlyRoute`) branch on `status`:
   - `'unknown'` → `<RouteLoader />` (full-page spinner)
   - `'authenticated'` → render children / redirect to dashboard
   - `'unauthenticated'` → redirect to login

### API Layer (Three-Layer)

```
Pages/Components → authApi.login/register() → apiClient<T>() → fetch()
                                                                    ↕
                                                              tokenStorage.getToken()
                                                                    ↕
                                                              ApiError (throws)
```

### Styling (Three-Layer CSS)

1. `reset.css` — minimal box-sizing, margin reset.
2. `tokens.css` — CSS custom properties: dark theme colors, spacing scale (4px steps), radii, typography, layout constants.
3. `global.css` — `.page`, `.grid`, `.srOnly`, focus-visible, body background.
4. CSS Modules — per-component scoped styles via `ComponentName.module.css`.

- **Dark theme ONLY** — no light theme tokens defined.
- UI text is in **Russian** (e.g., "Войти", "Главная", "Пароль", "Загрузка").
- Inline styles used sparingly for dynamic values (chart bar heights, margin adjustments).

### Dashboard ViewState Pattern

`DashboardPage` accepts a `viewState` prop for testability:
- `'loading'` → full-page `Skeleton`
- `'error'` → `ErrorState` with retry
- `'empty'` → `EmptyState` ("Пока нет занятий")
- `'active'` → full dashboard with active session card
- `'normal'` → full dashboard without active session

### Accessibility

Components use proper ARIA attributes:
- `role="progressbar"`, `aria-valuenow`, `aria-valuemax` (ProgressBar)
- `role="status"` (Spinner, EmptyState)
- `role="alert"` (ErrorState)
- `aria-invalid`, `aria-describedby` (Input, Select, Textarea)
- `aria-busy` (Button in loading state)
- `aria-label` (Spinner, IconButton)
- `.srOnly` utility class for screen-reader-only text

### Naming Conventions

- **Components**: PascalCase (e.g., `DashboardPage`, `MetricCard`).
- **Files**: match component name (`DashboardPage.tsx`, `MetricCard.tsx`).
- **CSS Modules**: `ComponentName.module.css`.
- **Directories**: component name inside category folder (`components/ui/Button/`).
- **Hooks**: `useXxx` format (`useAuth`).
- **Types/interfaces**: PascalCase (`LoginRequest`, `StudyAvailability`, `AuthStatus`).
- **API modules**: object literal with methods (`authApi.login()`, `authApi.register()`).
- **Environment variables**: `VITE_` prefix (`VITE_API_BASE_URL`).
- **Local storage key**: `loopy.access-token`.
- **Exports**: named exports only; barrel re-exports via `index.ts`.

## Commands

- Dev server: `npm run dev`
- Build: `npm run build` (runs `tsc -b && vite build`)
- Lint: `npm run lint` (ESLint)
- Test: `npm test` (Vitest)
- Format: `npx prettier --write src/**/*.{ts,tsx,css}`

## High-Risk Areas (Do Not Break)

- **Auth state machine**: the `'unknown' | 'authenticated' | 'unauthenticated'` tri-state is relied upon by all route guards. Changing this breaks page-level access control.
- **JWT storage key** (`loopy.access-token`): changing this silently logs out all users.
- **API error contract**: all code catches `ApiError` and checks `error.code` for specific error types (`NETWORK_ERROR`, `UNAUTHORIZED`, etc.).
- **Route paths in `paths.ts`**: frontend routes must match sidebar navigation and any future links.
- **CSS custom property names**: components reference token names like `--color-primary` directly. Renaming tokens breaks visual design.
- **`AppShell` layout**: the sidebar width (`--sidebar-width: 232px`) and fixed positioning are critical to all authenticated page layouts.

## Anti-Patterns to Avoid

- **Do NOT use `export default`** — the project uses named exports everywhere. All components and modules use named exports with barrel re-exports.
- **Do NOT use `React.FC`** — components are plain functions with explicit prop types.
- **Do NOT introduce state management libraries** (Redux, Zustand, MobX) — the project uses React Context.
- **Do NOT introduce UI component libraries** (MUI, Radix, shadcn, Ant Design) — all UI components are custom-built.
- **Do NOT change auth flow** — JWT in localStorage, `Authorization: Bearer` header, and the tri-state auth machine are the established pattern.
- **Do NOT hardcode API URLs** — use `import.meta.env.VITE_API_BASE_URL` with fallback `http://localhost:8080/api`.
- **Do NOT add server dependencies** (Express, Fastify, etc.) — this is a frontend-only, Vite SPA.
- **Do NOT create light theme** — the app is dark theme only at this stage.
- **Do NOT bypass `apiClient`** — all HTTP requests must go through the wrapper for consistent auth header attachment and error handling.
- **Do NOT change the component directory structure** — every component must follow banana-in-a-box (its own folder with co-located `.tsx` + `.module.css` + `index.ts`).
- **Do NOT add new routes without adding them to `paths.ts`** first.
- **Do NOT write files in minified/single-line format** — the project now uses Prettier for consistent multi-line formatting. Run Prettier before committing.
- **Do NOT use `console.log` in production code** — use structured error handling via `ApiError` and component-level error states.
- **Do NOT omit ARIA attributes** — all interactive UI components must follow the established accessibility patterns.
- **Do NOT use `any` type** — TypeScript is in strict mode.

## Testing Notes

- **Framework**: Vitest with globals enabled (no need to import `describe`, `it`, `expect`, `vi`).
- **Environment**: `jsdom` (configured in `vite.config.ts`).
- **Setup**: `src/test/setup.ts` imports `@testing-library/jest-dom/vitest`.
- **Test locations**: co-located with components (`Button.test.tsx`, `DashboardPage.test.tsx`, `AuthProvider.test.tsx`, `routing.test.tsx`).
- **Mocking**: use `vi.stubGlobal('fetch', ...)` for API mocking.
- **Routing tests**: wrap with `MemoryRouter` from react-router-dom.
- **Dashboard tests**: use `viewState` prop injection to test all states without real API calls.
