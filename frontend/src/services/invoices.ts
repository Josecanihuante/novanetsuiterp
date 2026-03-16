import api from './api';

export const getInvoices = () => api.get('/invoices/');
export const getInvoiceById = (id: string) => api.get(`/invoices/${id}`);
export const createInvoice = (data: any) => api.post('/invoices/', data);
export const updateInvoice = (id: string, data: any) => api.put(`/invoices/${id}`, data);
export const deleteInvoice = (id: string) => api.delete(`/invoices/${id}`);