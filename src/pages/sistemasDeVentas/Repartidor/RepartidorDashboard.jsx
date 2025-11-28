import { useState, useEffect } from 'react';
import Mapa from './components/Mapa';
import PedidosAsignados from './components/PedidosAsignados';
import DetallePedido from './components/DetallePedido';
import { useAuth } from '../hooks/useAuth';
import { useOrders } from '../hooks/useOrders';

const RepartidorDashboard = () => {
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [driverPosition, setDriverPosition] = useState(null);
    const [error, setError] = useState(null);
    const { user } = useAuth();
    const { orders, updateOrder } = useOrders();

    useEffect(() => {
        if (navigator.geolocation) {
            const watchId = navigator.geolocation.watchPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setDriverPosition([latitude, longitude]);
                },
                (err) => {
                    console.error("Error getting location:", err);
                    setError("No se pudo obtener la ubicación.");
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
            return () => navigator.geolocation.clearWatch(watchId);
        }
    }, []);

    const handleSelectOrder = (order) => {
        setSelectedOrder(order);
    };

    const handleUpdateOrder = (orderId, updateData) => {
        try {
            updateOrder(orderId, updateData);
            if (selectedOrder && selectedOrder.id === orderId) {
                setSelectedOrder(prev => ({...prev, ...updateData}));
            }
        } catch (err) {
            setError('Error al actualizar el pedido.');
            console.error(err);
        }
    };
    
    // In a real app, user.id would be used. For now, it's mocked.
    const driverId = user ? user.id : 1; 
    const assignedOrders = orders.filter(o => o.delivery && o.delivery.driverId === driverId && o.status !== 'DELIVERED');

    useEffect(() => {
        if (assignedOrders.length > 0 && !selectedOrder) {
            setSelectedOrder(assignedOrders[0]);
        }
        if (assignedOrders.length === 0) {
            setSelectedOrder(null);
        }
    }, [orders, user]);

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900 font-display text-gray-800 dark:text-gray-200">
            {/* Sidebar with Orders */}
            <aside className="w-full md:w-1/3 max-w-md flex flex-col bg-white dark:bg-gray-800 shadow-lg">
                <header className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <h1 className="text-xl font-bold">Pedidos Asignados</h1>
                    <p className="text-sm text-gray-500">{user ? `Repartidor: ${user.name || 'Admin'}` : 'Modo invitado'}</p>
                </header>
                <div className="flex-grow overflow-y-auto custom-scrollbar">
                    <PedidosAsignados 
                        orders={assignedOrders} 
                        onSelectOrder={handleSelectOrder}
                        selectedOrderId={selectedOrder?.id}
                    />
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                <div className="h-3/5 shadow-inner">
                    <Mapa 
                        driverPosition={driverPosition} 
                        orders={assignedOrders}
                        selectedOrder={selectedOrder}
                    />
                </div>
                <div className="h-2/5 p-4 overflow-y-auto bg-gray-50 dark:bg-gray-800/50">
                    <DetallePedido order={selectedOrder} onUpdateOrder={handleUpdateOrder} />
                </div>
            </main>

            {error && (
                <div className="absolute bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-xl animate-fade-in-up flex items-center gap-4">
                    <p><span className="font-bold">Error:</span> {error}</p>
                    <button onClick={() => setError(null)} className="text-xl font-bold hover:text-red-200">&times;</button>
                </div>
            )}
        </div>
    );
};

export default RepartidorDashboard;