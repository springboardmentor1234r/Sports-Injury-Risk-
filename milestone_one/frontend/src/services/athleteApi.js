import api from './authApi';

export const athleteApi = {
  async getAthlete(athleteId) {
    const response = await api.get(`/athletes/${athleteId}`);
    return response.data;
  },

  async updateAthlete(athleteId, data) {
    const response = await api.put(`/athletes/${athleteId}`, data);
    return response.data;
  },

  async getInjuries(athleteId) {
    const response = await api.get(`/athletes/${athleteId}/injuries`);
    return response.data;
  },

  async addInjury(athleteId, injuryData) {
    const response = await api.post(`/athletes/${athleteId}/injuries`, injuryData);
    return response.data;
  },

  async addTrainingLoad(athlete_id, trainingData) {
    const response = await api.post(`/athletes/${athlete_id}/training-load`, trainingData);
    return response.data;
  },

  async listAthletes() {
    const response = await api.get('/athletes/');
    return response.data;
  },

  async createAthlete(data) {
    const response = await api.post('/athletes/', data);
    return response.data;
  },
};

export default athleteApi;
