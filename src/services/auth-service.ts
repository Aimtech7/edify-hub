import { loginAs, clearUser } from "@/lib/auth";
import type { AuthUser, Role, LoginCredentials } from "@/types";
import { apiClient, TOKEN_KEYS } from "./api-client";
import { USE_FIXTURES } from "./service-utils";

export const authService = {
  async login(role: Role, credentials: LoginCredentials): Promise<{ user: AuthUser }> {
    if (USE_FIXTURES) {
      const user = loginAs(role, credentials.username);
      localStorage.setItem(TOKEN_KEYS.ACCESS, "mock-access-token-12345");
      localStorage.setItem(TOKEN_KEYS.REFRESH, "mock-refresh-token-12345");
      return { user };
    }
    const { data } = await apiClient.post<{ user: AuthUser; access: string; refresh: string }>("/auth/login/", {
      role,
      ...credentials
    });
    localStorage.setItem(TOKEN_KEYS.ACCESS, data.access);
    localStorage.setItem(TOKEN_KEYS.REFRESH, data.refresh);
    return { user: data.user };
  },

  async logout(): Promise<void> {
    localStorage.removeItem(TOKEN_KEYS.ACCESS);
    localStorage.removeItem(TOKEN_KEYS.REFRESH);
    clearUser();
  },
};
