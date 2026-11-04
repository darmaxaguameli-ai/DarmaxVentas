import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
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

    // Función de utilidad para verificar permisos de forma sencilla en cualquier componente
    const hasPermission = useCallback((permissionName) => {
        if (!user) return false;
        
        // 1. Verificación de SUPERUSUARIO (ADMIN)
        const isAdmin = user.roles?.some(r => r.name === 'ADMIN') || user.role === 'ADMIN';
        if (isAdmin) return true;
        
        // 2. Verificación Dinámica por Permisos del Usuario (tabla Permiso)
        if (user.permisos && Array.isArray(user.permisos)) {
            if (user.permisos.some(p => p.codigo === permissionName || p.id === permissionName)) {
                return true;
            }
        }

        // 3. Verificación Dinámica por Permisos de los Roles (tabla RolePermisos)
        if (user.roles && user.roles.length > 0) {
            const hasDynamicPerm = user.roles.some(role => 
                Array.isArray(role.permisos) && role.permisos.some(p => p.codigo === permissionName || p.id === permissionName)
            );
            if (hasDynamicPerm) return true;

            // Verificación por booleano en el rol (RBAC v2 legado)
            const hasLegacyBoolean = user.roles.some(role => role[permissionName] === true);
            if (hasLegacyBoolean) return true;
        }

        // 4. Mapeo de compatibilidad bidireccional (Sistemas y otros)
        if (permissionName === 'acceso.sistemas') {
            const hasLegacySistemas = user.roles?.some(r => r.canAccessSistemas || r.canManageSistemas) ||
                                     user.canAccessSistemas || user.canManageSistemas;
            if (hasLegacySistemas) return true;
        }
        if (permissionName === 'canAccessSistemas' || permissionName === 'canManageSistemas') {
            const hasCodeSistemas = user.permisos?.some(p => p.codigo === 'acceso.sistemas') ||
                                    user.roles?.some(r => r.permisos?.some(p => p.codigo === 'acceso.sistemas'));
            if (hasCodeSistemas) return true;
        }

        // 5. Fallback: buscar en el rol legacy si existiera
        if (user.roleRelation && typeof user.roleRelation[permissionName] === 'boolean') {
            return user.roleRelation[permissionName];
        }

        // 6. Fallback final: buscar directamente en el objeto user
        if (typeof user[permissionName] === 'boolean') {
            return user[permissionName];
        }
        
        return false;
    }, [user]);

    // Nueva función para verificar acceso a módulos de forma inteligente
    const hasModuleAccess = useCallback((moduleName) => {
        if (!user) return false;

        switch (moduleName) {
            case 'management':
                // Acceso a Gestión si tiene el permiso maestro O cualquier permiso de sub-módulo
                return hasPermission('canAccessManagement') || 
                       hasPermission('canViewSummary') ||
                       hasPermission('canAccessInventory') ||
                       hasPermission('canAccessRH') ||
                       hasPermission('canAccessFinances') ||
                       hasPermission('canAccessConfig') ||
                       hasPermission('canAccessQuotes') ||
                       hasPermission('canAccessLeads') ||
                       hasPermission('canAccessLegal') ||
                       hasPermission('canAccessInstallation') ||
                       hasPermission('canAccessMarketing') ||
                       hasPermission('canAccessSistemas') ||
                       hasPermission('canManageSistemas');
            case 'pos':
                return hasPermission('canAccessPOS');
            case 'delivery':
                return hasPermission('canAccessDelivery');
            case 'orders':
                return hasPermission('canAccessOrders') || user.type === 'CLIENTE';
            default:
                return false;
        }
    }, [user, hasPermission]);

    const logout = useCallback(() => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        delete apiClient.defaults.headers.common['Authorization'];
        localStorage.setItem('logout', Date.now());
    }, []);

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
        const handleAuthError = (event) => {
            console.warn('Error de autenticación (401/403) detectado, cerrando sesión...', event.detail?.message);
            logout();
            // Redirigir al login si no estamos ya ahí
            if (window.location.pathname !== '/login') {
                window.location.href = '/login?expired=true';
            }
        };

        window.addEventListener('auth-error', handleAuthError);
        return () => window.removeEventListener('auth-error', handleAuthError);
    }, [logout]);

    useEffect(() => {
        const syncLogout = (event) => {
            if (event.key === 'logout' || event.key === 'force-logout') {
                console.log('Detectado logout o actualización forzada, cerrando sesión local.');
                logout();
                if (event.key === 'force-logout') {
                    window.location.reload(); // Recargar para asegurar limpieza total
                }
            } else if (event.key === 'token' && event.newValue) {
                console.log('Detectado login en otra pestaña, actualizando sesión local.');
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
                    logout();
                }
            }
        };

        window.addEventListener('storage', syncLogout);

        // Opcional: Verificar periódicamente si hay una orden de cierre forzado (ej. por despliegue)
        const checkForceLogout = () => {
            if (localStorage.getItem('force-logout')) {
                logout();
                localStorage.removeItem('force-logout');
                window.location.reload();
            }
        };
        const interval = setInterval(checkForceLogout, 10000); // Revisar cada 10s

        return () => {
            window.removeEventListener('storage', syncLogout);
            clearInterval(interval);
        };
    }, [logout]);

    const login = async (identifier, password) => {
        try {
            const response = await apiClient.post('/login', { email: identifier, password });
            const { user: loggedInUser, token: receivedToken } = response.data;
            
            setUser(loggedInUser);
            setToken(receivedToken);

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

    const updateUser = (newUserData, newToken = null) => {
        setUser(newUserData);
        if (localStorage.getItem('user')) {
            localStorage.setItem('user', JSON.stringify(newUserData));
        }

        if (newToken) {
            setToken(newToken);
            localStorage.setItem('token', newToken);
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
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
        hasPermission, // Exponer la función de permisos
        hasModuleAccess, // Exponer la función de acceso a módulos
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
