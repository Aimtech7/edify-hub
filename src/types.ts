export type Role = "student" | "teacher" | "accountant" | "admin" | "parent" | "hr" | "admissions" | "registrar" | "library" | "ict";

export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export interface AuthUser {
  id: string;
  name: string;
  username: string;
  role: Role;
  email?: string;
  admissionNo?: string;
  classroom?: string;
  level?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LevelEvent {
  level: CefrLevel;
  status: "completed" | "active" | "upcoming";
  enrolledDate: string;
  completedDate?: string;
  finalScore?: number;
  certificateNo?: string;
}

export interface Student {
  id: string;
  admissionNo: string;
  name: string;
  level: CefrLevel;
  classroom: string;
  batch: string;
  instructor: string;
  enrolledDate: string;
  expectedCompletion: string;
  gender: "M" | "F";
  nationality: string;
  phone: string;
  email: string;
  totalFees: number;
  paid: number;
  progressionHistory: LevelEvent[];
}

export interface SubjectResult {
  subject: string;
  score: number;
  grade: string;
  remark: string;
  teacher: string;
}

export interface TermPerformance {
  term: string;
  mean: number;
  position: number;
}

export interface UpcomingExam {
  subject: string;
  date: string;
  time: string;
  venue: string;
}

export interface Allocation {
  category: string;
  amount: number;
}

export interface Receipt {
  id: string;
  receiptNo: string;
  date: string;
  studentId: string;
  studentName: string;
  admissionNo: string;
  payer: string;
  amount: number;
  method: string;
  reference: string;
  allocations: Allocation[];
}

export type PaymentMethod = "M-Pesa" | "Cash" | "Bank" | "Cheque";

export interface Payment {
  id: string;
  date: string;
  studentId: string;
  studentName: string;
  admissionNo: string;
  payer: string;
  amount: number;
  method: PaymentMethod;
  reference: string;
  notes?: string;
  allocated: boolean;
}

export interface FeeStructure {
  classroom: string;
  level: string;
  tuition: number;
  exam: number;
  library: number;
  activity: number;
  boarding: number;
  materials?: number;
  certificate?: number;
}

export interface ParentChildSummary {
  id: string;
  admissionNo: string;
  name: string;
  level: CefrLevel;
  status: string;
  totalFees: number;
  paid: number;
  attendanceRate: number;
}

export interface ParentGuardian {
  id: string;
  username: string;
  email: string;
  phone: string;
  relationship: string;
  children: ParentChildSummary[];
}
