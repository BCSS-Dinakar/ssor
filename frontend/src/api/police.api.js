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
    const base = String(filename).split('/').pop();
    const response = await api.get(`/police/documents/${base}`, { responseType: 'blob' });
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
  },

  getTickets: async () => {
    const response = await api.get('/police/tickets');
    return response.data;
  },

  updateTicketStatus: async (id, status) => {
    const response = await api.put(`/police/tickets/${id}/status`, { status });
    return response.data;
  },

  addTicketMessage: async (id, text) => {
    const response = await api.post(`/police/tickets/${id}/messages`, { text });
    return response.data;
  },

  scanVerificationById: async (id) => {
    const response = await api.post(`/police/verifications/${id}/scan`);
    return response.data;
  },

  getOffendersList: async (params) => {
    const response = await api.get('/police/offenders', { params });
    return response.data;
  },

  getOffenderById: async (id) => {
    const response = await api.get(`/police/offenders/${id}`);
    return response.data;
  },

  getEprisonsJails: async () => {
    const response = await api.get('/eprisons/jails');
    return response.data;
  },

  getEprisonsReleases: async (payload) => {
    const response = await api.post('/eprisons/releases', payload);
    return response.data;
  }
};
