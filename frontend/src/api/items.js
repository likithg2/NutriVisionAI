import api from "./axios.js";
export const getItems = (params) => api.get("/api/items", { params });
export const addItem = (data) => api.post("/api/items", data);
export const updateItem = (id, data) => api.put(`/api/items/${id}`, data);
export const deleteItem = (id) => api.delete(`/api/items/${id}`);
export const aiSearch = (query) => api.post("/api/items/ai-search", { query });
