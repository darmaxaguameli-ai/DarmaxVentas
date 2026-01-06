import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { fetchOrders, updateOrder, fetchActiveCashDrawerSession, startCashDrawerSession, closeCashDrawerSession, createCashTransaction } from '../../../api/apiClient';
import { useAuth } from '../../../context/AuthContext';
import Swal from 'sweetalert2';
import { formatCurrency } from '../../../utils/formatters';
import { MdOutlineDeliveryDining, MdHomeWork, MdDirectionsBike, MdCheckCircle, MdPendingActions, MdLocalShipping, MdMap, MdArrowBack } from 'react-icons/md';

// Componentes reutilizados
import RepartidorHeader from './components/RepartidorHeader';
import Mapa from './components/Mapa';
import DetallePedido from './components/DetallePedido';
import StartDayModal from '../StartDayModal';
import CloseRegisterModal from '../CloseRegisterModal';
import CashMovementModal from '../CashMovementModal';

// --- Helper Functions & Components ---

const showToast = (title, icon = 'success') => {
    Swal.fire({
        toast: true,
        position: 'top-end',
        icon: icon,
        title: title,
        showConfirmButton: false,
        timer: 3500,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
    });
};

const statusConfig = {
    PENDIENTE: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700', icon: MdPendingActions },
    EN_RUTA: { color: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700', icon: MdDirectionsBike },
    ENTREGADO: { color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700', icon: MdCheckCircle },
};

const StatusBadge = ({ status }) => {
    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', icon: MdPendingActions };
    const Icon = config.icon;
    return (
        <span className={`px-2.5 py-0.5 inline-flex items-center gap-1 text-xs font-medium rounded-full border ${config.color}`}>
            <Icon className="text-sm" />
            {status.replace('_', ' ')}
        </span>
    );
};

const OrderCard = ({ order, onUpdateStatus, onSelectOrder, isSelected }) => {
    const handleAction = (e, newStatus, title, text, buttonText, buttonColor) => {
        e.stopPropagation();
        Swal.fire({
            title,
            text,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: buttonColor || '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: buttonText,
            cancelButtonText: 'Cancelar',
        }).then((result) => {
            if (result.isConfirmed) {
                onUpdateStatus(order.id, { status: newStatus });
            }
        });
    };

    const clientAddress = `${order.cliente.street || ''}, ${order.cliente.neighborhood || ''}`;

    return (
        <div 
          className={`group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border cursor-pointer relative overflow-hidden ${isSelected ? 'border-primary ring-1 ring-primary' : 'border-gray-200 dark:border-gray-700'}`}
          onClick={() => onSelectOrder(order)}
        >
            {/* Left accent bar */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${order.status === 'PENDIENTE' ? 'bg-yellow-400' : order.status === 'EN_RUTA' ? 'bg-indigo-500' : 'bg-green-500'}`}></div>

            <div className="p-4 pl-5">
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-gray-500 bg-gray-100 dark:bg-gray-700 dark:text-gray-400 px-2 py-0.5 rounded">
                            #{order.customId}
                        </span>
                        <StatusBadge status={order.status} />
                    </div>
                    <p className="font-bold text-lg text-primary dark:text-primary-light whitespace-nowrap">
                        {formatCurrency(order.total)}
                    </p>
                </div>

                <div className="mb-3">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white leading-tight mb-1">{order.cliente.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-1">
                        <span className="material-symbols-outlined text-[16px] mt-0.5 text-gray-400">location_on</span>
                        <span className="line-clamp-2">{clientAddress}</span>
                    </p>
                </div>

                <div className="flex gap-2 justify-end mt-2 pt-2 border-t border-gray-100 dark:border-gray-700/50">
                    {order.status === 'PENDIENTE' && (
                        <button 
                            onClick={(e) => handleAction(e, 'EN_RUTA', '¿Iniciar Ruta?', `Mover pedido ${order.customId} a ruta`, 'Sí, en ruta', '#6366f1')}
                            className="flex-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-300 dark:hover:bg-indigo-900/40 py-2 px-3 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                        >
                            <MdDirectionsBike />
                            En Ruta
                        </button>
                    )}
                    {order.status === 'EN_RUTA' && (
                        <button 
                            onClick={(e) => handleAction(e, 'ENTREGADO', '¿Confirmar Entrega?', `Pedido ${order.customId}`, 'Sí, entregar', '#22c55e')}
                            className="flex-1 bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-900/40 py-2 px-3 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                        >
                            <MdCheckCircle />
                            Entregado
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const OrderListColumn = ({ orders, onUpdateStatus, onSelectOrder, selectedOrderId }) => (
    <div className="space-y-3 pb-20 lg:pb-0">
        {orders.length > 0 ? (
            orders.map(order => (
                <OrderCard 
                    key={order.id} 
                    order={order} 
                    onUpdateStatus={onUpdateStatus}
                    onSelectOrder={onSelectOrder}
                    isSelected={selectedOrderId === order.id}
                />
            ))
        ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-4 mb-3">
                    <MdPendingActions className="text-4xl text-gray-300 dark:text-gray-600" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-medium">No hay pedidos en esta sección</p>
            </div>
        )}
    </div>
);

const RepartidorDashboard = () => {
    // --- State Management ---
    const { user, logout } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [driverPosition, setDriverPosition] = useState(null);
    const [locationAccuracy, setLocationAccuracy] = useState(null);
    const prevOrderCount = useRef(0);

    // Mobile specific state
    const [mobileTab, setMobileTab] = useState('entrega'); // 'recoleccion', 'entrega', 'en_ruta'
    const [showMobileDetail, setShowMobileDetail] = useState(false);

    // Cash Drawer State
    const [cashDrawerSession, setCashDrawerSession] = useState(null);
    const [isCashDrawerLoading, setIsCashDrawerLoading] = useState(true);
    const [showStartDayModal, setShowStartDayModal] = useState(false);
    const [showCloseRegisterModal, setShowCloseRegisterModal] = useState(false);
    const [showCashMovementModal, setShowCashMovementModal] = useState(false);

    // --- Data Fetching ---
    const loadOrders = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const fetchedOrders = await fetchOrders();
            setOrders(fetchedOrders);
            prevOrderCount.current = fetchedOrders.length;
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const pollOrders = useCallback(async () => {
        try {
            const fetchedOrders = await fetchOrders();
            if (fetchedOrders.length > prevOrderCount.current) {
                new Audio('/sounds/notification.mp3').play();
                showToast('¡Ha llegado un nuevo pedido!', 'info');
            }
            setOrders(fetchedOrders);
            prevOrderCount.current = fetchedOrders.length;
        } catch (err) {
            console.error("Polling error:", err.message);
        }
    }, []);

    const fetchSession = useCallback(async () => {
        if (!user) return;
        setIsCashDrawerLoading(true);
        try {
            const session = await fetchActiveCashDrawerSession();
            setCashDrawerSession(session);
            if (!session) {
                setShowStartDayModal(true);
            }
        } catch (err) {
            console.error('Error fetching cash drawer session:', err);
            setShowStartDayModal(true); 
        } finally {
            setIsCashDrawerLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if(user) {
            fetchSession(); 
            loadOrders();
        }
    }, [user, fetchSession, loadOrders]);

    useEffect(() => {
        if (user) {
            const intervalId = setInterval(pollOrders, 30000);
            return () => clearInterval(intervalId);
        }
    }, [user, pollOrders]);

    useEffect(() => {
        if (navigator.geolocation) {
            const watchId = navigator.geolocation.watchPosition(
                (position) => {
                    const { latitude, longitude, accuracy } = position.coords;
                    setDriverPosition([latitude, longitude]);
                    setLocationAccuracy(accuracy);
                    if (error === "No se pudo obtener la ubicación. Revisa los permisos del navegador.") {
                        setError(null);
                    }
                },
                (err) => {
                    console.error("Error getting location:", err);
                    setError("No se pudo obtener la ubicación. Revisa los permisos del navegador.");
                },
                { enableHighAccuracy: true }
            );
            return () => navigator.geolocation.clearWatch(watchId);
        } else {
            setError("La geolocalización no es soportada por este navegador.");
        }
    }, [error]);
    
    // --- Handlers ---
    const handleLogout = useCallback(() => {
        if (cashDrawerSession && cashDrawerSession.estado === 'ABIERTA') {
            setShowCloseRegisterModal(true);
        } else {
            logout();
        }
    }, [cashDrawerSession, logout]);

    const handleStartSession = useCallback(async (amount) => {
        try {
            const newSession = await startCashDrawerSession(amount);
            setCashDrawerSession(newSession);
            setShowStartDayModal(false);
            showToast('Sesión de caja iniciada');
        } catch (err) {
            console.error('Error starting session:', err);
            Swal.fire('Error', `No se pudo iniciar la sesión: ${err.message}`, 'error');
        }
    }, []);

    const handleEndSession = useCallback(async (closingBalance) => {
        try {
            if (!cashDrawerSession) {
                throw new Error('No hay una sesión de caja activa para cerrar.');
            }
            const closedSession = await closeCashDrawerSession(closingBalance);
            setCashDrawerSession(closedSession);
            setShowCloseRegisterModal(false);
            showToast('Sesión de caja cerrada correctamente.');
            logout();
        } catch (err) {
            console.error('Error closing session:', err);
            Swal.fire('Error', `No se pudo cerrar la sesión de caja: ${err.message}`, 'error');
        }
    }, [cashDrawerSession, logout]);

    const handleCashMovementSubmit = useCallback(async (transactionData) => {
        try {
            await createCashTransaction(transactionData);
            showToast('Movimiento de caja registrado exitosamente.');
            fetchSession();
        } catch (err) {
            console.error('Error creating cash transaction:', err);
            Swal.fire('Error', `No se pudo registrar el movimiento: ${err.message}`, 'error');
        }
    }, [fetchSession]);
    
    const handleUpdateOrder = useCallback(async (orderId, updateData) => {
        try {
            await updateOrder(orderId, updateData);
            showToast(`Pedido actualizado`);
            setOrders(prevOrders => prevOrders.map(o => (o.id === orderId ? { ...o, ...updateData } : o)));
            // If completed, go back to list on mobile
            if (updateData.status === 'ENTREGADO') {
                setShowMobileDetail(false);
                setSelectedOrder(null);
            }
        } catch (err) {
            Swal.fire('Error', `No se pudo actualizar el pedido: ${err.message}`, 'error');
        }
    }, []);

    const handleOrderLocationUpdate = useCallback(async (orderId, lat, lng) => {
        const result = await Swal.fire({
            title: '¿Guardar ubicación exacta?',
            text: "Esta posición se guardará para este pedido y para futuros pedidos de este cliente.",
            icon: 'info',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, guardar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                // 1. Update Order Delivery Coords
                await updateOrder(orderId, { deliveryLat: lat, deliveryLng: lng });
                
                // 2. Update Client Profile Coords (if client exists)
                if (selectedOrder?.cliente?.id) {
                     // We need to import updateUser at the top if not imported, assuming it is or I will add it
                     // Assuming updateUser is imported from apiClient as it was in my knowledge
                     // Wait, checking imports... yes, need to ensure updateUser is imported.
                     // The context shows it's NOT imported in the file content provided above.
                     // I will handle the import in a separate step or assume I need to fix it here if I can.
                     // Since I can only replace strings, I'll assume the user will let me fix imports if broken, 
                     // OR I can try to use a generic approach if possible.
                     // Actually, I can replace the import line too if I match a larger block.
                     // But let's stick to the function first. I will add the import in a separate replace call to be safe.
                }

                showToast('Ubicación actualizada correctamente');

                // 3. Update Local State
                const updatedOrder = { 
                    ...selectedOrder, 
                    deliveryLat: lat, 
                    deliveryLng: lng,
                    cliente: {
                        ...selectedOrder.cliente,
                        lat: lat,
                        lng: lng
                    }
                };

                setSelectedOrder(updatedOrder);
                setOrders(prevOrders => prevOrders.map(o => 
                    o.id === orderId ? updatedOrder : o
                ));
                
                // Also update client coords for other orders of same client in the list? 
                // Ideally yes, but for now focusing on the current one is enough feedback.
                
                // Trigger client update separately to not block UI
                if (selectedOrder?.cliente?.id) {
                    import('../../../api/apiClient').then(({ updateUser }) => {
                        updateUser(selectedOrder.cliente.id, { lat, lng }).catch(err => console.error("Error updating client coords:", err));
                    });
                }

            } catch (err) {
                console.error("Error updating location:", err);
                Swal.fire('Error', 'No se pudo guardar la ubicación.', 'error');
            }
        }
    }, [selectedOrder]);

    const handleOrderSelect = (order) => {
        setSelectedOrder(order);
        setShowMobileDetail(true);
    };

    const driverId = user?.id;
    const allDriverOrders = useMemo(() => 
        driverId 
        ? orders.filter(o => 
            (o.deliveryMethod === 'delivery' || o.deliveryMethod === 'home_collection')
          )
        : [],
    [orders, driverId]);
    
    const pendingOrders = useMemo(() => allDriverOrders.filter(o => o.status !== 'ENTREGADO' && o.status !== 'CANCELADO'), [allDriverOrders]);

    // Derived lists
    const collectionOrders = useMemo(() => allDriverOrders.filter(o => o.deliveryMethod === 'home_collection' && o.status === 'PENDIENTE'), [allDriverOrders]);
    const deliveryOrders = useMemo(() => allDriverOrders.filter(o => o.deliveryMethod === 'delivery' && o.status === 'PENDIENTE'), [allDriverOrders]);
    const inRouteOrders = useMemo(() => allDriverOrders.filter(o => o.status === 'EN_RUTA'), [allDriverOrders]);

    const tabConfig = [
        { id: 'recoleccion', label: 'Recolección', icon: MdHomeWork, count: collectionOrders.length, data: collectionOrders, color: 'border-yellow-500' },
        { id: 'entrega', label: 'Entrega', icon: MdOutlineDeliveryDining, count: deliveryOrders.length, data: deliveryOrders, color: 'border-blue-500' },
        { id: 'en_ruta', label: 'En Ruta', icon: MdDirectionsBike, count: inRouteOrders.length, data: inRouteOrders, color: 'border-indigo-500' },
    ];

    if (loading || isCashDrawerLoading) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                <p className="text-gray-500 font-medium">Cargando tablero...</p>
            </div>
        );
    }

    return (
        <div className="flex h-screen flex-col bg-[#f8fafc] dark:bg-gray-950 font-display text-gray-800 dark:text-gray-200 overflow-hidden">
            <RepartidorHeader
                onLogout={handleLogout}
                onCashMovementClick={() => setShowCashMovementModal(true)}
                isCashDrawerOpen={cashDrawerSession?.estado === 'ABIERTA'}
                isRefreshing={loading}
                onRefresh={loadOrders}
                locationAccuracy={locationAccuracy}
            />

            <div className="flex flex-1 overflow-hidden pt-16 lg:pt-20 relative">
                
                {/* 
                   ================================================================
                   MOBILE VIEW (Standard List + Slide-over Detail)
                   ================================================================
                */}
                <div className="lg:hidden w-full h-full relative">
                    {/* List View */}
                    <div className={`w-full h-full flex flex-col transition-transform duration-300 ${showMobileDetail ? '-translate-x-full' : 'translate-x-0'}`}>
                         {/* Mobile Tabs */}
                        <div className="flex bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 overflow-x-auto hide-scrollbar sticky top-0 z-30 shadow-sm">
                            {tabConfig.map(tab => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setMobileTab(tab.id)}
                                        className={`flex-1 min-w-[30%] py-3 px-2 flex flex-col items-center justify-center gap-1 border-b-2 transition-all ${mobileTab === tab.id ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                                    >
                                        <div className="relative">
                                            <Icon className="text-xl" />
                                            {tab.count > 0 && (
                                                <span className="absolute -top-2 -right-3 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] text-center shadow-sm">
                                                    {tab.count}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-xs font-bold uppercase tracking-wider">{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                        {/* Mobile List Content */}
                        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900/50 pb-20">
                            {tabConfig.map(tab => (
                                <div key={tab.id} className={mobileTab === tab.id ? 'block' : 'hidden'}>
                                    <div className="mb-4 px-1">
                                        <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest">{tab.label} ({tab.count})</h2>
                                    </div>
                                    <OrderListColumn
                                        orders={tab.data}
                                        onUpdateStatus={handleUpdateOrder}
                                        onSelectOrder={handleOrderSelect}
                                        selectedOrderId={selectedOrder?.id}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Mobile Detail Slide-over */}
                    <div className={`absolute inset-0 bg-white dark:bg-gray-900 z-40 transition-transform duration-300 flex flex-col ${showMobileDetail ? 'translate-x-0' : 'translate-x-full'}`}>
                        <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-3 sticky top-0 z-20">
                            <button 
                                onClick={() => setShowMobileDetail(false)}
                                className="p-2 -ml-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
                            >
                                <MdArrowBack className="text-2xl" />
                            </button>
                            <div>
                                <h2 className="text-lg font-bold text-gray-800 dark:text-white">Detalle del Pedido</h2>
                                {selectedOrder && <p className="text-xs text-gray-500">#{selectedOrder.customId}</p>}
                            </div>
                        </div>
                        <div className="flex-1 flex flex-col h-full overflow-hidden">
                            <div className="h-[40%] bg-gray-100 relative">
                                <Mapa 
                                    driverPosition={driverPosition} 
                                    orders={pendingOrders}
                                    selectedOrder={selectedOrder}
                                    onOrderLocationUpdate={handleOrderLocationUpdate}
                                />
                            </div>
                            <div className="h-[60%] overflow-y-auto bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                                <DetallePedido order={selectedOrder} onUpdateOrder={handleUpdateOrder} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 
                   ================================================================
                   DESKTOP VIEW ("Command Center" Layout)
                   ================================================================
                */}
                <div className="hidden lg:flex flex-col w-full h-full overflow-hidden">
                    
                    {/* Top Section: Map + Detail (55% Height) */}
                    <div className="flex h-[55%] border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                        {/* Wide Map Area */}
                        <div className="flex-grow relative border-r border-gray-200 dark:border-gray-800">
                            <Mapa 
                                driverPosition={driverPosition} 
                                orders={pendingOrders}
                                selectedOrder={selectedOrder}
                                onOrderLocationUpdate={handleOrderLocationUpdate}
                            />
                            {/* Floating Map Legend */}
                            <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-gray-800/90 p-3 rounded-xl shadow-lg backdrop-blur-md border border-gray-100 dark:border-gray-700 flex gap-4 text-xs font-medium z-[400] pointer-events-none">
                                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500 shadow-sm"></span> Tu posición</div>
                                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-gray-500 shadow-sm"></span> Pendientes</div>
                                {selectedOrder && <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-orange-500 shadow-sm animate-pulse"></span> Selección actual</div>}
                            </div>
                        </div>

                        {/* Order Detail Side Panel */}
                        <div className="w-[400px] xl:w-[450px] flex flex-col bg-white dark:bg-gray-900 shadow-xl z-10">
                            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                                <div>
                                    <h2 className="text-base font-bold text-gray-800 dark:text-white uppercase tracking-wider">
                                        {selectedOrder ? `Pedido #${selectedOrder.customId}` : 'Gestión'}
                                    </h2>
                                    <p className="text-xs text-gray-400">
                                        {selectedOrder ? 'Detalles y Acciones' : 'Selecciona un pedido abajo'}
                                    </p>
                                </div>
                                {selectedOrder && (
                                     <span className={`w-3 h-3 rounded-full ${selectedOrder.status === 'PENDIENTE' ? 'bg-yellow-400' : selectedOrder.status === 'EN_RUTA' ? 'bg-indigo-500' : 'bg-green-500'}`}></span>
                                )}
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-gray-900">
                                <DetallePedido order={selectedOrder} onUpdateOrder={handleUpdateOrder} />
                            </div>
                        </div>
                    </div>

                    {/* Bottom Section: Kanban Columns (45% Height) */}
                    <div className="flex-1 bg-gray-50 dark:bg-gray-950 p-6 overflow-hidden min-h-0">
                        <div className="grid grid-cols-3 gap-6 h-full">
                            {tabConfig.map(col => (
                                <div key={col.id} className="flex flex-col h-full bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                                    {/* Column Header */}
                                    <div className={`p-3 border-b-2 ${col.color} flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50 sticky top-0 z-10`}>
                                        <div className="flex items-center gap-2">
                                            <col.icon className="text-lg text-gray-500 dark:text-gray-400" />
                                            <h3 className="font-bold text-gray-700 dark:text-gray-200 text-sm uppercase tracking-wide">
                                                {col.label}
                                            </h3>
                                        </div>
                                        <span className="bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-bold px-2.5 py-0.5 rounded-full border border-gray-200 dark:border-gray-600 shadow-sm">
                                            {col.count}
                                        </span>
                                    </div>
                                    {/* Scrollable List */}
                                    <div className="flex-1 overflow-y-auto p-3 custom-scrollbar space-y-3">
                                        <OrderListColumn
                                            orders={col.data}
                                            onUpdateStatus={handleUpdateOrder}
                                            onSelectOrder={handleOrderSelect}
                                            selectedOrderId={selectedOrder?.id}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

            </div>

            {/* Modals for Cash Drawer */}
            {showStartDayModal && (
                <StartDayModal onStartSession={handleStartSession} />
            )}
            {showCloseRegisterModal && cashDrawerSession && (
                <CloseRegisterModal
                    isOpen={showCloseRegisterModal}
                    onClose={() => setShowCloseRegisterModal(false)}
                    sessionData={{
                        openingCash: cashDrawerSession.openingBalance,
                        transactions: cashDrawerSession.transacciones || [], 
                    }}
                    onEndSession={handleEndSession}
                />
            )}
            <CashMovementModal
                isOpen={showCashMovementModal}
                onClose={() => setShowCashMovementModal(false)}
                onSubmitTransaction={handleCashMovementSubmit}
            />
        </div>
    );
};

export default RepartidorDashboard;