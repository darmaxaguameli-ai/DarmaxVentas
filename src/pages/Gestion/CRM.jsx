import React, { useState, useEffect } from 'react';
import { 
    FaUsers, FaUserPlus, FaUserEdit, FaTrash, FaSearch, 
    FaHistory, FaClock, FaCheckCircle, FaExclamationTriangle,
    FaWhatsapp, FaEnvelope, FaFilter, FaIdCard, FaPlus, FaTimes
} from 'react-icons/fa';
import { fetchLeads, createLead, updateLead, deleteLead } from '../../api/apiClient';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const CRM = () => {
    const [leads, setLeads] = useState([]);
    const [view, setView] = useState('prospectos'); // prospectos | seguimiento | cobranza
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showLeadModal, setShowLeadModal] = useState(false);

    useEffect(() => {
        loadLeads();
    }, []);

    const loadLeads = async () => {
        setLoading(true);
        try {
            const data = await fetchLeads();
            setLeads(data);
        } catch (e) { toast.error('Error al cargar prospectos'); }
        finally { setLoading(false); }
    };

    const handleAddLead = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        
        try {
            await createLead(data);
            toast.success('Prospecto registrado correctamente');
            setShowLeadModal(false);
            loadLeads();
        } catch (e) { toast.error('Error al guardar prospecto'); }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            await updateLead(id, { status: newStatus });
            toast.success(`Estatus actualizado a ${newStatus}`);
            loadLeads();
        } catch (e) { toast.error('Error al actualizar estatus'); }
    };

    const filteredLeads = leads.filter(l => 
        l.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
        l.telefono.includes(searchTerm)
    );

    return (
        <div className="animate-fade-in space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-black text-gray-800 dark:text-white flex items-center gap-4 tracking-tighter uppercase italic">
                        <div className="bg-indigo-500 p-3 rounded-2xl shadow-lg shadow-indigo-500/20 text-white">
                            <FaUsers className="text-2xl" />
                        </div> 
                        CRM Y COBRANZA
                    </h1>
                    <div className="text-[10px] text-gray-500 font-bold mt-2 flex items-center gap-2 uppercase tracking-widest leading-none">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div> 
                        Gestión de Relaciones y Recuperación de Cartera
                    </div>
                </div>

                <div className="flex gap-2 bg-white dark:bg-gray-800 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-x-auto w-full md:w-auto">
                    {[
                        { id: 'prospectos', label: 'Prospectos', icon: <FaUserPlus /> },
                        { id: 'seguimiento', label: 'Seguimiento', icon: <FaClock /> },
                        { id: 'cobranza', label: 'Cobranza', icon: <FaHistory /> }
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => setView(t.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                                view === t.id ? 'bg-indigo-50 text-indigo-600 border-2 border-indigo-100' : 'text-gray-400 hover:bg-gray-50'
                            }`}
                        >
                            {t.icon} {t.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-[3rem] p-8 md:p-12 shadow-sm border border-gray-100 dark:border-gray-700 min-h-[500px] flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full -mr-32 -mt-32" />
                
                <div className="flex flex-col md:flex-row items-center justify-between mb-8 pb-4 border-b border-gray-50 dark:border-gray-700 relative z-10 gap-4">
                    <div className="relative flex-1 w-full">
                        <FaSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Buscar en el CRM..." 
                            className="w-full pl-14 pr-6 py-4 bg-gray-50/50 dark:bg-gray-900 border border-transparent focus:border-indigo-500/20 rounded-[1.5rem] text-sm font-bold outline-none transition-all dark:text-white"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={() => setShowLeadModal(true)}
                        className="btn-primary bg-indigo-500 hover:bg-indigo-600 shadow-indigo-500/20 py-4 px-8 rounded-3xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 w-full md:w-auto"
                    >
                        <FaPlus /> Nuevo Prospecto
                    </button>
                </div>

                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                         <div className="col-span-full py-20 text-center animate-pulse text-[10px] font-black text-gray-400 uppercase tracking-widest">Sincronizando Leads...</div>
                    ) : filteredLeads.length === 0 ? (
                        <div className="col-span-full py-20 text-center text-gray-400 font-black uppercase italic tracking-widest opacity-50">No hay registros encontrados</div>
                    ) : (
                        filteredLeads.map(lead => (
                            <div key={lead.id} className="p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all group flex flex-col">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center font-black text-lg">
                                        {lead.nombre.charAt(0)}
                                    </div>
                                    <div className="flex gap-2">
                                        <span className={`text-[8px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest border ${
                                            lead.status === 'NUEVO' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                            lead.status === 'VENTA_REALIZADA' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                            'bg-amber-50 text-amber-600 border-amber-100'
                                        }`}>
                                            {lead.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                </div>

                                <h3 className="font-black text-gray-800 dark:text-white uppercase text-sm mb-1">{lead.nombre}</h3>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <FaWhatsapp className="text-emerald-500" /> {lead.telefono}
                                </p>

                                <div className="space-y-2 mb-6 flex-1">
                                    <div className="text-[9px] font-bold text-gray-500 uppercase bg-gray-50 dark:bg-gray-800 p-2 rounded-xl border border-gray-100 dark:border-gray-700">
                                        Interés: {lead.paqueteVendido || 'N/A'}
                                    </div>
                                    <p className="text-[10px] text-gray-400 italic line-clamp-2">{lead.notas || 'Sin notas adicionales'}</p>
                                </div>

                                <div className="flex gap-2 border-t pt-4 border-black/5 dark:border-gray-700">
                                    <button className="flex-1 py-3 bg-gray-50 dark:bg-gray-800 text-gray-500 rounded-xl text-[9px] font-black uppercase hover:bg-indigo-500 hover:text-white transition-all"><FaUserEdit className="mx-auto" /></button>
                                    <a href={`https://wa.me/52${lead.telefono}`} target="_blank" className="flex-1 py-3 bg-emerald-50 text-emerald-600 rounded-xl text-[9px] font-black uppercase flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all"><FaWhatsapp /></a>
                                    <button onClick={() => handleStatusChange(lead.id, 'EN_SEGUIMIENTO')} className="flex-1 py-3 bg-indigo-50 text-indigo-600 rounded-xl text-[9px] font-black uppercase hover:bg-indigo-600 hover:text-white transition-all">Seguimiento</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Modal Nuevo Prospecto */}
            {showLeadModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-[3rem] shadow-2xl w-full max-w-lg animate-in zoom-in duration-300">
                        <div className="flex justify-between items-start mb-6">
                            <h2 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tight flex items-center gap-3">Captar Lead</h2>
                            <button onClick={() => setShowLeadModal(false)} className="text-gray-400 hover:text-red-500"><FaTimes size={20}/></button>
                        </div>
                        <form onSubmit={handleAddLead} className="space-y-4">
                            <div><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block italic">Nombre Completo *</label><input name="nombre" required className="w-full input-style font-black text-sm uppercase" placeholder="Ej: Juan Pérez" /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block italic">Teléfono (10 dígitos) *</label><input name="telefono" required pattern="[0-9]{10}" className="w-full input-style font-black" placeholder="33XXXXXXXX" /></div>
                                <div><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block italic">Interés / Paquete</label><select name="paqueteVendido" className="w-full input-style font-black text-[10px] uppercase"><option value="VENDING_ATLANTS_300">Atlantis 300</option><option value="MOSTRADOR">Mostrador</option><option value="PLANTA_INDUSTRIAL">Planta Industrial</option></select></div>
                            </div>
                            <div><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block italic">Observaciones</label><textarea name="notas" className="w-full input-style text-xs h-24 resize-none" placeholder="¿Qué necesita el cliente?" /></div>
                            <button type="submit" className="w-full py-4 bg-indigo-500 text-white font-black rounded-3xl uppercase tracking-widest text-[10px] shadow-2xl shadow-indigo-500/20">Registrar en Cartera</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CRM;
