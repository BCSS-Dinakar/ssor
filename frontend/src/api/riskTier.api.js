import api from './api';

export const riskTierApi = {
  listDefinitions: async () => {
    const response = await api.get('/risk-tiers');
    return response.data;
  },

  createDefinition: async (payload) => {
    const response = await api.post('/risk-tiers', payload);
    return response.data;
  },

  updateDefinition: async (id, payload) => {
    const response = await api.put(`/risk-tiers/${id}`, payload);
    return response.data;
  },

  removeDefinition: async (id) => {
    const response = await api.delete(`/risk-tiers/${id}`);
    return response.data;
  },

  listSections: async () => {
    const response = await api.get('/risk-tier-sections');
    return response.data;
  },

  createSection: async (payload) => {
    const response = await api.post('/risk-tier-sections', payload);
    return response.data;
  },

  updateSection: async (id, payload) => {
    const response = await api.put(`/risk-tier-sections/${id}`, payload);
    return response.data;
  },

  removeSection: async (id) => {
    const response = await api.delete(`/risk-tier-sections/${id}`);
    return response.data;
  },
};
