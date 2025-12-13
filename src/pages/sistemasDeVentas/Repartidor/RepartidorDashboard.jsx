import { useState, useEffect, useMemo, useCallback } from 'react';
import { fetchOrders, updateOrder, fetchActiveCashDrawerSession, startCashDrawerSession, closeCashDrawerSession, createCashTransaction } from '../../../api/apiClient';
import { useAuth } from '../../../context/AuthContext';
import Swal from 'sweetalert2';
import { formatCurrency, formatDate } from '../../../utils/formatters';

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

const statusStyles = {
    PENDIENTE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    EN_RUTA: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
    ENTREGADO: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
};

const StatusBadge = ({ status }) => (
    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace('_', ' ')}
    </span>
);

const RepartidorOrderAccordion = ({ order, onUpdateStatus, onSelectOrder, isSelected }) => {
    const handleAction = (e, newStatus, title, text, buttonText) => {
        e.stopPropagation();
        Swal.fire({
            title,
            text,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: buttonText,
            cancelButtonText: 'Cancelar',
        }).then((result) => {
            if (result.isConfirmed) {
                onUpdateStatus(order.id, newStatus);
            }
        });
    };

    const clientAddress = `${order.cliente.street || ''}, ${order.cliente.neighborhood || ''}`;

    return (
        <div 
          className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md cursor-pointer ${isSelected ? 'border-2 border-primary' : 'border border-transparent'}`}
          onClick={() => onSelectOrder(order)}
        >
            <div className="p-4">
                <div className="flex justify-between items-start gap-3">
                    <div className="flex-grow">
                        <p className="font-bold text-primary-dark dark:text-primary-light">{order.customId}</p>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{order.cliente.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{clientAddress}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <StatusBadge status={order.status} />
                        <p className="font-bold text-lg text-gray-800 dark:text-white">{formatCurrency(order.total)}</p>
                    </div>
                </div>
                <div className="mt-4 flex gap-2 justify-end">
                    {order.status === 'PENDIENTE' && (
                        <button 
                            onClick={(e) => handleAction(e, 'EN_RUTA', '¿Marcar como En Ruta?', `Pedido ${order.customId}`, 'Sí, en ruta')}
                            className="btn-secondary btn-sm"
                        >
                            En Ruta
                        </button>
                    )}
                    {order.status === 'EN_RUTA' && (
                        <button 
                            onClick={(e) => handleAction(e, 'ENTREGADO', '¿Confirmar Entrega?', `Pedido ${order.customId}`, 'Sí, entregar')}
                            className="btn-success btn-sm"
                        >
                            Entregado
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const OrderListColumn = ({ orders, onUpdateStatus, onSelectOrder, selectedOrderId }) => (
    <div className="space-y-3">
        {orders.length > 0 ? (
            orders.map(order => (
                <RepartidorOrderAccordion 
                    key={order.id} 
                    order={order} 
                    onUpdateStatus={onUpdateStatus}
                    onSelectOrder={onSelectOrder}
                    isSelected={selectedOrderId === order.id}
                />
            ))
        ) : (
            <div className="text-center py-10 px-4 text-sm text-gray-500">
                <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2">inbox</span>
                <p>Nada por aquí</p>
            </div>
        )}
    </div>
);

const RepartidorOrderColumns = ({ orders, onUpdateStatus, onSelectOrder, selectedOrderId }) => {
    const columns = useMemo(() => [
        { id: 'recoleccion', title: 'Para Recolección', filter: o => o.deliveryMethod === 'home_collection' && o.status === 'PENDIENTE' },
        { id: 'entrega', title: 'Para Entrega', filter: o => o.deliveryMethod === 'delivery' && o.status === 'PENDIENTE' },
        { id: 'en_ruta', title: 'En Ruta', filter: o => o.status === 'EN_RUTA' },
    ], []);

    const filteredOrders = useMemo(() => {
        const result = {};
        columns.forEach(col => {
            result[col.id] = orders.filter(col.filter);
        });
        return result;
    }, [orders, columns]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 h-full">
            {columns.map(col => (
                <div key={col.id} className="bg-gray-100 dark:bg-gray-800/50 rounded-xl flex flex-col h-full">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white p-3 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-gray-100 dark:bg-gray-800/50">
                        {col.title}
                        <span className="ml-2 text-xs font-semibold bg-primary text-white rounded-full px-2 py-0.5">
                            {filteredOrders[col.id]?.length || 0}
                        </span>
                    </h2>
                    <div className="overflow-y-auto flex-grow p-1">
                        <OrderListColumn
                            orders={filteredOrders[col.id]}
                            onUpdateStatus={onUpdateStatus}
                            onSelectOrder={onSelectOrder}
                            selectedOrderId={selectedOrderId}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
};


const RepartidorDashboard = () => {
    // --- State Management ---
    const { user, logout } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [driverPosition, setDriverPosition] = useState(null);
    const [view, setView] = useState('columns'); // 'columns' or 'map'

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
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
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

    // Geolocation
    useEffect(() => {
        if (navigator.geolocation) {
            const watchId = navigator.geolocation.watchPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setDriverPosition([latitude, longitude]);
                    if (error === "No se pudo obtener la ubicación. Revisa los permisos del navegador.") {
                        setError(null); // Limpiar error si se recupera el permiso
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
            setCashDrawerSession(closedSession); // Update local state to closed
            setShowCloseRegisterModal(false);
            showToast('Sesión de caja cerrada correctamente.');
            logout(); // Now perform logout
        } catch (err) {
            console.error('Error closing session:', err);
            Swal.fire('Error', `No se pudo cerrar la sesión de caja: ${err.message}`, 'error');
        }
    }, [cashDrawerSession, logout]);

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
    
    const handleUpdateOrder = useCallback(async (orderId, status) => {
        try {
            await updateOrder(orderId, { status });
            showToast(`Pedido actualizado`);
            setOrders(prevOrders => prevOrders.map(o => o.id === orderId ? {...o, status} : o));
        } catch (err) {
            Swal.fire('Error', `No se pudo actualizar el pedido: ${err.message}`, 'error');
        }
    }, []);

    const driverId = user?.id;
    const allDriverOrders = useMemo(() => 
        driverId 
        ? orders.filter(o => 
            (o.deliveryMethod === 'delivery' || o.deliveryMethod === 'home_collection')
          )
        : [],
    [orders, driverId]);
    
    const pendingOrders = useMemo(() => allDriverOrders.filter(o => o.status !== 'ENTREGADO' && o.status !== 'CANCELADO'), [allDriverOrders]);

    // Auto-select first order
    useEffect(() => {
        if (pendingOrders.length > 0 && !selectedOrder) {
            setSelectedOrder(pendingOrders[0]);
        }
        if (pendingOrders.length === 0) {
            setSelectedOrder(null);
        }
    }, [pendingOrders, selectedOrder]);

    if (loading || isCashDrawerLoading) {
        return <div className="h-screen w-full flex items-center justify-center">Cargando...</div>
    }

    return (
        <div className="flex h-screen flex-col bg-gray-100 dark:bg-gray-900 font-display text-gray-800 dark:text-gray-200">
            <RepartidorHeader
                onLogout={handleLogout}
                onCashMovementClick={() => setShowCashMovementModal(true)}
                isCashDrawerOpen={cashDrawerSession?.estado === 'ABIERTA'}
                isRefreshing={loading}
                onRefresh={loadOrders}
            />

            <div className="flex flex-1 overflow-hidden pt-20">
                <div className="w-full lg:w-2/3 flex flex-col overflow-y-auto">
                    <RepartidorOrderColumns
                        orders={allDriverOrders}
                        onUpdateStatus={handleUpdateOrder}
                        onSelectOrder={setSelectedOrder}
                        selectedOrderId={selectedOrder?.id}
                    />
                </div>
                
                <div className="hidden lg:flex w-1/3 flex-col">
                    <div className="h-1/2">
                        <Mapa 
                            driverPosition={driverPosition} 
                            orders={pendingOrders}
                            selectedOrder={selectedOrder}
                        />
                    </div>
                    <div className="h-1/2 p-2 overflow-y-auto bg-gray-50 dark:bg-gray-800/50">
                        <DetallePedido order={selectedOrder} onUpdateOrder={handleUpdateOrder} />
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