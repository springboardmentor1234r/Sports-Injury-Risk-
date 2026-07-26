import axiosInstance from './axiosInstance';

export const getAnalysisHistory = async (filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, value);
  });
  const response = await axiosInstance.get(`/analyses?${params.toString()}`);
  return response?.data?.data;
};

export const getAnalysisHistoryById = async (id) => {
  const response = await axiosInstance.get(`/analyses/${id}`);
  return response?.data?.data;
};

export const deleteAnalysisHistory = async (id) => axiosInstance.delete(`/analyses/${id}`);

