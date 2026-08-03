import api from './api';
import { CONFIG } from './config';

export const authService = {
  login: async (username: string, password: string) => {
    const response = await api.post(CONFIG.ENDPOINTS.LOGIN, { username, password });
    return response.data;
  },

  getProtectedData: async () => {
    // Usar el endpoint /api/protected/ que devuelve el usuario autenticado
    const response = await api.get('protected/');
    // El backend devuelve { message: ..., user: {...} }
    // Extraemos solo el usuario
    return response.data.user || response.data;
  },

  refreshToken: async (refreshToken: string) => {
    const response = await api.post('token/refresh/', { refresh: refreshToken });
    return response.data;
  },

  cambiarPasswordInicial: async (passwordActual: string, passwordNuevo: string) => {
    const response = await api.post('auth/cambiar-password-inicial/', {
      password_actual: passwordActual,
      password_nuevo: passwordNuevo,
    });
    return response.data;
  },

  solicitarResetPassword: async (email: string): Promise<{ message: string }> => {
    const response = await api.post('auth/solicitar-reset-password/', { email });
    return response.data;
  },

  confirmarResetPassword: async (email: string, code: string, passwordNuevo: string) => {
    const response = await api.post('auth/confirmar-reset-password/', {
      email,
      code,
      password_nuevo: passwordNuevo,
    });
    return response.data;
  },
};