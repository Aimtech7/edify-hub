# Horizon ERP + ODEL Suite — Master Non-Functional Requirements (NFR) Specification

**Generated Date:** June 30, 2026  
**Scope:** Architectural benchmarks, operational thresholds, and disaster recovery specifications.

---

## 1. NFR Matrix & Benchmarks

| NFR Domain | Specification Target | Verification Standard / Implementation Status |
| :--- | :--- | :--- |
| **Performance** | API response times $< 200\text{ ms}$ for $95\%$ of requests; BI complex queries $< 800\text{ ms}$. | Enforced via DRF pagination ($25$ items) and ORM `select_related()` query optimizations. |
| **Scalability** | Horizontal scaling up to $10,000$ concurrent learners and $500$ simultaneous virtual exam sessions. | Decoupled React SPA architecture paired with stateless Django backend containerized instances. |
| **Security** | Zero trust API boundaries; strict Role-Based Access Control (RBAC); SHA-256 certificate hashing. | Enforced via SimpleJWT tokens, HTTPS-only transport, and DRF custom permission classes. |
| **Reliability** | Zero data loss during financial ledger or gradebook transactions; idempotent webhooks. | Database atomic transaction wrappers (`transaction.atomic()`) on all financial allocations. |
| **Availability** | $99.9\%$ uptime SLA ($< 8.76\text{ hours}$ downtime annually). | Nginx reverse proxy failover clusters paired with managed PostgreSQL cloud replicas. |
| **Maintainability** | Clean modular separation ($19$ Django apps); TypeScript type definitions. | Strict adherence to DRY principles and modular domain service boundaries. |
| **Accessibility** | WCAG 2.1 AA UI compliance (High contrast ratios, semantic HTML, keyboard navigable). | Verified via high-contrast Tailwind styling and accessible Lucide UI components. |
| **Usability** | Intuitive 3-click navigation rule from dashboard to core task completion across all roles. | Role-customized sidebar layouts (`nav-config.ts`) tailored specifically to user personas. |
| **Compliance** | GDPR & Kenya Data Protection Act (DPA) compliant student demographic records. | Explicit consent logging and secure student identity encapsulation. |

---

## 2. Backup Strategy & Disaster Recovery Plan

### A. Automated Backup Schedule
1. **Database Snapshots:** Daily automated PostgreSQL pg_dump binary backups archived to secondary off-site cloud storage buckets at `02:00 UTC`.
2. **Point-in-Time Recovery (PITR):** Write-Ahead Logging (WAL) archiving enabled with a $30$-day retention window.
3. **Document Repository:** Supabase Object Storage buckets configured with cross-region bucket replication.

### B. Recovery Strategy (RTO & RPO)
* **Recovery Point Objective (RPO):** $< 5\text{ minutes}$ (Maximum acceptable data loss window during catastrophic database failure).
* **Recovery Time Objective (RTO):** $< 30\text{ minutes}$ (Maximum acceptable downtime required to spin up cold standby instances).

---

## 3. System Monitoring & Audit Logging Strategy

### A. Real-Time Application Monitoring
* Every HTTP request entering the backend is monitored for latency and HTTP response status. Any unhandled $5xx$ Server Exception emits an immediate high-priority diagnostic alert to institutional system administrators.

### B. Immutable Audit Logging Engine (`audits` module)
* All critical state mutations (user login, fee adjustment, mark alteration, certificate issuance) are written to `audits.AuditLog`:
```json
{
  "timestamp": "2026-06-30T07:08:00Z",
  "user_id": 1,
  "action": "UPDATE_STUDENT_LEDGER",
  "resource": "finance_studentledger:ID_45",
  "ip_address": "192.168.1.104",
  "status": "SUCCESS"
}
```
* Audit logs cannot be deleted or modified via standard REST endpoints or admin panels.
