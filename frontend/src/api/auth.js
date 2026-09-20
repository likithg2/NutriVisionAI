import api from "./axios.js";
export const login = (identifier, password) => api.post("/api/auth/login", { identifier, password });
export const signup = (data) => api.post("/api/auth/signup", data);
export const logout = () => api.post("/api/auth/logout").catch(() => {});
export const requestOtp = (identifier, action) => api.post("/api/auth/request-otp", { identifier, action });
export const loginOtp = (identifier, otp) => api.post("/api/auth/login-otp", { identifier, otp });
export const forgotPassword = (identifier) => api.post("/api/auth/forgot-password", { identifier });
export const resetPassword = (identifier, otp, password) => api.post("/api/auth/reset-password", { identifier, otp, password });
