import axiosInstance from './axiosInstance';

/**
 * Sends Google ID token to the backend for verification and authentication
 * @param {string} token - Google ID Token (credential)
 * @param {string} [role] - User role (athlete or coach, optional)
 * @returns {Promise<object>} Auth response data containing JWT and user profile
 */
export const googleLogin = async (token, role) => {
  const response = await axiosInstance.post('/auth/google-login', { token, role });
  return response.data;
};
