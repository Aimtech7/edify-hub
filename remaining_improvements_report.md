# Horizon ERP & ODEL — Future Recommendations & Continuous Monitoring Report

**Date:** June 27, 2026  
**Audience:** Institutional Stakeholders & ICT Management  

---

## Executive Roadmap

With Horizon ERP successfully hardened and production-ready across all 10 phases, the core operational objectives are fully met. To ensure sustained institutional excellence over the next 3–5 years, we recommend the following continuous monitoring areas and future enhancements.

---

## Recommended Future Enhancements

### 1. Automated M-Pesa STK Push Integration
- **Current State:** Payments are logged and reconciled via transaction code lookup.
- **Enhancement:** Integrate Safaricom Daraja STK Push API directly into the Student/Parent portal fee statement view, allowing parents to enter their phone number and authorize tuition deductions via instant PIN prompt.

### 2. WhatsApp Business API Notification Gateway
- **Current State:** SMS notification triggers are simulated in attendance tracking.
- **Enhancement:** Connect Meta's WhatsApp Business API to automatically dispatch Goethe exam schedules, attendance alerts, and fee receipts directly to parents' WhatsApp accounts.

### 3. Biometric / RFID Attendance Integration
- **Current State:** Teachers manually check off student attendance during roll call.
- **Enhancement:** Link campus entrance RFID card readers or biometric scanners directly to the `attendance.Attendance` model for automated real-time classroom check-ins.

### 4. Offline Service Worker (PWA Mode)
- **Current State:** Web application requires active internet connection.
- **Enhancement:** Configure a Progressive Web App (PWA) service worker allowing teachers to enter exam marks offline during internet outages, syncing automatically upon network reconnection.

---

## Continuous Monitoring Protocols

- **Weekly Database Maintenance:** Schedule weekly `VACUUM ANALYZE` operations on PostgreSQL to reclaim storage from updated ledgers and maintain index efficiency.
- **Storage Quota Alerts:** Monitor Supabase S3 bucket telemetry; configure webhook automated alerts when bucket utilization exceeds 80 GB.
