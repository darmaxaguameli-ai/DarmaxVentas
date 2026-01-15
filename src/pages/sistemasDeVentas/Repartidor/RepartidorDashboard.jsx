import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom'; // Importar useNavigate
import { fetchOrders, updateOrder, fetchActiveCashDrawerSession, startCashDrawerSession, closeCashDrawerSession, createCashTransaction, reportDamagedTags } from '../../../api/apiClient';
import { useAuth } from '../../../context/AuthContext';
import Swal from 'sweetalert2';
import { formatCurrency } from '../../../utils/formatters';
import { MdOutlineDeliveryDining, MdHomeWork, MdDirectionsBike, MdCheckCircle, MdPendingActions, MdLocalShipping, MdMap, MdArrowBack, MdPhone, MdNavigation } from 'react-icons/md';

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
    
    // Logic to get best coordinates (Delivery specific -> Client default)
    const getBestCoords = () => {
        const dLat = parseFloat(order.deliveryLat);
        const dLng = parseFloat(order.deliveryLng);
        if (Number.isFinite(dLat) && Number.isFinite(dLng) && dLat !== 0) return [dLat, dLng];
        
        const cLat = parseFloat(order.cliente.lat);
        const cLng = parseFloat(order.cliente.lng);
        if (Number.isFinite(cLat) && Number.isFinite(cLng) && cLat !== 0) return [cLat, cLng];
        
        return null;
    };

    const coords = getBestCoords();
    // Use 'dir' (Directions) for coordinates to start navigation immediately, matching the "Route" behavior
    // Use 'search' for address fallback
    const mapUrl = coords 
        ? `https://www.google.com/maps/dir/?api=1&destination=${coords[0]},${coords[1]}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clientAddress)}`;

    return (
        <div 
          className={`group bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border cursor-pointer relative overflow-hidden ${isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-gray-100 dark:border-gray-700'}`}
          onClick={() => onSelectOrder(order)}
        >
            {/* Left accent bar */}
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${order.status === 'PENDIENTE' ? 'bg-yellow-400' : order.status === 'EN_RUTA' ? 'bg-indigo-500' : 'bg-green-500'}`}></div>

            <div className="p-5 pl-6">
                <div className="flex justify-between items-start mb-3">
                    <div className="flex flex-col gap-1">
                        <span className="font-mono text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            Pedido #{order.customId}
                        </span>
                        <h3 className="text-lg font-black text-gray-900 dark:text-white leading-tight">{order.cliente.name}</h3>
                    </div>
                    <p className="font-bold text-xl text-primary dark:text-primary-light whitespace-nowrap bg-primary/5 px-2 py-1 rounded-lg">
                        {formatCurrency(order.total)}
                    </p>
                </div>

                <div className="mb-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300 flex items-start gap-2 bg-gray-50 dark:bg-gray-700/30 p-2.5 rounded-lg border border-gray-100 dark:border-gray-700">
                        <span className="material-symbols-outlined text-lg text-primary mt-0.5">location_on</span>
                        <span className="line-clamp-2 font-medium">{clientAddress}</span>
                    </p>
                </div>

                <div className="flex gap-3 items-center pt-2">
                    {/* Quick Actions (Call / Map) */}
                    <div className="flex gap-2">
                        {order.cliente.phone && (
                            <a 
                                href={`tel:${order.cliente.phone}`}
                                onClick={(e) => e.stopPropagation()}
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors border border-gray-200 dark:border-gray-600"
                            >
                                <MdPhone className="text-xl" />
                            </a>
                        )}
                        <a 
                            href={mapUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors border border-blue-100 dark:border-blue-800"
                        >
                            <MdNavigation className="text-xl" />
                        </a>
                    </div>

                    {/* Status Action Button (Primary) */}
                    <div className="flex-1">
                        {order.status === 'PENDIENTE' && (
                            <button 
                                onClick={(e) => handleAction(e, 'EN_RUTA', '¿Iniciar Ruta?', `Mover pedido ${order.customId} a ruta`, 'Sí, en ruta', '#6366f1')}
                                className="w-full bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none py-2.5 px-4 rounded-xl text-sm font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <MdDirectionsBike className="text-lg" />
                                Iniciar Ruta
                            </button>
                        )}
                        {order.status === 'EN_RUTA' && (
                            <div className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-center border-2 border-indigo-100 text-indigo-600 dark:border-indigo-900/30 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/10">
                                En curso • Toca para finalizar
                            </div>
                        )}
                    </div>
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
    const navigate = useNavigate();
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

    // --- Notification Setup ---
    useEffect(() => {
        if ("Notification" in window && Notification.permission !== "granted") {
            Notification.requestPermission();
        }
    }, []);

    const playNotificationSound = () => {
        const audio = new Audio('/sounds/notification.mp3');
        audio.play().catch(e => console.log("Audio autoplay blocked until user interaction:", e));
    };

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
                // 1. Sonido
                playNotificationSound();
                
                // 2. Toast en App
                showToast('¡Ha llegado un nuevo pedido!', 'info');

                // 3. Notificación Nativa (Sistema)
                if ("Notification" in window && Notification.permission === "granted") {
                    try {
                        // Service Worker registration is ideal for mobile, but simple Notification API works if app is open/minimized in some browsers
                        new Notification("¡Nuevo Pedido en Darmax!", {
                            body: "Tienes una nueva entrega asignada.",
                            icon: "/logo_nav.ico",
                            vibrate: [200, 100, 200]
                        });
                    } catch (e) {
                        console.error("Notification error:", e);
                    }
                }
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
            const intervalId = setInterval(pollOrders, 4000);
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
    const handleLogout = useCallback(async () => {
        // 1. Obtener datos frescos de la sesión antes de decidir
        let currentSession = cashDrawerSession;
        try {
            const freshSession = await fetchActiveCashDrawerSession();
            setCashDrawerSession(freshSession);
            currentSession = freshSession;
        } catch (err) {
            console.error("Error refreshing session on logout:", err);
        }

        // 2. Si hay sesión abierta, mostrar modal de cierre con datos actualizados
        if (currentSession && currentSession.estado === 'ABIERTA') {
            setShowCloseRegisterModal(true);
        } else {
            const result = await Swal.fire({
                title: '¿Cerrar sesión?',
                text: "Saldrás del sistema.",
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Sí, salir',
                cancelButtonText: 'Cancelar'
            });

            if (result.isConfirmed) {
                navigate('/logout-success', { state: { name: user?.name } });
                setTimeout(() => logout(), 100);
            }
        }
    }, [cashDrawerSession, logout, navigate, user]);

    const handleStartSession = useCallback(async (amount, initialTags) => {
        try {
            const newSession = await startCashDrawerSession(amount, initialTags);
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
            
            // Safe Logout Sequence
            navigate('/logout-success', { state: { name: user?.name } });
            setTimeout(() => logout(), 100);
            
        } catch (err) {
            console.error('Error closing session:', err);
            Swal.fire('Error', `No se pudo cerrar la sesión de caja: ${err.message}`, 'error');
        }
    }, [cashDrawerSession, logout, navigate, user]);

    const handleCashMovementSubmit = useCallback(async (transactionData) => {
        try {
            // Enforce "Gasolina" context for drivers on withdrawals/expenses
            let finalTransactionData = { ...transactionData };
            if (transactionData.type === 'RETIRO') {
                finalTransactionData.description = `Pago de gasolina: ${transactionData.description}`;
            }

            await createCashTransaction(finalTransactionData);
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
            
            // Si se completa la entrega, actualizamos la sesión de caja para reflejar la venta
            if (updateData.status === 'ENTREGADO') {
                fetchSession(); 
                setShowMobileDetail(false);
                setSelectedOrder(null);
            }
        } catch (err) {
            Swal.fire('Error', `No se pudo actualizar el pedido: ${err.message}`, 'error');
        }
    }, [fetchSession]);

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
            <div className={showMobileDetail ? 'hidden lg:block' : ''}>
                <RepartidorHeader
                    onLogout={handleLogout}
                    onCashMovementClick={() => setShowCashMovementModal(true)}
                    isCashDrawerOpen={cashDrawerSession?.estado === 'ABIERTA'}
                    isRefreshing={loading}
                    onRefresh={loadOrders}
                    locationAccuracy={locationAccuracy}
                />
            </div>

            <div className={`flex flex-1 overflow-hidden relative transition-all duration-300 ${showMobileDetail ? 'pt-0 lg:pt-20' : 'pt-14 lg:pt-20'}`}>
                
                {/* 
                   ================================================================
                   MOBILE VIEW (Standard List + Slide-over Detail)
                   ================================================================
                */}
                <div className="lg:hidden w-full h-full relative">
                    {/* List View */}
                    <div className={`w-full h-full flex flex-col transition-transform duration-300 ${showMobileDetail ? '-translate-x-full' : 'translate-x-0'}`}>
                         {/* Mobile Tabs (Segmented Control - Responsive) */}
                        <div className="bg-white dark:bg-gray-900 pt-2 px-2 pb-2 z-30 sticky top-0 border-b border-gray-100 dark:border-gray-800">
                            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl shadow-inner overflow-x-auto hide-scrollbar">
                                {tabConfig.map(tab => {
                                    const Icon = tab.icon;
                                    const isActive = mobileTab === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setMobileTab(tab.id)}
                                            className={`flex-1 min-w-[30%] sm:min-w-fit py-2 px-1 sm:px-3 rounded-lg flex items-center justify-center gap-1 sm:gap-2 text-[11px] sm:text-sm font-bold transition-all duration-200 whitespace-nowrap ${
                                                isActive 
                                                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/5' 
                                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                            }`}
                                        >
                                            <Icon className={`text-[20px] sm:text-xl flex-shrink-0 ${isActive ? 'text-primary' : ''}`} />
                                            <span className="truncate">{tab.label}</span>
                                            {tab.count > 0 && (
                                                <span className={`ml-0.5 text-[9px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-primary/10 text-primary' : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'}`}>
                                                    {tab.count}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
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
                            <div className="h-[55%] bg-gray-100 relative">
                                <Mapa 
                                    driverPosition={driverPosition} 
                                    orders={pendingOrders}
                                    selectedOrder={selectedOrder}
                                    onOrderLocationUpdate={handleOrderLocationUpdate}
                                />
                            </div>
                            <div className="h-[45%] overflow-y-auto bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
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
                <StartDayModal onStartSession={handleStartSession} hideTags={true} />
            )}
            {showCloseRegisterModal && cashDrawerSession && (
                <CloseRegisterModal
                    isOpen={showCloseRegisterModal}
                    onClose={() => setShowCloseRegisterModal(false)}
                    sessionData={{
                        openingCash: cashDrawerSession.openingBalance,
                        initialTags: cashDrawerSession.initialTags,
                        damagedTags: cashDrawerSession.damagedTags,
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

export default RepartidorDashboard;