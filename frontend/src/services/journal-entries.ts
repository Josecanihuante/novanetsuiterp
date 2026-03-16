import api from './api';

export const getJournalEntries = () => api.get('/journal-entries/');
export const getJournalEntryById = (id: string) => api.get(`/journal-entries/${id}`);
export const createJournalEntry = (data: any) => api.post('/journal-entries/', data);
export const updateJournalEntry = (id: string, data: any) => api.put(`/journal-entries/${id}`, data);
export const deleteJournalEntry = (id: string) => api.delete(`/journal-entries/${id}`);
export const postJournalEntry = (id: string) => api.post(`/journal-entries/${id}/post`);