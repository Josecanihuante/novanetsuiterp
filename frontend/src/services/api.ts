import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

/**
 * Instancia Axios centralizada.
 * - En producción usa VITE_API_URL (apunta a Railway).
 * - En desarrollo usa el proxy local de Vite (localhost:8000).
 * - Adjunta automáticamente el JWT en cada request.
 * - Detecta 401 → hace logout y redirige a /login.
 */
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
})

// ── Interceptor de request: adjuntar token ─────────────────────────────────
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Interceptor de response: manejar 401 ──────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export default api
