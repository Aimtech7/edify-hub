import type { Role } from "@/types";

export const roleHome: Record<Role, string> = {
  student: "/app/dashboard",
  teacher: "/app/dashboard",
  accountant: "/app/dashboard",
  admin: "/app/dashboard",
  parent: "/app/dashboard",
  hr: "/app/dashboard",
};

export const roleLabel: Record<Role, string> = {
  student: "Student",
  teacher: "Teacher",
  accountant: "Accountant",
  admin: "Administrator",
  parent: "Parent / Guardian",
  hr: "HR Manager",
};

/**
 * Defines which roles may access each app route. Used by RoleRoute guards.
 * Finance modules (payments, allocations) are accountant-only. Receipts are
 * available to accountants (full management) and students (own receipts).
 */
export const routeAccess: Record<string, Role[]> = {
  "/app/dashboard": ["student", "teacher", "accountant", "admin", "parent", "hr"],
  "/app/profile": ["student", "teacher", "accountant", "admin", "parent", "hr"],
  "/app/communication": ["student", "teacher", "accountant", "admin", "parent", "hr"],
  "/app/hr": ["admin", "hr"],
  // Student / Parent
  "/app/results": ["student", "teacher", "parent"],
  "/app/finance": ["student", "parent"],
  "/app/receipts": ["student", "accountant", "parent"],
  // Teacher
  "/app/students": ["teacher", "admin", "parent"],
  "/app/marks": ["teacher"],
  "/app/attendance": ["teacher"],
  "/app/reports": ["teacher"],
  // Accountant (finance-only)
  "/app/payments": ["accountant"],
  "/app/allocations": ["accountant"],
  "/app/finance-reports": ["accountant"],
  // Admin
  "/app/users": ["admin"],
  "/app/roles": ["admin"],
  "/app/academic": ["admin"],
  "/app/fee-structure": ["admin"],
  "/app/settings": ["admin"],
  "/app/audit-logs": ["admin"],
};
