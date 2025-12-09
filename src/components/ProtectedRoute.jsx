import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { isAuthenticated, user, loading } = useAuth();

    if (loading) {
        // You can show a loading spinner here while checking authentication
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        // If not authenticated, redirect to the login page
        return <Navigate to="/login" replace />;
    }

    // If roles are specified, check if the user has one of the allowed roles
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // If the user role is not allowed, redirect to a default page
        // For example, redirect to the main client order page or a "not authorized" page
        return <Navigate to="/pedidos" replace />;
    }

    // If authenticated (and role is authorized if applicable), render the requested content
    return children ? children : <Outlet />;
};

export default ProtectedRoute;
