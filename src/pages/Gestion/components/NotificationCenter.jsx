import React, { useState } from 'react';
import { useNotification } from '../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const NotificationCenter = ({ overlayOnDesktop = false }) => {
    const { notifications, unreadCount, markAllAsRead, deleteNotification } = useNotification();
    const [isOpen, setIsOpen] = useState(true);

    const getIcon = (type) => {
        switch (type) {
            case 'warning': return '⚠️';
            case 'error': return '💸'; // Mantener el ícono original para gastos
            case 'info': return 'ℹ️';
            default: return '🔔';
        }
    };

    // Construir clases condicionales para el modo "overlay"
    const contentClasses = [
        "px-6 pb-6 animate-fade-in",
        overlayOnDesktop 
            ? "lg:absolute lg:w-full lg:z-20 lg:top-full lg:mt-2 lg:bg-white lg:dark:bg-gray-800 lg:rounded-b-2xl lg:shadow-xl lg:border lg:border-gray-200 lg:dark:border-gray-700" 
            : ""
    ].join(" ");

    return (
        <div className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg transition-all duration-300 ${isOpen && overlayOnDesktop ? 'rounded-b-none' : ''}`}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex justify-between items-center w-full p-6 text-left"
            >
                <h3 className="text-lg font-semibold text-[#111418] dark:text-white">Centro de Notificaciones</h3>
                <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                        <span className="text-xs font-bold text-white bg-primary rounded-full h-5 w-5 flex items-center justify-center">
                            {unreadCount}
                        </span>
                    )}
                    <span className={`material-symbols-outlined transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                        expand_more
                    </span>
                </div>
            </button>
            
            {isOpen && (
                <div className={contentClasses}>
                    {unreadCount > 0 && (
                        <div className="flex justify-end mb-2">
                            <button 
                                onClick={markAllAsRead}
                                className="text-xs text-primary dark:text-primary-light hover:underline"
                            >
                                Marcar todas como leídas
                            </button>
                        </div>
                    )}
                    <div className="max-h-96 overflow-y-auto pr-2">
                        {notifications.length > 0 ? (
                            <ul className="space-y-4">
                                {notifications.map(n => (
                                    <li key={n.id} className={`relative flex items-start gap-3 p-3 rounded-lg transition-colors ${!n.isRead ? 'bg-primary/10 dark:bg-primary/20' : ''}`}>
                                        <span className={`text-xl mt-0.5 ${!n.isRead ? 'animate-pulse' : ''}`}>{n.icon || getIcon(n.type)}</span>
                                        <div className="flex-grow">
                                            <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">{n.title}</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">{n.message}</p>
                                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                                {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: es })}
                                            </p>
                                        </div>
                                        <button 
                                            onClick={() => deleteNotification(n.id)} 
                                            className="absolute top-1 right-1 text-gray-400 hover:text-red-500 p-1 rounded-full transition-colors"
                                            aria-label="Eliminar notificación"
                                        >
                                            <span className="material-symbols-outlined text-base">close</span>
                                        </button>
                                        {!n.isRead && <div className="w-2.5 h-2.5 bg-primary rounded-full flex-shrink-0 mt-1.5"></div>}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center py-8">
                                 <span className="text-4xl">🎉</span>
                                 <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">¡Todo en orden!</p>
                                 <p className="text-xs text-gray-400 dark:text-gray-500">No hay notificaciones nuevas.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationCenter;
