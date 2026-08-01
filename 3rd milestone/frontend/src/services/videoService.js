import api from './api';

export const videoService = {
  upload: (file, onProgress) => {
    const formData = new FormData();
    formData.append('video', file);
    return api.post('/videos/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        if (onProgress) onProgress(percentCompleted);
      }
    }).then(res => res.data);
  },
  getAll: () => api.get('/videos').then(res => res.data),
  getById: (id) => api.get(`/videos/${id}`).then(res => res.data),
};
