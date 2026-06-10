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

const KEY = "horizon_auth_user";

export function getUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function setUser(u: AuthUser) {
  localStorage.setItem(KEY, JSON.stringify(u));
}

export function clearUser() {
  localStorage.removeItem(KEY);
}

export function loginAs(role: Role, username: string): AuthUser {
  const presets: Record<Role, AuthUser> = {
    student: {
      id: "stu-1042",
      name: "Amani Wanjiru",
      username: username || "ADM-2024-1042",
      role: "student",
      admissionNo: "ADM-2024-1042",
      classroom: "Form 3 Blue",
      email: "amani.w@horizon.edu",
    },
    teacher: {
      id: "tea-201",
      name: "Mr. David Kimani",
      username: username || "dkimani",
      role: "teacher",
      email: "d.kimani@horizon.edu",
    },
    accountant: {
      id: "acc-12",
      name: "Grace Achieng",
      username: username || "gachieng",
      role: "accountant",
      email: "finance@horizon.edu",
    },
    admin: {
      id: "adm-1",
      name: "System Administrator",
      username: username || "admin",
      role: "admin",
      email: "admin@horizon.edu",
    },
  };
  const u = presets[role];
  setUser(u);
  return u;
}

export const roleHome: Record<Role, string> = {
  student: "/app/dashboard",
  teacher: "/app/dashboard",
  accountant: "/app/dashboard",
  admin: "/app/dashboard",
};
