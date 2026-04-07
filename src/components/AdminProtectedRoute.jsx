import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminProtectedRoute = ({ children }) => {
  const { isAuthenticated, user, loading, hasPermission } = useAuth();
  
  const isMaintenanceMode = import.meta.env.VITE_MAINTENANCE_MODE === 'true'; 

  if (loading) {
    // Muestra un indicador de carga mientras se verifica la autenticación
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // --- Lógica de Mantenimiento ---
  if (isMaintenanceMode) {
      // Verificar en la nueva lista de roles
      const isAuthorized = user?.roles?.some(r => r.name === 'ADMIN' || r.isSystem === true) || user?.role === 'ADMIN';

      if (!isAuthorized && window.location.pathname !== '/mantenimiento') {
          return <Navigate to="/mantenimiento" replace />;
      }
  }

  // 1. Verificación de Autenticación
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 2. Verificación de Permiso Maestro de Gestión
  // hasPermission ahora suma los permisos de todos los roles del usuario (RBAC v2)
  if (!hasPermission('canAccessManagement')) {
    console.error(`Acceso Denegado a Gestión: El usuario ${user?.name} no cuenta con el permiso [canAccessManagement]`);
    
    // Si es un cliente, mandarlo a pedidos. Si es staff sin gestión, mandarlo al selector o inicio.
    const redirectPath = user?.type === 'CLIENTE' ? '/pedidos' : '/role-selector';
    return <Navigate to={redirectPath} replace />;
  }

  // Si tiene el permiso, permite el acceso a la ruta
  return children;
};

export default AdminProtectedRoute;
