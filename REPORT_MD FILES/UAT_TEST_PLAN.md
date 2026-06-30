# Horizon Deutsch Training Institute (Edify Hub) — Master UAT Test Plan

**Document Version:** 1.0  
**Target System:** Horizon LMS & Finance ERP (`edify-hub`)  
**Scope:** Phase 9 User Acceptance Testing (End-to-End Lifecycle & Audit Verification)

---

## 1. Overview & Objectives

This Master User Acceptance Testing (UAT) Test Plan defines the validation criteria for business stakeholders, academic administrators, finance officers, and students. The objective is to verify that all core business requirements are fully satisfied in a production-like staging environment and that non-repudiation (audit trailing) is strictly maintained across sensitive operations.

---

## 2. Test Environment & Roles

### Roles & Test Accounts
| Role | Identifier / Username | Password | Key Responsibilities |
|---|---|---|---|
| **Super Admin** | `admin` | `admin` | Global system configurations, user provisioning, queue triage |
| **Academic Staff** | `amueller` | `staff` | Roster management, grading, attendance marking |
| **Finance Officer** | `finance_admin` | `admin` | Fee structure allocation, receipt verification, payment matching |
| **Student** | `DA-2024-1042` | `student` | Application submission, portal access, receipt & certificate download |

---

## 3. Master Test Scenarios

### Pillar 1: Admissions & Student Onboarding (UAT-ADM)

#### Scenario UAT-ADM-01: Prospective Student Wizard Application
- **Preconditions:** Public admissions portal (`/admissions`) is accessible.
- **Actor:** Prospective Student
- **Test Steps:**
  1. Navigate to `/admissions` and initiate the 8-step application wizard.
  2. Enter personal details (Name, Email, Phone, DOB, Nationality).
  3. Select German language experience level and preferred intake/campus.
  4. Upload required ID and academic certificate documents.
  5. Submit application.
- **Expected Outcome:** Application is successfully received with status `PENDING`. Data persists in local storage during wizard progression.
- **Audit Assertion:** `AuditLog` records public submission event.

#### Scenario UAT-ADM-02: Admin Triage & Profile Generation
- **Preconditions:** Application UAT-ADM-01 exists in Admissions Queue.
- **Actor:** Super Admin (`admin`)
- **Test Steps:**
  1. Log into Admin Portal and navigate to Admissions Queue.
  2. Review application details and uploaded attachments.
  3. Click **Approve & Enroll**.
- **Expected Outcome:** 
  - Backend automatically generates a unique admission number (e.g., `DA-2026-XXXX`).
  - Creates active `User` login credentials.
  - Creates linked `Student` profile entity.
  - Sends welcome email/notification.
- **Audit Assertion:** `AuditLog` records actor `admin`, action `"Approved admission application..."`, and target admission number.

---

### Pillar 2: Academic Delivery & Grading (UAT-ACAD)

#### Scenario UAT-ACAD-01: Class Roster & Attendance Logging
- **Preconditions:** Student is enrolled in an active Cohort/Course.
- **Actor:** Instructor (`amueller`)
- **Test Steps:**
  1. Log into Instructor Portal and select assigned class roster.
  2. Open today's attendance sheet.
  3. Mark student as `PRESENT` and save.
- **Expected Outcome:** Attendance record is stored and reflected in student's dashboard overall attendance percentage.
- **Audit Assertion:** `AuditLog` records attendance submission linking instructor and cohort.

#### Scenario UAT-ACAD-02: Module Assessment & CEFR Level Promotion
- **Preconditions:** Course assessment period is active.
- **Actor:** Instructor (`amueller`)
- **Test Steps:**
  1. Navigate to **Marks & Grading** module.
  2. Input module test scores (Reading, Writing, Listening, Speaking).
  3. Calculate overall score and publish result.
- **Expected Outcome:** Result object is created. Student CEFR level transitions (e.g., A1 -> A2). Student can view detailed marks report on their portal.
- **Audit Assertion:** `AuditLog` records `"Created/Updated academic grade for student..."` with IP address and timestamp.

---

### Pillar 3: Financial ERP & Fee Settlement (UAT-FIN)

#### Scenario UAT-FIN-01: Fee Structure & Invoice Generation
- **Preconditions:** Student profile is active.
- **Actor:** Finance Officer / System
- **Test Steps:**
  1. Attach standard CEFR tuition fee structure ($300) to student profile.
  2. Generate tuition invoice.
- **Expected Outcome:** Student ledger reflects outstanding balance of $300.

#### Scenario UAT-FIN-02: Payment Receipt & Balance Clearance
- **Preconditions:** Outstanding invoice of $300 exists.
- **Actor:** Student / Finance Officer
- **Test Steps:**
  1. Simulate M-Pesa STK Push payment callback OR manually input Bank Receipt for $300.
  2. Finance officer allocates payment to invoice.
- **Expected Outcome:** Payment is matched. Student outstanding balance updates to `$0.00`. Financial hold is removed.
- **Audit Assertion:** `AuditLog` records `"Allocated and finalized payment receipt..."` with exact amount and transaction reference.

---

### Pillar 4: Certificate Issuance & Verification (UAT-CERT)

#### Scenario UAT-CERT-01: Automated Eligibility Check & Issuance
- **Preconditions:** Student completed course with passing grades and `$0.00` fee balance.
- **Actor:** Academic Registrar / Staff
- **Test Steps:**
  1. Navigate to **Certificate Management**.
  2. Select eligible student and click **Generate Certificate**.
- **Expected Outcome:** 
  - PDF certificate is compiled with embedded QR code.
  - Unique certificate serial number is generated.
  - Student can download digital certificate from Student Portal.
- **Audit Assertion:** `AuditLog` records certificate issuance linking staff actor and student recipient.

#### Scenario UAT-CERT-02: Public Portal Verification (`/verify`)
- **Preconditions:** Certificate issued in UAT-CERT-01.
- **Actor:** External Verifier / Employer
- **Test Steps:**
  1. Scan certificate QR code or navigate to `/verify`.
  2. Input certificate serial number or student admission number.
- **Expected Outcome:** Public portal displays verified student name, completed CEFR level, issuance date, and official institute seal.

---

## 4. Sign-off & Acceptance Criteria

System UAT is considered complete and approved for Phase 10 cloud deployment when:
1. 100% of automated verification suite (`verify_uat_flow.py`) tests pass.
2. Zero critical or blocking defects remain open.
3. Audit trailing verification confirms zero missing logs across mutating endpoints.
