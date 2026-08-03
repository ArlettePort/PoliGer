import { logger } from '@/services/logger';

// Configuración centralizada de la aplicación
export const CONFIG = {
  // URL del backend - Usar variables de entorno cuando sea posible
  // Producción: Nginx hace proxy al backend, no usar puerto :8000
  // Desarrollo local: usar localhost:8000
  API_BASE_URL: process.env['EXPO_PUBLIC_API_URL'] || (typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:8000/api'
    : (typeof window !== 'undefined' ? `${window.location.origin}/api` : 'http://207.180.230.88/api')),

  // Timeouts optimizados para mejor experiencia de usuario
  API_TIMEOUT: 30000, // 30 segundos para operaciones normales
  API_TIMEOUT_LARGE_DATA: 60000, // 60 segundos para endpoints con muchos datos

  // Configuración de desarrollo - Solo activar en desarrollo
  DEBUG_MODE: __DEV__,

  // Configuración de reintentos mejorada
  MAX_RETRIES: 3,
  RETRY_DELAY: 1500,

  // URLs específicas - TODOS LOS ENDPOINTS DISPONIBLES
  ENDPOINTS: {
    // Autenticación
    LOGIN: '/token/',
    PROTECTED: '/protected/',
    TOKEN_REFRESH: '/token/refresh/',
    HEALTH: '/health/',

    // Recursos principales
    GERMINACIONES: '/germinaciones/',
    POLINIZACIONES: '/polinizaciones/',
    GENEROS: '/generos/',
    ESPECIES: '/especies/',
    UBICACIONES: '/ubicaciones/',

    // Seguimiento
    SEGUIMIENTOS: '/seguimientos/',
    CAPSULAS: '/capsulas/',
    SIEMBRAS: '/siembras/',
    INVENTARIOS: '/inventarios/',

    // Notificaciones
    NOTIFICATIONS: '/notifications/',

    // Usuarios y permisos (RBAC)
    USER_PROFILES: '/user-profiles/',
    USER_MANAGEMENT: '/user-management/',
    USER_METAS: '/user-metas/',
    PERSONAL: '/personal/',

    // Estadísticas
    ESTADISTICAS_GERMINACIONES: '/estadisticas/germinaciones/',
    ESTADISTICAS_POLINIZACIONES: '/estadisticas/polinizaciones/',
    ESTADISTICAS_USUARIO: '/estadisticas/usuario/',

    // Reportes
    REPORTE_POLINIZACIONES: '/polinizaciones/reporte/',
    REPORTE_GERMINACIONES: '/germinaciones/reporte/',
    REPORTE_ESTADISTICAS: '/reportes/estadisticas/',

    // Importación CSV
    UPLOAD_CSV_POLINIZACIONES: '/upload/polinizaciones/',
    UPLOAD_CSV_GERMINACIONES: '/upload/germinaciones/',
    CSV_TEMPLATES: '/csv-templates/',

    // Predicciones
    PREDICCION_GERMINACION: '/predicciones/germinacion/',
    PREDICCION_POLINIZACION: '/predicciones/polinizacion/',
    PREDICCION_COMPLETA: '/predicciones/completa/',
    PREDICCION_ESTADISTICAS: '/predicciones/estadisticas/',
    PREDICCION_ALERTAS: '/predicciones/alertas/',

    // Predicciones de polinización (modelo .bin)
    PREDICCION_POL_INICIAL: '/predicciones/polinizacion/inicial/',
    PREDICCION_POL_REFINAR: '/predicciones/polinizacion/refinar/',
    PREDICCION_POL_VALIDAR: '/predicciones/polinizacion/validar/',
    PREDICCION_POL_HISTORIAL: '/predicciones/polinizacion/historial/',
    PREDICCION_POL_COMPLETA: '/predicciones/polinizacion/completa/',
  }
};

// Función para obtener la URL completa de un endpoint
export const getApiUrl = (endpoint: string): string => {
  return `${CONFIG.API_BASE_URL}${endpoint}`;
};

// Función para verificar si estamos en desarrollo
export const isDevelopment = (): boolean => {
  return __DEV__;
};

// Función para verificar si el backend está disponible
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    // Usar un timeout más corto para verificación rápida
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.HEALTH}`, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    if (CONFIG.DEBUG_MODE) {
      logger.warn(' Backend no disponible:', error);
    }
    return false;
  }
};

// Función para obtener configuración específica por entorno
export const getEnvironmentConfig = () => {
  if (isDevelopment()) {
    return {
      ...CONFIG,
      DEBUG_MODE: true,
      API_TIMEOUT: 10000, // Timeout más corto en desarrollo para feedback rápido
    };
  }

  return {
    ...CONFIG,
    DEBUG_MODE: false,
    API_TIMEOUT: 30000, // Timeout largo en producción para conexiones lentas
  };
};