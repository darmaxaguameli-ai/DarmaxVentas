import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const LoginSuccess = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const name = location.state?.name || 'Usuario';
    const role = location.state?.role;

    useEffect(() => {
        let redirectPath;
        switch (role) {
            case 'CLIENTE':
                redirectPath = '/pedidos';
                break;
            case 'VENDEDOR':
                redirectPath = '/ventas/mostrador';
                break;
            case 'REPARTIDOR':
                redirectPath = '/repartidor/dashboard';
                break;
            case 'ADMIN':
            default:
                redirectPath = '/gestion';
                break;
        }

        const timer = setTimeout(() => {
            if (redirectPath) {
                navigate(redirectPath, { replace: true });
            }
        }, 2000); // 2-second delay

        return () => clearTimeout(timer);
    }, [navigate, role]);

    const getRedirectMessage = () => {
        switch (role) {
            case 'CLIENTE':
                return 'Redirigiendo a tus pedidos...';
            case 'VENDEDOR':
                return 'Redirigiendo a la terminal de ventas...';
            case 'REPARTIDOR':
                return 'Redirigiendo a tu dashboard de repartidor...';
            case 'ADMIN':
            default:
                return 'Redirigiendo a tu panel de gestión...';
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-light dark:bg-dark text-dark dark:text-white">
            <div className="text-center animate-fade-in">
                <h1 className="text-4xl font-bold text-primary">¡Bienvenid@, {name}!</h1>
                <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
                    {getRedirectMessage()}
                </p>
                <div className="mt-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
                </div>
            </div>
        </div>
    );
};

export default LoginSuccess;
