import React, { createContext, useState, useContext, useEffect } from 'react';
import apiClient from '../api/apiClient'; // Importa el apiClient configurado

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe ser usado dentro de un AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        try {
            const storedUser = localStorage.getItem('user');
            const storedToken = localStorage.getItem('token');

            if (storedToken && storedUser) {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
                setToken(storedToken);
                apiClient.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
            }
        } catch (error) {
            console.error("No se pudo cargar la sesión:", error);
            localStorage.removeItem('user');
            localStorage.removeItem('token');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const syncLogout = (event) => {
            if (event.key === 'logout') {
                console.log('Detectado logout en otra pestaña, cerrando sesión local.');
                // Forzar el estado de logout en la pestaña actual
                setUser(null);
                setToken(null);
                delete apiClient.defaults.headers.common['Authorization'];
            } else if (event.key === 'token' && event.newValue) {
                console.log('Detectado login en otra pestaña, actualizando sesión local.');
                // Forzar la recarga de datos desde localStorage
                try {
                    const storedUser = localStorage.getItem('user');
                    const storedToken = localStorage.getItem('token');
                    if (storedToken && storedUser) {
                        const parsedUser = JSON.parse(storedUser);
                        setUser(parsedUser);
                        setToken(storedToken);
                        apiClient.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
                    }
                } catch (e) {
                    console.error("Error al sincronizar la sesión de login:", e);
                    logout(); // Si algo falla, cerramos sesión por seguridad
                }
            }
        };

        window.addEventListener('storage', syncLogout);

        return () => {
            window.removeEventListener('storage', syncLogout);
        };
    }, []);

    const login = async (email, password) => {
        try {
            const response = await apiClient.post('/login', { email, password });
            const { user: loggedInUser, token: receivedToken } = response.data;
            
            setUser(loggedInUser);
            setToken(receivedToken);

            // Siempre usar localStorage
            localStorage.setItem('user', JSON.stringify(loggedInUser));
            localStorage.setItem('token', receivedToken);

            apiClient.defaults.headers.common['Authorization'] = `Bearer ${receivedToken}`;

            return loggedInUser;
        } catch (error) {
            const errorMessage = error.response?.data?.error || error.message || 'Error al iniciar sesión';
            console.error("Error en el login:", errorMessage);
            throw new Error(errorMessage);
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        delete apiClient.defaults.headers.common['Authorization'];
        // Disparar el evento de logout para otras pestañas
        localStorage.setItem('logout', Date.now());
    };

    const updateUser = (newUserData) => {
        setUser(newUserData);
        // Ensure the user data exists in storage before trying to update it
        if (localStorage.getItem('user')) {
            localStorage.setItem('user', JSON.stringify(newUserData));
        }
    };

    const value = {
        user,
        token,
        isAuthenticated: !!token,
        loading,
        login,
        logout,
        updateUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

