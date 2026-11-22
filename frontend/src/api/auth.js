import api from "./axios.js";

export const login = (identifier, password) => api.post("/api/auth/login", { identifier, password });
export const signup = (data) => api.post("/api/auth/signup", data);
export const logout = () => api.post("/api/auth/logout").catch(() => {});
export const forgotPassword = (identifier) => api.post("/api/auth/forgot-password", { identifier });
export const resetPassword = (identifier, password) => api.post("/api/auth/reset-password", { identifier, password });
