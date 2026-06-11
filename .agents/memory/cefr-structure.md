---
name: CEFR Academic Structure
description: DeutschAkademie German Language Institute — CEFR level system replacing all school class references.
---

# CEFR Academic Structure

**Why:** Institution converted from generic school ERP to German Language Training Institute. All "Form 1-4" / school class references replaced with CEFR levels A1→A2→B1→B2→C1→C2.

## Key data facts (sample-data.ts)
- Institution: `DeutschAkademie` (was "Horizon Academy")
- Student IDs use `DA-YYYY-NNNN` format (was `ADM-`)
- Instructors: Frau Müller (B2/C1), Herr Becker (A1/A2), Dr. Wagner (C1/C2)
- Student fields: `level: CefrLevel`, `batch`, `instructor`, `enrolledDate`, `expectedCompletion`, `progressionHistory: LevelEvent[]`
- `classroom` field kept for backward compat (alias = level)
- Fee categories: Course Fee, Exam Registration, Study Materials, Certificate Fee, Lab/Tech Fee
- Subjects (Fertigkeiten): Sprechen, Hören, Lesen, Schreiben, Grammatik, Wortschatz
- German grades: Sehr gut (≥90), Gut (≥75), Befriedigend (≥60), Ausreichend (≥45), Nicht bestanden (<45)

## New module: Language Levels (/app/levels)
- File: `src/pages/app/LevelsPage.tsx`
- Student view: visual CEFR journey timeline, progression history with scores/certs
- Teacher/Admin view: all students by level, batch management, promote button (A1→A2 etc.)
- Promote dialog confirms: student name, current → next level, instructor
- Route: accessible to student (read-only), teacher, admin
- Nav: appears in teacher sidebar as "Language Levels" and admin sidebar under "Academic"

## Level progression
- `LEVEL_ORDER = ["A1","A2","B1","B2","C1","C2"]`
- `nextLevel(lvl)` utility in LevelsPage returns the next in sequence or null for C2
- Each student has `progressionHistory: LevelEvent[]` with status: "completed"|"active"|"upcoming"
- Completed events include finalScore and certificateNo

## Pages updated for CEFR
- DashboardPage: student dash shows level/band/progression mini-timeline; admin shows enrollment by level
- StudentsPage: filter chips per CEFR level + band badges; shows batch, instructor, enrolled date
- MarksPage: select by CEFR level, not class name; German grade ratings
- AttendancePage: level selector with student count badge
- ResultsPage: shows Fertigkeiten (skills), German grade ratings, instructor remark in German
- FeeStructurePage: per CEFR level with Course Fee / Exam Reg / Materials / Certificate / Lab columns
- ReportsPage: level group performance + certification counts per level
- ProfilePage: shows level, batch, instructor, full progression history with certs

**How to apply:** Never use "Form X" or "class" terminology. Always reference `student.level` (CefrLevel). When filtering students, filter on `s.level`. Fee structure keyed by `level` not `classroom` (though `classroom` alias still exists for compat).
