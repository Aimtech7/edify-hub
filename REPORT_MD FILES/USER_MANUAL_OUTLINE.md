# Horizon ERP + ODEL Suite — Master User Manual Chapter Outlines

**Generated Date:** June 30, 2026  
**Scope:** Structured chapter outlines tailored for all 7 institutional user personas.

---

## Part 1: System Administrator Manual (`admin`)
* **Chapter 1.1: System Overview & Navigation**
  * Dashboard KPI interpretation and global search navigation.
* **Chapter 1.2: User & Role Governance**
  * Provisioning staff accounts, assigning roles (`admin`, `teacher`, `accountant`, `registrar`, `admissions`, `hr`), and password resets.
* **Chapter 1.3: Academic Structure Configuration**
  * Creating campuses, terms, departments, and configuring CEFR German language levels (`A1.1` to `C2`).
* **Chapter 1.4: Enterprise Automation Engine**
  * Building event triggers, assigning automated actions (`SEND_EMAIL`, `UNLOCK_COURSE`), and monitoring execution logs.
* **Chapter 1.5: Security & Audit Oversight**
  * Inspecting immutable system audit logs and storage telemetry quotas.

---

## Part 2: Admissions Officer Manual (`admissions`)
* **Chapter 2.1: The Admissions Bridge & Lead Queue**
  * Reviewing online applications submitted via the Public Admissions Portal.
* **Chapter 2.2: Placement Test Administration**
  * Recording language evaluation scores and assigning recommended CEFR study levels.
* **Chapter 2.3: Application Decisioning & Student Conversion**
  * Approving applications to automatically generate student admission IDs (`GER-2026-XXXX`).

---

## Part 3: Finance Officer Manual (`accountant`)
* **Chapter 3.1: Fee Schedules & Billing Configuration**
  * Setting up program tuition fees across physical and ODEL language cohorts.
* **Chapter 3.2: Payment Processing & Receipting**
  * Manual payment entry (Bank/Cash), M-Pesa Safaricom Daraja IPN reconciliation, and issuing PDF receipts.
* **Chapter 3.3: Student Ledger Reconciliation**
  * Auditing individual student debits, credits, and payment allocations.
* **Chapter 3.4: Financial BI Reporting**
  * Generating daily revenue collection summaries and identifying outstanding balances.

---

## Part 4: Teacher & Instructor Manual (`teacher`)
* **Chapter 4.1: Instructor Dashboard & Cohort Management**
  * Viewing assigned teaching cohorts, class rosters, and student timetables.
* **Chapter 4.2: Physical Classroom Attendance Ledgers**
  * Marking daily class attendance (`Present`, `Late`, `Absent`) and adding remarks.
* **Chapter 4.3: ODEL Course & Lesson Management**
  * Uploading multimedia lessons (Video MP4, PDF worksheets), creating discussion topics, and assigning homework.
* **Chapter 4.4: Virtual Classroom Host Administration**
  * Scheduling Zoom and BigBlueButton classes and launching host room sessions.
* **Chapter 4.5: Formal Examination Proctoring & Grading**
  * Administering online exams, monitoring student browser focus changes, and marking submitted scripts.

---

## Part 5: Student Learning Guide (`student`)
* **Chapter 5.1: Student Portal Overview**
  * Navigating the dashboard, checking schedule events, and accessing fee statements.
* **Chapter 5.2: The German Language Hub (ODEL LMS)**
  * Accessing multimedia learning modules, tracking lesson completion percentage, and participating in peer forums.
* **Chapter 5.3: Attending Live Virtual Classes**
  * Joining scheduled Zoom/BBB rooms with automatic attendance sync.
* **Chapter 5.4: 24/7 AI German Language Coach**
  * Asking grammar questions (Akkusativ/Dativ), vocabulary translations, and taking mock Goethe/TELC quizzes.
* **Chapter 5.5: Secure Online Examinations**
  * Taking proctored formal exams, uploading answer scripts, and maintaining screen focus.
* **Chapter 5.6: Academic Transcripts & Certificates**
  * Downloading verified transcripts and checking fee clearance for certificate generation.

---

## Part 6: Human Resources Officer Manual (`hr`)
* **Chapter 6.1: Staff Registry & Personnel Files**
  * Managing employee records, contracts, and demographic data.
* **Chapter 6.2: Leave Management Workflows**
  * Reviewing, approving, or rejecting staff leave requests.
* **Chapter 6.3: Staff Attendance & Payroll Records**
  * Tracking faculty attendance and generating basic monthly payroll slips.

---

## Part 7: ICT Administrator Manual (`ict_admin`)
* **Chapter 7.1: Server Infrastructure & Reverse Proxy**
  * Managing Nginx SSL termination and Docker container lifecycle.
* **Chapter 7.2: Supabase Storage Quotas & Backup Ops**
  * Monitoring DMS storage utilization and verifying automated PostgreSQL daily dumps.
* **Chapter 7.3: Troubleshooting & Error Recovery**
  * Analyzing Django Gunicorn logs, Celery worker queues, and Redis cluster connectivity.
