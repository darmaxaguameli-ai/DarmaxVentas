import React, { useState, useMemo } from 'react';
import PosRefillGrid from "./PosRefillGrid";
import CustomerModal from "./CustomerModal";
import PaymentModal from "./PaymentModal";
import DeliveryModal from "./DeliveryModal";
import Swal from 'sweetalert2';
import { createOrder, createUser } from '../../api/apiClient';
import { MdPerson, MdLocalShipping, MdReceipt, MdClose, MdCheckCircle } from 'react-icons/md';
import { useHaptic } from '../../hooks/useHaptic';
import { formatCurrency } from '@/utils/formatters';

const NewOrderFlow = ({ onExit, sesionCajaId, onOrderCreated, storeId }) => {
    const { impact } = useHaptic();
    
    // Core State - Centered on "what are we recording"
    const [orderItems, setOrderItems] = useState([]);
    const [customer, setCustomer] = useState(null);
    const [deliveryInfo, setDeliveryInfo] = useState({
        method: 'mostrador',
        collectEmptyJugs: false,
        deliveryDetails: null,
    });
    
    // Modals
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);

    // Totals
    const total = useMemo(() => {
        const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const shipping = (deliveryInfo.method === 'domicilio' && deliveryInfo.collectEmptyJugs) ? 10 : 0;
        return subtotal + shipping;
    }, [orderItems, deliveryInfo]);

    const handleProductSelect = (item, quantity) => {
        // En el modo bitácora, reemplazamos o añadimos de forma directa
        setOrderItems(prev => {
            const exists = prev.find(i => i.servicePriceId === item.servicePriceId && i.jugBrandId === item.jugBrandId);
            if (exists) {
                return prev.map(i => i === exists ? { ...i, quantity: i.quantity + quantity } : i);
            }
            return [...prev, { ...item, quantity }];
        });
    };

    const handleRemoveItem = (id) => {
        setOrderItems(prev => prev.filter(i => i.servicePriceId !== id && i.id !== id));
    };

    const handleFinalizeAction = async (paymentData = null) => {
        const isMostrador = deliveryInfo.method === 'mostrador';
        
        try {
            Swal.fire({ title: 'Registrando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

            let finalCustomerId = customer?.id;

            // Auto-creación de cliente si es nuevo
            if (customer?.isNew && deliveryInfo.deliveryDetails?.name) {
                const createdUser = await createUser({
                    name: deliveryInfo.deliveryDetails.name,
                    phone: customer.phone || deliveryInfo.deliveryDetails.phone || '',
                    street: deliveryInfo.deliveryDetails.street || '',
                    neighborhood: deliveryInfo.deliveryDetails.neighborhood || '',
                    municipality: deliveryInfo.deliveryDetails.municipality || '',
                    state: deliveryInfo.deliveryDetails.state || '',
                    city: deliveryInfo.deliveryDetails.city || '',
                    postalCode: deliveryInfo.deliveryDetails.postalCode || '',
                    references: deliveryInfo.deliveryDetails.references || '',
                    lat: deliveryInfo.deliveryDetails.lat || null,
                    lng: deliveryInfo.deliveryDetails.lng || null,
                    clientCategory: customer.clientCategory || 'PARTICULAR'
                });
                finalCustomerId = createdUser.id;
            }

            const orderPayload = {
                clienteId: finalCustomerId || null,
                sesionCajaId: sesionCajaId || null,
                storeId: storeId || null, // ✅ Se añade el storeId
                items: orderItems.map(item => ({
                    quantity: item.quantity,
                    price: item.price,
                    servicePriceId: item.servicePriceId,
                    jugBrandId: item.jugBrandId,
                    jugBrandName: item.jugBrandName,
                    jugBrandImageUrl: item.jugBrandImageUrl
                })),
                total: total,
                deliveryMethod: isMostrador ? 'pickup' : (deliveryInfo.collectEmptyJugs ? 'home_collection' : 'delivery'),
                deliveryLat: deliveryInfo.deliveryDetails?.lat || null,
                deliveryLng: deliveryInfo.deliveryDetails?.lng || null,
                deliveryTimeSlot: deliveryInfo.deliveryDetails?.deliveryTimeSlot || null,
                paymentMethod: isMostrador ? (paymentData?.method === 'cash' ? 'Efectivo' : 'Tarjeta') : 'Pendiente',
                paymentStatus: isMostrador ? 'PAGADO' : 'NO_PAGADO',
                status: isMostrador ? 'ENTREGADO' : 'PENDIENTE', // ✅ Venta mostrador pagada se marca como entregada
            };

            await createOrder(orderPayload);
            impact('heavy');
            if (onOrderCreated) onOrderCreated(); // Refresh the list immediately
            Swal.fire({ icon: 'success', title: 'Registro Completado', showConfirmButton: false, timer: 2000 });
            onExit();

        } catch (error) {
            Swal.fire('Error', error.message, 'error');
        }
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-full animate-in fade-in duration-500">
            
            {/* IZQUIERDA: El Asistente de Registro */}
            <div className="flex-grow flex flex-col min-w-0 h-full">
                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex-grow overflow-hidden flex flex-col">
                    <PosRefillGrid 
                        onProductSelect={handleProductSelect} 
                        defaultDeliveryMethod={deliveryInfo.method} 
                    />
                </div>
            </div>

            {/* DERECHA: Resumen de Bitácora */}
            <div className="w-full lg:w-96 flex flex-col gap-4 h-full">
                
                {/* Panel de Cliente y Logística */}
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Datos del Registro</h3>
                    
                    <button 
                        onClick={() => setIsCustomerModalOpen(true)}
                        className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${customer ? 'border-primary bg-primary/5 text-primary' : 'border-gray-50 bg-gray-50 dark:bg-gray-900 dark:border-gray-800 text-gray-400 hover:border-primary/20'}`}
                    >
                        <MdPerson className="text-2xl" />
                        <div className="text-left min-w-0">
                            <p className="font-black uppercase text-xs truncate">{customer ? customer.name : 'Identificar Cliente'}</p>
                            <p className="text-[10px] font-bold opacity-70">{customer ? customer.phone : 'Opcional para Mostrador'}</p>
                        </div>
                    </button>

                    <button 
                        onClick={() => setIsDeliveryModalOpen(true)}
                        className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${deliveryInfo.method === 'domicilio' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-600' : 'border-gray-50 bg-gray-50 dark:bg-gray-900 dark:border-gray-800 text-gray-400 hover:border-primary/20'}`}
                    >
                        <MdLocalShipping className="text-2xl" />
                        <div className="text-left min-w-0">
                            <p className="font-black uppercase text-xs truncate">{deliveryInfo.method === 'mostrador' ? 'Venta en Mostrador' : 'Entrega a Domicilio'}</p>
                            <p className="text-[10px] font-bold opacity-70">{deliveryInfo.method === 'mostrador' ? 'Cobro inmediato' : 'Cobro al entregar'}</p>
                        </div>
                    </button>
                </div>

                {/* Lista de Items Registrados */}
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm flex-grow flex flex-col overflow-hidden">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4">Productos en Bitácora</h3>
                    
                    <div className="flex-grow overflow-y-auto custom-scrollbar space-y-3 pr-2">
                        {orderItems.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-30 grayscale">
                                <MdReceipt className="text-5xl mb-2" />
                                <p className="text-xs font-bold uppercase">Esperando selección</p>
                            </div>
                        ) : (
                            orderItems.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between group animate-in slide-in-from-right-4 duration-300">
                                    <div className="min-w-0">
                                        <p className="text-xs font-black text-gray-800 dark:text-white uppercase truncate">{item.jugBrandName}</p>
                                        <p className="text-[9px] text-gray-400 font-bold uppercase">{item.quantity} x {formatCurrency(item.price)}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <p className="text-xs font-black text-primary">{formatCurrency(item.price * item.quantity)}</p>
                                        <button onClick={() => handleRemoveItem(item.servicePriceId || item.id)} className="p-1.5 text-gray-300 hover:text-red-500 transition-colors">
                                            <MdClose />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700 space-y-4">
                        <div className="flex justify-between items-end">
                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Total a Registrar</p>
                            <p className="text-3xl font-black text-gray-900 dark:text-white leading-none">{formatCurrency(total)}</p>
                        </div>

                        <button 
                            disabled={orderItems.length === 0}
                            onClick={() => {
                                if (deliveryInfo.method === 'mostrador') setIsPaymentModalOpen(true);
                                else handleFinalizeAction();
                            }}
                            className="w-full py-4 rounded-2xl bg-primary text-white font-black uppercase text-sm shadow-xl shadow-primary/25 hover:bg-primary-dark active:scale-95 transition-all disabled:opacity-30 disabled:grayscale flex items-center justify-center gap-2"
                        >
                            <MdCheckCircle className="text-xl" />
                            {deliveryInfo.method === 'mostrador' ? 'Registrar y Cobrar' : 'Agendar en Bitácora'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <CustomerModal isOpen={isCustomerModalOpen} onClose={() => setIsCustomerModalOpen(false)} onCustomerAdd={(c) => { impact('medium'); setCustomer(c); }} />
            <PaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} total={total} onPaymentConfirm={handleFinalizeAction} />
            <DeliveryModal isOpen={isDeliveryModalOpen} onClose={() => setIsDeliveryModalOpen(false)} initialData={deliveryInfo} customer={customer} onSave={(d) => { impact('medium'); setDeliveryInfo(d); }} />
        </div>
    );
};

export default NewOrderFlow;