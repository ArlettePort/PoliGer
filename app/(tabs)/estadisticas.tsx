import React, { useEffect, useState, useMemo } from 'react';
import { ScrollView, View, Text, StyleSheet, ActivityIndicator, RefreshControl, useWindowDimensions, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { API_BASE_URL } from '@/config/api.config';
import { ResponsiveLayout } from '@/components/layout';

interface ModeloStats {
  modelo: string;
  estado: string;
  versión: string;
  métricas_modelo: {
    r2: number;
    rmse: number;
    mae: number;
    features: number;
  };
  telemetría: {
    total_predicciones: number;
    cache_hits: number;
    confianza_promedio: number;
    confianza_min: number;
    confianza_max: number;
    tasa_acierto_cache: number;
  };
}

interface RegistrosStats {
  polinizaciones: {
    total: number;
    ultima_semana: number;
    ultimo_mes: number;
    finalizadas: number;
  };
  germinaciones: {
    total: number;
    ultima_semana: number;
    ultimo_mes: number;
    finalizadas: number;
  };
}

export default function EstadisticasScreen() {
  const { colors: themeColors } = useTheme();
  const { token } = useAuth();
  const router = useRouter();
  const { canViewEstadisticas } = usePermissions();
  const { width: windowWidth } = useWindowDimensions();
  const isMobile = windowWidth < 768;
  const styles = useMemo(() => createStyles(themeColors, isMobile), [themeColors, isMobile]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modeloPolinizacion, setModeloPolinizacion] = useState<ModeloStats | null>(null);
  const [modeloGerminacion, setModeloGerminacion] = useState<ModeloStats | null>(null);
  const [registrosStats, setRegistrosStats] = useState<RegistrosStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canViewEstadisticas) {
      Alert.alert('Acceso Denegado', 'No tienes permisos para ver estadísticas');
      router.back();
      return;
    }
    cargarEstadisticas();
  }, [canViewEstadisticas]);

  const cargarEstadisticas = async () => {
    try {
      setError(null);
      setLoading(true);

      const headers = { Authorization: `Bearer ${token}` };

      // Cargar estadísticas de polinización
      const resPol = await axios.get(
        `${API_BASE_URL}/estadisticas/modelo_polinizacion/`,
        { headers }
      );
      setModeloPolinizacion(resPol.data);

      // Cargar estadísticas de germinación
      const resGerm = await axios.get(
        `${API_BASE_URL}/estadisticas/modelo_germinacion/`,
        { headers }
      );
      setModeloGerminacion(resGerm.data);

      // Cargar estadísticas de registros
      const resReg = await axios.get(
        `${API_BASE_URL}/estadisticas/registros_sistema/`,
        { headers }
      );
      setRegistrosStats(resReg.data);
    } catch (err: any) {
      console.error('Error cargando estadísticas:', err);
      setError(err.response?.data?.error || 'Error cargando estadísticas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    cargarEstadisticas();
  };

  if (loading) {
    return (
      <ResponsiveLayout>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.primary} />
          <Text style={styles.loadingText}>Cargando estadísticas...</Text>
        </View>
      </ResponsiveLayout>
    );
  }

  return (
    <ResponsiveLayout>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.title}>Estadísticas del Sistema</Text>

        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={24} color="#ff6b6b" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Modelos ML */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Modelos de Machine Learning</Text>

          {modeloPolinizacion && (
            <ModelCard
              title="Polinización (XGBoost)"
              modelo={modeloPolinizacion}
              colors={themeColors}
              style={styles}
            />
          )}

          {modeloGerminacion && (
            <ModelCard
              title="Germinación (Random Forest)"
              modelo={modeloGerminacion}
              colors={themeColors}
              style={styles}
            />
          )}
        </View>

        {/* Registros en Sistema */}
        {registrosStats && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Registros en el Sistema</Text>

            <View style={styles.statsGrid}>
              <StatCard
                icon="beaker"
                label="Germinaciones"
                value={registrosStats.germinaciones.total}
                subtitle={`${registrosStats.germinaciones.finalizadas} finalizadas`}
                colors={themeColors}
              />
              <StatCard
                icon="leaf"
                label="Polinizaciones"
                value={registrosStats.polinizaciones.total}
                subtitle={`${registrosStats.polinizaciones.finalizadas} finalizadas`}
                colors={themeColors}
              />
              <StatCard
                icon="calendar"
                label="Esta Semana"
                value={registrosStats.germinaciones.ultima_semana + registrosStats.polinizaciones.ultima_semana}
                subtitle="Registros nuevos"
                colors={themeColors}
              />
              <StatCard
                icon="graph"
                label="Este Mes"
                value={registrosStats.germinaciones.ultimo_mes + registrosStats.polinizaciones.ultimo_mes}
                subtitle="Registros nuevos"
                colors={themeColors}
              />
            </View>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Última actualización: {new Date().toLocaleTimeString()}</Text>
        </View>
      </ScrollView>
    </ResponsiveLayout>
  );
}

function ModelCard({ title, modelo, colors, style }: any) {
  const estadoColor = modelo.estado === 'cargado' ? '#51cf66' : '#ff6b6b';

  return (
    <View style={[style.card, { marginBottom: 16 }]}>
      <View style={style.cardHeader}>
        <Text style={style.cardTitle}>{title}</Text>
        <View style={[style.badge, { backgroundColor: estadoColor }]}>
          <Text style={style.badgeText}>{modelo.estado.toUpperCase()}</Text>
        </View>
      </View>

      <View style={style.metricaRow}>
        <Text style={style.metricaLabel}>Modelo:</Text>
        <Text style={style.metricaValue}>{modelo.modelo}</Text>
      </View>

      <View style={style.metricaRow}>
        <Text style={style.metricaLabel}>Versión:</Text>
        <Text style={style.metricaValue}>{modelo.versión}</Text>
      </View>

      <Text style={[style.subTitle, { marginTop: 12 }]}>Métricas de Precisión</Text>
      <View style={style.metricGrid}>
        <MetricItem label="R²" value={modelo.métricas_modelo.r2.toFixed(4)} />
        <MetricItem label="RMSE" value={modelo.métricas_modelo.rmse.toFixed(2)} />
        <MetricItem label="MAE" value={modelo.métricas_modelo.mae.toFixed(2)} />
        <MetricItem label="Features" value={modelo.métricas_modelo.features.toString()} />
      </View>

      <Text style={[style.subTitle, { marginTop: 12 }]}>Telemetría</Text>
      <View style={style.metricaRow}>
        <Text style={style.metricaLabel}>Total Predicciones:</Text>
        <Text style={style.metricaValue}>{modelo.telemetría.total_predicciones}</Text>
      </View>
      <View style={style.metricaRow}>
        <Text style={style.metricaLabel}>Cache Hits:</Text>
        <Text style={style.metricaValue}>
          {modelo.telemetría.cache_hits} ({modelo.telemetría.tasa_acierto_cache.toFixed(1)}%)
        </Text>
      </View>
      <View style={style.metricaRow}>
        <Text style={style.metricaLabel}>Confianza Promedio:</Text>
        <Text style={style.metricaValue}>{modelo.telemetría.confianza_promedio.toFixed(1)}%</Text>
      </View>
      <View style={style.metricaRow}>
        <Text style={style.metricaLabel}>Rango Confianza:</Text>
        <Text style={style.metricaValue}>
          {modelo.telemetría.confianza_min.toFixed(0)}% - {modelo.telemetría.confianza_max.toFixed(0)}%
        </Text>
      </View>
    </View>
  );
}

function StatCard({ icon, label, value, subtitle, colors }: any) {
  return (
    <View style={{ flex: 1, marginBottom: 8 }}>
      <View
        style={{
          backgroundColor: colors.cardBackground,
          borderRadius: 8,
          padding: 12,
          alignItems: 'center',
          borderColor: colors.borderColor,
          borderWidth: 1,
        }}
      >
        <Ionicons name={icon as any} size={24} color={colors.primary} />
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.text, marginTop: 8 }}>
          {value}
        </Text>
        <Text style={{ fontSize: 12, color: colors.textSecondary }}>{label}</Text>
        {subtitle && <Text style={{ fontSize: 10, color: colors.textTertiary, marginTop: 4 }}>{subtitle}</Text>}
      </View>
    </View>
  );
}

function MetricItem({ label, value }: any) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 12, fontWeight: '600' }}>{label}</Text>
      <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{value}</Text>
    </View>
  );
}

function createStyles(colors: any, isMobile: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: isMobile ? 12 : 20,
    },
    title: {
      fontSize: isMobile ? 24 : 32,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 20,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    card: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      padding: 16,
      borderColor: colors.borderColor,
      borderWidth: 1,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text,
    },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
    },
    badgeText: {
      color: '#fff',
      fontSize: 10,
      fontWeight: '600',
    },
    subTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    metricaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 6,
      borderBottomColor: colors.borderColor,
      borderBottomWidth: 1,
    },
    metricaLabel: {
      color: colors.textSecondary,
      fontSize: 12,
    },
    metricaValue: {
      fontWeight: '600',
      color: colors.text,
      fontSize: 12,
    },
    metricGrid: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: 8,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 12,
      color: colors.textSecondary,
    },
    errorContainer: {
      backgroundColor: '#ffe0e0',
      borderRadius: 8,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    errorText: {
      color: '#c92a2a',
      marginLeft: 12,
      flex: 1,
    },
    footer: {
      paddingTop: 20,
      borderTopColor: colors.borderColor,
      borderTopWidth: 1,
      alignItems: 'center',
    },
    footerText: {
      color: colors.textTertiary,
      fontSize: 12,
    },
  });
}
