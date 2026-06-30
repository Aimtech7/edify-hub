# Horizon DTI System Demo Guide

Welcome to the **Horizon Deutsch Training Institute (DTI) System**. This application is an integrated learning management and ERP platform designed to handle students, academics, finance, and admissions.

This guide explains how to log into the different portals and outlines the key features available for each role.

---

## 1. Quick Start Logins

The database has been pre-populated with default users. You can access the respective dashboards using the credentials below:

### 👑 Super Admin / Administrator Portal
*Full access to the entire system including user management, roles, and global settings.*
- **URL**: `http://localhost:5000/login/admin`
- **Username**: `admin`
- **Password**: `admin`

### 👨‍🏫 Staff / Instructor Portal
*Access to academics, student management, attendance, and marks.*
- **URL**: `http://localhost:5000/login/staff`
- **Role Selection**: Instructor
- **Username**: `amueller`
- **Password**: `staff`

### 🎓 Student Portal
*Access to personal profile, results, certificates, and finance/receipts.*
- **URL**: `http://localhost:5000/login/student`
- **Admission Number**: `DA-2024-1042`
- **Password**: `student`

---

## 2. Core Features Overview

### Public Admissions Portal (`/admissions`)
- A public-facing 8-step wizard for prospective students to apply.
- Captures personal details, educational background, German language experience, study preferences, and document uploads.
- Automatically saves progress locally so applicants don't lose data if they refresh.
- Submits directly to the `Admissions Queue` in the backend.

### Administration & Operations (Admin)
- **User Management**: Add, remove, and manage staff and student accounts.
- **Academics Setup**: Define Campuses, Intakes, Cohorts, and Language Levels (e.g., A1, B2).
- **Finance Control**: Set fee structures and view overarching financial reports.
- **Audit Logs**: Track all system activities and changes for security and compliance.

### Academic Delivery (Staff)
- **Student Management**: View assigned students and track their progress.
- **Attendance**: Mark daily/weekly attendance for classes.
- **Marks & Grading**: Input test scores and CEFR language assessments.
- **Reports**: Generate performance reports for cohorts.

### Student Experience
- **Dashboard**: Quick overview of enrolled courses, attendance percentage, and outstanding fee balance.
- **Results**: View CEFR progression and individual module marks.
- **Finance**: View ledgers, fee structures, and download payment receipts.
- **Certificates**: Access and download digital certificates verified via the public verification portal (`/verify`).

---

## 3. Running the Application Locally

If you need to restart the application, ensure both the backend and frontend are running simultaneously:

**Backend (Django API)**
```bash
cd backend
python manage.py runserver 8000
```

**Frontend (Vite + React)**
```bash
npm run dev
```
*The frontend will run on port 5000, and the backend on port 8000.*
