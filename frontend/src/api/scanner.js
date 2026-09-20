import api from "./axios.js";
export const scanImage = (formData) => api.post("/api/ai/scan", formData);
export const estimateFood = (foodName, quantity) => api.post("/api/ai/estimate-food", { foodName, quantity });
