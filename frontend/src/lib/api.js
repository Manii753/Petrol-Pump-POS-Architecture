import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('authToken');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  getCurrentUser: () => api.get('/auth/me'),
  register: (userData) => api.post('/auth/register', userData),
};

// Shifts API
export const shiftsAPI = {
  startShift: (data) => api.post('/shifts/start', data),
  closeShift: (id, data) => api.put(`/shifts/${id}/close`, data),
  getShifts: (params) => api.get('/shifts', { params }),
  getCurrentShift: () => api.get('/shifts/current'),
  getShift: (id) => api.get(`/shifts/${id}`),
};

// Pumps API
export const pumpsAPI = {
  getPumps: () => api.get('/pumps'),
  createPump: (data) => api.post('/pumps', data),
  updatePump: (id, data) => api.put(`/pumps/${id}`, data),
  deletePump: (id) => api.delete(`/pumps/${id}`),
};

// Sales API
export const salesAPI = {
  createSale: (data) => api.post('/sales', data),
  getSales: (params) => api.get('/sales', { params }),
  getShiftSummary: (shiftId) => api.get(`/sales/shift-summary/${shiftId}`),
};

// Tanks API
export const tanksAPI = {
  getTanks: () => api.get('/tanks'),
  getTank: (id) => api.get(`/tanks/${id}`),
  createTank: (tankData) => api.post('/tanks', tankData),
  updateTank: (id, tankData) => api.put(`/tanks/${id}`, tankData),
  deleteTank: (id) => api.delete(`/tanks/${id}`),
  recordDelivery: (deliveryData) => api.post('/tanks/delivery', deliveryData),
  getDeliveries: (tankId) => api.get(`/tanks/${tankId}/deliveries`),
  getAllDeliveries: () => api.get('/tanks/deliveries'),
};

// Reports API
export const reportsAPI = {
  getDailyShiftReport: (shiftId) => api.get(`/reports/daily-shift/${shiftId}`),
  getDailySalesReport: (params) => api.get('/reports/daily-sales', { params }),
  getMonthlySalesReport: (params) => api.get('/reports/monthly-sales', { params }),
  exportShiftPDF: (shiftId) => api.get(`/reports/export-pdf/${shiftId}`, { responseType: 'blob' }),
};

// Users API
export const usersAPI = {
  getUsers: () => api.get('/users'),
  getUser: (id) => api.get(`/users/${id}`),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  resetPassword: (id, data) => api.put(`/users/${id}/password`, data),
};