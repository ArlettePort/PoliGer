import { View, Text, TouchableOpacity, Image, StyleSheet, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { CONFIG } from '@/services/config';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isSmallScreen = screenWidth < 400;
const isVerySmallScreen = screenWidth < 350;

export interface PerfilHeaderProps {
  user: {
    id?: number;
    first_name?: string;
    last_name?: string;
    username?: string;
    email?: string;
    profile?: {
      foto?: string | null;
    };
  } | null;
  onLogout: () => void;
  onPhotoUpdated?: () => void;
}

export function PerfilHeader({ user, onLogout, onPhotoUpdated }: PerfilHeaderProps) {
  const { colors: themeColors } = useTheme();
  const headerStyles = createHeaderStyles(themeColors);

  const photoUrl = user?.profile?.foto
    ? (user.profile.foto.startsWith('http')
        ? user.profile.foto
        : `${CONFIG.API_BASE_URL.replace('/api', '')}${user.profile.foto}`)
    : null;

  const userName = user?.first_name && user?.last_name
    ? `${user.first_name} ${user.last_name}`
    : user?.username || 'Usuario';

  const userEmail = user?.email || 'correo@ejemplo.com';

  return (
    <View style={headerStyles.profileCard}>
      {/* Banner superior */}
      <View style={headerStyles.profileBanner} />
      
      {/* Contenido principal */}
      <View style={headerStyles.profileContent}>
        {/* Layout responsivo */}
        <View style={headerStyles.mainLayout}>
          {/* Foto de perfil */}
          <View style={headerStyles.profileImageContainer}>
            {photoUrl ? (
              <Image
                source={{ uri: photoUrl }}
                style={[headerStyles.userAvatar, localStyles.avatarImage]}
                resizeMode="cover"
              />
            ) : (
              <View style={headerStyles.userAvatar}>
                <Text style={headerStyles.userAvatarText}>
                  {user?.first_name?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            )}
          </View>

          {/* Información del usuario */}
          <View style={headerStyles.userInfoSection}>
            <View style={headerStyles.userInfoContainer}>
              <Text 
                style={headerStyles.userName} 
                numberOfLines={isVerySmallScreen ? 1 : 2}
                ellipsizeMode="tail"
              >
                {userName}
              </Text>
              <View style={headerStyles.emailContainer}>
                <Ionicons name="mail-outline" size={14} color={themeColors.text.tertiary} />
                <Text 
                  style={headerStyles.userEmail} 
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {userEmail}
                </Text>
              </View>
            </View>
            
            {/* Botón de Cerrar Sesión */}
            <TouchableOpacity style={headerStyles.configButton} onPress={onLogout}>
              <Ionicons 
                name="log-out-outline" 
                size={isSmallScreen ? 16 : 18} 
                color={themeColors.text.primary} 
              />
              {!isVerySmallScreen && (
                <Text style={headerStyles.configButtonText}>
                  {isSmallScreen ? 'Salir' : 'Cerrar Sesión'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const createHeaderStyles = (colors: ReturnType<typeof import('@/utils/colors').getColors>) => StyleSheet.create({
  profileCard: {
    backgroundColor: colors.background.primary,
    borderRadius: isSmallScreen ? 16 : 20,
    marginHorizontal: isSmallScreen ? 4 : 8,
    marginTop: 6,
    marginBottom: 8,
    overflow: 'hidden',
    shadowColor: colors.shadow.color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  profileBanner: {
    height: isSmallScreen ? 40 : 50,
    backgroundColor: colors.accent.primary,
    width: '100%',
  },
  profileContent: {
    backgroundColor: colors.background.primary,
    paddingTop: isSmallScreen ? 6 : 8,
    paddingBottom: isSmallScreen ? 8 : 12,
    paddingHorizontal: isSmallScreen ? 8 : 12,
  },
  mainLayout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: isSmallScreen ? 12 : 16,
  },
  profileImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatar: {
    width: isSmallScreen ? 60 : 80,
    height: isSmallScreen ? 60 : 80,
    borderRadius: isSmallScreen ? 30 : 40,
    backgroundColor: colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.background.primary,
    shadowColor: colors.shadow.color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  userAvatarText: {
    color: colors.text.inverse,
    fontSize: isSmallScreen ? 24 : 32,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  userInfoSection: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: isSmallScreen ? 60 : 80,
  },
  userInfoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: isSmallScreen ? 16 : 20,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
    lineHeight: isSmallScreen ? 20 : 24,
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  userEmail: {
    fontSize: isSmallScreen ? 12 : 14,
    color: colors.text.tertiary,
    fontWeight: '500',
    flex: 1,
    lineHeight: isSmallScreen ? 16 : 18,
  },
  configButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.secondary,
    paddingHorizontal: isSmallScreen ? 8 : 12,
    paddingVertical: isSmallScreen ? 6 : 8,
    borderRadius: 6,
    gap: isVerySmallScreen ? 0 : 6,
    borderWidth: 1,
    borderColor: colors.border.default,
    shadowColor: colors.shadow.color,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    alignSelf: 'flex-end',
    minWidth: isVerySmallScreen ? 32 : 'auto',
    minHeight: 32,
  },
  configButtonText: {
    fontSize: isSmallScreen ? 11 : 12,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
  },
});

const localStyles = StyleSheet.create({
  avatarImage: {
    borderRadius: isSmallScreen ? 30 : 40,
  },
});
