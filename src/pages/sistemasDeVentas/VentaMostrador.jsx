import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    fetchOrders, 
    updateOrder, 
    fetchActiveCashDrawerSession, 
    startCashDrawerSession, 
    closeCashDrawerSession, 
    createCashTransaction, 
    reportDamagedTags,
    fetchUsers
} from '@/api/apiClient';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/utils/formatters';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import Swal from 'sweetalert2';
import PosHeader from './PosHeader';
import StartDayModal from './StartDayModal';
import PaymentModal from './PaymentModal';
import CloseRegisterModal from './CloseRegisterModal';
import CashMovementModal from './CashMovementModal';
import NewOrderFlow from './NewOrderFlow';

// --- Sub-componentes Visuales ---

const SummaryCard = ({ title, value, icon, colorClass }) => (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${colorClass}`}>
            <span className="material-symbols-outlined">{icon}</span>
        </div>
        <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{title}</p>
            <p className="text-xl font-black text-gray-800 dark:text-white">{value}</p>
        </div>
    </div>
);

const OrderCard = ({ order, onAction }) => {
    const timeAgo = formatDistanceToNow(new Date(order.createdAt), { addSuffix: true, locale: es });
    
    // Determinar la acción principal según el tipo de pedido
    const getActionConfig = () => {
        if (order.status === 'ENTREGADO' || order.status === 'CANCELADO') return null;
        
        // Venta en Mostrador: Siempre Cobrar
        if (order.deliveryMethod === 'pickup') {
            return { label: 'Cobrar', icon: 'payments', color: 'bg-green-600' };
        }
        
        // Domicilio / Recolección: Solo Asignar o Ver estado
        if (order.deliveryMethod === 'delivery' || order.deliveryMethod === 'home_collection') {
            if (!order.repartidorId) {
                return { label: 'Asignar', icon: 'person_add', color: 'bg-blue-600' };
            }
            if (order.status === 'EN_RUTA') {
                return { label: 'En Ruta', icon: 'directions_bike', color: 'bg-indigo-500', isLabel: true };
            }
            return { label: 'Asignado', icon: 'how_to_reg', color: 'bg-gray-400', isLabel: true };
        }
        
        return { label: 'Gestionar', icon: 'edit', color: 'bg-gray-600' };
    };

    const action = getActionConfig();
    const isDelivery = order.deliveryMethod === 'delivery' || order.deliveryMethod === 'home_collection';

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-3">
                <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-tighter inline-block">
                            #{order.customId}
                        </span>
                        {order.deliveryTimeSlot && (
                            <span className="text-[10px] font-bold text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded-full uppercase tracking-tighter inline-block">
                                {order.deliveryTimeSlot}
                            </span>
                        )}
                    </div>
                    <h3 className="font-black text-gray-800 dark:text-white truncate leading-tight uppercase">
                        {order.cliente.name}
                    </h3>
                    {isDelivery && (
                        <p className="text-[10px] text-gray-500 font-bold uppercase truncate">
                            {order.cliente.street}, {order.cliente.neighborhood}
                        </p>
                    )}
                    <p className="text-[10px] text-gray-400 font-bold uppercase">{timeAgo}</p>
                </div>
                <p className="text-lg font-black text-gray-900 dark:text-white">{formatCurrency(order.total)}</p>
            </div>

            <div className="space-y-1 mb-4">
                {order.items.slice(0, 2).map((item, idx) => (
                    <p key={idx} className="text-xs text-gray-500 dark:text-gray-400 flex justify-between">
                        <span className="truncate">{item.jugBrandName || 'Producto'}</span>
                        <span className="font-bold ml-2">x{item.quantity}</span>
                    </p>
                ))}
                {order.items.length > 2 && <p className="text-[10px] text-primary font-bold">+ {order.items.length - 2} más</p>}
            </div>

            {action && (
                <button 
                    onClick={action.isLabel ? undefined : () => onAction(order)}
                    className={`w-full py-2.5 ${action.color} text-white rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 shadow-lg shadow-gray-200 dark:shadow-none transition-all ${action.isLabel ? 'cursor-default opacity-90' : 'active:scale-95'}`}
                >
                    <span className="material-symbols-outlined text-lg">{action.icon}</span>
                    {action.label}
                </button>
            )}
        </div>
    );
};

const VentaMostrador = () => {
    const navigate = useNavigate();
    const { logout, user } = useAuth();
    
    // --- State ---
    const [orders, setOrders] = useState([]);
    const [showBitacora, setShowBitacora] = useState(false); // Nuevo: Ver pedidos finalizados
    const [cashDrawerSession, setCashDrawerSession] = useState(null);
    const [isCashDrawerLoading, setIsCashDrawerLoading] = useState(true);
    const [activeView, setActiveView] = useState('dashboard'); // 'dashboard' | 'new_order'
    const [activeTab, setActiveTab] = useState('mostrador'); // Para móvil
    
    // Modals
    const [showStartDayModal, setShowStartDayModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showCloseRegisterModal, setShowCloseRegisterModal] = useState(false);
    const [showCashMovementModal, setShowCashMovementModal] = useState(false);
    const [currentOrder, setCurrentOrder] = useState(null);
    
    const prevOrderCount = useRef(0);

    // Helper for non-intrusive notifications
const showToast = (title, icon = 'success') => {
    Swal.fire({
        toast: true,
        position: 'top-end',
        icon,
        title,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        customClass: {
            container: 'z-[5000]' // Asegurar que el toast esté por encima de todo
        }
    });
};

    const playNotificationSound = () => {
        const audio = new Audio('/sounds/notification.mp3');
        audio.play().catch(_e => console.log("Audio blocked"));
    };

    // --- Data Loading ---
    const loadOrders = useCallback(async (isSilent = false) => {
        try {
            const data = await fetchOrders();
            setOrders(data);
            prevOrderCount.current = data.length;
        } catch (err) {
            console.error("Error loading orders:", err);
        } finally {
            setIsCashDrawerLoading(false); // Using this as a proxy for first load
        }
    }, []);

    const pollOrders = useCallback(async () => {
        try {
            const data = await fetchOrders();
            if (data.length > prevOrderCount.current) {
                playNotificationSound();
                showToast('¡Nuevo pedido!', 'info');
            }
            setOrders(data);
            prevOrderCount.current = data.length;
        } catch (_err) {}
    }, []);

    const fetchSession = useCallback(async () => {
        setIsCashDrawerLoading(true);
        try {
            const session = await fetchActiveCashDrawerSession();
            setCashDrawerSession(session);
            if (!session) setShowStartDayModal(true);
        } catch (_err) {
            setShowStartDayModal(true); 
        } finally {
            setIsCashDrawerLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSession();
        loadOrders();
        const intervalId = setInterval(pollOrders, 5000);
        return () => clearInterval(intervalId);
    }, [fetchSession, loadOrders, pollOrders]);

    // --- Handlers ---
    const handleStartSession = async (amount, initialTags) => {
        try {
            const newSession = await startCashDrawerSession(amount, initialTags);
            setCashDrawerSession(newSession);
            setShowStartDayModal(false);
            showToast('Sesión iniciada');
        } catch (err) {
            Swal.fire('Error', err.message, 'error');
        }
    };

    const handleOrderAction = async (order) => {
        setCurrentOrder(order);
        
        if (order.deliveryMethod === 'pickup') {
            setShowPaymentModal(true);
        } else if (!order.repartidorId) {
            // Lógica de Asignación de Repartidor
            try {
                const users = await fetchUsers();
                const deliveryPeople = users.filter(u => u.role === 'REPARTIDOR');
                
                if (deliveryPeople.length === 0) {
                    Swal.fire('Atención', 'No hay repartidores registrados en el sistema.', 'warning');
                    return;
                }

                const { value: repartidorId } = await Swal.fire({
                    title: 'Asignar Repartidor',
                    input: 'select',
                    inputOptions: deliveryPeople.reduce((acc, curr) => {
                        acc[curr.id] = curr.name;
                        return acc;
                    }, {}),
                    inputPlaceholder: 'Selecciona un repartidor',
                    showCancelButton: true,
                    confirmButtonText: 'Asignar ahora',
                    confirmButtonColor: '#2563eb',
                    inputValidator: (value) => {
                        if (!value) return 'Debes seleccionar a alguien';
                    }
                });

                if (repartidorId) {
                    await updateOrder(order.id, { repartidorId, status: 'EN_PROCESO' });
                    showToast('Repartidor asignado correctamente');
                    loadOrders(true);
                }
            } catch (err) {
                Swal.fire('Error', 'No se pudo cargar la lista de repartidores.', 'error');
            }
        }
    };

    const handleReportTags = async () => {
        const { value: quantity } = await Swal.fire({
            title: 'Reportar Etiquetas Dañadas',
            input: 'number',
            inputLabel: 'Cantidad de etiquetas',
            inputPlaceholder: 'Ej. 5',
            showCancelButton: true,
            confirmButtonText: 'Reportar',
            confirmButtonColor: '#f97316',
            preConfirm: (value) => {
                if (!value || value < 1) {
                    Swal.showValidationMessage('Ingresa una cantidad válida');
                }
                return value;
            }
        });

        if (quantity) {
            try {
                await reportDamagedTags(parseInt(quantity));
                showToast('Reporte guardado', 'warning');
                fetchSession();
            } catch (err) {
                Swal.fire('Error', 'No se pudo guardar el reporte', 'error');
            }
        }
    };

    const handlePaymentConfirm = async ({ change }) => {
        try {
            await updateOrder(currentOrder.id, { 
                status: 'ENTREGADO', 
                paymentMethod: 'Efectivo',
                sesionCajaId: cashDrawerSession?.id // Vincular explícitamente al cobrar
            });
            showToast(`Cobrado. Cambio: ${formatCurrency(change)}`);
            setShowPaymentModal(false);
            setCurrentOrder(null);
            loadOrders(true);
            fetchSession(); // ✅ Refrescar datos de la sesión (sellos y transacciones)
        } catch (err) {
            Swal.fire('Error', err.message, 'error');
        }
    };

    const handleLogout = useCallback(async () => {
        if (cashDrawerSession?.estado === 'ABIERTA') {
            setShowCloseRegisterModal(true);
        } else {
            const result = await Swal.fire({ title: '¿Salir?', icon: 'question', showCancelButton: true, confirmButtonText: 'Sí, salir' });
            if (result.isConfirmed) {
                navigate('/logout-success', { state: { name: user?.name } });
                setTimeout(logout, 100);
            }
        }
    }, [cashDrawerSession, logout, navigate, user]);

    const handleEndSession = async (closingBalance) => {
        try {
            await closeCashDrawerSession(closingBalance);
            navigate('/logout-success', { state: { name: user?.name } });
            setTimeout(logout, 100);
        } catch (err) {
            Swal.fire('Error', err.message, 'error');
        }
    };

    // --- Memoized Stats ---
    const stats = useMemo(() => {
        const activeOrders = orders.filter(o => o.status !== 'CANCELADO');
        const usedTags = activeOrders.reduce((total, order) => {
            return total + order.items.reduce((sum, item) => sum + item.quantity, 0);
        }, 0);

        return {
            total: orders.filter(o => o.status !== 'ENTREGADO' && o.status !== 'CANCELADO').length,
            mostrador: orders.filter(o => o.deliveryMethod === 'pickup' && o.status !== 'ENTREGADO' && o.status !== 'CANCELADO').length,
            recoleccion: orders.filter(o => o.deliveryMethod === 'home_collection' && o.status === 'PENDIENTE').length,
            entrega: orders.filter(o => o.deliveryMethod === 'delivery' && (o.status === 'PENDIENTE' || o.status === 'EN_PROCESO')).length,
            usedTags // Nuevo
        };
    }, [orders]);

    return (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 font-display transition-colors duration-300">
            <PosHeader 
                isDashboard={activeView === 'dashboard'} 
                onNewOrderClick={() => setActiveView('new_order')} 
                onDashboardClick={() => setActiveView('dashboard')}
                onLogout={handleLogout}
                isCashDrawerOpen={cashDrawerSession?.estado === 'ABIERTA'}
                onCashMovementClick={() => setShowCashMovementModal(true)}
                onReportDamagedTags={handleReportTags}
            />
            
            <main className="flex-grow overflow-y-auto custom-scrollbar pb-24 sm:pb-6">
                {isCashDrawerLoading ? (
                    <div className="h-full flex items-center justify-center animate-pulse text-gray-400 font-bold uppercase tracking-widest">
                        Cargando Sistema...
                    </div>
                ) : activeView === 'dashboard' ? (
                    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto animate-in fade-in duration-500">
                        
                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-6 mb-8">
                            <SummaryCard title="Pendientes" value={stats.total} icon="list_alt" colorClass="bg-blue-50 text-blue-600 dark:bg-blue-900/20" />
                            <SummaryCard title="Mostrador" value={stats.mostrador} icon="storefront" colorClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20" />
                            <SummaryCard title="Recoger" value={stats.recoleccion} icon="recycling" colorClass="bg-orange-50 text-orange-600 dark:bg-orange-900/20" />
                            <SummaryCard title="Entregar" value={stats.entrega} icon="local_shipping" colorClass="bg-purple-50 text-purple-600 dark:bg-purple-900/20" />
                            <SummaryCard title="Sellos Usados" value={stats.usedTags} icon="sell" colorClass="bg-amber-50 text-amber-600 dark:bg-amber-900/20" />
                        </div>

                        {/* Mobile Tabs */}
                        <div className="md:hidden flex bg-white dark:bg-gray-800 p-1 rounded-2xl shadow-sm mb-6 border border-gray-100 dark:border-gray-700">
                            {['mostrador', 'recoleccion', 'entrega'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-primary text-white shadow-md' : 'text-gray-400'}`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* Orders Grid/Columns */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                            {/* Columna Mostrador */}
                            <div className={`${activeTab === 'mostrador' ? 'block' : 'hidden'} md:block space-y-4`}>
                                <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 mb-4">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span> mostrador
                                </h2>
                                {orders.filter(o => o.deliveryMethod === 'pickup' && o.status !== 'ENTREGADO' && o.status !== 'CANCELADO').length > 0 ? (
                                    orders.filter(o => o.deliveryMethod === 'pickup' && o.status !== 'ENTREGADO' && o.status !== 'CANCELADO').map(o => (
                                        <OrderCard key={o.id} order={o} onAction={handleOrderAction} />
                                    ))
                                ) : (
                                    <p className="text-xs text-gray-400 italic text-center py-10">Sin pedidos pendientes</p>
                                )}
                            </div>

                            {/* Columna Recolección */}
                            <div className={`${activeTab === 'recoleccion' ? 'block' : 'hidden'} md:block space-y-4`}>
                                <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 mb-4">
                                    <span className="w-2 h-2 rounded-full bg-orange-500"></span> recolección
                                </h2>
                                {orders.filter(o => o.deliveryMethod === 'home_collection' && o.status === 'PENDIENTE').length > 0 ? (
                                    orders.filter(o => o.deliveryMethod === 'home_collection' && o.status === 'PENDIENTE').map(o => (
                                        <OrderCard key={o.id} order={o} onAction={handleOrderAction} />
                                    ))
                                ) : (
                                    <p className="text-xs text-gray-400 italic text-center py-10">Sin recolecciones hoy</p>
                                )}
                            </div>

                            {/* Columna Entrega */}
                            <div className={`${activeTab === 'entrega' ? 'block' : 'hidden'} md:block space-y-4`}>
                                <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 mb-4">
                                    <span className="w-2 h-2 rounded-full bg-purple-500"></span> entrega
                                </h2>
                                {orders.filter(o => o.deliveryMethod === 'delivery' && (o.status === 'EN_PROCESO' || o.status === 'PENDIENTE')).length > 0 ? (
                                    orders.filter(o => o.deliveryMethod === 'delivery' && (o.status === 'EN_PROCESO' || o.status === 'PENDIENTE')).map(o => (
                                        <OrderCard key={o.id} order={o} onAction={handleOrderAction} />
                                    ))
                                ) : (
                                    <p className="text-xs text-gray-400 italic text-center py-10">Nada pendiente de entrega</p>
                                )}
                            </div>
                        </div>

                        {/* --- SECCIÓN DE BITÁCORA DE ACTIVIDAD (Nuevo) --- */}
                        <div className="mt-12 border-t border-gray-100 dark:border-gray-700 pt-8">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-lg font-black uppercase tracking-tight text-gray-800 dark:text-white">
                                        Bitácora de Actividad
                                    </h2>
                                    <p className="text-xs text-gray-400 font-bold uppercase">Ventas y entregas registradas hoy</p>
                                </div>
                                <button 
                                    onClick={() => setShowBitacora(!showBitacora)}
                                    className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-bold text-xs uppercase hover:bg-primary hover:text-white transition-all"
                                >
                                    {showBitacora ? 'Ocultar historial' : 'Ver historial de hoy'}
                                </button>
                            </div>

                            {showBitacora && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    {orders.filter(o => o.status === 'ENTREGADO').length > 0 ? (
                                        orders.filter(o => o.status === 'ENTREGADO')
                                            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
                                            .map(o => (
                                                <div key={o.id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 shadow-sm opacity-80 hover:opacity-100 transition-opacity">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full uppercase">
                                                            Entregado
                                                        </span>
                                                        <span className="text-[10px] text-gray-400 font-mono">#{o.customId}</span>
                                                    </div>
                                                    <h4 className="font-bold text-gray-800 dark:text-white text-xs uppercase truncate">{o.cliente.name}</h4>
                                                    <p className="text-[10px] text-gray-400 mb-2">{new Date(o.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                    <div className="flex justify-between items-end border-t border-gray-50 dark:border-gray-700 pt-2">
                                                        <p className="text-[10px] text-gray-500">{o.items.reduce((sum, i) => sum + i.quantity, 0)} garrafones</p>
                                                        <p className="font-black text-gray-800 dark:text-white text-sm">{formatCurrency(o.total)}</p>
                                                    </div>
                                                </div>
                                            ))
                                    ) : (
                                        <div className="col-span-full py-12 text-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-[2rem]">
                                            <p className="text-sm text-gray-400 italic font-medium uppercase tracking-widest">Sin actividad registrada todavía</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <NewOrderFlow 
                        onExit={() => setActiveView('dashboard')} 
                        onOrderCreated={() => {
                            loadOrders(true);
                            fetchSession(); // ✅ Refrescar la sesión para que los sellos aparezcan en el cierre
                        }} 
                        sesionCajaId={cashDrawerSession?.id}
                        storeId={cashDrawerSession?.storeId}
                    />
                )}
            </main>

            {/* Modals */}
            {showStartDayModal && <StartDayModal onStartSession={handleStartSession} />}
            {currentOrder && <PaymentModal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} total={currentOrder.total} onPaymentConfirm={handlePaymentConfirm} />}
            {showCloseRegisterModal && cashDrawerSession && (
                <CloseRegisterModal
                    isOpen={showCloseRegisterModal}
                    onClose={() => setShowCloseRegisterModal(false)}
                    sessionData={{ 
                        openingCash: cashDrawerSession.openingBalance, 
                        initialTags: cashDrawerSession.initialTags, 
                        damagedTags: cashDrawerSession.damagedTags, 
                        transactions: cashDrawerSession.transacciones || [],
                        orders: cashDrawerSession.pedidos || []
                    }}
                    onEndSession={handleEndSession}
                />
            )}
            <CashMovementModal isOpen={showCashMovementModal} onClose={() => setShowCashMovementModal(false)} onSubmitTransaction={async (data) => { await createCashTransaction(data); showToast('Movimiento registrado'); fetchSession(); }} />
        </div>
    );
};

export default VentaMostrador;