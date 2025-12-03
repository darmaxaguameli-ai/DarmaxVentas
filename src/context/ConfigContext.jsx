import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
    fetchWaterTypes, 
    fetchServicePrices, 
    fetchJugBrands 
} from '../api/apiClient';

const ConfigContext = createContext(null);

export const useConfig = () => {
    const context = useContext(ConfigContext);
    if (!context) {
        throw new Error('useConfig debe ser usado dentro de un ConfigProvider');
    }
    return context;
};

export const ConfigProvider = ({ children }) => {
    const [config, setConfig] = useState({
        waterTypes: [],
        servicePrices: [],
        jugBrands: [],
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadInitialConfig = async () => {
            try {
                setLoading(true);
                // Hacemos todas las llamadas a la API en paralelo para más eficiencia
                const [waterTypes, servicePrices, jugBrands] = await Promise.all([
                    fetchWaterTypes(),
                    fetchServicePrices(),
                    fetchJugBrands(),
                ]);
                setConfig({ waterTypes, servicePrices, jugBrands });
                setError(null);
            } catch (err) {
                console.error("Error al cargar la configuración del negocio:", err);
                setError("No se pudo cargar la configuración. Por favor, recarga la página.");
            } finally {
                setLoading(false);
            }
        };

        loadInitialConfig();
    }, []); // El array vacío asegura que esto se ejecute solo una vez

    const value = {
        ...config,
        loading,
        error,
    };

    return (
        <ConfigContext.Provider value={value}>
            {children}
        </ConfigContext.Provider>
    );
};
