import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import { 
    FaUserPlus, FaPhone, FaBox, FaChartLine, FaFilter, FaPlus, FaSave, 
    FaTrash, FaTools, FaUserClock, FaCheckCircle, FaExchangeAlt, FaCalendarAlt,
    FaWhatsapp, FaFilePdf, FaShareAlt, FaTimes, FaMapMarkerAlt, FaStickyNote, FaLayerGroup,
    FaUser
} from 'react-icons/fa';
import apiClient from '../../api/apiClient';
import Swal from 'sweetalert2';
import { toast } from 'sonner';

const Leads = ({ defaultTab }) => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';

    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [packages, setPackages] = useState([]); 
    const [activeTab, setActiveTab] = useState(defaultTab || 'PROSPECTO'); 
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
        if (defaultTab) setActiveTab(defaultTab);
    }, [defaultTab]);

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
                toast.success('Ficha actualizada');
            } else {
                await apiClient.post('/leads', payload);
                toast.success('Registro completado');
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
            confirmButtonText: 'Sí, eliminar',
            reverseButtons: true
        });

        if (result.isConfirmed) {
            try {
                await apiClient.delete(`/leads/${id}`);
                toast.success('Registro eliminado');
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

    const filteredLeads = leads.filter(l => {
        if (activeTab === 'MANTENIMIENTO') {
            return l.tipo === 'CLIENTE_VENTA' && l.mantenimientos && l.mantenimientos.length > 0;
        }
        return l.tipo === activeTab;
    });

    const totalVentas = leads.filter(l => l.tipo === 'CLIENTE_VENTA').length;
    const totalProspectos = leads.filter(l => l.tipo === 'PROSPECTO').length;
    const totalMantos = leads.filter(l => l.tipo === 'CLIENTE_VENTA' && l.mantenimientos?.length > 0).length;

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
                    <button 
                        onClick={() => { resetForm(); setShowModal(true); }}
                        className="flex-1 md:flex-none btn-primary flex items-center justify-center gap-2 py-2.5 px-6 shadow-xl shadow-primary/20 text-xs"
                    >
                        <FaPlus /> {activeTab === 'PROSPECTO' ? 'Nuevo Lead' : 'Nueva Venta'}
                    </button>
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
                <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-3">
                    <div className="bg-orange-100 text-orange-600 p-2 sm:p-3 rounded-xl text-sm sm:text-lg"><FaTools /></div>
                    <div>
                        <p className="text-[8px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Mantos.</p>
                        <p className="text-base sm:text-2xl font-black leading-none">{totalMantos}</p>
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
                <button 
                    onClick={() => setActiveTab('MANTENIMIENTO')}
                    className={`flex-1 sm:flex-none px-4 sm:px-8 py-2.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'MANTENIMIENTO' ? 'bg-white dark:bg-gray-800 shadow-sm text-orange-600' : 'text-gray-500'}`}
                >
                    Mantenimientos
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
                                    onClick={() => { 
                                        setEditingLead(lead); 
                                        setFormData({
                                            ...lead,
                                            insumosInteres: lead.insumosInteres || [],
                                            mantenimientos: lead.mantenimientos || []
                                        }); 
                                        setShowModal(true); 
                                    }}
                                    className="text-primary hover:scale-110 transition-transform text-[9px] sm:text-[10px] font-black uppercase"
                                >
                                    Editar
                                </button>
                                {lead.tipo === 'CLIENTE_VENTA' && (
                                    <button 
                                        onClick={() => window.location.href = `/gestion/mapa-instalaciones?leadId=${lead.id}`}
                                        className="text-blue-600 hover:scale-110 transition-transform text-[9px] sm:text-[10px] font-black uppercase flex items-center gap-1"
                                        title="Publicar en el Mapa de Exhibición"
                                    >
                                        <FaMapMarkerAlt size={10} /> Mapa
                                    </button>
                                )}
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
                MODAL TOOLS (PORTAL)
            ==================================================================== */}
            {showToolsModal && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="relative bg-white dark:bg-gray-800 w-full max-w-2xl mx-auto rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in duration-300">
                        <div className="p-8 border-b dark:border-gray-700 flex justify-between items-center shrink-0">
                            <div>
                                <h2 className="text-2xl font-bold text-dark dark:text-white uppercase tracking-tight flex items-center gap-3 leading-none">
                                    <FaTools className="text-amber-500" /> Herramientas
                                </h2>
                                {editingLead && <p className="text-[10px] text-gray-400 font-bold uppercase mt-2 tracking-widest italic">Enviar a: {editingLead.nombre}</p>}
                            </div>
                            <button onClick={() => { setShowToolsModal(false); setEditingLead(null); }} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"><FaTimes size={24} /></button>
                        </div>
                        <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {packages.map((pkg) => (
                                    <div key={pkg.id} className="group flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/40 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-amber-500 transition-all shadow-sm">
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className={`w-10 h-10 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center shrink-0 shadow-sm ${pkg.color}`}>
                                                <span className="material-symbols-outlined">{pkg.icon}</span>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-black text-gray-800 dark:text-white text-xs truncate leading-tight">{pkg.name}</p>
                                                <p className="text-[8px] text-gray-400 font-black uppercase mt-1 leading-none tracking-widest">Catálogo PDF</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 shrink-0">
                                            <a href={pkg.file} target="_blank" rel="noopener noreferrer" className="p-2.5 text-gray-400 hover:text-red-500 transition-colors"><FaFilePdf size={16} /></a>
                                            {editingLead && <button onClick={() => handleSendWhatsApp(editingLead, pkg)} className="p-2.5 bg-green-500 text-white rounded-xl shadow-md hover:scale-105 active:scale-95 transition-all"><FaWhatsapp size={16} /></button>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="p-6 bg-gray-50 dark:bg-gray-900/40 border-t dark:border-gray-700 text-center shrink-0">
                            <button onClick={() => { setShowToolsModal(false); setEditingLead(null); }} className="w-full py-4 bg-gray-800 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-lg">Cerrar Herramientas</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ====================================================================
                MODAL CRM FORM (EXPEDIENTE) (PORTAL)
            ==================================================================== */}
            {showModal && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="relative bg-white dark:bg-gray-800 w-full max-w-2xl mx-auto rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-[90vh] animate-in zoom-in duration-300">
                        <div className="p-8 border-b dark:border-gray-700 flex justify-between items-center shrink-0">
                            <div>
                                <h2 className="text-2xl font-bold text-dark dark:text-white uppercase tracking-tight flex items-center gap-3 leading-none">
                                    <FaUser className="text-primary" /> {editingLead ? 'Expediente Cliente' : 'Nuevo Registro CRM'}
                                </h2>
                                <p className="text-[10px] text-gray-400 font-bold uppercase mt-2 tracking-widest italic">Ficha Detallada de Seguimiento</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"><FaTimes size={24} /></button>
                        </div>
                        
                        <form onSubmit={handleSave} className="p-8 space-y-8 overflow-y-auto custom-scrollbar flex-1">
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] italic">Identidad y Contacto</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[9px] font-black uppercase text-gray-400 mb-1.5 block">Nombre del Cliente *</label>
                                        <input type="text" required className="w-full input-style font-black text-sm" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} placeholder="Ej: Juan Pérez" />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black uppercase text-gray-400 mb-1.5 block">WhatsApp / Teléfono *</label>
                                        <input type="tel" required className="w-full input-style font-black text-sm" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} placeholder="5512345678" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] italic">Ubicación Geográfica</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="relative">
                                        <label className="text-[9px] font-black uppercase text-gray-400 mb-1.5 block">Dirección</label>
                                        <input type="text" className="w-full input-style text-xs" value={formData.direccion} onChange={e => setFormData({...formData, direccion: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black uppercase text-gray-400 mb-1.5 block">Ciudad</label>
                                        <input type="text" className="w-full input-style text-xs uppercase" value={formData.ciudad} onChange={e => setFormData({...formData, ciudad: e.target.value})} />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-green-600 uppercase tracking-[0.2em] italic">Detalles Comerciales</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="sm:col-span-2">
                                        <label className="text-[9px] font-black uppercase text-gray-400 mb-1.5 block">Paquete de Interés</label>
                                        <input type="text" className="w-full input-style text-xs font-black uppercase" value={formData.paqueteVendido} onChange={e => setFormData({...formData, paqueteVendido: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black uppercase text-gray-400 mb-1.5 block">Estatus</label>
                                        <select className="w-full input-style text-[10px] font-black uppercase" value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})}>
                                            <option value="PROSPECTO">Prospecto</option>
                                            <option value="CLIENTE_VENTA">Cliente</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] italic">Observaciones Internas</h4>
                                <textarea rows="3" className="w-full input-style text-xs h-32" value={formData.notas} onChange={e => setFormData({...formData, notas: e.target.value})} placeholder="Registra acuerdos importantes..." />
                            </div>

                            <div className="space-y-4 pt-4 border-t dark:border-gray-700">
                                <h4 className="text-[10px] font-black text-orange-600 uppercase tracking-[0.2em] italic">Planes de Mantenimiento</h4>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gray-50 dark:bg-gray-900/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                                    <div>
                                        <label className="text-[8px] font-black uppercase text-gray-400 mb-1 block">Equipo / Sistema</label>
                                        <input type="text" className="w-full input-style text-[10px] uppercase" value={newManto.equipo} onChange={e => setNewManto({...newManto, equipo: e.target.value})} placeholder="Ej: Suavizador" />
                                    </div>
                                    <div>
                                        <label className="text-[8px] font-black uppercase text-gray-400 mb-1 block">Frecuencia</label>
                                        <select className="w-full input-style text-[10px]" value={newManto.frecuencia} onChange={e => setNewManto({...newManto, frecuencia: e.target.value})}>
                                            <option value="">Seleccionar...</option>
                                            <option value="MENSUAL">Mensual</option>
                                            <option value="TRIMESTRAL">Trimestral</option>
                                            <option value="SEMESTRAL">Semestral</option>
                                            <option value="ANUAL">Anual</option>
                                        </select>
                                    </div>
                                    <div className="flex gap-2 items-end">
                                        <div className="flex-1">
                                            <label className="text-[8px] font-black uppercase text-gray-400 mb-1 block">Próxima Fecha</label>
                                            <input type="date" className="w-full input-style text-[10px]" value={newManto.proximaFecha} onChange={e => setNewManto({...newManto, proximaFecha: e.target.value})} />
                                        </div>
                                        <button type="button" onClick={addManto} className="p-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors shadow-lg shadow-orange-600/20">
                                            <FaPlus size={12} />
                                        </button>
                                    </div>
                                </div>

                                {formData.mantenimientos?.length > 0 && (
                                    <div className="space-y-2">
                                        {formData.mantenimientos.map((m, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center">
                                                        <FaTools size={12} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase text-gray-800 dark:text-white">{m.equipo}</p>
                                                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{m.frecuencia} • Sig: {m.proximaFecha}</p>
                                                    </div>
                                                </div>
                                                <button 
                                                    type="button" 
                                                    onClick={() => setFormData({...formData, mantenimientos: formData.mantenimientos.filter((_, i) => i !== idx)})}
                                                    className="text-gray-300 hover:text-red-500 transition-colors"
                                                >
                                                    <FaTrash size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </form>

                        <div className="p-8 border-t dark:border-gray-700 flex flex-col sm:flex-row gap-3 bg-gray-50 dark:bg-gray-900/40 shrink-0">
                            <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 rounded-2xl font-black uppercase text-[10px] bg-white dark:bg-gray-800 text-gray-500 border border-gray-200 dark:border-gray-700 shadow-sm">Cancelar</button>
                            <button onClick={handleSave} className="flex-[2] py-4 rounded-2xl font-black uppercase text-[10px] bg-primary text-white shadow-2xl shadow-primary/30 flex items-center justify-center gap-3">
                                <FaSave size={16} /> {editingLead ? 'Guardar Expediente' : 'Finalizar Registro'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default Leads;
