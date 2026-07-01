import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { authService } from "@/services/auth-service";
import type { AuthUser, LoginCredentials, Role } from "@/types";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (role: Role, credentials: LoginCredentials) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

const USER_KEY = "horizon_auth_user";
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      localStorage.setItem("user_name", user.name || "");
      localStorage.setItem("user_username", user.username || "");
      localStorage.setItem("user_role", user.role || "");
    } else {
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem("user_name");
      localStorage.removeItem("user_username");
      localStorage.removeItem("user_role");
    }
  }, [user]);

  const login = async (role: Role, credentials: LoginCredentials) => {
    setLoading(true);
    try {
      const res = await authService.login(role, credentials);
      setUser(res.user);
      return res.user;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
