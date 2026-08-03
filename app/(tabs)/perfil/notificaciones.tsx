import { useState, useEffect, useCallback } from 'react';
import { ScrollView, RefreshControl } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { polinizacionService } from '@/services/polinizacion.service';
import { germinacionService } from '@/services/germinacion.service';
import { usePermissions } from '@/hooks/usePermissions';
import { PerfilNotificacionesTab } from '@/components/Perfil';
import { createStyles } from '@/utils/Perfil/styles';
import { useTheme } from '@/contexts/ThemeContext';
import type { Polinizacion, Germinacion } from '@/types/index';
import { logger } from '@/services/logger';

export default function NotificacionesScreen() {
  const { user } = useAuth();
  const { canViewPolinizaciones, canViewGerminaciones } = usePermissions();
  const { colors: themeColors } = useTheme();
  const styles = createStyles(themeColors);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [polinizaciones, setPolinizaciones] = useState<Polinizacion[]>([]);
  const [germinaciones, setGerminaciones] = useState<Germinacion[]>([]);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      let misPolinizaciones: Polinizacion[] = [];
      let misGerminaciones: Germinacion[] = [];

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

      setPolinizaciones(misPolinizaciones);
      setGerminaciones(misGerminaciones);
    } finally {
      setLoading(false);
    }
  }, [user?.id, canViewPolinizaciones, canViewGerminaciones]);

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

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingHorizontal: 8, paddingTop: 8, paddingBottom: 8 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <PerfilNotificacionesTab
        polinizaciones={polinizaciones}
        germinaciones={germinaciones}
        loading={loading}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onViewPolinizacion={() => {}}
        onEditPolinizacion={() => {}}
        onDeletePolinizacion={() => {}}
        onChangeStatusPolinizacion={() => {}}
        onViewGerminacion={() => {}}
        onEditGerminacion={() => {}}
        onDeleteGerminacion={() => {}}
        onChangeStatusGerminacion={() => {}}
        canViewPolinizaciones={canViewPolinizaciones()}
        canViewGerminaciones={canViewGerminaciones()}
      />
    </ScrollView>
  );
}
