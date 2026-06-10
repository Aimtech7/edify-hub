// Sample data shared across portals
export const INSTITUTION = {
  name: "Horizon Academy",
  tagline: "Empowering Tomorrow's Leaders",
  address: "P.O. Box 4521 - 00100, Nairobi, Kenya",
  phone: "+254 711 200 300",
  email: "info@horizon.edu",
  motto: "Knowledge · Integrity · Excellence",
  established: 1998,
};

export const ANNOUNCEMENTS = [
  { id: 1, title: "Term 2 opens on May 5th", body: "All students should report by 8:00 AM.", date: "2025-04-28", tag: "Academic" },
  { id: 2, title: "Parents' Day - June 14th", body: "Annual parents' day will be held in the main hall.", date: "2025-06-01", tag: "Event" },
  { id: 3, title: "Mid-term exams begin July 1st", body: "Revision timetable shared on the portal.", date: "2025-06-20", tag: "Exam" },
];

export const COURSES = [
  { code: "SEC", name: "Secondary School Programme", desc: "KCSE-focused, 4-year programme with strong sciences and humanities tracks.", level: "Form 1 - 4" },
  { code: "IGC", name: "Cambridge IGCSE", desc: "Internationally recognised curriculum with personalised learning.", level: "Year 9 - 11" },
  { code: "TVT", name: "Technical & Vocational", desc: "Practical pathways: ICT, Electrical, Mechanical, Hospitality.", level: "Certificate / Diploma" },
  { code: "BRD", name: "Boarding Programme", desc: "Modern hostels with 24/7 wellness support and study halls.", level: "All levels" },
];

export const TESTIMONIALS = [
  { name: "Faith Mwende", role: "Alumna, 2022", quote: "Horizon shaped my discipline and curiosity. I'm now pursuing Medicine at UoN." },
  { name: "Brian Otieno", role: "Parent", quote: "Transparent fee tracking and timely reports - the portal is a game changer." },
  { name: "Mrs. Karanja", role: "Teacher", quote: "Marks entry that used to take days now takes a single afternoon." },
];

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

export const STUDENTS: Student[] = [
  { id: "s1", admissionNo: "ADM-2024-1042", name: "Amani Wanjiru", classroom: "Form 3 Blue", gender: "F", parent: "Mr. Wanjiru", phone: "+254 722 100 100", totalFees: 85000, paid: 62000 },
  { id: "s2", admissionNo: "ADM-2024-1043", name: "Brian Otieno", classroom: "Form 3 Blue", gender: "M", parent: "Mrs. Otieno", phone: "+254 722 100 101", totalFees: 85000, paid: 85000 },
  { id: "s3", admissionNo: "ADM-2024-1044", name: "Cynthia Njoki", classroom: "Form 3 Blue", gender: "F", parent: "Mr. Njoki", phone: "+254 722 100 102", totalFees: 85000, paid: 41000 },
  { id: "s4", admissionNo: "ADM-2024-1045", name: "Derrick Mwangi", classroom: "Form 3 Blue", gender: "M", parent: "Mrs. Mwangi", phone: "+254 722 100 103", totalFees: 85000, paid: 30000 },
  { id: "s5", admissionNo: "ADM-2023-0871", name: "Esther Achieng", classroom: "Form 4 Red", gender: "F", parent: "Mr. Achieng", phone: "+254 722 100 104", totalFees: 92000, paid: 92000 },
  { id: "s6", admissionNo: "ADM-2023-0872", name: "Felix Kiprop", classroom: "Form 4 Red", gender: "M", parent: "Mrs. Kiprop", phone: "+254 722 100 105", totalFees: 92000, paid: 70000 },
  { id: "s7", admissionNo: "ADM-2025-2101", name: "Grace Wambui", classroom: "Form 1 Green", gender: "F", parent: "Mr. Wambui", phone: "+254 722 100 106", totalFees: 78000, paid: 50000 },
  { id: "s8", admissionNo: "ADM-2025-2102", name: "Hassan Ali", classroom: "Form 1 Green", gender: "M", parent: "Mrs. Ali", phone: "+254 722 100 107", totalFees: 78000, paid: 78000 },
];

export const SUBJECTS = ["Mathematics", "English", "Kiswahili", "Physics", "Chemistry", "Biology", "History", "Geography"];

export interface SubjectResult { subject: string; score: number; grade: string; remark: string; teacher: string }

export const STUDENT_RESULTS: SubjectResult[] = [
  { subject: "Mathematics", score: 82, grade: "A-", remark: "Excellent grasp of algebra.", teacher: "Mr. Kimani" },
  { subject: "English", score: 76, grade: "B+", remark: "Strong essays, watch grammar.", teacher: "Ms. Otieno" },
  { subject: "Kiswahili", score: 71, grade: "B", remark: "Improving steadily.", teacher: "Mwl. Hamisi" },
  { subject: "Physics", score: 84, grade: "A-", remark: "Top of class in mechanics.", teacher: "Mr. Mutua" },
  { subject: "Chemistry", score: 79, grade: "B+", remark: "Good lab work.", teacher: "Mrs. Njeri" },
  { subject: "Biology", score: 88, grade: "A", remark: "Outstanding.", teacher: "Mr. Owino" },
  { subject: "History", score: 74, grade: "B", remark: "Engage more in discussions.", teacher: "Ms. Wairimu" },
  { subject: "Geography", score: 81, grade: "A-", remark: "Excellent map work.", teacher: "Mr. Kuria" },
];

export interface Receipt {
  id: string;
  receiptNo: string;
  date: string;
  studentId: string;
  studentName: string;
  admissionNo: string;
  payer: string;
  method: "Cash" | "M-Pesa" | "Bank" | "Cheque";
  reference: string;
  amount: number;
  allocations: { category: string; amount: number }[];
}

export const RECEIPTS: Receipt[] = [
  { id: "r1", receiptNo: "RCT-00451", date: "2025-05-12", studentId: "s1", studentName: "Amani Wanjiru", admissionNo: "ADM-2024-1042", payer: "Mr. Wanjiru", method: "M-Pesa", reference: "SFA8KQ12M", amount: 25000,
    allocations: [{ category: "Tuition", amount: 18000 }, { category: "Examination", amount: 3000 }, { category: "Library", amount: 1000 }, { category: "Activity Fee", amount: 3000 }] },
  { id: "r2", receiptNo: "RCT-00452", date: "2025-05-12", studentId: "s2", studentName: "Brian Otieno", admissionNo: "ADM-2024-1043", payer: "Mrs. Otieno", method: "Bank", reference: "BNK-998812", amount: 40000,
    allocations: [{ category: "Tuition", amount: 30000 }, { category: "Boarding", amount: 10000 }] },
  { id: "r3", receiptNo: "RCT-00453", date: "2025-05-13", studentId: "s3", studentName: "Cynthia Njoki", admissionNo: "ADM-2024-1044", payer: "Mr. Njoki", method: "M-Pesa", reference: "SFB2LP74X", amount: 15000,
    allocations: [{ category: "Tuition", amount: 12000 }, { category: "Activity Fee", amount: 3000 }] },
  { id: "r4", receiptNo: "RCT-00454", date: "2025-05-14", studentId: "s4", studentName: "Derrick Mwangi", admissionNo: "ADM-2024-1045", payer: "Mrs. Mwangi", method: "Cash", reference: "-", amount: 10000,
    allocations: [{ category: "Tuition", amount: 10000 }] },
  { id: "r5", receiptNo: "RCT-00455", date: "2025-05-14", studentId: "s6", studentName: "Felix Kiprop", admissionNo: "ADM-2023-0872", payer: "Mrs. Kiprop", method: "Cheque", reference: "CHQ-3320", amount: 20000,
    allocations: [{ category: "Tuition", amount: 14000 }, { category: "Boarding", amount: 6000 }] },
];

export const FEE_CATEGORIES = ["Tuition", "Examination", "Library", "Activity Fee", "Boarding", "Other Charges"] as const;

export const CLASSES = ["Form 1 Green", "Form 2 Yellow", "Form 3 Blue", "Form 4 Red"];

export const TEACHER_CLASSES = [
  { id: "c1", name: "Form 3 Blue", subject: "Mathematics", students: 32, pending: 4 },
  { id: "c2", name: "Form 4 Red", subject: "Mathematics", students: 28, pending: 0 },
  { id: "c3", name: "Form 1 Green", subject: "Mathematics", students: 35, pending: 12 },
];

export const ATTENDANCE_RECENT = [
  { date: "2025-05-12", classroom: "Form 3 Blue", present: 30, absent: 2 },
  { date: "2025-05-13", classroom: "Form 3 Blue", present: 32, absent: 0 },
  { date: "2025-05-14", classroom: "Form 3 Blue", present: 29, absent: 3 },
];

export const USERS = [
  { id: "u1", name: "Mr. David Kimani", username: "dkimani", role: "Teacher", status: "Active", lastLogin: "2025-05-14 08:12" },
  { id: "u2", name: "Grace Achieng", username: "gachieng", role: "Accountant", status: "Active", lastLogin: "2025-05-14 09:01" },
  { id: "u3", name: "Mary Wairimu", username: "mwairimu", role: "Teacher", status: "Active", lastLogin: "2025-05-13 16:42" },
  { id: "u4", name: "James Otieno", username: "jotieno", role: "Teacher", status: "Disabled", lastLogin: "2025-04-30 11:08" },
  { id: "u5", name: "Amani Wanjiru", username: "ADM-2024-1042", role: "Student", status: "Active", lastLogin: "2025-05-14 07:55" },
];

export const AUDIT_LOGS = [
  { id: 1, ts: "2025-05-14 09:12", actor: "gachieng", action: "Receipt RCT-00451 created", category: "Receipt" },
  { id: 2, ts: "2025-05-14 09:05", actor: "gachieng", action: "Payment KES 25,000 recorded", category: "Payment" },
  { id: 3, ts: "2025-05-14 08:55", actor: "admin", action: "User dkimani password reset", category: "User" },
  { id: 4, ts: "2025-05-14 08:12", actor: "dkimani", action: "Login", category: "Login" },
  { id: 5, ts: "2025-05-13 16:42", actor: "mwairimu", action: "Marks saved for Form 3 Blue · History", category: "Academic" },
];

export const FEE_STRUCTURE = [
  { classroom: "Form 1 Green", tuition: 55000, exam: 4000, library: 2000, activity: 5000, boarding: 12000 },
  { classroom: "Form 2 Yellow", tuition: 58000, exam: 4000, library: 2000, activity: 5000, boarding: 12000 },
  { classroom: "Form 3 Blue", tuition: 60000, exam: 5000, library: 2000, activity: 6000, boarding: 12000 },
  { classroom: "Form 4 Red", tuition: 65000, exam: 6000, library: 2000, activity: 7000, boarding: 12000 },
];

export function currency(n: number) {
  return "KES " + n.toLocaleString("en-KE");
}
