import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import type { Role } from "@/types";

/** Requires an authenticated user; otherwise redirects to the student login. */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) {
    return <Navigate to="/login/student" state={{ from: location.pathname }} replace />;
  }
  return <>{children}</>;
}

/** Requires the user's role to be in `allowed`; otherwise redirects to /unauthorized. */
export function RoleRoute({
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
