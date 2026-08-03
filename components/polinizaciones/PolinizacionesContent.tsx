import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import SimpleCalendarPicker from '@/components/common/SimpleCalendarPicker';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  subtitle?: string;
  icon: string;
  iconColor: string;
  iconBg: string;
  styles: any;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  changeType = 'neutral',
  subtitle,
  icon,
  iconColor,
  iconBg,
  styles,
}) => {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricHeader}>
        <Text style={styles.metricTitle}>{title}</Text>
        <View style={[styles.metricIcon, { backgroundColor: iconBg }]}>
          {icon === 'seedling'
            ? <FontAwesome6 name="seedling" size={20} color={iconColor} />
            : <Ionicons name={icon as any} size={20} color={iconColor} />}
        </View>
      </View>
      
      <View style={styles.metricBody}>
        <Text style={styles.metricValue}>{value}</Text>
      </View>
    </View>
  );
};

interface PolinizacionesContentProps {
  totalPolinizaciones: number;
  tasaExito: number;
  cosechasRealizadas: number;
  search: string;
  activeFiltersCount: number;
  tipoRegistro?: 'historicos' | 'nuevos' | 'todos';
  fechaDesde?: string;
  fechaHasta?: string;
  downloading?: boolean;
  onSearchChange: (text: string) => void;
  onClearSearch: () => void;
  onShowFilters: () => void;
  onFechaDesdeChange?: (date: string) => void;
  onFechaHastaChange?: (date: string) => void;
  onTipoRegistroChange?: (tipo: 'historicos' | 'nuevos' | 'todos') => void;
  onDownloadPDF?: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  showFiltersSection?: boolean;
  children?: React.ReactNode;
}

export const PolinizacionesContent: React.FC<PolinizacionesContentProps> = ({
  totalPolinizaciones,
  tasaExito,
  cosechasRealizadas,
  search,
  activeFiltersCount: _activeFiltersCount,
  tipoRegistro = 'todos',
  fechaDesde = '',
  fechaHasta = '',
  downloading = false,
  onSearchChange,
  onClearSearch,
  onShowFilters: _onShowFilters,
  onFechaDesdeChange,
  onFechaHastaChange,
  onTipoRegistroChange,
  onDownloadPDF,
  onRefresh,
  refreshing = false,
  showFiltersSection = false,
  children
}) => {
  const { colors: themeColors } = useTheme();
  const styles = createStyles(themeColors);
  const [localSearch, setLocalSearch] = useState(search);

  return (
    <>
      {/* Métricas */}
      <View style={styles.metricsContainer}>
        <MetricCard
          title="POLINIZACIONES ACTIVAS"
          value={totalPolinizaciones}
          icon="flower-outline"
          iconColor={themeColors.module.polinizacion.primary}
          iconBg={themeColors.module.polinizacion.light}
          styles={styles}
        />

        <MetricCard
          title="TASA DE ÉXITO (MES)"
          value={`${tasaExito}%`}
          icon="checkmark-circle-outline"
          iconColor={themeColors.primary.main}
          iconBg={themeColors.primary.light}
          styles={styles}
        />

        <MetricCard
          title="COSECHAS REALIZADAS"
          value={cosechasRealizadas}
          icon="seedling"
          iconColor={themeColors.status.warning}
          iconBg={themeColors.status.warningLight}
          styles={styles}
        />
      </View>

      {/* Barra de búsqueda moderna con filtros y fechas */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search" size={20} color={themeColors.text.disabled} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar..."
            placeholderTextColor={themeColors.text.disabled}
            value={localSearch}
            onChangeText={setLocalSearch}
            onSubmitEditing={() => onSearchChange(localSearch)}
            returnKeyType="search"
          />
          {localSearch && (
            <TouchableOpacity
              style={styles.clearSearchButton}
              onPress={() => { setLocalSearch(''); onClearSearch(); }}
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
            onDateChange={(date) => onFechaDesdeChange?.(date)}
            placeholder="dd/mm/aaaa"
            label="Desde"
          />
        </View>

        {/* Fecha Hasta */}
        <View style={styles.datePickerWrapper}>
          <SimpleCalendarPicker
            value={fechaHasta}
            onDateChange={(date) => onFechaHastaChange?.(date)}
            placeholder="dd/mm/aaaa"
            label="Hasta"
          />
        </View>

        {/* Botón Actualizar */}
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
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
          onPress={onDownloadPDF}
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

      {/* Sección de Filtros Expandible */}
      {showFiltersSection && (
        <View style={styles.filtersSection}>
          {children}
        </View>
      )}

      {/* Filtros de tipo de registro */}
      <View style={styles.filterTypeContainer}>
        <Text style={styles.filterTypeLabel}>Tipo de registro:</Text>
        <View style={styles.filterTypeButtons}>
          <TouchableOpacity
            style={[
              styles.filterTypeButton,
              tipoRegistro === 'todos' && styles.filterTypeButtonActive
            ]}
            onPress={() => onTipoRegistroChange?.('todos')}
          >
            <Ionicons 
              name="list" 
              size={16} 
              color={tipoRegistro === 'todos' ? themeColors.primary.contrast : themeColors.text.tertiary} 
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
            onPress={() => onTipoRegistroChange?.('nuevos')}
          >
            <Ionicons 
              name="add-circle" 
              size={16} 
              color={tipoRegistro === 'nuevos' ? themeColors.primary.contrast : themeColors.text.tertiary} 
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
            onPress={() => onTipoRegistroChange?.('historicos')}
          >
            <Ionicons 
              name="archive" 
              size={16} 
              color={tipoRegistro === 'historicos' ? themeColors.primary.contrast : themeColors.text.tertiary} 
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
    </>
  );
};

const createStyles = (colors: ReturnType<typeof import('@/utils/colors').getColors>) => StyleSheet.create({
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
    borderWidth: 1,
    borderColor: colors.border.default,
    shadowColor: colors.shadow.color,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricTitle: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.text.tertiary,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    flex: 1,
  },
  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricBody: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: -1,
  },
  metricChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: colors.background.tertiary,
  },
  metricChangePositive: {
    backgroundColor: colors.primary.light,
  },
  metricChangeNegative: {
    backgroundColor: colors.status.errorLight,
  },
  metricChangeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.tertiary,
  },
  metricChangeTextPositive: {
    color: colors.primary.main,
  },
  metricChangeTextNegative: {
    color: colors.status.error,
  },
  metricSubtitle: {
    fontSize: 13,
    color: colors.text.disabled,
    lineHeight: 18,
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
    color: colors.text.secondary,
  },
  actionBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: colors.primary.main,
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
    color: colors.text.inverse,
    fontSize: 10,
    fontWeight: '800',
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

  filtersSection: {
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border.default,
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
