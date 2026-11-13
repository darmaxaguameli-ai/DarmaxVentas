import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useConfig } from '../context/ConfigContext';

const PriceTable = () => {
    const { waterTypes, servicePrices, loading, error } = useConfig();
    const [isExpanded, setIsExpanded] = useState(false);
    const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);
    const [isDocked, setIsDocked] = useState(false);
    const slotRef = useRef(null);

    // Bloquear scroll de fondo cuando el modal esté abierto
    useEffect(() => {
        if (isMobileModalOpen) {
            const originalOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = originalOverflow;
            };
        }
    }, [isMobileModalOpen]);

    // Detección de acople (docking): el botón se transforma justo al coincidir con el header
    useEffect(() => {
        const checkDocking = () => {
            if (!slotRef.current) return;
            const rect = slotRef.current.getBoundingClientRect();
            // Altura exacta donde se ubica la cinta del header móvil en celular (~75px desde el fondo)
            const dockThreshold = window.innerHeight - 75;

            // Se activa justo en el instante en que la cinta del header pasa por la altura donde está la lista
            const shouldDock = rect.top <= dockThreshold;
            setIsDocked(shouldDock);

            // Solo si el usuario sube tanto que la lista vuelve a quedar por debajo de la cinta del header, cerrarla
            if (!shouldDock && isExpanded) {
                setIsExpanded(false);
            }
        };

        window.addEventListener('scroll', checkDocking, { passive: true });
        window.addEventListener('resize', checkDocking, { passive: true });
        checkDocking();

        return () => {
            window.removeEventListener('scroll', checkDocking);
            window.removeEventListener('resize', checkDocking);
        };
    }, [isExpanded]);

    // Procesar los precios para agruparlos de forma más útil en la tabla
    const tableData = useMemo(() => {
        if (loading || error || waterTypes.length === 0 || servicePrices.length === 0) {
            return [];
        }

        const pricesByWaterType = {};

        // Organizar los precios por tipo de agua y método/tamaño
        servicePrices.forEach(sp => {
            const waterTypeName = sp.waterType?.name || 'General';
            if (!pricesByWaterType[waterTypeName]) {
                pricesByWaterType[waterTypeName] = [];
            }
            pricesByWaterType[waterTypeName].push(sp);
        });

        const data = [];
        Object.entries(pricesByWaterType).forEach(([waterTypeName, prices]) => {
            const sizeRegex = /(\d+)L/;
            const pricesByServiceAndSize = {};

            prices.forEach(sp => {
                let serviceName = sp.name;
                let baseService = "Otro";
                if (serviceName.toLowerCase().includes("recarga")) baseService = "Recarga";
                else if (serviceName.toLowerCase().includes("nuevo") || serviceName.toLowerCase().includes("garrafón")) baseService = "Envase Nuevo";

                const match = serviceName.match(sizeRegex);
                const size = match ? `${match[1]}L` : '20L';

                const rowKey = `${serviceName}-${waterTypeName}-${size}`; 
                
                if (!pricesByServiceAndSize[rowKey]) {
                    pricesByServiceAndSize[rowKey] = {
                        waterType: waterTypeName,
                        service: serviceName,
                        baseCategory: baseService,
                        size: size,
                        mostrador: null,
                        domicilio: null
                    };
                }
                
                if (sp.method === 'Mostrador') pricesByServiceAndSize[rowKey].mostrador = sp.price;
                if (sp.method === 'Domicilio') pricesByServiceAndSize[rowKey].domicilio = sp.price;
            });

            Object.values(pricesByServiceAndSize).forEach(row => data.push(row));
        });
        
        data.sort((a, b) => {
            if (a.baseCategory !== b.baseCategory) {
                return a.baseCategory === "Recarga" ? -1 : 1;
            }
            if (a.waterType !== b.waterType) return a.waterType.localeCompare(b.waterType);
            const numA = parseInt(a.size) || 0;
            const numB = parseInt(b.size) || 0;
            return numB - numA;
        });

        return data;
    }, [waterTypes, servicePrices, loading, error]);

    if (loading) {
        return <div className="text-center py-4 text-text-secondary dark:text-white/70">Cargando lista de precios...</div>;
    }

    if (error) {
        return <div className="text-center py-4 text-red-500">Error al cargar la lista de precios: {error}</div>;
    }

    // Acción de clic inteligente: si es flotante en móvil abre modal; si está anclado abre el acordeón
    const handleButtonClick = () => {
        if (!isDocked && window.innerWidth < 640) {
            setIsMobileModalOpen(true);
        } else {
            setIsExpanded(!isExpanded);
        }
    };

    return (
        <>
            {/* --- Modal / Sheet de Lista de Precios en Celulares (cuando se pulsa en modo flotante) --- */}
            {isMobileModalOpen && (
                <div 
                    className="sm:hidden fixed inset-0 z-[150] flex items-end justify-center bg-black/60 backdrop-blur-sm touch-none animate-in fade-in duration-200"
                    onClick={() => setIsMobileModalOpen(false)}
                >
                    <div 
                        className="w-full max-h-[82vh] flex flex-col rounded-t-3xl border-t border-white/40 dark:border-white/10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl shadow-2xl p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] touch-auto overscroll-contain animate-in slide-in-from-bottom duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Drag indicator & Header */}
                        <div className="flex flex-col items-center gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
                            <div className="w-12 h-1.5 rounded-full bg-gray-300 dark:bg-gray-700" />
                            <div className="w-full flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                        <span className="material-symbols-outlined text-lg">payments</span>
                                    </div>
                                    <h3 className="text-lg font-black text-gray-900 dark:text-white">Lista de precios</h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsMobileModalOpen(false)}
                                    className="h-8 w-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer"
                                >
                                    <span className="material-symbols-outlined text-xl">close</span>
                                </button>
                            </div>
                        </div>

                        {/* Contenido scrolleable de tarjetas con scroll contenido */}
                        <div className="mt-3 overflow-y-auto overscroll-contain space-y-3 pr-1">
                            {tableData.map((item, index) => (
                                <div key={index} className="p-3.5 rounded-2xl bg-gray-50/70 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/50 flex flex-col gap-2.5">
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="flex flex-col gap-0.5">
                                            <h4 className="font-bold text-gray-900 dark:text-white text-sm">{item.service}</h4>
                                            <div className="flex items-center gap-2">
                                                <span className="inline-flex items-center gap-1 bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300 text-[11px] font-bold px-2 py-0.5 rounded-full border border-cyan-100 dark:border-cyan-800">
                                                    <span className="material-symbols-outlined text-[10px]">water_drop</span>
                                                    {item.waterType}
                                                </span>
                                            </div>
                                        </div>
                                        <span className="bg-primary/10 text-primary text-xs font-black px-2.5 py-0.5 rounded-lg shrink-0">
                                            {item.size}
                                        </span>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-2 mt-0.5">
                                        <div className="bg-white/80 dark:bg-gray-900/50 p-2 rounded-xl text-center border border-gray-100 dark:border-gray-700/50">
                                            <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Mostrador</p>
                                            <p className="font-black text-gray-900 dark:text-white text-base mt-0.5">
                                                {item.mostrador ? `$${item.mostrador.toFixed(2)}` : '--'}
                                            </p>
                                        </div>
                                        <div className="bg-cyan-50/50 dark:bg-cyan-900/20 p-2 rounded-xl text-center border border-cyan-100/60 dark:border-cyan-800/40">
                                            <p className="text-[10px] text-primary uppercase font-bold tracking-wider">A Domicilio</p>
                                            <p className="font-black text-primary text-base mt-0.5">
                                                {item.domicilio ? `$${item.domicilio.toFixed(2)}` : '--'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* --- Contenedor Marcador de Posición en el Documento (Slot) --- */}
            <div ref={slotRef} className="mt-8 w-full max-w-3xl min-h-[58px] relative">
                {/* --- BOTÓN UNIFICADO: Flotante Arriba (Modal) ➔ Anclado Abajo (Tira Acordeón) --- */}
                <button
                    onClick={handleButtonClick}
                    className={`
                        flex items-center backdrop-blur-2xl border border-white/80 dark:border-white/10
                        text-gray-800 dark:text-white active:scale-[0.98] cursor-pointer
                        transform-gpu origin-right transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] select-none
                        
                        /* En Desktop: siempre es la barra completa del acordeón */
                        sm:relative sm:bottom-auto sm:right-auto sm:w-full sm:h-auto sm:rounded-2xl sm:px-6 sm:py-3.5 sm:justify-between sm:bg-white/80 sm:dark:bg-gray-800/80 sm:shadow-sm sm:hover:shadow-md sm:hover:border-primary/40
                        
                        /* En Móvil según el estado de acople (isDocked): */
                        ${isDocked 
                            ? 'relative bottom-auto right-auto w-full h-auto rounded-2xl px-5 py-3.5 justify-between bg-white/85 dark:bg-gray-800/85 shadow-md shadow-primary/10 scale-100' 
                            : 'fixed bottom-[calc(5.85rem+env(safe-area-inset-bottom))] right-4 z-40 w-12 h-12 rounded-full p-0 justify-center bg-white/95 dark:bg-gray-800/95 shadow-2xl shadow-primary/25 border-white/80 dark:border-white/20'
                        }
                    `}
                    aria-label="Lista de precios"
                    title="Lista de precios"
                >
                    {/* Contenido Izquierdo: Ícono y Texto */}
                    <div className="flex items-center gap-3 shrink-0">
                        <div className={`flex items-center justify-center transition-all duration-300 ${
                            isDocked 
                                ? 'h-9 w-9 rounded-xl bg-primary/10 text-primary shrink-0' 
                                : 'h-12 w-12 rounded-full text-primary shrink-0 sm:h-9 sm:w-9 sm:rounded-xl sm:bg-primary/10'
                        }`}>
                            <span className="material-symbols-outlined text-2xl drop-shadow-xs">payments</span>
                        </div>
                        
                        {/* Texto: Se expande al anclarse y se oculta al flotar */}
                        <span className={`font-bold text-base sm:text-lg transition-all duration-300 truncate ${
                            isDocked 
                                ? 'opacity-100 max-w-xs block' 
                                : 'opacity-0 max-w-0 hidden sm:block sm:opacity-100 sm:max-w-xs'
                        }`}>
                            {isExpanded ? 'Ocultar lista de precios' : 'Lista de precios'}
                        </span>
                    </div>

                    {/* Flecha derecha de expandir: visible solo al anclarse o en desktop */}
                    <div className={`items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700/60 text-gray-500 dark:text-gray-300 transition-all duration-300 shrink-0 ${
                        isDocked 
                            ? 'flex h-8 w-8 opacity-100' 
                            : 'hidden sm:flex sm:h-8 sm:w-8 sm:opacity-100'
                    }`}>
                        <span className={`material-symbols-outlined text-xl transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                            expand_more
                        </span>
                    </div>
                </button>

                {/* --- Contenido del Acordeón Desplegado en la Página --- */}
                {isExpanded && (
                    <div className="mt-4 rounded-3xl border border-white/80 dark:border-white/10 bg-white/85 dark:bg-gray-800/85 shadow-2xl backdrop-blur-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                        
                        {/* --- Desktop Table (Hidden on Mobile) --- */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700/60">
                                <thead className="bg-gray-50/80 dark:bg-gray-900/50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Servicio</th>
                                        <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tipo de Agua</th>
                                        <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tamaño</th>
                                        <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Mostrador</th>
                                        <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">A Domicilio</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                                    {tableData.map((item, index) => (
                                        <tr key={index} className="hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">{item.service}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 border border-cyan-100 dark:border-cyan-800">
                                                    <span className="material-symbols-outlined text-xs">water_drop</span>
                                                    {item.waterType}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 font-semibold">{item.size}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-base font-black text-gray-800 dark:text-gray-100">${item.mostrador ? item.mostrador.toFixed(2) : 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-base font-black text-primary">${item.domicilio ? item.domicilio.toFixed(2) : 'N/A'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* --- Mobile Card View (Visible only on Mobile) --- */}
                        <div className="md:hidden flex flex-col divide-y divide-gray-100 dark:divide-gray-700/60">
                            {tableData.map((item, index) => (
                                <div key={index} className="p-4 flex flex-col gap-3 hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors">
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="flex flex-col gap-1">
                                            <h3 className="font-bold text-gray-900 dark:text-white text-base">{item.service}</h3>
                                            <div className="flex items-center gap-2">
                                                <span className="inline-flex items-center gap-1 bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300 text-xs font-bold px-2 py-0.5 rounded-full border border-cyan-100 dark:border-cyan-800">
                                                    <span className="material-symbols-outlined text-[11px]">water_drop</span>
                                                    {item.waterType}
                                                </span>
                                            </div>
                                        </div>
                                        <span className="bg-primary/10 text-primary text-xs font-black px-2.5 py-1 rounded-xl shrink-0">
                                            {item.size}
                                        </span>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-2.5 mt-1">
                                        <div className="bg-gray-50/80 dark:bg-gray-900/50 p-2.5 rounded-xl text-center border border-gray-100 dark:border-gray-700/50">
                                            <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Mostrador</p>
                                            <p className="font-black text-gray-900 dark:text-white text-lg mt-0.5">
                                                {item.mostrador ? `$${item.mostrador.toFixed(2)}` : '--'}
                                            </p>
                                        </div>
                                        <div className="bg-cyan-50/50 dark:bg-cyan-900/20 p-2.5 rounded-xl text-center border border-cyan-100/60 dark:border-cyan-800/40">
                                            <p className="text-[10px] text-primary uppercase font-bold tracking-wider">A Domicilio</p>
                                            <p className="font-black text-primary text-lg mt-0.5">
                                                {item.domicilio ? `$${item.domicilio.toFixed(2)}` : '--'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                    </div>
                )}
            </div>
        </>
    );
};

export default PriceTable;
