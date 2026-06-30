import {
  LayoutDashboard,
  GraduationCap,
  FileBarChart2,
  Wallet,
  ReceiptText,
  User,
  Users,
  ClipboardEdit,
  CalendarCheck2,
  BarChart3,
  CreditCard,
  Layers3,
  FileSpreadsheet,
  Settings,
  ShieldCheck,
  BookCopy,
  ScrollText,
  TrendingUp,
  Award,
  BookOpen,
  MessageSquare,
  Briefcase,
  Library,
  ShieldAlert,
} from "lucide-react";
import type { Role } from "@/types";

export interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}
export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV: Record<Role, NavGroup[]> = {
  student: [
    {
      label: "Mein Kurs",
      items: [
        { to: "/app/dashboard", label: "Dashboard",      icon: LayoutDashboard },
        { to: "/app/player",    label: "E-Learning LMS", icon: BookCopy },
        { to: "/app/library",   label: "Digital Library", icon: Library },
        { to: "/app/lesson-resources", label: "Lesson Resources", icon: BookOpen },
        { to: "/app/knowledge-base", label: "Knowledge Base", icon: ScrollText },
        { to: "/app/communication", label: "Communication", icon: MessageSquare },
        { to: "/app/levels",    label: "My Progress",    icon: TrendingUp },
        { to: "/app/attendance", label: "My Attendance",  icon: CalendarCheck2 },
        { to: "/app/results",   label: "Results",        icon: FileBarChart2 },
        { to: "/app/certificates", label: "My Certificates", icon: Award },
        { to: "/app/secure-exams", label: "Formal Exams", icon: ShieldAlert },
      ],
    },
    {
      label: "Finanzen",
      items: [
        { to: "/app/finance",   label: "Fee Statement",  icon: Wallet },
        { to: "/app/receipts",  label: "My Receipts",    icon: ReceiptText },
      ],
    },
    {
      label: "Account",
      items: [{ to: "/app/profile", label: "Profile", icon: User }],
    },
  ],
  teacher: [
    {
      label: "Teaching",
      items: [
        { to: "/app/dashboard",  label: "Dashboard",        icon: LayoutDashboard },
        { to: "/app/admissions-queue", label: "Admissions Bridge", icon: Users },
        { to: "/app/odel-courses", label: "ODEL Courses",    icon: BookCopy },
        { to: "/app/lesson-resources", label: "Lesson Resources", icon: BookOpen },
        { to: "/app/knowledge-base", label: "Knowledge Base", icon: ScrollText },
        { to: "/app/library",    label: "Digital Library",  icon: Library },
        { to: "/app/communication", label: "Communication", icon: MessageSquare },
        { to: "/app/students",   label: "Students",          icon: Users },
        { to: "/app/levels",     label: "Language Levels",   icon: TrendingUp },
        { to: "/app/marks",      label: "Marks Entry",       icon: ClipboardEdit },
        { to: "/app/results",    label: "Results",           icon: FileBarChart2 },
        { to: "/app/certificates", label: "Certificates",     icon: Award },
        { to: "/app/exam-management", label: "Exam Management", icon: ShieldAlert },
      ],
    },
    {
      label: "Operations",
      items: [
        { to: "/app/attendance", label: "Attendance",        icon: CalendarCheck2 },
        { to: "/app/reports",    label: "Reports",           icon: BarChart3 },
      ],
    },
    {
      label: "Account",
      items: [{ to: "/app/profile", label: "Profile", icon: User }],
    },
  ],
  accountant: [
    {
      label: "Finance",
      items: [
        { to: "/app/dashboard",       label: "Dashboard",       icon: LayoutDashboard },
        { to: "/app/communication",   label: "Communication",   icon: MessageSquare },
        { to: "/app/payments",        label: "Payments",        icon: CreditCard },
        { to: "/app/allocations",     label: "Allocations",     icon: Layers3 },
        { to: "/app/receipts",        label: "Receipts",        icon: ReceiptText },
        { to: "/app/finance-reports", label: "Finance Reports", icon: FileSpreadsheet },
      ],
    },
    {
      label: "Account",
      items: [{ to: "/app/profile", label: "Profile", icon: User }],
    },
  ],
  admin: [
    {
      label: "Administration",
      items: [
        { to: "/app/dashboard", label: "Dashboard",       icon: LayoutDashboard },
        { to: "/app/admissions-queue", label: "Admissions Queue", icon: Users },
        { to: "/app/communication", label: "Communication Hub", icon: MessageSquare },
        { to: "/app/users",     label: "User Management", icon: Users },
        { to: "/app/roles",     label: "Roles",           icon: ShieldCheck },
        { to: "/app/automation-engine", label: "Automation Engine", icon: Layers3 },
        { to: "/app/command-center", label: "Executive BI", icon: BarChart3 },
      ],
    },
    {
      label: "DMS & AI Knowledge",
      items: [
        { to: "/app/storage-dashboard", label: "Storage Telemetry", icon: Layers3 },
        { to: "/app/lesson-resources", label: "Lesson Resources", icon: BookOpen },
        { to: "/app/knowledge-base", label: "Knowledge Base", icon: ScrollText },
      ],
    },
    {
      label: "Academic",
      items: [
        { to: "/app/odel-courses",  label: "ODEL Courses",     icon: BookCopy },
        { to: "/app/library",       label: "Digital Library",  icon: Library },
        { to: "/app/levels",        label: "Language Levels",  icon: TrendingUp },
        { to: "/app/academic",      label: "Academic Setup",   icon: BookCopy },
        { to: "/app/fee-structure", label: "Fee Structure",    icon: Wallet },
        { to: "/app/certificates",  label: "Certificates",     icon: Award },
        { to: "/app/exam-management", label: "Formal Exams",   icon: ShieldAlert },
      ],
    },
    {
      label: "System & HR",
      items: [
        { to: "/app/hr",         label: "HR Management", icon: Briefcase },
        { to: "/app/settings",   label: "Settings",      icon: Settings },
        { to: "/app/audit-logs", label: "Audit Logs",    icon: ScrollText },
      ],
    },
  ],
  parent: [
    {
      label: "Parent Portal",
      items: [
        { to: "/app/dashboard", label: "Portal Overview", icon: LayoutDashboard },
        { to: "/app/knowledge-base", label: "Knowledge Base & FAQs", icon: ScrollText },
        { to: "/app/receipts", label: "Fee Receipts", icon: ReceiptText },
        { to: "/app/communication", label: "Communication", icon: MessageSquare },
      ],
    },
  ],
  hr: [
    {
      label: "HR & Payroll",
      items: [
        { to: "/app/dashboard", label: "HR Dashboard", icon: LayoutDashboard },
        { to: "/app/hr", label: "Staff & Payroll", icon: Briefcase },
        { to: "/app/communication", label: "Communication", icon: MessageSquare },
        { to: "/app/profile", label: "My Profile", icon: User },
      ],
    },
  ],
  admissions: [
    {
      label: "Admissions Operations",
      items: [
        { to: "/app/dashboard", label: "Admissions KPI", icon: LayoutDashboard },
        { to: "/app/admissions-queue", label: "Admissions Bridge", icon: Users },
        { to: "/app/knowledge-base", label: "Handbooks & Policies", icon: ScrollText },
        { to: "/app/communication", label: "Applicant Messaging", icon: MessageSquare },
      ],
    },
    {
      label: "Account",
      items: [{ to: "/app/profile", label: "Profile", icon: User }],
    },
  ],
  registrar: [
    {
      label: "Enrollment & Records",
      items: [
        { to: "/app/dashboard", label: "Registrar Overview", icon: LayoutDashboard },
        { to: "/app/students", label: "Student Directory", icon: Users },
        { to: "/app/levels", label: "CEFR Progression", icon: TrendingUp },
        { to: "/app/certificates", label: "Certificates", icon: Award },
        { to: "/app/reports", label: "Academic Reports", icon: BarChart3 },
      ],
    },
    {
      label: "Account",
      items: [{ to: "/app/profile", label: "Profile", icon: User }],
    },
  ],
  library: [
    {
      label: "Digital Library Hub",
      items: [
        { to: "/app/dashboard", label: "Library Catalog", icon: LayoutDashboard },
        { to: "/app/library", label: "Manage Books & Media", icon: Library },
        { to: "/app/lesson-resources", label: "Lesson Resources", icon: BookOpen },
        { to: "/app/knowledge-base", label: "Knowledge Base", icon: ScrollText },
      ],
    },
    {
      label: "Account",
      items: [{ to: "/app/profile", label: "Profile", icon: User }],
    },
  ],
  ict: [
    {
      label: "System & Infrastructure",
      items: [
        { to: "/app/dashboard", label: "System Health", icon: LayoutDashboard },
        { to: "/app/storage-dashboard", label: "Storage Telemetry", icon: Layers3 },
        { to: "/app/users", label: "User Accounts", icon: Users },
        { to: "/app/settings", label: "System Settings", icon: Settings },
        { to: "/app/audit-logs", label: "Security Logs", icon: ScrollText },
      ],
    },
    {
      label: "Account",
      items: [{ to: "/app/profile", label: "Profile", icon: User }],
    },
  ],
};

export { GraduationCap };
