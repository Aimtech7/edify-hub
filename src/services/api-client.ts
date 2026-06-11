import axios from "axios";

export const TOKEN_KEYS = {
  ACCESS: "horizon_access_token",
  REFRESH: "horizon_refresh_token",
};

export const apiClient = axios.create({
  baseURL: "/api",
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
          const { data } = await axios.post<{ access: string }>("/api/auth/token/refresh/", {
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
