import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import { 
    FaPlus, FaCheck, FaTimes, FaExternalLinkAlt, 
    FaCommentAlt, FaCalendarAlt, FaBullhorn, FaTrash, FaEdit, 
    FaRocket, FaPauseCircle, FaEye, FaCheckDouble, FaUserCircle, FaFilter,
    FaThLarge, FaThList, FaCalendarDay, FaChevronLeft, FaChevronRight,
    FaCheckCircle, FaInfoCircle, FaInstagram, FaTiktok, FaFacebook, FaYoutube, FaChartLine,
    FaGlobe, FaArrowUp, FaLock, FaLockOpen, FaPaperPlane, FaSave, FaHistory
} from 'react-icons/fa';
import { 
    format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
    addDays, isSameMonth, isSameDay, addMonths, subMonths 
} from 'date-fns';
import { es } from 'date-fns/locale';
import apiClient from '../../api/apiClient';
import { formatDate } from '../../utils/formatters';
import Swal from 'sweetalert2';
import { toast } from 'sonner';

const platforms = [
    { id: 'INSTAGRAM', name: 'Instagram', icon: <FaInstagram />, color: 'text-pink-500', bg: 'bg-pink-50', border: 'border-pink-100' },
    { id: 'TIKTOK', name: 'TikTok', icon: <FaTiktok />, color: 'text-black dark:text-white', bg: 'bg-gray-100', border: 'border-gray-200' },
    { id: 'FACEBOOK', name: 'Facebook', icon: <FaFacebook />, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    { id: 'YOUTUBE', name: 'YouTube', icon: <FaYoutube />, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
    { id: 'OTRO', name: 'Web / Otros', icon: <FaGlobe />, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100' }
];

const Marketing = () => {
    const { user: authUser } = useAuth();
    // Detección robusta de admin coincidente con el servidor
    const isAdmin = authUser?.role === 'ADMIN' || (authUser?.roles && authUser.roles.some(r => r.name?.toUpperCase() === 'ADMIN'));
    
    const [posts, setPosts] = useState([]);
    const [metrics, setMetrics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showMetricsModal, setShowMetricsModal] = useState(false);
    const [editingPost, setEditingPost] = useState(null);
    const [filterCreator, setFilterCreator] = useState('ALL');
    const [viewMode, setViewMode] = useState('KANBAN'); 
    const [currentMonth, setCurrentMonth] = useState(new Date());
    
    const columns = [
        { id: 'BORRADOR', title: 'Ideas / Borradores', icon: <FaPlus />, color: 'border-gray-300', bg: 'bg-gray-50/50', label: 'bg-gray-500' },
        { id: 'EN_PROCESO', title: 'En Producción', icon: <FaRocket />, color: 'border-blue-400', bg: 'bg-blue-50/30', label: 'bg-blue-500' },
        { id: 'PENDIENTE_APROBACION', title: 'Esperando Revisión', icon: <FaEye />, color: 'border-orange-400', bg: 'bg-orange-50/30', label: 'bg-orange-500' },
        { id: 'APROBADO', title: 'Listos p/ Publicar', icon: <FaCheck />, color: 'border-emerald-400', bg: 'bg-emerald-50/30', label: 'bg-emerald-500' },
        { id: 'PUBLICADO', title: 'Publicados', icon: <FaCheckDouble />, color: 'border-purple-400', bg: 'bg-purple-50/30', label: 'bg-purple-500' }
    ];

    const [formData, setFormData] = useState({
        titulo: '', descripcion: '', url: '', fechaEntrega: '',
        status: 'BORRADOR', plataforma: 'INSTAGRAM', vistas: 0, likes: 0,
        compartidos: 0, seguidoresGanados: 0, editAuthorized: false
    });

    const [metricFormData, setMetricFormData] = useState({
        plataforma: 'INSTAGRAM', seguidores: '', fecha: format(new Date(), 'yyyy-MM-dd')
    });

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [postsRes, metricsRes] = await Promise.all([
                apiClient.get('/marketing'),
                apiClient.get('/marketing/metrics')
            ]);
            setPosts(postsRes.data || []);
            setMetrics(metricsRes.data || []);
        } catch (error) {
            console.error('Error loading marketing data:', error);
            toast.error('Error al conectar con la base de datos');
        } finally {
            setLoading(false);
        }
    };

    const resetFormData = (overrides = {}) => {
        setFormData({
            titulo: '', descripcion: '', url: '', fechaEntrega: '',
            status: 'BORRADOR', plataforma: 'INSTAGRAM', vistas: 0, likes: 0,
            compartidos: 0, seguidoresGanados: 0, editAuthorized: false, ...overrides
        });
    };

    const handleEdit = (post) => {
        setEditingPost(post);
        setFormData({
            ...post,
            fechaEntrega: post.fechaEntrega ? post.fechaEntrega.split('T')[0] : '',
            editAuthorized: post.editAuthorized || false
        });
        setShowModal(true);
    };

    const handleSave = async (e, requestEdit = false) => {
        if (e) e.preventDefault();
        try {
            const payload = {
                ...formData,
                vistas: parseInt(formData.vistas) || 0,
                likes: parseInt(formData.likes) || 0,
                compartidos: parseInt(formData.compartidos) || 0,
                seguidoresGanados: parseInt(formData.seguidoresGanados) || 0,
                requestEdit
            };

            if (editingPost) {
                await apiClient.put(`/marketing/${editingPost.id}`, payload);
                toast.success(requestEdit ? 'Solicitud enviada al administrador' : 'Cambios guardados');
            } else {
                await apiClient.post('/marketing', payload);
                toast.success('Nueva actividad registrada');
            }
            setShowModal(false);
            setEditingPost(null);
            loadData();
        } catch (error) {
            Swal.fire('Error', 'No se pudo guardar la actividad', 'error');
        }
    };

    const handleSaveMetric = async (e) => {
        e.preventDefault();
        try {
            await apiClient.post('/marketing/metrics', metricFormData);
            setShowMetricsModal(false);
            loadData();
            toast.success('Métrica actualizada correctamente');
        } catch (error) {
            toast.error('No se pudo registrar la métrica');
        }
    };

    const updateStatus = async (id, newStatus) => {
        try {
            await apiClient.put(`/marketing/${id}`, { status: newStatus });
            loadData();
            if (newStatus === 'PENDIENTE_APROBACION') toast.info('Enviado a revisión');
        } catch (error) {
            toast.error('Error al mover actividad');
        }
    };

    const handleAdminApproval = async (post, approved) => {
        const { value: comment } = await Swal.fire({
            title: approved ? '¿Aprobar Contenido?' : 'Rechazar / Pedir Cambios',
            input: 'textarea',
            inputLabel: approved ? 'Instrucciones (Opcional)' : 'Indica los cambios necesarios',
            showCancelButton: true,
            confirmButtonText: approved ? 'Autorizar' : 'Enviar Feedback',
            confirmButtonColor: approved ? '#10b981' : '#ef4444'
        });

        if (comment !== undefined) {
            try {
                await apiClient.put(`/marketing/${post.id}`, { 
                    status: approved ? 'APROBADO' : 'BORRADOR',
                    comentariosAdmin: comment,
                    editAuthorized: false
                });
                loadData();
                toast.success(approved ? 'Contenido aprobado' : 'Feedback enviado');
            } catch (error) {
                toast.error('Error al procesar aprobación');
            }
        }
    };

    const handleDelete = async (id) => {
        if (!isAdmin) return;
        const result = await Swal.fire({
            title: '¿Eliminar de forma permanente?',
            text: 'Esta acción no se puede deshacer.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Sí, eliminar'
        });
        if (result.isConfirmed) {
            try {
                await apiClient.delete(`/marketing/${id}`);
                loadData();
                toast.success('Actividad eliminada');
            } catch (e) { toast.error('Error al borrar'); }
        }
    };

    const creators = Array.from(new Set(posts.map(p => p.creadorId))).filter(Boolean)
        .map(id => {
            const post = posts.find(p => p.creadorId === id);
            return { id, name: post?.creador?.name || 'Desconocido' };
        });

    const filteredPosts = useMemo(() => {
        return posts.filter(p => {
            if (isAdmin && filterCreator !== 'ALL' && p.creadorId !== filterCreator) return false;
            return true;
        });
    }, [posts, isAdmin, filterCreator]);

    const onDragStart = (e, post) => {
        e.dataTransfer.setData("postId", post.id);
    };

    const onDrop = async (e, targetStatusOrDate) => {
        e.preventDefault();
        const postId = e.dataTransfer.getData("postId");
        if (!postId) return;
        
        try {
            const updateData = {};
            if (typeof targetStatusOrDate === 'string') {
                updateData.status = targetStatusOrDate;
            } else {
                updateData.fechaEntrega = format(targetStatusOrDate, 'yyyy-MM-dd');
            }
            await apiClient.put(`/marketing/${postId}`, updateData);
            loadData();
            toast.success('Actualizado');
        } catch (e) { toast.error('Error al mover'); }
    };

    const renderCard = (post) => {
        const platformObj = platforms.find(p => p.id === post.plataforma) || platforms[4];
        const canFullEdit = isAdmin || post.status === 'BORRADOR' || post.editAuthorized;

        return (
            <div 
                key={post.id} 
                draggable 
                onDragStart={(e) => onDragStart(e, post)}
                className="bg-white dark:bg-gray-800 p-5 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 group hover:shadow-xl transition-all relative overflow-hidden cursor-grab active:cursor-grabbing"
            >
                <div className="flex justify-between items-start mb-4">
                    <div className={`flex items-center gap-1.5 p-1.5 rounded-xl ${platformObj.bg} ${platformObj.color}`}>
                        {platformObj.icon}
                        <span className="text-[8px] font-black uppercase">{platformObj.name}</span>
                    </div>
                    {!canFullEdit && (
                        <div className="text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg flex items-center gap-1">
                            <FaLock size={8} />
                            <span className="text-[8px] font-black uppercase">Bloqueado</span>
                        </div>
                    )}
                </div>

                <h4 className="font-black text-gray-800 dark:text-white mb-2 uppercase text-xs leading-tight line-clamp-2">{post.titulo}</h4>
                <p className="text-[10px] text-gray-500 font-medium line-clamp-2 mb-4 leading-relaxed">{post.descripcion}</p>
                
                <div className="flex justify-between items-center pt-4 border-t dark:border-gray-700">
                    <div className="flex items-center gap-1.5">
                        <span className={`text-[8px] font-black uppercase tracking-widest ${post.fechaEntrega && new Date(post.fechaEntrega) < new Date() && post.status !== 'PUBLICADO' ? 'text-red-500' : 'text-gray-400'}`}>
                            {post.fechaEntrega ? formatDate(post.fechaEntrega, { month: 'short', day: 'numeric' }) : 'S/F'}
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        {isAdmin && post.status === 'PENDIENTE_APROBACION' && (
                            <button onClick={() => handleAdminApproval(post, true)} className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg"><FaCheck size={10} /></button>
                        )}
                        <button onClick={() => handleEdit(post)} className="p-1.5 text-gray-400 hover:text-primary"><FaEdit size={12} /></button>
                        {isAdmin && <button onClick={() => handleDelete(post.id)} className="p-1.5 text-gray-400 hover:text-red-500"><FaTrash size={12} /></button>}
                    </div>
                </div>
            </div>
        );
    };

    const renderKanban = () => (
        <div className="flex gap-6 overflow-x-auto pb-8 custom-scrollbar items-start animate-fade-in">
            {columns.map(col => {
                const columnPosts = filteredPosts.filter(p => p.status === col.id);
                return (
                    <div 
                        key={col.id} 
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => onDrop(e, col.id)}
                        className={`flex-shrink-0 w-80 rounded-[2.5rem] border-2 border-dashed ${col.color} ${col.bg} p-6 flex flex-col gap-6 min-h-[70vh] transition-colors`}
                    >
                        <div className="flex justify-between items-center px-2">
                            <h3 className="font-black uppercase text-[10px] tracking-[3px] text-gray-500 flex items-center gap-2">
                                <span className={`${col.label} text-white p-1.5 rounded-lg`}>{col.icon}</span>
                                {col.title}
                            </h3>
                            <span className="bg-white dark:bg-gray-800 px-3 py-1 rounded-full text-[10px] font-black shadow-sm border dark:border-gray-700">{columnPosts.length}</span>
                        </div>

                        {col.id === 'BORRADOR' ? (
                            <div className="space-y-8">
                                {platforms.map(plat => {
                                    const platPosts = columnPosts.filter(p => p.plataforma === plat.id);
                                    if (platPosts.length === 0) return null;
                                    return (
                                        <div key={plat.id} className="space-y-4">
                                            <div className="flex items-center gap-2 px-2">
                                                <span className={`${plat.color} text-xs`}>{plat.icon}</span>
                                                <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">{plat.name}</span>
                                                <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700 ml-2 opacity-50"></div>
                                            </div>
                                            <div className="flex flex-col gap-4">{platPosts.map(post => renderCard(post))}</div>
                                        </div>
                                    );
                                })}
                                {(() => {
                                    const assignedPlatformIds = platforms.map(p => p.id);
                                    const unassignedPosts = columnPosts.filter(p => !p.plataforma || !assignedPlatformIds.includes(p.plataforma));
                                    if (unassignedPosts.length === 0) return null;
                                    return (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 px-2"><span className="text-gray-400 text-xs"><FaGlobe /></span><span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Sin Asignar / Otros</span><div className="h-px flex-1 bg-gray-200 dark:bg-gray-700 ml-2 opacity-50"></div></div>
                                            <div className="flex flex-col gap-4">{unassignedPosts.map(post => renderCard(post))}</div>
                                        </div>
                                    );
                                })()}
                                {columnPosts.length === 0 && <div className="py-20 text-center opacity-20"><FaPlus size={40} className="mx-auto mb-4" /><p className="text-[10px] font-black uppercase">Arrastra aquí tus ideas</p></div>}
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4">{columnPosts.map(post => renderCard(post))}</div>
                        )}
                    </div>
                );
            })}
        </div>
    );

    const renderCalendar = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);
        const rows = []; let days = []; let day = startDate;
        const undatedPosts = filteredPosts.filter(p => !p.fechaEntrega);

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                const cloneDay = day;
                const dayPosts = filteredPosts.filter(p => p.fechaEntrega && isSameDay(new Date(p.fechaEntrega), cloneDay));
                days.push(
                    <div key={day} onDragOver={(e) => e.preventDefault()} onDrop={(e) => onDrop(e, cloneDay)} className={`min-h-[120px] p-2 border border-gray-100 dark:border-gray-800 transition-all ${!isSameMonth(day, monthStart) ? "bg-gray-50/30 opacity-40" : "bg-white dark:bg-gray-900"} ${isSameDay(day, new Date()) ? "ring-2 ring-primary ring-inset bg-primary/5" : ""}`}>
                        <span className="text-[10px] font-black opacity-40">{format(day, 'd')}</span>
                        <div className="flex flex-col gap-1 mt-1">
                            {dayPosts.map(p => (<div key={p.id} draggable onDragStart={(e) => onDragStart(e, p)} onClick={() => handleEdit(p)} className="text-[7px] font-black p-1 rounded-lg truncate cursor-grab bg-primary text-white shadow-sm">{p.titulo}</div>))}
                        </div>
                    </div>
                );
                day = addDays(day, 1);
            }
            rows.push(<div className="grid grid-cols-7" key={day}>{days}</div>);
            days = [];
        }

        return (
            <div className="flex flex-col xl:flex-row gap-6 animate-fade-in">
                <div className="flex-1 bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
                    <div className="p-6 bg-gray-50 dark:bg-gray-900 border-b flex justify-between items-center">
                        <h2 className="font-black uppercase italic tracking-tighter text-xl text-primary">{format(currentMonth, 'MMMM yyyy', { locale: es })}</h2>
                        <div className="flex gap-2">
                            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm"><FaChevronLeft size={10}/></button>
                            <button onClick={() => setCurrentMonth(new Date())} className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm text-[8px] font-black uppercase">Hoy</button>
                            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm"><FaChevronRight size={10}/></button>
                        </div>
                    </div>
                    <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-900 border-b">{['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (<div key={d} className="py-3 text-center text-[9px] font-black uppercase text-gray-400">{d}</div>))}</div>
                    <div>{rows}</div>
                </div>
                <div className="w-full xl:w-72 bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 p-6 shadow-xl space-y-6">
                    <p className="text-[10px] font-black uppercase italic text-gray-400 tracking-widest flex items-center gap-2"><FaHistory /> Historial Pendientes</p>
                    <div className="space-y-2 overflow-y-auto max-h-[60vh] custom-scrollbar pr-1">
                        {undatedPosts.map(p => (
                            <div key={p.id} draggable onDragStart={(e) => onDragStart(e, p)} className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700 text-[10px] font-black uppercase cursor-grab hover:border-primary/30 transition-all">{p.titulo}</div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const renderStats = () => {
        const platformIds = ['INSTAGRAM', 'TIKTOK', 'FACEBOOK', 'YOUTUBE'];
        return (
            <div className="space-y-8 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {platformIds.map(pId => {
                        const pObj = platforms.find(p => p.id === pId);
                        const platMetrics = metrics.filter(m => m.plataforma === pId);
                        const latest = platMetrics[0]?.seguidores || 0;
                        const prev = platMetrics[1]?.seguidores || 0;
                        const diff = latest - prev;
                        return (
                            <div key={pId} className="bg-white dark:bg-gray-800 p-6 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-xl">
                                <div className={`w-12 h-12 rounded-2xl ${pObj.bg} ${pObj.color} flex items-center justify-center text-xl mb-4 shadow-sm`}>{pObj.icon}</div>
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{pObj.name}</h3>
                                <div className="flex items-end gap-2">
                                    <p className="text-3xl font-black dark:text-white tracking-tighter">{latest.toLocaleString()}</p>
                                    {diff !== 0 && <span className={`text-[10px] font-black mb-1 ${diff > 0 ? 'text-emerald-500' : 'text-red-500'}`}>{diff > 0 ? '+' : ''}{diff}</span>}
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="bg-white dark:bg-gray-800 p-8 rounded-[3rem] border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col items-center justify-center min-h-[300px] gap-6">
                    <div className="text-center">
                        <FaChartLine size={48} className="text-gray-100 dark:text-gray-700 mx-auto mb-4" />
                        <h2 className="text-xl font-black uppercase dark:text-white">Análisis de Crecimiento</h2>
                        <p className="text-gray-400 text-sm italic">Registra tus seguidores diariamente para generar gráficas de impacto.</p>
                    </div>
                    <button onClick={() => setShowMetricsModal(true)} className="btn-primary px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20">Actualizar Métricas Ahora</button>
                </div>
            </div>
        );
    };

    if (loading) return (
        <div className="p-8 text-center flex flex-col items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-4 italic">Sincronizando Planner...</p>
        </div>
    );

    return (
        <div className="p-4 md:p-8 space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-black text-gray-800 dark:text-white flex items-center gap-4 tracking-tighter uppercase italic">
                        <div className="bg-primary p-3 rounded-2xl shadow-lg shadow-primary/20 text-white"><FaBullhorn className="text-2xl" /></div>
                        MARKETING PLANNER
                    </h1>
                    <div className="text-[10px] text-gray-500 font-bold mt-2 flex items-center gap-2 uppercase tracking-widest">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div> 
                        Calendario de Contenidos y Redes Sociales
                    </div>
                </div>
                <button onClick={() => { setEditingPost(null); resetFormData(); setShowModal(true); }} className="btn-primary flex items-center justify-center gap-3 py-4 px-10 rounded-3xl shadow-2xl shadow-primary/30 font-black uppercase text-xs tracking-widest hover:scale-105 active:scale-95 transition-all w-full md:w-auto"><FaPlus /> Crear Actividad</button>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex bg-gray-100 dark:bg-gray-900/50 p-1 rounded-2xl w-full md:w-fit">
                    <button onClick={() => setViewMode('KANBAN')} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'KANBAN' ? 'bg-white dark:bg-gray-800 shadow-md text-primary' : 'text-gray-400'}`}><FaThLarge size={12}/> Kanban</button>
                    <button onClick={() => setViewMode('CALENDAR')} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'CALENDAR' ? 'bg-white dark:bg-gray-800 shadow-md text-primary' : 'text-gray-400'}`}><FaCalendarDay size={12}/> Calendario</button>
                    <button onClick={() => setViewMode('STATS')} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'STATS' ? 'bg-white dark:bg-gray-800 shadow-md text-primary' : 'text-gray-400'}`}><FaChartLine size={12}/> Métricas</button>
                </div>
                
                {isAdmin && (
                    <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-900/40 px-6 py-3 rounded-2xl w-full md:w-auto border border-gray-200 dark:border-gray-700">
                        <FaFilter className="text-gray-400 text-[10px]" />
                        <select value={filterCreator} onChange={(e) => setFilterCreator(e.target.value)} className="bg-transparent text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer dark:text-white">
                            <option value="ALL">TODOS LOS CREADORES</option>
                            {creators.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                )}
            </div>

            {viewMode === 'KANBAN' && renderKanban()}
            {viewMode === 'CALENDAR' && renderCalendar()}
            {viewMode === 'STATS' && renderStats()}

            {/* ====================================================================
                MODAL EDITOR (PORTAL)
            ==================================================================== */}
            {showModal && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-2xl w-full max-w-2xl flex flex-col max-h-[95vh] animate-in zoom-in duration-300">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h2 className="text-2xl font-black text-dark dark:text-white uppercase tracking-tight flex items-center gap-3 leading-none">{editingPost ? 'Editar Actividad' : 'Nueva Actividad Marketing'}</h2>
                                <p className="text-[10px] text-gray-400 font-bold uppercase mt-2 tracking-widest italic">Planificación Estratégica</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors p-1"><FaTimes size={24} /></button>
                        </div>

                        <form onSubmit={e => handleSave(e)} className="space-y-6 overflow-y-auto custom-scrollbar pr-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block italic">Plataforma Destino *</label>
                                    <select className="w-full input-style font-black text-[10px] uppercase" value={formData.plataforma} onChange={e => setFormData({...formData, plataforma: e.target.value})}>
                                        {platforms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block italic">Estatus</label>
                                    <select disabled={!isAdmin && editingPost && !formData.editAuthorized && formData.status !== 'BORRADOR'} className="w-full input-style font-black text-[10px] uppercase" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                                        {columns.map(col => <option key={col.id} value={col.id}>{col.title}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block italic">Título de la Actividad *</label>
                                    <input type="text" required disabled={!isAdmin && editingPost && !formData.editAuthorized && formData.status !== 'BORRADOR'} className="w-full input-style font-bold text-sm uppercase" value={formData.titulo} onChange={e => setFormData({...formData, titulo: e.target.value})} />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block italic">Descripción Creativa</label>
                                    <textarea rows="3" disabled={!isAdmin && editingPost && !formData.editAuthorized && formData.status !== 'BORRADOR'} className="w-full input-style text-xs font-medium resize-none" value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block italic">Fecha Programada</label><input type="date" disabled={!isAdmin && editingPost && !formData.editAuthorized && formData.status !== 'BORRADOR'} className="w-full input-style text-[10px] font-black" value={formData.fechaEntrega} onChange={e => setFormData({...formData, fechaEntrega: e.target.value})} /></div>
                                <div><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block italic">Link Recurso</label><input type="url" disabled={!isAdmin && editingPost && !formData.editAuthorized && formData.status !== 'BORRADOR'} className="w-full input-style text-[10px] font-bold text-primary" placeholder="https://..." value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} /></div>
                            </div>

                            {editingPost && (
                                <div className="p-5 bg-gray-50 dark:bg-gray-900/50 rounded-[2rem] border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl ${formData.editAuthorized ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>{formData.editAuthorized ? <FaLockOpen /> : <FaLock />}</div>
                                        <div><p className="text-[10px] font-black uppercase text-dark dark:text-white leading-none">Edición Completa</p><p className="text-[8px] font-bold text-gray-400 uppercase mt-1 italic">{formData.editAuthorized ? 'Habilitada por Admin' : 'Solo lectura (Bloqueada)'}</p></div>
                                    </div>
                                    {isAdmin ? (
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={formData.editAuthorized} onChange={e => setFormData({...formData, editAuthorized: e.target.checked})} className="sr-only peer" />
                                            <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-500"></div>
                                        </label>
                                    ) : (!formData.editAuthorized && <button type="button" onClick={() => handleSave(null, true)} className="bg-amber-500 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-amber-600 shadow-lg shadow-amber-500/20"><FaPaperPlane /> Solicitar Edición</button>)}
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row gap-3 pt-8 border-t dark:border-gray-700 mt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 rounded-2xl font-black uppercase text-[10px] bg-white dark:bg-gray-800 text-gray-500 border border-gray-200 dark:border-gray-700 shadow-sm">Cancelar</button>
                                <button type="submit" className="flex-[2] py-4 rounded-2xl font-black uppercase text-[10px] bg-primary text-white shadow-2xl shadow-primary/30 flex items-center justify-center gap-3"><FaSave size={16} /> {editingPost ? 'Guardar Cambios' : 'Registrar Actividad'}</button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* Modal Métricas (Simplificado) */}
            {showMetricsModal && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in zoom-in duration-300">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-2xl w-full max-w-md">
                        <h2 className="text-xl font-black uppercase italic mb-6 dark:text-white">Registrar Impacto</h2>
                        <form onSubmit={handleSaveMetric} className="space-y-4">
                            <select className="w-full input-style font-black text-[10px] uppercase" value={metricFormData.plataforma} onChange={e => setMetricFormData({...metricFormData, plataforma: e.target.value})}>
                                {platforms.slice(0,4).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                            <input type="number" required className="w-full input-style text-3xl font-black text-center" placeholder="0" value={metricFormData.seguidores} onChange={e => setMetricFormData({...metricFormData, seguidores: e.target.value})} />
                            <input type="date" required className="w-full input-style text-xs font-bold" value={metricFormData.fecha} onChange={e => setMetricFormData({...metricFormData, fecha: e.target.value})} />
                            <div className="flex flex-col gap-2 pt-4">
                                <button type="submit" className="w-full btn-primary py-4 rounded-2xl font-black uppercase text-[10px]">Guardar Registro</button>
                                <button type="button" onClick={() => setShowMetricsModal(false)} className="w-full py-2 text-[9px] font-black uppercase text-gray-400 tracking-widest">Cerrar</button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default Marketing;
