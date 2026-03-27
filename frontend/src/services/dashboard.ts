import api from './api';

export const getDashboardStats = () => api.get('/dashboard/stats');
export const getDashboardCharts = () => api.get('/dashboard/charts');