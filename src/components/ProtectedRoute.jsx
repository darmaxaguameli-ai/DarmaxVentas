import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles, permission }) => {
    const { isAuthenticated, user, loading, hasPermission } = useAuth();
    
    // Configuración de Mantenimiento desde .env
    const isMaintenanceMode = import.meta.env.VITE_MAINTENANCE_MODE === 'true'; 

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    // --- Lógica de Mantenimiento ---
    if (isMaintenanceMode) {
        // Verificar si el usuario tiene el rol ADMIN o es personal de SISTEMA (usando la nueva estructura)
        const isAuthorized = user?.roles?.some(r => r.name === 'ADMIN' || r.isSystem === true) || user?.role === 'ADMIN';

        if (!isAuthorized && window.location.pathname !== '/mantenimiento') {
            return <Navigate to="/mantenimiento" replace />;
        }
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // --- Lógica de Cambio de Contraseña Obligatorio ---
    if (user?.mustChangePassword && window.location.pathname !== '/change-password-force') {
        return <Navigate to="/change-password-force" replace />;
    }

    // 1. Verificación por Permiso Específico (RBAC v2)
    if (permission && !hasPermission(permission)) {
        console.warn(`Acceso Denegado: El usuario no tiene el permiso [${permission}]`);
        return <Navigate to="/pedidos" replace />;
    }

    // 2. Verificación por Rol (Legacy / Fallback)
    // Ahora buscamos si el nombre del rol está en la lista de roles del usuario
    if (allowedRoles) {
        const hasRequiredRole = user.roles?.some(r => allowedRoles.includes(r.name)) || allowedRoles.includes(user.role);
        if (!hasRequiredRole) {
            return <Navigate to="/pedidos" replace />;
        }
    }


    return children ? children : <Outlet />;
};

export default ProtectedRoute;
