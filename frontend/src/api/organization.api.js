import api, { API_BASE_URL } from './api';

export const organizationApi = {
  getDocumentUrl: (filename) => {
    if (!filename) return '';
    return `${API_BASE_URL}/organization/documents/${filename.split('/').pop()}`;
  },
  submitVerification: async (data) => {
    // If data is an instance of FormData, pass it directly. Otherwise, it sends JSON.
    const isFormData = data instanceof FormData;
    const config = isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    const response = await api.post('/organization/verify-candidate', data, config);
    return response.data;
  },

  generateConsentTemplate: async (data) => {
    const isFormData = data instanceof FormData;
    const config = { responseType: 'blob' };
    if (isFormData) config.headers = { 'Content-Type': 'multipart/form-data' };
    const response = await api.post('/organization/generate-consent-template', data, config);
    return response.data;
  },

  getDashboard: async () => {
    const response = await api.get('/organization/dashboard');
    return response.data;
  },

  getVerifications: async () => {
    const response = await api.get('/organization/verifications');
    return response.data;
  },

  getVerification: async (id) => {
    const response = await api.get(`/organization/verifications/${id}`);
    return response.data;
  },

  getTickets: async () => {
    const response = await api.get('/organization/tickets');
    return response.data;
  },

  createTicket: async (payload) => {
    const response = await api.post('/organization/tickets', payload);
    return response.data;
  },

  addTicketMessage: async (ticketId, payload) => {
    const response = await api.post(`/organization/tickets/${ticketId}/messages`, payload);
    return response.data;
  }
};
