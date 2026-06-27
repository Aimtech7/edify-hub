# HORIZON DMS DOCUMENT ARCHITECTURE REPORT

## Overview
The Horizon Document Management System (DMS) provides a centralized, hybrid storage architecture combining relational metadata indexing in PostgreSQL with object storage in Supabase S3.

## Architectural Tiers
1. **Presentation Layer**: Built with React 18, TypeScript, and Lucide Icons (`LessonResourcesPage.tsx`, `KnowledgeBasePage.tsx`, `StorageDashboardPage.tsx`).
2. **API & Workflow Layer**: Django REST Framework endpoints under `/api/dms/documents/` supporting role-based access control (RBAC) and multipart uploads.
3. **Storage Engine**: `StorageService` using `S3Boto3Storage` directed to Supabase Object Storage buckets (`admissions`, `lesson-resources`, `knowledge-base`, `policies`).
4. **AI Knowledge Bridge**: Automated pipeline hooking document saves directly into `KnowledgeDocument` embeddings for vector retrieval.
