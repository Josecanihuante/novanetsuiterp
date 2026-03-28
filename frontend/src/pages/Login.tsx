import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '@/store/authStore'

const schema = z.object({
  email:    z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

type FormData = z.infer<typeof schema>

export default function Login() {
  const setAuth  = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()
  const [serverError, setServerError] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setServerError('')
    try {
      const form = new FormData()
      form.append('username', data.email)
      form.append('password', data.password)
      const baseUrl = import.meta.env.VITE_API_URL || '/api/v1'
      const res = await fetch(`${baseUrl}/auth/login`, { method: 'POST', body: form })
      if (res.status === 401) throw new Error('Credenciales incorrectas')
      if (!res.ok) throw new Error('Error al iniciar sesión')
      const { data: body } = await res.json()
      setAuth(body.access_token, body.refresh_token, body.user)
      navigate('/dashboard', { replace: true })
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="bg-white rounded-xl shadow-md p-8 border border-gray-100">
          {/* Logo */}
          <div className="text-center mb-7">
            <div className="inline-flex w-14 h-14 bg-primary rounded-xl items-center justify-center">
              <span className="text-white font-bold text-lg">ERP</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mt-3">ERP Financiero</h1>
            <p className="text-sm text-gray-500 mt-1">Sistema de gestión financiera</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {/* Email */}
            <div className="flex flex-col gap-1">
              <label htmlFor="login-email" className="text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="usuario@empresa.cl"
                {...register('email')}
                className={[
                  'h-9 rounded-md border px-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1',
                  errors.email
                    ? 'border-danger focus:ring-danger/40'
                    : 'border-gray-300 focus:ring-secondary/40',
                ].join(' ')}
              />
              {errors.email && (
                <p role="alert" className="text-xs text-danger">{errors.email.message}</p>
              )}
            </div>

            {/* Contraseña */}
            <div className="flex flex-col gap-1">
              <label htmlFor="login-password" className="text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                {...register('password')}
                className={[
                  'h-9 rounded-md border px-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1',
                  errors.password
                    ? 'border-danger focus:ring-danger/40'
                    : 'border-gray-300 focus:ring-secondary/40',
                ].join(' ')}
              />
              {errors.password && (
                <p role="alert" className="text-xs text-danger">{errors.password.message}</p>
              )}
            </div>

            {/* Error de servidor */}
            {serverError && (
              <p role="alert" className="text-xs text-danger font-medium text-center">
                {serverError}
              </p>
            )}

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full h-9 bg-primary text-white text-sm font-semibold rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Ingresando…' : 'Iniciar sesión'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
