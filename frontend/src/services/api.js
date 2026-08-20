import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('athletiq_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Auth Expired / Forbidden Errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('athletiq_token');
      localStorage.removeItem('athletiq_user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Authentication APIs
export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  getMe: () => API.get('/auth/me'),
};

// Athlete APIs
export const athleteAPI = {
  getAll: (params) => API.get('/athletes', { params }),
  getMyProfile: () => API.get('/athletes/me'),
  getById: (id) => API.get(`/athletes/${id}`),
  create: (data) => API.post('/athletes', data),
  update: (id, data) => API.put(`/athletes/${id}`, data),
  delete: (id) => API.delete(`/athletes/${id}`),
};

// Video & AI Analysis APIs
export const videoAPI = {
  upload: (formData) => API.post('/videos/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  analyze: (formData) => API.post('/videos/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

// Analysis Records APIs
export const analysisAPI = {
  getAll: (params) => API.get('/analyses', { params }),
  getById: (id) => API.get(`/analyses/${id}`),
  delete: (id) => API.delete(`/analyses/${id}`),
};

// Recommendation APIs
export const recommendationAPI = {
  getAll: (params) => API.get('/recommendations', { params }),
  updateStatus: (id, status) => API.put(`/recommendations/${id}/status`, { status_val: status }),
};

// Notification APIs
export const notificationAPI = {
  getAll: () => API.get('/notifications'),
  markRead: (id) => API.put(`/notifications/${id}/read`),
  markAllRead: () => API.put('/notifications/read-all'),
};

// Report APIs
export const reportAPI = {
  getAll: () => API.get('/reports'),
  getById: (id) => API.get(`/reports/${id}`),
};

// System & Admin APIs
export const systemAPI = {
  getHealth: () => API.get('/system/health'),
  getStats: () => API.get('/system/stats'),
  getUsers: () => API.get('/system/users'),
  updateUserStatus: (userId, isActive) => API.put(`/system/users/${userId}/status?is_active=${isActive}`),
  deleteUser: (userId) => API.delete(`/system/users/${userId}`),
};

export default API;
