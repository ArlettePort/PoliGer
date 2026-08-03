import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { rbacService } from '@/services/rbac.service';

/**
 * Hook personalizado para verificación de permisos
 * Proporciona métodos convenientes para verificar permisos del usuario actual
 */
export const usePermissions = () => {
  const { permissions, user } = useAuth();

  /**
   * Verifica si el usuario tiene un permiso específico
   */
  const hasPermission = useCallback((module: string, action: string): boolean => {
    return rbacService.hasPermission(permissions, module, action);
  }, [permissions]);

  /**
   * Verifica si el usuario puede ver germinaciones
   */
  const canViewGerminaciones = useCallback((): boolean => {
    return rbacService.canViewGerminaciones(permissions);
  }, [permissions]);

  /**
   * Verifica si el usuario puede crear germinaciones
   */
  const canCreateGerminaciones = useCallback((): boolean => {
    return rbacService.canCreateGerminaciones(permissions);
  }, [permissions]);

  /**
   * Verifica si el usuario puede editar germinaciones
   */
  const canEditGerminaciones = useCallback((): boolean => {
    return rbacService.canEditGerminaciones(permissions);
  }, [permissions]);

  /**
   * Verifica si el usuario puede ver polinizaciones
   */
  const canViewPolinizaciones = useCallback((): boolean => {
    return rbacService.canViewPolinizaciones(permissions);
  }, [permissions]);

  /**
   * Verifica si el usuario puede crear polinizaciones
   */
  const canCreatePolinizaciones = useCallback((): boolean => {
    return rbacService.canCreatePolinizaciones(permissions);
  }, [permissions]);

  /**
   * Verifica si el usuario puede editar polinizaciones
   */
  const canEditPolinizaciones = useCallback((): boolean => {
    return rbacService.canEditPolinizaciones(permissions);
  }, [permissions]);

  /**
   * Verifica si el usuario puede ver reportes
   */
  const canViewReportes = useCallback((): boolean => {
    return rbacService.canViewReportes(permissions);
  }, [permissions]);

  /**
   * Verifica si el usuario puede generar reportes
   */
  const canGenerateReportes = useCallback((): boolean => {
    return rbacService.canGenerateReportes(permissions);
  }, [permissions]);

  /**
   * Verifica si el usuario puede exportar datos
   */
  const canExportData = useCallback((): boolean => {
    return rbacService.canExportData(permissions);
  }, [permissions]);

  /**
   * Verifica si el usuario es administrador
   */
  const isAdmin = useCallback((): boolean => {
    return rbacService.isAdmin(permissions);
  }, [permissions]);

  /**
   * Verifica si el usuario puede ver estadísticas globales
   */
  const canViewGlobalStats = useCallback((): boolean => {
    return rbacService.canViewGlobalStats(permissions);
  }, [permissions]);

  /**
   * Verifica si el usuario puede ver estadísticas del sistema
   */
  const canViewEstadisticas = useCallback((): boolean => {
    return rbacService.canViewEstadisticas(permissions);
  }, [permissions]);

  /**
   * Obtiene las tabs disponibles según los permisos del usuario
   */
  const getAvailableTabs = useCallback(() => {
    return rbacService.getAvailableTabs(permissions);
  }, [permissions]);

  /**
   * Verifica si un rol puede tener meta de polinizaciones
   */
  const canHavePolinizacionesMeta = useCallback((role: string): boolean => {
    return rbacService.canHavePolinizacionesMeta(role);
  }, []);

  /**
   * Verifica si un rol puede tener meta de germinaciones
   */
  const canHaveGerminacionesMeta = useCallback((role: string): boolean => {
    return rbacService.canHaveGerminacionesMeta(role);
  }, []);

  /**
   * Obtiene información del rol del usuario
   */
  const getRoleInfo = useCallback(() => {
    if (!user?.rol) return null;
    
    return {
      role: user.rol,
      displayName: rbacService.getRoleDisplayName(user.rol),
      description: rbacService.getRolePermissionsDescription(user.rol),
      color: rbacService.getRoleColor(user.rol)
    };
  }, [user?.rol]);

  return {
    // Permisos generales
    hasPermission,
    
    // Permisos específicos
    canViewGerminaciones,
    canCreateGerminaciones,
    canEditGerminaciones,
    canViewPolinizaciones,
    canCreatePolinizaciones,
    canEditPolinizaciones,
    canViewReportes,
    canGenerateReportes,
    canExportData,
    isAdmin,
    canViewGlobalStats,
    canViewEstadisticas,
    
    // Utilidades
    getAvailableTabs,
    canHavePolinizacionesMeta,
    canHaveGerminacionesMeta,
    getRoleInfo,
    
    // Estado
    permissions,
    user
  };
};
