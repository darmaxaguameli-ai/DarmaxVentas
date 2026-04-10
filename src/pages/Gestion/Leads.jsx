import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
    FaUserPlus, FaPhone, FaBox, FaChartLine, FaFilter, FaPlus, FaSave, 
    FaTrash, FaTools, FaUserClock, FaCheckCircle, FaExchangeAlt, FaCalendarAlt,
    FaWhatsapp, FaFilePdf, FaShareAlt, FaTimes, FaMapMarkerAlt, FaStickyNote, FaLayerGroup,
    FaUser
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
            const payload = {
                ...formData,
                cantidadPaquetes: parseInt(formData.cantidadPaquetes) || 0
            };

            if (editingLead) {
                await apiClient.put(`/leads/${editingLead.id}`, payload);
                Swal.fire({
                    title: '¡Ficha Actualizada!',
                    text: 'Los datos del cliente se guardaron con éxito.',
                    icon: 'success',
                    confirmButtonColor: '#2563eb',
                    timer: 2000
                });
            } else {
                await apiClient.post('/leads', payload);
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
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#6b7280',
            reverseButtons: true
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
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, eliminar',
            reverseButtons: true
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
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-gray-800 dark:text-white flex items-center gap-3 tracking-tighter uppercase">
                        <FaChartLine className="text-primary shrink-0" />
                        CRM Ventas
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-500 font-medium italic">Prospectos y seguimiento post-venta.</p>
                </div>
                <div className="flex w-full md:w-auto gap-2">
                    <button 
                        onClick={() => setShowToolsModal(true)}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-xl font-bold text-xs uppercase hover:bg-amber-200 transition-all shadow-sm"
                    >
                        <FaTools /> Herramientas
                    </button>
                    {!isAdmin && (
                        <button 
                            onClick={() => { resetForm(); setShowModal(true); }}
                            className="flex-1 md:flex-none btn-primary flex items-center justify-center gap-2 py-2.5 px-6 shadow-xl shadow-primary/20 text-xs"
                        >
                            <FaPlus /> {activeTab === 'PROSPECTO' ? 'Nuevo Lead' : 'Nueva Venta'}
                        </button>
                    )}
                </div>
            </div>

            {/* Quick Stats Banner */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-3">
                    <div className="bg-blue-100 text-blue-600 p-2 sm:p-3 rounded-xl text-sm sm:text-lg"><FaUserClock /></div>
                    <div>
                        <p className="text-[8px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Prospectos</p>
                        <p className="text-base sm:text-2xl font-black leading-none">{totalProspectos}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-3">
                    <div className="bg-green-100 text-green-600 p-2 sm:p-3 rounded-xl text-sm sm:text-lg"><FaCheckCircle /></div>
                    <div>
                        <p className="text-[8px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Cerradas</p>
                        <p className="text-base sm:text-2xl font-black leading-none">{totalVentas}</p>
                    </div>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex bg-gray-100 dark:bg-gray-900/50 p-1 rounded-xl w-full sm:w-fit overflow-x-auto">
                <button 
                    onClick={() => setActiveTab('PROSPECTO')}
                    className={`flex-1 sm:flex-none px-4 sm:px-8 py-2.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'PROSPECTO' ? 'bg-white dark:bg-gray-800 shadow-sm text-primary' : 'text-gray-500'}`}
                >
                    Prospectos
                </button>
                <button 
                    onClick={() => setActiveTab('CLIENTE_VENTA')}
                    className={`flex-1 sm:flex-none px-4 sm:px-8 py-2.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'CLIENTE_VENTA' ? 'bg-white dark:bg-gray-800 shadow-sm text-green-600' : 'text-gray-500'}`}
                >
                    Cartera
                </button>
            </div>

            {/* Leads List Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredLeads.map(lead => (
                    <div key={lead.id} className="bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm border border-gray-50 dark:border-gray-700 hover:shadow-md transition-all group overflow-hidden relative">
                        <div className={`absolute top-0 right-0 px-3 py-1 text-[7px] sm:text-[8px] font-black uppercase tracking-[2px] rounded-bl-lg ${lead.tipo === 'CLIENTE_VENTA' ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'}`}>
                            {lead.tipo === 'CLIENTE_VENTA' ? 'Cliente' : 'Lead'}
                        </div>

                        <div className="flex justify-between items-start mb-3 sm:mb-4">
                            <div className="min-w-0 pr-10">
                                <h3 className="text-base sm:text-xl font-black text-gray-800 dark:text-white truncate">{lead.nombre}</h3>
                                <p className="text-[10px] sm:text-sm text-gray-500 font-bold flex items-center gap-2 mt-1">
                                    <FaPhone className="text-primary shrink-0" /> {lead.telefono}
                                </p>
                            </div>
                        </div>
                        
                        {lead.tipo === 'CLIENTE_VENTA' && (
                            <div className="grid grid-cols-2 gap-2 sm:gap-4 text-xs mb-3 sm:mb-4">
                                <div className="bg-gray-50 dark:bg-gray-900/40 p-2 sm:p-3 rounded-xl sm:rounded-2xl">
                                    <p className="text-[7px] sm:text-[9px] uppercase font-black text-gray-400 tracking-tighter">Instalación</p>
                                    <p className="font-bold text-gray-700 dark:text-gray-200 truncate text-[10px] sm:text-base">{lead.paqueteVendido || 'Personalizado'}</p>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-900/40 p-2 sm:p-3 rounded-xl sm:rounded-2xl">
                                    <p className="text-[7px] sm:text-[9px] uppercase font-black text-gray-400 tracking-tighter">Próximo Manto.</p>
                                    <p className="font-bold text-orange-600 text-[10px] sm:text-base">
                                        {lead.mantenimientos?.[0]?.proximaFecha || 'N/A'}
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-wrap justify-between items-center pt-3 sm:pt-4 border-t border-gray-50 dark:border-gray-700 gap-2">
                            <p className="text-[8px] sm:text-[10px] text-gray-400 uppercase font-black tracking-widest shrink-0">
                                {isAdmin ? `Vnd: ${lead.vendedor?.name?.split(' ')[0]}` : `Desde: ${new Date(lead.createdAt).toLocaleDateString()}`}
                            </p>
                            <div className="flex gap-2 sm:gap-3 ml-auto">
                                {lead.tipo === 'PROSPECTO' && (
                                    <button 
                                        onClick={() => handleConvertToSale(lead)}
                                        className="text-green-600 hover:scale-110 transition-transform text-[9px] sm:text-[10px] font-black uppercase flex items-center gap-1"
                                    >
                                        <FaExchangeAlt size={10} /> Cerrar
                                    </button>
                                )}
                                <button 
                                    onClick={() => { setEditingLead(lead); setFormData(lead); setShowModal(true); }}
                                    className="text-primary hover:scale-110 transition-transform text-[9px] sm:text-[10px] font-black uppercase"
                                >
                                    Editar
                                </button>
                                <button 
                                    onClick={() => { setEditingLead(lead); setShowToolsModal(true); }}
                                    className="text-emerald-600 hover:scale-110 transition-transform text-[9px] sm:text-[10px] font-black uppercase flex items-center gap-1"
                                >
                                    <FaWhatsapp size={12} /> Info
                                </button>
                                <button 
                                    onClick={() => handleDelete(lead.id, lead.nombre)}
                                    className="text-red-500 hover:scale-110 transition-transform text-[9px] sm:text-[10px] font-black uppercase"
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

            {/* ====================================================================
                MODAL TOOLS (FULL VIEWPORT BACKDROP)
            ==================================================================== */}
            {showToolsModal && (
                <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => { setShowToolsModal(false); setEditingLead(null); }}></div>
                    <div className="relative bg-white dark:bg-gray-800 w-full max-w-2xl mx-auto rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in slide-in-from-bottom-10 sm:zoom-in duration-300">
                        <div className="p-5 sm:p-6 border-b dark:border-gray-700 flex justify-between items-center bg-amber-500 text-white shrink-0">
                            <div>
                                <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight flex items-center gap-3">
                                    <FaTools size={18} /> Herramientas
                                </h2>
                                {editingLead && <p className="text-[8px] sm:text-[10px] font-bold opacity-80 uppercase mt-0.5 truncate max-w-[250px]">Enviar a: {editingLead.nombre}</p>}
                            </div>
                            <button onClick={() => { setShowToolsModal(false); setEditingLead(null); }} className="p-2 hover:bg-white/20 rounded-full transition-colors text-2xl font-light">&times;</button>
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
                                                    <p className="text-[8px] text-gray-400 font-bold uppercase mt-0.5 leading-none">Catálogo PDF</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-1.5 shrink-0">
                                                <a href={pkg.file} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-gray-50 dark:bg-gray-700 text-gray-400 hover:text-red-500 rounded-xl border border-gray-100 dark:border-gray-600 transition-colors"><FaFilePdf size={14} /></a>
                                                {editingLead && <button onClick={() => handleSendWhatsApp(editingLead, pkg)} className="p-2.5 bg-green-500 text-white rounded-xl shadow-md hover:scale-110 active:scale-95 transition-all flex items-center gap-1.5"><FaWhatsapp size={14} /><span className="text-[8px] font-black uppercase hidden sm:inline">Enviar</span></button>}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full text-center py-12 opacity-50 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl"><p className="text-xs font-bold text-gray-400 italic">No hay archivos en el servidor.</p></div>
                                )}
                            </div>
                        </div>
                        <div className="p-3 bg-white dark:bg-gray-800 text-center border-t dark:border-gray-700 shrink-0"><p className="text-[8px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">{packages.length} archivos disponibles • CRM Darmax</p></div>
                    </div>
                </div>
            )}

            {/* ====================================================================
                MODAL CRM FORM (EXPEDIENTE FICHA CLIENTE)
            ==================================================================== */}
            {showModal && (
                <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
                    
                    <div className="relative bg-white dark:bg-gray-800 w-full max-w-2xl mx-auto rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in slide-in-from-bottom-10 sm:zoom-in duration-300">
                        {/* Cabecera de Ficha */}
                        <div className="p-5 sm:p-6 border-b dark:border-gray-700 flex justify-between items-center bg-gray-800 text-white shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary shadow-inner">
                                    <FaUser size={24} />
                                </div>
                                <div>
                                    <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight leading-none">
                                        {editingLead ? 'Expediente Cliente' : 'Nuevo Registro CRM'}
                                    </h2>
                                    <p className="text-[8px] sm:text-[10px] font-bold text-gray-400 mt-1.5 uppercase tracking-[3px]">Ficha Detallada de Seguimiento</p>
                                </div>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-3xl font-light">&times;</button>
                        </div>
                        
                        <form onSubmit={handleSave} className="p-5 sm:p-8 space-y-8 overflow-y-auto custom-scrollbar flex-1 bg-gray-50/20 dark:bg-dark/20">
                            
                            {/* SECCIÓN 1: IDENTIDAD Y CONTACTO */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700"></div>
                                    <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] px-2 italic">Identidad y Contacto</h4>
                                    <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700"></div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                    <div className="space-y-1.5 group">
                                        <label className="text-[9px] font-black uppercase text-gray-400 ml-1 group-focus-within:text-primary transition-colors">Nombre Completo del Cliente *</label>
                                        <div className="relative">
                                            <input type="text" required className="w-full bg-white dark:bg-gray-900 p-3.5 sm:p-4 rounded-2xl border border-gray-100 dark:border-gray-700 focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all text-sm font-bold shadow-sm" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} placeholder="Ej: Juan Pérez" />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5 group">
                                        <label className="text-[9px] font-black uppercase text-gray-400 ml-1 group-focus-within:text-primary transition-colors">WhatsApp / Teléfono *</label>
                                        <div className="relative">
                                            <input type="tel" required className="w-full bg-white dark:bg-gray-900 p-3.5 sm:p-4 rounded-2xl border border-gray-100 dark:border-gray-700 focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all text-sm font-bold shadow-sm" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} placeholder="5512345678" />
                                            {editingLead && (
                                                <button type="button" onClick={() => handleSendWhatsApp(editingLead)} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 hover:scale-110 transition-transform"><FaWhatsapp size={20}/></button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* SECCIÓN 2: UBICACIÓN GEOGRÁFICA */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700"></div>
                                    <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] px-2 italic">Ubicación Geográfica</h4>
                                    <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700"></div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                    <div className="space-y-1.5 group">
                                        <label className="text-[9px] font-black uppercase text-gray-400 ml-1 group-focus-within:text-blue-600 transition-colors">Dirección (Calle, No., Colonia)</label>
                                        <div className="relative">
                                            <FaMapMarkerAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                                            <input type="text" className="w-full bg-white dark:bg-gray-900 p-3.5 sm:p-4 pl-11 rounded-2xl border border-gray-100 dark:border-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all text-sm font-bold shadow-sm" value={formData.direccion} onChange={e => setFormData({...formData, direccion: e.target.value})} />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5 group">
                                        <label className="text-[9px] font-black uppercase text-gray-400 ml-1 group-focus-within:text-blue-600 transition-colors">Ciudad / Municipio</label>
                                        <input type="text" className="w-full bg-white dark:bg-gray-900 p-3.5 sm:p-4 rounded-2xl border border-gray-100 dark:border-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all text-sm font-bold shadow-sm" value={formData.ciudad} onChange={e => setFormData({...formData, ciudad: e.target.value})} />
                                    </div>
                                </div>
                            </div>

                            {/* SECCIÓN 3: DETALLES COMERCIALES */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700"></div>
                                    <h4 className="text-[10px] font-black text-green-600 uppercase tracking-[0.2em] px-2 italic">Detalles Comerciales</h4>
                                    <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700"></div>
                                </div>
                                <div className="grid grid-cols-12 gap-3 sm:gap-4">
                                    <div className="col-span-12 sm:col-span-7 space-y-1.5 group">
                                        <label className="text-[9px] font-black uppercase text-gray-400 ml-1">Paquete de Interés o Instalado</label>
                                        <div className="relative">
                                            <FaLayerGroup className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                                            <input type="text" className="w-full bg-white dark:bg-gray-900 p-3.5 sm:p-4 pl-11 rounded-2xl border border-gray-100 dark:border-gray-700 focus:border-green-500 focus:ring-4 focus:ring-green-500/5 outline-none transition-all text-sm font-bold shadow-sm" value={formData.paqueteVendido} onChange={e => setFormData({...formData, paqueteVendido: e.target.value})} />
                                        </div>
                                    </div>
                                    <div className="col-span-5 sm:col-span-2 space-y-1.5 group">
                                        <label className="text-[9px] font-black uppercase text-gray-400 ml-1">Cant.</label>
                                        <input type="number" min="1" className="w-full bg-white dark:bg-gray-900 p-3.5 sm:p-4 rounded-2xl border border-gray-100 dark:border-gray-700 focus:border-green-500 outline-none transition-all text-sm font-bold shadow-sm text-center" value={formData.cantidadPaquetes} onChange={e => setFormData({...formData, cantidadPaquetes: e.target.value})} />
                                    </div>
                                    <div className="col-span-7 sm:col-span-3 space-y-1.5 group">
                                        <label className="text-[9px] font-black uppercase text-gray-400 ml-1">Estatus CRM</label>
                                        <select className="w-full bg-white dark:bg-gray-900 p-3.5 sm:p-4 rounded-2xl border border-gray-100 dark:border-gray-700 focus:border-green-500 outline-none transition-all text-[10px] font-black shadow-sm uppercase tracking-tighter" value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})}>
                                            <option value="PROSPECTO">Prospecto (Lead)</option>
                                            <option value="CLIENTE_VENTA">Cliente (Venta Cerrada)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* SECCIÓN 4: SEGUIMIENTO TÉCNICO (MANTENIMIENTOS E INSUMOS) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                                {/* Mantenimientos */}
                                <div className="p-5 sm:p-6 bg-orange-50 dark:bg-orange-900/10 rounded-[2.5rem] border-2 border-orange-100 dark:border-orange-800/30 space-y-4">
                                    <h4 className="font-black text-[10px] uppercase flex items-center gap-2 text-orange-700 tracking-widest"><FaTools /> Próximos Mantenimientos</h4>
                                    <div className="space-y-3">
                                        <input type="text" placeholder="¿Qué equipo? (Filtros, UV, etc)" className="w-full p-3 text-[10px] sm:text-xs rounded-xl border-none dark:bg-gray-900 shadow-inner font-bold" value={newManto.equipo} onChange={e => setNewManto({...newManto, equipo: e.target.value})} />
                                        <div className="flex gap-2">
                                            <input type="date" className="flex-1 p-3 text-[10px] rounded-xl border-none dark:bg-gray-900 shadow-inner font-bold" value={newManto.proximaFecha} onChange={e => setNewManto({...newManto, proximaFecha: e.target.value})} />
                                            <button type="button" onClick={addManto} className="bg-orange-600 text-white px-5 rounded-xl active:scale-90 transition-transform shrink-0 shadow-lg shadow-orange-600/20"><FaPlus /></button>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {formData.mantenimientos?.map((m, i) => (
                                            <div key={i} className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-xl text-[9px] font-black border border-orange-200 shadow-sm uppercase tracking-tighter text-gray-700 dark:text-gray-300">
                                                <FaCalendarAlt className="text-orange-500" />
                                                <span>{m.equipo} ({m.proximaFecha})</span>
                                                <button type="button" onClick={() => setFormData({...formData, mantenimientos: formData.mantenimientos.filter((_, idx) => idx !== i)})} className="text-red-500 hover:scale-125 transition-transform"><FaTrash size={10} /></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Insumos */}
                                <div className="p-5 sm:p-6 bg-indigo-50 dark:bg-indigo-900/10 rounded-[2.5rem] border-2 border-indigo-100 dark:border-indigo-800/30 space-y-4">
                                    <h4 className="font-black text-[10px] uppercase flex items-center gap-2 text-indigo-700 tracking-widest"><FaBox /> Insumos de Interés (Extras)</h4>
                                    <div className="space-y-3">
                                        <input type="text" placeholder="Tapas, Garrafones, etc" className="w-full p-3 text-[10px] sm:text-xs rounded-xl border-none dark:bg-gray-900 shadow-inner font-bold" value={newInsumo.item} onChange={e => setNewInsumo({...newInsumo, item: e.target.value})} />
                                        <div className="flex gap-2">
                                            <input type="number" placeholder="Cant." className="w-16 p-3 text-[10px] sm:text-xs rounded-xl border-none dark:bg-gray-900 shadow-inner font-bold text-center" value={newInsumo.cantidad} onChange={e => setNewInsumo({...newInsumo, cantidad: e.target.value})} />
                                            <button type="button" onClick={addInsumo} className="flex-1 bg-indigo-600 text-white px-4 rounded-xl active:scale-90 transition-transform shadow-lg shadow-indigo-600/20 font-black text-[10px] uppercase">Añadir</button>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {formData.insumosInteres?.map((ins, i) => (
                                            <div key={i} className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-xl text-[9px] font-black border border-indigo-200 shadow-sm uppercase tracking-tighter text-gray-700 dark:text-gray-300">
                                                <span>{ins.item} <span className="text-indigo-600">x{ins.cantidad}</span></span>
                                                <button type="button" onClick={() => setFormData({...formData, insumosInteres: formData.insumosInteres.filter((_, idx) => idx !== i)})} className="text-red-500 hover:scale-125 transition-transform"><FaTrash size={10} /></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* SECCIÓN 5: OBSERVACIONES */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700"></div>
                                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] px-2 italic">Observaciones Internas</h4>
                                    <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700"></div>
                                </div>
                                <div className="relative group">
                                    <FaStickyNote className="absolute left-4 top-4 text-gray-300 group-focus-within:text-primary transition-colors" />
                                    <textarea rows="4" placeholder="Registra acuerdos, fechas de llamada o detalles importantes del prospecto..." className="w-full bg-white dark:bg-gray-900 p-4 pl-11 rounded-3xl border border-gray-100 dark:border-gray-700 focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all text-sm font-medium shadow-sm resize-none" value={formData.notas} onChange={e => setFormData({...formData, notas: e.target.value})} />
                                </div>
                            </div>

                            {/* BOTONES DE ACCIÓN */}
                            <div className="flex flex-col sm:flex-row gap-3 pt-8 border-t border-gray-100 dark:border-gray-700 shrink-0">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 sm:py-5 rounded-2xl font-black uppercase text-[10px] sm:text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors order-2 sm:order-1">
                                    Cancelar Cambios
                                </button>
                                <button type="submit" className="flex-[2] py-4 sm:py-5 rounded-2xl font-black uppercase text-[10px] sm:text-xs bg-primary text-white shadow-2xl shadow-primary/30 order-1 sm:order-2 flex items-center justify-center gap-3 hover:-translate-y-1 active:translate-y-0 transition-all">
                                    <FaSave size={18} /> {editingLead ? 'Guardar Expediente' : 'Finalizar Registro'}
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
