import axios from 'axios';

export const API_BASE_URL = (
  process.env.REACT_APP_API_BASE_URL
).replace(/\/$/, '');

// Create an Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Send cookies with requests
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a response interceptor to handle global errors (e.g., 401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle specific global errors here, e.g., redirect to login on 401
    if (error.response && error.response.status === 401) {
      const url = error.config?.url || '';
      // Exclude auth check/login endpoints to prevent redirect loops or hiding login failures
      if (!url.includes('/auth/me') && !url.includes('/auth/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
