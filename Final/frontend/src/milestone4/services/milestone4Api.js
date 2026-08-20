// Uses the shared root api instance via @api Vite alias (resolves to frontend/src/utils/api.js)
// This ensures M4 pages share the JWT token and interceptors with the main application.
import api from '@api';

export const getReport = async (sessionId) => {
  const response = await api.get(`/milestone4/reports/${sessionId}`);
  return response.data;
};

export const generateReport = async (sessionId) => {
  const response = await api.post(`/milestone4/reports/${sessionId}/generate`);
  return response.data;
};

export const getHistory = async (athleteId, params = {}) => {
  const response = await api.get(`/milestone4/history/${athleteId}`, { params });
  return response.data;
};

export const getNotifications = async (athleteId, params = {}) => {
  const response = await api.get(`/milestone4/notifications/${athleteId}`, { params });
  return response.data;
};

export const markNotificationRead = async (notificationId) => {
  const response = await api.patch(`/milestone4/notifications/${notificationId}/read`);
  return response.data;
};

export const evaluateNotifications = async (sessionId) => {
  const response = await api.post(`/milestone4/notifications/${sessionId}/evaluate`);
  return response.data;
};
