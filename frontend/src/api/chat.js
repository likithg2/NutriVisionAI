import api from "./axios.js";
export const sendMessage = (userId, message, history = []) => api.post("/api/chat", { userId, message, history });
export const getKitchenRecipe = (force = false) => api.post(`/api/chat/kitchen${force ? '?force=true' : ''}`);
export const getShoppingRecommendations = (force = false) => api.post(`/api/chat/recommendations${force ? '?force=true' : ''}`);
export const getDashboardSuggestions = (force = false) => api.get(`/api/chat/dashboard-suggestions${force ? '?force=true' : ''}`);
