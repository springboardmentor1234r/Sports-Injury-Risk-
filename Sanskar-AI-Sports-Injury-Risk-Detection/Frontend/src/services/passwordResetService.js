import axiosInstance from './axiosInstance';

export const requestPasswordReset = async (email) => {
  const response = await axiosInstance.post('/auth/forgot-password', { email });
  return response.data;
};

export const verifyResetOtp = async (email, otp) => {
  const response = await axiosInstance.post('/auth/verify-reset-otp', { email, otp });
  return response.data;
};

export const resetPassword = async (email, otp, password) => {
  const response = await axiosInstance.post('/auth/reset-password', { email, otp, password });
  return response.data;
};
