---
name: React Router DOM Migration
description: Full migration from TanStack Router/Start SSR to React Router DOM SPA; key decisions and file map.
---

# React Router DOM Migration

**Why:** TanStack Router/Start required SSR+Nitro infra. Project needed a plain Vite+React+TS SPA.

## Key conventions
- Pages live in `src/pages/` (default exports) — NOT in `src/routes/`
- Route tree: `src/routes/AppRoutes.tsx` (uses `<Routes>/<Route>`)
- Guards: `src/routes/guards.tsx` (ProtectedRoute, RoleProtectedRoute)
- Layout: `src/layouts/dashboard-layout.tsx` renders `<Outlet />` for `/app/*` nested routes
- Nav config: `src/layouts/nav-config.ts` (NAV per role)
- Role labels/access: `src/routes/route-config.ts`
- App-shell backward-compat: `src/components/app-shell.tsx` exports `useCurrentUser` + `RoleGate` (react-router-dom)

## Service layer
- `src/services/service-utils.ts` — `USE_FIXTURES=true`, `fixtureDelay()`
- `src/services/fixtures.ts` — re-exports from sample-data + adds PAYMENTS, REVENUE_TREND, TERM_PERFORMANCE, UPCOMING_EXAMS, ACADEMIC_YEARS
- `src/types.ts` — all domain types (Role, AuthUser, Student, Receipt, Payment, PaymentMethod, FeeStructure, SubjectResult, TermPerformance, UpcomingExam, Allocation)

## Vite config
- Port 5000 (required for Replit webview), `allowedHosts: true`, @vitejs/plugin-react + @tailwindcss/vite + vite-tsconfig-paths

**How to apply:** When adding new pages, create in `src/pages/` as default export, add `<Route>` in AppRoutes.tsx with RoleProtectedRoute if role-restricted.
