import type { Role, AuthUser } from "@/types";
export type { Role, AuthUser };

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
  localStorage.setItem("user_name", u.name || "");
  localStorage.setItem("user_username", u.username || "");
  localStorage.setItem("user_role", u.role || "");
}

export function clearUser() {
  localStorage.removeItem(KEY);
  localStorage.removeItem("user_name");
  localStorage.removeItem("user_username");
  localStorage.removeItem("user_role");
}

export function loginAs(role: Role, username: string): AuthUser {
  const presets: Record<Role, AuthUser> = {
    student: {
      id: "stu-1042",
      name: "Amani Wanjiru",
      username: username || "DA-2024-1042",
      role: "student",
      admissionNo: "DA-2024-1042",
      classroom: "B2",
      level: "B2",
      email: "amani.w@deutschakademie.co.ke",
    },
    teacher: {
      id: "tea-201",
      name: "Frau Anna Müller",
      username: username || "amueller",
      role: "teacher",
      email: "a.mueller@deutschakademie.co.ke",
    },
    accountant: {
      id: "acc-12",
      name: "Grace Achieng",
      username: username || "gachieng",
      role: "accountant",
      email: "finance@deutschakademie.co.ke",
    },
    admin: {
      id: "adm-1",
      name: "System Administrator",
      username: username || "admin",
      role: "admin",
      email: "admin@deutschakademie.co.ke",
    },
    parent: {
      id: "par-501",
      name: "David Wanjiru (Guardian)",
      username: username || "dwanjiru",
      role: "parent",
      email: "david.wanjiru@gmail.com",
    },
    hr: {
      id: "hr-101",
      name: "Beatrix Otieno (HR Manager)",
      username: username || "botieno",
      role: "hr",
      email: "hr@deutschakademie.co.ke",
    },
    admissions: {
      id: "adm-ops-1",
      name: "Brian Kipkorir (Admissions)",
      username: username || "bkipkorir",
      role: "admissions",
      email: "admissions@deutschakademie.co.ke",
    },
    registrar: {
      id: "reg-1",
      name: "Dr. Elena Schmidt (Registrar)",
      username: username || "eschmidt",
      role: "registrar",
      email: "registrar@deutschakademie.co.ke",
    },
    library: {
      id: "lib-1",
      name: "Clara Mwangi (Librarian)",
      username: username || "cmwangi",
      role: "library",
      email: "library@deutschakademie.co.ke",
    },
    ict: {
      id: "ict-1",
      name: "Kevin Omondi (Systems Eng)",
      username: username || "komondi",
      role: "ict",
      email: "ict@deutschakademie.co.ke",
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
  parent: "/app/dashboard",
  hr: "/app/dashboard",
  admissions: "/app/dashboard",
  registrar: "/app/dashboard",
  library: "/app/dashboard",
  ict: "/app/dashboard",
};
