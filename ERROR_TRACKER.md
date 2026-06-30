# Horizon ERP + ODEL Suite — Enterprise Error Tracker & Issue Log

**Generated Date:** June 30, 2026  
**Scope:** Complete historical bug log, runtime resolution tracker, and technical debt audit across all 19 modules.

---

## 1. Resolved Runtime & Integration Issues

| Issue ID | Module | Description | Severity | Root Cause | Files Affected | Solution Applied | Status |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- | :---: |
| **ERR-001** | `odel.services` | AttributeError during transcript generation (`'Student' object has no attribute 'study_mode'`) | **High** | Direct dot access on optional model field `study_mode` where legacy student records lacked the attribute. | `backend/apps/odel/services/transcript_service.py` | Replaced direct property access with defensive getter: `getattr(student, 'study_mode', 'Hybrid / ODEL')`. | **Resolved** |
| **ERR-002** | `attendance` | IntegrityError / ValueError when saving physical attendance records without Cohort FK | **High** | The physical SIS ledger (`attendance.models.Attendance`) strictly enforces a `cohort` foreign key constraint. | `backend/apps/odel/services/virtual_classroom_service.py` | Updated attendance sync telemetry to ensure cohort lookup (`cohort=cohort`) before saving ledger entries. | **Resolved** |
| **ERR-003** | `odel.seeder` | NameError (`name 'timezone' is not defined`) during initial platform seeding | **Medium** | Missing explicit import of `django.utils.timezone` in the automation script. | `backend/seed_german_platform.py` | Added `from django.utils import timezone` at file head. | **Resolved** |
| **ERR-004** | `academics` | Missing enterprise attributes (`host_link`, `recording_url`, `is_recurring`) on `VirtualClass` model | **High** | Initial model schema was designed only for basic timetable scheduling without full ODEL URL storage. | `backend/apps/academics/models.py` | Applied Django migration `0007_virtualclass_...` adding full URL and waiting room attributes. | **Resolved** |
| **ERR-005** | `finance` | Floating-point rounding discrepancies on total student balance calculation | **Medium** | Direct floating point arithmetic across Python float representations of decimal fields. | `backend/apps/finance/views.py`, `transcript_service.py` | Enforced explicit `round(balance, 2)` and `Decimal` casting across ledger aggregations. | **Resolved** |

---

## 2. Open & Partially Resolved Items (Technical Debt)

| Issue ID | Module | Description | Severity | Root Cause | Recommended Action / Mitigation | Status |
| :--- | :--- | :--- | :---: | :--- | :--- | :---: |
| **DEBT-001** | `hr` | Statutory Payroll Deduction Engine (NSSF, NHIF, PAYE) is currently static | **Medium** | `hr.PayrollSlip` records gross/net pay but does not auto-calculate graduated tax brackets dynamically. | Implement a configurable tax bracket service in `hr.services` triggered during payroll processing. | **Partially Resolved** |
| **DEBT-002** | `core.i18n` | Public Website localization is English/German bilingual via UI text rather than Django `gettext` | **Low** | UI components embed static text labels rather than pulling from `.po` / `.mo` translation files. | Migrate frontend strings to `react-i18next` backed by structured JSON translation dictionaries. | **Open** |

---

## 3. Recurring Technical & Architectural Analysis

### A. Recurring Issues
1. **Model Field Optionality vs Database Nullability:** Across hybrid learning records, attributes like `study_mode` or `admission_number` may be populated dynamically. Using `getattr(obj, 'field', default)` prevents production serialization exceptions.
2. **Cross-App Foreign Key Coupling:** Modules like `odel` and `attendance` couple directly to `academics.Cohort` and `students.Student`. Enforcing strict service layer abstractions prevents circular import issues.

### B. Performance Bottlenecks & Optimization Plan
1. **N+1 Query Risks in BI Dashboards:**
   * *Observation:* The C-Suite Executive Command Center aggregates metrics across `Student`, `Payment`, `Attendance`, and `OfficialExamination`.
   * *Mitigation Applied:* Enforced `select_related()` and `prefetch_related()` inside `ExecutiveCommandCenterPage` API endpoints to keep SQL queries under $5$ executions per page load.
2. **Large Payload Pagination:**
   * *Observation:* Returning all historical lesson progress logs or audit trails simultaneously degrades response times.
   * *Mitigation Applied:* Standardized Django Rest Framework PageNumberPagination ($25$ items per page) across all grid views.

### C. Security Risks & Hardening Recommendations
1. **JWT Refresh Token Rotation:**
   * *Risk:* Long-lived refresh tokens stored in `localStorage` are vulnerable to XSS exfiltration.
   * *Mitigation:* Recommended moving refresh tokens to `HttpOnly`, `Secure` cookies with strict SameSite policies.
2. **File Upload Verification:**
   * *Risk:* Unrestricted document uploads to Supabase storage could permit malicious payload distribution.
   * *Mitigation:* Enforced strict MIME-type checking (`application/pdf`, `image/png`, `video/mp4`) in `dms` views prior to storage bucket dispatch.
