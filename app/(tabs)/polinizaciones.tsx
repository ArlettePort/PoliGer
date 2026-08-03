import { useState, useEffect, useCallback, useMemo } from 'react';
import { StyleSheet, ActivityIndicator, View, Text, ScrollView } from 'react-native';
import { ResponsiveLayout } from '@/components/layout';
import { PolinizacionForm } from '@/components/forms/PolinizacionForm';
import { PolinizacionesHeader, PolinizacionesContent, PolinizacionesTableContent } from '@/components/polinizaciones';
import { usePolinizacionesWithFilters } from '@/hooks/usePolinizacionesWithFilters';
import { usePolinizaciones } from '@/hooks/usePolinizaciones';
import { getInitialFormState } from '@/utils/polinizacionConstants';
import PolinizacionFilters from '@/components/filters/PolinizacionFilters';
import type { PolinizacionFilterParams, Polinizacion } from '@/types';
import { PolinizacionDetailsModal } from '@/components/modals/PolinizacionDetailsModal';
import { useTheme } from '@/contexts/ThemeContext';
import { reportesService } from '@/services/reportes.service';
import { polinizacionService } from '@/services/polinizacion.service';
import { useToast } from '@/contexts/ToastContext';
import { logger } from '@/services/logger';

export default function PolinizacionesScreen() {
  const { colors: themeColors } = useTheme();
  const { showToast } = useToast();

  // Usar el hook personalizado para polinizaciones con filtros
  const {
    polinizaciones,
    loading,
    refreshing,
    currentPage,
    totalPages,
    totalCount,
    filters,
    setFilters,
    activeFiltersCount,
    goToPage,
    nextPage,
    prevPage,
    refresh,
  } = usePolinizacionesWithFilters();

  // Hook original solo para funciones de formulario
  const {
    getUserFullName,
    saving,
    prediccion,
    isPredicting,
    setPrediccion,
    handlePrediccion: hookHandlePrediccion,
    handleSave: hookHandleSave,
  } = usePolinizaciones();

  // Estados locales del componente
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(() => getInitialFormState(getUserFullName));
  const [detalle, setDetalle] = useState<Polinizacion | null>(null);
  const [showFiltersSection, setShowFiltersSection] = useState(false);
  const [tipoRegistro, setTipoRegistro] = useState<'historicos' | 'nuevos' | 'todos'>('todos');
  const [dateRange, setDateRange] = useState({ desde: '', hasta: '' });
  const [downloading, setDownloading] = useState(false);

  // isEditMode derivado de form.id en lugar de estado separado
  const isEditMode = useMemo(() => !!form.id, [form.id]);

  // Métricas reales desde el backend
  const [metricas, setMetricas] = useState({ activas: 0, cosechas: 0, tasaExito: 0 });

  const fetchMetricas = useCallback(async () => {
    try {
      const stats = await polinizacionService.getStats(true);
      setMetricas({
        activas: stats.activas || 0,
        cosechas: stats.cosechas || 0,
        tasaExito: Math.round(stats.tasa_exito || 0)
      });
    } catch (err) {
      setMetricas({ activas: totalCount, cosechas: 0, tasaExito: 0 });
    }
  }, [totalCount]);

  useEffect(() => {
    fetchMetricas();
  }, [fetchMetricas]);

  // Funciones para manejar el formulario - memorizadas para optimización
  const handleSave = useCallback(async () => {
    const success = await hookHandleSave(form, isEditMode);
    if (success) {
      setShowForm(false);
      setForm(getInitialFormState(getUserFullName));
      setPrediccion(null);
      refresh();
      fetchMetricas();
    }
  }, [form, isEditMode, hookHandleSave, getUserFullName, setPrediccion, refresh, fetchMetricas]);

  const handleEdit = useCallback((item: Polinizacion) => {
    const initialForm = getInitialFormState(getUserFullName);
    setForm({
      ...initialForm,
      id: item.id || item.numero,
      fecha_polinizacion: item.fechapol,
      fecha_maduracion: item.fechamad || '',
      tipo_polinizacion: item.tipo_polinizacion || item.Tipo || 'SELF',
      madre_codigo: item.madre_codigo || '',
      madre_genero: item.madre_genero || item.genero || '',
      madre_especie: item.madre_especie || item.especie || '',
      madre_clima: item.madre_clima || 'I',
      padre_codigo: item.padre_codigo || '',
      padre_genero: item.padre_genero || '',
      padre_especie: item.padre_especie || '',
      padre_clima: item.padre_clima || 'I',
      nueva_codigo: item.nueva_codigo || '',
      nueva_genero: item.nueva_genero || '',
      nueva_especie: item.nueva_especie || '',
      nueva_clima: item.nueva_clima || 'I',
      vivero: item.vivero || '',
      mesa: item.mesa || '',
      pared: item.pared || '',
      ubicacion_tipo: item.ubicacion_tipo || 'vivero',
      ubicacion_nombre: item.ubicacion_nombre || '',
      cantidad_capsulas: item.cantidad_capsulas || 1,
      cantidad: item.cantidad || 1,
      cantidad_solicitada: item.cantidad_solicitada?.toString() || '',
      cantidad_disponible: item.cantidad_disponible?.toString() || '',
      responsable: item.responsable || initialForm.responsable,
      observaciones: item.observaciones || '',
      estado: item.estado || 'INGRESADO',
    });
    setShowForm(true);
  }, [getUserFullName]);

  const handleNew = useCallback(() => {
    setForm(getInitialFormState(getUserFullName));
    setShowForm(true);
  }, [getUserFullName]);

  const handlePrediccionLocal = useCallback(async () => {
    await hookHandlePrediccion(form);
  }, [form, hookHandlePrediccion]);

  const handleSearchChange = useCallback((text: string) => {
    setFilters({ ...filters, search: text });
  }, [filters]);

  const handleTipoRegistroChange = useCallback((tipo: 'historicos' | 'nuevos' | 'todos') => {
    logger.info('Cambiando tipo de registro:', tipo);
    setTipoRegistro(tipo);

    if (tipo === 'todos') {
      const { tipo_registro, ...rest } = filters;
      setFilters(rest);
    } else {
      setFilters({
        ...filters,
        tipo_registro: tipo
      });
    }
  }, [filters]);

  const handleApplyFilters = useCallback((newFilters: PolinizacionFilterParams) => {
    setFilters(newFilters);
  }, []);

  const handleDownloadPDF = useCallback(async () => {
    if (!dateRange.desde || !dateRange.hasta) {
      showToast('Debes seleccionar las fechas "Desde" y "Hasta" antes de descargar el PDF', 'error');
      return;
    }
    try {
      setDownloading(true);

      const filtros: Record<string, string> = {
        fecha_inicio: dateRange.desde,
        fecha_fin: dateRange.hasta,
      };

      await reportesService.generarReportePolinizaciones('pdf', filtros);
      showToast('PDF descargado exitosamente', 'success');
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      logger.error('Error descargando PDF:', errorMsg);
      showToast('Error al descargar el PDF', 'error');
    } finally {
      setDownloading(false);
    }
  }, [dateRange, showToast]);

  const styles = useMemo(() => createStyles(themeColors), [themeColors]);

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={themeColors.primary.main} />
        <Text style={styles.loadingText}>Cargando polinizaciones...</Text>
      </View>
    );
  }

  return (
    <ResponsiveLayout currentTab="polinizaciones" style={styles.mainContainer}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <PolinizacionesHeader
          onShowForm={handleNew}
        />

        {/* Content con métricas y búsqueda */}
        <PolinizacionesContent
          totalPolinizaciones={metricas.activas}
          tasaExito={metricas.tasaExito}
          cosechasRealizadas={metricas.cosechas}
          search={filters.search || ''}
          activeFiltersCount={activeFiltersCount}
          tipoRegistro={tipoRegistro}
          fechaDesde={dateRange.desde}
          fechaHasta={dateRange.hasta}
          downloading={downloading}
          onSearchChange={handleSearchChange}
          onClearSearch={() => setFilters({ ...filters, search: '' })}
          onShowFilters={() => setShowFiltersSection(!showFiltersSection)}
          onFechaDesdeChange={(fecha) => setDateRange({ ...dateRange, desde: fecha })}
          onFechaHastaChange={(fecha) => setDateRange({ ...dateRange, hasta: fecha })}
          onTipoRegistroChange={handleTipoRegistroChange}
          onDownloadPDF={handleDownloadPDF}
          onRefresh={refresh}
          refreshing={refreshing}
          showFiltersSection={showFiltersSection}
        >
          <PolinizacionFilters
            filters={filters}
            onFiltersChange={handleApplyFilters}
            inline={true}
          />
        </PolinizacionesContent>

        {/* Tabla de polinizaciones */}
        <PolinizacionesTableContent
          polinizaciones={polinizaciones}
          loading={loading}
          refreshing={refreshing}
          totalCount={totalCount}
          currentPage={currentPage}
          totalPages={totalPages}
          activeFiltersCount={activeFiltersCount}
          tipoRegistro={tipoRegistro}
          onRefresh={refresh}
          onPrevPage={prevPage}
          onNextPage={nextPage}
          onGoToPage={goToPage}
          onItemPress={setDetalle}
          onEdit={handleEdit}
        />
      </ScrollView>

      <PolinizacionDetailsModal
        visible={!!detalle}
        polinizacion={detalle}
        onClose={() => setDetalle(null)}
      />

      {/* Modal de Filtros - Ahora se muestra inline en PolinizacionesContent */}

      {/* Formulario de polinización */}
      <PolinizacionForm
        visible={showForm}
        onClose={() => setShowForm(false)}
        form={form}
        setForm={setForm}
        onSave={handleSave}
        onPrediccion={handlePrediccionLocal}
        saving={saving}
        isPredicting={isPredicting}
        prediccion={prediccion}
      />
    </ResponsiveLayout>
  );
}

const createStyles = (colors: ReturnType<typeof import('@/utils/colors').getColors>) => StyleSheet.create({
  mainContainer: {
    backgroundColor: colors.background.secondary,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text.tertiary,
    fontWeight: '500',
  },
});