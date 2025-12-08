import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';

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

    const addNotification = useCallback((notification) => {
        const newNotification = {
            id: uuidv4(),
            isRead: false,
            createdAt: new Date(),
            ...notification, // e.g., { title, message, type: 'info' | 'warning' | 'error' }
        };
        setNotifications(prev => [newNotification, ...prev]);
    }, []);

    const markAsRead = useCallback((id) => {
        setNotifications(prev =>
            prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
        );
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
