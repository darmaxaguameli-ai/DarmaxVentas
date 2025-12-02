import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const LoginSuccess = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const name = location.state?.name || 'Usuario'; // Obtener el nombre del estado de la navegación
    const role = location.state?.role; // Obtener el rol del estado de la navegación

    useEffect(() => {
        const redirectPath = role === 'CLIENTE' ? '/pedidos' : '/gestion';
        const redirectMessage = role === 'CLIENTE' ? 'Redirigiendo a la selección de pedidos...' : 'Redirigiendo a tu panel de gestión...';

        // Después de un tiempo, redirigir
        const timer = setTimeout(() => {
            navigate(redirectPath, { replace: true });
        }, 2000); // 2 segundos de espera

        // Limpiar el temporizador si el componente se desmonta
        return () => clearTimeout(timer);
    }, [navigate, role]);

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-light dark:bg-dark text-dark dark:text-white">
            <div className="text-center animate-fade-in">
                <h1 className="text-4xl font-bold text-primary">¡Bienvenid@, {name}!</h1>
                <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
                    {role === 'CLIENTE' ? 'Redirigiendo a la selección de pedidos...' : 'Redirigiendo a tu panel de gestión...'}
                </p>
                <div className="mt-8">
                    {/* Un spinner simple */}
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
                </div>
            </div>
        </div>
    );
};

export default LoginSuccess;
