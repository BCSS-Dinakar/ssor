import api from './api';

export const otpApi = {
  send: async (mobile) => {
    const response = await api.post('/otp/send', { mobile });
    return response.data;
  },

  verify: async (mobile, otp) => {
    const response = await api.post('/otp/verify', { mobile, otp });
    return response.data;
  }
};
