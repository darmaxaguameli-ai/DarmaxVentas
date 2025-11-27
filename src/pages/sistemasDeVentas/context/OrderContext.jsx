import React, { createContext, useState } from 'react';

export const OrderContext = createContext({
    orders: [],
    addOrder: () => {},
    updateOrder: () => {}
});

export const OrderProvider = ({ children }) => {
    const [orders, setOrders] = useState([]);

    const addOrder = (order) => {
        const newOrder = {
            ...order,
            id: Date.now(),
            status: 'pending',
            delivery: {
                ...order.deliveryInfo.deliveryDetails,
                driverId: 1
            },
            items: order.orderItems,
            total: order.total
        };

        console.log('[OrderContext] Agregando nuevo pedido de entrega:', newOrder);

        setOrders(prev => [...prev, newOrder]);
    };

    const updateOrder = (orderId, updateData) => {
        setOrders(prev =>
            prev.map(o => (o.id === orderId ? { ...o, ...updateData } : o))
        );
    };

    return (
        <OrderContext.Provider value={{ orders, addOrder, updateOrder }}>
            {children}
        </OrderContext.Provider>
    );
};
