import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminProtectedRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    // Muestra un indicador de carga mientras se verifica la autenticación
    return <div>Cargando...</div>;
  }

  if (!isAuthenticated) {
    // Si no está autenticado, redirige a la página de login
    return <Navigate to="/login" />;
  }

  if (user.role !== 'ADMIN') {
    // Si está autenticado pero no es ADMIN, redirige a la página de pedidos del cliente
    return <Navigate to="/pedidos" />;
  }

  // Si está autenticado y es ADMIN, permite el acceso a la ruta
  return children;
};

export default AdminProtectedRoute;
