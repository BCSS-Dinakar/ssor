import api from './api';

export const policeApi = {
  getLogs: async () => {
    const response = await api.get('/police/logs');
    return response.data;
  },

  getOrganizations: async () => {
    const response = await api.get('/police/organizations');
    return response.data;
  },

  getOrganizationById: async (id) => {
    const response = await api.get(`/police/organizations/${id}`);
    return response.data;
  },

  updateOrganizationStatus: async (id, status) => {
    const response = await api.put(`/police/organizations/${id}/status`, { status });
    return response.data;
  },

  getDocument: async (filename) => {
    const response = await api.get(`/police/documents/${filename}`, { responseType: 'blob' });
    return response;
  },

  getDashboardStats: async () => {
    const response = await api.get('/police/dashboard');
    return response.data;
  },

  getVerifications: async () => {
    const response = await api.get('/police/verifications');
    return response.data;
  },

  getVerificationById: async (id) => {
    const response = await api.get(`/police/verifications/${id}`);
    return response.data;
  },

  updateVerificationStatus: async (id, payload) => {
    const response = await api.put(`/police/verifications/${id}/status`, payload);
    return response.data;
  }
};
