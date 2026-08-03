import { useState, useEffect, useCallback } from 'react';
import { ScrollView, RefreshControl, Alert } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { polinizacionService } from '@/services/polinizacion.service';
import { germinacionService } from '@/services/germinacion.service';
import { estadisticasService } from '@/services/estadisticas.service';
import { usePermissions } from '@/hooks/usePermissions';
import { useNotifications } from '@/hooks/useNotifications';
import { ResponsiveLayout } from '@/components/layout';
import { PerfilResumen } from '@/components/Perfil';
import { createStyles } from '@/utils/Perfil/styles';
import { useTheme } from '@/contexts/ThemeContext';
import type { Polinizacion, Germinacion, EstadisticasUsuario } from '@/types/index';
import { logger } from '@/services/logger';

export default function ResumenScreen() {
  const { user } = useAuth();
  const { canViewPolinizaciones, canViewGerminaciones } = usePermissions();
  const { colors: themeColors } = useTheme();
  const styles = createStyles(themeColors);
  const { notifications, fetchNotifications } = useNotifications();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [polinizaciones, setPolinizaciones] = useState<Polinizacion[]>([]);
  const [germinaciones, setGerminaciones] = useState<Germinacion[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticasUsuario>({
    total_polinizaciones: 0,
    total_germinaciones: 0,
    polinizaciones_actuales: 0,
    germinaciones_actuales: 0,
    usuario: user?.username || 'Usuario'
  });

  useEffect(() => {
    fetchNotifications({ solo_propias: true });
  }, []);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      let misPolinizaciones: Polinizacion[] = [];
      let misGerminaciones: Germinacion[] = [];
      let stats: EstadisticasUsuario | null = null;

      // Obtener polinizaciones recientes
      if (canViewPolinizaciones()) {
        try {
          const result = await polinizacionService.getMisPolinizacionesPaginated({
            page: 1,
            page_size: 5,
            dias_recientes: 0
          });
          misPolinizaciones = Array.isArray(result.results) ? result.results : [];
        } catch (error) {
          logger.error('Error obteniendo polinizaciones:', error);
        }
      }

      // Obtener germinaciones recientes
      if (canViewGerminaciones()) {
        try {
          const result = await germinacionService.getMisGerminacionesPaginated({
            page: 1,
            page_size: 5,
            dias_recientes: 0,
            excluir_importadas: true
          });
          misGerminaciones = Array.isArray(result.results) ? result.results : [];
        } catch (error) {
          logger.error('Error obteniendo germinaciones:', error);
        }
      }

      // Obtener estadísticas
      try {
        stats = await estadisticasService.getEstadisticasUsuario();
      } catch (error) {
        logger.error('Error obteniendo estadísticas:', error);
        stats = null;
      }

      // Calcular estadísticas si no se obtuvieron
      if (!stats) {
        stats = {
          total_polinizaciones: misPolinizaciones.length,
          total_germinaciones: misGerminaciones.length,
          polinizaciones_actuales: misPolinizaciones.filter(p =>
            p.estado_polinizacion === 'EN_PROCESO_TEMPRANO' ||
            p.estado_polinizacion === 'EN_PROCESO_AVANZADO' ||
            p.estado_polinizacion === 'INICIAL'
          ).length,
          germinaciones_actuales: misGerminaciones.filter(g =>
            g.estado_germinacion === 'INICIAL' ||
            g.estado_germinacion === 'EN_PROCESO_TEMPRANO' ||
            g.estado_germinacion === 'EN_PROCESO_AVANZADO'
          ).length,
          usuario: user?.username || 'Usuario'
        };
      }

      setPolinizaciones(misPolinizaciones);
      setGerminaciones(misGerminaciones);
      setEstadisticas(stats);
    } catch (error) {
      logger.error('Error fetching data:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.username, canViewPolinizaciones, canViewGerminaciones]);

  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user?.id, fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const handleViewPolinizacion = () => {
    // Navegar a polinizaciones
  };

  const handleViewGerminacion = () => {
    // Navegar a germinaciones
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingHorizontal: 8, paddingTop: 8, paddingBottom: 8 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <PerfilResumen
        estadisticas={estadisticas}
        loading={loading}
        polinizaciones={polinizaciones}
        germinaciones={germinaciones}
        onViewPolinizacion={handleViewPolinizacion}
        onViewGerminacion={handleViewGerminacion}
        onViewAllPolinizaciones={() => {}}
        onViewAllGerminaciones={() => {}}
        notifications={notifications}
        onViewAllNotifications={() => {}}
        canViewPolinizaciones={canViewPolinizaciones()}
        canViewGerminaciones={canViewGerminaciones()}
      />
    </ScrollView>
  );
}
