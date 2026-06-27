# HORIZON ENTERPRISE ADMIN AUDIT REPORT

## 1. Registered Models in Django Admin

**Total Registered:** 93

- `[academics] AcademicYear` (Admin Class: `GenericAcadAdmin`)
- `[academics] AdvisingSession` (Admin Class: `GenericAcadAdmin`)
- `[academics] Advisor` (Admin Class: `GenericAcadAdmin`)
- `[academics] Campus` (Admin Class: `GenericAcadAdmin`)
- `[academics] CareerPathway` (Admin Class: `GenericAcadAdmin`)
- `[academics] Cohort` (Admin Class: `GenericAcadAdmin`)
- `[academics] Department` (Admin Class: `GenericAcadAdmin`)
- `[academics] ExternalExamRegistration` (Admin Class: `GenericAcadAdmin`)
- `[academics] ExternalExam` (Admin Class: `GenericAcadAdmin`)
- `[academics] GraduationRule` (Admin Class: `GenericAcadAdmin`)
- `[academics] Intake` (Admin Class: `GenericAcadAdmin`)
- `[academics] LearningResource` (Admin Class: `GenericAcadAdmin`)
- `[academics] Level` (Admin Class: `GenericAcadAdmin`)
- `[academics] Program` (Admin Class: `GenericAcadAdmin`)
- `[academics] ProgressionRule` (Admin Class: `GenericAcadAdmin`)
- `[academics] PromotionHistory` (Admin Class: `GenericAcadAdmin`)
- `[academics] Semester` (Admin Class: `GenericAcadAdmin`)
- `[academics] StudentTimelineEvent` (Admin Class: `GenericAcadAdmin`)
- `[academics] Term` (Admin Class: `GenericAcadAdmin`)
- `[academics] TimetableEvent` (Admin Class: `GenericAcadAdmin`)
- `[academics] VirtualClass` (Admin Class: `GenericAcadAdmin`)
- `[accounts] User` (Admin Class: `UserAdmin`)
- `[ai_assistant] AIRequestLog` (Admin Class: `AIRequestLogAdmin`)
- `[ai_assistant] AISetting` (Admin Class: `AISettingAdmin`)
- `[ai_assistant] KnowledgeDocument` (Admin Class: `KnowledgeDocumentAdmin`)
- `[attendance] Attendance` (Admin Class: `AttendanceAdmin`)
- `[audits] AuditLog` (Admin Class: `AuditLogAdmin`)
- `[auth] Group` (Admin Class: `GroupAdmin`)
- `[certificates] Certificate` (Admin Class: `CertificateAdmin`)
- `[communication] Announcement` (Admin Class: `GenericCommAdmin`)
- `[communication] BroadcastMessage` (Admin Class: `GenericCommAdmin`)
- `[communication] Conversation` (Admin Class: `GenericCommAdmin`)
- `[communication] PrivateMessage` (Admin Class: `GenericCommAdmin`)
- `[communication] PushNotificationToken` (Admin Class: `GenericCommAdmin`)
- `[core] ContactDetail` (Admin Class: `ContactDetailAdmin`)
- `[core] DownloadResource` (Admin Class: `DownloadResourceAdmin`)
- `[core] Event` (Admin Class: `EventAdmin`)
- `[core] FAQ` (Admin Class: `FAQAdmin`)
- `[core] GalleryImage` (Admin Class: `GalleryImageAdmin`)
- `[core] InstitutionProfile` (Admin Class: `InstitutionProfileAdmin`)
- `[core] NewsItem` (Admin Class: `NewsItemAdmin`)
- `[core] SupportTicket` (Admin Class: `SupportTicketAdmin`)
- `[core] Testimonial` (Admin Class: `TestimonialAdmin`)
- `[dms] DMSAuditLog` (Admin Class: `DMSAuditLogAdmin`)
- `[dms] DocumentMetadata` (Admin Class: `DocumentMetadataAdmin`)
- `[dms] DocumentVersion` (Admin Class: `DocumentVersionAdmin`)
- `[finance] Allocation` (Admin Class: `GenericFinAdmin`)
- `[finance] FeeStructure` (Admin Class: `GenericFinAdmin`)
- `[finance] MpesaTransaction` (Admin Class: `GenericFinAdmin`)
- `[finance] PaymentPlanInstallment` (Admin Class: `GenericFinAdmin`)
- `[finance] PaymentPlan` (Admin Class: `GenericFinAdmin`)
- `[finance] Payment` (Admin Class: `GenericFinAdmin`)
- `[finance] Receipt` (Admin Class: `GenericFinAdmin`)
- `[finance] StudentLedger` (Admin Class: `GenericFinAdmin`)
- `[hr] EmployeeRecord` (Admin Class: `GenericHrAdmin`)
- `[hr] EmploymentContract` (Admin Class: `GenericHrAdmin`)
- `[hr] LeaveRequest` (Admin Class: `GenericHrAdmin`)
- `[hr] LeaveType` (Admin Class: `GenericHrAdmin`)
- `[hr] PayrollSlip` (Admin Class: `GenericHrAdmin`)
- `[hr] PerformanceReview` (Admin Class: `GenericHrAdmin`)
- `[hr] StaffAttendance` (Admin Class: `GenericHrAdmin`)
- `[library] AudioBook` (Admin Class: `GenericAdmin`)
- `[library] Book` (Admin Class: `GenericAdmin`)
- `[library] BorrowingRecord` (Admin Class: `GenericAdmin`)
- `[library] PastPaper` (Admin Class: `GenericAdmin`)
- `[library] ResearchPaper` (Admin Class: `GenericAdmin`)
- `[library] Reservation` (Admin Class: `GenericAdmin`)
- `[notifications] Notification` (Admin Class: `NotificationAdmin`)
- `[odel] AssignmentSubmission` (Admin Class: `GenericOdelAdmin`)
- `[odel] Assignment` (Admin Class: `GenericOdelAdmin`)
- `[odel] Course` (Admin Class: `GenericOdelAdmin`)
- `[odel] DiscussionForum` (Admin Class: `GenericOdelAdmin`)
- `[odel] ForumPost` (Admin Class: `GenericOdelAdmin`)
- `[odel] ForumThread` (Admin Class: `GenericOdelAdmin`)
- `[odel] Gradebook` (Admin Class: `GenericOdelAdmin`)
- `[odel] Lesson` (Admin Class: `GenericOdelAdmin`)
- `[odel] Module` (Admin Class: `GenericOdelAdmin`)
- `[odel] QuestionBank` (Admin Class: `GenericOdelAdmin`)
- `[odel] QuizAttempt` (Admin Class: `GenericOdelAdmin`)
- `[odel] QuizQuestion` (Admin Class: `GenericOdelAdmin`)
- `[odel] Quiz` (Admin Class: `GenericOdelAdmin`)
- `[odel] RecordedLecture` (Admin Class: `GenericOdelAdmin`)
- `[odel] Resource` (Admin Class: `GenericOdelAdmin`)
- `[odel] StudentLessonProgress` (Admin Class: `GenericOdelAdmin`)
- `[odel] Subject` (Admin Class: `GenericOdelAdmin`)
- `[odel] Topic` (Admin Class: `GenericOdelAdmin`)
- `[odel] Unit` (Admin Class: `GenericOdelAdmin`)
- `[results] Result` (Admin Class: `ResultAdmin`)
- `[students] AdmissionApplication` (Admin Class: `AdmissionApplicationAdmin`)
- `[students] AdmissionsActivityLog` (Admin Class: `AdmissionsActivityLogAdmin`)
- `[students] ParentGuardian` (Admin Class: `ParentGuardianAdmin`)
- `[students] PlacementTest` (Admin Class: `PlacementTestAdmin`)
- `[students] Student` (Admin Class: `StudentAdmin`)

## 2. Missing / Unregistered Models

- `[auth] Permission`

## 3. URL Names & Reverse Resolution Verification

- [OK] `admin:index` with {} -> resolved to `/admin/`
- [OK] `admin:app_list` with {'app_label': 'students'} -> resolved to `/admin/students/`
- [OK] `admin:app_list` with {'app_label': 'dms'} -> resolved to `/admin/dms/`
- [OK] `admin:app_list` with {'app_label': 'ai_assistant'} -> resolved to `/admin/ai_assistant/`

**Broken Reverse URL Calls:** 0


## 4. Permissions & Security Audit

- All model admins inherit from standard or custom Enterprise `ModelAdmin` enforcing `has_module_permission` and RBAC checks.
- Superuser password verified as configured (`aimtech`).
- Parent signup and prefilled details verified.

## 5. Template & Theme Override Status

- German National Aesthetic (Black `#0F172A`, Red `#DC2626`, Gold `#EAB308`) applied.
- Custom Enterprise Dashboard summary cards, statistics, and quick action bars active.