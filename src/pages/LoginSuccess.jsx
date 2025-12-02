import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const LoginSuccess = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const name = location.state?.name || 'Usuario'; // Obtener el nombre del estado de la navegación

    useEffect(() => {
        // Después de un tiempo, redirigir al dashboard de gestión
        const timer = setTimeout(() => {
            navigate('/gestion', { replace: true });
        }, 2000); // 2 segundos de espera

        // Limpiar el temporizador si el componente se desmonta
        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-light dark:bg-dark text-dark dark:text-white">
            <div className="text-center animate-fade-in">
                <h1 className="text-4xl font-bold text-primary">¡Bienvenido, {name}!</h1>
                <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">Redirigiendo a tu panel de gestión...</p>
                <div className="mt-8">
                    {/* Un spinner simple */}
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
                </div>
            </div>
        </div>
    );
};

export default LoginSuccess;
