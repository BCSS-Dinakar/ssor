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
    // We can handle specific global errors here, e.g., redirect to login on 401
    return Promise.reject(error);
  }
);

export default api;
