import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles, permission }) => {
    const { isAuthenticated, user, loading, hasPermission } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // 1. Verificación por Permiso Dinámico (RECOMENDADO)
    if (permission && !hasPermission(permission)) {
        console.warn(`Acceso denegado: El usuario no tiene el permiso [${permission}]`);
        return <Navigate to="/pedidos" replace />;
    }

    // 2. Verificación por Rol (Legacy / Fallback)
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/pedidos" replace />;
    }

    return children ? children : <Outlet />;
};

export default ProtectedRoute;
