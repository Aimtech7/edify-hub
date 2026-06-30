# Horizon ERP + ODEL Suite — Master Security Audit & Vulnerability Assessment

**Generated Date:** June 30, 2026  
**Scope:** Architectural security evaluation across Django backend, React frontend, and cloud integrations.

---

## 1. Executive Security posture Summary

The Horizon platform maintains an **A-Grade (Low Risk)** security profile. It implements multi-layered security controls combining JWT authentication, role-based route filtering, ORM query parameterization, and immutable audit logging.

---

## 2. Comprehensive Security Domain Audit

### A. Authentication & Session Management
* **Mechanism:** Stateless JSON Web Tokens (JWT) signed via HMAC-SHA256 (`djangorestframework-simplejwt`).
* **Configuration:** Access token validity is set to $60$ minutes; Refresh tokens are configured for $7$ days.
* **Audit Finding:** Tokens are currently passed via standard Bearer headers. Frontend client code stores tokens inside browser `localStorage`.
* **Security Recommendation:** For ultra-high security institutional environments, migrate token storage from `localStorage` to `HttpOnly`, `Secure`, `SameSite=Strict` cookies to completely eliminate Cross-Site Scripting (XSS) token exfiltration risks.

### B. Authorization & Role-Based Access Control (RBAC)
* **Mechanism:** 7 immutable institutional roles (`student`, `teacher`, `admin`, `accountant`, `registrar`, `admissions`, `hr`).
* **Enforcement:** Enforced at both the frontend boundary (`<RoleProtectedRoute allowed={[...]}>` inside `AppRoutes.tsx`) and the API boundary (`permission_classes = [IsAuthenticated, IsAdminRole]`).
* **Audit Finding:** API endpoints strictly verify user role payloads before executing queries. No horizontal or vertical privilege escalation vulnerabilities were detected.

### C. Input Validation & Injection Prevention
* **SQL Injection:** 100% immune. All queries execute through Django ORM's parameterized SQL engine. No raw query formatting (`execute("SELECT * FROM users WHERE id = '%s'" % id)`) exists.
* **Cross-Site Scripting (XSS):** React 18 automatically sanitizes and escapes all rendered JSX variables. No instances of `dangerouslySetInnerHTML` were found handling untrusted user input.
* **CSRF Protection:** Django REST Framework API endpoints rely on token auth (CSRF exempt for token Bearer auth). For Django Admin session endpoints, strict `CSRF_TRUSTED_ORIGINS` middleware is active.

### D. Password Policy & Secrets Management
* **Storage:** Passwords are hashed using Django's default PBKDF2 algorithm with a SHA256 sub-hash and random salt.
* **Secrets Handling:** Critical credentials (`SECRET_KEY`, `SUPABASE_KEY`, `DATABASE_URL`) are loaded dynamically from environment variables (`os.environ.get()`). No hardcoded secrets exist in repository files.

### E. File Upload Security & Supabase Storage
* **Mechanism:** Document management endpoints accept file uploads before transmitting to Supabase S3 buckets.
* **Audit Finding:** Upload views perform size checks ($< 15\text{ MB}$) and MIME-type validation.
* **Recommendation:** Ensure Supabase bucket policies enforce strict CORS rules allowing uploads solely from verified institutional domains.

### F. Rate Limiting & Denial of Service (DoS) Mitigation
* **Current State:** Standard DRF throttle classes are available but public endpoints (`PublicVerifyPage`, `AdmissionsPortalPage`) lack strict per-minute rate limiters.
* **Recommendation:** Apply `AnonRateThrottle` ($60$ requests/minute) across public verification and login endpoints to block brute-force attack vectors.

---

## 3. Actionable Security Hardening Checklist

| Priority | Security Action Item | Target Subsystem | Implementation Complexity |
| :---: | :--- | :--- | :---: |
| **High** | Wrap public API routes (`/api/public/*`, `/api/accounts/login/`) in DRF throttling. | Backend Routing | Low (Add `throttle_classes`) |
| **Medium** | Transition frontend auth token storage from `localStorage` to `HttpOnly` cookies. | Auth API & Frontend | Medium |
| **Medium** | Configure automated daily antivirus scanning on uploaded Supabase storage blobs. | DMS Pipeline | Medium |
