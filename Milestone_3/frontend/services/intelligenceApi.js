// Uses the shared root api instance via @api Vite alias (resolves to frontend/src/utils/api.js)
// This ensures M3 pages share the JWT token and interceptors with the main application.
import api from '@api';

export const getCombinedAnalysis = async (sessionId) => {
  const response = await api.get(`/milestone3/analysis/${sessionId}`);
  return response.data;
};

export const getAnomalies = async (sessionId, filters = {}) => {
  const response = await api.get(`/milestone3/anomalies/${sessionId}`, { params: filters });
  return response.data;
};

export const getInjuryRisks = async (sessionId) => {
  const response = await api.get(`/milestone3/injury-risk/${sessionId}`);
  return response.data;
};

export const getRiskScore = async (sessionId) => {
  const response = await api.get(`/milestone3/risk-score/${sessionId}`);
  return response.data;
};

export const getRecommendations = async (sessionId, filters = {}) => {
  const response = await api.get(`/milestone3/recommendations/${sessionId}`, { params: filters });
  return response.data;
};
