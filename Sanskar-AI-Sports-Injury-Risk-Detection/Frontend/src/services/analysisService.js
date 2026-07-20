import axiosInstance from './axiosInstance';

export const runPoseAnalysis = async (video) => {
  const formData = new FormData();
  formData.append('video', video);

  const response = await axiosInstance.post('/ai/pose', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 180000,
  });

  return response?.data?.data;
};

