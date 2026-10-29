import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import { 
    FaPlus, FaCheck, FaTimes, FaExternalLinkAlt, 
    FaCalendarAlt, FaBullhorn, FaTrash, FaEdit, 
    FaRocket, FaEye, FaCheckDouble, FaFilter,
    FaThLarge, FaCalendarDay, FaChevronLeft, FaChevronRight,
    FaInstagram, FaTiktok, FaFacebook, FaYoutube, FaChartLine,
    FaGlobe, FaLock, FaLockOpen, FaPaperPlane, FaSave, FaHistory,
    FaSearch, FaInfoCircle, FaComments, FaExchangeAlt, FaLink,
    FaShareAlt, FaHeart
} from 'react-icons/fa';
import { 
    format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
    addDays, isSameMonth, isSameDay, addMonths, subMonths, parseISO,
    differenceInDays
} from 'date-fns';
import { es } from 'date-fns/locale';
import apiClient from '../../api/apiClient';
import { formatDate } from '../../utils/formatters';
import Swal from 'sweetalert2';
import { toast } from 'sonner';

const platforms = [
    { id: 'INSTAGRAM', name: 'Instagram', icon: <FaInstagram />, color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-950/30', border: 'border-pink-200 dark:border-pink-900/40' },
    { id: 'TIKTOK', name: 'TikTok', icon: <FaTiktok />, color: 'text-gray-900 dark:text-white', bg: 'bg-gray-100 dark:bg-gray-800', border: 'border-gray-200 dark:border-gray-700' },
    { id: 'FACEBOOK', name: 'Facebook', icon: <FaFacebook />, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-900/40' },
    { id: 'YOUTUBE', name: 'YouTube', icon: <FaYoutube />, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-200 dark:border-red-900/40' },
    { id: 'OTRO', name: 'Web / Otros', icon: <FaGlobe />, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-900/40' }
];

const WORK_COLUMNS = [
    { 
        id: 'BORRADOR', 
        title: '💡 Ideas & Borradores', 
        subtitle: 'Conceptos y guiones',
        badge: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
        accent: 'border-gray-200 dark:border-gray-700/80',
        icon: <FaPlus />
    },
    { 
        id: 'EN_PROCESO', 
        title: '⚡ En Producción', 
        subtitle: 'Diseño y grabación',
        badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
        accent: 'border-blue-200 dark:border-blue-800/80',
        icon: <FaRocket />
    },
    { 
        id: 'PENDIENTE_APROBACION', 
        title: '🧪 En Revisión', 
        subtitle: 'Aprobación creativa',
        badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
        accent: 'border-amber-200 dark:border-amber-800/80',
        icon: <FaEye />
    },
    { 
        id: 'APROBADO', 
        title: '🚀 Listo p/ Publicar', 
        subtitle: 'Contenido autorizado',
        badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
        accent: 'border-emerald-200 dark:border-emerald-800/80',
        icon: <FaCheck />
    },
    { 
        id: 'PUBLICADO', 
        title: '🎉 Publicado', 
        subtitle: 'En redes activo',
        badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
        accent: 'border-purple-200 dark:border-purple-800/80',
        icon: <FaCheckDouble />
    }
];

const Marketing = () => {
    const { user: authUser } = useAuth();
    const isAdmin = authUser?.role === 'ADMIN' || (authUser?.roles && authUser.roles.some(r => r.name?.toUpperCase() === 'ADMIN'));
    
    const [posts, setPosts] = useState([]);
    const [metrics, setMetrics] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modales y selección
    const [showModal, setShowModal] = useState(false);
    const [showMetricsModal, setShowMetricsModal] = useState(false);
    const [editingPost, setEditingPost] = useState(null);
    const [selectedDetailPost, setSelectedDetailPost] = useState(null);

    // Filtros y Vistas
    const [searchQuery, setSearchQuery] = useState('');
    const [filterPlatform, setFilterPlatform] = useState('ALL');
    const [filterCreator, setFilterCreator] = useState('ALL');
    const [viewMode, setViewMode] = useState('KANBAN'); // 'KANBAN' | 'CALENDAR' | 'STATS'
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Switcher de columnas en móvil (< md)
    const [mobileActiveColumn, setMobileActiveColumn] = useState('BORRADOR');

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

    const handleOpenDetail = (post) => {
        setSelectedDetailPost(post);
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
                const res = await apiClient.put(`/marketing/${editingPost.id}`, payload);
                toast.success(requestEdit ? 'Solicitud enviada al administrador' : 'Cambios guardados');
                if (selectedDetailPost && selectedDetailPost.id === editingPost.id) {
                    setSelectedDetailPost(res.data);
                }
            } else {
                await apiClient.post('/marketing', payload);
                toast.success('Nueva actividad de marketing registrada');
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
            const res = await apiClient.put(`/marketing/${id}`, { status: newStatus });
            loadData();
            if (selectedDetailPost && selectedDetailPost.id === id) {
                setSelectedDetailPost(res.data);
            }
            setMobileActiveColumn(newStatus);
            toast.success('Estado actualizado');
            if (newStatus === 'PENDIENTE_APROBACION') toast.info('Enviado a revisión para el encargado');
        } catch (error) {
            toast.error('Error al mover actividad');
        }
    };

    const handleAdminApproval = async (post, approved) => {
        const { value: comment } = await Swal.fire({
            title: approved ? '¿Aprobar Contenido?' : 'Rechazar / Pedir Cambios',
            input: 'textarea',
            inputLabel: approved ? 'Instrucciones o Felicitaciones (Opcional)' : 'Indica los cambios necesarios',
            showCancelButton: true,
            confirmButtonText: approved ? 'Autorizar' : 'Enviar Feedback',
            confirmButtonColor: approved ? '#10b981' : '#ef4444'
        });

        if (comment !== undefined) {
            try {
                const res = await apiClient.put(`/marketing/${post.id}`, { 
                    status: approved ? 'APROBADO' : 'BORRADOR',
                    comentariosAdmin: comment,
                    editAuthorized: false
                });
                loadData();
                if (selectedDetailPost && selectedDetailPost.id === post.id) {
                    setSelectedDetailPost(res.data);
                }
                toast.success(approved ? 'Contenido aprobado con éxito' : 'Feedback enviado al creador');
            } catch (error) {
                toast.error('Error al procesar aprobación');
            }
        }
    };

    const handleDelete = async (id) => {
        if (!isAdmin) return;
        const result = await Swal.fire({
            title: '¿Eliminar de forma permanente?',
            text: 'Esta publicación se retirará del planner.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });
        if (result.isConfirmed) {
            try {
                await apiClient.delete(`/marketing/${id}`);
                if (selectedDetailPost && selectedDetailPost.id === id) {
                    setSelectedDetailPost(null);
                }
                loadData();
                toast.success('Actividad eliminada');
            } catch (e) { toast.error('Error al borrar'); }
        }
    };

    const creators = useMemo(() => {
        return Array.from(new Set(posts.map(p => p.creadorId))).filter(Boolean)
            .map(id => {
                const post = posts.find(p => p.creadorId === id);
                return { id, name: post?.creador?.name || 'Colaborador' };
            });
    }, [posts]);

    const filteredPosts = useMemo(() => {
        return posts.filter(p => {
            if (isAdmin && filterCreator !== 'ALL' && p.creadorId !== filterCreator) return false;
            if (filterPlatform !== 'ALL' && p.plataforma !== filterPlatform) return false;
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchTitle = p.titulo?.toLowerCase().includes(q);
                const matchDesc = p.descripcion?.toLowerCase().includes(q);
                const matchPlat = p.plataforma?.toLowerCase().includes(q);
                if (!matchTitle && !matchDesc && !matchPlat) return false;
            }
            return true;
        });
    }, [posts, isAdmin, filterCreator, filterPlatform, searchQuery]);

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
            const res = await apiClient.put(`/marketing/${postId}`, updateData);
            loadData();
            if (selectedDetailPost && selectedDetailPost.id === postId) {
                setSelectedDetailPost(res.data);
            }
            toast.success('Actividad actualizada');
        } catch (e) { toast.error('Error al mover'); }
    };

    // Renderizado de tarjeta de contenido en el tablero
    const renderCard = (post) => {
        const platformObj = platforms.find(p => p.id === post.plataforma) || platforms[4];
        const canFullEdit = isAdmin || post.status === 'BORRADOR' || post.editAuthorized;
        const daysLeft = post.fechaEntrega ? differenceInDays(parseISO(post.fechaEntrega), new Date()) : null;
        const isOverdue = daysLeft !== null && daysLeft < 0 && post.status !== 'PUBLICADO';

        return (
            <div 
                key={post.id} 
                draggable 
                onDragStart={(e) => onDragStart(e, post)}
                onClick={() => handleOpenDetail(post)}
                className="bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xs border border-gray-100 dark:border-gray-700/80 group hover:shadow-md hover:border-primary/40 dark:hover:border-primary/40 transition-all cursor-pointer relative select-none active:scale-[0.99]"
            >
                {/* Cabecera de la tarjeta: Plataforma y Estado de Bloqueo */}
                <div className="flex justify-between items-center mb-3">
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl ${platformObj.bg} ${platformObj.color} border ${platformObj.border} text-xs font-black shadow-2xs`}>
                        {platformObj.icon}
                        <span className="text-[9px] uppercase tracking-wider">{platformObj.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                        {!canFullEdit && (
                            <span className="text-amber-600 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 px-2 py-0.5 rounded-lg flex items-center gap-1 text-[9px] font-bold" title="Bloqueado para cambios">
                                <FaLock size={9} />
                            </span>
                        )}
                        {post.comentariosAdmin && (
                            <span className="text-blue-600 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 px-2 py-0.5 rounded-lg flex items-center gap-1 text-[9px] font-bold" title="Feedback disponible">
                                <FaComments size={9} />
                            </span>
                        )}
                    </div>
                </div>

                {/* Título y Descripción Creativa */}
                <h4 className="font-black text-gray-900 dark:text-white mb-1.5 text-xs sm:text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                    {post.titulo}
                </h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-normal line-clamp-2 mb-3 leading-relaxed">
                    {post.descripcion || 'Sin descripción adicional registrada.'}
                </p>
                
                {/* Pie de la tarjeta: Fecha, Creador y Acciones */}
                <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-gray-700/70 text-xs">
                    <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold flex items-center gap-1 ${
                            isOverdue 
                                ? 'text-rose-600 dark:text-rose-400 font-black' 
                                : 'text-gray-400 dark:text-gray-400'
                        }`}>
                            <FaCalendarAlt size={10} />
                            {post.fechaEntrega ? formatDate(post.fechaEntrega, { month: 'short', day: 'numeric' }) : 'Sin fecha'}
                        </span>
                        {isOverdue && (
                            <span className="text-[8px] font-black uppercase px-1 rounded bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                                Vencido
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        {isAdmin && post.status === 'PENDIENTE_APROBACION' && (
                            <button 
                                onClick={() => handleAdminApproval(post, true)} 
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors"
                                title="Aprobar de inmediato"
                            >
                                <FaCheck size={11} />
                            </button>
                        )}
                        <button 
                            onClick={() => handleEdit(post)} 
                            className="p-1.5 text-gray-400 hover:text-primary rounded-lg transition-colors"
                            title="Editar"
                        >
                            <FaEdit size={12} />
                        </button>
                        {isAdmin && (
                            <button 
                                onClick={() => handleDelete(post.id)} 
                                className="p-1.5 text-gray-400 hover:text-rose-500 rounded-lg transition-colors"
                                title="Eliminar"
                            >
                                <FaTrash size={11} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // Renderizado del Tablero Kanban adaptado a Móvil y Escritorio
    const renderKanban = () => (
        <div className="space-y-4 animate-fade-in">
            {/* Selector de columnas exclusivo para Móvil (< md) */}
            <div className="flex md:hidden items-center gap-1.5 p-1.5 bg-gray-100/90 dark:bg-gray-800/90 rounded-2xl overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {WORK_COLUMNS.map((col) => {
                    const count = filteredPosts.filter(p => p.status === col.id).length;
                    const isActive = mobileActiveColumn === col.id;
                    return (
                        <button
                            key={col.id}
                            type="button"
                            onClick={() => setMobileActiveColumn(col.id)}
                            className={`flex-1 min-w-[125px] py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-95 ${
                                isActive
                                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs font-black ring-1 ring-black/5 dark:ring-white/10'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            <span>{col.title.split(' ')[0]}</span>
                            <span className="truncate">{col.title.split(' ').slice(1).join(' ')}</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                                isActive ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200'
                            }`}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Columnas Kanban: En móvil solo la activa, en escritorio todas en fila horizontal */}
            <div className="flex gap-5 overflow-x-auto pb-6 custom-scrollbar items-start">
                {WORK_COLUMNS.map(col => {
                    const columnPosts = filteredPosts.filter(p => p.status === col.id);
                    const isMobileActive = mobileActiveColumn === col.id;

                    return (
                        <div 
                            key={col.id} 
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => onDrop(e, col.id)}
                            className={`w-full md:w-80 flex-shrink-0 rounded-3xl border ${col.accent} bg-gray-50/70 dark:bg-gray-900/40 p-4 sm:p-5 flex-col gap-4 min-h-[550px] transition-colors ${
                                isMobileActive ? 'flex' : 'hidden md:flex'
                            }`}
                        >
                            {/* Cabecera de Columna */}
                            <div className="flex justify-between items-center px-1">
                                <div>
                                    <h3 className="font-black text-xs sm:text-sm text-gray-800 dark:text-white flex items-center gap-1.5">
                                        {col.title}
                                    </h3>
                                    <p className="text-[10px] text-gray-400 font-medium">
                                        {col.subtitle}
                                    </p>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-black ${col.badge}`}>
                                    {columnPosts.length}
                                </span>
                            </div>

                            {/* Lista de Tarjetas */}
                            <div className="flex-1 space-y-3 overflow-y-auto pr-0.5">
                                {columnPosts.length === 0 ? (
                                    <div className="border-2 border-dashed border-gray-200 dark:border-gray-700/60 rounded-2xl p-6 text-center text-gray-400 text-xs flex flex-col items-center justify-center h-44">
                                        <FaBullhorn className="text-2xl mb-2 opacity-30" />
                                        <span>Sin actividades en esta fase</span>
                                    </div>
                                ) : (
                                    columnPosts.map(post => renderCard(post))
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    // Renderizado del Calendario
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
                    <div 
                        key={day.toISOString()} 
                        onDragOver={(e) => e.preventDefault()} 
                        onDrop={(e) => onDrop(e, cloneDay)} 
                        className={`min-h-[110px] sm:min-h-[125px] p-2 border border-gray-100 dark:border-gray-800 transition-all ${
                            !isSameMonth(day, monthStart) ? "bg-gray-50/30 opacity-40" : "bg-white dark:bg-gray-900"
                        } ${isSameDay(day, new Date()) ? "ring-2 ring-primary ring-inset bg-primary/5" : ""}`}
                    >
                        <span className="text-[10px] font-black text-gray-400">{format(day, 'd')}</span>
                        <div className="flex flex-col gap-1 mt-1">
                            {dayPosts.map(p => {
                                const plat = platforms.find(pl => pl.id === p.plataforma) || platforms[4];
                                return (
                                    <div 
                                        key={p.id} 
                                        draggable 
                                        onDragStart={(e) => onDragStart(e, p)} 
                                        onClick={() => handleOpenDetail(p)} 
                                        className="text-[10px] font-bold p-1.5 rounded-lg truncate cursor-grab bg-primary text-white shadow-xs hover:opacity-90 flex items-center gap-1"
                                    >
                                        <span className="text-[9px]">{plat.icon}</span>
                                        <span className="truncate">{p.titulo}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
                day = addDays(day, 1);
            }
            rows.push(<div className="grid grid-cols-7" key={day.toISOString()}>{days}</div>);
            days = [];
        }

        return (
            <div className="flex flex-col xl:flex-row gap-6 animate-fade-in">
                <div className="flex-1 bg-white dark:bg-gray-800 rounded-3xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
                    <div className="p-4 sm:p-5 bg-gray-50/80 dark:bg-gray-900/60 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                        <h2 className="font-black text-base sm:text-lg text-gray-800 dark:text-white capitalize">
                            {format(currentMonth, 'MMMM yyyy', { locale: es })}
                        </h2>
                        <div className="flex items-center gap-1.5">
                            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 bg-white dark:bg-gray-800 rounded-xl shadow-xs border border-gray-200 dark:border-gray-700"><FaChevronLeft size={10}/></button>
                            <button onClick={() => setCurrentMonth(new Date())} className="px-3 py-1.5 bg-white dark:bg-gray-800 rounded-xl shadow-xs border border-gray-200 dark:border-gray-700 text-[10px] font-black uppercase">Hoy</button>
                            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 bg-white dark:bg-gray-800 rounded-xl shadow-xs border border-gray-200 dark:border-gray-700"><FaChevronRight size={10}/></button>
                        </div>
                    </div>
                    <div className="grid grid-cols-7 bg-gray-50/80 dark:bg-gray-900/60 border-b border-gray-100 dark:border-gray-700 text-center text-[10px] font-black uppercase text-gray-400 py-2.5">
                        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (<div key={d}>{d}</div>))}
                    </div>
                    <div>{rows}</div>
                </div>

                {/* Bandeja de entregas sin fecha */}
                <div className="w-full xl:w-80 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm space-y-4">
                    <p className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center gap-2">
                        <FaHistory /> Sin Fecha Programada ({undatedPosts.length})
                    </p>
                    <div className="space-y-2 overflow-y-auto max-h-[50vh] custom-scrollbar pr-1">
                        {undatedPosts.length === 0 ? (
                            <p className="text-xs text-gray-400 italic">Todas las publicaciones tienen fecha asignada.</p>
                        ) : (
                            undatedPosts.map(p => (
                                <div 
                                    key={p.id} 
                                    draggable 
                                    onDragStart={(e) => onDragStart(e, p)} 
                                    onClick={() => handleOpenDetail(p)}
                                    className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700 text-xs font-bold text-gray-700 dark:text-gray-200 cursor-grab hover:border-primary/50 transition-all truncate"
                                >
                                    {p.titulo}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // Renderizado de Métricas
    const renderStats = () => {
        const platformIds = ['INSTAGRAM', 'TIKTOK', 'FACEBOOK', 'YOUTUBE'];
        return (
            <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {platformIds.map(pId => {
                        const pObj = platforms.find(p => p.id === pId);
                        const platMetrics = metrics.filter(m => m.plataforma === pId);
                        const latest = platMetrics[0]?.seguidores || 0;
                        const prev = platMetrics[1]?.seguidores || 0;
                        const diff = latest - prev;
                        return (
                            <div key={pId} className="bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between">
                                <div className="flex items-center justify-between">
                                    <div className={`w-10 h-10 rounded-2xl ${pObj.bg} ${pObj.color} flex items-center justify-center text-lg shadow-2xs`}>
                                        {pObj.icon}
                                    </div>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{pObj.name}</span>
                                </div>
                                <div className="mt-4">
                                    <p className="text-2xl font-black text-gray-900 dark:text-white tabular-nums tracking-tight">
                                        {latest.toLocaleString()}
                                    </p>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <span className="text-[10px] text-gray-400 font-bold uppercase">Seguidores</span>
                                        {diff !== 0 && (
                                            <span className={`text-[10px] font-black px-1.5 py-0.2 rounded ${diff > 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'}`}>
                                                {diff > 0 ? `+${diff}` : diff}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col items-center justify-center min-h-[260px] gap-4 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-2xl">
                        <FaChartLine />
                    </div>
                    <div>
                        <h2 className="text-base sm:text-lg font-black text-gray-900 dark:text-white">Actualización Diaria de Impacto</h2>
                        <p className="text-xs text-gray-400 mt-1 max-w-md">Registra tus seguidores diariamente para generar el historial de crecimiento en cada plataforma digital.</p>
                    </div>
                    <button 
                        onClick={() => setShowMetricsModal(true)} 
                        className="px-6 py-3 bg-primary text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md hover:opacity-95 transition-all active:scale-95"
                    >
                        Registrar Seguidores Hoy
                    </button>
                </div>
            </div>
        );
    };

    if (loading) return (
        <div className="p-8 text-center flex flex-col items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-4">Cargando Marketing Planner...</p>
        </div>
    );

    return (
        <div className="space-y-6 animate-fade-in pb-16">
            {/* Cabecera Principal */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3 tracking-tight">
                        <div className="bg-primary p-2.5 rounded-2xl shadow-md shadow-primary/20 text-white">
                            <FaBullhorn className="text-xl" />
                        </div>
                        Marketing Planner
                    </h1>
                    <p className="text-xs text-gray-400 font-bold mt-1">
                        Calendario de contenidos, campañas publicitarias y gestión de redes
                    </p>
                </div>

                <div className="flex items-center gap-2.5 w-full md:w-auto">
                    <button 
                        onClick={() => setShowMetricsModal(true)} 
                        className="flex-1 md:flex-none px-4 py-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                        <FaChartLine /> Métricas
                    </button>
                    <button 
                        onClick={() => { setEditingPost(null); resetFormData(); setShowModal(true); }} 
                        className="flex-1 md:flex-none px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                        <FaPlus /> Crear Actividad
                    </button>
                </div>
            </div>

            {/* Barra de Filtros y Selector de Vistas */}
            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
                {/* Selector de Vistas */}
                <div className="flex bg-gray-100 dark:bg-gray-800/80 p-1 rounded-2xl border border-gray-200/60 dark:border-gray-700/60">
                    <button 
                        onClick={() => setViewMode('KANBAN')} 
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                            viewMode === 'KANBAN' 
                                ? 'bg-white dark:bg-gray-700 shadow-xs text-primary dark:text-white font-black' 
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                    >
                        <FaThLarge size={12}/> Tablero
                    </button>
                    <button 
                        onClick={() => setViewMode('CALENDAR')} 
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                            viewMode === 'CALENDAR' 
                                ? 'bg-white dark:bg-gray-700 shadow-xs text-primary dark:text-white font-black' 
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                    >
                        <FaCalendarDay size={12}/> Calendario
                    </button>
                    <button 
                        onClick={() => setViewMode('STATS')} 
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                            viewMode === 'STATS' 
                                ? 'bg-white dark:bg-gray-700 shadow-xs text-primary dark:text-white font-black' 
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                    >
                        <FaChartLine size={12}/> Impacto
                    </button>
                </div>
                
                {/* Filtros de Búsqueda y Creador */}
                <div className="flex flex-wrap items-center gap-2.5">
                    {/* Buscador */}
                    <div className="relative flex-1 md:w-56">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                        <input
                            type="text"
                            placeholder="Buscar en planner..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8 pr-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary w-full"
                        />
                    </div>

                    {/* Filtro por Plataforma */}
                    <select 
                        value={filterPlatform} 
                        onChange={(e) => setFilterPlatform(e.target.value)}
                        className="py-2 px-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-primary"
                    >
                        <option value="ALL">Todas las Redes</option>
                        {platforms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>

                    {/* Filtro Creador (Admin) */}
                    {isAdmin && (
                        <select 
                            value={filterCreator} 
                            onChange={(e) => setFilterCreator(e.target.value)} 
                            className="py-2 px-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="ALL">Todos los Creadores</option>
                            {creators.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    )}
                </div>
            </div>

            {/* Vistas */}
            {viewMode === 'KANBAN' && renderKanban()}
            {viewMode === 'CALENDAR' && renderCalendar()}
            {viewMode === 'STATS' && renderStats()}

            {/* ====================================================================
                MODAL DETALLE COMPLETO (Inspirado en Sistemas)
            ==================================================================== */}
            {selectedDetailPost && createPortal(
                <div 
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 md:p-6 bg-black/70 backdrop-blur-md animate-fade-in"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setSelectedDetailPost(null);
                    }}
                >
                    <div 
                        className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-4xl shadow-2xl border border-gray-100 dark:border-gray-700 flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Cabecera del Detalle */}
                        <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-slate-50 via-white to-pink-50/20 dark:from-gray-900 dark:via-gray-850 dark:to-pink-950/20 flex items-start justify-between gap-4">
                            <div className="space-y-1.5 min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    {(() => {
                                        const pObj = platforms.find(p => p.id === selectedDetailPost.plataforma) || platforms[4];
                                        return (
                                            <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1 ${pObj.bg} ${pObj.color} border ${pObj.border}`}>
                                                {pObj.icon} {pObj.name}
                                            </span>
                                        );
                                    })()}
                                    {(() => {
                                        const curCol = WORK_COLUMNS.find(c => c.id === selectedDetailPost.status);
                                        return (
                                            <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${curCol?.badge || 'bg-gray-100'}`}>
                                                {curCol?.title || selectedDetailPost.status}
                                            </span>
                                        );
                                    })()}
                                    {!isAdmin && selectedDetailPost.status !== 'BORRADOR' && !selectedDetailPost.editAuthorized && (
                                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 dark:bg-amber-900/40 dark:text-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                                            <FaLock size={9} /> Bloqueado
                                        </span>
                                    )}
                                </div>
                                <h2 className="text-base sm:text-lg md:text-xl font-black text-gray-900 dark:text-white leading-snug break-words">
                                    {selectedDetailPost.titulo}
                                </h2>
                            </div>

                            <button 
                                onClick={() => setSelectedDetailPost(null)} 
                                className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0 active:scale-95"
                                title="Cerrar ventana"
                            >
                                <FaTimes className="text-base" />
                            </button>
                        </div>

                        {/* Cuerpo del Modal: 2 Columnas Responsivas */}
                        <div className="flex-1 overflow-y-auto p-5 sm:p-6 custom-scrollbar">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
                                {/* Columna Izquierda: Información Creativa, Enlace y Cambio Directo de Estado (7 cols) */}
                                <div className="lg:col-span-7 space-y-5">
                                    {/* 1. DESCRIPCIÓN Y DETALLE CREATIVO */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                            <span className="flex items-center gap-1.5">
                                                <FaInfoCircle className="text-primary text-sm" />
                                                Descripción y Copy Creativo
                                            </span>
                                        </div>
                                        <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100/80 dark:border-blue-900/40">
                                            <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-200 whitespace-pre-line leading-relaxed select-text font-normal">
                                                {selectedDetailPost.descripcion?.trim() || 'No se registraron notas de copy o instrucciones escritas para este post.'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* 2. RECURSO O LINK MULTIMEDIA */}
                                    {selectedDetailPost.url && (
                                        <div className="space-y-2">
                                            <span className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                                <FaLink className="text-primary text-xs" /> Enlace de Material / Video
                                            </span>
                                            <a 
                                                href={selectedDetailPost.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs text-primary hover:underline group"
                                            >
                                                <span className="truncate max-w-md font-bold">{selectedDetailPost.url}</span>
                                                <FaExternalLinkAlt className="text-gray-400 group-hover:text-primary flex-shrink-0" />
                                            </a>
                                        </div>
                                    )}

                                    {/* 3. CAMBIO DIRECTO DE FASE / ESTADO */}
                                    <div className="space-y-2">
                                        <span className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                            <FaExchangeAlt className="text-primary text-xs" /> Mover de Fase
                                        </span>
                                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                                            {WORK_COLUMNS.map(col => {
                                                const isCurrent = selectedDetailPost.status === col.id;
                                                return (
                                                    <button
                                                        key={col.id}
                                                        type="button"
                                                        onClick={() => updateStatus(selectedDetailPost.id, col.id)}
                                                        className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-0.5 active:scale-95 ${
                                                            isCurrent 
                                                                ? 'bg-primary text-white border-primary shadow-xs font-black' 
                                                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-primary/50'
                                                        }`}
                                                    >
                                                        <span className="text-xs font-bold leading-tight truncate w-full">{col.title.split(' ')[1] || col.title}</span>
                                                        <span className={`text-[8px] ${isCurrent ? 'text-blue-100 font-bold' : 'text-gray-400'}`}>
                                                            {isCurrent ? '● Actual' : 'Mover'}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Columna Derecha: Cronograma, Creador, Feedback y Métricas (5 cols) */}
                                <div className="lg:col-span-5 space-y-5">
                                    {/* 1. FECHA PROGRAMADA */}
                                    <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-700/80 space-y-1.5">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                                            <FaCalendarAlt className="text-primary text-[10px]" /> Fecha Programada
                                        </span>
                                        <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                                            {selectedDetailPost.fechaEntrega 
                                                ? format(parseISO(selectedDetailPost.fechaEntrega), "dd 'de' MMMM, yyyy", { locale: es }) 
                                                : 'Sin fecha programada'}
                                        </p>
                                    </div>

                                    {/* 2. CREADOR / RESPONSABLE */}
                                    <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-700/80 space-y-1.5">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                                            Creador de la Publicación
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-lg bg-primary text-white flex items-center justify-center font-black text-xs">
                                                {(selectedDetailPost.creador?.name || 'C')[0]}
                                            </div>
                                            <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
                                                {selectedDetailPost.creador?.name || 'Colaborador de Marketing'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* 3. FEEDBACK / COMENTARIOS DEL ADMINISTRADOR */}
                                    <div className="space-y-2">
                                        <span className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                            <FaComments className="text-blue-500 text-xs" /> Instrucciones & Feedback
                                        </span>
                                        {selectedDetailPost.comentariosAdmin ? (
                                            <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-800/50 text-xs">
                                                <p className="text-gray-700 dark:text-gray-300 italic text-[11px] leading-relaxed">
                                                    "{selectedDetailPost.comentariosAdmin}"
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="p-3 text-center rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 text-xs text-gray-400 italic">
                                                Sin comentarios adicionales del líder.
                                            </div>
                                        )}

                                        {/* Acciones de aprobación rápida para Administrador */}
                                        {isAdmin && selectedDetailPost.status === 'PENDIENTE_APROBACION' && (
                                            <div className="flex gap-2 pt-1">
                                                <button
                                                    onClick={() => handleAdminApproval(selectedDetailPost, true)}
                                                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs"
                                                >
                                                    <FaCheck size={11} /> Aprobar
                                                </button>
                                                <button
                                                    onClick={() => handleAdminApproval(selectedDetailPost, false)}
                                                    className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs"
                                                >
                                                    <FaTimes size={11} /> Pedir Cambios
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* 4. MÉTRICAS DE IMPACTO (SI ESTÁ PUBLICADO) */}
                                    {selectedDetailPost.status === 'PUBLICADO' && (
                                        <div className="p-3.5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-800/40 space-y-2">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                                                <FaChartLine size={11} /> Rendimiento de la Publicación
                                            </span>
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div className="bg-white/80 dark:bg-gray-800 p-2 rounded-xl border border-purple-100 dark:border-purple-900/40">
                                                    <span className="text-[9px] text-gray-400 font-bold block">Vistas</span>
                                                    <p className="font-black text-gray-800 dark:text-white tabular-nums">{(selectedDetailPost.vistas || 0).toLocaleString()}</p>
                                                </div>
                                                <div className="bg-white/80 dark:bg-gray-800 p-2 rounded-xl border border-purple-100 dark:border-purple-900/40">
                                                    <span className="text-[9px] text-gray-400 font-bold block">Likes</span>
                                                    <p className="font-black text-gray-800 dark:text-white tabular-nums">{(selectedDetailPost.likes || 0).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Pie de Acciones del Modal */}
                        <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/90 dark:bg-gray-900/60 flex flex-wrap items-center justify-between gap-2.5">
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const p = selectedDetailPost;
                                        setSelectedDetailPost(null);
                                        handleEdit(p);
                                    }}
                                    className="px-3.5 py-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl transition-colors flex items-center gap-1.5 active:scale-95"
                                >
                                    <FaEdit size={11} /> Editar
                                </button>
                                {isAdmin && (
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(selectedDetailPost.id)}
                                        className="px-3.5 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 rounded-xl transition-colors flex items-center gap-1.5 active:scale-95"
                                    >
                                        <FaTrash size={11} /> Eliminar
                                    </button>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={() => setSelectedDetailPost(null)}
                                className="px-5 py-2 bg-gray-900 text-white dark:bg-gray-700 hover:bg-black dark:hover:bg-gray-600 text-xs font-bold rounded-xl transition-colors active:scale-95 shadow-sm ml-auto"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ====================================================================
                MODAL FORMULARIO DE EDICIÓN / REGISTRO
            ==================================================================== */}
            {showModal && createPortal(
                <div 
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 md:p-6 bg-black/70 backdrop-blur-md animate-fade-in"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setShowModal(false);
                    }}
                >
                    <div 
                        className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-2xl shadow-2xl border border-gray-100 dark:border-gray-700 flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Cabecera */}
                        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/60 flex justify-between items-center">
                            <div>
                                <h2 className="text-base sm:text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                                    <FaRocket className="text-primary" />
                                    {editingPost ? 'Editar Publicación' : 'Nueva Publicación de Marketing'}
                                </h2>
                                <p className="text-xs text-gray-400 font-bold mt-0.5">
                                    Define la plataforma, fecha programada y copy de la entrega
                                </p>
                            </div>
                            <button 
                                onClick={() => setShowModal(false)} 
                                className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        {/* Formulario */}
                        <form onSubmit={e => handleSave(e)} className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
                            {/* Selector Visual de Plataforma */}
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-2 block">
                                    Plataforma Destino *
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                    {platforms.map(p => {
                                        const isSelected = formData.plataforma === p.id;
                                        return (
                                            <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, plataforma: p.id })}
                                                className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1 active:scale-95 ${
                                                    isSelected
                                                        ? 'bg-primary text-white border-primary shadow-xs font-black'
                                                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-primary/40'
                                                }`}
                                            >
                                                <span className="text-base">{p.icon}</span>
                                                <span className="text-[10px] font-bold truncate">{p.name}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5 block">
                                        Estatus de la Actividad
                                    </label>
                                    <select 
                                        disabled={!isAdmin && editingPost && !formData.editAuthorized && formData.status !== 'BORRADOR'} 
                                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-xs font-bold text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary" 
                                        value={formData.status} 
                                        onChange={e => setFormData({...formData, status: e.target.value})}
                                    >
                                        {WORK_COLUMNS.map(col => <option key={col.id} value={col.id}>{col.title}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5 block">
                                        Fecha Programada de Entrega
                                    </label>
                                    <input 
                                        type="date" 
                                        disabled={!isAdmin && editingPost && !formData.editAuthorized && formData.status !== 'BORRADOR'} 
                                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-xs font-bold text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary" 
                                        value={formData.fechaEntrega} 
                                        onChange={e => setFormData({...formData, fechaEntrega: e.target.value})} 
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5 block">
                                    Título de la Publicación *
                                </label>
                                <input 
                                    type="text" 
                                    required 
                                    placeholder="Ej: Reel sobre purificadoras de agua comerciales"
                                    disabled={!isAdmin && editingPost && !formData.editAuthorized && formData.status !== 'BORRADOR'} 
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-xs font-bold text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary" 
                                    value={formData.titulo} 
                                    onChange={e => setFormData({...formData, titulo: e.target.value})} 
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5 block">
                                    Descripción Creativa / Copy
                                </label>
                                <textarea 
                                    rows="4" 
                                    placeholder="Escribe el copy sugerido, hashtags, objetivo del video o notas técnicas..."
                                    disabled={!isAdmin && editingPost && !formData.editAuthorized && formData.status !== 'BORRADOR'} 
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-xs font-normal text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary resize-none leading-relaxed" 
                                    value={formData.descripcion} 
                                    onChange={e => setFormData({...formData, descripcion: e.target.value})} 
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5 block">
                                    Enlace al Recurso (Drive / Canva / Video)
                                </label>
                                <input 
                                    type="url" 
                                    placeholder="https://drive.google.com/..."
                                    disabled={!isAdmin && editingPost && !formData.editAuthorized && formData.status !== 'BORRADOR'} 
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-xs font-bold text-primary outline-none focus:ring-2 focus:ring-primary" 
                                    value={formData.url} 
                                    onChange={e => setFormData({...formData, url: e.target.value})} 
                                />
                            </div>

                            {/* Panel de Autorización (Admin o Solicitud de Edición) */}
                            {editingPost && (
                                <div className="p-4 bg-gray-50 dark:bg-gray-900/60 rounded-2xl border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl text-base ${formData.editAuthorized ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                            {formData.editAuthorized ? <FaLockOpen /> : <FaLock />}
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-gray-800 dark:text-white leading-tight">Autorización de Cambios</p>
                                            <p className="text-[10px] text-gray-400 font-bold">{formData.editAuthorized ? 'Edición libre habilitada' : 'Bloqueado tras revisión'}</p>
                                        </div>
                                    </div>
                                    {isAdmin ? (
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={formData.editAuthorized} 
                                                onChange={e => setFormData({...formData, editAuthorized: e.target.checked})} 
                                                className="sr-only peer" 
                                            />
                                            <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-500"></div>
                                        </label>
                                    ) : (
                                        !formData.editAuthorized && (
                                            <button 
                                                type="button" 
                                                onClick={() => handleSave(null, true)} 
                                                className="bg-amber-500 hover:bg-amber-600 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95"
                                            >
                                                <FaPaperPlane size={10} /> Solicitar Desbloqueo
                                            </button>
                                        )
                                    )}
                                </div>
                            )}

                            {/* Botones de Guardar */}
                            <div className="flex gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                                <button 
                                    type="button" 
                                    onClick={() => setShowModal(false)} 
                                    className="flex-1 py-3 text-xs font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    className="flex-[2] py-3 bg-primary text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2 active:scale-95"
                                >
                                    <FaSave size={14} /> {editingPost ? 'Guardar Cambios' : 'Registrar Publicación'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* ====================================================================
                MODAL REGISTRO DE SEGUIDORES E IMPACTO
            ==================================================================== */}
            {showMetricsModal && createPortal(
                <div 
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setShowMetricsModal(false);
                    }}
                >
                    <div 
                        className="bg-white dark:bg-gray-800 p-6 sm:p-7 rounded-3xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-gray-700"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-base sm:text-lg font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <FaChartLine className="text-primary" /> Registrar Seguidores
                        </h2>
                        <form onSubmit={handleSaveMetric} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1 block">Red Social</label>
                                <select 
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-xs font-bold text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary" 
                                    value={metricFormData.plataforma} 
                                    onChange={e => setMetricFormData({...metricFormData, plataforma: e.target.value})}
                                >
                                    {platforms.slice(0,4).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1 block">Cantidad Total de Seguidores</label>
                                <input 
                                    type="number" 
                                    required 
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-2xl font-black text-center text-primary outline-none focus:ring-2 focus:ring-primary" 
                                    placeholder="0" 
                                    value={metricFormData.seguidores} 
                                    onChange={e => setMetricFormData({...metricFormData, seguidores: e.target.value})} 
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1 block">Fecha del Conteo</label>
                                <input 
                                    type="date" 
                                    required 
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-xs font-bold text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary" 
                                    value={metricFormData.fecha} 
                                    onChange={e => setMetricFormData({...metricFormData, fecha: e.target.value})} 
                                />
                            </div>

                            <div className="flex gap-2.5 pt-2">
                                <button 
                                    type="button" 
                                    onClick={() => setShowMetricsModal(false)} 
                                    className="flex-1 py-3 text-xs font-bold text-gray-500 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    className="flex-[2] py-3 bg-primary text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md hover:opacity-95"
                                >
                                    Guardar Conteo
                                </button>
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
