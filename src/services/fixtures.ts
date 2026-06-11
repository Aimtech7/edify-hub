import type { Payment } from "@/types";

export {
  INSTITUTION,
  ANNOUNCEMENTS,
  COURSES,
  TESTIMONIALS,
  STUDENTS,
  SUBJECTS,
  STUDENT_RESULTS,
  RECEIPTS,
  FEE_CATEGORIES,
  CLASSES,
  TEACHER_CLASSES,
  ATTENDANCE_RECENT,
  USERS,
  AUDIT_LOGS,
  FEE_STRUCTURE,
  currency,
} from "@/lib/sample-data";

export const ACADEMIC_YEARS = [
  { id: "ay-2025", label: "2025", start: "2025-01-06", end: "2025-11-21", active: true },
  { id: "ay-2024", label: "2024", start: "2024-01-08", end: "2024-11-22", active: false },
];

export const PAYMENTS: Payment[] = [
  { id: "pay-001", date: "2025-05-14", studentId: "s1", studentName: "Amani Wanjiru", admissionNo: "ADM-2024-1042", payer: "Mr. Wanjiru", amount: 25000, method: "M-Pesa", reference: "QGH7K2L9", notes: "", allocated: true },
  { id: "pay-002", date: "2025-05-12", studentId: "s2", studentName: "Baraka Odhiambo", admissionNo: "ADM-2024-1198", payer: "Mrs. Odhiambo", amount: 18000, method: "Bank", reference: "TRF-88201", notes: "", allocated: false },
  { id: "pay-003", date: "2025-05-10", studentId: "s3", studentName: "Cynthia Mutua", admissionNo: "ADM-2023-0561", payer: "Mr. Mutua", amount: 30000, method: "Cheque", reference: "CHQ-00412", notes: "", allocated: true },
];

export const REVENUE_TREND = [
  { month: "Jan", amount: 420000 },
  { month: "Feb", amount: 380000 },
  { month: "Mar", amount: 510000 },
  { month: "Apr", amount: 460000 },
  { month: "May", amount: 390000 },
];

export const TERM_PERFORMANCE = [
  { term: "Term 1 2024", mean: 72.4, position: 8 },
  { term: "Term 2 2024", mean: 75.1, position: 6 },
  { term: "Term 3 2024", mean: 77.8, position: 5 },
  { term: "Term 1 2025", mean: 79.4, position: 4 },
];

export const UPCOMING_EXAMS = [
  { subject: "Mathematics", date: "2025-07-01", time: "08:00", venue: "Main Hall" },
  { subject: "English", date: "2025-07-02", time: "10:00", venue: "Block B" },
  { subject: "Physics", date: "2025-07-03", time: "08:00", venue: "Lab Wing" },
];
