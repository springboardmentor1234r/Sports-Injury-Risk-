import axios from 'axios';

// Create Axios Instance pointing to FastAPI local server
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject JWT Authorization Token automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to catch 401 Unauthorized errors and execute silent refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          // Request a new access token using raw axios to bypass standard interceptor
          const res = await axios.post(`${API_URL}/api/auth/refresh`, {
            refresh_token: refreshToken
          });
          const newAccessToken = res.data.access_token;
          localStorage.setItem('access_token', newAccessToken);
          
          // Re-attach token and replay original request
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } catch (refreshErr) {
          console.error("Session refresh expired, forcing logout:", refreshErr);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user_role');
          // Dispatch a custom event to alert AuthProvider to wipe state
          window.dispatchEvent(new Event('auth_session_expired'));
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (userData) => api.post('/api/auth/register', userData),
  login: async (email, password) => {
    const params = new URLSearchParams();
    params.append('username', email);
    params.append('password', password);
    const res = await api.post('/api/auth/login', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    // Cache refresh token on success
    if (res.data.refresh_token) {
      localStorage.setItem('refresh_token', res.data.refresh_token);
    }
    return res;
  },
  getMe: () => api.get('/api/auth/me'),
  logout: () => api.post('/api/auth/logout'),
  verifyEmail: (email, token) => api.post('/api/auth/verify', { email, token }),
  forgotPassword: (email) => api.post('/api/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) => api.post('/api/auth/reset-password', { token, new_password: newPassword }),
};

export const athleteAPI = {
  getMyProfile: () => api.get('/api/athletes/profile'),
  updateMyProfile: (profileData) => api.put('/api/athletes/profile', profileData),
  getSpecificProfile: (id) => api.get(`/api/athletes/profile/${id}`),
  listAllAthletes: () => api.get('/api/athletes'),
};

export const injuryAPI = {
  logInjury: (injuryData, athleteId = null) => {
    const url = athleteId ? `/api/injuries?athlete_id=${athleteId}` : '/api/injuries';
    return api.post(url, injuryData);
  },
  getInjuries: (athleteId = null) => {
    const url = athleteId ? `/api/injuries?athlete_id=${athleteId}` : '/api/injuries';
    return api.get(url);
  },
};

export const trainingAPI = {
  logTraining: (trainingData, athleteId = null) => {
    const url = athleteId ? `/api/training?athlete_id=${athleteId}` : '/api/training';
    return api.post(url, trainingData);
  },
  getTrainingLogs: (athleteId = null) => {
    const url = athleteId ? `/api/training?athlete_id=${athleteId}` : '/api/training';
    return api.get(url);
  },
};

export const videoAPI = {
  uploadVideo: (formData) => {
    return api.post('/api/videos/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  getVideos: (athleteId = null) => {
    const url = athleteId ? `/api/videos?athlete_id=${athleteId}` : '/api/videos';
    return api.get(url);
  },
  deleteVideo: (id) => api.delete(`/api/videos/${id}`),
};

export const datasetAPI = {
  listDatasets: () => api.get('/api/datasets'),
  getDataset: (id) => api.get(`/api/datasets/${id}`),
  mockIngest: (id, sampleCount) => api.post(`/api/datasets/mock-ingest/${id}?sample_count=${sampleCount}`),
};

export const reportAPI = {
  getCSVDownloadUrl: (athleteId) => `${API_URL}/api/reports/csv/${athleteId}?token=${localStorage.getItem('access_token')}`,
  getHTMLDownloadUrl: (athleteId) => `${API_URL}/api/reports/pdf/${athleteId}?token=${localStorage.getItem('access_token')}`,
};

export const adminAPI = {
  getStats: () => api.get('/api/admin/stats'),
};

export const intelligenceAPI = {
  getAssessment: (athleteId) => api.get(`/api/intelligence/athletes/${athleteId}`),
  reassess: (athleteId) => api.post(`/api/intelligence/athletes/${athleteId}/assess`),
  getExecutiveDashboard: () => api.get('/api/intelligence/executive'),
};

export default api;
