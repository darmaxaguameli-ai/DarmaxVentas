import { useState, useEffect, useMemo, useCallback } from 'react';
import { fetchOrders, updateOrder } from '@/api/apiClient';
import { formatDate, formatCurrency } from '@/utils/formatters';
import PosHeader from './PosHeader';
import Swal from 'sweetalert2';
import NewOrderFlow from './NewOrderFlow';


const statusStyles = {
    PENDIENTE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    EN_PROCESO: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    EN_RUTA: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
    ENTREGADO: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    CANCELADO: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

const StatusBadge = ({ status }) => (
    <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace('_', ' ')}
    </span>
);

const OrderItem = ({ item }) => {
    // Prioridad para el nombre: Nombre del producto, Nombre del garrafón específico, Nombre del servicio
    const name = item.product?.name || item.jugBrandName || item.servicePrice?.name || 'Producto desconocido';
    const waterType = item.servicePrice?.waterType?.name;
    
    // Si es un servicio de recarga (tiene waterType), el nombre principal ya es el del garrafón.
    // El nombre del servicio ("Recarga") se puede añadir en la descripción.
    const displayName = waterType && item.jugBrandName ? item.jugBrandName : name;
    const serviceDescription = waterType ? `Recarga con ${waterType}` : null;

    return (
        <div className="flex items-center justify-between py-2">
            <div>
                <p className="font-semibold text-gray-800 dark:text-gray-200">{displayName}</p>
                {serviceDescription && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {serviceDescription}
                  </p>
                )}
            </div>
            <div className="text-right">
                <p className="font-semibold">{item.quantity} x {formatCurrency(item.price)}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Subtotal: {formatCurrency(item.quantity * item.price)}</p>
            </div>
        </div>
    )
};

const OrderAccordion = ({ order, onUpdateStatus }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const handleFinalize = () => {
        Swal.fire({
            title: '¿Confirmar entrega?',
            text: `¿Estás seguro de que quieres marcar el pedido ${order.customId} como ENTREGADO?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, confirmar',
            cancelButtonText: 'Cancelar',
          }).then((result) => {
            if (result.isConfirmed) {
                onUpdateStatus(order.id, 'ENTREGADO');
            }
          });
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md transition-shadow hover:shadow-lg">
            <div className="p-4 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="flex flex-wrap justify-between items-center gap-4">
                    <div>
                        <p className="font-bold text-lg text-primary">{order.customId}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{order.cliente.name}</p>
                        <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <StatusBadge status={order.status} />
                        <p className="font-bold text-xl text-gray-800 dark:text-white">{formatCurrency(order.total)}</p>
                        <span className={`material-symbols-outlined transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                            expand_more
                        </span>
                    </div>
                </div>
            </div>
            {isExpanded && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                    <div className="space-y-2 mb-4">
                        {order.items.map(item => <OrderItem key={item.id} item={item} />)}
                    </div>
                    <div className="mt-4 flex justify-end">
                        <button onClick={handleFinalize} className="btn-primary">Finalizar Pedido</button>
                    </div>
                </div>
            )}
        </div>
    );
};

const OrderList = ({ orders, title, filterFn, onUpdateStatus }) => {
    const filteredOrders = useMemo(() => orders.filter(filterFn), [orders, filterFn]);

    return (
        <div className="bg-gray-200/50 dark:bg-gray-900/50 p-4 rounded-lg">
            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">{title}</h2>
            {filteredOrders.length > 0 ? (
                <div className="space-y-4">
                    {filteredOrders.map(order => <OrderAccordion key={order.id} order={order} onUpdateStatus={onUpdateStatus} />)}
                </div>
            ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">No hay pedidos en esta categoría.</p>
            )}
        </div>
    );
};

const PedidosDashboard = ({ orders, loading, error, onUpdateStatus }) => {
    if (loading) return <div className="text-center p-8">Cargando pedidos...</div>;
    if (error) return <div className="text-center p-8 text-red-500">Error al cargar pedidos: {error}</div>;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <OrderList
                orders={orders}
                title="Pedidos en Mostrador"
                filterFn={order => order.deliveryMethod === 'pickup' && order.status !== 'ENTREGADO' && order.status !== 'CANCELADO'}
                onUpdateStatus={onUpdateStatus}
            />
            <OrderList
                orders={orders}
                title="Pedidos para Recolección"
                filterFn={order => order.deliveryMethod === 'home_collection' && order.status === 'PENDIENTE'}
                onUpdateStatus={onUpdateStatus}
            />
            <OrderList
                orders={orders}
                title="Pedidos para Entrega"
                filterFn={order => order.deliveryMethod === 'delivery' && order.status === 'EN_PROCESO'}
                onUpdateStatus={onUpdateStatus}
            />
        </div>
    );
};

const VentaMostrador = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeView, setActiveView] = useState('dashboard'); // 'dashboard' or 'new_order'

    const loadOrders = useCallback(async () => {
        try {
            setLoading(true);
            const fetchedOrders = await fetchOrders();
            setOrders(fetchedOrders);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (activeView === 'dashboard') { // Only load orders if we are in the dashboard view
            loadOrders();
        }
    }, [loadOrders, activeView]);

    const handleUpdateStatus = useCallback(async (orderId, status) => {
        try {
            await updateOrder(orderId, { status });
            Swal.fire('¡Éxito!', 'El estado del pedido ha sido actualizado.', 'success');
            await loadOrders(); // Refresh the order list
        } catch (err) {
            Swal.fire('Error', `No se pudo actualizar el pedido: ${err.message}`, 'error');
        }
    }, [loadOrders]);
    
    return (
        <div className="bg-gray-100 dark:bg-gray-900 min-h-screen font-display text-gray-800 dark:text-gray-200">
            <PosHeader 
                isDashboard={activeView === 'dashboard'} 
                onNewOrderClick={() => setActiveView('new_order')} 
                onDashboardClick={() => setActiveView('dashboard')} 
            />
            
            <main className="p-4 sm:p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Panel de Vendedor</h1>
                    <button onClick={loadOrders} className="btn-secondary" disabled={loading}>
                        {loading ? 'Cargando...' : 'Refrescar Pedidos'}
                    </button>
                </div>

                {activeView === 'dashboard' ? (
                    <PedidosDashboard orders={orders} loading={loading} error={error} onUpdateStatus={handleUpdateStatus} />
                ) : (
                    <NewOrderFlow onExit={() => setActiveView('dashboard')} />
                )}
            </main>
        </div>
    );
};

export default VentaMostrador;

