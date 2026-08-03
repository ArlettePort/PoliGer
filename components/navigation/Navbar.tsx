import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Animated, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotificaciones } from '@/hooks/useNotificaciones';

export function Navbar() {
  const router = useRouter();
  const { theme, toggleTheme, colors: themeColors } = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const thumbPosition = useRef(new Animated.Value(theme === 'dark' ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(thumbPosition, {
      toValue: theme === 'dark' ? 1 : 0,
      useNativeDriver: true,
      friction: 7,
      tension: 80,
    }).start();
  }, [theme, thumbPosition]);
  
  // Obtener notificaciones no leídas
  const { notifications } = useNotificaciones({ leida: false });
  const unreadCount = notifications?.length || 0;

  const handleNotificationsPress = () => {
    router.push('/(tabs)/perfil?tab=notificaciones');
  };

  const handleProfilePress = () => {
    router.push('/(tabs)/perfil');
  };

  const styles = createStyles(themeColors, theme);

  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image
          source={require('@/assets/images/Ecuagenera.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={[styles.logoText, { color: themeColors.text.primary }]}>
          Poliger Ecuagenera
        </Text>
      </View>

      {/* Right side icons */}
      <View style={styles.iconsContainer}>
        {/* Theme Toggle */}
        <TouchableOpacity
          style={styles.themeToggleContainer}
          onPress={toggleTheme}
          activeOpacity={0.9}
        >
          <Animated.View style={[
            styles.themeToggleThumb,
            {
              transform: [{
                translateX: thumbPosition.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 36],
                })
              }]
            }
          ]}>
            <Ionicons
              name={theme === 'dark' ? 'moon' : 'sunny'}
              size={16}
              color={theme === 'dark' ? '#fbbf24' : '#f59e0b'}
            />
          </Animated.View>
          <View style={[
            styles.themeToggleInactiveIcon,
            theme === 'dark' && styles.themeToggleInactiveIconDark
          ]}>
            <Ionicons
              name={theme === 'dark' ? 'sunny' : 'moon'}
              size={16}
              color="#6B7280"
            />
          </View>
        </TouchableOpacity>

        {/* Notifications */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleNotificationsPress}
          activeOpacity={0.7}
        >
          <View style={styles.notificationContainer}>
            <Ionicons
              name="notifications-outline"
              size={24}
              color={themeColors.text.tertiary}
            />
            {unreadCount > 0 && (
              <View style={[
                styles.badge,
                { borderColor: themeColors.background.primary }
              ]}>
                <Text style={styles.badgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* Profile - solo en desktop */}
        {!isMobile && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleProfilePress}
            activeOpacity={0.7}
          >
            <Ionicons
              name="person-outline"
              size={24}
              color={themeColors.text.tertiary}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const createStyles = (
  colors: ReturnType<typeof import('@/utils/colors').getColors>,
  theme: 'light' | 'dark'
) => StyleSheet.create({
  container: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
    shadowColor: colors.shadow.color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 10000,
    position: 'relative',
    width: '100%',
    flex: 1,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    height: 40,
    width: 40,
  },
  logoText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  iconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeToggleContainer: {
    width: 68,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme === 'dark' ? '#374151' : '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    position: 'relative',
  },
  themeToggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
    position: 'absolute',
    left: 3,
    zIndex: 2,
  },
  themeToggleInactiveIcon: {
    position: 'absolute',
    right: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeToggleInactiveIconDark: {
    left: 8,
    right: 'auto',
  },
  notificationContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.status.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: colors.background.primary,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
});

