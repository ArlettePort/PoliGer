import { Slot, useSegments } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { ResponsiveLayout } from '@/components/layout';
import { useTheme } from '@/contexts/ThemeContext';
import { PerfilHeader, PerfilTabSelector } from '@/components/Perfil';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';

export default function PerfilLayout() {
  const { colors: themeColors } = useTheme();
  const { user } = useAuth();
  const { canViewPolinizaciones, canViewGerminaciones, isAdmin } = usePermissions();
  const router = useRouter();
  const segments = useSegments();

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background.secondary,
    },
    contentWrapper: {
      flex: 1,
      overflow: 'hidden',
    },
    headerContainer: {
      backgroundColor: themeColors.background.primary,
      paddingTop: 6,
      paddingHorizontal: 8,
      paddingBottom: 4,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border.default,
    },
    tabsWrapper: {
      paddingHorizontal: 8,
      paddingVertical: 8,
      backgroundColor: themeColors.background.secondary,
    },
  }), [themeColors]);

  const currentTab = useMemo((): 'resumen' | 'polinizaciones' | 'germinaciones' | 'usuarios' | 'notificaciones' | 'configuracion' => {
    const lastSegment = segments[segments.length - 1];
    const validTabs = ['resumen', 'polinizaciones', 'germinaciones', 'usuarios', 'notificaciones', 'configuracion'];

    if (lastSegment && validTabs.includes(lastSegment)) {
      return lastSegment as any;
    }

    return 'resumen';
  }, [segments]);

  const handleTabChange = useCallback((tab: string) => {
    router.push(`./${tab}` as any);
  }, [router]);

  const handleLogout = useCallback(async () => {
    // Logout will be handled in child components
  }, []);

  return (
    <ResponsiveLayout>
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <PerfilHeader user={user} onLogout={handleLogout} onPhotoUpdated={() => {}} />
        </View>

        <View style={styles.tabsWrapper}>
          <PerfilTabSelector
            currentTab={currentTab}
            onTabChange={handleTabChange}
            canViewPolinizaciones={canViewPolinizaciones()}
            canViewGerminaciones={canViewGerminaciones()}
            isAdmin={isAdmin()}
          />
        </View>

        <View style={styles.contentWrapper}>
          <Slot />
        </View>
      </View>
    </ResponsiveLayout>
  );
}
