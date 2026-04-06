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
      const isAuthorized = user?.role === 'ADMIN' || user?.roleRelation?.isSystem;
      if (!isAuthorized && window.location.pathname !== '/mantenimiento') {
          return <Navigate to="/mantenimiento" replace />;
      }
  }

  if (!isAuthenticated) {
    // Si no está autenticado, redirige a la página de login
    return <Navigate to="/login" />;
  }

  // Verificar si tiene el permiso maestro de gestión
  if (!hasPermission('canAccessManagement')) {
    console.warn(`Acceso denegado a Gestión: El usuario ${user.name} no tiene el permiso [canAccessManagement]`);
    return <Navigate to="/pedidos" />;
  }

  // Si tiene el permiso, permite el acceso a la ruta
  return children;
};

export default AdminProtectedRoute;
