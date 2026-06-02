import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
    FaPlus, FaCheck, FaTimes, FaExternalLinkAlt, 
    FaCommentAlt, FaCalendarAlt, FaBullhorn, FaTrash, FaEdit, 
    FaRocket, FaPauseCircle, FaEye, FaCheckDouble, FaUserCircle, FaFilter,
    FaThLarge, FaThList, FaCalendarDay, FaChevronLeft, FaChevronRight,
    FaCheckCircle, FaInfoCircle, FaInstagram, FaTiktok, FaFacebook, FaYoutube, FaChartLine,
    FaGlobe, FaArrowUp
} from 'react-icons/fa';
import { 
    format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
    addDays, isSameMonth, isSameDay, addMonths, subMonths 
} from 'date-fns';
import { es } from 'date-fns/locale';
import apiClient from '../../api/apiClient';
import { formatDate } from '../../utils/formatters';
import Swal from 'sweetalert2';

const platforms = [
    { id: 'INSTAGRAM', name: 'Instagram', icon: <FaInstagram />, color: 'text-pink-500' },
    { id: 'TIKTOK', name: 'TikTok', icon: <FaTiktok />, color: 'text-black dark:text-white' },
    { id: 'FACEBOOK', name: 'Facebook', icon: <FaFacebook />, color: 'text-blue-600' },
    { id: 'YOUTUBE', name: 'YouTube', icon: <FaYoutube />, color: 'text-red-600' },
    { id: 'OTRO', name: 'Web / Otro', icon: <FaGlobe />, color: 'text-gray-500' }
];

const Marketing = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';
    
    const [posts, setPosts] = useState([]);
    const [metrics, setMetrics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showMetricsModal, setShowMetricsModal] = useState(false);
    const [editingPost, setEditingPost] = useState(null);
    const [filterCreator, setFilterCreator] = useState('ALL');
    const [viewMode, setViewMode] = useState('KANBAN'); // KANBAN, GRID, CALENDAR, STATS
    const [currentMonth, setCurrentMonth] = useState(new Date());
    
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
        status: 'BORRADOR',
        plataforma: 'INSTAGRAM',
        vistas: 0,
        likes: 0,
        compartidos: 0,
        seguidoresGanados: 0
    });

    const [metricFormData, setMetricFormData] = useState({
        plataforma: 'INSTAGRAM',
        seguidores: '',
        fecha: format(new Date(), 'yyyy-MM-dd')
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [postsRes, metricsRes] = await Promise.all([
                apiClient.get('/marketing'),
                apiClient.get('/marketing/metrics')
            ]);
            setPosts(postsRes.data);
            setMetrics(metricsRes.data);
        } catch (error) {
            console.error('Error fetching marketing data:', error);
        } finally {
            setLoading(false);
        }
    };

    const resetFormData = (overrides = {}) => {
        setFormData({
            titulo: '',
            descripcion: '',
            url: '',
            fechaEntrega: '',
            status: 'BORRADOR',
            plataforma: 'INSTAGRAM',
            vistas: 0,
            likes: 0,
            compartidos: 0,
            seguidoresGanados: 0,
            ...overrides
        });
    };

    const handleEdit = (post) => {
        setEditingPost(post);
        setFormData({
            titulo: post.titulo || '',
            descripcion: post.descripcion || '',
            url: post.url || '',
            fechaEntrega: post.fechaEntrega ? post.fechaEntrega.split('T')[0] : '',
            status: post.status || 'BORRADOR',
            plataforma: post.plataforma || 'INSTAGRAM',
            vistas: post.vistas || 0,
            likes: post.likes || 0,
            compartidos: post.compartidos || 0,
            seguidoresGanados: post.seguidoresGanados || 0,
            comentariosAdmin: post.comentariosAdmin || ''
        });
        setShowModal(true);
    };

    const creators = Array.from(new Set(posts.map(p => p.creadorId)))
        .map(id => {
            const post = posts.find(p => p.creadorId === id);
            return { id, name: post?.creador?.name || 'Desconocido' };
        });

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            // Asegurarnos de enviar datos limpios
            const payload = {
                ...formData,
                vistas: parseInt(formData.vistas) || 0,
                likes: parseInt(formData.likes) || 0,
                compartidos: parseInt(formData.compartidos) || 0,
                seguidoresGanados: parseInt(formData.seguidoresGanados) || 0
            };

            if (editingPost) {
                await apiClient.put(`/marketing/${editingPost.id}`, payload);
            } else {
                await apiClient.post('/marketing', payload);
            }
            setShowModal(false);
            setEditingPost(null);
            loadData();
            Swal.fire({ title: '¡Logrado!', text: 'La actividad ha sido registrada.', icon: 'success', timer: 1500, showConfirmButton: false });
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
            Swal.fire({ title: 'Métrica guardada', icon: 'success', timer: 1500, showConfirmButton: false });
        } catch (error) {
            Swal.fire('Error', 'No se pudo guardar la métrica', 'error');
        }
    };

    const updateStatus = async (id, newStatus) => {
        try {
            await apiClient.put(`/marketing/${id}`, { status: newStatus });
            loadData();
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
                loadData();
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
            loadData();
            Swal.fire('Eliminado', '', 'success');
        }
    };

    const filteredPosts = posts.filter(p => {
        if (isAdmin && filterCreator !== 'ALL' && p.creadorId !== filterCreator) return false;
        return true;
    });

    const parseCalendarDate = (dateInput) => {
        if (!dateInput) return null;
        const dateStr = typeof dateInput === 'string' ? dateInput : dateInput.toISOString();
        const [y, m, d] = dateStr.split('T')[0].split('-').map(Number);
        return new Date(y, m - 1, d);
    };

    const renderCard = (post) => {
        const platformObj = platforms.find(p => p.id === post.plataforma) || platforms[4];
        return (
            <div key={post.id} className="bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                {post.status === 'APROBADO' && (
                    <div className="absolute -top-1 -right-1 bg-emerald-500 text-white p-2.5 sm:p-3 rounded-bl-3xl shadow-lg z-10 animate-in zoom-in duration-500">
                        <FaCheckCircle size={14} />
                    </div>
                )}
                {post.status === 'PUBLICADO' && (
                    <div className="absolute -top-1 -right-1 bg-purple-500 text-white p-2.5 sm:p-3 rounded-bl-3xl shadow-lg z-10">
                        <FaCheckDouble size={14} />
                    </div>
                )}
                
                <div className="flex justify-between items-start mb-3">
                    <div className={`flex items-center gap-1.5 p-1.5 rounded-xl bg-gray-50 dark:bg-gray-900 ${platformObj.color}`}>
                        {platformObj.icon}
                        <span className="text-[8px] font-black uppercase">{platformObj.name}</span>
                    </div>
                    {isAdmin && (
                        <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-900 px-2 py-1 rounded-lg">
                            <FaUserCircle className="text-gray-400 text-[10px]" />
                            <span className="text-[9px] font-black uppercase tracking-tighter text-gray-500">{post.creador?.name}</span>
                        </div>
                    )}
                </div>

                <h4 className="font-black text-gray-800 dark:text-white mb-2 leading-tight uppercase text-xs sm:text-sm">{post.titulo}</h4>
                <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium line-clamp-3 mb-4 leading-relaxed">{post.descripcion}</p>
                
                {post.status === 'PUBLICADO' && (
                    <div className="grid grid-cols-3 gap-2 mb-4 bg-gray-50 dark:bg-gray-900/50 p-2 rounded-2xl border border-gray-100 dark:border-gray-700">
                        <div className="flex flex-col items-center">
                            <span className="text-[8px] font-black text-gray-400 uppercase">Likes</span>
                            <span className="text-[10px] font-black text-pink-500">{post.likes || 0}</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-[8px] font-black text-gray-400 uppercase">Views</span>
                            <span className="text-[10px] font-black text-blue-500">{post.vistas || 0}</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-[8px] font-black text-gray-400 uppercase">Fans+</span>
                            <span className="text-[10px] font-black text-emerald-500">+{post.seguidoresGanados || 0}</span>
                        </div>
                    </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t dark:border-gray-700">
                    <div className={`flex items-center gap-1 px-1.5 py-1 rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-tighter ${
                        post.fechaEntrega && new Date(post.fechaEntrega) < new Date() && post.status !== 'PUBLICADO' ? 'bg-red-50 text-red-500' : 'bg-gray-50 dark:bg-gray-900 text-gray-400'
                    }`}>
                        <FaCalendarAlt /> 
                        {post.fechaEntrega ? formatDate(post.fechaEntrega, { month: 'short', day: 'numeric' }) : 'S/F'}
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                        {isAdmin && post.status === 'PENDIENTE_APROBACION' && (
                            <div className="flex bg-gray-50 dark:bg-gray-900 p-1 rounded-xl gap-1">
                                <button onClick={() => handleAdminApproval(post, true)} className="p-1.5 text-emerald-500 hover:bg-emerald-100 rounded-lg transition-colors"><FaCheck size={10} /></button>
                                <button onClick={() => handleAdminApproval(post, false)} className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg transition-colors"><FaTimes size={10} /></button>
                            </div>
                        )}
                        <div className="flex gap-1">
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
                        <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 mx-0.5"></div>
                        <button onClick={() => handleEdit(post)} className="text-gray-400 hover:text-primary transition-colors"><FaEdit size={12} /></button>
                        <button onClick={() => handleDelete(post.id)} className="text-gray-400 hover:text-red-500 transition-colors"><FaTrash size={12} /></button>
                    </div>
                </div>
            </div>
        );
    };

    const onDragStart = (e, post) => {
        e.dataTransfer.setData("postId", post.id);
        e.dataTransfer.effectAllowed = "move";
    };

    const onDrop = async (e, date) => {
        e.preventDefault();
        const postId = e.dataTransfer.getData("postId");
        if (!postId) return;
        try {
            const dateStr = format(date, 'yyyy-MM-dd');
            await apiClient.put(`/marketing/${postId}`, { fechaEntrega: dateStr });
            loadData();
            Swal.fire({
                title: '¡Fecha Asignada!',
                text: `Contenido programado para el ${format(date, 'd MMMM', { locale: es })}`,
                icon: 'success',
                timer: 1500,
                showConfirmButton: false,
                toast: true,
                position: 'top-end'
            });
        } catch (error) {
            Swal.fire('Error', 'No se pudo actualizar la fecha', 'error');
        }
    };

    const onDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const renderCalendar = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);
        const dateFormat = "d";
        const rows = [];
        let days = [];
        let day = startDate;
        const undatedPosts = filteredPosts.filter(p => !p.fechaEntrega);

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                const cloneDay = day;
                const dayPosts = filteredPosts.filter(p => p.fechaEntrega && isSameDay(parseCalendarDate(p.fechaEntrega), cloneDay));
                days.push(
                    <div
                        key={day}
                        onDragOver={onDragOver}
                        onDrop={(e) => onDrop(e, cloneDay)}
                        className={`min-h-[100px] sm:min-h-[140px] p-1 sm:p-2 border border-gray-100 dark:border-gray-800 transition-all group/day ${
                            !isSameMonth(day, monthStart) ? "bg-gray-50/30 text-gray-300" : "bg-white dark:bg-gray-900"
                        } ${isSameDay(day, new Date()) ? "ring-2 ring-primary ring-inset bg-primary/5" : ""}`}
                    >
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] sm:text-xs font-black opacity-40">{format(day, dateFormat)}</span>
                            <button 
                                onClick={() => { 
                                    const dateStr = format(cloneDay, 'yyyy-MM-dd');
                                    setEditingPost(null); 
                                    resetFormData({ fechaEntrega: dateStr });
                                    setShowModal(true); 
                                }}
                                className="opacity-0 group-hover/day:opacity-100 p-1 text-primary hover:bg-primary/10 rounded-lg transition-all"
                            >
                                <FaPlus size={10} />
                            </button>
                        </div>
                        <div className="flex flex-col gap-1">
                            {dayPosts.map(p => (
                                <div 
                                    key={p.id} 
                                    draggable
                                    onDragStart={(e) => onDragStart(e, p)}
                                    onClick={() => handleEdit(p)}
                                    className={`text-[7px] sm:text-[9px] font-black p-1 sm:p-1.5 rounded-lg sm:rounded-xl truncate cursor-grab active:cursor-grabbing hover:scale-105 transition-all shadow-sm border border-black/5 ${
                                        p.status === 'PUBLICADO' ? 'bg-purple-500 text-white' :
                                        p.status === 'APROBADO' ? 'bg-emerald-500 text-white' :
                                        p.status === 'PENDIENTE_APROBACION' ? 'bg-orange-500 text-white' :
                                        p.status === 'EN_PROCESO' ? 'bg-blue-500 text-white' :
                                        'bg-gray-500 text-white'
                                    }`}
                                >
                                    {p.titulo}
                                </div>
                            ))}
                        </div>
                    </div>
                );
                day = addDays(day, 1);
            }
            rows.push(<div className="grid grid-cols-7" key={day}>{days}</div>);
            days = [];
        }

        return (
            <div className="flex flex-col xl:flex-row gap-6 animate-in fade-in duration-500">
                {/* Calendario Principal */}
                <div className="flex-1 bg-white dark:bg-gray-800 rounded-[2rem] sm:rounded-[2.5rem] shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700 order-1">
                    <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-900 border-b flex justify-between items-center">
                        <h2 className="font-black uppercase italic tracking-tighter text-lg sm:text-xl text-primary">
                            {format(currentMonth, 'MMMM yyyy', { locale: es })}
                        </h2>
                        <div className="flex gap-2">
                            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 sm:p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:text-primary transition-all"><FaChevronLeft size={10}/></button>
                            <button onClick={() => setCurrentMonth(new Date())} className="px-3 sm:px-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm text-[8px] sm:text-[10px] font-black uppercase">Hoy</button>
                            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 sm:p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:text-primary transition-all"><FaChevronRight size={10}/></button>
                        </div>
                    </div>
                    <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-900 border-b">
                        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
                            <div key={d} className="py-2 sm:py-3 text-center text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400">{d}</div>
                        ))}
                    </div>
                    <div className="overflow-hidden">{rows}</div>
                </div>

                {/* Sidebar de Pendientes */}
                <div className="w-full xl:w-72 flex-shrink-0 bg-white dark:bg-gray-800 rounded-[2rem] sm:rounded-[2.5rem] border border-gray-100 dark:border-gray-700 p-6 shadow-xl flex flex-col gap-6 order-2 xl:order-1">
                    <div>
                        <h3 className="text-sm font-black uppercase italic tracking-tighter text-gray-800 dark:text-white flex items-center gap-2">
                            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                            Sin Fecha Asignada
                        </h3>
                        <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-widest">Arrastra al calendario</p>
                    </div>
                    <div className="flex flex-col gap-3 max-h-[40vh] xl:max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                        {undatedPosts.length === 0 ? (
                            <div className="py-8 text-center border-2 border-dashed border-gray-100 dark:border-gray-700 rounded-3xl">
                                <p className="text-[10px] font-black text-gray-300 uppercase italic">Todo programado</p>
                            </div>
                        ) : (
                            undatedPosts.map(p => (
                                <div 
                                    key={p.id} 
                                    draggable
                                    onDragStart={(e) => onDragStart(e, p)}
                                    className={`p-4 rounded-2xl border-2 border-transparent cursor-grab active:cursor-grabbing hover:border-primary/30 transition-all shadow-sm ${
                                        p.status === 'PUBLICADO' ? 'bg-purple-50/50 dark:bg-purple-900/10' :
                                        p.status === 'APROBADO' ? 'bg-emerald-50/50 dark:bg-emerald-900/10' :
                                        p.status === 'PENDIENTE_APROBACION' ? 'bg-orange-50/50 dark:bg-orange-900/10' :
                                        p.status === 'EN_PROCESO' ? 'bg-blue-50/50 dark:bg-blue-900/10' :
                                        'bg-gray-50/50 dark:bg-gray-900/30'
                                    }`}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className={`w-1.5 h-1.5 rounded-full ${
                                            p.status === 'PUBLICADO' ? 'bg-purple-500' :
                                            p.status === 'APROBADO' ? 'bg-emerald-500' :
                                            p.status === 'PENDIENTE_APROBACION' ? 'bg-orange-500' :
                                            p.status === 'EN_PROCESO' ? 'bg-blue-500' :
                                            'bg-gray-500'
                                        }`}></div>
                                        <span className="text-[8px] font-black uppercase tracking-tighter opacity-50">{p.status}</span>
                                    </div>
                                    <h4 className="text-[10px] font-black uppercase leading-tight dark:text-white">{p.titulo}</h4>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderStats = () => {
        const platformsList = ['INSTAGRAM', 'TIKTOK', 'FACEBOOK', 'YOUTUBE'];
        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {platformsList.map(pId => {
                        const pObj = platforms.find(p => p.id === pId);
                        const platformMetrics = metrics.filter(m => m.plataforma === pId);
                        const latest = platformMetrics[0]?.seguidores || 0;
                        const previous = platformMetrics[1]?.seguidores || 0;
                        const diff = latest - previous;

                        return (
                            <div key={pId} className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-xl">
                                <div className="flex justify-between items-center mb-4">
                                    <div className={`p-3 rounded-2xl bg-gray-50 dark:bg-gray-900 ${pObj.color}`}>
                                        {pObj.icon}
                                    </div>
                                    {diff !== 0 && (
                                        <div className={`flex items-center gap-1 text-[10px] font-black ${diff > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                            <FaArrowUp className={diff < 0 ? 'rotate-180' : ''} />
                                            {Math.abs(diff)}
                                        </div>
                                    )}
                                </div>
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{pObj.name}</h3>
                                <p className="text-3xl font-black text-dark dark:text-white tracking-tighter">{latest.toLocaleString()}</p>
                                <p className="text-[9px] text-gray-500 font-bold mt-1 uppercase tracking-tighter italic">Seguidores Totales</p>
                            </div>
                        );
                    })}
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-2xl overflow-hidden">
                    <div className="p-6 sm:p-8 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                        <div>
                            <h2 className="text-xl font-black uppercase italic tracking-tighter text-dark dark:text-white">Registro Histórico</h2>
                            <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Control de crecimiento de comunidad</p>
                        </div>
                        <button 
                            onClick={() => setShowMetricsModal(true)}
                            className="bg-dark dark:bg-white text-white dark:text-dark px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all"
                        >
                            Registrar Hoy
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-900/50">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Fecha</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Instagram</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">TikTok</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Facebook</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">YouTube</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {Array.from(new Set(metrics.map(m => m.fecha.split('T')[0]))).sort((a,b) => b.localeCompare(a)).map(date => (
                                    <tr key={date} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="text-[11px] font-black text-gray-800 dark:text-gray-200 uppercase">{formatDate(date, { day: 'numeric', month: 'short' })}</span>
                                        </td>
                                        {['INSTAGRAM', 'TIKTOK', 'FACEBOOK', 'YOUTUBE'].map(pId => {
                                            const m = metrics.find(m => m.fecha.split('T')[0] === date && m.plataforma === pId);
                                            return (
                                                <td key={pId} className="px-6 py-4 text-center">
                                                    <span className="text-[12px] font-mono font-bold text-gray-600 dark:text-gray-400">{m ? m.seguidores.toLocaleString() : '---'}</span>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) return (
        <div className="p-8 text-center flex flex-col items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
            <p className="text-gray-500 font-medium italic">Preparando el tablero de marketing...</p>
        </div>
    );

    return (
        <div className="p-4 md:p-8 space-y-6 md:space-y-8 bg-gray-50/50 dark:bg-transparent min-h-full">
            <div className="flex flex-col gap-6 md:gap-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-2xl sm:text-4xl font-black text-gray-800 dark:text-white flex items-center gap-3 sm:gap-4 tracking-tighter uppercase italic">
                            <div className="bg-primary p-2 sm:p-3 rounded-xl sm:rounded-2xl shadow-lg shadow-primary/20 text-white">
                                <FaBullhorn className="text-xl sm:text-2xl" />
                            </div>
                            MARKETING PLANNER
                        </h1>
                        <p className="text-[10px] sm:text-sm text-gray-500 font-bold mt-1 sm:mt-2 flex items-center gap-2">
                            <FaPauseCircle className="text-primary" />
                            Tablero de Productividad Creativa
                        </p>
                    </div>
                    <button 
                        onClick={() => { setEditingPost(null); resetFormData(); setShowModal(true); }}
                        className="btn-primary flex items-center justify-center gap-3 py-4 px-6 sm:px-10 rounded-2xl shadow-2xl shadow-primary/30 font-black uppercase text-[10px] sm:text-xs tracking-widest hover:scale-105 active:scale-95 transition-all w-full md:w-auto"
                    >
                        <FaPlus /> Nueva Actividad
                    </button>
                </div>
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-gray-800/50 p-1.5 sm:p-2 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <div className="flex p-1 bg-gray-100 dark:bg-gray-900 rounded-2xl w-full md:w-auto overflow-x-auto no-scrollbar">
                        <button onClick={() => setViewMode('KANBAN')} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${viewMode === 'KANBAN' ? 'bg-white dark:bg-gray-800 text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                            <FaThLarge size={12}/> Kanban
                        </button>
                        <button onClick={() => setViewMode('GRID')} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${viewMode === 'GRID' ? 'bg-white dark:bg-gray-800 text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                            <FaThList size={12}/> Grid
                        </button>
                        <button onClick={() => setViewMode('CALENDAR')} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${viewMode === 'CALENDAR' ? 'bg-white dark:bg-gray-800 text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                            <FaCalendarDay size={12}/> Calendario
                        </button>
                        <button onClick={() => setViewMode('STATS')} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${viewMode === 'STATS' ? 'bg-white dark:bg-gray-800 text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                            <FaChartLine size={12}/> Seguidores
                        </button>
                    </div>
                    {isAdmin && (
                        <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-900 px-4 sm:px-6 py-3 rounded-2xl w-full md:w-auto border border-transparent focus-within:border-primary/30 transition-all">
                            <FaFilter className="text-gray-400 text-[10px]" />
                            <select value={filterCreator} onChange={(e) => setFilterCreator(e.target.value)} className="bg-transparent text-[9px] sm:text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer w-full">
                                <option value="ALL">TODOS LOS CREADORES</option>
                                {creators.map(c => <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>)}
                            </select>
                        </div>
                    )}
                </div>
            </div>

            {viewMode !== 'STATS' && (
                <div className="flex items-center gap-6 bg-white dark:bg-gray-800/30 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-x-auto no-scrollbar animate-in fade-in duration-700">
                    <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[2px] text-gray-400 flex items-center gap-2 whitespace-nowrap">
                        <FaInfoCircle className="text-primary" /> Leyenda:
                    </p>
                    <div className="flex items-center gap-6">
                        {columns.map(col => (
                            <div key={col.id} className="flex items-center gap-2 whitespace-nowrap">
                                <div className={`w-2.5 h-2.5 rounded-full ${col.label} shadow-sm`}></div>
                                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">{col.title.split(' ')[0]}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {viewMode === 'KANBAN' && (
                <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-8 custom-scrollbar scroll-smooth items-start animate-in fade-in duration-500">
                    {columns.map(col => (
                        <div key={col.id} className={`flex-shrink-0 w-[280px] sm:w-80 rounded-[2rem] sm:rounded-[2.5rem] border-2 border-dashed ${col.color} ${col.bg} p-4 sm:p-5 flex flex-col gap-4 sm:gap-5 min-h-[60vh] sm:min-h-[70vh]`}>
                            <div className="flex justify-between items-center px-2">
                                <h3 className="font-black uppercase text-[9px] sm:text-[10px] tracking-[2px] sm:tracking-[3px] text-gray-500 flex items-center gap-2">
                                    <span className={`${col.label} text-white p-1.5 rounded-lg text-[9px]`}>{col.icon}</span>
                                    {col.title}
                                </h3>
                                <span className="bg-white dark:bg-gray-800 px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-black shadow-sm border border-gray-100 dark:border-gray-700">
                                    {filteredPosts.filter(p => p.status === col.id).length}
                                </span>
                            </div>
                            <div className="flex flex-col gap-4">
                                {filteredPosts.filter(p => p.status === col.id).map(post => renderCard(post))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {viewMode === 'GRID' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {filteredPosts.map(post => renderCard(post))}
                </div>
            )}

            {viewMode === 'CALENDAR' && renderCalendar()}
            {viewMode === 'STATS' && renderStats()}

            {/* Modal de Actividad (Rediseñado) */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-300">
                    {/* Fondo oscuro completo sin blur para evitar el bug de la línea superior en navegadores móviles */}
                    <div className="absolute inset-0 bg-slate-900/80 w-full h-[100dvh] z-0"></div>
                    
                    <div className="relative z-10 bg-white dark:bg-gray-800 w-full max-w-2xl rounded-[1.5rem] sm:rounded-[2rem] shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 max-h-[90vh] flex flex-col">
                        
                        {/* Header Limpio */}
                        <div className="px-6 py-5 sm:px-8 sm:py-6 border-b dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800">
                            <div>
                                <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                                    {editingPost ? 'Editar Contenido' : 'Nuevo Contenido'}
                                </h2>
                                <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">Planificación Estratégica</p>
                            </div>
                            <button 
                                onClick={() => setShowModal(false)} 
                                className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-colors"
                            >
                                <FaTimes size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-8 space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider ml-1">Plataforma Destino</label>
                                    <div className="relative">
                                        <select 
                                            className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 p-3.5 rounded-xl text-xs font-bold appearance-none focus:ring-2 focus:ring-primary/20 outline-none transition-all dark:text-white" 
                                            value={formData.plataforma} 
                                            onChange={e => setFormData({...formData, plataforma: e.target.value})}
                                        >
                                            {platforms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                            <FaChevronRight size={10} className="rotate-90" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider ml-1">Estado Actual</label>
                                    <div className="relative">
                                        <select 
                                            className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 p-3.5 rounded-xl text-xs font-bold appearance-none focus:ring-2 focus:ring-primary/20 outline-none transition-all dark:text-white" 
                                            value={formData.status} 
                                            onChange={e => setFormData({...formData, status: e.target.value})}
                                        >
                                            {columns.map(col => <option key={col.id} value={col.id}>{col.title}</option>)}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                            <FaChevronRight size={10} className="rotate-90" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider ml-1">Título de la Actividad</label>
                                <input 
                                    type="text" 
                                    required 
                                    className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 p-4 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all dark:text-white placeholder:text-gray-300" 
                                    placeholder="Ej: Lanzamiento Pack Verano" 
                                    value={formData.titulo} 
                                    onChange={e => setFormData({...formData, titulo: e.target.value})} 
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider ml-1">Descripción / Notas Creativas</label>
                                <textarea 
                                    className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 p-4 rounded-xl text-sm font-medium resize-none focus:ring-2 focus:ring-primary/20 outline-none transition-all dark:text-white placeholder:text-gray-300" 
                                    rows="4" 
                                    placeholder="Describe los detalles de este contenido..." 
                                    value={formData.descripcion} 
                                    onChange={e => setFormData({...formData, descripcion: e.target.value})}
                                ></textarea>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider ml-1">Link de Recurso (Opcional)</label>
                                    <div className="relative">
                                        <input 
                                            type="url" 
                                            className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 p-3.5 pl-10 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all text-primary" 
                                            placeholder="https://canva.com/..." 
                                            value={formData.url} 
                                            onChange={e => setFormData({...formData, url: e.target.value})} 
                                        />
                                        <FaGlobe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider ml-1">Fecha de Publicación</label>
                                    <div className="relative">
                                        <input 
                                            type="date" 
                                            className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 p-3.5 pl-10 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all dark:text-white" 
                                            value={formData.fechaEntrega ? formData.fechaEntrega.split('T')[0] : ''} 
                                            onChange={e => setFormData({...formData, fechaEntrega: e.target.value})} 
                                        />
                                        <FaCalendarAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                    </div>
                                </div>
                            </div>

                            {/* Sección de Métricas (Solo si está publicado) */}
                            {formData.status === 'PUBLICADO' && (
                                <div className="p-6 bg-primary/5 dark:bg-primary/10 rounded-2xl border border-primary/10 space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <FaChartLine className="text-primary" />
                                        <span className="text-[10px] font-black uppercase text-primary tracking-widest">Métricas de Rendimiento</span>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Vistas</label>
                                            <input type="number" className="w-full bg-white dark:bg-gray-800 p-2.5 rounded-lg text-xs font-black border border-gray-200 dark:border-gray-700 focus:border-primary outline-none transition-all dark:text-white" value={formData.vistas} onChange={e => setFormData({...formData, vistas: e.target.value})} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Likes</label>
                                            <input type="number" className="w-full bg-white dark:bg-gray-800 p-2.5 rounded-lg text-xs font-black border border-gray-200 dark:border-gray-700 focus:border-primary outline-none transition-all dark:text-white" value={formData.likes} onChange={e => setFormData({...formData, likes: e.target.value})} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Shares</label>
                                            <input type="number" className="w-full bg-white dark:bg-gray-800 p-2.5 rounded-lg text-xs font-black border border-gray-200 dark:border-gray-700 focus:border-primary outline-none transition-all dark:text-white" value={formData.compartidos} onChange={e => setFormData({...formData, compartidos: e.target.value})} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Seguidores+</label>
                                            <input type="number" className="w-full bg-white dark:bg-gray-800 p-2.5 rounded-lg text-xs font-black border border-gray-200 dark:border-gray-700 focus:border-primary outline-none transition-all dark:text-white" value={formData.seguidoresGanados} onChange={e => setFormData({...formData, seguidoresGanados: e.target.value})} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </form>

                        {/* Footer con Acciones */}
                        <div className="p-6 sm:p-8 bg-gray-50 dark:bg-gray-900/50 border-t dark:border-gray-700 flex flex-col sm:flex-row gap-3">
                            <button 
                                type="button" 
                                onClick={() => setShowModal(false)}
                                className="flex-1 px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleSave}
                                className="flex-[2] bg-primary text-white px-8 py-4 rounded-xl font-black uppercase text-[10px] tracking-[2px] shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                            >
                                {editingPost ? 'Actualizar Actividad' : 'Guardar Actividad'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Registro de Seguidores (Rediseñado) */}
            {showMetricsModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-slate-900/80 w-full h-[100dvh] z-0"></div>
                    
                    <div className="relative z-10 bg-white dark:bg-gray-800 w-full max-w-md rounded-[1.5rem] sm:rounded-[2rem] shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-6 sm:p-8 border-b dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800">
                            <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight italic uppercase">Registrar Impacto</h2>
                            <button 
                                onClick={() => setShowMetricsModal(false)} 
                                className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-colors"
                            >
                                <FaTimes size={18} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSaveMetric} className="p-8 space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider ml-1">Seleccionar Red Social</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {platforms.slice(0,4).map(p => (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => setMetricFormData({...metricFormData, plataforma: p.id})}
                                            className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                                                metricFormData.plataforma === p.id 
                                                ? 'border-primary bg-primary/5 text-primary' 
                                                : 'border-gray-100 dark:border-gray-700 text-gray-400 hover:border-gray-200'
                                            }`}
                                        >
                                            <span className={metricFormData.plataforma === p.id ? p.color : ''}>{p.icon}</span>
                                            <span className="text-[10px] font-black uppercase">{p.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider ml-1">Total de Seguidores</label>
                                <input 
                                    type="number" 
                                    required 
                                    className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 p-5 rounded-xl text-3xl font-black text-primary text-center outline-none focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-gray-200" 
                                    placeholder="0" 
                                    value={metricFormData.seguidores} 
                                    onChange={e => setMetricFormData({...metricFormData, seguidores: e.target.value})} 
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider ml-1">Fecha del Registro</label>
                                <input 
                                    type="date" 
                                    required 
                                    className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 p-4 rounded-xl text-xs font-bold text-center dark:text-white" 
                                    value={metricFormData.fecha} 
                                    onChange={e => setMetricFormData({...metricFormData, fecha: e.target.value})} 
                                />
                            </div>

                            <div className="flex flex-col gap-3 pt-2">
                                <button 
                                    type="submit" 
                                    className="w-full bg-dark dark:bg-white text-white dark:text-dark py-5 rounded-2xl font-black uppercase text-[10px] tracking-[3px] shadow-xl active:scale-95 transition-all"
                                >
                                    Guardar Registro
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => setShowMetricsModal(false)} 
                                    className="w-full py-2 text-[9px] font-black uppercase tracking-widest text-gray-400"
                                >
                                    Cerrar
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
