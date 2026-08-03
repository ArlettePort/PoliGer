import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProtectedButton } from '@/components/navigation';
import { useTheme } from '@/contexts/ThemeContext';

interface GerminacionesHeaderProps {
  onShowForm: () => void;
}

export const GerminacionesHeader: React.FC<GerminacionesHeaderProps> = ({
  onShowForm,
}) => {
  const { colors: themeColors } = useTheme();
  const styles = createStyles(themeColors);

  return (
    <>
      {/* Breadcrumb */}
      <View style={styles.breadcrumb}>
        <Text style={styles.breadcrumbText}>Inicio</Text>
        <Text style={styles.breadcrumbSeparator}>/</Text>
        <Text style={styles.breadcrumbTextActive}>Germinaciones</Text>
      </View>

      {/* Header Principal */}
      <View style={styles.mainHeader}>
        <View style={styles.headerContent}>
          <Text style={styles.mainTitle}>Gestión de Germinaciones</Text>
          <Text style={styles.mainSubtitle}>
            Administra y monitorea el ciclo de vida de los cultivos y lotes de germinación en tiempo real.
          </Text>
        </View>

        <ProtectedButton
          requiredModule="germinaciones"
          requiredAction="crear"
          onPress={onShowForm}
          style={styles.newButton}
        >
          <Ionicons name="add" size={18} color={themeColors.primary.contrast} />
          <Text style={styles.newButtonText}>Nueva Germinación</Text>
        </ProtectedButton>
      </View>
    </>
  );
};

const createStyles = (colors: ReturnType<typeof import('@/utils/colors').getColors>) => StyleSheet.create({
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  breadcrumbText: {
    fontSize: 12,
    color: colors.text.disabled,
    fontWeight: '500',
  },
  breadcrumbSeparator: {
    fontSize: 12,
    color: colors.border.medium,
  },
  breadcrumbTextActive: {
    fontSize: 12,
    color: colors.text.primary,
    fontWeight: '600',
  },
  mainHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerContent: {
    flex: 1,
    marginRight: 12,
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  mainSubtitle: {
    fontSize: 12,
    color: colors.text.tertiary,
    lineHeight: 16,
    maxWidth: 600,
  },
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.interactive.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
    shadowColor: colors.interactive.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  newButtonText: {
    color: colors.primary.contrast,
    fontSize: 11,
    fontWeight: '700',
  },
});
