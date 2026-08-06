import axios from 'axios';

// Root origin of the backend API server (NOT including the /api prefix) —
// e.g. http://localhost:5000. Derived from REACT_APP_API_BASE_URL (which
// already includes /api — see src/api/api.js) so callers using this instance
// can pass full '/api/...' paths, matching how DistrictManagement.js /
// UserManagement.js already call it (axios.get('/api/districts'), etc.).
const API_ROOT = (process.env.REACT_APP_API_BASE_URL || '')
  .replace(/\/api\/?$/, '')
  .replace(/\/$/, '');

const instance = axios.create({
  baseURL: API_ROOT,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

export default instance;
