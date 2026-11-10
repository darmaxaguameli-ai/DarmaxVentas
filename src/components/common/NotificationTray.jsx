import React, { useState, useEffect, useRef } from 'react';
import { FaBell, FaCheckDouble, FaTrash, FaInfoCircle, FaCheckCircle, FaExclamationTriangle, FaTimesCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';

const NotificationTray = () => {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    const unreadCount = notifications.filter(n => !n.read).length;

    useEffect(() => {
        fetchNotifications();
        // Polling cada 60 segundos para nuevas notificaciones
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        try {
            const response = await apiClient.get('/notifications');
            setNotifications(response.data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const markAsRead = async (id) => {
        try {
            await apiClient.put(`/notifications/${id}/read`);
            setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const clearAll = async () => {
        try {
            await apiClient.delete('/notifications');
            setNotifications([]);
            setIsOpen(false);
        } catch (error) {
            console.error('Error clearing notifications:', error);
        }
    };

    const handleNotificationClick = (notification) => {
        if (!notification.read) markAsRead(notification.id);
        if (notification.link) {
            navigate(notification.link);
            setIsOpen(false);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'SUCCESS': return <FaCheckCircle className="text-emerald-500" />;
            case 'WARNING': return <FaExclamationTriangle className="text-orange-500" />;
            case 'ERROR': return <FaTimesCircle className="text-red-500" />;
            default: return <FaInfoCircle className="text-blue-500" />;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Botón flotante uniforme (Móvil y Escritorio) */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Ver notificaciones"
                className="relative group flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-gray-200/80 dark:border-gray-700/80 shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 text-gray-700 dark:text-gray-200"
            >
                <FaBell className={`text-base sm:text-lg transition-transform duration-200 group-hover:rotate-12 ${unreadCount > 0 ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex items-center justify-center rounded-full h-4 w-4 bg-red-500 text-white text-[9px] font-black shadow-xs">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden z-[100] animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-5 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                        <h3 className="font-black text-xs uppercase tracking-widest text-gray-500">Notificaciones</h3>
                        <div className="flex gap-3">
                            <button 
                                onClick={clearAll}
                                className="text-[10px] font-black uppercase text-red-500 hover:underline flex items-center gap-1"
                            >
                                <FaTrash /> Limpiar
                            </button>
                        </div>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="p-10 text-center text-gray-400 italic">
                                <p className="text-sm font-medium">No hay novedades por ahora.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                {notifications.map(n => (
                                    <div 
                                        key={n.id}
                                        onClick={() => handleNotificationClick(n)}
                                        className={`p-4 border-b dark:border-gray-700 last:border-0 cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-750 relative ${!n.read ? 'bg-primary/5 dark:bg-primary/10' : ''}`}
                                    >
                                        {!n.read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>}
                                        <div className="flex gap-3">
                                            <div className="mt-1 text-base">
                                                {n.icon ? <span className="text-lg">{n.icon}</span> : getIcon(n.type)}
                                            </div>
                                            <div className="flex-1">
                                                <p className={`text-xs font-black uppercase tracking-tight mb-0.5 ${!n.read ? 'text-gray-800 dark:text-white' : 'text-gray-500'}`}>
                                                    {n.title}
                                                </p>
                                                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight mb-2">
                                                    {n.message}
                                                </p>
                                                <p className="text-[9px] font-bold text-gray-400 uppercase">
                                                    {new Date(n.createdAt).toLocaleDateString()} • {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {notifications.length > 0 && (
                        <div className="p-3 bg-gray-50 dark:bg-gray-900/50 text-center">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Últimas actualizaciones</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationTray;
