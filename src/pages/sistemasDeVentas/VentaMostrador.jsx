import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchOrders, updateOrder, fetchActiveCashDrawerSession, startCashDrawerSession, closeCashDrawerSession, createCashTransaction } from '@/api/apiClient'; // Import new API functions
import { formatDate, formatCurrency } from '@/utils/formatters';
import PosHeader from './PosHeader';
import Swal from 'sweetalert2';
import NewOrderFlow from './NewOrderFlow';
import StartDayModal from './StartDayModal'; // Import new modals
import PaymentModal from './PaymentModal';
import CloseRegisterModal from './CloseRegisterModal';
import CashMovementModal from './CashMovementModal'; // Import the new modal
import { useAuth } from '@/context/AuthContext'; // To get user and logout function

// Helper for non-intrusive notifications
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
            toast.addEventListener('mouseenter', Swal.stopTimer)
            toast.addEventListener('mouseleave', Swal.resumeTimer)
        }
    });
};

// --- Reusable Components ---

const statusStyles = {
    PENDIENTE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    EN_PROCESO: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    EN_RUTA: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
    ENTREGADO: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    CANCELADO: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

const StatusBadge = ({ status }) => (
    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace('_', ' ')}
    </span>
);

const OrderItem = ({ item }) => {
    const name = item.product?.name || item.jugBrandName || item.servicePrice?.name || 'Producto desconocido';
    const waterType = item.servicePrice?.waterType?.name;
    
    const displayName = waterType && item.jugBrandName ? item.jugBrandName : name;
    const serviceDescription = waterType ? `Recarga con ${waterType}` : null;

    return (
        <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
            <div>
                <p className="font-semibold text-gray-800 dark:text-gray-200">{displayName}</p>
                {serviceDescription && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {serviceDescription}
                  </p>
                )}
            </div>
            <div className="text-right flex-shrink-0 ml-4">
                <p className="font-semibold">{item.quantity} x {formatCurrency(item.price)}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Subtotal: {formatCurrency(item.quantity * item.price)}</p>
            </div>
        </div>
    );
};

// Modified OrderAccordion to trigger PaymentModal
const OrderAccordion = ({ order, onUpdateStatus, onInitiatePayment }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const handleFinalize = (e) => {
        e.stopPropagation(); // Prevent accordion toggle
        Swal.fire({
            title: '¿Confirmar entrega?',
            text: `¿Estás seguro de que quieres marcar el pedido ${order.customId} como ENTREGADO?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, confirmar',
            cancelButtonText: 'Cancelar',
          }).then((result) => {
            if (result.isConfirmed) {
                // If pickup and cash, initiate payment flow
                if (order.deliveryMethod === 'pickup' && order.paymentMethod === 'Efectivo') {
                    onInitiatePayment(order);
                } else {
                    // Otherwise, just update status
                    onUpdateStatus(order.id, 'ENTREGADO', order.paymentMethod); // Pass paymentMethod to updateOrder
                }
            }
          });
    };

    return (
        <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm transition-all border border-gray-100 dark:border-gray-700 overflow-hidden relative ${isExpanded ? 'ring-2 ring-primary/10' : 'hover:shadow-md'}`}>
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${order.status === 'PENDIENTE' ? 'bg-yellow-400' : order.status === 'EN_PROCESO' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
            
            <button className="w-full p-4 pl-5 text-left" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="flex justify-between items-start">
                    <div className='flex-grow'>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-[10px] font-bold text-gray-400 uppercase tracking-widest">#{order.customId}</span>
                            <span className="text-xs text-gray-400">• {formatDate(order.createdAt)}</span>
                        </div>
                        <p className="font-bold text-base text-gray-900 dark:text-white leading-tight">{order.cliente.name}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <p className="font-black text-lg text-primary dark:text-primary-light">{formatCurrency(order.total)}</p>
                        <StatusBadge status={order.status} />
                    </div>
                </div>
                {isExpanded && (
                    <div className="mt-2 flex justify-center">
                        <span className="material-symbols-outlined text-gray-300">expand_less</span>
                    </div>
                )}
            </button>

            {isExpanded && (
                <div className="bg-gray-50 dark:bg-gray-900/30 border-t border-gray-100 dark:border-gray-700 p-4">
                    <div className="space-y-2 mb-4">
                        {order.items.map(item => <OrderItem key={item.id} item={item} />)}
                    </div>
                    {order.status !== 'ENTREGADO' && order.status !== 'CANCELADO' && (
                         <div className="mt-4">
                            <button 
                                onClick={handleFinalize} 
                                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg shadow-green-200 dark:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined">check_circle</span>
                                Finalizar Pedido
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const OrderList = ({ orders, onUpdateStatus, onInitiatePayment }) => {
    return (
        <>
            {orders.length > 0 ? (
                <div className="space-y-4">
                    {orders.map(order => (
                        <OrderAccordion 
                            key={order.id} 
                            order={order} 
                            onUpdateStatus={onUpdateStatus} 
                            onInitiatePayment={onInitiatePayment}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center text-center py-10 px-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm h-full">
                     <span className="material-symbols-outlined text-6xl text-gray-400 dark:text-gray-500 mb-4">
                        inbox
                    </span>
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Nada por aquí</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">No hay pedidos en esta categoría.</p>
                </div>
            )}
        </>
    );
};


const PedidosDashboard = ({ orders, loading, error, onUpdateStatus, onInitiatePayment }) => {
    const [activeTab, setActiveTab] = useState('mostrador');

    const columns = useMemo(() => [
        { id: 'mostrador', title: 'Mostrador', icon: 'storefront', filter: order => order.deliveryMethod === 'pickup' && order.status !== 'ENTREGADO' && order.status !== 'CANCELADO' },
        { id: 'recoleccion', title: 'Recolección', icon: 'recycling', filter: order => order.deliveryMethod === 'home_collection' && order.status === 'PENDIENTE' },
        { id: 'entrega', title: 'Entrega', icon: 'local_shipping', filter: order => order.deliveryMethod === 'delivery' && order.status === 'EN_PROCESO' },
    ], []);

    const filteredOrdersByColumn = useMemo(() => {
        const result = {};
        columns.forEach(col => {
            result[col.id] = orders.filter(col.filter);
        });
        return result;
    }, [orders, columns]);

    if (loading) return (
        <div className="text-center p-8 flex items-center justify-center">
            <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
            Cargando pedidos...
        </div>
    );
    if (error) return <div className="text-center p-8 text-red-500">Error al cargar pedidos: {error}</div>;

    return (
        <div className="h-full flex flex-col">
            {/* Mobile Tabs (Segmented Control - Ultra Optimized for 360px) */}
            <div className="md:hidden flex bg-white dark:bg-gray-800 p-1 rounded-xl shadow-sm mb-4 border border-gray-100 dark:border-gray-700">
                {columns.map(col => (
                    <button
                        key={col.id}
                        onClick={() => setActiveTab(col.id)}
                        className={`flex-1 py-2 px-1 rounded-lg text-[10px] font-black flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 transition-all ${
                            activeTab === col.id 
                            ? 'bg-primary/10 text-primary shadow-sm' 
                            : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-400'
                        }`}
                    >
                        <span className="material-symbols-outlined text-base sm:text-lg">{col.icon}</span>
                        <span className="uppercase tracking-tighter truncate">{col.title}</span>
                        <span className={`text-[8px] px-1 rounded-full font-bold ${
                            activeTab === col.id ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                            {filteredOrdersByColumn[col.id]?.length || 0}
                        </span>
                    </button>
                ))}
            </div>

            {/* Mobile Content (Active Tab) */}
            <div className="md:hidden flex-1 overflow-y-auto pb-20">
                <OrderList
                    orders={filteredOrdersByColumn[activeTab]}
                    onUpdateStatus={onUpdateStatus}
                    onInitiatePayment={onInitiatePayment}
                />
            </div>

            {/* Desktop Grid (Original Layout) */}
            <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 h-full">
                {columns.map(col => (
                    <div key={col.id} className="bg-gray-100 dark:bg-gray-800/50 rounded-xl flex flex-col h-full border border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                            <span className="material-symbols-outlined text-gray-400">{col.icon}</span>
                            {col.title}
                            <span className="ml-auto text-xs font-bold bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-full px-2.5 py-1 shadow-sm border border-gray-200 dark:border-gray-600">
                                {filteredOrdersByColumn[col.id]?.length || 0}
                            </span>
                        </h2>
                        <div className="p-4 overflow-y-auto flex-grow custom-scrollbar">
                            <OrderList
                                orders={filteredOrdersByColumn[col.id]}
                                onUpdateStatus={onUpdateStatus}
                                onInitiatePayment={onInitiatePayment}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const VentaMostrador = () => {
    const navigate = useNavigate();
    const { logout, user } = useAuth(); // Get logout and user from AuthContext
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeView, setActiveView] = useState('dashboard'); // 'dashboard' or 'new_order'
    const prevOrderCount = useRef(0);

    // Cash Drawer State
    const [cashDrawerSession, setCashDrawerSession] = useState(null);
    const [isCashDrawerLoading, setIsCashDrawerLoading] = useState(true);
    const [showStartDayModal, setShowStartDayModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [currentOrderToProcess, setCurrentOrderToProcess] = useState(null);
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
                playNotificationSound();
                showToast('¡Nuevo pedido recibido!', 'info');

                if ("Notification" in window && Notification.permission === "granted") {
                    new Notification("¡Nuevo Pedido!", {
                        body: "Se ha registrado un nuevo pedido en el sistema.",
                        icon: "/logo_nav.ico"
                    });
                }
            }
            setOrders(fetchedOrders);
            prevOrderCount.current = fetchedOrders.length;
        } catch (err) {
            console.error("Polling error:", err.message);
        }
    }, []);

    const fetchSession = useCallback(async () => {
        setIsCashDrawerLoading(true);
        try {
            const session = await fetchActiveCashDrawerSession();
            setCashDrawerSession(session);
            if (!session) {
                setShowStartDayModal(true);
            }
        } catch (err) {
            console.error('Error fetching cash drawer session:', err);
            // Even if error, allow user to start a new session if needed
            // For now, if there's an error fetching session, assume none is open and try to start.
            // A more robust solution might handle specific error codes.
            setShowStartDayModal(true); 
        } finally {
            setIsCashDrawerLoading(false);
        }
    }, []);

    // Effect to load orders and fetch cash drawer session
    useEffect(() => {
        if (activeView === 'dashboard') {
            fetchSession(); 
            loadOrders();
        }
    }, [activeView, fetchSession, loadOrders]);

    // Polling effect
    useEffect(() => {
        if (activeView === 'dashboard') {
            const intervalId = setInterval(pollOrders, 30000); // Poll every 30 seconds
            return () => clearInterval(intervalId); // Cleanup on view change or unmount
        }
    }, [activeView, pollOrders]);

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

    const handleInitiatePayment = useCallback((order) => {
        setCurrentOrderToProcess(order);
        setShowPaymentModal(true);
    }, []);

    const handlePaymentConfirm = useCallback(async ({ amountReceived, total, change }) => {
        try {
            // Update order status to ENTREGADO, passing paymentMethod
            await updateOrder(currentOrderToProcess.id, { 
                status: 'ENTREGADO',
                paymentMethod: 'Efectivo', // Explicitly send 'Efectivo'
            });
            showToast(`Pago procesado. Cambio: ${formatCurrency(change)}`);
            setShowPaymentModal(false);
            setCurrentOrderToProcess(null);
            loadOrders(); // Refresh order list
            fetchSession(); // Refresh session to update expected balance (will re-fetch all transactions)
        } catch (err) {
            console.error('Error confirming payment:', err);
            Swal.fire('Error', `No se pudo procesar el pago: ${err.message}`, 'error');
        }
    }, [currentOrderToProcess, loadOrders, fetchSession]);


    const handleUpdateStatus = useCallback(async (orderId, status, paymentMethod = null) => {
        try {
            await updateOrder(orderId, { status, paymentMethod }); // Pass paymentMethod if relevant
            showToast('El estado del pedido ha sido actualizado.');
            loadOrders(); // Refresh the order list
        } catch (err) {
            Swal.fire('Error', `No se pudo actualizar el pedido: ${err.message}`, 'error');
        }
    }, [loadOrders]);
    
    // Function to handle logout, checking cash drawer session
    const handleLogout = useCallback(async () => {
        if (cashDrawerSession && cashDrawerSession.estado === 'ABIERTA') {
            setShowCloseRegisterModal(true);
        } else {
            const result = await Swal.fire({
                title: '¿Cerrar sesión?',
                text: "Saldrás del sistema de ventas.",
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Sí, salir',
                cancelButtonText: 'Cancelar'
            });

            if (result.isConfirmed) {
                navigate('/logout-success', { state: { name: user?.name } });
                setTimeout(() => {
                    logout();
                }, 100);
            }
        }
    }, [cashDrawerSession, logout, navigate, user]);

    const handleEndSession = useCallback(async (closingBalance) => {
        try {
            if (!cashDrawerSession) {
                throw new Error('No hay una sesión de caja activa para cerrar.');
            }
            const closedSession = await closeCashDrawerSession(closingBalance);
            setCashDrawerSession(closedSession); // Update local state to closed
            setShowCloseRegisterModal(false);
            
            // Safe Logout Sequence
            navigate('/logout-success', { state: { name: user?.name } });
            setTimeout(() => {
                logout();
            }, 100);
            
        } catch (err) {
            console.error('Error closing session:', err);
            Swal.fire('Error', `No se pudo cerrar la sesión de caja: ${err.message}`, 'error');
        }
    }, [cashDrawerSession, logout, navigate, user]);

    const handleCashMovementSubmit = useCallback(async (transactionData) => {
        try {
            await createCashTransaction(transactionData);
            showToast('Movimiento de caja registrado exitosamente.');
            fetchSession(); // Refresh session data
        } catch (err) {
            console.error('Error creating cash transaction:', err);
            Swal.fire('Error', `No se pudo registrar el movimiento: ${err.message}`, 'error');
        }
    }, [fetchSession]);

    return (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 font-display text-gray-800 dark:text-gray-200">
            <PosHeader 
                isDashboard={activeView === 'dashboard'} 
                onNewOrderClick={() => setActiveView('new_order')} 
                onDashboardClick={() => setActiveView('dashboard')}
                onLogout={handleLogout} // New prop for logout
                isCashDrawerOpen={cashDrawerSession?.estado === 'ABIERTA'} // Pass cash drawer state
                onCashMovementClick={() => setShowCashMovementModal(true)} // Pass handler to header
            />
            
            <main className="flex-grow p-4 sm:p-6 overflow-y-auto">
                {isCashDrawerLoading ? (
                    <div className="text-center p-8 flex items-center justify-center">
                        <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
                        Cargando estado de caja...
                    </div>
                ) : activeView === 'dashboard' ? (
                    <PedidosDashboard 
                        orders={orders} 
                        loading={loading} 
                        error={error} 
                        onUpdateStatus={handleUpdateStatus} 
                        onInitiatePayment={handleInitiatePayment}
                    />
                ) : (
                    <NewOrderFlow onExit={() => setActiveView('dashboard')} />
                )}
            </main>

            {/* Modals for Cash Drawer */}
            {showStartDayModal && (
                <StartDayModal onStartSession={handleStartSession} />
            )}

            {currentOrderToProcess && (
                <PaymentModal 
                    isOpen={showPaymentModal}
                    onClose={() => setShowPaymentModal(false)}
                    total={currentOrderToProcess.total}
                    onPaymentConfirm={handlePaymentConfirm}
                />
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

export default VentaMostrador;

