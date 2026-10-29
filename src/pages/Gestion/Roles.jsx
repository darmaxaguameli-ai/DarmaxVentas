import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useGestion } from './context/GestionContext';
import Swal from 'sweetalert2';
import apiClient from '@/api/apiClient';
import { toast } from 'sonner';

const PERMISSION_GROUPS = [
    {
        title: 'Operación y Puntos de Venta',
        icon: 'storefront',
        permissions: [
            { id: 'canAccessPOS', label: 'Caja y Mostrador (POS)', desc: 'Permite registrar ventas directas en mostrador.' },
            { id: 'canAccessOrders', label: 'Pedidos y Clientes', desc: 'Gestión del flujo de pedidos de agua a domicilio.' },
            { id: 'canAccessDelivery', label: 'Módulo de Reparto', desc: 'Gestión de rutas y entregas para repartidores.' },
            { id: 'canAccessVending', label: 'Cortes Vending', desc: 'Control y corte de cajas de máquinas dispensadoras.' },
            { id: 'canAccessInstallation', label: 'Instalaciones y Mapa', desc: 'Control de órdenes técnicas y mapa de instalaciones.' },
        ]
    },
    {
        title: 'Gestión y Estrategia Comercial',
        icon: 'monitoring',
        permissions: [
            { id: 'canAccessManagement', label: 'Acceso a Gestión General', desc: 'Permite ingresar al panel de gestión operativa.' },
            { id: 'canViewSummary', label: 'Ver Resumen y Métricas', desc: 'Visualización de gráficos ejecutivos y balance de flujo.' },
            { id: 'canAccessInventory', label: 'Inventario y Almacén', desc: 'Control de existencias de insumos y productos.' },
            { id: 'canAccessQuotes', label: 'Cotizadores de Plantas', desc: 'Elaboración de cotizaciones y distribución.' },
            { id: 'canAccessMarketing', label: 'Marketing y Planner', desc: 'Planificador de campañas digitales y promociones.' },
        ]
    },
    {
        title: 'Finanzas, Legal y Personal',
        icon: 'account_balance',
        permissions: [
            { id: 'canAccessFinances', label: 'Tesorería y CxP', desc: 'Gestión de ingresos, compras a proveedores y cuentas.' },
            { id: 'canAccessAccounting', label: 'Contabilidad y Fiscal', desc: 'Pólizas, catálogo contable y facturación CFDI 4.0.' },
            { id: 'canAccessRH', label: 'Recursos Humanos y Nóminas', desc: 'Expedientes de colaboradores y dispersión salarial.' },
            { id: 'canAccessLegal', label: 'Área Legal y Documental', desc: 'Gestión de contratos y repositorio documental.' },
            { id: 'canAccessConfig', label: 'Configuración General', desc: 'Ajustes maestros, marcas de garrafones y sucursales.' },
        ]
    },
    {
        title: 'Ingeniería y Sistemas',
        icon: 'terminal',
        permissions: [
            { id: 'canAccessSistemas', label: 'Sistemas (Colaborador)', desc: 'Acceso a tableros scrum y metas asignadas.' },
            { id: 'canManageSistemas', label: 'Sistemas (Líder / Jefe)', desc: 'Gestión completa de proyectos, sprints y reconocimientos.' },
        ]
    }
];

const Roles = () => {
    const { fetchManagementData } = useGestion();
    const [roles, setRoles] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [searchRolesQuery, setSearchRolesQuery] = useState("");
    const [userSearchQuery, setUserSearchQuery] = useState("");

    const initialRoleState = {
        name: '',
        description: '',
        canAccessPOS: false,
        canAccessOrders: false,
        canAccessDelivery: false,
        canAccessManagement: false,
        canViewSummary: false,
        canAccessInventory: false,
        canAccessRH: false,
        canAccessFinances: false,
        canAccessAccounting: false,
        canAccessVending: false,
        canAccessConfig: false,
        canAccessQuotes: false,
        canAccessLeads: false,
        canAccessMarketing: false,
        canAccessLegal: false,
        canAccessInstallation: false,
        canAccessSistemas: false,
        canManageSistemas: false,
    };

    const [formData, setFormData] = useState(initialRoleState);
    const [selectedUserIds, setSelectedUserIds] = useState([]);

    const fetchRoles = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/roles');
            setRoles(response.data || []);
        } catch (error) {
            console.error("Error fetching roles:", error);
            toast.error('No se pudieron cargar los roles');
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await apiClient.get('/users');
            setUsers((response.data || []).filter(u => u.type === 'COLABORADOR' || u.role !== 'CLIENTE'));
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    useEffect(() => {
        fetchRoles();
        fetchUsers();
    }, []);

    const handleOpenModal = (role = null) => {
        if (role) {
            setEditingRole(role);
            setFormData({
                name: role.name || '',
                description: role.description || '',
                canAccessPOS: !!role.canAccessPOS,
                canAccessOrders: !!role.canAccessOrders,
                canAccessDelivery: !!role.canAccessDelivery,
                canAccessManagement: !!role.canAccessManagement,
                canViewSummary: !!role.canViewSummary,
                canAccessInventory: !!role.canAccessInventory,
                canAccessRH: !!role.canAccessRH,
                canAccessFinances: !!role.canAccessFinances,
                canAccessAccounting: !!role.canAccessAccounting,
                canAccessVending: !!role.canAccessVending,
                canAccessConfig: !!role.canAccessConfig,
                canAccessQuotes: !!role.canAccessQuotes,
                canAccessLeads: !!role.canAccessLeads,
                canAccessMarketing: !!role.canAccessMarketing,
                canAccessLegal: !!role.canAccessLegal,
                canAccessInstallation: !!role.canAccessInstallation,
                canAccessSistemas: !!role.canAccessSistemas,
                canManageSistemas: !!role.canManageSistemas,
            });
        } else {
            setEditingRole(null);
            setFormData(initialRoleState);
        }
        setIsModalOpen(true);
    };

    const handleOpenUsersModal = (role) => {
        setEditingRole(role);
        setUserSearchQuery("");
        const currentRoleUsers = users.filter(u => u.roles?.some(r => r.id === role.id) || u.roleId === role.id);
        setSelectedUserIds(currentRoleUsers.map(u => u.id));
        setIsUsersModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setIsUsersModalOpen(false);
        setEditingRole(null);
        setFormData(initialRoleState);
        setSelectedUserIds([]);
        setUserSearchQuery("");
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const togglePermission = (permId) => {
        setFormData(prev => ({
            ...prev,
            [permId]: !prev[permId]
        }));
    };

    const toggleUserSelection = (userId) => {
        setSelectedUserIds(prev => 
            prev.includes(userId) 
                ? prev.filter(id => id !== userId) 
                : [...prev, userId]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingRole) {
                await apiClient.put(`/roles/${editingRole.id}`, formData);
                toast.success('Estructura del rol actualizada exitosamente');
            } else {
                await apiClient.post('/roles', formData);
                toast.success('Nuevo rol maestro creado exitosamente');
            }
            await fetchManagementData();
            handleCloseModal();
            fetchRoles();
        } catch (error) {
            console.error("Error saving role:", error);
            toast.error(error.response?.data?.error || 'No se pudo guardar el rol');
        }
    };

    const handleSaveUsers = async () => {
        try {
            setLoading(true);
            await apiClient.put(`/roles/${editingRole.id}`, {
                ...editingRole,
                userIds: selectedUserIds
            });
            await fetchManagementData();
            toast.success(`Personal actualizado: ${selectedUserIds.length} colaboradores asignados a ${editingRole.name}`);
            handleCloseModal();
            fetchRoles();
            fetchUsers();
        } catch (error) {
            console.error("Error saving users to role:", error);
            toast.error('No se pudieron guardar los cambios de personal');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, isSystem, roleName) => {
        if (isSystem) {
            Swal.fire({
                title: 'Rol del Sistema',
                text: 'Los roles nativos del sistema no pueden eliminarse por seguridad.',
                icon: 'warning',
                confirmButtonColor: '#3b82f6'
            });
            return;
        }

        const result = await Swal.fire({
            title: `¿Eliminar rol "${roleName}"?`,
            text: "Esta acción no se puede deshacer y fallará si hay colaboradores usando este rol actualmente.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await apiClient.delete(`/roles/${id}`);
                toast.success('El rol ha sido eliminado');
                fetchRoles();
            } catch (error) {
                toast.error(error.response?.data?.error || 'No se pudo eliminar el rol');
            }
        }
    };

    // Filtros de búsqueda
    const filteredRoles = useMemo(() => {
        const query = searchRolesQuery.toLowerCase().trim();
        if (!query) return roles;
        return roles.filter(r => 
            (r.name && r.name.toLowerCase().includes(query)) ||
            (r.description && r.description.toLowerCase().includes(query))
        );
    }, [roles, searchRolesQuery]);

    const filteredUsers = useMemo(() => {
        const query = userSearchQuery.toLowerCase().trim();
        if (!query) return users;
        return users.filter(u => 
            (u.name && u.name.toLowerCase().includes(query)) || 
            (u.customId && u.customId.toLowerCase().includes(query)) ||
            (u.email && u.email.toLowerCase().includes(query))
        );
    }, [users, userSearchQuery]);

    // Métricas rápidas
    const totalRoles = roles.length;
    const systemRolesCount = roles.filter(r => r.isSystem).length;
    const customRolesCount = roles.filter(r => !r.isSystem).length;
    const totalAssignedUsers = useMemo(() => {
        return roles.reduce((acc, curr) => acc + (curr._count?.users || 0), 0);
    }, [roles]);

    return (
        <div className="space-y-6 pb-20">
            {/* Encabezado sin avatar al lado del título */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
                            Control de Acceso (RBAC v2)
                        </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                        Roles y Permisos
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">
                        Configura qué áreas y herramientas del sistema puede ver y gestionar cada puesto de trabajo.
                    </p>
                </div>

                <button 
                    type="button"
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white font-bold text-xs shadow-xs hover:bg-primary-dark active:scale-95 transition-all"
                >
                    <span className="material-symbols-outlined text-base">add_moderator</span>
                    <span>Nuevo Rol Maestro</span>
                </button>
            </div>

            {/* Resumen de Métricas de Roles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/80 dark:border-gray-800/80 p-4 rounded-2xl shadow-xs">
                    <div className="flex items-center justify-between text-gray-400 mb-1">
                        <span className="text-[10px] font-black uppercase tracking-wider">Total de Roles</span>
                        <span className="material-symbols-outlined text-base text-blue-500">shield</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">{totalRoles}</p>
                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">Puestos parametrizados</p>
                </div>

                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/80 dark:border-gray-800/80 p-4 rounded-2xl shadow-xs">
                    <div className="flex items-center justify-between text-gray-400 mb-1">
                        <span className="text-[10px] font-black uppercase tracking-wider">Roles de Sistema</span>
                        <span className="material-symbols-outlined text-base text-amber-500">verified</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">{systemRolesCount}</p>
                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">Protegidos por la plataforma</p>
                </div>

                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/80 dark:border-gray-800/80 p-4 rounded-2xl shadow-xs">
                    <div className="flex items-center justify-between text-gray-400 mb-1">
                        <span className="text-[10px] font-black uppercase tracking-wider">Personalizados</span>
                        <span className="material-symbols-outlined text-base text-purple-500">tune</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400">{customRolesCount}</p>
                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">Creados a medida</p>
                </div>

                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/80 dark:border-gray-800/80 p-4 rounded-2xl shadow-xs">
                    <div className="flex items-center justify-between text-gray-400 mb-1">
                        <span className="text-[10px] font-black uppercase tracking-wider">Asignaciones</span>
                        <span className="material-symbols-outlined text-base text-emerald-500">group</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">{totalAssignedUsers}</p>
                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">Colaboradores vinculados</p>
                </div>
            </div>

            {/* Buscador de Roles */}
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/80 dark:border-gray-800/80 p-3 sm:p-4 rounded-3xl shadow-xs flex items-center justify-between gap-4">
                <div className="relative flex-1">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                        search
                    </span>
                    <input 
                        type="text"
                        value={searchRolesQuery}
                        onChange={(e) => setSearchRolesQuery(e.target.value)}
                        placeholder="Buscar rol por nombre o funciones..."
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/60 rounded-xl text-xs font-bold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                    />
                    {searchRolesQuery && (
                        <button 
                            type="button"
                            onClick={() => setSearchRolesQuery("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white"
                        >
                            <span className="material-symbols-outlined text-base">close</span>
                        </button>
                    )}
                </div>

                <span className="text-[11px] text-gray-400 font-medium hidden sm:inline whitespace-nowrap">
                    Mostrando <strong>{filteredRoles.length}</strong> de {totalRoles} roles
                </span>
            </div>

            {/* Listado de Tarjetas de Roles */}
            {loading && !isUsersModalOpen ? (
                <div className="flex justify-center py-20 text-gray-400">
                    <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
                </div>
            ) : filteredRoles.length === 0 ? (
                <div className="p-16 text-center text-gray-400 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-200/80 dark:border-gray-800/80 space-y-2">
                    <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600">
                        security
                    </span>
                    <p className="text-sm font-bold text-gray-600 dark:text-gray-300">
                        No se encontraron roles que coincidan con la búsqueda
                    </p>
                    <p className="text-xs text-gray-400">
                        Prueba modificando el texto de búsqueda o crea un nuevo rol maestro.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredRoles.map((role) => {
                        const activePermsCount = [
                            role.canAccessPOS, role.canAccessOrders, role.canAccessDelivery, role.canAccessManagement,
                            role.canViewSummary, role.canAccessInventory, role.canAccessRH, role.canAccessFinances,
                            role.canAccessAccounting, role.canAccessVending, role.canAccessConfig, role.canAccessQuotes,
                            role.canAccessLeads, role.canAccessMarketing, role.canAccessLegal, role.canAccessInstallation,
                            role.canAccessSistemas, role.canManageSistemas
                        ].filter(Boolean).length;

                        return (
                            <div 
                                key={role.id} 
                                className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-200/80 dark:border-gray-800/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group"
                            >
                                <div>
                                    {/* Cabecera de la Tarjeta del Rol */}
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                {role.isSystem ? (
                                                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800">
                                                        Sistema
                                                    </span>
                                                ) : (
                                                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800">
                                                        Personalizado
                                                    </span>
                                                )}
                                                <span className="text-[9px] font-bold text-gray-400">
                                                    {activePermsCount} permisos
                                                </span>
                                            </div>
                                            <h3 className="text-base font-bold text-gray-900 dark:text-white uppercase tracking-tight truncate">
                                                {role.name}
                                            </h3>
                                        </div>

                                        <button 
                                            type="button"
                                            onClick={() => handleOpenUsersModal(role)}
                                            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700 text-xs font-bold text-gray-700 dark:text-gray-300 hover:text-primary transition-colors flex-shrink-0"
                                            title="Ver colaboradores asignados a este puesto"
                                        >
                                            <span className="material-symbols-outlined text-sm text-primary">groups</span>
                                            <span>{role._count?.users || 0}</span>
                                        </button>
                                    </div>

                                    {/* Descripción del Rol */}
                                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 min-h-[32px] mb-4">
                                        {role.description || 'Sin descripción detallada de funciones.'}
                                    </p>

                                    {/* Resumen de Capacidades / Permisos Activos */}
                                    <div className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-2 mb-4">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                                            Capacidades Clave
                                        </p>
                                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar">
                                            {role.canAccessManagement && (
                                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
                                                    Gestión
                                                </span>
                                            )}
                                            {role.canAccessPOS && (
                                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800">
                                                    POS/Caja
                                                </span>
                                            )}
                                            {role.canAccessOrders && (
                                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800">
                                                    Pedidos
                                                </span>
                                            )}
                                            {role.canAccessDelivery && (
                                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800">
                                                    Reparto
                                                </span>
                                            )}
                                            {role.canAccessInventory && (
                                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
                                                    Inventario
                                                </span>
                                            )}
                                            {role.canAccessRH && (
                                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800">
                                                    RRHH
                                                </span>
                                            )}
                                            {role.canAccessFinances && (
                                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800">
                                                    Finanzas
                                                </span>
                                            )}
                                            {role.canAccessAccounting && (
                                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-cyan-50 text-cyan-700 border border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800">
                                                    Contable
                                                </span>
                                            )}
                                            {role.canAccessSistemas && (
                                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
                                                    Sistemas
                                                </span>
                                            )}
                                            {role.canManageSistemas && (
                                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800">
                                                    Líder Sistemas
                                                </span>
                                            )}
                                            {role.canAccessQuotes && (
                                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800">
                                                    Cotizadores
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Acciones de la Tarjeta */}
                                <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                    <button 
                                        type="button"
                                        onClick={() => handleOpenUsersModal(role)}
                                        className="flex items-center gap-1.5 text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-primary transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-base text-primary">person_add</span>
                                        <span>Asignar Personal</span>
                                    </button>

                                    <div className="flex items-center gap-1">
                                        <button 
                                            type="button"
                                            onClick={() => handleOpenModal(role)}
                                            className="p-1.5 text-gray-400 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
                                            title="Editar estructura del rol"
                                        >
                                            <span className="material-symbols-outlined text-lg">edit</span>
                                        </button>
                                        {!role.isSystem && (
                                            <button 
                                                type="button"
                                                onClick={() => handleDelete(role.id, role.isSystem, role.name)}
                                                className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all"
                                                title="Eliminar rol"
                                            >
                                                <span className="material-symbols-outlined text-lg">delete</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ==================================================== */}
            {/* MODAL 1: ASIGNAR COLABORADORES A ESTE ROL            */}
            {/* ==================================================== */}
            {isUsersModalOpen && createPortal(
                <div 
                    className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
                    onClick={handleCloseModal}
                >
                    <div 
                        className="bg-white dark:bg-gray-850 rounded-3xl w-full max-w-lg shadow-2xl border border-gray-200/80 dark:border-gray-700/80 flex flex-col max-h-[90vh] sm:max-h-[85vh] overflow-hidden transform transition-all duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Cabecera Fija */}
                        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-slate-50 via-white to-blue-50/40 dark:from-gray-900 dark:via-gray-850 dark:to-blue-950/20 flex items-start justify-between gap-4 flex-shrink-0">
                            <div className="space-y-1 min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-100/70 dark:bg-blue-900/40 px-2.5 py-0.5 rounded-full">
                                        Asignación de Puesto
                                    </span>
                                    <span className="text-[10px] font-bold text-gray-400">
                                        {selectedUserIds.length} seleccionados
                                    </span>
                                </div>
                                <h2 className="text-lg font-black text-gray-900 dark:text-white leading-tight">
                                    Asignar Colaboradores
                                </h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate">
                                    Puesto: <span className="text-primary font-bold">{editingRole?.name}</span>
                                </p>
                            </div>

                            <button 
                                type="button"
                                onClick={handleCloseModal} 
                                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
                            >
                                <span className="material-symbols-outlined text-xl">close</span>
                            </button>
                        </div>

                        {/* Buscador de Colaboradores */}
                        <div className="p-3 bg-gray-50/50 dark:bg-gray-900/40 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base">
                                    search
                                </span>
                                <input 
                                    type="text"
                                    placeholder="Buscar por nombre, correo o ID..."
                                    className="w-full pl-9 pr-3.5 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/80 rounded-xl text-xs font-bold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                                    value={userSearchQuery}
                                    onChange={(e) => setUserSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Lista de Colaboradores (Sin avatares, tipografía limpia) */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map(user => {
                                    const isSelected = selectedUserIds.includes(user.id);
                                    return (
                                        <label 
                                            key={user.id} 
                                            className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                                                isSelected
                                                    ? 'bg-blue-50/60 dark:bg-blue-950/30 border-primary shadow-xs'
                                                    : 'bg-white dark:bg-gray-800 border-gray-200/80 dark:border-gray-700/80 hover:border-gray-300'
                                            }`}
                                        >
                                            <div className="min-w-0 flex-1 pr-3">
                                                <p className="text-xs font-bold text-gray-900 dark:text-white leading-tight truncate">
                                                    {user.name}
                                                </p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[10px] text-gray-400 font-medium truncate">
                                                        {user.email || user.customId || 'Colaborador'}
                                                    </span>
                                                    {user.store?.name && (
                                                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 font-bold truncate">
                                                            {user.store.name}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all flex-shrink-0 ${
                                                isSelected 
                                                    ? 'bg-primary border-primary text-white' 
                                                    : 'border-gray-300 dark:border-gray-600'
                                            }`}>
                                                {isSelected && <span className="material-symbols-outlined text-xs">check</span>}
                                            </div>
                                            <input 
                                                type="checkbox"
                                                className="sr-only"
                                                checked={isSelected}
                                                onChange={() => toggleUserSelection(user.id)}
                                            />
                                        </label>
                                    );
                                })
                            ) : (
                                <div className="text-center py-12 text-gray-400 space-y-1">
                                    <span className="material-symbols-outlined text-3xl text-gray-300 dark:text-gray-600">
                                        person_search
                                    </span>
                                    <p className="text-xs font-bold text-gray-500">No se encontraron colaboradores</p>
                                </div>
                            )}
                        </div>

                        {/* Pie de Acciones Fijo */}
                        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/50 flex items-center justify-between gap-3 flex-shrink-0">
                            <button 
                                type="button"
                                onClick={handleCloseModal}
                                className="py-2.5 px-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold rounded-xl text-xs hover:bg-gray-200 active:scale-95 transition-all"
                            >
                                Cancelar
                            </button>
                            <button 
                                type="button"
                                onClick={handleSaveUsers}
                                disabled={loading}
                                className="py-2.5 px-5 bg-primary text-white font-bold rounded-xl text-xs shadow-xs hover:bg-primary-dark active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined text-sm">check</span>
                                <span>{loading ? 'Guardando...' : `Asignar (${selectedUserIds.length})`}</span>
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ==================================================== */}
            {/* MODAL 2: CREAR O EDITAR ESTRUCTURA DEL ROL MAESTRO   */}
            {/* ==================================================== */}
            {isModalOpen && createPortal(
                <div 
                    className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
                    onClick={handleCloseModal}
                >
                    <div 
                        className="bg-white dark:bg-gray-850 rounded-3xl w-full max-w-3xl shadow-2xl border border-gray-200/80 dark:border-gray-700/80 flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden transform transition-all duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Cabecera Fija */}
                        <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-slate-50 via-white to-blue-50/40 dark:from-gray-900 dark:via-gray-850 dark:to-blue-950/20 flex items-start justify-between gap-4 flex-shrink-0">
                            <div className="space-y-1 min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-100/70 dark:bg-blue-900/40 px-2.5 py-0.5 rounded-full">
                                        Configuración RBAC
                                    </span>
                                    {editingRole?.isSystem && (
                                        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300">
                                            Rol Protegido
                                        </span>
                                    )}
                                </div>
                                <h2 className="text-base sm:text-lg md:text-xl font-black text-gray-900 dark:text-white leading-snug">
                                    {editingRole ? `Editar Estructura: ${editingRole.name}` : 'Crear Nuevo Rol Maestro'}
                                </h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                    Define los privilegios de navegación, edición y administración para este rol.
                                </p>
                            </div>

                            <button 
                                type="button"
                                onClick={handleCloseModal} 
                                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
                            >
                                <span className="material-symbols-outlined text-xl">close</span>
                            </button>
                        </div>

                        {/* Cuerpo del Formulario con Scroll Interno Suave */}
                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 custom-scrollbar space-y-6">
                            {/* Identificación del Puesto */}
                            <div className="space-y-4">
                                <span className="text-[11px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-sm text-primary">badge</span>
                                    Identificador del Rol y Funciones
                                </span>

                                <div className="space-y-3.5">
                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                                                Nombre del Rol / Puesto <span className="text-rose-500">*</span>
                                            </label>
                                            {editingRole?.isSystem && (
                                                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">
                                                    Rol protegido del sistema
                                                </span>
                                            )}
                                        </div>
                                        <input 
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            required
                                            disabled={editingRole?.isSystem}
                                            className="w-full bg-gray-50/80 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/80 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all disabled:opacity-60 uppercase"
                                            placeholder="Ej: SUPERVISOR_PLANTA"
                                        />
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                                                Descripción de Funciones
                                            </label>
                                            <span className="text-[10px] text-gray-400 font-medium">
                                                Alcance y responsabilidades
                                            </span>
                                        </div>
                                        <textarea 
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            rows="3"
                                            className="w-full bg-gray-50/80 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/80 rounded-xl p-3 text-xs font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all resize-y min-h-[95px] max-h-[160px] overflow-y-auto custom-scrollbar leading-relaxed"
                                            placeholder="Detalla las funciones principales de este puesto, áreas que supervisa, objetivos clave o restricciones operativas..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Grupos de Permisos Categorizados */}
                            <div className="space-y-6 pt-3 border-t border-gray-100 dark:border-gray-800">
                                {PERMISSION_GROUPS.map((group) => (
                                    <div key={group.title} className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-base text-primary">{group.icon}</span>
                                            <h4 className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                                {group.title}
                                            </h4>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                            {group.permissions.map((perm) => {
                                                const isChecked = Boolean(formData[perm.id]);
                                                return (
                                                    <div 
                                                        key={perm.id}
                                                        onClick={() => togglePermission(perm.id)}
                                                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                                            isChecked
                                                                ? 'bg-blue-50/70 dark:bg-blue-950/30 border-primary shadow-xs'
                                                                : 'bg-gray-50/60 dark:bg-gray-800/50 border-gray-200/80 dark:border-gray-700/80 hover:border-gray-300'
                                                        }`}
                                                    >
                                                        <div className="min-w-0 flex-1">
                                                            <p className={`text-xs font-bold leading-tight ${
                                                                isChecked ? 'text-primary dark:text-blue-300' : 'text-gray-900 dark:text-white'
                                                            }`}>
                                                                {perm.label}
                                                            </p>
                                                            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium leading-tight mt-0.5">
                                                                {perm.desc}
                                                            </p>
                                                        </div>

                                                        <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all flex-shrink-0 ${
                                                            isChecked 
                                                                ? 'bg-primary border-primary text-white' 
                                                                : 'border-gray-300 dark:border-gray-600'
                                                        }`}>
                                                            {isChecked && <span className="material-symbols-outlined text-xs">check</span>}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pie de Acciones Fijo */}
                            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3">
                                <button 
                                    type="button" 
                                    onClick={handleCloseModal} 
                                    className="py-2.5 px-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold rounded-xl text-xs hover:bg-gray-200 active:scale-95 transition-all"
                                >
                                    Cancelar
                                </button>

                                <button 
                                    type="submit" 
                                    className="py-2.5 px-5 bg-primary text-white font-bold rounded-xl text-xs shadow-xs hover:bg-primary-dark active:scale-95 transition-all flex items-center gap-1.5"
                                >
                                    <span className="material-symbols-outlined text-sm">check</span>
                                    <span>{editingRole ? 'Guardar Estructura' : 'Crear Rol Maestro'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default Roles;
