import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
    FaPlus, FaCheck, FaTimes, FaExternalLinkAlt, 
    FaCommentAlt, FaCalendarAlt, FaBullhorn, FaTrash, FaEdit, 
    FaRocket, FaPauseCircle, FaEye, FaCheckDouble, FaUserCircle, FaFilter
} from 'react-icons/fa';
import apiClient from '../../api/apiClient';
import Swal from 'sweetalert2';

const Marketing = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';
    
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingPost, setEditingPost] = useState(null);
    const [filterCreator, setFilterCreator] = useState('ALL'); // Filtro para Admin
    
    const columns = [
        { id: 'BORRADOR', title: 'Ideas / Borradores', icon: <FaPlus />, color: 'border-gray-300', bg: 'bg-gray-50/50', label: 'bg-gray-500' },
        { id: 'EN_PROCESO', title: 'En Producción', icon: <FaRocket />, color: 'border-blue-400', bg: 'bg-blue-50/30', label: 'bg-blue-500' },
        { id: 'PENDIENTE_APROBACION', title: 'Esperando Revisión', icon: <FaEye />, color: 'border-orange-400', bg: 'bg-orange-50/30', label: 'bg-orange-500' },
        { id: 'APROBADO', title: 'Listos p/ Publicar', icon: <FaCheck />, color: 'border-emerald-400', bg: 'bg-emerald-50/30', label: 'bg-emerald-500' },
        { id: 'PUBLICADO', title: 'Publicados', icon: <FaCheckDouble />, color: 'border-purple-400', bg: 'bg-purple-50/30', label: 'bg-purple-500' }
    ];

    const [formData, setFormData] = useState({
        titulo: '',
        descripcion: '',
        url: '',
        fechaEntrega: '',
        status: 'BORRADOR'
    });

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            const response = await apiClient.get('/marketing');
            setPosts(response.data);
        } catch (error) {
            console.error('Error fetching marketing posts:', error);
        } finally {
            setLoading(false);
        }
    };

    // Obtener lista única de creadores para el filtro del Admin
    const creators = Array.from(new Set(posts.map(p => p.creadorId)))
        .map(id => {
            const post = posts.find(p => p.creadorId === id);
            return { id, name: post?.creador?.name || 'Desconocido' };
        });

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingPost) {
                await apiClient.put(`/marketing/${editingPost.id}`, formData);
            } else {
                await apiClient.post('/marketing', formData);
            }
            setShowModal(false);
            setEditingPost(null);
            fetchPosts();
            Swal.fire({ title: '¡Logrado!', text: 'La actividad ha sido registrada.', icon: 'success', timer: 1500, showConfirmButton: false });
        } catch (error) {
            Swal.fire('Error', 'No se pudo guardar la actividad', 'error');
        }
    };

    const updateStatus = async (id, newStatus) => {
        try {
            await apiClient.put(`/marketing/${id}`, { status: newStatus });
            fetchPosts();
            if (newStatus === 'PENDIENTE_APROBACION') {
                Swal.fire({ title: 'Enviado a Revisión', text: 'El Administrador ha sido notificado.', icon: 'info', timer: 2000, showConfirmButton: false });
            }
        } catch (error) {
            Swal.fire('Error', 'No se pudo actualizar el estado', 'error');
        }
    };

    const handleAdminApproval = async (post, approved) => {
        const { value: comment } = await Swal.fire({
            title: approved ? '¿Aprobar Contenido?' : 'Rechazar / Pedir Cambios',
            input: 'textarea',
            inputLabel: approved ? 'Comentarios (Opcional)' : 'Indica qué mejorar',
            inputPlaceholder: 'Escribe aquí...',
            showCancelButton: true,
            confirmButtonText: approved ? 'Aprobar' : 'Enviar Feedback',
            confirmButtonColor: approved ? '#10b981' : '#ef4444'
        });

        if (comment !== undefined) {
            try {
                await apiClient.put(`/marketing/${post.id}`, { 
                    status: approved ? 'APROBADO' : 'BORRADOR',
                    comentariosAdmin: comment 
                });
                fetchPosts();
                Swal.fire(approved ? '¡Aprobado!' : 'Feedback Enviado', '', 'success');
            } catch (error) {
                Swal.fire('Error', 'Ocurrió un problema.', 'error');
            }
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: '¿Eliminar actividad?',
            text: 'Esta acción no se puede deshacer.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Sí, eliminar'
        });
        if (result.isConfirmed) {
            await apiClient.delete(`/marketing/${id}`);
            fetchPosts();
            Swal.fire('Eliminado', '', 'success');
        }
    };

    // Aplicar filtros
    const filteredPosts = posts.filter(p => {
        if (isAdmin && filterCreator !== 'ALL' && p.creadorId !== filterCreator) return false;
        return true;
    });

    if (loading) return (
        <div className="p-8 text-center flex flex-col items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
            <p className="text-gray-500 font-medium italic">Preparando el tablero de marketing...</p>
        </div>
    );

    return (
        <div className="p-4 md:p-8 space-y-8 bg-gray-50/50 dark:bg-transparent min-h-screen">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-800 dark:text-white flex items-center gap-4 tracking-tighter uppercase italic">
                        <div className="bg-primary p-3 rounded-2xl shadow-lg shadow-primary/20 text-white">
                            <FaBullhorn />
                        </div>
                        MARKETING PLANNER
                    </h1>
                    <p className="text-sm text-gray-500 font-bold mt-2 flex items-center gap-2">
                        <FaPauseCircle className="text-primary" />
                        Tablero de Productividad Creativa
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                    {/* Admin Filter */}
                    {isAdmin && (
                        <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-2 pl-4 rounded-2xl border shadow-sm flex-1 lg:flex-none">
                            <FaFilter className="text-gray-400 text-xs" />
                            <select 
                                value={filterCreator}
                                onChange={(e) => setFilterCreator(e.target.value)}
                                className="bg-transparent text-xs font-black uppercase tracking-widest outline-none cursor-pointer"
                            >
                                <option value="ALL">TODOS LOS CREADORES</option>
                                {creators.map(c => (
                                    <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <button 
                        onClick={() => { setEditingPost(null); setFormData({ titulo: '', descripcion: '', url: '', fechaEntrega: '', status: 'BORRADOR' }); setShowModal(true); }}
                        className="btn-primary flex items-center justify-center gap-3 py-4 px-8 rounded-2xl shadow-2xl shadow-primary/30 font-black uppercase text-xs tracking-widest hover:scale-105 active:scale-95 transition-all w-full lg:w-auto"
                    >
                        <FaPlus /> Nueva Actividad
                    </button>
                </div>
            </div>

            {/* Kanban Board Layout */}
            <div className="flex gap-6 overflow-x-auto pb-8 custom-scrollbar scroll-smooth items-start">
                {columns.map(col => (
                    <div key={col.id} className={`flex-shrink-0 w-80 rounded-[2.5rem] border-2 border-dashed ${col.color} ${col.bg} p-5 flex flex-col gap-5 min-h-[70vh]`}>
                        {/* Column Header */}
                        <div className="flex justify-between items-center px-2">
                            <h3 className="font-black uppercase text-[10px] tracking-[3px] text-gray-500 flex items-center gap-2">
                                <span className={`${col.label} text-white p-1.5 rounded-lg text-[10px]`}>{col.icon}</span>
                                {col.title}
                            </h3>
                            <span className="bg-white dark:bg-gray-800 px-3 py-1 rounded-full text-[10px] font-black shadow-sm border border-gray-100 dark:border-gray-700">
                                {filteredPosts.filter(p => p.status === col.id).length}
                            </span>
                        </div>

                        {/* Cards Container */}
                        <div className="flex flex-col gap-4">
                            {filteredPosts.filter(p => p.status === col.id).map(post => (
                                <div key={post.id} className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                                    
                                    {/* Creator Badge (Admin Only or context) */}
                                    {isAdmin && (
                                        <div className="flex items-center gap-1.5 mb-3 bg-gray-50 dark:bg-gray-900 w-fit px-2 py-1 rounded-lg">
                                            <FaUserCircle className="text-gray-400 text-[10px]" />
                                            <span className="text-[9px] font-black uppercase tracking-tighter text-gray-500">{post.creador?.name}</span>
                                        </div>
                                    )}

                                    <h4 className="font-black text-gray-800 dark:text-white mb-2 leading-tight uppercase text-sm">{post.titulo}</h4>
                                    <p className="text-[11px] text-gray-500 font-medium line-clamp-3 mb-4 leading-relaxed">{post.descripcion}</p>
                                    
                                    {/* Action Footer */}
                                    <div className="flex justify-between items-center pt-4 border-t dark:border-gray-700">
                                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter ${
                                            post.fechaEntrega && new Date(post.fechaEntrega) < new Date() ? 'bg-red-50 text-red-500' : 'bg-gray-50 dark:bg-gray-900 text-gray-400'
                                        }`}>
                                            <FaCalendarAlt /> 
                                            {post.fechaEntrega ? new Date(post.fechaEntrega).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' }) : 'S/F'}
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                            {/* Admin Decision Controls */}
                                            {isAdmin && post.status === 'PENDIENTE_APROBACION' && (
                                                <div className="flex bg-gray-50 dark:bg-gray-900 p-1 rounded-xl gap-1 mr-1">
                                                    <button onClick={() => handleAdminApproval(post, true)} className="p-1.5 text-emerald-500 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"><FaCheck size={10} /></button>
                                                    <button onClick={() => handleAdminApproval(post, false)} className="p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"><FaTimes size={10} /></button>
                                                </div>
                                            )}
                                            
                                            {/* Status Movement Logic */}
                                            <div className="flex gap-1.5">
                                                {post.status === 'BORRADOR' && (
                                                    <button onClick={() => updateStatus(post.id, 'EN_PROCESO')} className="bg-primary/10 text-primary p-2 rounded-lg hover:bg-primary hover:text-white transition-all"><FaRocket size={10} /></button>
                                                )}
                                                {post.status === 'EN_PROCESO' && (
                                                    <button onClick={() => updateStatus(post.id, 'PENDIENTE_APROBACION')} className="bg-orange-100 text-orange-600 p-2 rounded-lg hover:bg-orange-500 hover:text-white transition-all"><FaEye size={10} /></button>
                                                )}
                                                {post.status === 'APROBADO' && (
                                                    <button onClick={() => updateStatus(post.id, 'PUBLICADO')} className="bg-purple-100 text-purple-600 p-2 rounded-lg hover:bg-purple-500 hover:text-white transition-all"><FaCheckDouble size={10} /></button>
                                                )}
                                            </div>

                                            <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>
                                            
                                            <button onClick={() => { setEditingPost(post); setFormData(post); setShowModal(true); }} className="text-gray-400 hover:text-primary transition-colors"><FaEdit size={12} /></button>
                                            <button onClick={() => handleDelete(post.id)} className="text-gray-400 hover:text-red-500 transition-colors"><FaTrash size={12} /></button>
                                        </div>
                                    </div>

                                    {/* Feedback Box */}
                                    {post.comentariosAdmin && (
                                        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-800 animate-pulse">
                                            <p className="text-[9px] font-black text-red-600 uppercase flex items-center gap-2 mb-1">
                                                <FaCommentAlt size={8} /> Feedback Admin:
                                            </p>
                                            <p className="text-[10px] text-red-800 dark:text-red-300 font-medium italic">{post.comentariosAdmin}</p>
                                        </div>
                                    )}

                                    {post.url && (
                                        <a 
                                            href={post.url} target="_blank" rel="noopener noreferrer"
                                            className="mt-4 w-full block text-center py-2 rounded-xl bg-gray-50 dark:bg-gray-900 text-[9px] font-black text-primary uppercase tracking-widest hover:bg-primary hover:text-white transition-all"
                                        >
                                            Ver Contenido
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Premium Modal Form */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
                        <div className="p-8 bg-gray-800 text-white flex justify-between items-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 opacity-10 -rotate-12 translate-x-1/4 -translate-y-1/4">
                                <FaBullhorn size={200} />
                            </div>
                            <div className="relative z-10">
                                <h2 className="text-2xl font-black uppercase tracking-tighter italic leading-none">Actividad de Marketing</h2>
                                <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-[4px]">Planificación Estratégica</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-5xl font-light hover:rotate-90 transition-transform relative z-10">&times;</button>
                        </div>
                        
                        <form onSubmit={handleSave} className="p-10 space-y-8">
                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 block italic">Nombre del Contenido / Campaña *</label>
                                    <input 
                                        type="text" required
                                        className="w-full bg-gray-50 dark:bg-gray-900 p-5 rounded-[1.5rem] border-none focus:ring-4 focus:ring-primary/20 focus:bg-white outline-none transition-all font-bold text-gray-800 dark:text-white"
                                        placeholder="Ej: Promo Purificadora - Mes del Agua"
                                        value={formData.titulo}
                                        onChange={e => setFormData({...formData, titulo: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 block italic">Descripción / Copy / Instrucciones</label>
                                    <textarea 
                                        className="w-full bg-gray-50 dark:bg-gray-900 p-5 rounded-[1.5rem] border-none focus:ring-4 focus:ring-primary/20 focus:bg-white outline-none transition-all resize-none font-medium text-gray-700 dark:text-gray-300"
                                        rows="4"
                                        placeholder="Describe de qué trata este post..."
                                        value={formData.descripcion}
                                        onChange={e => setFormData({...formData, descripcion: e.target.value})}
                                    ></textarea>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 block italic">Enlace (Canva / Drive / URL)</label>
                                        <input 
                                            type="url"
                                            className="w-full bg-gray-50 dark:bg-gray-900 p-5 rounded-[1.5rem] border-none focus:ring-4 focus:ring-primary/20 focus:bg-white outline-none transition-all font-bold text-primary"
                                            placeholder="https://canva.com/..."
                                            value={formData.url}
                                            onChange={e => setFormData({...formData, url: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 block italic">Fecha Programada</label>
                                        <input 
                                            type="date"
                                            className="w-full bg-gray-50 dark:bg-gray-900 p-5 rounded-[1.5rem] border-none focus:ring-4 focus:ring-primary/20 focus:bg-white outline-none transition-all font-bold text-gray-800 dark:text-white"
                                            value={formData.fechaEntrega ? formData.fechaEntrega.split('T')[0] : ''}
                                            onChange={e => setFormData({...formData, fechaEntrega: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row justify-end gap-4 pt-4">
                                <button 
                                    type="button" 
                                    onClick={() => setShowModal(false)} 
                                    className="px-10 py-5 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest text-gray-500 hover:bg-gray-100 transition-colors"
                                >
                                    Cerrar Ventana
                                </button>
                                <button 
                                    type="submit" 
                                    className="px-12 py-5 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest bg-primary text-white shadow-2xl shadow-primary/40 hover:-translate-y-1 active:translate-y-0 transition-all"
                                >
                                    Guardar Actividad
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Marketing;
