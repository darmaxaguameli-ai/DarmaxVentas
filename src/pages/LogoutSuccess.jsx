import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const LogoutSuccess = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const name = location.state?.name || 'Usuario'; // Obtener el nombre del estado de la navegación

    useEffect(() => {
        // Después de un tiempo, redirigir a la página de inicio
        const timer = setTimeout(() => {
            navigate('/', { replace: true });
        }, 2500); // 2.5 segundos de espera

        // Limpiar el temporizador si el componente se desmonta
        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-light dark:bg-dark text-dark dark:text-white">
            <div className="text-center animate-fade-in">
                <h1 className="text-4xl font-bold text-primary">¡Hasta luego, {name}!</h1>
                <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">Redirigiendo a la página de inicio...</p>
                <div className="mt-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
                </div>
            </div>
        </div>
    );
};

export default LogoutSuccess;
