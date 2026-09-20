import api from "./axios.js";
export const getDashboard = () => api.get("/api/analytics/dashboard");
export const getCategorySummary = () => api.get("/api/analytics/category-summary");
export const getExpiryStats = () => api.get("/api/analytics/expiry-stats");
