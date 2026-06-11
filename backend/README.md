# Horizon Deutsch Training Institute LMS & Finance ERP - Backend

This directory houses the production-ready Python Django REST Framework backend for the **Horizon Deutsch Training Institute LMS & Finance ERP** system.

---

## Technical Stack
- **Framework**: Python 3.10, Django 4.2+, Django REST Framework
- **Authentication**: JWT (Simple JWT)
- **Database**: PostgreSQL (Dockerized / Production)
- **PDF Generation**: ReportLab (landscape Completion Certificates and Academic Report Cards)
- **API Documentation**: Swagger/OpenAPI (via `drf-yasg`)

---

## Getting Started

### Prerequisites
- Python 3.10+
- Docker & Docker Compose
- PostgreSQL (if running locally without Docker)

### 1. Local Development Setup (Manual)
If you prefer running the application directly on your local system:

1. **Create and Activate Virtual Environment**:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

2. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the `backend/` directory (you can copy `.env.example`):
   ```bash
   cp .env.example .env
   ```
   Define your Postgres database details, or leave them blank to fallback to SQLite locally.

4. **Generate & Apply Migrations**:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

5. **Seed Default Data**:
   Seeds CEFR levels (A1-C2), default staff credentials (admin, teacher, accountant), 2026 fee schedules, and sample cohorts:
   ```bash
   python manage.py seed_data
   ```

6. **Create a Superuser (Optional)**:
   ```bash
   python manage.py createsuperuser
   ```

7. **Run Development Server**:
   ```bash
   python manage.py runserver 8000
   ```
   The backend API will be available at `http://127.0.0.1:8000/`.

---

### 2. Docker Setup (Recommended)
You can deploy the complete stack (PostgreSQL and Django) using Docker Compose:

1. **Start Services**:
   ```bash
   docker-compose up -d --build
   ```
   This automatically:
   - Sets up a PostgreSQL 15 container.
   - Runs database migrations.
   - Seeds levels, fee structures, cohorts, and default users.
   - Launches Gunicorn server listening on port `8000`.

2. **Verify Containers are Running**:
   ```bash
   docker-compose ps
   ```

3. **Check Service Logs**:
   ```bash
   docker-compose logs -f
   ```

4. **Create a Superuser inside Docker**:
   ```bash
   docker-compose exec backend python manage.py createsuperuser
   ```

---

## Seeded Accounts for Testing
The `seed_data` command creates three default users for testing (passwords can be customized in `.env` or during setup):
- **Admin**: Username `admin` / Password `adminpassword`
- **Teacher**: Username `teacher` / Password `teacherpassword`
- **Accountant**: Username `accountant` / Password `accountantpassword`

---

## API Documentation
Once the server is running, you can access the interactive Swagger/OpenAPI documentation at:
- **Swagger UI**: [http://localhost:8000/swagger/](http://localhost:8000/swagger/)
- **ReDoc**: [http://localhost:8000/redoc/](http://localhost:8000/redoc/)

---

## Features & Core Workflows

### Role-Based Access Control
- `STUDENT`: Read-only access to own profile, own payments, published academic results, and achievement certificates.
- `TEACHER`: Full access to academic viewsets, marking bulk attendance, creating/publishing results.
- `ACCOUNTANT`: Full access to finance models, payment registration, allocations, receipt downloads, and reports.
- `ADMIN`: Unrestricted system permissions.

### Finance Payment Allocation Workflow
1. **Payment Received**: Payment is registered by an accountant (`status=PENDING_ALLOCATION`), automatically generating a sequential receipt number (e.g. `RCT-000001`) in `DRAFT` status.
2. **Allocation**: The accountant allocates the payment across categories (Tuition, Examination, Library, Activity, Registration, Other).
3. **Validation**: The allocation engine validates that the sum of the allocated amounts equals the payment amount *exactly*.
4. **Promotion**: Once validated, the payment status changes to `ALLOCATED` and the receipt is promoted to `FINAL`. The student's outstanding balance is dynamically computed.

### CEFR Language Levels
German language level tracks (`A1`, `A2`, `B1`, `B2`, `C1`, `C2`) dictate course fee structures and enrollment paths.
- Promotion history tracks students moving from one level to another.
- Results grade boundaries:
  - `>= 90.0` -> Sehr Gut (Very Good)
  - `>= 80.0` -> Gut (Good)
  - `>= 70.0` -> Befriedigend (Satisfactory)
  - `>= 60.0` -> Ausreichend (Sufficient)
  - `< 60.0`  -> Nicht Bestanden (Fail)
