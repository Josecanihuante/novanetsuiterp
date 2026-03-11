import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

/**
 * Instancia Axios centralizada.
 * - Adjunta automáticamente el JWT en cada request.
 * - Detecta 401 → hace logout y redirige a /login.
 */
const api = axios.create({
  baseURL: '/api/v1',
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
