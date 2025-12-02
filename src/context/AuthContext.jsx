import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

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
    const [loading, setLoading] = useState(true); // Para saber si se está verificando la sesión

    useEffect(() => {
        // Intentar cargar el usuario desde localStorage primero, luego sessionStorage
        try {
            let storedUser = localStorage.getItem('user');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            } else {
                storedUser = sessionStorage.getItem('user');
                if (storedUser) {
                    setUser(JSON.parse(storedUser));
                }
            }
        } catch (error) {
            console.error("No se pudo cargar el usuario de la sesión:", error);
            localStorage.removeItem('user');
            sessionStorage.removeItem('user');
        } finally {
            setLoading(false);
        }
    }, []);

    const login = async (email, password, rememberMe) => { // Added rememberMe parameter
        try {
            const response = await axios.post('/api/login', { email, password });
            const loggedInUser = response.data;
            
            setUser(loggedInUser);
            if (rememberMe) {
                localStorage.setItem('user', JSON.stringify(loggedInUser));
                sessionStorage.removeItem('user'); // Ensure sessionStorage is clear if localStorage is used
            } else {
                sessionStorage.setItem('user', JSON.stringify(loggedInUser));
                localStorage.removeItem('user'); // Ensure localStorage is clear if sessionStorage is used
            }
            
            return loggedInUser;
        } catch (error) {
            console.error("Error en el login:", error.response?.data?.error || error.message);
            // Propagar el error para que el componente de login pueda manejarlo
            throw new Error(error.response?.data?.error || 'Error al iniciar sesión');
        }
    };

    const logout = () => {
        setUser(null);
        sessionStorage.removeItem('user');
        localStorage.removeItem('user'); // Clear from localStorage as well
    };

    const value = {
        user,
        isAuthenticated: !!user,
        loading,
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
