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
  CEFR_LEVELS,
  CEFR_LEVEL_INFO,
  BATCHES,
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
  { id: "pay-001", date: "2025-05-14", studentId: "s1", studentName: "Amani Wanjiru",  admissionNo: "DA-2024-1042", payer: "Mr. Wanjiru",  amount: 20000, method: "M-Pesa",  reference: "QGH7K2L9",  notes: "", allocated: true  },
  { id: "pay-002", date: "2025-05-12", studentId: "s3", studentName: "Cynthia Njoki",  admissionNo: "DA-2024-1044", payer: "Mr. Njoki",   amount: 18000, method: "Bank",    reference: "TRF-88201", notes: "", allocated: false },
  { id: "pay-003", date: "2025-05-10", studentId: "s6", studentName: "Felix Kiprop",   admissionNo: "DA-2023-0872", payer: "Mrs. Kiprop", amount: 20000, method: "Cheque",  reference: "CHQ-00412", notes: "", allocated: true  },
];

export const REVENUE_TREND = [
  { month: "Jan", amount: 280000 },
  { month: "Feb", amount: 320000 },
  { month: "Mar", amount: 410000 },
  { month: "Apr", amount: 375000 },
  { month: "May", amount: 290000 },
];

export const TERM_PERFORMANCE = [
  { term: "Module 1 2024",  mean: 72.4, position: 8 },
  { term: "Module 2 2024",  mean: 75.1, position: 6 },
  { term: "Module 3 2024",  mean: 78.8, position: 5 },
  { term: "Module 1 2025",  mean: 80.2, position: 3 },
];

export const UPCOMING_EXAMS = [
  { subject: "Sprechen",  date: "2025-07-01", time: "08:00", venue: "Room A" },
  { subject: "Hören",     date: "2025-07-02", time: "10:00", venue: "Lab Wing" },
  { subject: "Schreiben", date: "2025-07-03", time: "08:00", venue: "Room B" },
];
