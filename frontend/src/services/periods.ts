import api from './api';

export const getPeriods = () => api.get('/periods/');
export const getPeriodById = (id: string) => api.get(`/periods/${id}`);
export const createPeriod = (data: any) => api.post('/periods/', data);
export const updatePeriod = (id: string, data: any) => api.put(`/periods/${id}`, data);
export const deletePeriod = (id: string) => api.delete(`/periods/${id}`);