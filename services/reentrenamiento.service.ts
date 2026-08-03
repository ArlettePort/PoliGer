import api from './api';
import { logger } from './logger';

export type ModeloReentrenamiento = 'polinizacion' | 'germinacion' | 'ambos';
export type TaskStatus = 'PENDING' | 'STARTED' | 'SUCCESS' | 'FAILURE' | 'RETRY';

export interface ResultadoReentrenamiento {
  modelo: string;
  registros_usados: number;
  mae: number;
  rmse: number;
  r2: number;
  n_features: number;
  timestamp: string;
}

export interface RespuestaReentrenamiento {
  success: boolean;
  message: string;
  task_id: string;
  modelo: ModeloReentrenamiento;
  status_url: string;
}

export interface StatusReentrenamiento {
  task_id: string;
  status: TaskStatus;
  message: string;
  progress: number;
  result?: any;
  error?: string;
}

export interface ConteosReentrenamiento {
  polinizacion: number;
  germinacion: number;
  minimo_requerido: number;
}

// Validar respuesta de conteos
const validateConteosResponse = (data: unknown): ConteosReentrenamiento => {
  if (!data || typeof data !== 'object') {
    throw new Error('Respuesta inválida del servidor');
  }

  const obj = data as Record<string, unknown>;

  if (
    typeof obj.polinizacion !== 'number' ||
    typeof obj.germinacion !== 'number' ||
    typeof obj.minimo_requerido !== 'number'
  ) {
    throw new Error('Formato de respuesta inesperado');
  }

  return {
    polinizacion: obj.polinizacion,
    germinacion: obj.germinacion,
    minimo_requerido: obj.minimo_requerido,
  };
};

class ReentrenamientoService {
  async reentrenar(modelo: ModeloReentrenamiento): Promise<RespuestaReentrenamiento> {
    try {
      const response = await api.post('predicciones/reentrenar/', { modelo }, { timeout: 10000 });

      if (!response.data.success) {
        throw new Error(response.data.error || 'Error iniciando reentrenamiento');
      }

      return response.data;
    } catch (error: any) {
      logger.error(`Error iniciando reentrenamiento de modelo ${modelo}`, error);
      throw error;
    }
  }

  async getStatus(taskId: string): Promise<StatusReentrenamiento> {
    try {
      const response = await api.get(`predicciones/reentrenamiento-status/${taskId}/`, { timeout: 5000 });
      return response.data;
    } catch (error: any) {
      logger.error(`Error obteniendo estado del reentrenamiento ${taskId}`, error);
      throw error;
    }
  }

  async pollUntilComplete(
    taskId: string,
    onProgress?: (status: StatusReentrenamiento) => void,
    maxWaitTime: number = 3600000 // 1 hora máximo
  ): Promise<StatusReentrenamiento> {
    const startTime = Date.now();
    const pollInterval = 5000; // 5 segundos

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const status = await this.getStatus(taskId);

        if (onProgress) {
          onProgress(status);
        }

        if (status.status === 'SUCCESS' || status.status === 'FAILURE') {
          return status;
        }

        // Esperar antes del próximo poll
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      } catch (error: any) {
        logger.error(`Error en polling del reentrenamiento ${taskId}`, error);
        throw error;
      }
    }

    throw new Error('Timeout esperando reentrenamiento');
  }

  async getConteos(): Promise<ConteosReentrenamiento> {
    try {
      const response = await api.get('predicciones/conteos-reentrenamiento/');
      const validatedData = validateConteosResponse(response.data);
      return validatedData;
    } catch (error: any) {
      logger.error('Error obteniendo conteos de reentrenamiento', error);
      throw error;
    }
  }
}

export const reentrenamientoService = new ReentrenamientoService();
