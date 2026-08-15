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

// Interceptor to catch 401 Unauthorized errors and wipe expired sessions
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_role');
      // Optionally redirect to login, but we will let components handle state transitions
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (userData) => api.post('/api/auth/register', userData),
  login: (email, password) => {
    // OAuth2 Password Grant Form Data (username/password)
    const params = new URLSearchParams();
    params.append('username', email);
    params.append('password', password);
    return api.post('/api/auth/login', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  },
  getMe: () => api.get('/api/auth/me'),
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
};

export const datasetAPI = {
  listDatasets: () => api.get('/api/datasets'),
  getDataset: (id) => api.get(`/api/datasets/${id}`),
  mockIngest: (id, sampleCount) => api.post(`/api/datasets/mock-ingest/${id}?sample_count=${sampleCount}`),
};

export default api;
