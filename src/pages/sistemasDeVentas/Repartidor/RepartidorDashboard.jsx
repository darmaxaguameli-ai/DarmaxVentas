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
    const { user } = useAuth(); // Get user from auth context
    const { orders, updateOrder } = useOrders(); // Get orders from context

    useEffect(() => {
        // Get driver's location
        if (navigator.geolocation) {
            const watchId = navigator.geolocation.watchPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setDriverPosition([latitude, longitude]);
                },
                (err) => {
                    console.error("Error getting location:", err);
                },
                {
                    enableHighAccuracy: true,
                }
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
            setSelectedOrder(null);
        } catch (err) {
            setError('Error al actualizar el pedido.');
            console.error(err);
        }
    };
    
    // Filter orders to show only those assigned to the current driver.
    // We will assume a user ID of 1 for the driver for now.
    const driverId = user ? user.id : 1; 
    const assignedOrders = orders.filter(o => o.delivery && o.delivery.driverId === driverId);

    return (
        <div className="flex h-screen bg-light dark:bg-dark font-display text-text-light dark:text-text-dark">
            {/* Sidebar with Orders */}
            <aside className="w-1/3 max-w-sm p-4">
                <PedidosAsignados 
                    orders={assignedOrders} 
                    onSelectOrder={handleSelectOrder}
                    selectedOrderId={selectedOrder?.id}
                />
            </aside>

            {/* Main content */}
            <main className="flex-1 flex flex-col">
                <div className="h-3/5 p-4">
                    <Mapa driverPosition={driverPosition} orders={assignedOrders} />
                </div>
                <div className="h-2/5 p-4 overflow-y-auto">
                    <DetallePedido order={selectedOrder} onUpdateOrder={handleUpdateOrder} />
                </div>
            </main>

            {error && <div className="absolute bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg">{error}</div>}
        </div>
    );
};

export default RepartidorDashboard;