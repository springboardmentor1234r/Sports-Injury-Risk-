import axiosInstance from './axiosInstance';

export const getAthletesForAnalysis = async () => {
  const response = await axiosInstance.get('/athletes');
  return response?.data?.data ?? [];
};

export const runPoseAnalysis = async (video, athleteId) => {
  const formData = new FormData();
  formData.append('video', video);
  formData.append('athleteId', athleteId);

  const response = await axiosInstance.post('/ai/pose', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 180000,
  });

  return response?.data?.data;
};
