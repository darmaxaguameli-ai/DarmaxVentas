import { useState, useEffect } from 'react';
import Mapa from './components/Mapa';
import PedidosAsignados from './components/PedidosAsignados';
import DetallePedido from './components/DetallePedido';
import { useAuth } from '../context/AuthContext';
import apiClient from '../../../api/apiClient';

const RepartidorDashboard = () => {
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [driverPosition, setDriverPosition] = useState(null);
    const [error, setError] = useState(null);
    const { user } = useAuth(); // Get user from auth context

    useEffect(() => {
        if (!user) return;

        const fetchOrders = async () => {
            try {
                // Use user.id as the driverId
                const response = await apiClient.get(`/drivers/${user.id}/orders`);
                const data = response.data;
                // Placeholder for lat/lng
                const ordersWithCoords = data.map(order => ({
                    ...order,
                    delivery: {
                        ...order.delivery,
                        lat: 19.4326 + (Math.random() - 0.5) * 0.1, // Randomize around Mexico City
                        lng: -99.1332 + (Math.random() - 0.5) * 0.1,
                    }
                }))
                setOrders(ordersWithCoords);
            } catch (err) {
                setError('No se pudieron cargar los pedidos.');
                console.error(err);
            }
        };

        fetchOrders();
    }, [user]);

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

    const handleUpdateOrder = async (orderId, updateData) => {
        try {
            const response = await apiClient.put(`/orders/${orderId}`, updateData);
            const updatedOrder = response.data;
            setOrders(prevOrders => 
                prevOrders.map(o => o.id === orderId ? updatedOrder : o)
            );
            setSelectedOrder(null);
        } catch (err) {
            setError('Error al actualizar el pedido.');
            console.error(err);
        }
    };

    return (
        <div className="flex h-screen bg-light dark:bg-dark font-display text-text-light dark:text-text-dark">
            {/* Sidebar with Orders */}
            <aside className="w-1/3 max-w-sm p-4">
                <PedidosAsignados 
                    orders={orders} 
                    onSelectOrder={handleSelectOrder}
                    selectedOrderId={selectedOrder?.id}
                />
            </aside>

            {/* Main content */}
            <main className="flex-1 flex flex-col">
                <div className="h-3/5 p-4">
                    <Mapa driverPosition={driverPosition} orders={orders} />
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
