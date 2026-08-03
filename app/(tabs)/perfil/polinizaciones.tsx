import { useState, useEffect, useCallback } from 'react';
import { ScrollView, RefreshControl, Alert } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { polinizacionService } from '@/services/polinizacion.service';
import { usePermissions } from '@/hooks/usePermissions';
import { PerfilPolinizacionesTab } from '@/components/Perfil';
import { createStyles } from '@/utils/Perfil/styles';
import { useTheme } from '@/contexts/ThemeContext';
import type { Polinizacion } from '@/types/index';
import { logger } from '@/services/logger';

export default function PolinizacionesScreen() {
  const { user } = useAuth();
  const { canViewPolinizaciones } = usePermissions();
  const { colors: themeColors } = useTheme();
  const styles = createStyles(themeColors);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [polinizaciones, setPolinizaciones] = useState<Polinizacion[]>([]);
  const [searchPolinizaciones, setSearchPolinizaciones] = useState('');
  const [polinizacionesPage, setPolinizacionesPage] = useState(1);
  const [polinizacionesTotalPages, setPolinizacionesTotalPages] = useState(1);
  const [polinizacionesTotalCount, setPolinizacionesTotalCount] = useState(0);

  const fetchData = useCallback(async () => {
    if (!user?.id || !canViewPolinizaciones()) return;

    setLoading(true);
    try {
      const result = await polinizacionService.getMisPolinizacionesPaginated({
        page: polinizacionesPage,
        page_size: 20,
        ...(searchPolinizaciones && { search: searchPolinizaciones }),
        dias_recientes: 0
      });
      setPolinizaciones(Array.isArray(result.results) ? result.results : []);
      setPolinizacionesTotalPages(result.totalPages);
      setPolinizacionesTotalCount(result.count);
    } catch (error) {
      logger.error('Error obteniendo polinizaciones:', error);
      Alert.alert('Error', 'No se pudieron cargar las polinizaciones');
    } finally {
      setLoading(false);
    }
  }, [user?.id, polinizacionesPage, searchPolinizaciones, canViewPolinizaciones]);

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

  const handleBuscar = useCallback((search: string) => {
    setSearchPolinizaciones(search);
    setPolinizacionesPage(1);
  }, []);

  if (!canViewPolinizaciones()) {
    return <ScrollView style={{ flex: 1 }} />;
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingHorizontal: 8, paddingTop: 8, paddingBottom: 8 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <PerfilPolinizacionesTab
        loading={loading}
        polinizaciones={polinizaciones}
        setPolinizacionesPage={setPolinizacionesPage}
        fetchData={fetchData}
        handleBuscarPolinizaciones={handleBuscar}
        polinizacionesTotalPages={polinizacionesTotalPages}
        polinizacionesTotalCount={polinizacionesTotalCount}
        polinizacionesPage={polinizacionesPage}
        handlePolinizacionesPageChange={setPolinizacionesPage}
        handlePolinizacionesNextPage={() => setPolinizacionesPage(p => p + 1)}
        handlePolinizacionesPrevPage={() => setPolinizacionesPage(p => Math.max(1, p - 1))}
        handleViewPolinizacion={() => {}}
        handleEditPolinizacion={() => {}}
        handleDeletePolinizacion={() => {}}
        onDescargarPDF={() => {}}
        onNewPolinizacion={() => {}}
      />
    </ScrollView>
  );
}
