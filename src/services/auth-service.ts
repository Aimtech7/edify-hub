import { loginAs, clearUser } from "@/lib/auth";
import type { AuthUser, Role, LoginCredentials } from "@/types";

export const authService = {
  async login(role: Role, credentials: LoginCredentials): Promise<{ user: AuthUser }> {
    const user = loginAs(role, credentials.username);
    return { user };
  },
  async logout(): Promise<void> {
    clearUser();
  },
};
