import api from './api';

export const authApi = {
  login: async (credentials) => {
    // credentials typically include loginId, password, role
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  loginOtpRequest: async (credentials) => {
    const response = await api.post('/auth/login-otp-request', credentials);
    return response.data;
  },

  loginOtpVerify: async (credentials) => {
    const response = await api.post('/auth/login-otp-verify', credentials);
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  register: async (formData) => {
    const response = await api.post('/auth/register', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  getDocument: async (filename) => {
    const response = await api.get(`/auth/documents/${filename}`, { responseType: 'blob' });
    return response;
  }
};
