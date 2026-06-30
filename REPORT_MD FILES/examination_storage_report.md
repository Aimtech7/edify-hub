# Horizon ODEL — Enterprise Secure PDF Examination Storage & Cloud Telemetry Report
**BY: AIMTECH**
**Date:** June 27, 2026  
**Audience:** ICT Infrastructure & Cloud DevOps Operations  
**System Status:** DEPLOYED & VERIFIED  

---

## 1. Storage Topology & Partitioning Strategy

To guarantee strict isolation between standard institutional documents (invoices, certificates, attendance logs) and confidential examination assets, all formal ODEL evaluation files are routed into dedicated bucket prefixes within my central Supabase S3 cloud gateway (`StorageService`).

| Asset Classification | Storage Bucket Prefix | Access Policy | Retention Period |
| :--- | :--- | :--- | :--- |
| **Examination Question Papers** | `odel/formal_exams/` | Restricted (Enrolled Cohort + Teachers) | 7 Years (Archival) |
| **Marking Rubrics & Answer Keys** | `odel/rubrics/` | Strictly Confidential (Teachers & HODs Only) | 7 Years (Archival) |
| **Student Answer Submissions** | `odel/formal_submissions/` | Student (Write Once) / Teachers (Read) | 5 Years (Accreditation Audit) |
| **Annotated Marked Scripts** | `odel/marked_scripts/` | Student (Read Published) / Teachers (Read/Write) | 5 Years (Accreditation Audit) |

---

## 2. File Upload Pipeline & Validation Gateway

All document interactions undergo rigorous verification before persistence in storage:
1. **MIME Type & Extension Verification:** Uploads are restricted strictly to approved academic file formats (`.pdf`, `.docx`, `.doc`, `.jpg`, `.jpeg`, `.png`, `.zip`). Executable payloads (`.exe`, `.sh`, `.js`, `.bat`) are instantly rejected at the Django serializer level.
2. **Payload Size Limits:** To prevent storage denial-of-service (DoS), student submission payloads are capped at **25 MB** per file upload.
3. **Deterministic UUID File Naming:** To eliminate file overwrites and directory traversal vulnerabilities, uploaded files are renamed deterministically using UUIDv4 hashes combined with institutional admission numbers (e.g., `ADM2026001_EXM8912_a1b2c3d4.pdf`).

---

## 3. Storage Telemetry & Quota Monitoring

Our cloud telemetry middleware tracks real-time bucket utilization across the entire institutional repository:
- **Current Total Storage Allocation:** 500 GB (Supabase Pro Tier)
- **ODEL Examination Allocation:** 150 GB reserved quota
- **Automated Alert Thresholds:** Webhook notifications dispatch automatically to the ICT Infrastructure lead when bucket utilization reaches 80% (120 GB utilized in ODEL partition).
- **Weekly Garbage Collection:** Automated cron jobs purge orphaned draft uploads and temporary session fragments every Sunday at 02:00 UTC.
