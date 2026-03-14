import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginSuccess = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { hasPermission, loading, user } = useAuth();
    const name = location.state?.name || user?.name || 'Usuario';
    const sexo = location.state?.sexo || user?.sexo;

    const greeting = sexo === 'HOMBRE' ? '¡Bienvenido' : sexo === 'MUJER' ? '¡Bienvenida' : '¡Bienvenido';

    useEffect(() => {
        if (loading) return;

        let redirectPath = '/pedidos'; // Fallback por defecto

        // Prioridad de Redirección según Permisos Maestros
        if (hasPermission('canAccessManagement')) {
            redirectPath = '/gestion';
        } else if (hasPermission('canAccessPOS')) {
            redirectPath = '/ventas/mostrador';
        } else if (hasPermission('canAccessDelivery')) {
            redirectPath = '/repartidor/dashboard';
        } else if (hasPermission('canAccessOrders')) {
            redirectPath = '/pedidos';
        }

        const timer = setTimeout(() => {
            navigate(redirectPath, { replace: true });
        }, 2000); 

        return () => clearTimeout(timer);
    }, [navigate, hasPermission, loading]);

    const getRedirectMessage = () => {
        if (hasPermission('canAccessManagement')) return 'Redirigiendo al Panel de Gestión...';
        if (hasPermission('canAccessPOS')) return 'Redirigiendo a Caja y Ventas...';
        if (hasPermission('canAccessDelivery')) return 'Redirigiendo al Dashboard de Reparto...';
        return 'Redirigiendo a tus pedidos...';
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-light dark:bg-dark text-dark dark:text-white px-4">
            <div className="text-center animate-fade-in">
                <div className="mb-6">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary animate-bounce">
                        <span className="material-symbols-outlined text-5xl">task_alt</span>
                    </div>
                </div>
                <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                    {greeting}, <span className="text-primary">{name}</span>!
                </h1>
                <p className="mt-2 text-lg font-medium text-gray-500 dark:text-gray-400">
                    {getRedirectMessage()}
                </p>
                <div className="mt-10">
                    <div className="w-48 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full mx-auto overflow-hidden">
                        <div className="h-full bg-primary animate-progress-fast"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginSuccess;
