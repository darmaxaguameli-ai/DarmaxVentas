import { useState, useEffect } from 'react';
import { useGestion } from './context/GestionContext';
import { FaShieldAlt, FaPlus, FaTrash, FaEdit, FaCheck, FaTimes } from 'react-icons/fa';
import Swal from 'sweetalert2';
import apiClient from '@/api/apiClient';

const Roles = () => {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState(null);

    const initialRoleState = {
        name: '',
        description: '',
        canAccessPOS: false,
        canAccessOrders: false,
        canAccessDelivery: false,
        canAccessManagement: false,
        canAccessInventory: false,
        canAccessRH: false,
        canAccessFinances: false,
        canAccessConfig: false,
        canAccessQuotes: false,
        canAccessLeads: false,
        canAccessMarketing: false,
    };

    const [formData, setFormData] = useState(initialRoleState);

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

    useEffect(() => {
        fetchRoles();
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

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingRole(null);
        setFormData(initialRoleState);
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
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
            handleCloseModal();
            fetchRoles();
        } catch (error) {
            console.error("Error saving role:", error);
            Swal.fire('Error', error.response?.data?.error || 'No se pudo guardar el rol', 'error');
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

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {roles.map((role) => (
                        <div key={role.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                            {role.isSystem && (
                                <div className="absolute top-0 right-0 bg-amber-500 text-white text-[8px] font-black uppercase px-3 py-1 rounded-bl-lg tracking-widest">
                                    SISTEMA
                                </div>
                            )}
                            
                            <h3 className="text-xl font-black text-gray-800 dark:text-white mb-1 uppercase">{role.name}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2 h-10">
                                {role.description || 'Sin descripción'}
                            </p>

                            <div className="border-t border-gray-50 dark:border-gray-700 pt-4 mb-6">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Módulos Principales</p>
                                <div className="flex flex-wrap mb-4">
                                    <PermissionBadge active={role.canAccessPOS} label="Caja/POS" />
                                    <PermissionBadge active={role.canAccessOrders} label="Pedidos" />
                                    <PermissionBadge active={role.canAccessDelivery} label="Reparto" />
                                    <PermissionBadge active={role.canAccessManagement} label="Gestión" />
                                </div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Permisos Internos</p>
                                <div className="flex flex-wrap">
                                    <PermissionBadge active={role.canAccessInventory} label="Inventario" />
                                    <PermissionBadge active={role.canAccessRH} label="RRHH" />
                                    <PermissionBadge active={role.canAccessFinances} label="Finanzas" />
                                    <PermissionBadge active={role.canAccessConfig} label="Config." />
                                    <PermissionBadge active={role.canAccessQuotes} label="Cotiz." />
                                    <PermissionBadge active={role.canAccessLeads} label="Prospección" />
                                    <PermissionBadge active={role.canAccessMarketing} label="Marketing" />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button 
                                    onClick={() => handleOpenModal(role)}
                                    className="p-2 text-gray-400 hover:text-primary transition-colors"
                                    title="Editar Rol"
                                >
                                    <FaEdit size={18} />
                                </button>
                                {!role.isSystem && (
                                    <button 
                                        onClick={() => handleDelete(role.id, role.isSystem)}
                                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                        title="Eliminar Rol"
                                    >
                                        <FaTrash size={18} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal de Creación/Edición Mejorado */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700 flex flex-col max-h-[90vh]">
                        
                        {/* Cabecera Fija */}
                        <div className="p-6 border-b border-gray-50 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/20">
                            <div>
                                <h2 className="text-xl font-black text-gray-800 dark:text-white uppercase tracking-tight flex items-center gap-2">
                                    {editingRole ? 'Editar Rol' : 'Crear Nuevo Rol'}
                                    {editingRole?.isSystem && (
                                        <span className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full">SISTEMA</span>
                                    )}
                                </h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Configura los permisos y alcances del perfil.</p>
                            </div>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                                <FaTimes size={20} />
                            </button>
                        </div>

                        {/* Cuerpo con Scroll */}
                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar">
                            <div className="p-8 space-y-8">
                                {/* Datos Básicos - Apilados para mayor espacio */}
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block italic">Nombre Identificador del Rol</label>
                                        <input 
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            required
                                            disabled={editingRole?.isSystem}
                                            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-4 font-black text-lg text-gray-800 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-tight"
                                            placeholder="Ej: REPARTIDOR_ZONA_NORTE"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block italic">Descripción de Responsabilidades y Alcances</label>
                                        <textarea 
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            rows="3"
                                            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-3 font-medium text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none"
                                            placeholder="Ej: Encargado de las entregas en la zona norte, tiene acceso al dashboard de reparto y puede gestionar el inventario local de su unidad..."
                                        />
                                    </div>
                                </div>

                                {/* Módulos Principales (Switchers Destacados) */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-px flex-1 bg-gray-100 dark:bg-gray-700"></div>
                                        <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Módulos Maestros (Pilares)</label>
                                        <div className="h-px flex-1 bg-gray-100 dark:bg-gray-700"></div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {[
                                            { id: 'canAccessPOS', label: 'Caja y Ventas (POS)', icon: 'payments', desc: 'Permite realizar ventas en mostrador.' },
                                            { id: 'canAccessOrders', label: 'Pedidos de Cliente', icon: 'shopping_cart', desc: 'Flujo de pedidos a domicilio.' },
                                            { id: 'canAccessDelivery', label: 'Dashboard Reparto', icon: 'local_shipping', desc: 'Gestión de rutas y entregas.' },
                                            { id: 'canAccessManagement', label: 'Panel de Gestión', icon: 'admin_panel_settings', desc: 'Acceso a estadísticas y administración.' },
                                        ].map((perm) => (
                                            <label key={perm.id} className="flex items-center justify-between p-4 rounded-2xl bg-blue-50/30 dark:bg-blue-900/5 border border-blue-100/50 dark:border-blue-800/20 hover:border-blue-300 dark:hover:border-blue-700 cursor-pointer transition-all group">
                                                <div className="flex gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                        <span className="material-symbols-outlined">{perm.icon}</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-gray-800 dark:text-gray-200">{perm.label}</p>
                                                        <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">{perm.desc}</p>
                                                    </div>
                                                </div>
                                                <div className="relative inline-flex items-center">
                                                    <input 
                                                        type="checkbox" 
                                                        name={perm.id}
                                                        checked={formData[perm.id]}
                                                        onChange={handleInputChange}
                                                        className="sr-only peer" 
                                                    />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Permisos Internos */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-px flex-1 bg-gray-100 dark:bg-gray-700"></div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Permisos de Gestión Interna</label>
                                        <div className="h-px flex-1 bg-gray-100 dark:bg-gray-700"></div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                        {[
                                            { id: 'canAccessInventory', label: 'Inventario', icon: 'inventory_2' },
                                            { id: 'canAccessRH', label: 'RRHH y Roles', icon: 'folder_managed' },
                                            { id: 'canAccessFinances', label: 'Finanzas', icon: 'account_balance_wallet' },
                                            { id: 'canAccessConfig', label: 'Configuración', icon: 'tune' },
                                            { id: 'canAccessQuotes', label: 'Cotizadores', icon: 'request_quote' },
                                            { id: 'canAccessLeads', label: 'Prospección', icon: 'trending_up' },
                                            { id: 'canAccessMarketing', label: 'Marketing', icon: 'bullhorn' },
                                        ].map((perm) => (
                                            <label key={perm.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-900/40 hover:bg-gray-100 dark:hover:bg-gray-900 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 cursor-pointer transition-all">
                                                <div className="flex items-center gap-3">
                                                    <span className="material-symbols-outlined text-gray-400 text-lg">{perm.icon}</span>
                                                    <span className="text-xs font-bold text-gray-600 dark:text-gray-400">{perm.label}</span>
                                                </div>
                                                <input 
                                                    type="checkbox" 
                                                    name={perm.id}
                                                    checked={formData[perm.id]}
                                                    onChange={handleInputChange}
                                                    className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2" 
                                                />
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Pie Fijo */}
                            <div className="p-6 border-t border-gray-50 dark:border-gray-700 flex gap-3 bg-gray-50/50 dark:bg-gray-900/20">
                                <button 
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="flex-1 py-4 px-4 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-black rounded-2xl uppercase tracking-widest text-xs hover:bg-gray-100 dark:hover:bg-gray-700 transition-all border border-gray-200 dark:border-gray-700"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit"
                                    className="flex-[2] py-4 px-4 bg-primary text-white font-black rounded-2xl uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 transition-all"
                                >
                                    {editingRole ? 'Guardar Cambios' : 'Crear Rol Maestro'}
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
