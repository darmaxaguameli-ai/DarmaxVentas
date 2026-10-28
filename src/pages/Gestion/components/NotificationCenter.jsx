import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const NotificationCenter = ({ overlayOnDesktop = false }) => {
    const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotification();
    const [isOpen, setIsOpen] = useState(true);
    const navigate = useNavigate();

    const getIcon = (type) => {
        switch (type?.toLowerCase()) {
            case 'star':
            case 'praise':
            case 'felicitacion': return '⭐';
            case 'note':
            case 'blocker':
            case 'mensaje': return '📝';
            case 'calendar':
            case 'fecha': return '📅';
            case 'task':
            case 'scrum':
            case 'proyecto': return '🚀';
            case 'warning': return '⚠️';
            case 'error': return '💸'; // Mantener el ícono original para gastos
            case 'info': return 'ℹ️';
            default: return '🔔';
        }
    };

    const handleNotificationClick = (notification) => {
        markAsRead(notification.id);
        if (notification.link) {
            navigate(notification.link);
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
                <h3 className="text-lg font-semibold text-[#111418] dark:text-white flex items-center gap-2">
                    <span>Centro de Notificaciones</span>
                </h3>
                <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                        <span className="text-xs font-bold text-white bg-primary rounded-full h-5 w-5 flex items-center justify-center animate-bounce">
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
                                className="text-xs text-primary dark:text-primary-light hover:underline font-medium"
                            >
                                Marcar todas como leídas
                            </button>
                        </div>
                    )}
                    <div className="max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                        {notifications.length > 0 ? (
                            <ul className="space-y-3">
                                {notifications.map(n => (
                                    <li 
                                        key={n.id} 
                                        onClick={() => handleNotificationClick(n)}
                                        className={`relative flex items-start gap-3 p-3.5 rounded-xl transition-all cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 ${!n.isRead ? 'bg-primary/5 dark:bg-primary/20 border-l-4 border-primary' : 'border border-gray-100 dark:border-gray-700/40'}`}
                                    >
                                        <span className={`text-2xl mt-0.5 select-none ${!n.isRead ? 'animate-pulse' : ''}`}>
                                            {n.icon || getIcon(n.type)}
                                        </span>
                                        <div className="flex-grow pr-6">
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-sm text-gray-800 dark:text-gray-100">
                                                    {n.title}
                                                </p>
                                                {!n.isRead && (
                                                    <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-primary/20 text-primary dark:text-primary-light rounded-md">
                                                        Nuevo
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5 leading-relaxed">
                                                {n.message}
                                            </p>
                                            <div className="flex items-center gap-3 mt-1.5">
                                                <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">
                                                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: es })}
                                                </span>
                                                {n.link && (
                                                    <span className="text-[11px] text-primary dark:text-primary-light font-bold flex items-center gap-1 hover:underline">
                                                        Ver detalle &rarr;
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteNotification(n.id);
                                            }} 
                                            className="absolute top-2 right-2 text-gray-400 hover:text-red-500 p-1 rounded-full transition-colors"
                                            aria-label="Eliminar notificación"
                                            title="Eliminar notificación"
                                        >
                                            <span className="material-symbols-outlined text-base">close</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center py-8">
                                 <span className="text-4xl animate-pulse">🎉</span>
                                 <p className="mt-3 text-sm font-bold text-gray-700 dark:text-gray-300">¡Todo en orden!</p>
                                 <p className="text-xs text-gray-400 dark:text-gray-500">No hay notificaciones pendientes por ahora.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationCenter;
