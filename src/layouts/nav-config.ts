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
        { to: "/app/levels",    label: "My Progress",    icon: TrendingUp },
        { to: "/app/attendance", label: "My Attendance",  icon: CalendarCheck2 },
        { to: "/app/results",   label: "Results",        icon: FileBarChart2 },
        { to: "/app/certificates", label: "My Certificates", icon: Award },
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
        { to: "/app/students",   label: "Students",          icon: Users },
        { to: "/app/levels",     label: "Language Levels",   icon: TrendingUp },
        { to: "/app/marks",      label: "Marks Entry",       icon: ClipboardEdit },
        { to: "/app/results",    label: "Results",           icon: FileBarChart2 },
        { to: "/app/certificates", label: "Certificates",     icon: Award },
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
        { to: "/app/users",     label: "User Management", icon: Users },
        { to: "/app/roles",     label: "Roles",           icon: ShieldCheck },
      ],
    },
    {
      label: "Academic",
      items: [
        { to: "/app/levels",        label: "Language Levels",  icon: TrendingUp },
        { to: "/app/academic",      label: "Academic Setup",   icon: BookCopy },
        { to: "/app/fee-structure", label: "Fee Structure",    icon: Wallet },
        { to: "/app/certificates",  label: "Certificates",     icon: Award },
      ],
    },
    {
      label: "System",
      items: [
        { to: "/app/settings",   label: "Settings",   icon: Settings },
        { to: "/app/audit-logs", label: "Audit Logs", icon: ScrollText },
      ],
    },
  ],
};

export { GraduationCap };
