import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const GestionRouteGuard = ({ permission, children }) => {
    const { user, hasPermission, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Superusuario ADMIN siempre tiene acceso universal
    const isAdmin = user?.role === 'ADMIN' || user?.roles?.some(r => r.name?.toUpperCase() === 'ADMIN');
    if (isAdmin) return children;

    const hasAccess = Array.isArray(permission)
        ? permission.some(p => hasPermission(p))
        : hasPermission(permission);

    if (!hasAccess) {
        console.warn(`[GestionRouteGuard] Acceso denegado: el usuario no cuenta con el permiso requerido [${Array.isArray(permission) ? permission.join(', ') : permission}]`);
        return <Navigate to="/gestion" replace />;
    }

    return children;
};

export default GestionRouteGuard;
