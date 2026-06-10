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
            if (window.instgrm) window.instgrm.Embeds.process();
        };
        
        if (!document.getElementById('social-embed-script')) {
            const script = document.createElement('script');
            script.id = 'social-embed-script';
            script.src = 'https://www.instagram.com/embed.js';
            script.async = true;
            script.onload = processEmbeds;
            document.body.appendChild(script);
        } else {
            processEmbeds();
        }

        const timers = [setTimeout(processEmbeds, 500), setTimeout(processEmbeds, 2000)];
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
            <div className="animate-fade-in max-w-5xl mx-auto space-y-8 pb-20">
                {/* Navegación y Acciones */}
                <div className="flex justify-between items-center">
                    <button 
                        onClick={() => setSelectedGuide(null)} 
                        className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-all font-black uppercase text-[10px] tracking-widest group"
                    >
                        <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Volver al Índice
                    </button>
                    <button 
                        onClick={() => {
                            if (navigator.share) navigator.share({ title: selectedGuide.title, url: window.location.href });
                            else { navigator.clipboard.writeText(window.location.href); alert("¡Copiado!"); }
                        }}
                        className="p-2.5 bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-indigo-600 rounded-xl transition-all"
                        title="Compartir Guía"
                    >
                        <FaShareAlt size={14} />
                    </button>
                </div>

                {/* Header Estilizado */}
                <div className="bg-white dark:bg-gray-800 rounded-[3rem] overflow-hidden shadow-xl border border-gray-100 dark:border-gray-700">
                    <div className="p-8 sm:p-12 space-y-8">
                        <div>
                            <span className="inline-block px-4 py-1.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-full mb-6 shadow-sm">
                                {selectedGuide.category}
                            </span>
                            <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tighter leading-tight uppercase italic italic-none">
                                {selectedGuide.title}
                            </h1>
                            
                            <div className="flex flex-wrap items-center gap-8 text-[10px] font-black uppercase tracking-widest text-gray-400 mt-8 pt-8 border-t border-gray-50 dark:border-gray-700">
                                <div className="flex items-center gap-2">
                                    <FaUser className="text-indigo-500" />
                                    <span>Por <span className="text-gray-900 dark:text-gray-200">{selectedGuide.author}</span></span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <FaCalendarAlt className="text-indigo-500" />
                                    <span>{new Date(selectedGuide.createdAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                </div>
                            </div>
                        </div>

                        {/* Imagen de Portada con efecto */}
                        {selectedGuide.image && (
                            <div className="rounded-[2.5rem] overflow-hidden shadow-2xl relative group">
                                <img src={selectedGuide.image} alt={selectedGuide.title} className="w-full h-auto object-cover max-h-[500px]" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </div>
                        )}

                        {/* Contenido con Renderizado Avanzado de Bloques */}
                        <div 
                            className="prose prose-slate prose-lg max-w-none dark:prose-invert
                                prose-headings:font-black prose-headings:tracking-tighter prose-headings:text-gray-900 dark:prose-headings:text-white
                                prose-p:text-gray-600 dark:prose-p:text-gray-300 prose-p:leading-relaxed prose-p:text-lg
                                prose-strong:text-indigo-600 dark:prose-strong:text-indigo-400
                                prose-img:rounded-[2.5rem] prose-img:shadow-2xl
                                /* Soporte para clases dinámicas del Blog Editor */
                                [&_.border-l-8]:border-l-8 [&_.border-indigo-500]:border-indigo-500 
                                [&_.bg-slate-50]:bg-gray-50 dark:[&_.bg-slate-50]:bg-gray-900/50
                                [&_.bg-cyan-50]:bg-indigo-50 dark:[&_.bg-cyan-50]:bg-indigo-900/20
                                [&_.text-cyan-800]:text-indigo-800 dark:[&_.text-cyan-800]:text-indigo-300
                                [&_.grid]:grid [&_.gap-6]:gap-6 [&_.md\:gap-8]:md:gap-8
                                [&_.float-right]:float-right [&_.float-left]:float-left
                                [&_.rounded-\[2\.5rem\]]:rounded-[2.5rem]
                                [&_.aspect-video]:aspect-video [&_.aspect-\[9\/16\]]:aspect-[9/16]"
                            dangerouslySetInnerHTML={{ __html: selectedGuide.content }} 
                        />

                        {/* Video Secundario */}
                        {selectedGuide.videoUrl && (
                            <div className="mt-12 rounded-[2.5rem] overflow-hidden shadow-2xl bg-black aspect-video border-4 border-white dark:border-gray-700">
                                <iframe 
                                    src={getEmbedUrl(selectedGuide.videoUrl)} 
                                    className="w-full h-full border-0"
                                    allowFullScreen
                                />
                            </div>
                        )}

                        {/* Etiquetas */}
                        <div className="pt-8 border-t border-gray-50 dark:border-gray-700 flex flex-wrap gap-2">
                            <FaTag className="text-gray-300 mr-2" />
                            {selectedGuide.tags?.map((tag, i) => (
                                <span key={i} className="text-[9px] font-black uppercase tracking-widest bg-gray-50 dark:bg-gray-900 px-3 py-1.5 rounded-lg text-gray-500">#{tag}</span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Banner de Soporte Final */}
                <div className="p-10 rounded-[3rem] bg-gradient-to-br from-indigo-600 to-blue-700 text-white shadow-2xl shadow-indigo-600/20 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="text-center md:text-left">
                        <h3 className="text-2xl font-black mb-2 uppercase tracking-tighter italic">¿Necesitas ayuda técnica adicional?</h3>
                        <p className="text-indigo-100 font-medium">Nuestro equipo de ingeniería está listo para asistirte.</p>
                    </div>
                    <a href="https://wa.me/525512345678" target="_blank" rel="noreferrer" className="px-8 py-4 bg-white text-indigo-600 font-black uppercase text-xs tracking-widest rounded-2xl hover:scale-105 transition-all shadow-xl shadow-black/10">
                        Contactar Soporte
                    </a>
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
