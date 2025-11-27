import React, { createContext, useState } from 'react';

export const OrderContext = createContext();

export const OrderProvider = ({ children }) => {
    const [orders, setOrders] = useState([]);

    const addOrder = (order) => {
        const newOrder = {
            ...order,
            id: Date.now(), // Simple unique ID
            status: 'pending',
            delivery: {
                ...order.deliveryInfo.deliveryDetails,
                // Assign to driver 1 for simulation
                driverId: 1 
            },
            items: order.orderItems,
            total: order.total
        };
        console.log('[OrderContext] Agregando nuevo pedido de entrega:', newOrder);
        setOrders(prevOrders => [...prevOrders, newOrder]);
    };

    const updateOrder = (orderId, updateData) => {
        setOrders(prevOrders =>
            prevOrders.map(o => (o.id === orderId ? { ...o, ...updateData } : o))
        );
    };

    const value = {
        orders,
        addOrder,
        updateOrder
    };

    return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
};