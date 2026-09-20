import api from "./axios.js";
export const searchUSDA = (query) => api.get("/api/usda", { params: { query } });
