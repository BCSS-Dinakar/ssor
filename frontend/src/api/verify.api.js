import api from './api';

export const verifyApi = {
  // Public certificate authenticity check (used by the QR verify page)
  verifyCertificate: async (token) => {
    const response = await api.get(`/verify/${token}`);
    return response.data;
  }
};
