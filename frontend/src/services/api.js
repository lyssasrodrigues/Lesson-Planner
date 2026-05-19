import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 35000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg =
      err.response?.data?.error ||
      err.response?.data?.message ||
      (err.code === 'ECONNABORTED' ? 'A requisição demorou muito. Tente novamente.' : null) ||
      'Ocorreu um erro inesperado.';
    return Promise.reject(new Error(msg));
  }
);

export const lessonPlansApi = {
  list: (params) => api.get('/lesson-plans', { params }).then((r) => r.data),
  get: (id) => api.get(`/lesson-plans/${id}`).then((r) => r.data),
  create: (data) => api.post('/lesson-plans', data).then((r) => r.data),
  update: (id, data) => api.put(`/lesson-plans/${id}`, data).then((r) => r.data),
  delete: (id) => api.delete(`/lesson-plans/${id}`).then((r) => r.data),
};

export const aiApi = {
  recommend: (data) => api.post('/ai/recommend', data).then((r) => r.data),
};

export const healthApi = {
  check: () => api.get('/health').then((r) => r.data),
};
