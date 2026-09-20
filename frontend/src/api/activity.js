import api from "./axios.js";
export const getActivity = (params) => api.get("/api/activity", { params });
