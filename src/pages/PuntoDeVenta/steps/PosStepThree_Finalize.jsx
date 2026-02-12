// src/pages/PuntoDeVenta/steps/PosStepThree_Finalize.jsx
import React, { useState, useMemo } from 'react';
import { useConfig } from '../../../context/ConfigContext';

// --- Helper para calcular el precio ---
// Esta es una simplificación. Una implementación real necesitaría
// una lógica más robusta para mapear productos a precios.
const calculateTotal = (pedidoData, servicePrices) => {
    if (!pedidoData?.stepTwoData || !servicePrices) return 0;

    let total = 0;
    const items = pedidoData.stepTwoData;

    items.forEach(waterType => {
        waterType.assignments.forEach(assignment => {
            const { jugName, quantity, waterTypeId } = assignment;
            // Lógica de búsqueda de precios simplificada
            const sizeMatch = jugName.match(/(\d+)/);
            const size = sizeMatch ? `${sizeMatch[1]}L` : '20L';
            const serviceName = `Recarga ${size}`;

            const priceInfo = servicePrices.find(p => 
                p.name === serviceName &&
                p.waterType.id === waterTypeId &&
                p.method === (pedidoData.tipo === 'domicilio' ? 'Domicilio' : 'Mostrador')
            );
            
            if (priceInfo) {
                total += priceInfo.price * quantity;
            }
        });
    });

    // Añadir costo de envío si es a domicilio
    if (pedidoData.tipo === 'domicilio') {
        const deliveryCost = 10; // Costo fijo de envío
        total += deliveryCost;
    }

    return total;
};


const PosStepThree_Finalize = ({ onFinalize, onBack, pedidoData }) => {
    const { servicePrices, loading: configLoading } = useConfig();
    const [cliente, setCliente] = useState({ nombre: '', telefono: '', direccion: '' });

    const isDomicilio = pedidoData.tipo === 'domicilio';

    const totalPedido = useMemo(() => 
        calculateTotal(pedidoData, servicePrices),
    [pedidoData, servicePrices]);

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
            cliente: isDomicilio ? cliente : null,
            fecha: new Date().toISOString()
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
                {pedidoData.stepTwoData?.map(wt => (
                    wt.assignments.map(a => (
                        <div key={`${wt.id}-${a.jugId}`} className="flex justify-between items-center">
                            <span className="font-medium">{a.jugName} ({wt.name})</span>
                            <span className="font-bold">x {a.quantity}</span>
                        </div>
                    ))
                ))}
            </div>

            {/* Formulario de Cliente para Domicilio */}
            {isDomicilio && (
                <div className="mb-6">
                    <h4 className="text-lg font-semibold mb-4">Datos del Cliente</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input type="text" name="nombre" value={cliente.nombre} onChange={handleClientChange} placeholder="Nombre del cliente" className="input-form" required />
                        <input type="tel" name="telefono" value={cliente.telefono} onChange={handleClientChange} placeholder="Teléfono" className="input-form" required />
                        <textarea name="direccion" value={cliente.direccion} onChange={handleClientChange} placeholder="Dirección completa" className="input-form sm:col-span-2" rows="2" required></textarea>
                    </div>
                </div>
            )}

            {/* Total */}
            <div className="text-right mb-8">
                {isDomicilio && <p className="text-sm text-gray-500">Envío: $10.00</p>}
                <p className="text-3xl font-black">Total: <span className="text-primary">${totalPedido.toFixed(2)}</span></p>
            </div>

            {/* Acciones */}
            <div className="flex justify-between items-center pt-4 mt-6 border-t dark:border-gray-700">
                <button type="button" onClick={onBack} className="btn-secondary">
                    &larr; Volver al paso 2
                </button>
                <button type="button" onClick={handleFinalize} className="btn-primary">
                    Finalizar Pedido
                </button>
            </div>
        </div>
    );
};

export default PosStepThree_Finalize;
