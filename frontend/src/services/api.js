import axios from 'axios';

// Use environment variable or fallback to localhost
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';


const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor for auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => {
    return api.post('/auth/login', credentials);
  },
  signup: (userData) => api.post('/auth/signup', userData),
};

// Dashboard API - Main PnL list with metrics
export const dashboardAPI = {
  getDashboard: () => api.get('/dashboard'),
};

// PnL API
export const pnlAPI = {
  getAll: () => api.get('/pnls'),
  create: (data) => api.post('/pnls', data),
  getById: (id) => api.get(`/pnls/${id}`),
  getMetrics: (id) => api.get(`/pnls/${id}/metrics`),
  updateMetrics: (id, data) => api.put(`/pnls/${id}/metrics`, data),
};

// Sub PnL API
export const subPnlAPI = {
  getByPnL: (pnlId) => api.get(`/pnls/${pnlId}/sub-pnls`),
  create: (pnlId, data) => api.post(`/pnls/${pnlId}/sub-pnls`, data),
  getById: (id) => api.get(`/sub-pnls/${id}`),
  getMetrics: (id) => api.get(`/sub-pnls/${id}/metrics`),
  updateMetrics: (id, data) => api.put(`/sub-pnls/${id}/metrics`, data),
  getDetailMetrics: (id) => api.get(`/sub-pnls/${id}/detail-metrics`),
  updateDetailMetrics: (id, data) => api.put(`/sub-pnls/${id}/detail-metrics`, data),
};

// Metrics History API
export const metricsHistoryAPI = {
  getAll: (params = {}) => api.get('/metrics-history', { params }),
  getBySubPnL: (subPnlId) => api.get(`/sub-pnls/${subPnlId}/metrics-history`),
  getByPnL: (pnlId) => api.get(`/pnls/${pnlId}/metrics-history`),
  getById: (id) => api.get(`/metrics-history/${id}`),
  delete: (id) => api.delete(`/metrics-history/${id}`),
};

export default api;