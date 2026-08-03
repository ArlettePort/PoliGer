import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProtectedButton } from '@/components/navigation';
import { useTheme } from '@/contexts/ThemeContext';

interface PolinizacionesHeaderProps {
  onShowForm: () => void;
}

export const PolinizacionesHeader: React.FC<PolinizacionesHeaderProps> = ({
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
        <Text style={styles.breadcrumbTextActive}>Polinizaciones</Text>
      </View>

      {/* Header Principal */}
      <View style={styles.mainHeader}>
        <View style={styles.headerContent}>
          <Text style={styles.mainTitle}>Gestión de Polinizaciones</Text>
          <Text style={styles.mainSubtitle}>
            Administra y rastrea el progreso de los cruzamientos genéticos, desde la polinización hasta la cosecha de semillas.
          </Text>
        </View>

        <ProtectedButton
          requiredModule="polinizaciones"
          requiredAction="crear"
          onPress={onShowForm}
          style={styles.newButton}
        >
          <Ionicons name="add" size={18} color={themeColors.primary.contrast} />
          <Text style={styles.newButtonText}>Nueva Polinización</Text>
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
