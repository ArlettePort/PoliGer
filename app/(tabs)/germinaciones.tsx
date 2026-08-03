import { useEffect, useState, useMemo } from 'react';
import { View, Modal, StyleSheet, ScrollView, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons, FontAwesome6 } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/navigation';
import { ResponsiveLayout } from '@/components/layout';
import { PrediccionMejoradaModal, GerminacionDetailsModal } from '@/components/modals';
import { germinacionService } from '@/services/germinacion.service';
import { reportesService } from '@/services/reportes.service';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';
import SimpleCalendarPicker from '@/components/common/SimpleCalendarPicker';

// Extracted components and hooks
import { useResponsive } from '@/hooks/useResponsive';
import { useGerminaciones } from '@/hooks/useGerminaciones';
import { useGerminacionesWithFilters } from '@/hooks/useGerminacionesWithFilters';
import { GerminacionForm } from '@/components/forms/GerminacionForm';
import { GerminacionesHeader, GerminacionesContent } from '@/components/germinaciones';
import GerminacionFilters from '@/components/filters/GerminacionFilters';
import type { Germinacion } from '@/types';
import { logger } from '@/services/logger';

export default function GerminacionesScreen() {
  const { user } = useAuth();
  const responsive = useResponsive();
  const { colors: themeColors } = useTheme();
  const { showToast } = useToast();

  // Use hook with pagination and filters
  const {
    germinaciones,
    loading,
    refreshing,
    filters,
    setFilters,
    activeFiltersCount,
    goToPage,
    nextPage,
    prevPage,
    refresh,
    totalCount,
    currentPage,
    totalPages,
  } = useGerminacionesWithFilters();

  // Use old hook only for form management
  const germinacionesHook = useGerminaciones(user);

  // Local state for UI
  const [inputSearch, setInputSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [saving, setSaving] = useState(false);
  const [detalle, setDetalle] = useState<Germinacion | null>(null);
  const [tipoRegistro, setTipoRegistro] = useState<'historicos' | 'nuevos' | 'todos'>('todos');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [downloading, setDownloading] = useState(false);

  // Métricas de registros nuevos
  const [metricas, setMetricas] = useState({ en_proceso: 0, finalizados: 0, exito_promedio: 0, total: 0 });

  // Prediction states (solo para mantener compatibilidad con el modal antiguo)
  const [showPrediccionModal, setShowPrediccionModal] = useState(false);
  const [prediccionData, setPrediccionData] = useState<any>(null);
  const [loadingPrediccion, setLoadingPrediccion] = useState(false);
  const [prediccionError, setPrediccionError] = useState<string | null>(null);

  // Initialize data loading
  useEffect(() => {
    if (user) {
      germinacionesHook.loadCodigosDisponibles();
      germinacionesHook.loadCodigosConEspecies();
      germinacionesHook.loadPerchasDisponibles();
      germinacionService.getMetricasNuevos().then(setMetricas);
    }
  }, [user, germinacionesHook.loadCodigosDisponibles, germinacionesHook.loadCodigosConEspecies, germinacionesHook.loadPerchasDisponibles]);

  // Handle form submission
  const handleSubmit = async () => {
    setSaving(true);
    try {
      // Pasar la predicción si está disponible
      const success = await germinacionesHook.handleAddGerminacion(prediccionData);
      if (success) {
        setShowForm(false);
        germinacionesHook.resetForm();
        setPrediccionData(null); // Limpiar predicción
        setShowPrediccionModal(false); // Cerrar modal de predicción

        // Navegar a la página 1 para ver la nueva germinación
        goToPage(1);
      }
    } finally {
      setSaving(false);
    }
  };

  // Manejar cambio de estado de germinación
  const handleChangeEstado = async (id: number, nuevoEstado: string) => {
    try {
      await germinacionService.cambiarEstadoGerminacion(
        id,
        nuevoEstado as 'INICIAL' | 'EN_PROCESO_TEMPRANO' | 'EN_PROCESO_AVANZADO' | 'FINALIZADO'
      );
      // Refrescar la lista y métricas
      await refresh();
      germinacionService.getMetricasNuevos().then(setMetricas);
    } catch (error) {
      logger.error('Error cambiando estado:', error);
      showToast('No se pudo cambiar el estado de la germinación.', 'error');
    }
  };

  // Manejar cambio de tipo de registro
  const handleTipoRegistroChange = (tipo: 'historicos' | 'nuevos' | 'todos') => {
    logger.info(' Cambiando tipo de registro para germinaciones:', tipo);
    setTipoRegistro(tipo);

    const newFilters: any = {
      ...filters,
    };

    if (tipo !== 'todos') {
      newFilters.tipo_registro = tipo;
    } else {
      delete newFilters.tipo_registro;
    }

    setFilters(newFilters);
  };

  // Handle PDF download with date filters
  const handleDownloadPDF = async () => {
    if (!fechaDesde || !fechaHasta) {
      showToast('Debes seleccionar las fechas "Desde" y "Hasta" antes de descargar el PDF', 'error');
      return;
    }
    try {
      setDownloading(true);
      const filtros: any = {};

      if (fechaDesde) {
        filtros.fecha_inicio = fechaDesde;
      }
      if (fechaHasta) {
        filtros.fecha_fin = fechaHasta;
      }

      await reportesService.generarReporteGerminaciones('pdf', filtros);
      showToast('PDF descargado exitosamente', 'success');
    } catch (error) {
      logger.error('Error descargando PDF:', error);
      showToast('Error al descargar el PDF', 'error');
    } finally {
      setDownloading(false);
    }
  };

  const styles = useMemo(() => createStyles(themeColors), [themeColors]);

  return (
    <ProtectedRoute requiredModule="germinaciones" requiredAction="ver">
      <ResponsiveLayout currentTab="germinaciones" style={styles.mainContainer}>
        <ScrollView 
          style={styles.container}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <GerminacionesHeader
            onShowForm={() => setShowForm(true)}
          />

          {/* Tarjetas de Métricas */}
          <View style={styles.metricsContainer}>
            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Text style={styles.metricLabel}>Total en Proceso</Text>
                <View style={[styles.metricIcon, { backgroundColor: themeColors.status.successLight }]}>
                  <FontAwesome6 name="seedling" size={20} color={themeColors.status.success} />
                </View>
              </View>
              <View style={styles.metricValueContainer}>
                <Text style={styles.metricValue}>{metricas.en_proceso}</Text>
              </View>
            </View>

            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Text style={styles.metricLabel}>Éxito Promedio</Text>
                <View style={[styles.metricIcon, { backgroundColor: themeColors.primary.light }]}>
                  <Ionicons name="checkmark-circle" size={20} color={themeColors.primary.main} />
                </View>
              </View>
              <View style={styles.metricValueContainer}>
                <Text style={styles.metricValue}>{metricas.exito_promedio}%</Text>
              </View>
            </View>

            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Text style={styles.metricLabel}>Finalizados</Text>
                <View style={[styles.metricIcon, { backgroundColor: themeColors.status.warningLight }]}>
                  <Ionicons name="checkmark-done" size={20} color={themeColors.status.warning} />
                </View>
              </View>
              <View style={styles.metricValueContainer}>
                <Text style={styles.metricValue}>{metricas.finalizados}</Text>
              </View>
            </View>
          </View>

          {/* Barra de búsqueda con filtros y fechas */}
          <View style={styles.searchBarContainer}>
            <View style={styles.searchInputWrapper}>
              <Ionicons name="search" size={20} color={themeColors.text.disabled} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar..."
                placeholderTextColor={themeColors.text.disabled}
                value={inputSearch}
                onChangeText={setInputSearch}
                onSubmitEditing={() => setFilters({ ...filters, search: inputSearch })}
                returnKeyType="search"
              />
              {inputSearch && (
                <TouchableOpacity
                  style={styles.clearSearchButton}
                  onPress={() => { setInputSearch(''); setFilters({ ...filters, search: '' }); }}
                >
                  <Ionicons name="close-circle" size={20} color={themeColors.text.disabled} />
                </TouchableOpacity>
              )}
            </View>

{/* Botón de Filtros oculto */}

            {/* Fecha Desde */}
            <View style={styles.datePickerWrapper}>
              <SimpleCalendarPicker
                value={fechaDesde}
                onDateChange={(date) => setFechaDesde(date)}
                placeholder="dd/mm/aaaa"
                label="Desde"
              />
            </View>

            {/* Fecha Hasta */}
            <View style={styles.datePickerWrapper}>
              <SimpleCalendarPicker
                value={fechaHasta}
                onDateChange={(date) => setFechaHasta(date)}
                placeholder="dd/mm/aaaa"
                label="Hasta"
              />
            </View>

            {/* Botón Actualizar */}
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={refresh}
              disabled={refreshing}
            >
              {refreshing ? (
                <ActivityIndicator size="small" color={themeColors.interactive.primary} />
              ) : (
                <Ionicons name="refresh" size={20} color={themeColors.interactive.primary} />
              )}
              <Text style={styles.refreshButtonText}>Actualizar</Text>
            </TouchableOpacity>

            {/* Botón Descargar PDF */}
            <TouchableOpacity
              style={[styles.downloadButton, downloading && styles.downloadButtonDisabled]}
              onPress={handleDownloadPDF}
              disabled={downloading}
            >
              {downloading ? (
                <>
                  <ActivityIndicator size="small" color={themeColors.text.primary} />
                  <Text style={styles.downloadButtonText}>Descargando...</Text>
                </>
              ) : (
                <>
                  <FontAwesome6 name="file-pdf" size={18} color={themeColors.text.primary} />
                  <Text style={styles.downloadButtonText}>Descargar PDF</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Filtros de tipo de registro */}
          <View style={styles.filterTypeContainer}>
            <Text style={styles.filterTypeLabel}>Tipo de registro:</Text>
            <View style={styles.filterTypeButtons}>
              <TouchableOpacity
                style={[
                  styles.filterTypeButton,
                  tipoRegistro === 'todos' && styles.filterTypeButtonActive
                ]}
                onPress={() => handleTipoRegistroChange('todos')}
              >
                <Ionicons 
                  name="list" 
                  size={16} 
                  color={tipoRegistro === 'todos' ? themeColors.text.inverse : themeColors.text.tertiary} 
                />
                <Text style={[
                  styles.filterTypeButtonText,
                  tipoRegistro === 'todos' && styles.filterTypeButtonTextActive
                ]}>
                  Todos
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.filterTypeButton,
                  tipoRegistro === 'nuevos' && styles.filterTypeButtonActive
                ]}
                onPress={() => handleTipoRegistroChange('nuevos')}
              >
                <Ionicons 
                  name="add-circle" 
                  size={16} 
                  color={tipoRegistro === 'nuevos' ? themeColors.text.inverse : themeColors.text.tertiary} 
                />
                <Text style={[
                  styles.filterTypeButtonText,
                  tipoRegistro === 'nuevos' && styles.filterTypeButtonTextActive
                ]}>
                  Nuevos
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.filterTypeButton,
                  tipoRegistro === 'historicos' && styles.filterTypeButtonActive
                ]}
                onPress={() => handleTipoRegistroChange('historicos')}
              >
                <Ionicons 
                  name="archive" 
                  size={16} 
                  color={tipoRegistro === 'historicos' ? themeColors.text.inverse : themeColors.text.tertiary} 
                />
                <Text style={[
                  styles.filterTypeButtonText,
                  tipoRegistro === 'historicos' && styles.filterTypeButtonTextActive
                ]}>
                  Históricos
                </Text>
              </TouchableOpacity>
            </View>
          </View>

        <GerminacionesContent
          germinaciones={germinaciones}
          loading={loading}
          refreshing={refreshing}
          totalCount={totalCount}
          currentPage={currentPage}
          totalPages={totalPages}
          activeFiltersCount={activeFiltersCount}
          tipoRegistro={tipoRegistro}
          responsive={responsive}
          onRefresh={refresh}
          onShowFilters={() => setShowFilters(true)}
          onShowForm={() => setShowForm(true)}
          onPrevPage={prevPage}
          onNextPage={nextPage}
          onGoToPage={goToPage}
          onItemPress={setDetalle}
          onTipoRegistroChange={handleTipoRegistroChange}
          onChangeEstado={handleChangeEstado}
        />
        </ScrollView>

        {/* Form Modal - Panel Lateral Derecho */}
        <GerminacionForm
          visible={showForm}
          onClose={() => setShowForm(false)}
          form={germinacionesHook.form}
          setForm={germinacionesHook.setForm}
          onSubmit={handleSubmit}
          saving={saving}
          codigosDisponibles={germinacionesHook.codigosDisponibles}
          especiesDisponibles={germinacionesHook.especiesDisponibles}
          perchasDisponibles={germinacionesHook.perchasDisponibles}
          nivelesDisponibles={germinacionesHook.nivelesDisponibles}
          handleCodigoSelection={germinacionesHook.handleCodigoSelection}
          handleEspecieSelection={germinacionesHook.handleEspecieSelection}
          useOwnModal={true}
        />

        {/* Prediction Modal */}
        <PrediccionMejoradaModal
          visible={showPrediccionModal}
          onClose={() => setShowPrediccionModal(false)}
          onAceptar={() => setShowPrediccionModal(false)}
          prediccionData={prediccionData}
          loading={loadingPrediccion}
          error={prediccionError}
        />

        {/* Filters Modal - Popup Centrado */}
        <Modal
          visible={showFilters}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setShowFilters(false)}
        >
          <View style={styles.filterModalOverlay}>
            <View style={styles.filterModalContent}>
              <GerminacionFilters
                filters={filters}
                onFiltersChange={(newFilters) => {
                  setFilters(newFilters);
                  setShowFilters(false);
                }}
                onClose={() => setShowFilters(false)}
              />
            </View>
          </View>
        </Modal>

        <GerminacionDetailsModal
          visible={!!detalle}
          germinacion={detalle}
          onClose={() => setDetalle(null)}
          onCambiarEtapa={async (id, etapa) => handleChangeEstado(id, etapa)}
        />
      </ResponsiveLayout>
    </ProtectedRoute>
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
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    padding: 12,
    shadowColor: colors.shadow.color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 9,
    color: colors.text.tertiary,
    fontWeight: '600',
  },
  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValueContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: -1,
  },
  metricBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.status.successLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  metricBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.status.success,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    backgroundColor: colors.background.primary,
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border.default,
    gap: 8,
    shadowColor: colors.shadow.color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    justifyContent: 'space-between',
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border.default,
    flex: 1,
    minWidth: 100,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.text.primary,
  },
  clearSearchButton: {
    padding: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.default,
    position: 'relative',
    minHeight: 48,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  
  filterTypeContainer: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
    marginBottom: 16,
  },

  filterTypeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },

  filterTypeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },

  filterTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.border.default,
    flexGrow: 0,
    flexShrink: 0,
  },

  filterTypeButtonActive: {
    backgroundColor: colors.interactive.primary,
    borderColor: colors.interactive.primary,
  },

  filterTypeButtonText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.text.tertiary,
  },

  filterTypeButtonTextActive: {
    color: colors.primary.contrast,
    fontWeight: '600',
  },
  actionBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: colors.status.success,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: colors.background.primary,
  },
  actionBadgeText: {
    color: colors.background.primary,
    fontSize: 10,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.background.primary,
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
    shadowColor: colors.shadow.color,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  detalleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary.main,
    marginBottom: 16,
    textAlign: 'center',
  },
  detalleContent: {
    maxHeight: 400,
  },
  detalleRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  detalleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    width: 140,
    marginRight: 12,
  },
  detalleValue: {
    fontSize: 14,
    color: colors.text.secondary,
    flex: 1,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  modalButton: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  modalButtonText: {
    color: colors.background.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  formModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formModalContent: {
    backgroundColor: colors.background.primary,
    borderRadius: 16,
    width: '90%',
    maxWidth: 700,
    maxHeight: '85%',
    shadowColor: colors.shadow.color,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  formModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
    backgroundColor: colors.background.secondary,
  },
  formModalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  formModalSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  formModalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  formModalScrollView: {
    flex: 1,
  },
  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterModalContent: {
    backgroundColor: colors.background.primary,
    borderRadius: 16,
    width: '90%',
    maxWidth: 600,
    maxHeight: '85%',
    shadowColor: colors.shadow.color,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },

  datePickerWrapper: {
    flex: 1,
    minWidth: 100,
  },

  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: colors.background.secondary,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border.default,
    minHeight: 36,
    minWidth: 100,
    flex: 1,
  },
  refreshButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.primary,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: colors.background.secondary,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border.default,
    minHeight: 36,
    minWidth: 100,
    flex: 1,
  },

  downloadButtonDisabled: {
    opacity: 0.5,
  },

  downloadButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.primary,
  },
});