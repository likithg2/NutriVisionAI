import api from "./axios.js";

export const getNotifications = (params = {}) => api.get("/api/notifications", { params });
export const getUnreadCount = () => api.get("/api/notifications/unread-count");
export const markAsRead = (id) => api.post("/api/notifications/mark-read", { notificationId: id });
export const markMany = (data) => api.patch("/api/notifications/mark", data);
