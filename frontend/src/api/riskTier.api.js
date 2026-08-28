import api from './api';

export const riskTierApi = {
  listDefinitions: async () => {
    const response = await api.get('/risk-tiers/definitions');
    return response.data;
  },

  createDefinition: async (payload) => {
    const response = await api.post('/risk-tiers/definitions', payload);
    return response.data;
  },

  updateDefinition: async (id, payload) => {
    const response = await api.put(`/risk-tiers/definitions/${id}`, payload);
    return response.data;
  },

  removeDefinition: async (id) => {
    const response = await api.delete(`/risk-tiers/definitions/${id}`);
    return response.data;
  },

  listSections: async () => {
    const response = await api.get('/risk-tiers');
    return response.data;
  },

  createSection: async (payload) => {
    const response = await api.post('/risk-tiers', payload);
    return response.data;
  },

  updateSection: async (id, payload) => {
    const response = await api.put(`/risk-tiers/${id}`, payload);
    return response.data;
  },

  removeSection: async (id) => {
    const response = await api.delete(`/risk-tiers/${id}`);
    return response.data;
  },
};
