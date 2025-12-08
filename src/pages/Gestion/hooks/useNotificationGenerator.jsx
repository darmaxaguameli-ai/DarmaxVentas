import { useEffect, useRef } from 'react';
import { useGestion } from '../context/GestionContext';
import { useNotification } from '../context/NotificationContext';
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
    const { inventory, expenses, loading } = state;
    
    // Usamos useRef solo para gastos, que son notificaciones de sesión única
    const notifiedExpenses = useRef(new Set());

    // Effect for low stock notifications with persistent snooze
    useEffect(() => {
        if (loading || !inventory || inventory.length === 0) return;

        const snoozedNotifications = getSnoozedNotifications();

        inventory.forEach(item => {
            const snoozeId = `low-stock-${item.id}`;
            const snoozedAt = snoozedNotifications[snoozeId];
            const isSnoozed = snoozedAt && (new Date() - new Date(snoozedAt) < NOTIFICATION_SNOOZE_PERIOD_MS);

            if (item.stock < LOW_STOCK_THRESHOLD && !isSnoozed) {
                const notification = {
                    snoozeId, // ID para "snoozear" esta notificación
                    title: 'Inventario Bajo',
                    message: `"${item.name}" tiene solo ${item.stock} unidades restantes.`,
                    type: 'warning',
                    icon: '📦'
                };
                addNotification(notification);
                toast.error(notification.message, { duration: 6000, icon: notification.icon });
                // No necesitamos añadirlo a un ref, ya que el localStorage se encarga de la persistencia
            }
        });
    }, [inventory, loading, addNotification]);

    // Effect for significant expenses (session-only notifications)
    useEffect(() => {
        if (loading || !expenses || expenses.length === 0) return;

        expenses.forEach(expense => {
            const notificationId = `significant-expense-${expense.id}`;
            const expenseDate = new Date(expense.date);
            const isRecent = (new Date() - expenseDate) / (1000 * 60 * 60 * 24) < 2;

            if (expense.amount > SIGNIFICANT_EXPENSE_THRESHOLD && isRecent && !notifiedExpenses.current.has(notificationId)) {
                const formattedAmount = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(expense.amount);
                const notification = {
                    title: 'Gasto Significativo',
                    message: `Se registró un gasto de ${formattedAmount} por "${expense.description}".`,
                    type: 'error',
                    icon: '💸'
                };
                addNotification(notification);
                toast.custom(
                    (t) => (
                      <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
                        <div className="flex-1 w-0 p-4">
                          <div className="flex items-start">
                            <div className="flex-shrink-0 pt-0.5"><span className="text-2xl">{notification.icon}</span></div>
                            <div className="ml-3 flex-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{notification.title}</p>
                              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{notification.message}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex border-l border-gray-200 dark:border-gray-700">
                          <button onClick={() => toast.dismiss(t.id)} className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-primary hover:text-primary/80 focus:outline-none focus:ring-2 focus:ring-primary">
                            Cerrar
                          </button>
                        </div>
                      </div>
                    ),
                    { duration: 10000 }
                );
                notifiedExpenses.current.add(notificationId);
            }
        });
    }, [expenses, loading, addNotification]);
    
    // The hook doesn't return anything as it just triggers side effects
};
