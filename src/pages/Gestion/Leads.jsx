import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
    FaUserPlus, FaPhone, FaBox, FaChartLine, FaFilter, FaPlus, FaSave, 
    FaTrash, FaTools, FaUserClock, FaCheckCircle, FaExchangeAlt, FaCalendarAlt,
    FaWhatsapp, FaFilePdf, FaShareAlt, FaTimes
} from 'react-icons/fa';
import apiClient from '../../api/apiClient';
import Swal from 'sweetalert2';

const Leads = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';

    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [packages, setPackages] = useState([]); 
    const [activeTab, setActiveTab] = useState('PROSPECTO'); 
    const [showModal, setShowModal] = useState(false);
    const [showToolsModal, setShowToolsModal] = useState(false); 
    const [editingLead, setEditingLead] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        nombre: '',
        telefono: '',
        tipo: 'PROSPECTO',
        paqueteVendido: '',
        cantidadPaquetes: 1,
        direccion: '',
        ciudad: '',
        notas: '',
        insumosInteres: [],
        mantenimientos: []
    });

    const [newInsumo, setNewInsumo] = useState({ item: '', cantidad: '', notas: '' });
    const [newManto, setNewManto] = useState({ equipo: '', frecuencia: '', proximaFecha: '' });

    useEffect(() => {
        fetchLeads();
        fetchPackages();
    }, []);

    const fetchLeads = async () => {
        try {
            const response = await apiClient.get('/leads');
            setLeads(response.data);
        } catch (error) {
            console.error('Error al obtener leads:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPackages = async () => {
        try {
            const response = await apiClient.get('/utils/pdfs');
            const mapped = (response.data || []).map(p => {
                const isPackage = p.name.toLowerCase().includes('paquete');
                const isCatalog = p.name.toLowerCase().includes('catalogo') || p.name.toLowerCase().includes('insumo');
                return {
                    ...p,
                    icon: isPackage ? 'rocket_launch' : (isCatalog ? 'inventory_2' : 'description'),
                    color: isPackage ? 'text-blue-600' : (isCatalog ? 'text-indigo-600' : 'text-emerald-600')
                };
            });
            setPackages(mapped);
        } catch (error) {
            console.error('Error al obtener paquetes:', error);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingLead) {
                await apiClient.put(`/leads/${editingLead.id}`, formData);
                Swal.fire('¡Actualizado!', 'Datos guardados correctamente.', 'success');
            } else {
                await apiClient.post('/leads', formData);
                Swal.fire({
                    title: formData.tipo === 'CLIENTE_VENTA' ? '¡VENTA REGISTRADA! 🎉' : '¡PROSPECTO REGISTRADO!',
                    text: `Se ha añadido a ${formData.nombre} a tu cartera.`,
                    icon: 'success',
                    confirmButtonColor: '#2563eb'
                });
            }
            setShowModal(false);
            setEditingLead(null);
            resetForm();
            fetchLeads();
        } catch (error) {
            Swal.fire('Error', error.response?.data?.error || 'No se pudo guardar', 'error');
        }
    };

    const handleConvertToSale = async (lead) => {
        const result = await Swal.fire({
            title: '¿Confirmar Venta?',
            text: `¿Deseas convertir a ${lead.nombre} en un cliente con venta realizada?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, ¡Vendí!',
            confirmButtonColor: '#10b981'
        });

        if (result.isConfirmed) {
            try {
                await apiClient.put(`/leads/${lead.id}`, { tipo: 'CLIENTE_VENTA', status: 'CERRADO' });
                Swal.fire('¡Felicidades!', 'Venta registrada con éxito.', 'success');
                fetchLeads();
                setActiveTab('CLIENTE_VENTA');
            } catch (error) {
                Swal.fire('Error', 'No se pudo procesar la conversión.', 'error');
            }
        }
    };

    const handleDelete = async (id, nombre) => {
        const result = await Swal.fire({
            title: '¿Eliminar registro?',
            text: `Se borrará a ${nombre}. Esta acción no se puede deshacer.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Sí, eliminar'
        });

        if (result.isConfirmed) {
            try {
                await apiClient.delete(`/leads/${id}`);
                Swal.fire('Eliminado', 'Registro removido.', 'success');
                fetchLeads();
            } catch (error) {
                Swal.fire('Error', 'No se pudo eliminar.', 'error');
            }
        }
    };

    const resetForm = () => {
        setFormData({
            nombre: '', telefono: '', tipo: activeTab, paqueteVendido: '',
            cantidadPaquetes: 1, direccion: '', ciudad: '',
            notas: '', insumosInteres: [], mantenimientos: []
        });
    };

    const addInsumo = () => {
        if (!newInsumo.item) return;
        setFormData({ ...formData, insumosInteres: [...formData.insumosInteres, newInsumo] });
        setNewInsumo({ item: '', cantidad: '', notas: '' });
    };

    const addManto = () => {
        if (!newManto.equipo || !newManto.proximaFecha) return;
        setFormData({ ...formData, mantenimientos: [...formData.mantenimientos, newManto] });
        setNewManto({ equipo: '', frecuencia: '', proximaFecha: '' });
    };

    const handleSendWhatsApp = (lead, pkg = null) => {
        const phone = lead.telefono.replace(/\D/g, '');
        let message = `Hola *${lead.nombre}*, un gusto saludarte de *Darmax Agua Purificada* 💧\n\n`;
        if (pkg) {
            message += `Tal como platicamos, te adjunto la información detallada del *${pkg.name}*.\n\n`;
            message += `📂 *Puedes descargar el catálogo aquí:* \n${window.location.origin}${pkg.file}\n\n`;
            message += `Quedo atento a tus dudas para ayudarte a iniciar tu proyecto. 🚀`;
        } else {
            message += `Te contacto para dar seguimiento a tu interés en nuestros equipos de purificación. ¿En qué podemos apoyarte hoy?`;
        }
        const url = `https://wa.me/52${phone}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    const filteredLeads = leads.filter(l => l.tipo === activeTab);
    const totalVentas = leads.filter(l => l.tipo === 'CLIENTE_VENTA').length;
    const totalProspectos = leads.filter(l => l.tipo === 'PROSPECTO').length;

    if (loading) return (
        <div className="p-8 text-center flex flex-col items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mb-4"></div>
            <p className="text-gray-500 text-sm font-medium italic">Cargando CRM...</p>
        </div>
    );

    return (
        <div className="p-3 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-gray-800 dark:text-white flex items-center gap-3 tracking-tighter uppercase">
                        <FaChartLine className="text-primary shrink-0" />
                        CRM Ventas
                    </h1>
                    <p className="text-[10px] sm:text-xs text-gray-500 font-medium italic">Prospectos y seguimiento post-venta.</p>
                </div>
                <div className="flex w-full md:w-auto gap-2">
                    <button 
                        onClick={() => setShowToolsModal(true)}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-xl font-bold text-[10px] uppercase hover:bg-amber-200 transition-all shadow-sm"
                    >
                        <FaTools /> Herramientas
                    </button>
                    {!isAdmin && (
                        <button 
                            onClick={() => { resetForm(); setShowModal(true); }}
                            className="flex-1 md:flex-none btn-primary flex items-center justify-center gap-2 py-2.5 px-4 shadow-lg shadow-primary/20 text-[10px]"
                        >
                            <FaPlus /> {activeTab === 'PROSPECTO' ? 'Nuevo Lead' : 'Nueva Venta'}
                        </button>
                    )}
                </div>
            </div>

            {/* Quick Stats Banner */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-3">
                    <div className="bg-blue-100 text-blue-600 p-2 sm:p-3 rounded-lg sm:rounded-xl text-xs sm:text-base"><FaUserClock /></div>
                    <div>
                        <p className="text-[8px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Prospectos</p>
                        <p className="text-sm sm:text-xl font-black leading-none">{totalProspectos}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-3">
                    <div className="bg-green-100 text-green-600 p-2 sm:p-3 rounded-lg sm:rounded-xl text-xs sm:text-base"><FaCheckCircle /></div>
                    <div>
                        <p className="text-[8px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Cerradas</p>
                        <p className="text-sm sm:text-xl font-black leading-none">{totalVentas}</p>
                    </div>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex bg-gray-100 dark:bg-gray-900/50 p-1 rounded-xl w-full sm:w-fit overflow-x-auto">
                <button 
                    onClick={() => setActiveTab('PROSPECTO')}
                    className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'PROSPECTO' ? 'bg-white dark:bg-gray-800 shadow-sm text-primary' : 'text-gray-500'}`}
                >
                    Prospectos
                </button>
                <button 
                    onClick={() => setActiveTab('CLIENTE_VENTA')}
                    className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'CLIENTE_VENTA' ? 'bg-white dark:bg-gray-800 shadow-sm text-green-600' : 'text-gray-500'}`}
                >
                    Cartera
                </button>
            </div>

            {/* Leads List Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {filteredLeads.map(lead => (
                    <div key={lead.id} className="bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm border border-gray-50 dark:border-gray-700 hover:shadow-md transition-all group overflow-hidden relative">
                        <div className={`absolute top-0 right-0 px-3 py-1 text-[7px] sm:text-[8px] font-black uppercase tracking-[2px] rounded-bl-lg ${lead.tipo === 'CLIENTE_VENTA' ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'}`}>
                            {lead.tipo === 'CLIENTE_VENTA' ? 'Cliente' : 'Lead'}
                        </div>

                        <div className="flex justify-between items-start mb-3 sm:mb-4">
                            <div className="min-w-0 pr-10">
                                <h3 className="text-base sm:text-lg font-black text-gray-800 dark:text-white truncate">{lead.nombre}</h3>
                                <p className="text-[10px] sm:text-xs text-gray-500 font-bold flex items-center gap-2 mt-0.5">
                                    <FaPhone className="text-primary shrink-0" /> {lead.telefono}
                                </p>
                            </div>
                        </div>
                        
                        {lead.tipo === 'CLIENTE_VENTA' && (
                            <div className="grid grid-cols-2 gap-2 sm:gap-4 text-xs mb-3 sm:mb-4">
                                <div className="bg-gray-50 dark:bg-gray-900/40 p-2 sm:p-3 rounded-xl sm:rounded-2xl">
                                    <p className="text-[7px] sm:text-[9px] uppercase font-black text-gray-400 tracking-tighter">Instalación</p>
                                    <p className="font-bold text-gray-700 dark:text-gray-200 truncate text-[10px] sm:text-sm">{lead.paqueteVendido || 'Personalizado'}</p>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-900/40 p-2 sm:p-3 rounded-xl sm:rounded-2xl">
                                    <p className="text-[7px] sm:text-[9px] uppercase font-black text-gray-400 tracking-tighter">Próximo Manto.</p>
                                    <p className="font-bold text-orange-600 text-[10px] sm:text-sm">
                                        {lead.mantenimientos?.[0]?.proximaFecha || 'N/A'}
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-wrap justify-between items-center pt-3 border-t border-gray-50 dark:border-gray-700 gap-2">
                            <p className="text-[8px] text-gray-400 uppercase font-black tracking-widest shrink-0">
                                {isAdmin ? `Vnd: ${lead.vendedor?.name?.split(' ')[0]}` : `D: ${new Date(lead.createdAt).toLocaleDateString()}`}
                            </p>
                            <div className="flex gap-2 sm:gap-3 ml-auto">
                                {lead.tipo === 'PROSPECTO' && (
                                    <button 
                                        onClick={() => handleConvertToSale(lead)}
                                        className="text-green-600 hover:scale-110 transition-transform text-[9px] font-black uppercase flex items-center gap-1"
                                    >
                                        <FaExchangeAlt size={10} /> Cerrar
                                    </button>
                                )}
                                <button 
                                    onClick={() => { setEditingLead(lead); setFormData(lead); setShowModal(true); }}
                                    className="text-primary hover:scale-110 transition-transform text-[9px] font-black uppercase"
                                >
                                    Edit
                                </button>
                                <button 
                                    onClick={() => { setEditingLead(lead); setShowToolsModal(true); }}
                                    className="text-emerald-600 hover:scale-110 transition-transform text-[9px] font-black uppercase flex items-center gap-1"
                                >
                                    <FaWhatsapp size={12} /> Info
                                </button>
                                <button 
                                    onClick={() => handleDelete(lead.id, lead.nombre)}
                                    className="text-red-500 hover:scale-110 transition-transform text-[9px] font-black uppercase"
                                >
                                    <FaTrash size={10} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {filteredLeads.length === 0 && (
                <div className="py-16 text-center bg-gray-50 dark:bg-gray-900/30 rounded-[32px] border-2 border-dashed border-gray-200 dark:border-gray-800">
                    <p className="text-gray-400 font-bold italic text-sm px-10">No hay registros aún.</p>
                </div>
            )}

            {/* Tools Modal */}
            {showToolsModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-3 sm:p-4">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                        <div className="p-5 border-b dark:border-gray-700 flex justify-between items-center bg-amber-500 text-white shrink-0">
                            <div>
                                <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-3">
                                    <FaTools size={18} /> Herramientas
                                </h2>
                                {editingLead && <p className="text-[8px] font-bold opacity-80 uppercase mt-0.5 truncate max-w-[200px]">Para: {editingLead.nombre}</p>}
                            </div>
                            <button onClick={() => { setShowToolsModal(false); setEditingLead(null); }} className="p-2 hover:bg-white/20 rounded-full transition-colors text-2xl">&times;</button>
                        </div>
                        
                        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 bg-gray-50/30 dark:bg-gray-900/20">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                                {packages.length > 0 ? (
                                    packages.map((pkg) => (
                                        <div key={pkg.id} className="group flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-2xl border-2 border-transparent hover:border-amber-500 transition-all shadow-sm">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={`w-9 h-9 rounded-xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center shrink-0 ${pkg.color}`}>
                                                    <span className="material-symbols-outlined text-lg">{pkg.icon}</span>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-black text-gray-800 dark:text-white text-[10px] sm:text-xs truncate">{pkg.name}</p>
                                                    <p className="text-[8px] text-gray-400 font-bold uppercase mt-0.5">Catálogo PDF</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-1.5 shrink-0">
                                                <a 
                                                    href={pkg.file} target="_blank" rel="noopener noreferrer"
                                                    className="p-2 bg-gray-50 dark:bg-gray-700 text-gray-400 hover:text-red-500 rounded-lg transition-colors border border-gray-100 dark:border-gray-600"
                                                >
                                                    <FaFilePdf size={14} />
                                                </a>
                                                {editingLead && (
                                                    <button 
                                                        onClick={() => handleSendWhatsApp(editingLead, pkg)}
                                                        className="p-2 bg-green-500 text-white rounded-lg shadow-md hover:scale-110 active:scale-95 transition-all flex items-center gap-1.5"
                                                    >
                                                        <FaWhatsapp size={14} />
                                                        <span className="text-[8px] font-black uppercase hidden sm:inline">Enviar</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full text-center py-12 opacity-50 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl">
                                        <p className="text-xs font-bold text-gray-400 italic">No hay archivos en el servidor.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="p-3 bg-white dark:bg-gray-800 text-center border-t dark:border-gray-700 shrink-0">
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
                                {packages.length} archivos • Darmax CRM
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* CRM Form Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-3">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-4 duration-300">
                        <div className="p-5 sm:p-6 border-b dark:border-gray-700 flex justify-between items-center bg-gray-800 text-white shrink-0">
                            <div>
                                <h2 className="text-lg font-black uppercase italic tracking-tight">
                                    {editingLead ? 'Ficha Cliente' : 'Nuevo Registro'}
                                </h2>
                                <p className="text-[8px] font-bold text-gray-400 mt-1 uppercase tracking-[2px]">CRM SEGUIMIENTO</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-3xl p-2">&times;</button>
                        </div>
                        
                        <form onSubmit={handleSave} className="p-5 sm:p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                            {/* Contacto */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-primary uppercase border-l-4 border-primary pl-2">Contacto</h4>
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black uppercase text-gray-400 ml-1">Nombre Completo *</label>
                                        <input type="text" required className="w-full bg-gray-50 dark:bg-gray-900 p-3.5 rounded-xl border border-transparent focus:border-primary outline-none transition-all text-sm font-bold" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black uppercase text-gray-400 ml-1">WhatsApp *</label>
                                        <input type="tel" required className="w-full bg-gray-50 dark:bg-gray-900 p-3.5 rounded-xl border border-transparent focus:border-primary outline-none transition-all text-sm font-bold" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} />
                                    </div>
                                </div>
                            </div>

                            {/* Venta */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-green-600 uppercase border-l-4 border-green-600 pl-2">Venta</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black uppercase text-gray-400 ml-1">Paquete</label>
                                        <input type="text" className="w-full bg-gray-50 dark:bg-gray-900 p-3.5 rounded-xl border border-transparent focus:border-green-500 outline-none transition-all text-sm font-bold" value={formData.paqueteVendido} onChange={e => setFormData({...formData, paqueteVendido: e.target.value})} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black uppercase text-gray-400 ml-1">Tipo</label>
                                        <select className="w-full bg-gray-50 dark:bg-gray-900 p-3.5 rounded-xl border border-transparent focus:border-green-500 outline-none text-sm font-bold" value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})}>
                                            <option value="PROSPECTO">Prospecto</option>
                                            <option value="CLIENTE_VENTA">Cliente</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Mantenimientos */}
                            <div className="p-4 bg-orange-50 dark:bg-orange-900/10 rounded-3xl border border-orange-100 dark:border-orange-800/30 space-y-3">
                                <h4 className="font-black text-[10px] uppercase flex items-center gap-2 text-orange-700">
                                    <FaTools size={12}/> Mantenimientos
                                </h4>
                                <div className="flex flex-col gap-2">
                                    <input type="text" placeholder="Equipo" className="p-3 text-xs rounded-xl border dark:bg-gray-900 dark:border-gray-700 outline-none" value={newManto.equipo} onChange={e => setNewManto({...newManto, equipo: e.target.value})} />
                                    <div className="flex gap-2">
                                        <input type="date" className="flex-1 p-3 text-xs rounded-xl border dark:bg-gray-900 dark:border-gray-700" value={newManto.proximaFecha} onChange={e => setNewManto({...newManto, proximaFecha: e.target.value})} />
                                        <button type="button" onClick={addManto} className="bg-orange-600 text-white p-3 rounded-xl active:scale-90 transition-transform"><FaPlus /></button>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {formData.mantenimientos?.map((m, i) => (
                                        <div key={i} className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg text-[9px] font-black border border-orange-100 shadow-sm uppercase">
                                            <span>{m.equipo} - {m.proximaFecha}</span>
                                            <button type="button" onClick={() => {
                                                const updated = formData.mantenimientos.filter((_, idx) => idx !== i);
                                                setFormData({...formData, mantenimientos: updated});
                                            }} className="text-red-500"><FaTrash size={8} /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t dark:border-gray-700 shrink-0">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 rounded-xl font-black uppercase text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-500 transition-colors order-2 sm:order-1">Cancelar</button>
                                <button type="submit" className="flex-1 py-4 rounded-xl font-black uppercase text-[10px] bg-primary text-white shadow-xl shadow-primary/20 order-1 sm:order-2 flex items-center justify-center gap-2">
                                    <FaSave /> {editingLead ? 'Actualizar' : 'Guardar'}
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
