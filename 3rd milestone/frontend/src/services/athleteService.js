import api from './api';

export const athleteService = {
  getAll: (params) => api.get('/athletes', { params }).then(res => res.data),
  getById: (id) => api.get(`/athletes/${id}`).then(res => res.data),
  create: (data) => api.post('/athletes', data).then(res => res.data),
  update: (id, data) => api.put(`/athletes/${id}`, data).then(res => res.data),
  delete: (id) => api.delete(`/athletes/${id}`).then(res => res.data),
};
