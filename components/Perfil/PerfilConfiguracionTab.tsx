import { useEffect, useState, useCallback, useMemo, memo } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { reentrenamientoService, type ModeloReentrenamiento, type ConteosReentrenamiento } from '@/services/reentrenamiento.service';
import { logger } from '@/services/logger';

// Mensajes de error seguros para mostrar al usuario
const getErrorMessage = (error: any): string => {
  // No exponemos mensajes del servidor directamente
  if (error.response?.status === 403) {
    return 'No tienes permiso para realizar esta acción';
  }
  if (error.response?.status === 400) {
    return 'Datos inválidos. Intenta nuevamente.';
  }
  if (error.response?.status === 503) {
    return 'El servicio no está disponible. Intenta más tarde.';
  }
  if (error.response?.status >= 500) {
    logger.error('Error del servidor', error);
    return 'Ocurrió un error en el servidor. Por favor intenta más tarde.';
  }
  if (error.message?.includes('timeout')) {
    return 'La solicitud tardó demasiado tiempo. Intenta nuevamente.';
  }
  // Fallback seguro
  return 'Ocurrió un error desconocido. Por favor intenta nuevamente.';
};

// Validar modelo
const isValidModel = (modelo: unknown): modelo is ModeloReentrenamiento => {
  return modelo === 'polinizacion' || modelo === 'germinacion' || modelo === 'ambos';
};

// Componente de tarjeta memorizador para optimizar renders
interface ModelCardProps {
  modelKey: 'polinizacion' | 'germinacion';
  label: string;
  badge: string;
  gradientColors: [string, string];
  accentColor: string;
  count: number;
  minimo: number;
  isReady: boolean;
  isLoading: boolean;
  isButtonEnabled: boolean;
  conteosLoading: boolean;
  conteosError: boolean;
  onReentrenar: (modelo: 'polinizacion' | 'germinacion') => void;
  colors: any;
  styles: any;
}

const ModelCard = memo<ModelCardProps>(({
  modelKey,
  label,
  badge,
  gradientColors,
  accentColor,
  count,
  minimo,
  isReady,
  isLoading,
  isButtonEnabled,
  conteosLoading,
  conteosError,
  onReentrenar,
  colors,
  styles: s,
}) => {
  const progreso = useMemo(() => Math.min((count / minimo) * 100, 100), [count, minimo]);
  const statusText = useMemo(() => {
    if (conteosLoading) return 'Cargando...';
    if (conteosError) return 'No se pudo cargar';
    if (isReady) return 'Listo para reentrenar';
    return `Faltan ${(minimo - count).toLocaleString()} registros para habilitar el reentrenamiento`;
  }, [conteosLoading, conteosError, isReady, count, minimo]);

  const successColor = colors.status.success;

  return (
    <View style={s.card}>
      <LinearGradient colors={gradientColors} style={s.cardHeader}>
        <View style={s.badgeContainer}>
          <Text style={s.badgeText}>{badge}</Text>
        </View>
        <View style={s.cardTitleRow}>
          {modelKey === 'polinizacion' ? (
            <Ionicons name="flower-outline" size={17} color="rgba(255,255,255,0.85)" style={s.cardIcon} />
          ) : (
            <FontAwesome6 name="seedling" size={15} color="rgba(255,255,255,0.85)" style={s.cardIcon} />
          )}
          <Text style={s.cardTitle}>{label}</Text>
        </View>
      </LinearGradient>

      <View style={s.cardBody}>
        <Text style={s.registrosLabel}>REGISTROS FINALIZADOS</Text>

        <View style={s.countRow}>
          {conteosLoading ? (
            <ActivityIndicator size="small" color={accentColor} />
          ) : conteosError ? (
            <Text style={[s.countCurrent, { color: colors.status.error, fontSize: 22 }]}>—</Text>
          ) : (
            <Text>
              <Text style={[s.countCurrent, { color: accentColor }]}>
                {count.toLocaleString()}
              </Text>
              <Text style={s.countTotal}> / {minimo.toLocaleString()}</Text>
            </Text>
          )}
        </View>

        <View style={s.progressTrack}>
          <View
            style={[
              s.progressFill,
              { width: `${progreso}%` as any, backgroundColor: accentColor },
            ]}
          />
        </View>
        <Text style={[s.progressPct, { color: accentColor }]}>
          {!conteosLoading && !conteosError ? `${progreso.toFixed(1)}%` : ''}
        </Text>

        <View style={s.statusRow}>
          {!conteosLoading && !conteosError && (
            <Ionicons
              name={isReady ? 'checkmark-circle' : 'information-circle-outline'}
              size={12}
              color={isReady ? successColor : colors.text.disabled}
              style={{ marginRight: 4, marginTop: 1 }}
            />
          )}
          <Text style={[s.statusText, isReady && { color: successColor }]}>
            {statusText}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[
          s.cardButton,
          isButtonEnabled
            ? { backgroundColor: accentColor, borderColor: accentColor }
            : s.cardButtonDisabled,
        ]}
        onPress={() => onReentrenar(modelKey)}
        disabled={!isButtonEnabled}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={isButtonEnabled ? colors.primary.contrast : colors.text.disabled} />
        ) : (
          <View style={s.buttonContent}>
            {!isButtonEnabled && (
              <Ionicons name="lock-closed" size={13} color={colors.text.disabled} style={{ marginRight: 6 }} />
            )}
            <Text style={[s.cardButtonText, !isButtonEnabled && s.cardButtonTextDisabled]}>
              Reentrenar {label}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
});

export function PerfilConfiguracionTab() {
  const { colors } = useTheme();
  const [conteos, setConteos] = useState<ConteosReentrenamiento | null>(null);
  const [conteosLoading, setConteosLoading] = useState(true);
  const [conteosError, setConteosError] = useState(false);
  const [reentrenamientoLoading, setReentrenamientoLoading] = useState<ModeloReentrenamiento | null>(null);
  const [reentrenamientoResultado, setReentrenamientoResultado] = useState<string | null>(null);

  const fetchConteos = useCallback(async () => {
    setConteosLoading(true);
    setConteosError(false);
    try {
      const data = await reentrenamientoService.getConteos();
      setConteos(data);
    } catch (error) {
      logger.error('Error al cargar conteos de reentrenamiento', error);
      setConteos(null);
      setConteosError(true);
    } finally {
      setConteosLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConteos();
  }, [fetchConteos]);

  const puedeReentrenar = useCallback((modelo: 'polinizacion' | 'germinacion'): boolean => {
    if (!conteos) return false;
    return conteos[modelo] >= conteos.minimo_requerido;
  }, [conteos]);

  const botonHabilitado = useCallback((modelo: ModeloReentrenamiento): boolean => {
    if (reentrenamientoLoading !== null || conteosLoading || !conteos) return false;
    if (modelo === 'ambos') return puedeReentrenar('polinizacion') && puedeReentrenar('germinacion');
    return puedeReentrenar(modelo);
  }, [reentrenamientoLoading, conteosLoading, conteos, puedeReentrenar]);

  const handleReentrenar = useCallback((modelo: unknown) => {
    // Validar modelo antes de proceder
    if (!isValidModel(modelo)) {
      logger.warn('Intento de reentrenamiento con modelo inválido', { modelo });
      Alert.alert('Error', 'Modelo inválido');
      return;
    }

    const labels = { polinizacion: 'Polinizacion', germinacion: 'Germinacion', ambos: 'Ambos Modelos' };
    Alert.alert(
      'Reentrenar Modelo',
      `¿Reentrenar el modelo de ${labels[modelo]}? Esto puede tardar 30 minutos. Te mostraremos el progreso.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reentrenar',
          style: 'destructive',
          onPress: async () => {
            setReentrenamientoLoading(modelo);
            setReentrenamientoResultado(null);
            try {
              logger.info(`Iniciando reentrenamiento asíncrono de modelo: ${modelo}`);

              // Iniciar reentrenamiento asíncrono
              const initResponse = await reentrenamientoService.reentrenar(modelo);

              logger.info(`Reentrenamiento iniciado con task_id: ${initResponse.task_id}`);
              Alert.alert(
                'Reentrenamiento Iniciado',
                `El reentrenamiento ha sido iniciado. Esto puede tardar hasta 30 minutos.\n\nPuedes cerrar esta pantalla, el proceso continuará en segundo plano.`
              );

              // Poll para obtener el status (en background)
              reentrenamientoService.pollUntilComplete(
                initResponse.task_id,
                (status) => {
                  logger.info(`Progreso reentrenamiento: ${status.progress}% - ${status.status}`);
                }
              ).then((finalStatus) => {
                if (finalStatus.status === 'SUCCESS' && finalStatus.result) {
                  const result = finalStatus.result.resultado || finalStatus.result;
                  let msg = 'Reentrenamiento completado exitosamente';

                  if (Array.isArray(result) || (result && typeof result === 'object')) {
                    msg += '\n\nLos modelos han sido actualizados correctamente.';
                  }

                  logger.info(`Reentrenamiento completado: ${modelo}`);
                  setReentrenamientoResultado(msg);
                  fetchConteos();

                  // Mostrar alerta de éxito
                  Alert.alert('✓ Éxito', msg);
                } else if (finalStatus.status === 'FAILURE') {
                  const errorMsg = finalStatus.error || 'Error desconocido';
                  logger.error(`Error en reentrenamiento: ${modelo} - ${errorMsg}`);
                  Alert.alert('Error', `Reentrenamiento fallido: ${errorMsg}`);
                }
                setReentrenamientoLoading(null);
              }).catch((error) => {
                logger.error(`Error en polling del reentrenamiento: ${modelo}`, error);
                Alert.alert('Error', 'Hubo un problema al monitorear el reentrenamiento');
                setReentrenamientoLoading(null);
              });

            } catch (error: any) {
              const msg = getErrorMessage(error);
              logger.error(`Error iniciando reentrenamiento: ${modelo}`, error);
              Alert.alert('Error', msg);
              setReentrenamientoLoading(null);
            }
          },
        },
      ]
    );
  }, [fetchConteos]);

  const minimo = useMemo(() => conteos?.minimo_requerido ?? 1000, [conteos?.minimo_requerido]);

  // Colores del sistema por modulo - memoizados
  const colors_memo = useMemo(() => ({
    polColor: colors.module.polinizacion.primary,
    polColorDark: colors.primary.dark,
    germColor: colors.module.germinacion.primary,
    germColorDark: colors.module.germinacion.icon,
    successColor: colors.status.success,
  }), [colors]);

  const modelos = useMemo(() => [
    {
      key: 'polinizacion' as const,
      label: 'Polinizacion',
      badge: 'MODELO DE PRODUCCION',
      gradientColors: [colors_memo.polColorDark, colors_memo.polColor] as [string, string],
      accentColor: colors_memo.polColor,
    },
    {
      key: 'germinacion' as const,
      label: 'Germinacion',
      badge: 'MODELO DE ANALISIS',
      gradientColors: [colors_memo.germColorDark, colors_memo.germColor] as [string, string],
      accentColor: colors_memo.germColor,
    },
  ], [colors_memo]);

  const s = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={s.container}>
      <Text style={s.title}>Configuracion de Modelos ML</Text>
      <Text style={s.subtitle}>
        Los modelos se habilitan automaticamente al alcanzar{' '}
        <Text style={s.subtitleBold}>1,000 registros</Text> en estado{' '}
        <Text style={[s.subtitleAccent, { color: colors_memo.successColor }]}>Finalizado</Text>.
      </Text>

      <View style={s.cardsRow}>
        {modelos.map(({ key, label, badge, gradientColors, accentColor }) => {
          const count = conteos?.[key] ?? 0;
          const isReady = puedeReentrenar(key);
          const isLoading = reentrenamientoLoading === key;
          const isButtonEnabled = botonHabilitado(key);

          return (
            <ModelCard
              key={key}
              modelKey={key}
              label={label}
              badge={badge}
              gradientColors={gradientColors}
              accentColor={accentColor}
              count={count}
              minimo={minimo}
              isReady={isReady}
              isLoading={isLoading}
              isButtonEnabled={isButtonEnabled}
              conteosLoading={conteosLoading}
              conteosError={conteosError}
              onReentrenar={handleReentrenar}
              colors={colors}
              styles={s}
            />
          );
        })}
      </View>

      {/* Boton ambos */}
      {(() => {
        const habilitadoAmbos = botonHabilitado('ambos');
        const isLoadingAmbos = reentrenamientoLoading === 'ambos';
        return (
          <TouchableOpacity
            style={[
              s.ambosButton,
              habilitadoAmbos
                ? { backgroundColor: colors.interactive.primary, borderColor: colors.interactive.primary }
                : s.cardButtonDisabled,
            ]}
            onPress={() => handleReentrenar('ambos')}
            disabled={!habilitadoAmbos}
          >
            {isLoadingAmbos ? (
              <ActivityIndicator size="small" color={habilitadoAmbos ? colors.primary.contrast : colors.text.disabled} />
            ) : (
              <View style={s.buttonContent}>
                {!habilitadoAmbos && (
                  <Ionicons name="lock-closed" size={13} color={colors.text.disabled} style={{ marginRight: 6 }} />
                )}
                <Ionicons
                  name="leaf-outline"
                  size={15}
                  color={habilitadoAmbos ? colors.primary.contrast : colors.text.disabled}
                  style={{ marginRight: 6 }}
                />
                <Text style={[s.ambosButtonText, !habilitadoAmbos && s.cardButtonTextDisabled]}>
                  Reentrenar Ambos Modelos
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })()}

      {conteosError && !conteosLoading && (
        <TouchableOpacity style={s.retryButton} onPress={fetchConteos}>
          <Ionicons name="refresh" size={13} color={colors.text.tertiary} style={{ marginRight: 4 }} />
          <Text style={s.retryText}>Reintentar</Text>
        </TouchableOpacity>
      )}

      {reentrenamientoResultado && (
        <View style={s.resultado}>
          <View style={s.resultadoHeader}>
            <Ionicons name="checkmark-circle" size={16} color={colors.status.success} style={{ marginRight: 6 }} />
            <Text style={[s.resultadoTitle, { color: colors.status.successDark }]}>
              Reentrenamiento completado
            </Text>
          </View>
          <Text style={[s.resultadoText, { color: colors.status.successDark }]}>
            {reentrenamientoResultado}
          </Text>
        </View>
      )}
    </View>
  );
}

function createStyles(colors: ReturnType<typeof import('@/utils/colors').getColors>) {
  return StyleSheet.create({
    container: {
      padding: 16,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text.primary,
      marginBottom: 6,
    },
    subtitle: {
      fontSize: 13,
      color: colors.text.tertiary,
      marginBottom: 20,
      lineHeight: 20,
    },
    subtitleBold: {
      fontWeight: '700',
      color: colors.text.primary,
    },
    subtitleAccent: {
      fontWeight: '600',
    },
    cardsRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 12,
    },
    card: {
      flex: 1,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: colors.background.primary,
      borderWidth: 1,
      borderColor: colors.border.default,
      shadowColor: colors.shadow.color,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 3,
    },
    cardHeader: {
      paddingHorizontal: 12,
      paddingTop: 10,
      paddingBottom: 14,
      minHeight: 80,
      justifyContent: 'space-between',
    },
    badgeContainer: {
      alignSelf: 'flex-start',
      backgroundColor: 'rgba(255,255,255,0.22)',
      borderRadius: 4,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    badgeText: {
      fontSize: 9,
      fontWeight: '700',
      color: '#fff',
      letterSpacing: 0.5,
    },
    cardTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
    },
    cardIcon: {
      marginRight: 6,
    },
    cardTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: '#fff',
    },
    cardBody: {
      padding: 12,
      paddingBottom: 8,
    },
    registrosLabel: {
      fontSize: 9,
      fontWeight: '700',
      color: colors.text.disabled,
      letterSpacing: 0.8,
      marginBottom: 4,
    },
    countRow: {
      marginBottom: 8,
      minHeight: 32,
      justifyContent: 'center',
    },
    countCurrent: {
      fontSize: 26,
      fontWeight: '700',
    },
    countTotal: {
      fontSize: 14,
      color: colors.text.disabled,
      fontWeight: '500',
    },
    progressTrack: {
      height: 6,
      backgroundColor: colors.border.default,
      borderRadius: 3,
      overflow: 'hidden',
      marginBottom: 4,
    },
    progressFill: {
      height: '100%',
      borderRadius: 3,
    },
    progressPct: {
      fontSize: 11,
      fontWeight: '600',
      textAlign: 'right',
      marginBottom: 6,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 4,
    },
    statusText: {
      fontSize: 10,
      color: colors.text.tertiary,
      lineHeight: 14,
      flex: 1,
    },
    cardButton: {
      margin: 12,
      marginTop: 4,
      paddingVertical: 10,
      borderRadius: 8,
      alignItems: 'center',
      borderWidth: 1,
    },
    cardButtonDisabled: {
      backgroundColor: colors.interactive.disabled,
      borderColor: colors.border.default,
    },
    buttonContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    cardButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.primary.contrast,
    },
    cardButtonTextDisabled: {
      color: colors.text.disabled,
    },
    ambosButton: {
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
      borderWidth: 1,
      marginBottom: 12,
    },
    ambosButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary.contrast,
    },
    retryButton: {
      flexDirection: 'row',
      alignSelf: 'center',
      alignItems: 'center',
      paddingVertical: 6,
      paddingHorizontal: 16,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.border.medium,
      marginBottom: 12,
    },
    retryText: {
      fontSize: 12,
      color: colors.text.tertiary,
    },
    resultado: {
      padding: 12,
      backgroundColor: colors.status.successLight,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.status.success,
    },
    resultadoHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    resultadoTitle: {
      fontSize: 13,
      fontWeight: '600',
    },
    resultadoText: {
      fontSize: 12,
      lineHeight: 18,
    },
  });
}
