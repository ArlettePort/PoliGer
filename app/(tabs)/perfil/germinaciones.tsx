import { useState, useEffect, useCallback } from 'react';
import { ScrollView, RefreshControl, Alert } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { germinacionService } from '@/services/germinacion.service';
import { usePermissions } from '@/hooks/usePermissions';
import { PerfilGerminacionesTab } from '@/components/Perfil';
import { createStyles } from '@/utils/Perfil/styles';
import { useTheme } from '@/contexts/ThemeContext';
import type { Germinacion } from '@/types/index';
import { logger } from '@/services/logger';

export default function GerminacionesScreen() {
  const { user } = useAuth();
  const { canViewGerminaciones } = usePermissions();
  const { colors: themeColors } = useTheme();
  const styles = createStyles(themeColors);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [germinaciones, setGerminaciones] = useState<Germinacion[]>([]);
  const [searchGerminaciones, setSearchGerminaciones] = useState('');
  const [germinacionesPage, setGerminacionesPage] = useState(1);
  const [germinacionesTotalPages, setGerminacionesTotalPages] = useState(1);
  const [germinacionesTotalCount, setGerminacionesTotalCount] = useState(0);

  const fetchData = useCallback(async () => {
    if (!user?.id || !canViewGerminaciones()) return;

    setLoading(true);
    try {
      const result = await germinacionService.getMisGerminacionesPaginated({
        page: germinacionesPage,
        page_size: 20,
        ...(searchGerminaciones && { search: searchGerminaciones }),
        dias_recientes: 0,
        excluir_importadas: true
      });
      setGerminaciones(Array.isArray(result.results) ? result.results : []);
      setGerminacionesTotalPages(result.totalPages);
      setGerminacionesTotalCount(result.count);
    } catch (error) {
      logger.error('Error obteniendo germinaciones:', error);
      Alert.alert('Error', 'No se pudieron cargar las germinaciones');
    } finally {
      setLoading(false);
    }
  }, [user?.id, germinacionesPage, searchGerminaciones, canViewGerminaciones]);

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
    setSearchGerminaciones(search);
    setGerminacionesPage(1);
  }, []);

  if (!canViewGerminaciones()) {
    return <ScrollView style={{ flex: 1 }} />;
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingHorizontal: 8, paddingTop: 8, paddingBottom: 8 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <PerfilGerminacionesTab
        loading={loading}
        germinaciones={germinaciones}
        setGerminacionesPage={setGerminacionesPage}
        fetchData={fetchData}
        handleBuscarGerminaciones={handleBuscar}
        germinacionesTotalPages={germinacionesTotalPages}
        germinacionesTotalCount={germinacionesTotalCount}
        germinacionesPage={germinacionesPage}
        handleGerminacionesPageChange={setGerminacionesPage}
        handleGerminacionesNextPage={() => setGerminacionesPage(p => p + 1)}
        handleGerminacionesPrevPage={() => setGerminacionesPage(p => Math.max(1, p - 1))}
        handleViewGerminacion={() => {}}
        handleEditGerminacion={() => {}}
        handleDeleteGerminacion={() => {}}
        onDescargarPDF={() => {}}
        onNewGerminacion={() => {}}
      />
    </ScrollView>
  );
}
