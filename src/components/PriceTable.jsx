import React, { useState, useMemo } from 'react';
import { useConfig } from '../context/ConfigContext'; // Importar useConfig

const PriceTable = () => {
    const { waterTypes, servicePrices, loading, error } = useConfig();
    const [isExpanded, setIsExpanded] = useState(false);

    // Procesar los precios para agruparlos de forma más útil en la tabla
    const groupedPrices = useMemo(() => {
        if (loading || error || waterTypes.length === 0 || servicePrices.length === 0) {
            return [];
        }

        const pricesByWaterType = {};

        // Organizar los precios por tipo de agua y método/tamaño
        servicePrices.forEach(sp => {
            const waterTypeName = sp.waterType?.name || 'General'; // Manejar precios sin tipo de agua específico
            if (!pricesByWaterType[waterTypeName]) {
                pricesByWaterType[waterTypeName] = [];
            }
            pricesByWaterType[waterTypeName].push(sp);
        });

        const tableData = [];
        Object.entries(pricesByWaterType).forEach(([waterTypeName, prices]) => {
            // Asumimos que el "tamaño" está implícito en el nombre del servicio o se estandariza a 20L
            // Si el nombre del servicio incluye "10L" o "20L", lo extraemos
            const sizeRegex = /(\d+)L/; // Expresión regular para encontrar "XXL"
            
            // Agrupar por nombre de servicio (Recarga, Garrafón 10L, etc.) y luego por tamaño
            const pricesByServiceAndSize = {};

            prices.forEach(sp => {
                const serviceName = sp.name; // Ej. "Recarga", "Garrafón 10L"
                const match = serviceName.match(sizeRegex);
                const size = match ? `${match[1]}L` : '20L'; // Si no hay match, asumimos 20L

                if (!pricesByServiceAndSize[serviceName]) {
                    pricesByServiceAndSize[serviceName] = { sizes: {} };
                }
                if (!pricesByServiceAndSize[serviceName].sizes[size]) {
                    pricesByServiceAndSize[serviceName].sizes[size] = { 'Mostrador': null, 'Domicilio': null };
                }
                pricesByServiceAndSize[serviceName].sizes[size][sp.method] = sp.price;
            });

            Object.entries(pricesByServiceAndSize).forEach(([serviceName, serviceData]) => {
                Object.entries(serviceData.sizes).forEach(([size, methods]) => {
                    tableData.push({
                        waterType: waterTypeName,
                        service: serviceName,
                        size: size,
                        mostrador: methods['Mostrador'],
                        domicilio: methods['Domicilio'],
                    });
                });
            });
        });
        
        // Ordenar la tabla para mejor lectura (ej. por tipo de agua, luego por servicio, luego por tamaño)
        tableData.sort((a, b) => {
            if (a.waterType !== b.waterType) return a.waterType.localeCompare(b.waterType);
            if (a.service !== b.service) return a.service.localeCompare(b.service);
            return parseInt(b.size) - parseInt(a.size); // 20L antes que 10L
        });

        return tableData;
    }, [waterTypes, servicePrices, loading, error]);

    if (loading) {
        return <div className="text-center py-4 text-text-secondary dark:text-white/70">Cargando lista de precios...</div>;
    }

    if (error) {
        return <div className="text-center py-4 text-red-500">Error al cargar la lista de precios: {error}</div>;
    }

    return (
        <div className="mt-8 w-full max-w-3xl">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex justify-between items-center rounded-2xl border border-primary/40 bg-primary/5 dark:bg-primary/15 px-6 py-4 text-left font-semibold text-base sm:text-lg text-primary hover:bg-primary/10 transition-colors"
            >
                <span>{isExpanded ? 'Ocultar lista de precios' : 'Ver lista de precios'}</span>
                <span className={`material-symbols-outlined transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>expand_more</span>
            </button>

            {isExpanded && (
                <div className="mt-4 rounded-2xl border border-light/60 dark:border-white/10 bg-white/95 dark:bg-dark/70 shadow-lg backdrop-blur-xl overflow-x-auto">
                    <table className="min-w-full divide-y divide-light/60 dark:divide-white/10">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Servicio</th>
                                <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tipo de Agua</th>
                                <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tamaño</th>
                                <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Mostrador</th>
                                <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Domicilio</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-light/60 dark:divide-white/10">
                            {groupedPrices.map((item, index) => (
                                <tr key={index} className="bg-white dark:bg-gray-800">
                                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{item.service}</td>
                                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{item.waterType}</td>
                                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{item.size}</td>
                                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">${item.mostrador ? item.mostrador.toFixed(2) : 'N/A'}</td>
                                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">${item.domicilio ? item.domicilio.toFixed(2) : 'N/A'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default PriceTable;
