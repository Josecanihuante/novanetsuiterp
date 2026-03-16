import api from './api';

export const login = (email: string, password: string) => api.post('/auth/login', { email, password });
export const refreshToken = (refreshToken: string) => api.post('/auth/refresh', { refreshToken });
export const logout = () => api.post('/auth/logout');