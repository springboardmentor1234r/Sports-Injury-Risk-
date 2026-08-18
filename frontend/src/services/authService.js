import api from './api';

export const authService = {
  login: (credentials) => api.post('/auth/login', credentials).then(res => res.data),
  register: (userData) => api.post('/auth/register', userData).then(res => res.data),
  logout: () => api.post('/auth/logout').then(res => res.data),
  verifyEmail: (token) => api.post(`/auth/verify/${token}`).then(res => res.data),
};
