import axios from 'axios';

// ✅ Correct way
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  timeout: 30000,
});

// Attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('civicai_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('civicai_token');
      localStorage.removeItem('civicai_user');
      localStorage.removeItem('civicai_admin');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── AUTH ───────────────────────────────────────────────────────────────────
export const sendOTP = (phone) => API.post('/auth/send-otp', { phone });
export const verifyOTP = (phone, otp, name, role) => API.post('/auth/verify-otp', { phone, otp, name, role });
export const getMe = () => API.get('/auth/me');
export const updateProfile = (data) => API.patch('/auth/profile', data);
export const adminLogin = (email, password) => API.post('/auth/admin/login', { email, password });

// ── COMPLAINTS ─────────────────────────────────────────────────────────────
export const fileComplaint = (formData) => API.post('/complaints/file', formData);
export const trackComplaint = (trackingId) => API.get(`/complaints/track/${trackingId}`);
export const getMyComplaints = () => API.get('/complaints/my');
export const deleteComplaint = (id) => API.delete(`/complaints/${id}`);
export const getComplaints = (params) => API.get('/complaints', { params });
export const updateComplaintStatus = (id, status, note) =>
  API.patch(`/complaints/${id}/status`, { status, note });
export const getMapData = (params) => API.get('/complaints/map/data', { params });

// ── ADMIN ──────────────────────────────────────────────────────────────────
export const getNationalStats = () => API.get('/admin/stats/national');
export const getStateStats = (state) => API.get(`/admin/stats/state/${state}`);
export const getLeaderboard = () => API.get('/admin/leaderboard');
export const createAdmin = (data) => API.post('/admin/create', data);
export const listAdmins = () => API.get('/admin/list');
export const deleteAdmin = (id) => API.delete(`/admin/${id}`);

// ── TASKS ──────────────────────────────────────────────────────────────────
export const getTasks = () => API.get('/tasks');
export const createTask = (data) => API.post('/tasks', data);
export const applyForTask = (taskId, data) => API.post(`/tasks/${taskId}/apply`, data);
export const approveTaskApplication = (taskId, data) => API.post(`/tasks/${taskId}/approve`, data);

export default API;