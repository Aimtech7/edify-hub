// DeutschAkademie — German Language Training Institute
export const INSTITUTION = {
  name: "DeutschAkademie",
  tagline: "Mastering German, Opening Worlds",
  address: "Westlands, Nairobi, Kenya · Kenyatta Avenue Branch",
  phone: "+254 711 200 300",
  email: "info@deutschakademie.co.ke",
  motto: "Lernen · Wachsen · Verbinden",
  established: 2005,
  website: "www.deutschakademie.co.ke",
};

// CEFR Levels
export const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export type CefrLevel = typeof CEFR_LEVELS[number];

export const CEFR_LEVEL_INFO: Record<CefrLevel, { label: string; band: "Beginner" | "Intermediate" | "Advanced"; description: string; durationWeeks: number }> = {
  A1: { label: "A1 – Breakthrough",  band: "Beginner",      description: "Introduce yourself, ask and answer simple questions about personal details.",  durationWeeks: 10 },
  A2: { label: "A2 – Waystage",      band: "Beginner",      description: "Communicate in routine tasks requiring simple direct exchange of information.", durationWeeks: 10 },
  B1: { label: "B1 – Threshold",     band: "Intermediate",  description: "Deal with most situations likely to arise on trips to a German-speaking country.", durationWeeks: 12 },
  B2: { label: "B2 – Vantage",       band: "Intermediate",  description: "Interact with native speakers with a degree of fluency and spontaneity.",       durationWeeks: 12 },
  C1: { label: "C1 – Advanced",      band: "Advanced",      description: "Express ideas fluently and spontaneously without much obvious searching.",        durationWeeks: 16 },
  C2: { label: "C2 – Mastery",       band: "Advanced",      description: "Understand virtually everything heard or read; express precisely and fluently.",    durationWeeks: 16 },
};

// For backward compat with pages referencing CLASSES
export const CLASSES = CEFR_LEVELS as unknown as string[];

export const ANNOUNCEMENTS = [
  { id: 1, title: "Neue Kurse starten am 5. Mai", body: "New A1 and B1 batches begin enrollment. Limited seats available.", date: "2025-04-28", tag: "Enrollment" },
  { id: 2, title: "Goethe-Zertifikat Exam Prep — June 14", body: "Free exam preparation workshop for B2 and C1 candidates.", date: "2025-06-01", tag: "Exam" },
  { id: 3, title: "Cultural Day — Deutschlandsfest", body: "Celebrate German culture: food, music, film, and conversation.", date: "2025-06-20", tag: "Event" },
  { id: 4, title: "New Materials: StudyHub Access", body: "All students now have digital access to Schritte Plus Neu.", date: "2025-05-10", tag: "Resources" },
];

export const COURSES = [
  { code: "A1-A2", name: "Beginner German",      desc: "A1 + A2 modules. Perfect for absolute beginners. Focus on daily conversation and basics.", level: "A1 – A2" },
  { code: "B1-B2", name: "Intermediate German",  desc: "B1 + B2 modules. Travel, work, and study in German-speaking countries confidently.",      level: "B1 – B2" },
  { code: "C1-C2", name: "Advanced German",       desc: "C1 + C2 modules. Academic and professional fluency. Goethe-Zertifikat preparation.",      level: "C1 – C2" },
  { code: "EXAM",  name: "Exam Preparation",      desc: "Intensive exam prep for Goethe-Zertifikat, TestDaF, and TELC examinations.",               level: "B2 – C2" },
];

export const TESTIMONIALS = [
  { name: "Amani Wanjiru",    role: "B2 Graduate, 2024",   quote: "DeutschAkademie's structured levels helped me track my progress clearly. I now work at a German NGO in Nairobi." },
  { name: "Brian Otieno",     role: "C1 Candidate",        quote: "The instructors are exceptional. From zero German to C1 in 18 months — unbelievable." },
  { name: "Frau Schmidt",     role: "Partner Institution",  quote: "DeutschAkademie graduates consistently demonstrate strong conversational and written skills." },
];

// Student progress event
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
  level: CefrLevel;          // current active level
  classroom: string;         // alias for level (backward compat)
  batch: string;             // e.g. "2025-Batch-01"
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

export const STUDENTS: Student[] = [
  {
    id: "s1", admissionNo: "DA-2024-1042", name: "Amani Wanjiru", level: "B2", classroom: "B2",
    batch: "2024-Batch-03", instructor: "Frau Müller", enrolledDate: "2024-09-02", expectedCompletion: "2025-08-15",
    gender: "F", nationality: "Kenyan", phone: "+254 722 100 100", email: "amani.w@gmail.com",
    totalFees: 50000, paid: 37000,
    progressionHistory: [
      { level: "A1", status: "completed", enrolledDate: "2023-01-10", completedDate: "2023-03-25", finalScore: 88, certificateNo: "CERT-A1-2023-042" },
      { level: "A2", status: "completed", enrolledDate: "2023-04-01", completedDate: "2023-06-30", finalScore: 82, certificateNo: "CERT-A2-2023-042" },
      { level: "B1", status: "completed", enrolledDate: "2023-09-04", completedDate: "2024-01-15", finalScore: 79, certificateNo: "CERT-B1-2024-042" },
      { level: "B2", status: "active",    enrolledDate: "2024-09-02" },
    ],
  },
  {
    id: "s2", admissionNo: "DA-2024-1043", name: "Brian Otieno", level: "B2", classroom: "B2",
    batch: "2024-Batch-03", instructor: "Frau Müller", enrolledDate: "2024-09-02", expectedCompletion: "2025-08-15",
    gender: "M", nationality: "Kenyan", phone: "+254 722 100 101", email: "brian.o@gmail.com",
    totalFees: 50000, paid: 50000,
    progressionHistory: [
      { level: "A1", status: "completed", enrolledDate: "2023-01-10", completedDate: "2023-03-25", finalScore: 91, certificateNo: "CERT-A1-2023-043" },
      { level: "A2", status: "completed", enrolledDate: "2023-04-01", completedDate: "2023-06-30", finalScore: 87, certificateNo: "CERT-A2-2023-043" },
      { level: "B1", status: "completed", enrolledDate: "2023-09-04", completedDate: "2024-01-15", finalScore: 85, certificateNo: "CERT-B1-2024-043" },
      { level: "B2", status: "active",    enrolledDate: "2024-09-02" },
    ],
  },
  {
    id: "s3", admissionNo: "DA-2024-1044", name: "Cynthia Njoki", level: "A2", classroom: "A2",
    batch: "2025-Batch-01", instructor: "Herr Becker", enrolledDate: "2025-01-06", expectedCompletion: "2025-06-20",
    gender: "F", nationality: "Kenyan", phone: "+254 722 100 102", email: "cynthia.n@gmail.com",
    totalFees: 38000, paid: 18000,
    progressionHistory: [
      { level: "A1", status: "completed", enrolledDate: "2024-09-02", completedDate: "2024-12-10", finalScore: 76, certificateNo: "CERT-A1-2024-044" },
      { level: "A2", status: "active",    enrolledDate: "2025-01-06" },
    ],
  },
  {
    id: "s4", admissionNo: "DA-2024-1045", name: "Derrick Mwangi", level: "A2", classroom: "A2",
    batch: "2025-Batch-01", instructor: "Herr Becker", enrolledDate: "2025-01-06", expectedCompletion: "2025-06-20",
    gender: "M", nationality: "Kenyan", phone: "+254 722 100 103", email: "derrick.m@gmail.com",
    totalFees: 38000, paid: 10000,
    progressionHistory: [
      { level: "A1", status: "completed", enrolledDate: "2024-09-02", completedDate: "2024-12-10", finalScore: 71, certificateNo: "CERT-A1-2024-045" },
      { level: "A2", status: "active",    enrolledDate: "2025-01-06" },
    ],
  },
  {
    id: "s5", admissionNo: "DA-2023-0871", name: "Esther Achieng", level: "C1", classroom: "C1",
    batch: "2024-Batch-02", instructor: "Dr. Wagner", enrolledDate: "2024-05-06", expectedCompletion: "2025-09-30",
    gender: "F", nationality: "Kenyan", phone: "+254 722 100 104", email: "esther.a@gmail.com",
    totalFees: 55000, paid: 55000,
    progressionHistory: [
      { level: "A1", status: "completed", enrolledDate: "2021-09-01", completedDate: "2022-01-15", finalScore: 93 },
      { level: "A2", status: "completed", enrolledDate: "2022-02-01", completedDate: "2022-06-30", finalScore: 90 },
      { level: "B1", status: "completed", enrolledDate: "2022-09-01", completedDate: "2023-02-28", finalScore: 88 },
      { level: "B2", status: "completed", enrolledDate: "2023-03-01", completedDate: "2024-01-20", finalScore: 84, certificateNo: "CERT-B2-2024-871" },
      { level: "C1", status: "active",    enrolledDate: "2024-05-06" },
    ],
  },
  {
    id: "s6", admissionNo: "DA-2023-0872", name: "Felix Kiprop", level: "C1", classroom: "C1",
    batch: "2024-Batch-02", instructor: "Dr. Wagner", enrolledDate: "2024-05-06", expectedCompletion: "2025-09-30",
    gender: "M", nationality: "Ugandan", phone: "+254 722 100 105", email: "felix.k@gmail.com",
    totalFees: 55000, paid: 38000,
    progressionHistory: [
      { level: "B1", status: "completed", enrolledDate: "2022-09-01", completedDate: "2023-03-31", finalScore: 80 },
      { level: "B2", status: "completed", enrolledDate: "2023-04-01", completedDate: "2024-02-28", finalScore: 77, certificateNo: "CERT-B2-2024-872" },
      { level: "C1", status: "active",    enrolledDate: "2024-05-06" },
    ],
  },
  {
    id: "s7", admissionNo: "DA-2025-2101", name: "Grace Wambui", level: "A1", classroom: "A1",
    batch: "2025-Batch-02", instructor: "Herr Becker", enrolledDate: "2025-04-07", expectedCompletion: "2025-08-30",
    gender: "F", nationality: "Kenyan", phone: "+254 722 100 106", email: "grace.w@gmail.com",
    totalFees: 35000, paid: 17500,
    progressionHistory: [
      { level: "A1", status: "active", enrolledDate: "2025-04-07" },
    ],
  },
  {
    id: "s8", admissionNo: "DA-2025-2102", name: "Hassan Ali", level: "A1", classroom: "A1",
    batch: "2025-Batch-02", instructor: "Herr Becker", enrolledDate: "2025-04-07", expectedCompletion: "2025-08-30",
    gender: "M", nationality: "Tanzanian", phone: "+254 722 100 107", email: "hassan.a@gmail.com",
    totalFees: 35000, paid: 35000,
    progressionHistory: [
      { level: "A1", status: "active", enrolledDate: "2025-04-07" },
    ],
  },
];

// German language skills assessed
export const SUBJECTS = ["Sprechen", "Hören", "Lesen", "Schreiben", "Grammatik", "Wortschatz"];

export interface SubjectResult { subject: string; score: number; grade: string; remark: string; teacher: string }

export const STUDENT_RESULTS: SubjectResult[] = [
  { subject: "Sprechen",     score: 82, grade: "Gut",         remark: "Fließende Aussprache, kleine Fehler.",       teacher: "Frau Müller" },
  { subject: "Hören",        score: 76, grade: "Gut",         remark: "Gutes Textverständnis.",                    teacher: "Frau Müller" },
  { subject: "Lesen",        score: 84, grade: "Sehr gut",    remark: "Ausgezeichnetes Leseverständnis.",           teacher: "Frau Müller" },
  { subject: "Schreiben",    score: 79, grade: "Gut",         remark: "Kohärente Texte, Stil verbessert sich.",     teacher: "Frau Müller" },
  { subject: "Grammatik",    score: 88, grade: "Sehr gut",    remark: "Starke Kontrolle der Satzstruktur.",         teacher: "Frau Müller" },
  { subject: "Wortschatz",   score: 74, grade: "Befriedigend", remark: "Mehr Vokabeln lernen für C1-Niveau.",       teacher: "Frau Müller" },
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
  { id: "r1", receiptNo: "RCT-00451", date: "2025-05-12", studentId: "s1", studentName: "Amani Wanjiru", admissionNo: "DA-2024-1042",
    payer: "Mr. Wanjiru", method: "M-Pesa", reference: "SFA8KQ12M", amount: 20000,
    allocations: [{ category: "Course Fee", amount: 15000 }, { category: "Study Materials", amount: 3000 }, { category: "Lab/Tech Fee", amount: 2000 }] },
  { id: "r2", receiptNo: "RCT-00452", date: "2025-05-12", studentId: "s2", studentName: "Brian Otieno", admissionNo: "DA-2024-1043",
    payer: "Mrs. Otieno", method: "Bank", reference: "BNK-998812", amount: 50000,
    allocations: [{ category: "Course Fee", amount: 45000 }, { category: "Study Materials", amount: 3000 }, { category: "Certificate Fee", amount: 2000 }] },
  { id: "r3", receiptNo: "RCT-00453", date: "2025-05-13", studentId: "s3", studentName: "Cynthia Njoki", admissionNo: "DA-2024-1044",
    payer: "Mr. Njoki", method: "M-Pesa", reference: "SFB2LP74X", amount: 18000,
    allocations: [{ category: "Course Fee", amount: 16000 }, { category: "Study Materials", amount: 2000 }] },
  { id: "r4", receiptNo: "RCT-00454", date: "2025-05-14", studentId: "s4", studentName: "Derrick Mwangi", admissionNo: "DA-2024-1045",
    payer: "Mrs. Mwangi", method: "Cash", reference: "-", amount: 10000,
    allocations: [{ category: "Course Fee", amount: 10000 }] },
  { id: "r5", receiptNo: "RCT-00455", date: "2025-05-14", studentId: "s6", studentName: "Felix Kiprop", admissionNo: "DA-2023-0872",
    payer: "Mrs. Kiprop", method: "Cheque", reference: "CHQ-3320", amount: 20000,
    allocations: [{ category: "Course Fee", amount: 18000 }, { category: "Exam Registration", amount: 2000 }] },
];

export const FEE_CATEGORIES = ["Course Fee", "Exam Registration", "Study Materials", "Certificate Fee", "Lab/Tech Fee"] as const;

export const TEACHER_CLASSES = [
  { id: "c1", name: "B2", subject: "Alle Fertigkeiten",    students: 12, pending: 2 },
  { id: "c2", name: "C1", subject: "Alle Fertigkeiten",    students: 8,  pending: 0 },
  { id: "c3", name: "A2", subject: "Alle Fertigkeiten",    students: 15, pending: 5 },
];

export const ATTENDANCE_RECENT = [
  { date: "2025-05-12", classroom: "B2", present: 11, absent: 1 },
  { date: "2025-05-13", classroom: "B2", present: 12, absent: 0 },
  { date: "2025-05-14", classroom: "B2", present: 10, absent: 2 },
];

export const USERS = [
  { id: "u1", name: "Frau Anna Müller",   username: "amueller",      role: "Teacher",   status: "Active",   lastLogin: "2025-05-14 08:12" },
  { id: "u2", name: "Grace Achieng",       username: "gachieng",      role: "Accountant", status: "Active",   lastLogin: "2025-05-14 09:01" },
  { id: "u3", name: "Herr Klaus Becker",   username: "kbecker",       role: "Teacher",   status: "Active",   lastLogin: "2025-05-13 16:42" },
  { id: "u4", name: "Dr. Hans Wagner",     username: "hwagner",       role: "Teacher",   status: "Active",   lastLogin: "2025-05-14 10:05" },
  { id: "u5", name: "Amani Wanjiru",       username: "DA-2024-1042",  role: "Student",   status: "Active",   lastLogin: "2025-05-14 07:55" },
  { id: "u6", name: "Peter Ngugi",         username: "pngugi",        role: "Teacher",   status: "Disabled", lastLogin: "2025-04-30 11:08" },
];

export const AUDIT_LOGS = [
  { id: 1, ts: "2025-05-14 09:12", actor: "gachieng",  action: "Receipt RCT-00451 created",                     category: "Receipt" },
  { id: 2, ts: "2025-05-14 09:05", actor: "gachieng",  action: "Payment KES 20,000 recorded",                    category: "Payment" },
  { id: 3, ts: "2025-05-14 08:55", actor: "admin",     action: "User amueller password reset",                   category: "User" },
  { id: 4, ts: "2025-05-14 08:12", actor: "amueller",  action: "Login",                                          category: "Login" },
  { id: 5, ts: "2025-05-13 16:42", actor: "kbecker",   action: "Marks saved · A2 Batch-01 · Grammatik",          category: "Academic" },
  { id: 6, ts: "2025-05-13 10:00", actor: "admin",     action: "Student DA-2024-1042 promoted: B1 → B2",         category: "Academic" },
];

export const FEE_STRUCTURE = [
  { classroom: "A1", level: "A1", tuition: 35000, exam: 2000, library: 0, activity: 2000, boarding: 0, materials: 3000, certificate: 1500 },
  { classroom: "A2", level: "A2", tuition: 38000, exam: 2500, library: 0, activity: 2000, boarding: 0, materials: 3000, certificate: 1500 },
  { classroom: "B1", level: "B1", tuition: 42000, exam: 3000, library: 0, activity: 2500, boarding: 0, materials: 3500, certificate: 2000 },
  { classroom: "B2", level: "B2", tuition: 50000, exam: 4000, library: 0, activity: 3000, boarding: 0, materials: 4000, certificate: 2500 },
  { classroom: "C1", level: "C1", tuition: 55000, exam: 5000, library: 0, activity: 3500, boarding: 0, materials: 4500, certificate: 3000 },
  { classroom: "C2", level: "C2", tuition: 60000, exam: 6000, library: 0, activity: 4000, boarding: 0, materials: 5000, certificate: 3500 },
];

// Batches per level
export const BATCHES: Record<CefrLevel, string[]> = {
  A1: ["2025-Batch-02", "2025-Batch-03"],
  A2: ["2025-Batch-01", "2025-Batch-02"],
  B1: ["2024-Batch-04", "2025-Batch-01"],
  B2: ["2024-Batch-03", "2024-Batch-04"],
  C1: ["2024-Batch-02", "2024-Batch-03"],
  C2: ["2023-Batch-04", "2024-Batch-01"],
};

export function currency(n: number) {
  return "KES " + n.toLocaleString("en-KE");
}
