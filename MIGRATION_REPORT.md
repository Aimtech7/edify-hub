# ERP Migration & Refactoring Report
**Horizon Deutsch Training Institute LMS & Finance ERP**

This report details the work completed to transition the Horizon LMS frontend into a production-ready system aligned to German language teaching (CEFR levels) with role-based routing and a robust API service architecture.

---

## 1. Project Structure Report

The frontend codebase is organized following standard modular structure patterns for React & Vite:

```
src/
 ├── components/
 │    ├── ui/                  # shadcn/ui components (tabs, tables, select, dialog, etc.)
 │    ├── shared/              # Reusable data tables, page headers, stat cards
 │    ├── app-shell.tsx        # Secondary layout shell (student/teacher/admin sidebars)
 │    └── ui-bits.tsx          # ERP statistics card & basic header layout
 ├── contexts/
 │    ├── auth-context.tsx     # Handles user state, login callbacks, and localStorage persistence
 │    └── theme-context.tsx    # Handles dark/light color mode preferences
 ├── layouts/
 │    ├── auth-layout.tsx      # Authentication wrapper layout
 │    ├── dashboard-layout.tsx # Standard layout shell containing sidebar and breadcrumbs
 │    └── nav-config.ts        # Primary navigation links mapping roles to pages
 ├── lib/
 │    ├── auth.ts              # Authentication helpers and presets
 │    ├── sample-data.ts       # Central local database mock fixtures
 │    ├── theme.ts             # Theme helpers
 │    └── utils.ts             # Tailwind class merges and formatting utils
 ├── pages/
 │    ├── app/                 # Main ERP dashboard modules
 │    │    ├── AcademicPage.tsx     # Academic setup (co-horts, CEFR info, skills)
 │    │    ├── AllocationsPage.tsx  # Invoices / Receipts allocation configuration
 │    │    ├── AttendancePage.tsx   # Roll-call logs (staff) & Summary widget (student)
 │    │    ├── AuditLogsPage.tsx    # ERP system action auditing logs
 │    │    ├── CertificatesPage.tsx # CEFR achievement generation and verification
 │    │    ├── DashboardPage.tsx    # Multi-role dashboard (students, teachers, admins, finance)
 │    │    ├── FeeStructurePage.tsx # Course fee schedule configuration
 │    │    ├── FinancePage.tsx      # Personal fee statements (student view)
 │    │    ├── FinanceReportsPage.tsx# System revenue & collections breakdown
 │    │    ├── LevelsPage.tsx       # CEFR level groups and student promotions
 │    │    ├── MarksPage.tsx        # Teachers scoring and remark logs
 │    │    ├── PaymentsPage.tsx     # ERP collections list and search queries
 │    │    ├── ProfilePage.tsx      # User profile configurations
 │    │    ├── ReceiptsPage.tsx     # System receipts listing & printing modal
 │    │    ├── ReportsPage.tsx      # Student performance summaries
 │    │    ├── RolesPage.tsx        # Access rights logs
 │    │    ├── SettingsPage.tsx     # Global configurations
 │    │    ├── StudentsPage.tsx     # Learners roster
 │    │    └── UsersPage.tsx        # Active user credentials log
 │    └── auth/                # Login, forgot password, and credential reset views
 ├── routes/
 │    ├── AppRoutes.tsx        # Primary Route mapping with Protected & Role gates
 │    ├── guards.tsx           # Authentication session and access validation
 │    └── route-config.ts      # Portal role label naming configurations
 ├── services/
 │    ├── api-client.ts        # Axios base setup, JWT headers, auto 401 refresh interceptor
 │    ├── auth-service.ts      # Authentication operations (JWT persistence)
 │    ├── student-service.ts   # Students CRUD APIs
 │    ├── teacher-service.ts   # Classes and attendance logs APIs
 │    ├── payment-service.ts   # Record payments APIs
 │    ├── allocation-service.ts# Split transactions APIs
 │    ├── receipt-service.ts   # PDF / printed receipts APIs
 │    ├── result-service.ts    # Student results APIs
 │    └── certificate-service.ts# Verify CEFR level certificates APIs
 ├── types.ts                  # Shared TypeScript interfaces
 ├── main.tsx                  # App entry point
 └── styles.css                # Tailwind CSS v4 variables and custom utilities
```

---

## 2. Migration Report

### TanStack Clean Up
- Deleted all configurations, imports, and variables referring to `@tanstack/react-router`, `@tanstack/react-start`, `@tanstack/react-query`, and `@tanstack/router-plugin`.
- Cleaned up the eslint configuration rules in `eslint.config.js` to ensure the project has no remaining references to TanStack structures.

### CEFR Language School Transition
- Removed all remnants of K-12 schooling structures (Grade 1-12, Form 1-4, Class 1-8).
- Remapped the entire academic module around **CEFR language levels** (Beginner: A1, A2; Intermediate: B1, B2; Advanced: C1, C2).
- Refined the Academic Setup page to showcase Cohorts/Batches, CEFR level metadata (description, duration in weeks), and core skill evaluated parameters (Listening, Reading, Writing, Speaking, Grammar, Vocabulary).

### Role-Based Access Controls
- Enforced route protection gates:
  - **Accountants**: Full control over Payments, Allocations, and Receipts (Finance ERP).
  - **Teachers**: Locked out of all financial directories. Access restricted to Students, Attendance, Results, Marks, and Reports.
  - **Students**: Locked out of other learners' files. Permitted access to Dashboard, Progress levels, Results, Personal attendance log, and Fee Statements.
- Added role-based filters to navigation sidebars ensuring restricted endpoints are completely hidden from unauthorized roles.

### ERP Payment & Receipt Workflows
- **Payments:** Developed advanced search functionality allowing filtering by Admission Number, Student Name, Payer Name, Phone Number, National ID, Receipt Number, M-Pesa Reference, Cheque Number, and Date Range.
- **Receipts:** Re-engineered the printable receipt layouts to show receipt serials, student names, admission codes, payer names, dates, allocation breakdowns, total module fees, total paid historical sums, current payment details, and outstanding balances.

---

## 3. API Integration Report

The frontend has been prepared to seamlessly integrate with a **Django REST Framework** backend via **Axios**:

### JWT Lifecycle Handling
- Upon login (`auth-service.ts`), `access` and `refresh` tokens received from the backend `/auth/login/` endpoint are stored securely in `localStorage`.
- All outgoing API calls automatically append the `Authorization: Bearer <access_token>` header via request interceptors.
- On logout, both tokens and user states are wiped from storage.

### Automated Token Refresh Interceptor
An Axios response interceptor intercepts any `401 Unauthorized` responses and performs the following flow:
1. Temporarily pauses incoming requests.
2. Checks for a local `refresh` token.
3. Sends a POST request to `/api/auth/token/refresh/` submitting the refresh token.
4. Updates local storage with the new `access` token.
5. Re-executes the originally paused API call with the updated credentials.
6. If the refresh token has expired, clears all credentials and redirects the user to the student portal login page with a `session_expired` query parameter.

---

## 4. Remaining Tasks Report

All refactoring milestones have been completed. The following tasks should be performed once the Django backend goes live:

1. **Service Toggle:** Switch `USE_FIXTURES = false` inside `src/services/service-utils.ts` to disable mock datasets and enable network fetch.
2. **CORS Configuration:** Configure CORS headers on the Django REST Framework endpoints to authorize requests originating from the Vite port (default: `5000`).
3. **Database Population:** Ensure the PostgreSQL database is populated with corresponding CEFR fee models (`A1` to `C2` tuition records) to match the dashboard statistics.
