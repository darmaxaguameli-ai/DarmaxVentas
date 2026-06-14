import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { getEmbedUrl } from '../../utils/videoUtils';
import { 
    FaBook, FaSearch, FaChevronRight, FaLightbulb, 
    FaTools, FaHandsHelping, FaArrowLeft, FaUser, 
    FaCalendarAlt, FaShareAlt, FaTag, FaPlayCircle 
} from 'react-icons/fa';

const Guides = () => {
    const [guides, setGuides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGuide, setSelectedGuide] = useState(null);

    useEffect(() => {
        const fetchGuides = async () => {
            setLoading(true);
            setError(false);
            try {
                const response = await apiClient.get('/blog', { params: { target: 'INTERNAL' } });
                setGuides(response.data || []);
            } catch (err) {
                console.error("Error fetching guides:", err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        fetchGuides();
    }, []);

    // Procesar scripts de redes sociales al abrir una guía
    useEffect(() => {
        if (!selectedGuide) return;
        
        const processEmbeds = () => {
            if (window.instgrm && window.instgrm.Embeds) {
                try {
                    window.instgrm.Embeds.process();
                } catch (e) {
                    console.warn("Instagram Embeds process error:", e);
                }
            }
        };
        
        const scriptId = 'social-embed-script';
        let script = document.getElementById(scriptId);

        if (!script) {
            script = document.createElement('script');
            script.id = scriptId;
            script.src = 'https://www.instagram.com/embed.js';
            script.async = true;
            script.onload = () => setTimeout(processEmbeds, 100);
            document.body.appendChild(script);
        } else {
            processEmbeds();
        }

        const timers = [
            setTimeout(processEmbeds, 500), 
            setTimeout(processEmbeds, 1500)
        ];

        return () => timers.forEach(t => clearTimeout(t));
    }, [selectedGuide]);

    const filtered = useMemo(() => {
        return guides.filter(g => 
            g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            g.category.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [guides, searchQuery]);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 animate-fade-in">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Sincronizando Manuales...</p>
            </div>
        );
    }

    if (selectedGuide) {
        return (
            <div className="animate-fade-in max-w-6xl mx-auto space-y-10 pb-32">
                {/* Navegación y Acciones - Minimalista */}
                <div className="flex justify-between items-center px-4 sm:px-0">
                    <button 
                        onClick={() => setSelectedGuide(null)} 
                        className="flex items-center gap-2 text-gray-400 hover:text-indigo-600 transition-all font-black uppercase text-[10px] tracking-widest group"
                    >
                        <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Volver al Índice
                    </button>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => {
                                if (navigator.share) navigator.share({ title: selectedGuide.title, url: window.location.href });
                                else { navigator.clipboard.writeText(window.location.href); alert("¡Enlace copiado!"); }
                            }}
                            className="p-3 bg-white dark:bg-gray-800 text-gray-400 hover:text-indigo-600 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-all"
                        >
                            <FaShareAlt size={14} />
                        </button>
                    </div>
                </div>

                {/* Contenido Orgánico - Sin contenedor rígido */}
                <div className="px-4 sm:px-0 space-y-10">
                    <div className="space-y-6">
                        <span className="inline-block px-4 py-1.5 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-indigo-600/20">
                            {selectedGuide.category}
                        </span>
                        <h1 className="text-3xl sm:text-6xl font-black text-gray-900 dark:text-white tracking-tighter leading-none uppercase italic italic-none">
                            {selectedGuide.title}
                        </h1>
                        
                        <div className="flex flex-wrap items-center gap-6 text-[10px] font-black uppercase tracking-widest text-gray-400 pt-4">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
                                    <FaUser size={12} />
                                </div>
                                <span>Por <span className="text-gray-900 dark:text-gray-200">{selectedGuide.author}</span></span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                                    <FaCalendarAlt size={12} />
                                </div>
                                <span>{new Date(selectedGuide.createdAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>
                        </div>
                    </div>

                    {/* Imagen de Portada Cinematográfica */}
                    {selectedGuide.image && (
                        <div className="rounded-[3rem] overflow-hidden shadow-2xl ring-8 ring-white dark:ring-gray-800">
                            <img src={selectedGuide.image} alt={selectedGuide.title} className="w-full h-auto object-cover max-h-[600px]" />
                        </div>
                    )}

                    {/* Cuerpo de la Guía - Renderizado en crudo sobre el fondo */}
                    <div 
                        className="prose prose-slate prose-sm sm:prose-lg max-w-none dark:prose-invert
                            prose-headings:font-black prose-headings:tracking-tighter prose-headings:text-gray-900 dark:prose-headings:text-white
                            prose-p:text-gray-600 dark:prose-p:text-gray-400 prose-p:leading-relaxed prose-p:text-lg
                            prose-strong:text-indigo-600 dark:prose-strong:text-indigo-400
                            prose-img:rounded-[2.5rem] prose-img:shadow-2xl prose-img:ring-4 prose-img:ring-white dark:prose-img:ring-gray-800
                            /* Bloques dinámicos */
                            [&_h2]:text-2xl sm:[&_h2]:text-4xl [&_h2]:mt-20 [&_h2]:mb-8
                            [&_.border-l-8]:border-l-8 [&_.border-indigo-500]:border-indigo-500 
                            [&_.bg-slate-50]:bg-white dark:[&_.bg-slate-50]:bg-gray-800
                            [&_.bg-cyan-50]:bg-indigo-50 dark:[&_.bg-cyan-50]:bg-indigo-900/20
                            [&_.p-10]:p-8 sm:[&_.p-10]:p-12 [&_.rounded-3xl]:rounded-[2.5rem]
                            [&_.grid]:grid [&_.gap-6]:gap-6 [&_.md\:gap-8]:md:gap-8"
                        dangerouslySetInnerHTML={{ __html: selectedGuide.content }} 
                    />

                    {/* Video Técnico */}
                    {selectedGuide.videoUrl && (
                        <div className="rounded-[3rem] overflow-hidden shadow-2xl bg-black aspect-video ring-8 ring-white dark:ring-gray-800">
                            <iframe 
                                src={getEmbedUrl(selectedGuide.videoUrl)} 
                                className="w-full h-full border-0"
                                allowFullScreen
                            />
                        </div>
                    )}

                    {/* Footer y Etiquetas */}
                    <div className="pt-10 border-t border-gray-200 dark:border-gray-800 flex flex-wrap gap-2">
                        {selectedGuide.tags?.map((tag, i) => (
                            <span key={i} className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2 rounded-xl">#{tag}</span>
                        ))}
                    </div>
                </div>

                {/* Banner de Acción Minimalista */}
                <div className="p-1 sm:p-2 bg-indigo-600 rounded-[2.5rem] shadow-2xl shadow-indigo-600/20 overflow-hidden">
                    <div className="bg-white/10 backdrop-blur-md p-10 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left border border-white/20">
                        <div className="text-white">
                            <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter leading-none mb-2 italic">Soporte Técnico Especializado</h3>
                            <p className="opacity-80 font-medium text-sm">¿Necesitas asesoría con este proceso? Contacta a nuestros ingenieros.</p>
                        </div>
                        <a href="https://wa.me/525512345678" target="_blank" rel="noreferrer" className="px-10 py-4 bg-white text-indigo-600 font-black uppercase text-xs tracking-widest rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl">
                            WhatsApp Ingeniería
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in space-y-8 pb-20">
            {/* Header de Índice */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-black text-gray-800 dark:text-white flex items-center gap-4 tracking-tighter uppercase italic">
                        <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-600/20 text-white">
                            <FaBook className="text-2xl" />
                        </div> 
                        CENTRO DE GUÍAS
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-500 font-bold mt-2 flex items-center gap-2">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                        Base de conocimientos para mantenimiento y operación técnica
                    </p>
                </div>
                <div className="relative w-full md:w-96 group">
                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Buscar por título, categoría o procesos..." 
                        className="w-full pl-11 pr-4 py-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 outline-none focus:ring-4 focus:ring-indigo-500/5 font-bold text-sm shadow-sm transition-all" 
                        value={searchQuery} 
                        onChange={e => setSearchQuery(e.target.value)} 
                    />
                </div>
            </div>

            {/* Listado de Guías en Grid */}
            {filtered.length === 0 ? (
                <div className="text-center py-24 bg-white dark:bg-gray-800 rounded-[3rem] border border-gray-100 dark:border-gray-700 shadow-sm">
                    <FaBook size={60} className="mx-auto mb-6 text-gray-200" />
                    <h2 className="text-xl font-black text-gray-800 dark:text-white uppercase">Sin resultados</h2>
                    <p className="text-gray-400 text-sm mt-2">Intenta con otra búsqueda o categoría.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filtered.map(guide => (
                        <div 
                            key={guide.id} 
                            onClick={() => setSelectedGuide(guide)} 
                            className="group bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-50 dark:border-gray-700 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer overflow-hidden flex flex-col"
                        >
                            {/* Miniatura o Icono */}
                            <div className="h-48 overflow-hidden bg-gray-100 dark:bg-gray-900 relative">
                                {guide.image ? (
                                    <img src={guide.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={guide.title} />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                        <FaBook size={40} />
                                    </div>
                                )}
                                <div className="absolute top-4 left-4">
                                    <span className="bg-white/90 backdrop-blur-md text-indigo-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm">
                                        {guide.category}
                                    </span>
                                </div>
                                {guide.videoUrl && (
                                    <div className="absolute bottom-4 right-4 text-white drop-shadow-lg">
                                        <FaPlayCircle size={24} />
                                    </div>
                                )}
                            </div>
                            
                            <div className="p-8 flex-1 flex flex-col">
                                <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase leading-tight mb-3 line-clamp-2 tracking-tight group-hover:text-indigo-600 transition-colors">
                                    {guide.title}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-3 mb-6 leading-relaxed flex-1 italic">
                                    {guide.excerpt || 'Consulta los detalles técnicos y procesos en el manual completo.'}
                                </p>
                                <div className="flex justify-between items-center pt-6 border-t border-gray-50 dark:border-gray-700">
                                    <span className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.2em] group-hover:tracking-[0.3em] transition-all">Abrir Manual</span>
                                    <FaChevronRight size={10} className="text-gray-300 group-hover:translate-x-1 group-hover:text-indigo-600 transition-all" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Guides;
