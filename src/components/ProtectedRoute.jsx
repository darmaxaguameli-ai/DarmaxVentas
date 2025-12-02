import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        // Puedes mostrar un spinner de carga aquí mientras se verifica la autenticación
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        // Si no está autenticado, redirige a la página de login
        return <Navigate to="/login" replace />;
    }

    // Si está autenticado, renderiza el contenido solicitado (el Outlet o los children)
    return children ? children : <Outlet />;
};

export default ProtectedRoute;
