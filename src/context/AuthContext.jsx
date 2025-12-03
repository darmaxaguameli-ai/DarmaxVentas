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
            let storedUser = localStorage.getItem('user');
            let storedToken = localStorage.getItem('token');
            let storage = localStorage;

            if (!storedUser || !storedToken) {
                storedUser = sessionStorage.getItem('user');
                storedToken = sessionStorage.getItem('token');
                storage = sessionStorage;
            }

            if (storedToken && storedUser) {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
                setToken(storedToken);
                // Configura el token en el apiClient para las recargas de página
                apiClient.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
            }
        } catch (error) {
            console.error("No se pudo cargar la sesión:", error);
            localStorage.clear();
            sessionStorage.clear();
        } finally {
            setLoading(false);
        }
    }, []);

    const login = async (email, password, rememberMe) => {
        try {
            const response = await apiClient.post('/login', { email, password });
            const { user: loggedInUser, token: receivedToken } = response.data;
            
            setUser(loggedInUser);
            setToken(receivedToken);

            const storage = rememberMe ? localStorage : sessionStorage;
            storage.setItem('user', JSON.stringify(loggedInUser));
            storage.setItem('token', receivedToken);
            
            // Limpiar el otro storage para evitar conflictos
            (rememberMe ? sessionStorage : localStorage).clear();

            // Configurar el token en las cabeceras de apiClient para futuras peticiones
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${receivedToken}`;

            return loggedInUser;
        } catch (error) {
            console.error("Error en el login:", error.response?.data?.error || error.message);
            throw new Error(error.response?.data?.error || 'Error al iniciar sesión');
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('token');
        // Eliminar el token de las cabeceras de apiClient
        delete apiClient.defaults.headers.common['Authorization'];
    };

    const updateUser = (newUserData) => {
        setUser(newUserData);
        if (localStorage.getItem('user')) {
            localStorage.setItem('user', JSON.stringify(newUserData));
        } else if (sessionStorage.getItem('user')) {
            sessionStorage.setItem('user', JSON.stringify(newUserData));
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

