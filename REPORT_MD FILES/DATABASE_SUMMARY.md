# Horizon ERP + ODEL Suite — Master Database Schema Summary

**Generated Date:** June 30, 2026  
**Scope:** Comprehensive documentation of all 111 relational tables across PostgreSQL 16.

---

## 1. Schema Architecture & Module Mapping

The relational schema is divided into 19 functional domains. Every table employs UUID or BigAuto primary keys, explicit foreign key indexing, and timestamp audit fields (`created_at`, `updated_at`).

---

## 2. Comprehensive Table Catalog

### App: Accounts (`accounts`)
* **`accounts_user`**: Custom authentication user entity.
  * *Fields:* `id` (PK), `username`, `email`, `password`, `first_name`, `last_name`, `role` (VARCHAR[20]: `student`, `teacher`, `admin`, `accountant`, `registrar`, `admissions`, `hr`), `is_active`, `is_staff`.
  * *Indexes:* Unique index on `username` and `email`; b-tree index on `role`.
  * *Purpose:* Unified multi-role authentication profile.

### App: Student Information System (`students`)
* **`students_student`**: Core student demographic registry.
  * *Fields:* `id` (PK), `user_id` (OneToOne $\rightarrow$ `accounts_user`), `admission_number` (Unique VARCHAR), `first_name`, `last_name`, `date_of_birth`, `gender`, `current_level_id` (FK $\rightarrow$ `academics_level`), `study_mode` (`Physical`, `Virtual`, `Hybrid`).
  * *Indexes:* Index on `admission_number`, `current_level_id`.
* **`students_parentguardian`**: Parent/Guardian relationship linkage.
  * *Fields:* `id` (PK), `user_id` (FK $\rightarrow$ `accounts_user`), `student_id` (FK $\rightarrow$ `students_student`), `relationship`, `contact_phone`.
* **`students_admissionapplication`**: Online enrollment processing records.
  * *Fields:* `id` (PK), `applicant_name`, `email`, `phone`, `applied_level_id` (FK $\rightarrow$ `academics_level`), `status` (`PENDING`, `REVIEWING`, `APPROVED`, `REJECTED`).
* **`students_placementtest`**: Pre-admission language evaluation records.
  * *Fields:* `id` (PK), `application_id` (FK $\rightarrow$ `students_admissionapplication`), `score`, `recommended_level_id` (FK $\rightarrow$ `academics_level`).
* **`students_admissionsactivitylog`**: Admissions workflow audit steps.

### App: Academic Management (`academics`)
* **`academics_campus`**: Physical campus locations.
* **`academics_academicyear`** & **`academics_semester`** & **`academics_term`**: Temporal academic calendars.
* **`academics_department`** & **`academics_program`**: Organizational teaching structures.
* **`academics_level`**: CEFR German proficiency tiers (`A1.1`, `A1.2`, `A2.1`, `A2.2`, `B1.1`, `B1.2`, `B2.1`, `B2.2`, `C1.1`, `C1.2`, `C2`).
  * *Fields:* `id` (PK), `code`, `name`, `duration_weeks`, `tuition_fee`, `prerequisite_level_id` (FK self-ref).
* **`academics_cohort`**: Active student study classes.
  * *Fields:* `id` (PK), `name`, `level_id` (FK $\rightarrow$ `academics_level`), `instructor_id` (FK $\rightarrow$ `accounts_user`), `start_date`, `end_date`.
* **`academics_virtualclass`**: Synchronous Zoom & BigBlueButton meeting scheduler.
  * *Fields:* `id` (PK), `cohort_id` (FK), `teacher_id` (FK), `platform` (`Zoom`, `BBB`), `meeting_id`, `host_link`, `student_join_link`, `recording_url`, `status`, `date`, `start_time`, `end_time`.
* **`academics_virtualattendancelog`**: Real-time virtual class join/leave telemetry packet.
  * *Fields:* `id` (PK), `virtual_class_id` (FK), `student_id` (FK), `join_time`, `leave_time`, `duration_minutes`, `connection_interruptions`, `attendance_percentage`, `is_late`.
* **`academics_timetableevent`**, **`academics_promotionhistory`**, **`academics_careerpathway`**, **`academics_advisor`**, **`academics_intake`**, **`academics_externalexam`**, **`academics_externalexamregistration`**, **`academics_learningresource`**, **`academics_progressionrule`**, **`academics_graduationrule`**, **`academics_studenttimelineevent`**, **`academics_advisingsession`**.

### App: Attendance (`attendance`)
* **`attendance_attendance`**: Official physical classroom attendance ledger.
  * *Fields:* `id` (PK), `student_id` (FK), `cohort_id` (FK), `date`, `status` (`Present`, `Late`, `Absent`, `Excused`), `remarks`.
  * *Unique Constraint:* `(student_id, cohort_id, date)`.

### App: Finance ERP (`finance`)
* **`finance_feestructure`**: Tuition billing schedules per CEFR level.
* **`finance_studentledger`**: Double-entry debit/credit ledger per student.
  * *Fields:* `id` (PK), `student_id` (FK), `description`, `debit_amount`, `credit_amount`, `balance`.
* **`finance_payment`**: Financial inflow transactions.
  * *Fields:* `id` (PK), `student_id` (FK), `amount`, `payment_method` (`MPESA`, `BANK`, `CASH`), `reference_number`, `date`.
* **`finance_receipt`**: Verifiable receipt documents issued on payment confirmation.
* **`finance_allocation`**: Invoice payment matching records.
* **`finance_mpesatransaction`**: M-Pesa Safaricom Daraja API IPN webhook payloads.
* **`finance_paymentplan`** & **`finance_paymentplaninstallment`**: Installment agreements.

### App: Open Distance & e-Learning (`odel`)
* **`odel_course`** $\rightarrow$ **`odel_subject`** $\rightarrow$ **`odel_unit`** $\rightarrow$ **`odel_module`** $\rightarrow$ **`odel_lesson`**: Hierarchical asynchronous learning content tree.
* **`odel_topic`** & **`odel_resource`**: Multimedia lesson attachments (Video MP4, PDF worksheets).
* **`odel_studentlessonprogress`**: Lesson completion tracker (`progress_percentage`, `is_completed`).
* **`odel_recordedlecture`**: Archived live session video links.
* **`odel_discussionforum`**, **`odel_forumthread`**, **`odel_forumpost`**: Peer collaboration boards.
* **`odel_assignment`** & **`odel_assignmentsubmission`**: Homework and grading engine.
* **`odel_questionbank`**, **`odel_quiz`**, **`odel_quizquestion`**, **`odel_quizattempt`**: Self-evaluation quizzes.
* **`odel_gradebook`**: Cumulative ODEL marks aggregation.
* **`odel_officialexamination`**: High-stakes formal examination configurations (`exam_code`, `passing_marks`).
* **`odel_examsessionlog`**: Proctoring telemetry (`focus_change_count`, `interruption_duration_sec`).
* **`odel_examsubmission`**: Completed exam script uploads and awarded grades.

### App: Certificates & Verification (`certificates`)
* **`certificates_certificate`**: Tamper-evident competency certificates.
  * *Fields:* `id` (PK), `student_id` (FK), `level_id` (FK), `certificate_number` (Unique VARCHAR), `verification_hash` (Unique SHA-256 string), `issue_date`, `remarks`.

### App: Document Management & AI Assistant (`dms`, `ai_assistant`)
* **`dms_documentmetadata`** & **`dms_documentversion`** & **`dms_dmsauditlog`**: File storage index and quota telemetry.
* **`ai_assistant_aisetting`**, **`ai_assistant_knowledgedocument`**, **`ai_assistant_airequestlog`**: Vector embeddings and AI coaching query logs.

### App: Communication & Notifications (`communication`, `notifications`)
* **`communication_conversation`**, **`communication_privatemessage`**, **`communication_announcement`**, **`communication_broadcastmessage`**: Internal & external communication payloads.
* **`notifications_notification`**: Persistent user notification alerts (`recipient_id`, `title`, `is_read`).

### App: Workflows & System Auditing (`workflows`, `audits`, `core`, `library`, `hr`, `results`)
* **`workflows_workflowdefinition`**, **`workflows_workflowinstance`**, **`workflows_automationrule`**, **`workflows_workflowactionlog`**: Rule automation tables.
* **`audits_auditlog`**: System-wide action audit trail (`user_id`, `action`, `ip_address`, `timestamp`).
* **`library_book`**, **`library_researchpaper`**, **`library_borrowingrecord`**: Physical/Digital library catalogs.
* **`hr_employeerecord`**, **`hr_leaverequest`**, **`hr_staffattendance`**, **`hr_payrollslip`**: Staff records.
* **`results_result`**: Official exam gradebooks.
* **`core_institutionprofile`**, **`core_faq`**, **`core_testimonial`**: Public institutional settings.
