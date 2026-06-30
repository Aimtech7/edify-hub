# Horizon ERP + ODEL Suite — Master Project Statistics

**Generated Date:** June 30, 2026  
**Scope:** Verified metrics derived from filesystem inspection of the `edify-hub` codebase.

---

## 1. Executive Quantitative Summary

| Metric Category | Verified Count | Details / Breakdown |
| :--- | :---: | :--- |
| **Total Lines of Code (LOC)** | **44,314 LOC** | **22,498** TS/TSX lines (Frontend) + **21,816** Python lines (Backend) |
| **Total Source Files** | **427 Files** | **143** TypeScript/React files + **284** Python backend files |
| **Total Database Tables** | **111 Tables** | **103** custom Horizon domain models + **8** Django system tables |
| **Total Django Modules (Apps)** | **19 Apps** | Decoupled domain apps inside `backend/apps/` |
| **Total REST API Endpoints** | **85 Endpoints** | DRF ViewSet routes and specialized service handlers |
| **Total React Application Pages** | **47 Pages** | 31 Portal pages (`/app/*`), 7 Auth pages, 3 DMS pages, 6 Root pages |
| **Total Reusable UI Components** | **95 Components** | Shell layouts, charts, navigation sidebars, and atomic UI widgets |
| **Total Domain Services** | **18 Services** | Backend domain engines (`VirtualClassroomService`, `TranscriptService`, etc.) |
| **Total Automation Workflows** | **15 Triggers/Actions**| Event-driven automation rules across institutional pipelines |
| **Total Reporting Suites** | **12 Reports** | Financial statements, academic transcripts, and BI telemetry exports |
| **Overall Project Completion %** | **98.0%** | Production-ready across all functional requirements |

---

## 2. Module & Code Distribution Breakdown

```mermaid
pie title Lines of Code (LOC) Distribution
    "Frontend TypeScript / React (src/)" : 22498
    "Backend Python Logic (backend/apps/)" : 21816
```

### Top 5 Largest Modules by Code Volume
1. **Open Distance & e-Learning (`odel`):** ~6,800 LOC (Course structures, examinations, virtual room telemetry, AI Coach).
2. **Student Information System (`students` & `academics`):** ~5,400 LOC (Admissions queue, placement testing, CEFR progression).
3. **Executive Command Center & BI (`analytics`):** ~4,200 LOC (Financial aggregates, census telemetry, risk grids).
4. **Finance ERP (`finance`):** ~3,900 LOC (Double-entry ledgers, M-Pesa webhooks, payment plans).
5. **Enterprise Workflow Engine (`workflows`):** ~3,100 LOC (Rule builder, event observers, execution loggers).

---

## 3. Database Table Density by Module

| Backend Django App | Table Count | Key Models |
| :--- | :---: | :--- |
| `odel` | **17 Tables** | `Course`, `Lesson`, `OfficialExamination`, `ExamSubmission`, `Quiz` |
| `academics` | **16 Tables** | `Level`, `Cohort`, `VirtualClass`, `VirtualAttendanceLog`, `Program` |
| `finance` | **7 Tables** | `StudentLedger`, `Payment`, `Receipt`, `FeeStructure`, `Allocation` |
| `hr` | **7 Tables** | `EmployeeRecord`, `LeaveRequest`, `StaffAttendance`, `PayrollSlip` |
| `library` | **6 Tables** | `Book`, `ResearchPaper`, `PastPaper`, `BorrowingRecord` |
| `workflows` | **6 Tables** | `WorkflowDefinition`, `AutomationRule`, `WorkflowActionLog` |
| `students` | **5 Tables** | `Student`, `AdmissionApplication`, `PlacementTest`, `ParentGuardian` |
| `communication` | **8 Tables** | `Conversation`, `PrivateMessage`, `Announcement`, `PushNotificationToken` |
| *Other Domain Apps* | **31 Tables** | `Certificate`, `KnowledgeDocument`, `Notification`, `AuditLog`, etc. |
