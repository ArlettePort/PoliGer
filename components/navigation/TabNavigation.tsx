import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, FontAwesome6 } from '@expo/vector-icons';
import { usePermissions } from '@/hooks/usePermissions';
import { useSidebar, SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from '@/contexts/SidebarContext';
import { useTheme } from '@/contexts/ThemeContext';

interface TabNavigationProps {
  currentTab?: string | undefined;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({ currentTab }) => {
  const router = useRouter();
  const { canViewGerminaciones, canViewPolinizaciones, canViewReportes, isAdmin } = usePermissions();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const { colors: themeColors } = useTheme();

  const allTabs = [
    { id: 'inicio', label: 'Dashboard', icon: 'grid-outline', route: '/(tabs)', alwaysVisible: true },
    { id: 'polinizaciones', label: 'Polinizaciones', icon: 'flower-outline', route: '/(tabs)/polinizaciones', requiresPermission: 'polinizaciones' },
    { id: 'germinaciones', label: 'Germinaciones', icon: 'leaf-outline', route: '/(tabs)/germinaciones', requiresPermission: 'germinaciones' },
    { id: 'reportes', label: 'Reportes', icon: 'bar-chart-outline', route: '/(tabs)/reportes', requiresPermission: 'reportes' },
    { id: 'perfil', label: 'Perfil', icon: 'person-outline', route: '/(tabs)/perfil', alwaysVisible: true },
  ];

  // Filtrar tabs según permisos
  const tabs = allTabs.filter(tab => {
    if (tab.alwaysVisible) return true;

    switch (tab.requiresPermission) {
      case 'germinaciones':
        return canViewGerminaciones();
      case 'polinizaciones':
        return canViewPolinizaciones();
      case 'reportes':
        return canViewReportes();
      case 'admin':
        return isAdmin();
      default:
        return true;
    }
  });

  const handleTabPress = (route: string) => {
    router.push(route as any);
  };

  const styles = createStyles(themeColors);

  return (
    <View style={[styles.container, isCollapsed && styles.containerCollapsed]}>
      {/* Navigation items */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              isCollapsed && styles.tabCollapsed,
              currentTab === tab.id && styles.activeTab,
              currentTab === tab.id && isCollapsed && styles.activeTabCollapsed
            ]}
            onPress={() => handleTabPress(tab.route)}
          >
            <View style={styles.tabIconContainer}>
              {tab.id === 'germinaciones' ? (
                <FontAwesome6
                  name="seedling"
                  size={20}
                  color={
                    currentTab === tab.id
                      ? (isCollapsed ? themeColors.background.primary : themeColors.primary.main)
                      : themeColors.text.tertiary
                  }
                />
              ) : (
                <Ionicons
                  name={tab.icon as any}
                  size={20}
                  color={
                    currentTab === tab.id
                      ? (isCollapsed ? themeColors.background.primary : themeColors.primary.main)
                      : themeColors.text.tertiary
                  }
                />
              )}
            </View>
            {!isCollapsed && (
              <Text style={[
                styles.tabText,
                currentTab === tab.id && styles.activeTabText
              ]}>
                {tab.label}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Footer con botón de toggle */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.toggleButton}
          onPress={toggleSidebar}
        >
          <Ionicons 
            name={isCollapsed ? "chevron-forward" : "chevron-back"} 
            size={20} 
            color={themeColors.text.tertiary} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const createStyles = (colors: ReturnType<typeof import('@/utils/colors').getColors>) => StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    top: 64, // Start below navbar
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: colors.background.primary,
    shadowColor: colors.shadow.color,
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
  },
  containerCollapsed: {
    width: SIDEBAR_COLLAPSED_WIDTH,
  },
  tabsContainer: {
    flex: 1,
    paddingTop: 16,
    paddingHorizontal: 12,
  },
  footer: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadow.color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: 'transparent',
  },
  tabCollapsed: {
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  activeTab: {
    backgroundColor: colors.primary.light,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary.main,
  },
  activeTabCollapsed: {
    borderLeftWidth: 0,
    borderRadius: 12,
    backgroundColor: colors.primary.main,
    shadowColor: colors.primary.main,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontSize: 13,
    color: colors.text.tertiary,
    marginLeft: 8,
    fontWeight: '500',
    flex: 1,
  },
  activeTabText: {
    color: colors.accent.primary,
    fontWeight: '600',
  },
  tabIconContainer: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.status.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: colors.background.primary,
    fontSize: 10,
    fontWeight: '700',
  },
});
