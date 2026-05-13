import { useEffect, useRef } from 'react';
import { useGestion } from '../context/GestionContext';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../../../context/AuthContext';
import { createNotification } from '../../../api/apiClient';
import toast from 'react-hot-toast';

const LOW_STOCK_THRESHOLD = 50;
const SIGNIFICANT_EXPENSE_THRESHOLD = 5000;
const NOTIFICATION_SNOOZE_PERIOD_MS = 24 * 60 * 60 * 1000; // 24 hours

// Helper para gestionar el almacenamiento local de las notificaciones "snoozed"
const getSnoozedNotifications = () => {
    try {
        const snoozed = localStorage.getItem('snoozedNotifications');
        return snoozed ? JSON.parse(snoozed) : {};
    } catch (e) {
        console.error("Failed to parse snoozed notifications from localStorage", e);
        return {};
    }
};

export const useNotificationGenerator = () => {
    const { state } = useGestion();
    const { addNotification } = useNotification();
    const { user, hasPermission } = useAuth();
    const { inventory, expenses, loading } = state;
    
    // Usamos sessionStorage para evitar recrear notificaciones en la DB durante la misma sesión de navegador
    const sessionNotified = useRef(new Set(JSON.parse(sessionStorage.getItem('darmax_notified_db') || '[]')));

    const isAdmin = user?.role === 'ADMIN' || user?.roles?.some(r => r.name === 'ADMIN');

    // Effect for low stock notifications (ONLY ADMIN)
    useEffect(() => {
        if (loading || !inventory || inventory.length === 0 || !isAdmin) return;

        const snoozedNotifications = getSnoozedNotifications();

        inventory.forEach(async (item) => {
            const snoozeId = `low-stock-${item.id}`;
            const dbNotifId = `db-low-stock-${item.id}`;
            const snoozedAt = snoozedNotifications[snoozeId];
            const isSnoozed = snoozedAt && (new Date() - new Date(snoozedAt) < NOTIFICATION_SNOOZE_PERIOD_MS);

            if (item.stock < LOW_STOCK_THRESHOLD && !isSnoozed && !sessionNotified.current.has(dbNotifId)) {
                const notification = {
                    title: 'Inventario Bajo',
                    message: `"${item.name}" tiene solo ${item.stock} unidades restantes.`,
                    type: 'WARNING',
                    icon: '📦',
                    link: '/gestion/inventario'
                };

                try {
                    // 1. Guardar en Base de Datos (Campanita)
                    await createNotification(notification);
                    
                    // 2. Marcar como notificado en esta sesión para no duplicar en DB
                    sessionNotified.current.add(dbNotifId);
                    sessionStorage.setItem('darmax_notified_db', JSON.stringify([...sessionNotified.current]));
                    
                    // 3. (Opcional) Notificar al contexto local por si la campanita no ha hecho poll
                    addNotification({ ...notification, snoozeId });
                } catch (err) {
                    console.error("Error creating low stock notification in DB:", err);
                }
            }
        });
    }, [inventory, loading, isAdmin, addNotification]);

    // Effect for significant expenses (ONLY ADMIN)
    useEffect(() => {
        if (loading || !expenses || expenses.length === 0 || !isAdmin) return;

        expenses.forEach(async (expense) => {
            const notificationId = `significant-expense-${expense.id}`;
            const dbNotifId = `db-expense-${expense.id}`;
            const expenseDate = new Date(expense.date);
            const isRecent = (new Date() - expenseDate) / (1000 * 60 * 60 * 24) < 2;

            if (expense.amount > SIGNIFICANT_EXPENSE_THRESHOLD && isRecent && !sessionNotified.current.has(dbNotifId)) {
                const formattedAmount = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(expense.amount);
                const notification = {
                    title: 'Gasto Significativo',
                    message: `Se registró un gasto de ${formattedAmount} por "${expense.description}".`,
                    type: 'ERROR',
                    icon: '💸',
                    link: '/gestion/gastos'
                };

                try {
                    // 1. Guardar en Base de Datos (Campanita)
                    await createNotification(notification);

                    // 2. Marcar como notificado
                    sessionNotified.current.add(dbNotifId);
                    sessionStorage.setItem('darmax_notified_db', JSON.stringify([...sessionNotified.current]));

                    // 3. Notificar contexto local
                    addNotification(notification);
                } catch (err) {
                    console.error("Error creating expense notification in DB:", err);
                }
            }
        });
    }, [expenses, loading, isAdmin, addNotification]);
    
};
