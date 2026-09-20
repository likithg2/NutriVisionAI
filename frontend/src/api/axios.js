import axios from "axios";

const api = axios.create({ baseURL: "/" });

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
