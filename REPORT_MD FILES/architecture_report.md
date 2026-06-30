# Horizon ERP & ODEL — System Architecture Report

**Date:** June 27, 2026  
**Architecture Style:** Decoupled Modular Monolith + RAG AI Layer  

---

## Architectural Overview

Horizon ERP combines a high-performance React frontend (Vite/Tailwind CSS/Radix UI) with a robust Django REST Framework backend backed by Supabase PostgreSQL and S3-compatible file storage.

---

## Module Interaction Diagram

```mermaid
graph TD
    subgraph Frontend["Frontend Layer (React + TypeScript)"]
        UI["AppShell & Command Palette (⌘K)"]
        Dash["Role Dashboards (10 Departments)"]
        Tables["Sticky DataTables & Multi-Export"]
        Forms["FormUpgrade (Auto-Save Drafts)"]
    end

    subgraph API Gateway["API Service Layer"]
        Auth["JWT Auth & RoleRoute Guard"]
        PaySvc["Payment & Ledger Service"]
        AdmSvc["Admissions Bridge Service"]
    end

    subgraph Backend["Django REST Backend"]
        Models["38 Core ORM Models"]
        Audit["AuditLog & Activity Tracker"]
        RAG["AI RAG Retrieval Engine"]
    end

    subgraph Infrastructure["Supabase Cloud Infrastructure"]
        PG[(PostgreSQL DB + pgvector)]
        S3[("Supabase Storage (S3 Buckets)")]
        HF["Hugging Face Inference API"]
    end

    UI --> Dash
    Dash --> Tables & Forms
    Tables & Forms --> Auth
    Auth --> PaySvc & AdmSvc
    PaySvc & AdmSvc --> Models
    Models --> Audit
    Models --> PG
    Forms --> S3
    RAG --> PG
    RAG --> HF
```

---

## Key Subsystem Integrations

1. **Admissions Bridge:** Connects public applicant inquiries directly into the SIS student table upon verification.
2. **Finance & Ledger Reconciliation:** Automates the allocation of M-Pesa transactions against billing invoices.
3. **AI RAG Assistant:** Ingests document embeddings from Supabase S3 into `pgvector` to provide conversational answers about German course rules and Goethe exams.
