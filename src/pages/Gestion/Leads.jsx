import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
    FaUserPlus, FaPhone, FaBox, FaChartLine, FaFilter, FaPlus, FaSave, FaTrash 
} from 'react-icons/fa';
import apiClient from '../../api/apiClient';
import Swal from 'sweetalert2';

const Leads = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';
    
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingLead, setEditingLead] = useState(null);
    
    // Form state
    const [formData, setFormData] = useState({
        nombre: '',
        telefono: '',
        paqueteVendido: '',
        cantidadPaquetes: 1,
        direccion: '',
        ciudad: '',
        notas: '',
        insumosInteres: []
    });

    const [newInsumo, setNewInsumo] = useState({ item: '', cantidad: '', notas: '' });

    useEffect(() => {
        fetchLeads();
    }, []);

    const fetchLeads = async () => {
        try {
            const response = await apiClient.get('/leads');
            setLeads(response.data);
        } catch (error) {
            console.error('Error al obtener prospectos:', error);
            // Si hay error 403 o similar, al menos dejamos de cargar
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingLead) {
                await apiClient.put(`/leads/${editingLead.id}`, formData);
                Swal.fire({
                    title: '¡Actualizado!',
                    text: 'Los datos del cliente se han guardado correctamente.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
            } else {
                await apiClient.post('/leads', formData);
                Swal.fire({
                    title: '¡FELICIDADES! 🎉',
                    html: `Has registrado una nueva venta para <b>${formData.nombre}</b>.<br/>¡Sigue así, vas por excelente camino! 🚀`,
                    icon: 'success',
                    confirmButtonText: '¡Genial!',
                    confirmButtonColor: '#2563eb'
                });
            }
            setShowModal(false);
            setEditingLead(null);
            resetForm();
            fetchLeads();
        } catch (error) {
            Swal.fire('Error', error.response?.data?.error || 'No se pudo procesar la solicitud', 'error');
        }
    };

    const handleDelete = async (id, nombre) => {
        const result = await Swal.fire({
            title: '¿Eliminar prospecto?',
            text: `Estás a punto de borrar a ${nombre}. Esta acción no se puede deshacer.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await apiClient.delete(`/leads/${id}`);
                Swal.fire('Eliminado', 'El prospecto ha sido removido de tu cartera.', 'success');
                fetchLeads();
            } catch (error) {
                Swal.fire('Error', 'No se pudo eliminar el prospecto.', 'error');
            }
        }
    };

    const resetForm = () => {
        setFormData({
            nombre: '', telefono: '', paqueteVendido: '',
            cantidadPaquetes: 1, direccion: '', ciudad: '',
            notas: '', insumosInteres: []
        });
    };

    const addInsumo = () => {
        if (!newInsumo.item) return;
        setFormData({
            ...formData,
            insumosInteres: [...formData.insumosInteres, newInsumo]
        });
        setNewInsumo({ item: '', cantidad: '', notas: '' });
    };

    const removeInsumo = (index) => {
        const updated = formData.insumosInteres.filter((_, i) => i !== index);
        setFormData({ ...formData, insumosInteres: updated });
    };

    const statsByVendedor = leads.reduce((acc, lead) => {
        const vId = lead.vendedorId;
        if (!acc[vId]) {
            acc[vId] = { 
                name: lead.vendedor?.name || 'Desconocido', 
                leads: 0, 
                paquetes: 0 
            };
        }
        acc[vId].leads += 1;
        acc[vId].paquetes += lead.cantidadPaquetes || 0;
        return acc;
    }, {});

    if (loading) return (
        <div className="p-8 text-center flex flex-col items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
            <p className="text-gray-500 font-medium italic">Cargando módulo de prospección...</p>
        </div>
    );

    return (
        <div className="p-4 md:p-8 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                    <FaChartLine className="text-primary" />
                    {isAdmin ? 'Módulo de Prospección (Global)' : 'Mis Clientes y Ventas'}
                </h1>
                {!isAdmin && (
                    <button 
                        onClick={() => { resetForm(); setShowModal(true); }}
                        className="btn-primary flex items-center gap-2"
                    >
                        <FaPlus /> Nuevo Prospecto
                    </button>
                )}
            </div>

            {isAdmin && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border-l-4 border-blue-500">
                        <p className="text-sm text-gray-500 uppercase font-bold tracking-wider">Total Prospectos</p>
                        <p className="text-3xl font-black">{leads.length}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border-l-4 border-green-500">
                        <p className="text-sm text-gray-500 uppercase font-bold tracking-wider">Vendedores Activos</p>
                        <p className="text-3xl font-black">{Object.keys(statsByVendedor).length}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border-l-4 border-purple-500">
                        <p className="text-sm text-gray-500 uppercase font-bold tracking-wider">Paquetes Colocados</p>
                        <p className="text-3xl font-black">
                            {leads.reduce((sum, l) => sum + (l.cantidadPaquetes || 0), 0)}
                        </p>
                    </div>
                </div>
            )}

            {isAdmin && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden animate-fade-in">
                    <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                        <h2 className="font-bold flex items-center gap-2">
                            <FaFilter /> Desempeño por Vendedor
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="text-xs uppercase bg-gray-100 dark:bg-gray-700">
                                <tr>
                                    <th className="p-4">Vendedor</th>
                                    <th className="p-4 text-center">Cartera (Leads)</th>
                                    <th className="p-4 text-center">Ventas (Unidades)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.values(statsByVendedor).map((stat, idx) => (
                                    <tr key={idx} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750">
                                        <td className="p-4 font-medium">{stat.name}</td>
                                        <td className="p-4 text-center">{stat.leads}</td>
                                        <td className="p-4 text-center">{stat.paquetes}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {leads.map(lead => (
                    <div key={lead.id} className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow border dark:border-gray-700 hover:shadow-lg transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h3 className="text-xl font-bold text-primary">{lead.nombre}</h3>
                                <p className="text-sm text-gray-500 flex items-center gap-1">
                                    <FaPhone className="text-xs" /> {lead.telefono}
                                </p>
                            </div>
                            <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-1 rounded-full font-black uppercase tracking-widest">
                                {lead.status}
                            </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                            <div className="bg-gray-50 dark:bg-gray-900/40 p-2 rounded-lg">
                                <p className="text-[10px] uppercase font-bold text-gray-400">Paquete</p>
                                <p className="font-semibold text-gray-700 dark:text-gray-200">{lead.paqueteVendido || 'N/A'}</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-900/40 p-2 rounded-lg">
                                <p className="text-[10px] uppercase font-bold text-gray-400">Cantidad</p>
                                <p className="font-semibold text-gray-700 dark:text-gray-200">{lead.cantidadPaquetes} unid.</p>
                            </div>
                        </div>

                        {lead.insumosInteres?.length > 0 && (
                            <div className="mb-4">
                                <p className="text-[10px] font-bold uppercase text-gray-400 mb-2">Insumos de Interés:</p>
                                <div className="flex flex-wrap gap-2">
                                    {lead.insumosInteres.map((ins, i) => (
                                        <span key={i} className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded text-[10px] font-bold border border-emerald-100 dark:border-emerald-800/50">
                                            {ins.item} ({ins.cantidad})
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between items-center pt-4 border-t dark:border-gray-700">
                            <p className="text-[10px] text-gray-400 uppercase font-bold">
                                {isAdmin ? `Vendedor: ${lead.vendedor?.name}` : `Registrado: ${new Date(lead.createdAt).toLocaleDateString()}`}
                            </p>
                            <div className="flex gap-4">
                                <button 
                                    onClick={() => { setEditingLead(lead); setFormData(lead); setShowModal(true); }}
                                    className="text-primary hover:underline text-xs font-black uppercase tracking-wider flex items-center gap-1"
                                >
                                    Editar
                                </button>
                                <button 
                                    onClick={() => handleDelete(lead.id, lead.nombre)}
                                    className="text-red-500 hover:underline text-xs font-black uppercase tracking-wider flex items-center gap-1"
                                >
                                    <FaTrash className="text-[10px]" /> Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                {leads.length === 0 && (
                    <div className="lg:col-span-2 py-20 text-center bg-gray-50 dark:bg-gray-900/30 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800">
                        <p className="text-gray-500 font-medium italic">No se encontraron prospectos registrados.</p>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center bg-primary text-white">
                            <div>
                                <h2 className="text-xl font-black uppercase tracking-tight">
                                    {editingLead ? 'Editar Prospecto' : 'Registrar Nuevo Cliente'}
                                </h2>
                                <p className="text-xs opacity-80 font-medium">Completa los datos de la venta de campo.</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-3xl hover:scale-110 transition-transform">&times;</button>
                        </div>
                        
                        <form onSubmit={handleSave} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 block">Nombre Completo *</label>
                                    <input 
                                        type="text" required
                                        className="w-full p-3 rounded-xl border dark:bg-gray-900 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none transition-all"
                                        value={formData.nombre}
                                        onChange={e => setFormData({...formData, nombre: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 block">Teléfono / WhatsApp *</label>
                                    <input 
                                        type="tel" required
                                        className="w-full p-3 rounded-xl border dark:bg-gray-900 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none transition-all"
                                        value={formData.telefono}
                                        onChange={e => setFormData({...formData, telefono: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 block">Paquete Vendido</label>
                                    <input 
                                        type="text"
                                        placeholder="Ej: Planta Pro 1200"
                                        className="w-full p-3 rounded-xl border dark:bg-gray-900 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none transition-all"
                                        value={formData.paqueteVendido}
                                        onChange={e => setFormData({...formData, paqueteVendido: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 block">Cantidad</label>
                                    <input 
                                        type="number"
                                        className="w-full p-3 rounded-xl border dark:bg-gray-900 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none transition-all"
                                        value={formData.cantidadPaquetes}
                                        onChange={e => setFormData({...formData, cantidadPaquetes: parseInt(e.target.value)})}
                                    />
                                </div>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-900/50 p-5 rounded-2xl space-y-4 border border-gray-100 dark:border-gray-700">
                                <h4 className="font-black text-[10px] uppercase tracking-widest flex items-center gap-2 text-primary">
                                    <FaBox /> Seguimiento de Insumos (Opcional)
                                </h4>
                                <div className="flex flex-wrap sm:flex-nowrap gap-2">
                                    <input 
                                        type="text" placeholder="Insumo (Tapas, etc)"
                                        className="flex-1 p-3 text-sm rounded-xl border dark:bg-gray-900 dark:border-gray-700 outline-none"
                                        value={newInsumo.item}
                                        onChange={e => setNewInsumo({...newInsumo, item: e.target.value})}
                                    />
                                    <input 
                                        type="text" placeholder="Cant."
                                        className="w-24 p-3 text-sm rounded-xl border dark:bg-gray-900 dark:border-gray-700 outline-none"
                                        value={newInsumo.cantidad}
                                        onChange={e => setNewInsumo({...newInsumo, cantidad: e.target.value})}
                                    />
                                    <button 
                                        type="button" onClick={addInsumo}
                                        className="bg-primary text-white p-3 rounded-xl hover:scale-105 active:scale-95 transition-transform"
                                    >
                                        <FaPlus />
                                    </button>
                                </div>
                                
                                <div className="flex flex-wrap gap-2">
                                    {formData.insumosInteres.map((ins, i) => (
                                        <div key={i} className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg text-xs font-bold shadow-sm border border-gray-100 dark:border-gray-700">
                                            <span>{ins.item}: {ins.cantidad}</span>
                                            <button type="button" onClick={() => removeInsumo(i)} className="text-red-500 hover:scale-110 transition-transform">
                                                <FaTrash size={10} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 block">Dirección o Notas de Ubicación</label>
                                <textarea 
                                    className="w-full p-3 rounded-xl border dark:bg-gray-900 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none transition-all resize-none"
                                    rows="2"
                                    placeholder="Ej: A dos cuadras del parque central..."
                                    value={formData.direccion}
                                    onChange={e => setFormData({...formData, direccion: e.target.value})}
                                ></textarea>
                            </div>

                            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t dark:border-gray-700">
                                <button 
                                    type="button" onClick={() => setShowModal(false)}
                                    className="px-8 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 hover:bg-gray-200 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit"
                                    className="px-8 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] bg-primary text-white shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2"
                                >
                                    <FaSave /> {editingLead ? 'Actualizar Datos' : 'Registrar Prospecto'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Leads;
