import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import apiClient from '../../../api/apiClient';

const NotificationContext = createContext(null);

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);

    // Cargar notificaciones persistentes de la base de datos al inicio
    useEffect(() => {
        const fetchDbNotifications = async () => {
            try {
                const response = await apiClient.get('/notifications');
                if (Array.isArray(response.data)) {
                    const dbNotes = response.data.map(item => ({
                        id: item.id,
                        title: item.title,
                        message: item.message,
                        type: item.type?.toLowerCase() || 'info',
                        icon: item.icon,
                        link: item.link,
                        isRead: item.read ?? false,
                        createdAt: item.createdAt || new Date()
                    }));
                    setNotifications(prev => {
                        const existingIds = new Set(prev.map(p => p.id));
                        const fresh = dbNotes.filter(n => !existingIds.has(n.id));
                        return [...prev, ...fresh];
                    });
                }
            } catch (err) {
                // Modo silencioso si no está logueado o endpoint offline
            }
        };
        fetchDbNotifications();
    }, []);

    const addNotification = useCallback((notification) => {
        const newNotification = {
            id: uuidv4(),
            isRead: false,
            createdAt: new Date(),
            ...notification, // e.g., { title, message, type: 'info' | 'warning' | 'error' | 'star' | 'task' | 'note' }
        };
        setNotifications(prev => [newNotification, ...prev]);
    }, []);

    const markAsRead = useCallback((id) => {
        setNotifications(prev =>
            prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
        );
        apiClient.put(`/notifications/${id}/read`).catch(() => {});
    }, []);

    const markAllAsRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    }, []);

    const deleteNotification = useCallback((id) => {
        setNotifications(prev => {
            const notificationToDelete = prev.find(n => n.id === id);
            
            // Si la notificación tiene un snoozeId, la guardamos en localStorage
            if (notificationToDelete && notificationToDelete.snoozeId) {
                try {
                    const snoozed = JSON.parse(localStorage.getItem('snoozedNotifications') || '{}');
                    snoozed[notificationToDelete.snoozeId] = new Date().toISOString();
                    localStorage.setItem('snoozedNotifications', JSON.stringify(snoozed));
                } catch (e) {
                    console.error("Failed to update snoozed notifications in localStorage", e);
                }
            }
            
            return prev.filter(n => n.id !== id);
        });
    }, []);

    const unreadCount = useMemo(() => {
        return notifications.filter(n => !n.isRead).length;
    }, [notifications]);
    
    const value = {
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};
