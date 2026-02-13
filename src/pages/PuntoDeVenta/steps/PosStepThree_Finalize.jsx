// src/pages/PuntoDeVenta/steps/PosStepThree_Finalize.jsx
import React, { useState, useMemo } from 'react';
import { useConfig } from '../../../context/ConfigContext';

// --- Helper para calcular el precio ---
// Función auxiliar para encontrar el mejor precio, adaptada de OrderSummaryStepFour.jsx
const findBestPrice = (prices, method, waterTypeId, jugName, jugId) => {
    // En este contexto, el `method` ya viene como 'domicilio' o 'mostrador' directamente.
    // No necesitamos mapear de 'pickup'/'delivery'/'home_collection'.
    const backendMethod = method === 'domicilio' ? 'Domicilio' : 'Mostrador';

    // Extraer tamaño del nombre del producto (ej. "4L", "1 Litro", "20L")
    const sizeMatch = jugName ? jugName.match(/(\d+(?:\.\d+)?)\s*(?:l|litros?|lt)/i) : null;
    const sizeSuffix = sizeMatch ? `${sizeMatch[1]}L` : '20L'; // Default 20L si no se encuentra
    
    let serviceNameToSearch = `Recarga ${sizeSuffix}`; 

    const possibleMatches = prices.filter(p => 
        p.name === serviceNameToSearch &&
        p.method === backendMethod &&
        p.waterType?.id === waterTypeId
    );
    
    if (!possibleMatches.length) return null;

    // Prioridad 1: Encontrar un precio que liste explícitamente esta marca de garrafón (jugBrandId).
    const brandSpecificMatch = possibleMatches.find(p =>
        p.jugBrands && p.jugBrands.length > 0 && p.jugBrands.some(brand => brand.id === jugId)
    );

    if (brandSpecificMatch) {
        return brandSpecificMatch;
    }

    // Prioridad 2: Si no hay uno específico, encontrar un precio "genérico" (que no especifica marcas).
    const genericMatch = possibleMatches.find(p => !p.jugBrands || p.jugBrands.length === 0);

    return genericMatch || null;
};

const calculateTotal = (pedidoData, servicePrices, cobrarRecoleccion) => {
    if (!pedidoData?.stepTwoData || !servicePrices || servicePrices.length === 0) {
        console.log("PuntoDeVenta DEBUG: No hay datos de pedido o precios de servicio para calcular.", { pedidoData, servicePrices });
        return { total: 0, enrichedItems: [] };
    }

    console.log("PuntoDeVenta DEBUG: pedidoData.stepTwoData:", pedidoData.stepTwoData);
    console.log("PuntoDeVenta DEBUG: servicePrices:", servicePrices);

    let total = 0;
    const enrichedItems = pedidoData.stepTwoData.map(waterType => {
        const enrichedAssignments = waterType.assignments.map(assignment => {
            const { jugName, quantity, jugId } = assignment;
            const currentWaterTypeId = waterType.id;
            
            console.log(`PuntoDeVenta DEBUG: Buscando precio para: Jug='${jugName}', JugId='${jugId}', WaterTypeId='${currentWaterTypeId}', Method='${pedidoData.tipo}'`);

            const priceInfo = findBestPrice(
                servicePrices, 
                pedidoData.tipo, 
                currentWaterTypeId, 
                jugName, 
                jugId
            );
            
            let unitPrice = 0;
            if (priceInfo) {
                console.log(`PuntoDeVenta DEBUG: Precio encontrado:`, priceInfo);
                unitPrice = priceInfo.price;
                total += unitPrice * quantity;
            } else {
                console.warn(`PuntoDeVenta: No se encontró precio para ${jugName} (WaterType ID: ${currentWaterTypeId}) con método ${pedidoData.tipo}.`);
            }
            return { ...assignment, unitPrice };
        });
        return { ...waterType, assignments: enrichedAssignments };
    });

    const isDomicilio = pedidoData.tipo === 'domicilio';
    // Añadir costo de envío si es a domicilio y si la opción está marcada
    if (isDomicilio && cobrarRecoleccion) {
        const deliveryCost = 10; // Costo fijo de envío por recolección
        total += deliveryCost;
    }

    return { total, enrichedItems };
};


const PosStepThree_Finalize = ({ onFinalize, onBack, pedidoData }) => {
    const { servicePrices, loading: configLoading } = useConfig();
    const [cliente, setCliente] = useState({ nombre: '', telefono: '', isWhatsapp: false, direccion: '' });
    const [cobrarRecoleccion, setCobrarRecoleccion] = useState(false);

    const isDomicilio = pedidoData.tipo === 'domicilio';

    const { total: totalPedido, enrichedItems } = useMemo(() => 
        calculateTotal(pedidoData, servicePrices, cobrarRecoleccion),
    [pedidoData, servicePrices, cobrarRecoleccion]);

    const handleClientChange = (e) => {
        const { name, value } = e.target;
        setCliente(prev => ({ ...prev, [name]: value }));
    };

    const handleFinalize = () => {
        if (isDomicilio && (!cliente.nombre || !cliente.telefono || !cliente.direccion)) {
            alert("Para pedidos a domicilio, todos los datos del cliente son requeridos.");
            return;
        }
        
        const finalOrderData = {
            ...pedidoData,
            total: totalPedido,
            itemsDetalle: enrichedItems, // Incluir los ítems con precios unitarios
            cliente: isDomicilio ? { ...cliente, isWhatsapp: cliente.isWhatsapp } : null,
            fecha: new Date().toISOString(),
            cobrarRecoleccion: isDomicilio ? cobrarRecoleccion : false // Guardar la decisión
        };
        onFinalize(finalOrderData);
    };

    if (configLoading) {
        return <p>Cargando precios...</p>;
    }

    return (
        <div>
            <h3 className="text-xl font-bold mb-1">Resumen del Pedido</h3>
            <p className="text-gray-500 mb-6">Verifica los detalles y finaliza el pedido.</p>

            {/* Resumen de Items */}
            <div className="space-y-2 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg mb-6">
                {enrichedItems?.map(wt => (
                    wt.assignments.map(a => (
                        <div key={`${wt.id}-${a.jugId}`} className="flex justify-between items-center">
                            <span className="font-medium">{a.jugName} ({wt.name}) x {a.quantity}</span>
                            <span className="font-bold">
                                {a.unitPrice ? `$${(a.unitPrice * a.quantity).toFixed(2)}` : 'Precio no disponible'}
                            </span>
                        </div>
                    ))
                ))}
            </div>

            {/* Formulario de Cliente para Domicilio */}
            {isDomicilio && (
                <div className="mb-6">
                    <h4 className="text-lg font-semibold mb-4">Datos del Cliente</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <input type="text" name="nombre" value={cliente.nombre} onChange={handleClientChange} placeholder="Nombre del cliente" className="input-form" required />
                        <div className="flex flex-col">
                            <input type="tel" name="telefono" value={cliente.telefono} onChange={handleClientChange} placeholder="Teléfono" className="input-form" required />
                            <div className="flex items-center mt-1">
                                <input
                                    id="isWhatsapp"
                                    name="isWhatsapp"
                                    type="checkbox"
                                    checked={cliente.isWhatsapp}
                                    onChange={(e) => setCliente(prev => ({ ...prev, isWhatsapp: e.target.checked }))}
                                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                />
                                <label htmlFor="isWhatsapp" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                    Es WhatsApp
                                </label>
                            </div>
                        </div>
                        <textarea name="direccion" value={cliente.direccion} onChange={handleClientChange} placeholder="Dirección completa" className="input-form sm:col-span-2" rows="2" required></textarea>
                    </div>

                    {/* Opción de cobrar recolección */}
                    <div className="flex items-center mt-4">
                        <input
                            id="cobrarRecoleccion"
                            name="cobrarRecoleccion"
                            type="checkbox"
                            checked={cobrarRecoleccion}
                            onChange={(e) => setCobrarRecoleccion(e.target.checked)}
                            className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor="cobrarRecoleccion" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                            Cobrar recolección a domicilio (+ $10.00)
                        </label>
                    </div>
                </div>
            )}

            {/* Total */}
            <div className="text-right mb-8">
                {isDomicilio && cobrarRecoleccion && <p className="text-sm text-gray-500">Recolección: $10.00</p>}
                <p className="text-3xl font-black">Total: <span className="text-primary">${totalPedido.toFixed(2)}</span></p>
            </div>

            {/* Acciones */}
            <div className="flex flex-col-reverse sm:flex-row gap-4 justify-between items-center pt-4 mt-6 border-t dark:border-gray-700">
                <button type="button" onClick={onBack} className="btn-secondary w-full sm:w-auto">
                    &larr; Volver al paso 2
                </button>
                <button type="button" onClick={handleFinalize} className="btn-primary w-full sm:w-auto">
                    Finalizar Pedido
                </button>
            </div>
        </div>
    );
};

export default PosStepThree_Finalize;
