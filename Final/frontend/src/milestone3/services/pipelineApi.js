import api from '../../../frontend/src/utils/api';

export const runPipeline = async (sessionId) => {
  const response = await api.post(`/milestone3/pipeline/${sessionId}/run`);
  return response.data;
};

export const getPipelineStatus = async (sessionId) => {
  const response = await api.get(`/milestone3/pipeline/${sessionId}/status`);
  return response.data;
};

export const getPipelineResults = async (sessionId) => {
  const response = await api.get(`/milestone3/pipeline/${sessionId}/results`);
  return response.data;
};
