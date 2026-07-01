# Dependency & Configuration Audit Report
**Date:** June 30, 2026
**Scope:** Horizon ERP + ODEL Platform Production Hardening Sprint

---

## 1. Frontend Environment Variables
*Location: `edify-hub/.env`*
- `VITE_SUPABASE_URL`: `https://grwnivcjxhpmmyjipxgz.supabase.co`
- `VITE_SUPABASE_ANON_KEY`: `sb_publishable_srCuNfHXoIUMJTunyBvoTg_g76qLUl4`
- `VITE_API_URL`: Currently commented out (`# VITE_API_URL=https://edify-hub-2.onrender.com/api`). Needs to be set to `https://edify-hub-1.onrender.com`.

---

## 2. Backend Environment Variables
*Location: `edify-hub/backend/.env`*
- `SECRET_KEY`: `django-insecure-your-secret-key-here`
- `DEBUG`: `True` (must be `False` in production)
- `ALLOWED_HOSTS`: `localhost,127.0.0.1` (must include `edify-hub-1.onrender.com`)
- `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`: Supabase connection credentials
- `DATABASE_URL`: Supabase PostgreSQL pooler URL
- `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`: Supabase API keys
- `CORS_ALLOWED_ORIGINS`: `http://localhost:5000,http://localhost:3000,http://127.0.0.1:5000,https://edify-hub.vercel.app` (must include production URL `https://edify-hub-1.onrender.com` or rely on `CORS_ALLOW_ALL_ORIGINS=True`)
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_STORAGE_BUCKET_NAME`, `AWS_S3_ENDPOINT_URL`, `AWS_S3_REGION_NAME`: Supabase S3 storage configuration
- `HUGGINGFACE_API_KEY`: `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`

---

## 3. API Base URLs in Frontend
1. `src/services/api-client.ts`: Uses `import.meta.env.VITE_API_URL || "/api"`.
2. Hardcoded URLs:
   - `StorageDashboardPage.tsx`: `http://localhost:8000/api/dms/storage/dashboard/`
   - `LessonResourcesPage.tsx`: `http://localhost:8000/api/dms/documents/`
   - `KnowledgeBasePage.tsx`: `http://localhost:8000/api/dms/documents/`
   - `AdmissionsQueuePage.tsx`: `http://localhost:8000/api/students/admissions/`

---

## 4. Proxy Configuration
*Location: `edify-hub/vite.config.ts`*
- `/api` proxy target: `http://localhost:8000` (`changeOrigin: true`)

---

## 5. Nginx Proxy Targets
*Location: `edify-hub/nginx.conf`*
- Hardcoded upstream targets pointing to `http://backend:8000/`:
  - `/api/` -> `http://backend:8000/api/`
  - `/admin/` -> `http://backend:8000/admin/`
  - `/static/admin/` -> `http://backend:8000/static/admin/`
  - `/static/rest_framework/` -> `http://backend:8000/static/rest_framework/`
  - `/static/drf_yasg/` -> `http://backend:8000/static/drf_yasg/`
  - `/media/` -> `http://backend:8000/media/`
*Issue:* `backend` hostname does not exist on Render static web app container deployment, causing Nginx startup failures or 502/504 proxy errors.

---

## 6. Axios & Fetch Base URLs
- **Axios Client (`apiClient`)**: Base URL defaults to `import.meta.env.VITE_API_URL || "/api"`.
- **Raw Fetch Calls (`fetch(...)`)**:
  - `AIChatWidget.tsx`: `fetch('/api/ai/chat/')`, `fetch('/api/ai/feedback/')`
  - `AIAdministrationPage.tsx`: `fetch("/api/ai/...")`
  - `SecureExamsPage.tsx`: `fetch('/api/odel/formal-exams/...')`
  - `ExamManagementPage.tsx`: `fetch('/api/odel/...')`

---

## 7. Render Configuration Affecting Networking
*Location: `edify-hub/render.yaml`*
- Service `horizon-backend-api` (type: web):
  - `ALLOWED_HOSTS: "*"`
  - `CORS_ALLOW_ALL_ORIGINS: "True"`
- Service `horizon-enterprise-portal` (type: web):
  - Rewrite rules redirecting `/api/*` to `https://horizon-backend-api.onrender.com/api/*` (Note: production URL target must point to `https://edify-hub-1.onrender.com/api/*`).
