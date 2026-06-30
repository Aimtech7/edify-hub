# Horizon ERP + ODEL Suite — Master REST API Documentation

**Generated Date:** June 30, 2026  
**Base URL:** `http://localhost:8000/api/` (Development) | `https://api.horizon-erp.com/api/` (Production)

---

## 1. Authentication & Authorization Standard
All protected endpoints require a Bearer token in the request header:
```http
Authorization: Bearer <jwt_access_token>
```
Standard Error Payload on Auth Failure (HTTP `401 Unauthorized` / `403 Forbidden`):
```json
{
  "detail": "Authentication credentials were not provided or role is unauthorized."
}
```

---

## 2. API Endpoint Inventory by Module

### A. Accounts & Authentication (`/api/accounts/`)
* **`POST /api/accounts/login/`**
  * *Auth:* Public
  * *Request Body:* `{"username": "admin", "password": "securepassword"}`
  * *Response (200 OK):* `{"access": "eyJhbG...", "refresh": "eyJhbG...", "user": {"id": 1, "username": "admin", "role": "admin"}}`
* **`POST /api/accounts/token/refresh/`**
  * *Auth:* Public (Requires valid Refresh Token payload)
* **`GET /api/accounts/users/`**
  * *Auth:* Bearer Token (`admin`, `hr`)
  * *Response (200 OK):* Paginated list of system user accounts.

### B. Student Information System (`/api/students/`)
* **`GET /api/students/students/`**
  * *Auth:* Bearer Token (`admin`, `teacher`, `registrar`)
  * *Parameters:* `?level=A1.1&search=Hans`
  * *Response (200 OK):* Paginated list of student profile objects.
* **`POST /api/students/applications/`**
  * *Auth:* Public (Admissions portal lead capture)
  * *Request Body:* `{"applicant_name": "Anna Schmidt", "email": "anna@test.de", "applied_level_code": "A1.1"}`

### C. Academic Management & Attendance (`/api/academics/`, `/api/attendance/`)
* **`GET /api/academics/levels/`**
  * *Auth:* Bearer Token (All authenticated roles)
  * *Response (200 OK):* List of all 11 CEFR German levels (`A1.1` to `C2`).
* **`POST /api/attendance/`**
  * *Auth:* Bearer Token (`teacher`, `admin`)
  * *Request Body:* `{"student": 15, "cohort": 2, "date": "2026-06-30", "status": "Present"}`

### D. Finance ERP (`/api/finance/`)
* **`GET /api/finance/ledgers/?student_id=<id>`**
  * *Auth:* Bearer Token (`accountant`, `admin`, or owning `student`)
  * *Response (200 OK):* Double-entry debit/credit ledger entries and overall student balance.
* **`POST /api/finance/payments/`**
  * *Auth:* Bearer Token (`accountant`, `admin`)
  * *Request Body:* `{"student": 15, "amount": 25000, "payment_method": "MPESA", "reference_number": "QWE123RTY"}`

### E. German ODEL & Virtual Classrooms (`/api/odel/german/`)
* **`GET /api/odel/german/catalog/`**
  * *Auth:* Bearer Token
  * *Response (200 OK):* Structured CEFR levels with module counts and duration weeks.
* **`POST /api/odel/german/schedule-room/`**
  * *Auth:* Bearer Token (`teacher`, `admin`)
  * *Request Body:* `{"cohort_id": 2, "platform": "Zoom", "date": "2026-07-01", "start_time": "10:00:00", "end_time": "11:30:00"}`
  * *Response (201 Created):* `{"meeting_id": "MEET-1A2B3C", "host_link": "https://zoom.us/s/123...", "join_link": "https://zoom.us/j/123..."}`
* **`POST /api/odel/german/record-telemetry/`**
  * *Auth:* Bearer Token (`student`, `teacher`)
  * *Request Body:* `{"virtual_class_id": 5, "student_id": 15, "connection_interruptions": 1}`
  * *Response (200 OK):* `{"attendance_percentage": 100.0, "sis_synced": true, "status": "Present"}`

### F. German AI Coach & Transcripts (`/api/odel/german/`)
* **`POST /api/odel/german/ai-coach/`**
  * *Auth:* Bearer Token
  * *Request Body:* `{"intent": "GRAMMAR", "prompt": "Explain Akkusativ vs Dativ", "level_code": "B1.1"}`
  * *Response (200 OK):* `{"response": "In German, the Akkusativ case indicates...", "intent": "GRAMMAR", "level": "B1.1"}`
* **`GET /api/odel/german/transcript/<student_id>/`**
  * *Auth:* Bearer Token
  * *Response (200 OK):* Full academic metrics, examination history, and fee clearance verification.

### G. Public Verification (`/api/public/`)
* **`GET /api/public/verify/<verification_hash>/`**
  * *Auth:* Public (No token required)
  * *Response (200 OK):* `{"verified": true, "student_name": "Hans Zimmer", "level": "B1.1", "certificate_number": "CERT-829A"}`
  * *Error (404 Not Found):* `{"verified": false, "detail": "Certificate record not found or revoked."}`

### H. Executive Command Center (`/api/analytics/`)
* **`GET /api/analytics/command-center/`**
  * *Auth:* Bearer Token (`admin`, `accountant`, `registrar`)
  * *Response (200 OK):* Aggregated KPI JSON containing total student census, revenue collections, attendance metrics, and high-risk flags.
