import axios from "axios";

export const TOKEN_KEYS = {
  ACCESS: "horizon_access_token",
  REFRESH: "horizon_refresh_token",
};

export const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl) return "/api";
  const cleanUrl = envUrl.replace(/\/+$/, "");
  if (!cleanUrl.endsWith("/api")) {
    return `${cleanUrl}/api`;
  }
  return cleanUrl;
};

export const API_BASE_URL = getApiBaseUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor to append authorization bearer token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEYS.ACCESS);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh automatically
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Catch 401 errors and attempt token refresh
    if (
      error.response?.status === 401 && 
      !originalRequest._retry && 
      originalRequest.url !== "/auth/token/refresh/"
    ) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem(TOKEN_KEYS.REFRESH);
      
      if (refreshToken) {
        try {
          // Call Django REST Framework JWT token refresh endpoint
          const { data } = await axios.post<{ access: string }>(`${API_BASE_URL}/auth/token/refresh/`, {
            refresh: refreshToken,
          });
          
          localStorage.setItem(TOKEN_KEYS.ACCESS, data.access);
          originalRequest.headers.Authorization = `Bearer ${data.access}`;
          
          return apiClient(originalRequest);
        } catch (refreshError) {
          // If refresh fails, clear auth credentials and redirect to login
          localStorage.removeItem(TOKEN_KEYS.ACCESS);
          localStorage.removeItem(TOKEN_KEYS.REFRESH);
          localStorage.removeItem("horizon_auth_user");
          window.location.href = "/login/student?session_expired=true";
          return Promise.reject(refreshError);
        }
      }
    }
    
    return Promise.reject(error);
  }
);
