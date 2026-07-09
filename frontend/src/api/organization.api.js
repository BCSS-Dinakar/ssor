import api from './api';

export const organizationApi = {
  submitVerification: async (payload) => {
    const response = await api.post('/organization/verify-candidate', payload);
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
