import axios, { AxiosError, AxiosResponse } from 'axios';
import * as SecureStore from '@/services/secureStore';
import { CONFIG } from './config';
import { logger } from '@/services/logger';
// import { cache, CACHE_KEYS, CACHE_TTL } from './cache';

// API optimizada con cache y pooling de conexiones
const api = axios.create({
  baseURL: CONFIG.API_BASE_URL,  // Usando CONFIG en vez de hardcoded
  withCredentials: false, // JWT por header
  timeout: CONFIG.API_TIMEOUT,  // Usando CONFIG timeout
  headers: {
    'Content-Type': 'application/json',
  },
  // Optimizaciones de rendimiento
  maxRedirects: 3,
  maxContentLength: 50 * 1024 * 1024, // 50MB max para manejar grandes datasets
});

// Cache simple para tokens para evitar lecturas frecuentes
let tokenCache: { token: string | null; timestamp: number } = { token: null, timestamp: 0 };
const TOKEN_CACHE_TTL = 30 * 1000; // 30 segundos
let isLoggingOut = false; // Flag para evitar refresh durante logout

// Handler global para cuando la sesión expira en mid-session
let _onAuthExpired: (() => void) | null = null;
export const setAuthExpiredHandler = (handler: (() => void) | null) => {
  _onAuthExpired = handler;
};

// Función para marcar que estamos en proceso de logout
export const setLoggingOut = (value: boolean) => {
  isLoggingOut = value;
  if (value) {
    // Limpiar cache de tokens durante logout
    tokenCache = { token: null, timestamp: 0 };
  }
};

// Función para limpiar cache de tokens y headers por defecto
export const clearTokenCache = () => {
  tokenCache = { token: null, timestamp: 0 };
  delete api.defaults.headers.common['Authorization'];
};

// Función optimizada para obtener token con cache
async function getAuthToken(): Promise<string | null> {
  const now = Date.now();
  
  // Usar cache si es válido
  if (tokenCache.token && (now - tokenCache.timestamp) < TOKEN_CACHE_TTL) {
    return tokenCache.token;
  }
  
  // Obtener token fresco
  try {
    const token = await SecureStore.secureStore.getItem('authToken');
    tokenCache = { token, timestamp: now };
    return token;
  } catch (error) {
    tokenCache = { token: null, timestamp: now };
    return null;
  }
}

// Interceptor optimizado para añadir token
api.interceptors.request.use(
  async (config) => {
    const token = await getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Interceptor para manejar errores y refrescar el token
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    // Si no hay respuesta, es un error de red
    if (!error.response) {
      if (CONFIG.DEBUG_MODE) {
        logger.error('Error de red:', error);
      }
      
      // Detectar tipo específico de error de red
      let errorMessage = 'No se pudo conectar al servidor.';
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'La solicitud tardó demasiado. Verifica tu conexión.';
      } else if (error.message.includes('Network Error')) {
        errorMessage = 'Error de red. Verifica tu conexión a internet y que el servidor esté ejecutándose.';
      } else if (error.message.includes('ENOTFOUND')) {
        errorMessage = 'No se pudo encontrar el servidor. Verifica la URL del API.';
      }
      
      // Rechazamos la promesa con un objeto de error estructurado
      return Promise.reject({
        response: {
          data: {
            error: errorMessage,
            networkError: true,
            originalError: error.message
          }
        }
      });
    }

    const originalRequest = error.config;

    // Si el error es 401 y no es un reintento y NO es la petición de refresh y NO estamos en logout
    const isPublicAuthEndpoint = originalRequest?.url?.includes('token/') ||
      originalRequest?.url?.includes('solicitar-reset-password/') ||
      originalRequest?.url?.includes('confirmar-reset-password/');

    if (error.response.status === 401 && originalRequest && !(originalRequest as any)._retry && !originalRequest.url?.includes('token/refresh/') && !isLoggingOut && !isPublicAuthEndpoint) {
      (originalRequest as any)._retry = true;

      try {
        // Usar el tokenManager que ya tiene la lógica correcta para evitar bucles
        const { tokenManager } = await import('./tokenManager');
        const newAccessToken = await tokenManager.refreshAccessToken();

        // Actualizar headers con el nuevo token
        api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
        if (originalRequest.headers) {
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        }
        
        return api(originalRequest);
      } catch (refreshError) {
        logger.error('Error al refrescar token:', refreshError);

        // Si el refresh falla, limpiar tokens
        await SecureStore.secureStore.removeItem('authToken');
        await SecureStore.secureStore.removeItem('refreshToken');

        // Limpiar cache de tokens
        tokenCache = { token: null, timestamp: 0 };

        // Notificar al AuthContext para que haga logout y redirija a login
        if (_onAuthExpired) {
          _onAuthExpired();
        }

        // Rechazar con error de autenticación
        return Promise.reject({
          ...error,
          response: {
            ...error.response,
            data: {
              error: 'Sesión expirada. Por favor, inicia sesión nuevamente.',
              authError: true
            }
          }
        });
      }
    }

    // Mejorar mensajes de error específicos
    if (error.response.status === 403) {
      (error.response.data as any).error = 'No tienes permisos para realizar esta acción.';
    } else if (error.response.status === 404) {
      (error.response.data as any).error = 'El recurso solicitado no fue encontrado.';
    } else if (error.response.status === 500) {
      (error.response.data as any).error = 'Error interno del servidor. Inténtalo más tarde.';
    }

    return Promise.reject(error);
  }
);

export default api;