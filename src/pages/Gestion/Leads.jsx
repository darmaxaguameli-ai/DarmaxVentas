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
    const [packages, setPackages] = useState([]); // Estado para PDFs dinámicos
    const [activeTab, setActiveTab] = useState('PROSPECTO'); 
    const [showModal, setShowModal] = useState(false);
    const [showToolsModal, setShowToolsModal] = useState(false); // Modal de Herramientas
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

    const fetchPackages = async () => {
        try {
            const response = await apiClient.get('/utils/pdfs');
            // Mapear iconos y colores según el nombre para que se vea mejor
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

    const filteredLeads = leads.filter(l => l.tipo === activeTab);

    // Stats calculation
    const totalVentas = leads.filter(l => l.tipo === 'CLIENTE_VENTA').length;
    const totalProspectos = leads.filter(l => l.tipo === 'PROSPECTO').length;

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

    if (loading) return (
        <div className="p-8 text-center flex flex-col items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
            <p className="text-gray-500 font-medium italic">Cargando CRM de Ventas...</p>
        </div>
    );

    return (
        <div className="p-4 md:p-8 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-800 dark:text-white flex items-center gap-3 tracking-tighter">
                        <FaChartLine className="text-primary" />
                        CRM VENTAS DE CAMPO
                    </h1>
                    <p className="text-sm text-gray-500 font-medium italic">Gestión de prospectos y mantenimientos post-venta.</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setShowToolsModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-xl font-bold text-xs uppercase hover:bg-amber-200 transition-all shadow-sm"
                    >
                        <FaTools /> Herramientas
                    </button>
                    {!isAdmin && (
                        <button 
                            onClick={() => { resetForm(); setShowModal(true); }}
                            className="btn-primary flex items-center gap-2 py-3 px-6 shadow-xl shadow-primary/20"
                        >
                            <FaPlus /> {activeTab === 'PROSPECTO' ? 'Nuevo Prospecto' : 'Nueva Venta Directa'}
                        </button>
                    )}
                </div>
            </div>

            {/* Quick Stats Banner */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border dark:border-gray-700 flex items-center gap-4">
                    <div className="bg-blue-100 text-blue-600 p-3 rounded-xl"><FaUserClock /></div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Prospectos</p>
                        <p className="text-xl font-black">{totalProspectos}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border dark:border-gray-700 flex items-center gap-4">
                    <div className="bg-green-100 text-green-600 p-3 rounded-xl"><FaCheckCircle /></div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ventas Cerradas</p>
                        <p className="text-xl font-black">{totalVentas}</p>
                    </div>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-2xl w-fit">
                <button 
                    onClick={() => setActiveTab('PROSPECTO')}
                    className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'PROSPECTO' ? 'bg-white dark:bg-gray-800 shadow-md text-primary scale-105' : 'text-gray-500'}`}
                >
                    Prospectos / Leads
                </button>
                <button 
                    onClick={() => setActiveTab('CLIENTE_VENTA')}
                    className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'CLIENTE_VENTA' ? 'bg-white dark:bg-gray-800 shadow-md text-green-600 scale-105' : 'text-gray-500'}`}
                >
                    Cartera de Clientes
                </button>
            </div>

            {/* Leads List Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredLeads.map(lead => (
                    <div key={lead.id} className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-sm border dark:border-gray-700 hover:shadow-xl transition-all group overflow-hidden relative">
                        {/* Status Ribbon */}
                        <div className={`absolute top-0 right-0 px-4 py-1 text-[8px] font-black uppercase tracking-[3px] rounded-bl-xl ${lead.tipo === 'CLIENTE_VENTA' ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'}`}>
                            {lead.tipo === 'CLIENTE_VENTA' ? 'Cliente' : 'Lead'}
                        </div>

                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-black text-gray-800 dark:text-white">{lead.nombre}</h3>
                                <p className="text-xs text-gray-500 font-bold flex items-center gap-2">
                                    <FaPhone className="text-primary" /> {lead.telefono}
                                </p>
                            </div>
                        </div>
                        
                        {lead.tipo === 'CLIENTE_VENTA' && (
                            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                <div className="bg-gray-50 dark:bg-gray-900/40 p-3 rounded-2xl">
                                    <p className="text-[9px] uppercase font-black text-gray-400 tracking-tighter">Paquete Instalado</p>
                                    <p className="font-bold text-gray-700 dark:text-gray-200 truncate">{lead.paqueteVendido || 'Personalizado'}</p>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-900/40 p-3 rounded-2xl">
                                    <p className="text-[9px] uppercase font-black text-gray-400 tracking-tighter">Próximo Manto.</p>
                                    <p className="font-bold text-orange-600">
                                        {lead.mantenimientos?.[0]?.proximaFecha || 'No programado'}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* List of Mantenimientos (Preview) */}
                        {lead.mantenimientos?.length > 0 && (
                            <div className="mb-4 bg-orange-50 dark:bg-orange-900/10 p-3 rounded-2xl border border-orange-100 dark:border-orange-800/30">
                                <p className="text-[9px] font-black uppercase text-orange-600 mb-2 flex items-center gap-2">
                                    <FaTools size={10} /> Equipos bajo mantenimiento:
                                </p>
                                <div className="space-y-1">
                                    {lead.mantenimientos.map((m, i) => (
                                        <div key={i} className="flex justify-between text-[10px] font-bold text-gray-600 dark:text-gray-400">
                                            <span>• {m.equipo}</span>
                                            <span className="text-orange-700">{m.proximaFecha}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between items-center pt-4 border-t dark:border-gray-700">
                            <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest">
                                {isAdmin ? `Vendedor: ${lead.vendedor?.name}` : `Desde: ${new Date(lead.createdAt).toLocaleDateString()}`}
                            </p>
                            <div className="flex gap-4">
                                {lead.tipo === 'PROSPECTO' && (
                                    <button 
                                        onClick={() => handleConvertToSale(lead)}
                                        className="text-green-600 hover:scale-110 transition-transform text-[10px] font-black uppercase flex items-center gap-1"
                                        title="Convertir a Venta"
                                    >
                                        <FaExchangeAlt /> ¡Cerrar!
                                    </button>
                                )}
                                <button 
                                    onClick={() => { setEditingLead(lead); setFormData(lead); setShowModal(true); }}
                                    className="text-primary hover:scale-110 transition-transform text-[10px] font-black uppercase"
                                >
                                    Editar
                                </button>
                                <button 
                                    onClick={() => { setEditingLead(lead); setShowToolsModal(true); }}
                                    className="text-green-600 hover:scale-110 transition-transform text-[10px] font-black uppercase flex items-center gap-1"
                                >
                                    <FaWhatsapp size={14} /> Enviar Info
                                </button>
                                <button 
                                    onClick={() => handleDelete(lead.id, lead.nombre)}
                                    className="text-red-500 hover:scale-110 transition-transform text-[10px] font-black uppercase"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {filteredLeads.length === 0 && (
                <div className="py-20 text-center bg-gray-50 dark:bg-gray-900/30 rounded-[40px] border-4 border-dashed border-gray-100 dark:border-gray-800">
                    <p className="text-gray-400 font-bold italic">No hay registros en esta sección.</p>
                </div>
            )}

            {/* Tools Modal (PDF Packages) */}
            {showToolsModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-4xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in duration-300 flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center bg-amber-500 text-white shrink-0">
                            <div>
                                <h2 className="text-xl font-black uppercase tracking-widest flex items-center gap-3">
                                    <FaTools /> Herramientas de Venta
                                </h2>
                                {editingLead && <p className="text-[10px] font-bold opacity-80 uppercase mt-1">Enviar a: {editingLead.nombre}</p>}
                            </div>
                            <button onClick={() => { setShowToolsModal(false); setEditingLead(null); }} className="text-2xl hover:rotate-90 transition-transform">&times;</button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-gray-50/30 dark:bg-gray-900/20">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {packages.length > 0 ? (
                                    packages.map((pkg) => (
                                        <div key={pkg.id} className="group flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-2xl border-2 border-transparent hover:border-amber-500 transition-all shadow-sm">
                                            <div className="flex items-center gap-4 min-w-0">
                                                <div className={`w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center shadow-inner shrink-0 ${pkg.color}`}>
                                                    <span className="material-symbols-outlined text-xl">{pkg.icon}</span>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-black text-gray-800 dark:text-white text-xs truncate">{pkg.name}</p>
                                                    <p className="text-[9px] text-gray-400 font-bold uppercase">PDF • Herramienta</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 shrink-0">
                                                <a 
                                                    href={pkg.file} target="_blank" rel="noopener noreferrer"
                                                    className="p-2.5 bg-gray-100 dark:bg-gray-700 text-gray-400 hover:text-red-500 rounded-xl transition-colors border border-transparent hover:border-red-100"
                                                    title="Ver PDF"
                                                >
                                                    <FaFilePdf size={16} />
                                                </a>
                                                {editingLead && (
                                                    <button 
                                                        onClick={() => handleSendWhatsApp(editingLead, pkg)}
                                                        className="p-2.5 bg-green-500 text-white rounded-xl shadow-lg shadow-green-500/20 hover:scale-110 active:scale-95 transition-all flex items-center gap-2"
                                                    >
                                                        <FaWhatsapp size={16} />
                                                        <span className="text-[9px] font-black uppercase">Enviar</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full text-center py-20 opacity-50 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-[2rem]">
                                        <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">folder_off</span>
                                        <p className="text-sm font-bold text-gray-400 italic">No hay herramientas PDF cargadas en el servidor.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-4 bg-white dark:bg-gray-800 text-center border-t dark:border-gray-700 shrink-0">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                Mostrando {packages.length} archivos disponibles • Darmax CRM
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Enhanced Modal CRM Form */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-3xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                        <div className="p-8 border-b dark:border-gray-700 flex justify-between items-center bg-gray-800 text-white">
                            <div>
                                <h2 className="text-2xl font-black tracking-tighter italic uppercase underline decoration-primary decoration-4 underline-offset-4">
                                    {editingLead ? 'Ficha de Cliente/Prospecto' : 'Nuevo Registro CRM'}
                                </h2>
                                <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-[3px]">Sistema de Seguimiento Integral</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-4xl hover:rotate-90 transition-transform">&times;</button>
                        </div>
                        
                        <form onSubmit={handleSave} className="p-8 space-y-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
                            {/* Base Info Section */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-primary uppercase tracking-widest border-l-4 border-primary pl-3">Datos de Contacto</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="group">
                                        <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block group-focus-within:text-primary transition-colors">Nombre Completo *</label>
                                        <input 
                                            type="text" required
                                            className="w-full bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl border-2 border-transparent focus:border-primary focus:bg-white outline-none transition-all"
                                            value={formData.nombre}
                                            onChange={e => setFormData({...formData, nombre: e.target.value})}
                                        />
                                    </div>
                                    <div className="group">
                                        <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block group-focus-within:text-primary transition-colors">Teléfono / WhatsApp *</label>
                                        <input 
                                            type="tel" required
                                            className="w-full bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl border-2 border-transparent focus:border-primary focus:bg-white outline-none transition-all"
                                            value={formData.telefono}
                                            onChange={e => setFormData({...formData, telefono: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Venta Section - Conditional */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-green-600 uppercase tracking-widest border-l-4 border-green-600 pl-3">Información de Venta</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="group">
                                        <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">Paquete Vendido</label>
                                        <input 
                                            type="text" placeholder="Ej: Planta Purificadora 1200"
                                            className="w-full bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl border-2 border-transparent focus:border-green-500 focus:bg-white outline-none transition-all"
                                            value={formData.paqueteVendido}
                                            onChange={e => setFormData({...formData, paqueteVendido: e.target.value})}
                                        />
                                    </div>
                                    <div className="group">
                                        <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">Tipo de Registro</label>
                                        <select 
                                            className="w-full bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl border-2 border-transparent focus:border-green-500 outline-none transition-all"
                                            value={formData.tipo}
                                            onChange={e => setFormData({...formData, tipo: e.target.value})}
                                        >
                                            <option value="PROSPECTO">Prospecto (Solo Interesado)</option>
                                            <option value="CLIENTE_VENTA">Cliente (Venta Cerrada)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Mantenimientos Section */}
                            <div className="bg-orange-50 dark:bg-orange-900/10 p-6 rounded-[32px] border-2 border-orange-100 dark:border-orange-800/30 space-y-4">
                                <h4 className="font-black text-xs uppercase tracking-widest flex items-center gap-3 text-orange-700">
                                    <FaTools /> Programación de Mantenimientos
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <input 
                                        type="text" placeholder="Equipo (Filtros, Bomba, etc)"
                                        className="p-3 text-sm rounded-xl border dark:bg-gray-900 dark:border-gray-700 outline-none"
                                        value={newManto.equipo}
                                        onChange={e => setNewManto({...newManto, equipo: e.target.value})}
                                    />
                                    <input 
                                        type="text" placeholder="Frecuencia (ej: 6 meses)"
                                        className="p-3 text-sm rounded-xl border dark:bg-gray-900 dark:border-gray-700 outline-none"
                                        value={newManto.frecuencia}
                                        onChange={e => setNewManto({...newManto, frecuencia: e.target.value})}
                                    />
                                    <div className="flex gap-2">
                                        <input 
                                            type="date"
                                            className="flex-1 p-3 text-sm rounded-xl border dark:bg-gray-900 dark:border-gray-700 outline-none"
                                            value={newManto.proximaFecha}
                                            onChange={e => setNewManto({...newManto, proximaFecha: e.target.value})}
                                        />
                                        <button 
                                            type="button" onClick={addManto}
                                            className="bg-orange-600 text-white p-3 rounded-xl hover:scale-110 active:scale-95 transition-transform"
                                        >
                                            <FaPlus />
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="flex flex-wrap gap-2">
                                    {formData.mantenimientos?.map((m, i) => (
                                        <div key={i} className="flex items-center gap-3 bg-white dark:bg-gray-800 px-4 py-2 rounded-2xl text-[10px] font-black border border-orange-200 shadow-sm uppercase tracking-tighter">
                                            <FaCalendarAlt className="text-orange-500" />
                                            <span>{m.equipo} - <span className="text-orange-600">{m.proximaFecha}</span></span>
                                            <button type="button" onClick={() => {
                                                const updated = formData.mantenimientos.filter((_, idx) => idx !== i);
                                                setFormData({...formData, mantenimientos: updated});
                                            }} className="text-red-500 ml-2">
                                                <FaTrash size={10} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Insumos Interes Section */}
                            <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-[32px] border-2 border-blue-100 dark:border-blue-800/30 space-y-4">
                                <h4 className="font-black text-xs uppercase tracking-widest flex items-center gap-3 text-blue-700">
                                    <FaBox /> Seguimiento de Insumos (Ventas Futuras)
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <input 
                                        type="text" placeholder="Insumo (Tapas, Garrafón, etc)"
                                        className="p-3 text-sm rounded-xl border dark:bg-gray-900 dark:border-gray-700 outline-none"
                                        value={newInsumo.item}
                                        onChange={e => setNewInsumo({...newInsumo, item: e.target.value})}
                                    />
                                    <input 
                                        type="text" placeholder="Cantidad"
                                        className="p-3 text-sm rounded-xl border dark:bg-gray-900 dark:border-gray-700 outline-none"
                                        value={newInsumo.cantidad}
                                        onChange={e => setNewInsumo({...newInsumo, cantidad: e.target.value})}
                                    />
                                    <button 
                                        type="button" onClick={addInsumo}
                                        className="bg-blue-600 text-white p-3 rounded-xl hover:scale-110 active:scale-95 transition-transform"
                                    >
                                        <FaPlus />
                                    </button>
                                </div>
                                
                                <div className="flex flex-wrap gap-2">
                                    {formData.insumosInteres?.map((ins, i) => (
                                        <div key={i} className="flex items-center gap-3 bg-white dark:bg-gray-800 px-4 py-2 rounded-2xl text-[10px] font-black border border-blue-200 shadow-sm uppercase tracking-tighter">
                                            <span>{ins.item}: {ins.cantidad}</span>
                                            <button type="button" onClick={() => {
                                                const updated = formData.insumosInteres.filter((_, idx) => idx !== i);
                                                setFormData({...formData, insumosInteres: updated});
                                            }} className="text-red-500 ml-2">
                                                <FaTrash size={10} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row justify-end gap-4 pt-8 border-t dark:border-gray-700">
                                <button 
                                    type="button" onClick={() => setShowModal(false)}
                                    className="px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit"
                                    className="px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs bg-primary text-white shadow-2xl shadow-primary/30 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-3"
                                >
                                    <FaSave size={16} /> {editingLead ? 'Actualizar Ficha CRM' : 'Guardar y Finalizar'}
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
