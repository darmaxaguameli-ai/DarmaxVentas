import { useState, useEffect } from 'react';
import { useGestion } from './context/GestionContext';
import { FaShieldAlt, FaPlus, FaTrash, FaEdit, FaCheck, FaTimes, FaUsers, FaUserPlus, FaSearch } from 'react-icons/fa';
import Swal from 'sweetalert2';
import apiClient from '@/api/apiClient';

const Roles = () => {
    const { fetchManagementData } = useGestion();
    const [roles, setRoles] = useState([]);
    const [users, setUsers] = useState([]); // Lista global de usuarios (Colaboradores)
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");

    const initialRoleState = {
        name: '',
        description: '',
        canAccessPOS: false,
        canAccessOrders: false,
        canAccessDelivery: false,
        canAccessManagement: false,
        canViewSummary: false, // Nuevo permiso
        canAccessInventory: false,
        canAccessRH: false,
        canAccessFinances: false,
        canAccessConfig: false,
        canAccessQuotes: false,
        canAccessLeads: false,
        canAccessMarketing: false,
        canAccessLegal: false,
        canAccessInstallation: false,
    };

    const [formData, setFormData] = useState(initialRoleState);
    const [selectedUserIds, setSelectedUserIds] = useState([]);

    const fetchRoles = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/roles');
            setRoles(response.data);
        } catch (error) {
            console.error("Error fetching roles:", error);
            Swal.fire('Error', 'No se pudieron cargar los roles', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await apiClient.get('/users');
            // Filtrar solo colaboradores para este módulo (opcional, dependiendo de tu lógica)
            setUsers(response.data.filter(u => u.type === 'COLABORADOR' || u.role !== 'CLIENTE'));
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
                canViewSummary: !!role.canViewSummary, // Nuevo
                canAccessInventory: !!role.canAccessInventory,
                canAccessRH: !!role.canAccessRH,
                canAccessFinances: !!role.canAccessFinances,
                canAccessConfig: !!role.canAccessConfig,
                canAccessQuotes: !!role.canAccessQuotes,
                canAccessLeads: !!role.canAccessLeads,
                canAccessMarketing: !!role.canAccessMarketing,
            });
        } else {
            setEditingRole(null);
            setFormData(initialRoleState);
        }
        setIsModalOpen(true);
    };

    const handleOpenUsersModal = async (role) => {
        setEditingRole(role);
        setLoading(true);
        try {
            // Buscamos usuarios que YA tienen este rol asignado
            const currentRoleUsers = users.filter(u => u.roles?.some(r => r.id === role.id) || u.roleId === role.id);
            setSelectedUserIds(currentRoleUsers.map(u => u.id));
            setIsUsersModalOpen(true);
        } catch (error) {
            Swal.fire('Error', 'No se pudo cargar la lista de personal', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setIsUsersModalOpen(false);
        setEditingRole(null);
        setFormData(initialRoleState);
        setSelectedUserIds([]);
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
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
                Swal.fire('Éxito', 'Rol actualizado correctamente', 'success');
            } else {
                await apiClient.post('/roles', formData);
                Swal.fire('Éxito', 'Rol creado correctamente', 'success');
            }
            // Refrescar el contexto global para que otros módulos (como Empleados) vean los cambios
            await fetchManagementData();
            handleCloseModal();
            fetchRoles();
        } catch (error) {
            console.error("Error saving role:", error);
            Swal.fire('Error', error.response?.data?.error || 'No se pudo guardar el rol', 'error');
        }
    };

    const handleSaveUsers = async () => {
        try {
            setLoading(true);
            await apiClient.put(`/roles/${editingRole.id}`, {
                ...editingRole,
                userIds: selectedUserIds
            });
            // Refrescar el contexto global para que otros módulos vean los cambios de roles
            await fetchManagementData();
            
            Swal.fire('¡Personal Actualizado!', `Se han asignado ${selectedUserIds.length} colaboradores al puesto de ${editingRole.name}`, 'success');
            handleCloseModal();
            fetchRoles();
            fetchUsers();
        } catch (error) {
            console.error("Error saving users to role:", error);
            Swal.fire('Error', 'No se pudieron guardar los cambios de personal', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, isSystem) => {
        if (isSystem) {
            Swal.fire('Prohibido', 'No se pueden eliminar roles del sistema', 'warning');
            return;
        }

        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "Esta acción no se puede deshacer y fallará si hay usuarios usando este rol.",
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
                Swal.fire('Eliminado', 'El rol ha sido eliminado', 'success');
                fetchRoles();
            } catch (error) {
                Swal.fire('Error', error.response?.data?.error || 'No se pudo eliminar el rol', 'error');
            }
        }
    };

    const PermissionBadge = ({ active, label }) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mr-1 mb-1 ${
            active 
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' 
            : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600 border border-gray-200 dark:border-gray-700'
        }`}>
            {active ? <FaCheck className="mr-1" /> : <FaTimes className="mr-1" />}
            {label}
        </span>
    );

    const filteredUsers = users.filter(u => 
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        u.customId.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="animate-fade-in">
            <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-800 dark:text-white flex items-center gap-3">
                        <span className="p-2 bg-primary/10 text-primary rounded-xl">
                            <FaShieldAlt />
                        </span>
                        Roles y Permisos
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Configura qué áreas del sistema puede ver cada puesto de trabajo.</p>
                </div>
                <button 
                    onClick={() => handleOpenModal()}
                    className="btn-primary flex items-center gap-2"
                >
                    <FaPlus /> Nuevo Rol
                </button>
            </div>

            {loading && !isUsersModalOpen ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {roles.map((role) => (
                        <div key={role.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden flex flex-col">
                            {role.isSystem && (
                                <div className="absolute top-0 right-0 bg-amber-500 text-white text-[8px] font-black uppercase px-3 py-1 rounded-bl-lg tracking-widest">
                                    SISTEMA
                                </div>
                            )}
                            
                            <div className="flex justify-between items-start mb-1">
                                <h3 className="text-xl font-black text-gray-800 dark:text-white uppercase">{role.name}</h3>
                                <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-700">
                                    <FaUsers className="text-gray-400" size={12} />
                                    <span className="text-xs font-black text-primary">{role._count?.users || 0}</span>
                                </div>
                            </div>
                            
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2 h-10">
                                {role.description || 'Sin descripción'}
                            </p>

                            <div className="border-t border-gray-50 dark:border-gray-700 pt-4 mb-6 flex-1">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Capacidades del Puesto</p>
                                <div className="flex flex-wrap mb-4">
                                    <PermissionBadge active={role.canAccessPOS} label="Caja/POS" />
                                    <PermissionBadge active={role.canAccessOrders} label="Pedidos" />
                                    <PermissionBadge active={role.canAccessDelivery} label="Reparto" />
                                    <PermissionBadge active={role.canAccessManagement} label="Gestión" />
                                </div>
                                <div className="flex flex-wrap">
                                    <PermissionBadge active={role.canAccessInventory} label="Inventario" />
                                    <PermissionBadge active={role.canAccessRH} label="RRHH" />
                                    <PermissionBadge active={role.canAccessFinances} label="Finanzas" />
                                    <PermissionBadge active={role.canAccessQuotes} label="Cotiz." />
                                    <PermissionBadge active={role.canAccessLegal} label="Legal" />
                                    <PermissionBadge active={role.canAccessInstallation} label="Instal." />
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t border-gray-50 dark:border-gray-700">
                                <button 
                                    onClick={() => handleOpenUsersModal(role)}
                                    className="flex items-center gap-2 text-xs font-black text-gray-400 hover:text-primary transition-colors uppercase tracking-widest"
                                >
                                    <FaUserPlus /> Gestionar Personal
                                </button>
                                <div className="flex gap-1">
                                    <button 
                                        onClick={() => handleOpenModal(role)}
                                        className="p-2 text-gray-400 hover:text-primary transition-colors"
                                        title="Editar Rol"
                                    >
                                        <FaEdit size={16} />
                                    </button>
                                    {!role.isSystem && (
                                        <button 
                                            onClick={() => handleDelete(role.id, role.isSystem)}
                                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                            title="Eliminar Rol"
                                        >
                                            <FaTrash size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal de Personal Asignado */}
            {isUsersModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700 flex flex-col max-h-[85vh]">
                        <div className="p-6 border-b border-gray-50 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/20">
                            <div>
                                <h2 className="text-xl font-black text-gray-800 dark:text-white uppercase tracking-tight">Asignar Colaboradores</h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Puesto: <span className="text-primary font-bold">{editingRole?.name}</span></p>
                            </div>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                                <FaTimes size={20} />
                            </button>
                        </div>

                        <div className="p-4 bg-gray-50 dark:bg-gray-900/40 border-b border-gray-100 dark:border-gray-700">
                            <div className="relative">
                                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input 
                                    type="text"
                                    placeholder="Buscar por nombre o ID..."
                                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map(user => (
                                    <label key={user.id} className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                                        selectedUserIds.includes(user.id)
                                        ? 'bg-primary/5 border-primary shadow-sm'
                                        : 'bg-white dark:bg-gray-800 border-gray-50 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'
                                    }`}>
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs ${
                                                selectedUserIds.includes(user.id) ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                                            }`}>
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-gray-800 dark:text-white leading-none">{user.name}</p>
                                                <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-wider">{user.customId}</p>
                                            </div>
                                        </div>
                                        <input 
                                            type="checkbox"
                                            className="sr-only"
                                            checked={selectedUserIds.includes(user.id)}
                                            onChange={() => toggleUserSelection(user.id)}
                                        />
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                            selectedUserIds.includes(user.id) 
                                            ? 'bg-primary border-primary text-white' 
                                            : 'border-gray-200 dark:border-gray-600 text-transparent'
                                        }`}>
                                            <FaCheck size={10} />
                                        </div>
                                    </label>
                                ))
                            ) : (
                                <div className="text-center py-10 opacity-50">
                                    <p className="text-sm font-bold text-gray-400 italic">No se encontraron colaboradores</p>
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20 flex gap-3">
                            <button 
                                onClick={handleCloseModal}
                                className="flex-1 py-3 text-xs font-black text-gray-500 uppercase tracking-widest hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleSaveUsers}
                                disabled={loading}
                                className="flex-[2] py-3 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50"
                            >
                                {loading ? 'Guardando...' : 'Confirmar Personal'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Creación/Edición */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700 flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-gray-50 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/20">
                            <div>
                                <h2 className="text-xl font-black text-gray-800 dark:text-white uppercase tracking-tight flex items-center gap-2">
                                    {editingRole ? 'Editar Estructura del Rol' : 'Crear Nuevo Rol Maestro'}
                                </h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Configura los permisos y capacidades de este puesto.</p>
                            </div>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                                <FaTimes size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar">
                            <div className="p-8 space-y-8">
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block italic">Nombre Identificador</label>
                                        <input 
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            required
                                            disabled={editingRole?.isSystem}
                                            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-4 font-black text-lg text-gray-800 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all disabled:opacity-50 uppercase tracking-tight"
                                            placeholder="Ej: SUPERVISOR_PLANTA"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block italic">Descripción del Puesto</label>
                                        <textarea 
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            rows="2"
                                            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-3 font-medium text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-primary outline-none transition-all resize-none"
                                            placeholder="Breve descripción de las funciones..."
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-px flex-1 bg-gray-100 dark:bg-gray-700"></div>
                                        <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Módulos de Acceso</label>
                                        <div className="h-px flex-1 bg-gray-100 dark:bg-gray-700"></div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {[
                                            { id: 'canAccessManagement', label: 'Resumen General', icon: 'dashboard', desc: 'Acceso al dashboard principal y gráficas.' },
                                            { id: 'canAccessPOS', label: 'Caja y Ventas', icon: 'payments', desc: 'Permite realizar ventas en mostrador.' },
                                            { id: 'canAccessOrders', label: 'Pedidos Cliente', icon: 'shopping_cart', desc: 'Flujo de pedidos a domicilio.' },
                                            { id: 'canAccessDelivery', label: 'Dashboard Reparto', icon: 'local_shipping', desc: 'Gestión de rutas y entregas.' },
                                        ].map((perm) => (
                                            <label key={perm.id} className="flex items-center justify-between p-4 rounded-2xl bg-blue-50/30 dark:bg-blue-900/5 border border-blue-100/50 dark:border-blue-800/20 hover:border-blue-300 cursor-pointer transition-all group">
                                                <div className="flex gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                                                        <span className="material-symbols-outlined">{perm.icon}</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-gray-800 dark:text-gray-200">{perm.label}</p>
                                                        <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">{perm.desc}</p>
                                                    </div>
                                                </div>
                                                <input 
                                                    type="checkbox" 
                                                    name={perm.id}
                                                    checked={formData[perm.id]}
                                                    onChange={handleInputChange}
                                                    className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary" 
                                                />
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-px flex-1 bg-gray-100 dark:bg-gray-700"></div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Permisos Especializados</label>
                                        <div className="h-px flex-1 bg-gray-100 dark:bg-gray-700"></div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                                        {[
                                            { id: 'canViewSummary', label: 'Ver Resumen', icon: 'monitoring' },
                                            { id: 'canAccessInventory', label: 'Inventario', icon: 'inventory_2' },
                                            { id: 'canAccessRH', label: 'RRHH y Roles', icon: 'folder_managed' },
                                            { id: 'canAccessFinances', label: 'Finanzas', icon: 'account_balance_wallet' },
                                            { id: 'canAccessConfig', label: 'Configuración', icon: 'tune' },
                                            { id: 'canAccessQuotes', label: 'Cotizadores', icon: 'request_quote' },
                                            { id: 'canAccessMarketing', label: 'Marketing', icon: 'campaign' },
                                            { id: 'canAccessLegal', label: 'Área Legal', icon: 'balance' },
                                            { id: 'canAccessInstallation', label: 'Instalación', icon: 'construction' },
                                        ].map((perm) => (
                                            <label key={perm.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-900/40 hover:bg-gray-100 border border-transparent hover:border-gray-200 cursor-pointer transition-all">
                                                <div className="flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-gray-400 text-lg">{perm.icon}</span>
                                                    <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-tighter">{perm.label}</span>
                                                </div>
                                                <input 
                                                    type="checkbox" 
                                                    name={perm.id}
                                                    checked={formData[perm.id]}
                                                    onChange={handleInputChange}
                                                    className="w-4 h-4 text-primary border-gray-300 rounded" 
                                                />
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-50 dark:border-gray-700 flex gap-3 bg-gray-50/50 dark:bg-gray-900/20">
                                <button type="button" onClick={handleCloseModal} className="flex-1 py-4 px-4 bg-white dark:bg-gray-800 text-gray-600 font-black rounded-2xl uppercase tracking-widest text-xs hover:bg-gray-100 border border-gray-200 dark:border-gray-700 transition-all">Cancelar</button>
                                <button type="submit" className="flex-[2] py-4 px-4 bg-primary text-white font-black rounded-2xl uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all">
                                    {editingRole ? 'Guardar Cambios' : 'Crear Puesto'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Roles;
