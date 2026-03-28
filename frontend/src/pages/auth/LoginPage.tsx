import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // OAuth2PasswordRequestForm requiere form-urlencoded con campo "username"
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const response = await api.post('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      // El backend devuelve {success, data: {access_token, refresh_token, user}}
      const { access_token, refresh_token, user } = response.data.data;
      setAuth(access_token, refresh_token, user);
      navigate('/dashboard');

    } catch (err: any) {
      const detail = err.response?.data?.error?.message
        || err.response?.data?.detail
        || 'Error al iniciar sesión';
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card
        className="w-full max-w-md"
        footer={
          <div className="text-center text-sm text-gray-500 w-full">
            <p>
              ¿Olvidó su contraseña? <a href="#" className="font-medium text-primary">Restablecerla</a>
            </p>
          </div>
        }
      >
        <div className="pb-6">
          <h2 className="text-xl font-bold text-center text-gray-800">Iniciar Sesión</h2>
          <p className="text-center text-gray-500 mt-1">
            Ingrese sus credenciales para acceder al sistema
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="email"
            type="email"
            label="Correo electrónico"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            required
            disabled={loading}
          />

          <Input
            id="password"
            type="password"
            label="Contraseña"
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          <Button type="submit" variant="primary" disabled={loading} className="w-full mt-2">
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </Button>
        </form>
      </Card>
    </div>
  );
};