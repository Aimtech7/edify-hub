export type Role = "student" | "teacher" | "accountant" | "admin";

export interface AuthUser {
  id: string;
  name: string;
  username: string;
  role: Role;
  email?: string;
  admissionNo?: string;
  classroom?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface Student {
  id: string;
  admissionNo: string;
  name: string;
  classroom: string;
  gender: "M" | "F";
  parent: string;
  phone: string;
  totalFees: number;
  paid: number;
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
  tuition: number;
  exam: number;
  library: number;
  activity: number;
  boarding: number;
}
