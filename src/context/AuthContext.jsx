import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import apiClient from '../api/apiClient'; // Importa el apiClient configurado

const AuthContext = createContext(null);

// Mapeo bidireccional exhaustivo entre constantes dinámicas (acceso.*) y banderas booleanas legacy
const PERMISSION_EQUIVALENTS = {
    // 1. Resumen Operativo
    'acceso.resumenoperativo': ['canViewSummary'],
    'canViewSummary': ['acceso.resumenoperativo'],

    // 2. Cotizadores
    'acceso.cotizadores': ['canAccessQuotes'],
    'acceso.cotizadordistribuidor': ['canAccessDistributorQuotes'],
    'canAccessDistributorQuotes': ['acceso.cotizadordistribuidor'],
    'acceso.cotizadordarmax': ['canAccessQuotes'],
    'canAccessQuotes': ['acceso.cotizadordarmax'],

    // 3. Operaciones
    'acceso.operaciones': ['canAccessInventory'],
    'acceso.inventarioglobal': ['canAccessInventory'],
    'canAccessInventory': ['acceso.inventarioglobal'],
    'acceso.cortesvending': ['canAccessVending'],
    'canAccessVending': ['acceso.cortesvending'],

    // 4. Ingeniería y Proyectos
    'acceso.ingenieriayproyectos': ['canAccessInstallation'],
    'acceso.controlinstalacion': ['canAccessInstallation'],
    'canAccessInstallation': ['acceso.controlinstalacion'],
    'acceso.mapainstalaciones': ['canAccessShowcase'],
    'canAccessShowcase': ['acceso.mapainstalaciones'],

    // 5. Sistemas (Estricto: cada permiso a su rol específico, sin filtraciones)
    'acceso.sistemas': ['canAccessSistemas'],
    'canAccessSistemas': ['acceso.sistemas', 'acceso.proyectosactividades'],
    'acceso.proyectosactividades': ['canAccessSistemas'],
    'proyectosactividades.jefe': ['acceso.proyectosactividades.jefe'],
    'acceso.proyectosactividades.jefe': ['proyectosactividades.jefe'],
    'proyectosactividades.colaborador': ['acceso.proyectosactividades.colaborador'],
    'acceso.proyectosactividades.colaborador': ['proyectosactividades.colaborador'],
    'acceso.permisosyroles': ['acceso.rolesypermisos', 'canManageSistemas'],
    'acceso.rolesypermisos': ['acceso.permisosyroles', 'canManageSistemas'],
    'canManageSistemas': ['acceso.permisosyroles', 'acceso.rolesypermisos'],

    // 6. Marketing y Estrategia (Estricto)
    'acceso.marketingyestrategia': ['canAccessMarketing'],
    'canAccessMarketing': ['acceso.marketingyestrategia', 'acceso.plannerdigital'],
    'acceso.plannerdigital': ['canAccessMarketing'],
    'plannerdigital.jefe': ['acceso.plannerdigital.jefe'],
    'acceso.plannerdigital.jefe': ['plannerdigital.jefe'],
    'plannerdigital.colaborador': ['acceso.plannerdigital.colaborador'],
    'acceso.plannerdigital.colaborador': ['plannerdigital.colaborador'],
    'acceso.promociones': [],

    // 7. Contenido y Recursos
    'acceso.contenidoyrecursos': [],
    'acceso.editorblog': [],
    'acceso.centrodeguias': [],

    // 8. Finanzas y Contabilidad
    'acceso.finanzasycontabilidad': ['canAccessFinances'],
    'acceso.tesoreriaingresos': ['canAccessFinances'],
    'canAccessFinances': ['acceso.tesoreriaingresos'],
    'acceso.comprasxcp': [],
    'acceso.contabilidaderp': ['canAccessAccounting'],
    'canAccessAccounting': ['acceso.contabilidaderp'],
    'acceso.facturacioncfdi': [],
    'acceso.prospeccionleads': ['canAccessLeads'],
    'canAccessLeads': ['acceso.prospeccionleads'],
    'acceso.crmycobranza': [],

    // 9. Legal
    'acceso.legal': ['canAccessLegal'],
    'canAccessLegal': ['acceso.legal'],
    'acceso.gestiondocumental': [],
    'acceso.arealegal': ['canAccessLegal'],

    // 10. Administración
    'acceso.administracion': ['canAccessRH'],
    'canAccessRH': ['acceso.administracion', 'acceso.rrhhynominas'],
    'acceso.directorio': [],
    'acceso.rrhhynominas': ['canAccessRH'],
    'acceso.configuracionbase': ['canAccessConfig'],
    'canAccessConfig': ['acceso.configuracionbase'],

    // Módulos Principales (Entornos)
    'acceso.pos': ['canAccessPOS'],
    'acceso.ventasmostrador': ['canAccessPOS'],
    'canAccessPOS': ['acceso.pos', 'acceso.ventasmostrador'],

    'acceso.delivery': ['canAccessDelivery'],
    'acceso.repartidor': ['canAccessDelivery'],
    'canAccessDelivery': ['acceso.delivery', 'acceso.repartidor'],

    'acceso.pedidos': ['canAccessOrders'],
    'canAccessOrders': ['acceso.pedidos'],

    'acceso.gestion': ['canAccessManagement'],
    'canAccessManagement': ['acceso.gestion', 'acceso.resumenoperativo']
};

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
        const isAdmin = user.roles?.some(r => r.name?.toUpperCase() === 'ADMIN') || user.role === 'ADMIN';
        if (isAdmin) return true;

        // Lista de claves equivalentes a comprobar
        const targetsToCheck = [permissionName, ...(PERMISSION_EQUIVALENTS[permissionName] || [])];

        const itemMatches = (p, target) => {
            if (!p) return false;
            if (typeof p === 'string') return p === target;
            return p.codigo === target || p.id === target;
        };

        // 2. Verificación Dinámica por Permisos Directos del Usuario (tabla Permiso)
        if (user.permisos && Array.isArray(user.permisos)) {
            if (user.permisos.some(p => targetsToCheck.some(target => itemMatches(p, target)))) {
                return true;
            }
        }

        // 3. Verificación Dinámica por Permisos de los Roles (tabla RolePermisos)
        if (user.roles && user.roles.length > 0) {
            const hasDynamicPerm = user.roles.some(role => 
                Array.isArray(role.permisos) && role.permisos.some(p => targetsToCheck.some(target => itemMatches(p, target)))
            );
            if (hasDynamicPerm) return true;

            // Verificación por booleano en el rol (RBAC v2 legado)
            const hasLegacyBoolean = user.roles.some(role => targetsToCheck.some(target => role[target] === true));
            if (hasLegacyBoolean) return true;
        }

        // 4. Fallback: buscar en el rol legacy si existiera
        if (user.roleRelation) {
            if (targetsToCheck.some(target => user.roleRelation[target] === true)) {
                return true;
            }
        }

        // 5. Fallback final: buscar directamente en el objeto user
        if (targetsToCheck.some(target => user[target] === true)) {
            return true;
        }
        
        return false;
    }, [user]);

    // Nueva función para verificar acceso a módulos de forma inteligente
    const hasModuleAccess = useCallback((moduleName) => {
        if (!user) return false;

        // Superusuario ADMIN tiene acceso universal
        if (user.roles?.some(r => r.name?.toUpperCase() === 'ADMIN') || user.role === 'ADMIN') return true;

        switch (moduleName) {
            case 'management':
                // Acceso a Gestión si tiene el permiso maestro O cualquier permiso acceso.* de gestión
                return hasPermission('canAccessManagement') || 
                       hasPermission('acceso.gestion') ||
                       hasPermission('acceso.resumenoperativo') ||
                       hasPermission('canViewSummary') ||
                       hasPermission('acceso.cotizadores') ||
                       hasPermission('acceso.operaciones') ||
                       hasPermission('acceso.ingenieriayproyectos') ||
                       hasPermission('acceso.sistemas') ||
                       hasPermission('proyectosactividades.jefe') ||
                       hasPermission('proyectosactividades.colaborador') ||
                       hasPermission('acceso.proyectosactividades') ||
                       hasPermission('acceso.permisosyroles') ||
                       hasPermission('acceso.rolesypermisos') ||
                       hasPermission('acceso.marketingyestrategia') ||
                       hasPermission('plannerdigital.jefe') ||
                       hasPermission('plannerdigital.colaborador') ||
                       hasPermission('acceso.plannerdigital') ||
                       hasPermission('acceso.contenidoyrecursos') ||
                       hasPermission('acceso.finanzasycontabilidad') ||
                       hasPermission('acceso.legal') ||
                       hasPermission('acceso.administracion') ||
                       user.permisos?.some(p => {
                           const c = typeof p === 'string' ? p : p?.codigo;
                           return c && (c.startsWith('acceso.') || c.startsWith('proyectosactividades.') || c.startsWith('plannerdigital.')) && !c.includes('pos') && !c.includes('delivery');
                       }) ||
                       user.roles?.some(r => r.permisos?.some(p => {
                           const c = typeof p === 'string' ? p : p?.codigo;
                           return c && (c.startsWith('acceso.') || c.startsWith('proyectosactividades.') || c.startsWith('plannerdigital.')) && !c.includes('pos') && !c.includes('delivery');
                       }));
            case 'pos':
                return hasPermission('canAccessPOS') || hasPermission('acceso.pos') || hasPermission('acceso.ventasmostrador');
            case 'delivery':
                return hasPermission('canAccessDelivery') || hasPermission('acceso.delivery') || hasPermission('acceso.repartidor');
            case 'orders':
                return hasPermission('canAccessOrders') || hasPermission('acceso.pedidos') || user.type === 'CLIENTE';
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

    const refreshUser = useCallback(async () => {
        try {
            const storedToken = localStorage.getItem('token');
            if (!storedToken) return null;
            const res = await apiClient.get('/users/me');
            if (res.data) {
                setUser(res.data);
                localStorage.setItem('user', JSON.stringify(res.data));
                return res.data;
            }
        } catch (e) {
            console.warn('No se pudo refrescar la sesión del usuario en vivo:', e);
        }
        return null;
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
                // Sincronizar roles y permisos actualizados desde la BD en tiempo real
                refreshUser();
            }
        } catch (error) {
            console.error("No se pudo cargar la sesión:", error);
            localStorage.removeItem('user');
            localStorage.removeItem('token');
        } finally {
            setLoading(false);
        }
    }, [refreshUser]);

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
        refreshUser,
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
