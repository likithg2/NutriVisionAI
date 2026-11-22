import axios from "axios";

// In development, Vite's dev-server proxy forwards /api → http://localhost:5000
// In production, set VITE_API_BASE_URL to your deployed backend URL (e.g. https://api.yourdomain.com)
const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || "/" });

api.interceptors.request.use(config => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      // Don't redirect if we're already on the login page or if it's a login request
      if (window.location.pathname !== "/login" && !err.config.url.includes("/api/auth/login")) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export default api;
