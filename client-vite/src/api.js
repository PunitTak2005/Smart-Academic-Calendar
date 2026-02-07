// api.js
import axios from 'axios';

const api = axios.create({
  baseURL: '/api', // Vite proxy to http://localhost:5000
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); // or wherever you store it
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
