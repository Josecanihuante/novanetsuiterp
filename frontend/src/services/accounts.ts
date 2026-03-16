import api from './api';

export const getAccounts = () => api.get('/accounts/');
export const getAccountById = (id: string) => api.get(`/accounts/${id}`);
export const createAccount = (data: any) => api.post('/accounts/', data);
export const updateAccount = (id: string, data: any) => api.put(`/accounts/${id}`, data);
export const deleteAccount = (id: string) => api.delete(`/accounts/${id}`);