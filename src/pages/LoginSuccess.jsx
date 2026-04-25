import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginSuccess = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { hasPermission, hasModuleAccess, loading, user } = useAuth();
    const name = location.state?.name || user?.name || 'Usuario';
    const sexo = location.state?.sexo || user?.sexo;

    const greeting = sexo === 'HOMBRE' ? '¡Bienvenido' : sexo === 'MUJER' ? '¡Bienvenida' : '¡Bienvenido';

    useEffect(() => {
        if (loading) return;

        // 1. Prioridad Máxima: Cambio de contraseña forzado
        if (user?.mustChangePassword) {
            navigate('/change-password-force', { replace: true });
            return;
        }

        // Definir módulos maestros
        const modules = [
            { key: 'management', path: '/gestion' },
            { key: 'pos', path: '/ventas/mostrador' },
            { key: 'delivery', path: '/repartidor/dashboard' },
            { key: 'orders', path: '/pedidos' }
        ];

        // Contar a cuántos módulos tiene acceso real
        const authorizedModules = modules.filter(m => hasModuleAccess(m.key));

        let redirectPath = '/pedidos';

        if (authorizedModules.length > 1) {
            // Si tiene más de uno, mandarlo al selector
            redirectPath = '/role-selector';
        } else if (authorizedModules.length === 1) {
            // Si tiene exactamente uno, mandarlo directo
            redirectPath = authorizedModules[0].path;
        } else {
            // Si no tiene ninguno (cliente básico o sin roles), mandarlo a pedidos
            redirectPath = '/pedidos';
        }

        const timer = setTimeout(() => {
            navigate(redirectPath, { replace: true });
        }, 2000); 

        return () => clearTimeout(timer);
    }, [navigate, hasModuleAccess, loading, user]);

    const getRedirectMessage = () => {
        const modules = ['management', 'pos', 'delivery', 'orders'];
        const count = modules.filter(m => hasModuleAccess(m)).length;

        if (count > 1) return 'Preparando selector de modo...';
        if (hasModuleAccess('management')) return 'Redirigiendo al Panel de Gestión...';
        if (hasModuleAccess('pos')) return 'Redirigiendo a Caja y Ventas...';
        if (hasModuleAccess('delivery')) return 'Redirigiendo al Dashboard de Reparto...';
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
