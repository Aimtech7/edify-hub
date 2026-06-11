import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import type { Role } from "@/types";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) {
    return <Navigate to="/login/student" state={{ from: location.pathname }} replace />;
  }
  return <>{children}</>;
}

export function RoleProtectedRoute({
  allowed,
  children,
}: {
  allowed: Role[];
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) {
    return <Navigate to="/login/student" state={{ from: location.pathname }} replace />;
  }
  if (!allowed.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  return <>{children}</>;
}

export { RoleProtectedRoute as RoleRoute };
