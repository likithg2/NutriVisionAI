import api from "./axios.js";
export const getMe = () => api.get("/api/users/me");
export const updateMe = (data) => api.put("/api/users/me", data);
export const changePassword = (data) => api.put("/api/users/me/password", data);
export const uploadAvatar = (formData) => api.post("/api/users/me/avatar", formData);
export const removeAvatar = () => api.delete("/api/users/me/avatar");
