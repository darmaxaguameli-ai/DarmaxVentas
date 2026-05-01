import React, { useState, useEffect, useRef } from 'react';
import { 
    fetchBlogPosts, 
    createBlogPost, 
    updateBlogPost, 
    deleteBlogPost 
} from '../../api/apiClient';
import Swal from 'sweetalert2';
import { 
    FaPlus, FaEdit, FaTrash, FaEye, FaImage, FaVideo, 
    FaNewspaper, FaCheckCircle, FaTimesCircle, FaArrowLeft, 
    FaSave, FaCode, FaHeading, FaParagraph, FaLightbulb, 
    FaListUl, FaQuoteLeft, FaChevronUp, FaChevronDown, FaBold, FaItalic
} from 'react-icons/fa';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { v4 as uuidv4 } from 'uuid';

// ====================================================================
// Block Editor Helpers & Components
// ====================================================================

const BLOCK_TYPES = [
    { type: 'heading', label: 'Título H2', icon: <FaHeading />, color: 'text-cyan-600' },
    { type: 'paragraph', label: 'Párrafo', icon: <FaParagraph />, color: 'text-slate-500' },
    { type: 'highlight', label: 'Cita / Destacado', icon: <FaQuoteLeft />, color: 'text-blue-500' },
    { type: 'tip', label: 'Tip de Darmax', icon: <FaLightbulb />, color: 'text-amber-500' },
    { type: 'image', label: 'Imagen', icon: <FaImage />, color: 'text-emerald-500' },
    { type: 'list', label: 'Lista', icon: <FaListUl />, color: 'text-indigo-500' },
    { type: 'extra', label: 'Producto/Accesorio', icon: <FaPlus />, color: 'text-purple-500' },
];

const compileToHTML = (blocks, extras = []) => {
    return blocks.map(block => {
        switch (block.type) {
            case 'heading':
                const accentHex = block.accent === 'teal' ? '#168387' : '#06b6d4'; // teal y cyan-500
                const bgColor = block.accent === 'teal' ? 'rgba(22, 131, 135, 0.05)' : 'rgba(6, 182, 212, 0.05)';
                
                // Soporte para salto de línea con color (formato: "Línea 1 // Línea 2")
                let finalContent = block.content;
                if (block.content.includes('//')) {
                    const [line1, line2] = block.content.split('//').map(s => s.trim());
                    finalContent = `${line1}<br/><span style="color: ${accentHex}">${line2}</span>`;
                }

                // Aumentamos pl-10 para dar más aire con la barra lateral
                return `<h2 style="border-left: 8px solid ${accentHex}; background-color: ${bgColor};" class="pl-10 py-5 text-2xl md:text-3xl font-black text-slate-900 rounded-r-2xl mt-16 mb-8 shadow-sm leading-tight">${finalContent}</h2>`;
            case 'paragraph':
                return `<p class="text-slate-600 leading-relaxed mb-6">${block.content}</p>`;
            case 'highlight':
                return `<div class="border-l-8 border-cyan-500 rounded-2xl bg-slate-50 pl-6 py-6 pb-8 my-10 shadow-sm"><p class="text-xl md:text-2xl font-medium text-slate-700 italic leading-relaxed">${block.content}</p></div>`;
            case 'tip':
                return `
                <div class="bg-cyan-50 p-6 rounded-2xl border border-cyan-100 my-8">
                    <h4 class="font-black text-cyan-900 mb-2">💡 Tip clave de Darmax:</h4>
                    <p class="text-cyan-800 text-sm italic">${block.content}</p>
                </div>`;
            case 'image':
                return `<div class="rounded-[2.5rem] overflow-hidden my-12 shadow-2xl shadow-slate-900/10"><img src="${block.content}" alt="Blog Image" class="w-full h-auto" /></div>`;
            case 'list':
                // Ahora el contenido de la lista ya viene con HTML del editor enriquecido
                const listItems = block.content.split('<div>').filter(i => i.trim()).map(i => {
                    let cleaned = i.replace('</div>', '').trim();
                    if (!cleaned) return '';
                    return `<li class="relative pl-0 mb-4 text-slate-600 leading-relaxed list-none">${cleaned}</li>`;
                }).filter(i => i !== '').join('');
                
                // Si no hay divs (texto plano), lo tratamos línea por línea
                if (!listItems && block.content) {
                    const fallbackItems = block.content.split('\n').filter(i => i.trim()).map(i => {
                        return `<li class="relative pl-0 mb-4 text-slate-600 leading-relaxed list-none">${i.trim()}</li>`;
                    }).join('');
                    return `<ul class="space-y-2 mb-8 pl-0">${fallbackItems}</ul>`;
                }

                return `<ul class="space-y-2 mb-8 pl-0">${listItems}</ul>`;
            case 'extra':
                const extra = extras.find(ex => ex.id === block.content);
                if (!extra) return '';
                return `
                <div class="bg-white border border-gray-100 rounded-[2rem] p-8 my-12 shadow-xl shadow-slate-200/50 flex flex-col md:flex-row items-center gap-8">
                    <div class="flex-1">
                        <span class="text-[10px] font-black text-primary uppercase tracking-widest mb-2 block">Accesorio Destacado</span>
                        <h3 class="text-2xl font-black text-slate-900 mb-2">${extra.name}</h3>
                        <p class="text-slate-500 text-sm leading-relaxed mb-4">${extra.description || 'Potencia tu planta de agua con este componente original de Darmax.'}</p>
                        <div class="flex items-center gap-4">
                            <span class="text-2xl font-black text-slate-900">$${extra.basePrice} <small class="text-xs font-bold text-slate-400 uppercase">MXN</small></span>
                            <a href="https://darmaxagua.com.mx/configurador" class="bg-primary text-white text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-xl hover:scale-105 transition-all">Cotizar ahora</a>
                        </div>
                    </div>
                </div>`;
            default:
                return '';
        }
    }).join('\n');
};

const RichTextToolbar = ({ onAction }) => (
    <div className="absolute -top-10 left-0 flex gap-1 bg-white dark:bg-gray-800 p-1 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 z-10 animate-in fade-in slide-in-from-bottom-2">
        <button 
            type="button"
            onMouseDown={(e) => { e.preventDefault(); onAction('bold'); }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300 transition-colors"
            title="Negrita"
        >
            <FaBold size={12} />
        </button>
        <button 
            type="button"
            onMouseDown={(e) => { e.preventDefault(); onAction('italic'); }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300 transition-colors"
            title="Cursiva"
        >
            <FaItalic size={12} />
        </button>
    </div>
);

const Blog = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('list'); // 'list' or 'editor'
    const [editingPost, setEditingPost] = useState(null);
    
    // Extras data from Darmax main page
    const [extrasDisponibles, setExtrasDisponibles] = useState([]);
    const [loadingExtras, setLoadingExtras] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        excerpt: '',
        category: 'Articulo',
        author: 'Darmax',
        image: '',
        videoUrl: '',
        published: true,
    });
    const [blocks, setBlocks] = useState([]);

    useEffect(() => {
        loadPosts();
        loadExtras();
    }, []);

    const loadPosts = async () => {
        setLoading(true);
        try {
            // Intentamos cargar local primero
            const localData = await fetchBlogPosts();
            
            // También intentamos traer lo que está "en vivo" en la página principal
            try {
                const liveResponse = await fetch('https://darmaxagua.com.mx/api/blog');
                if (liveResponse.ok) {
                    const liveData = await liveResponse.json();
                    
                    // Mezclamos y evitamos duplicados por slug (priorizando local si existe)
                    const combined = [...localData];
                    liveData.forEach(livePost => {
                        if (!combined.find(p => p.slug === livePost.slug)) {
                            combined.push({ ...livePost, isLive: true });
                        }
                    });
                    setPosts(combined);
                } else {
                    setPosts(localData);
                }
            } catch (liveError) {
                console.warn('No se pudo conectar con la web principal:', liveError);
                setPosts(localData);
            }
        } catch (error) {
            console.error('Error loading posts:', error);
            setPosts([]);
        } finally {
            setLoading(false);
        }
    };

    const loadExtras = async () => {
        setLoadingExtras(true);
        try {
            const response = await fetch('https://darmaxagua.com.mx/api/configurador/extras');
            if (!response.ok) throw new Error('Error al cargar catálogo de extras');
            const data = await response.json();
            
            // Eliminar duplicados por ID
            const uniqueExtras = data.reduce((acc, current) => {
                const x = acc.find(item => item.id === current.id);
                if (!x) return acc.concat([current]);
                return acc;
            }, []);

            setExtrasDisponibles(uniqueExtras);
        } catch (error) {
            console.error("Error fetching extras catalog:", error);
        } finally {
            setLoadingExtras(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const htmlContent = compileToHTML(blocks, extrasDisponibles);
        const payload = {
            ...formData,
            content: htmlContent,
            blocks: blocks // Guardamos el JSON para poder editarlo después
        };

        try {
            if (editingPost) {
                await updateBlogPost(editingPost.id, payload);
                Swal.fire('¡Actualizado!', 'Artículo guardado con éxito.', 'success');
            } else {
                await createBlogPost(payload);
                Swal.fire('¡Publicado!', 'Tu nuevo artículo está listo.', 'success');
            }
            setView('list');
            resetForm();
            loadPosts();
        } catch (error) {
            Swal.fire('Error', 'No se pudo guardar.', 'error');
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            excerpt: '',
            category: 'Articulo',
            author: 'Darmax',
            image: '',
            videoUrl: '',
            published: true,
        });
        setBlocks([]);
        setEditingPost(null);
    };

    const handleEdit = (post) => {
        setEditingPost(post);
        setFormData({
            title: post.title,
            excerpt: post.excerpt || '',
            category: post.category,
            author: post.author,
            image: post.image || '',
            videoUrl: post.videoUrl || '',
            published: post.published,
        });
        // Si el post tiene bloques JSON, los usamos. Si no (migración), empezamos con un bloque de párrafo vacío.
        setBlocks(post.blocks || [{ id: uuidv4(), type: 'paragraph', content: '' }]);
        setView('editor');
    };

    // Block Handlers
    const addBlock = (type) => {
        setBlocks([...blocks, { id: uuidv4(), type, content: '', accent: 'cyan' }]);
    };

    const updateBlock = (id, newContent, accent = 'cyan') => {
        setBlocks(blocks.map(b => b.id === id ? { ...b, content: newContent, accent } : b));
    };

    const removeBlock = (id) => {
        setBlocks(blocks.filter(b => b.id !== id));
    };

    const moveBlock = (index, direction) => {
        const newBlocks = [...blocks];
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= newBlocks.length) return;
        [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
        setBlocks(newBlocks);
    };

    if (view === 'editor') {
        return (
            <div className="animate-fade-in space-y-8 pb-20">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <button onClick={() => setView('list')} className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors font-black uppercase text-[10px] tracking-widest">
                        <FaArrowLeft /> Volver al listado
                    </button>
                    <div className="flex gap-2">
                         <button onClick={handleSave} className="btn-primary flex items-center gap-3 py-3 px-8 shadow-xl shadow-primary/20">
                            <FaSave /> {editingPost ? 'Guardar Cambios' : 'Publicar Artículo'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Lateral Izquierdo: Configuración y Metadatos */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm sticky top-6">
                            <h3 className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-widest flex items-center gap-2 mb-6 border-b dark:border-gray-700 pb-4">
                                <FaNewspaper className="text-primary" /> Ficha Técnica
                            </h3>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block italic">Título Principal *</label>
                                    <input type="text" required className="w-full bg-gray-50 dark:bg-gray-900 p-3 rounded-xl border-none font-bold text-sm outline-none focus:ring-2 focus:ring-primary" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block italic">Extracto (Resumen corto) *</label>
                                    <textarea rows="3" required className="w-full bg-gray-50 dark:bg-gray-900 p-3 rounded-xl border-none font-medium text-xs outline-none focus:ring-2 focus:ring-primary resize-none" value={formData.excerpt} onChange={e => setFormData({...formData, excerpt: e.target.value})} placeholder="Aparecerá en las tarjetas de la lista..." />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block italic">Categoría</label>
                                        <select className="w-full bg-gray-50 dark:bg-gray-900 p-3 rounded-xl border-none font-bold text-[10px] outline-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                                            <option value="Articulo">Articulo</option>
                                            <option value="Emprendimiento">Emprendimiento</option>
                                            <option value="Tecnología">Tecnología</option>
                                            <option value="Vending">Vending</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block italic">Autor</label>
                                        <input type="text" className="w-full bg-gray-50 dark:bg-gray-900 p-3 rounded-xl border-none font-bold text-[10px] outline-none" value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})} />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block italic">URL Imagen Portada</label>
                                    <input type="text" className="w-full bg-gray-50 dark:bg-gray-900 p-3 rounded-xl border-none font-bold text-[10px] outline-none" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} placeholder="https://..." />
                                </div>
                                <div className="pt-4 flex items-center justify-between bg-gray-50 dark:bg-gray-900/40 p-4 rounded-2xl">
                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Publicar</span>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={formData.published} onChange={e => setFormData({...formData, published: e.target.checked})} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Central: Constructor de Bloques */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="bg-white dark:bg-gray-800 p-6 sm:p-10 rounded-[3rem] border border-gray-100 dark:border-gray-700 shadow-xl min-h-[600px] flex flex-col">
                            <div className="flex flex-wrap gap-2 mb-10 pb-6 border-b dark:border-gray-700">
                                {BLOCK_TYPES.map(bt => (
                                    <button key={bt.type} onClick={() => addBlock(bt.type)} className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-900 hover:bg-primary/10 hover:text-primary rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                                        <span className={bt.color}>{bt.icon}</span>
                                        {bt.label}
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-4 flex-1">
                                {blocks.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-100 dark:border-gray-700 rounded-3xl opacity-50">
                                        <FaPlus className="text-2xl mb-4" />
                                        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Tu artículo está vacío. Añade un bloque arriba.</p>
                                    </div>
                                ) : (
                                    blocks.map((block, idx) => (
                                        <div key={block.id} className="group relative bg-gray-50/30 dark:bg-gray-900/20 p-4 sm:p-6 rounded-3xl border border-transparent hover:border-primary/20 transition-all">
                                            {/* Controles del Bloque */}
                                            <div className="absolute -left-3 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => moveBlock(idx, -1)} className="p-2 bg-white dark:bg-gray-800 shadow-md rounded-lg text-gray-400 hover:text-primary"><FaChevronUp size={10}/></button>
                                                <button onClick={() => moveBlock(idx, 1)} className="p-2 bg-white dark:bg-gray-800 shadow-md rounded-lg text-gray-400 hover:text-primary"><FaChevronDown size={10}/></button>
                                                <button onClick={() => removeBlock(block.id)} className="p-2 bg-white dark:bg-gray-800 shadow-md rounded-lg text-gray-400 hover:text-red-500"><FaTrash size={10}/></button>
                                            </div>

                                            {/* Renderizado de Inputs según Tipo */}
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center px-1">
                                                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                        {BLOCK_TYPES.find(t => t.type === block.type)?.icon}
                                                        {BLOCK_TYPES.find(t => t.type === block.type)?.label}
                                                    </span>
                                                    {block.type === 'heading' && (
                                                        <select className="text-[8px] font-bold bg-transparent outline-none uppercase" value={block.accent} onChange={e => updateBlock(block.id, block.content, e.target.value)}>
                                                            <option value="cyan">Acento Cyan</option>
                                                            <option value="teal">Acento Teal</option>
                                                        </select>
                                                    )}
                                                </div>
                                                
                                                {block.type === 'heading' && (
                                                    <div className="relative group/heading">
                                                        <div 
                                                            contentEditable
                                                            suppressContentEditableWarning
                                                            onInput={(e) => {
                                                                const text = e.currentTarget.innerText;
                                                                updateBlock(block.id, text, block.accent);
                                                            }}
                                                            style={{ 
                                                                borderLeft: `8px solid ${block.accent === 'teal' ? '#168387' : '#06b6d4'}`,
                                                                backgroundColor: block.accent === 'teal' ? 'rgba(22, 131, 135, 0.05)' : 'rgba(6, 182, 212, 0.05)',
                                                                minHeight: '3rem'
                                                            }}
                                                            className="w-full p-4 pl-10 rounded-r-2xl border-none font-black text-lg text-gray-800 dark:text-white outline-none transition-all whitespace-pre-wrap"
                                                        >
                                                            {block.content.includes('//') ? (
                                                                <>
                                                                    {block.content.split('//')[0]}
                                                                    <span className="text-gray-300 mx-1 font-normal opacity-50">//</span>
                                                                    <span style={{ color: block.accent === 'teal' ? '#168387' : '#06b6d4' }}>
                                                                        {block.content.split('//')[1]}
                                                                    </span>
                                                                </>
                                                            ) : block.content || <span className="text-gray-400 font-normal italic">Título de sección...</span>}
                                                        </div>
                                                        <div className="absolute right-4 top-2 opacity-0 group-hover/heading:opacity-100 transition-opacity flex flex-col items-end pointer-events-none">
                                                            <span className="text-[7px] font-black text-primary uppercase tracking-widest bg-white dark:bg-gray-800 px-2 py-1 rounded-md shadow-sm border border-primary/10">Usa // para resaltar la 2da línea</span>
                                                        </div>
                                                    </div>
                                                )}
                                                {block.type === 'paragraph' && (
                                                    <div className="relative group/rich">
                                                        <RichTextToolbar onAction={(action) => document.execCommand(action, false, null)} />
                                                        <div 
                                                            contentEditable
                                                            suppressContentEditableWarning
                                                            onBlur={(e) => updateBlock(block.id, e.currentTarget.innerHTML)}
                                                            className="w-full bg-white dark:bg-gray-900 p-4 rounded-2xl border-none text-sm text-gray-600 dark:text-gray-300 leading-relaxed outline-none focus:ring-2 focus:ring-primary/20 min-h-[100px]"
                                                            dangerouslySetInnerHTML={{ __html: block.content }}
                                                        />
                                                    </div>
                                                )}
                                                {block.type === 'highlight' && (
                                                    <textarea rows="2" className="w-full bg-white dark:bg-gray-900 p-4 rounded-2xl border-l-4 border-cyan-500 font-medium italic text-gray-500 outline-none" value={block.content} onChange={e => updateBlock(block.id, e.target.value)} placeholder="Frase destacada o cita..." />
                                                )}
                                                {block.type === 'tip' && (
                                                    <textarea rows="2" className="w-full bg-cyan-50 dark:bg-cyan-900/20 p-4 rounded-2xl border border-cyan-100 text-cyan-800 text-sm italic outline-none" value={block.content} onChange={e => updateBlock(block.id, e.target.value)} placeholder="Consejo práctico de Darmax..." />
                                                )}
                                                {block.type === 'image' && (
                                                    <input type="text" className="w-full bg-white dark:bg-gray-900 p-4 rounded-2xl border-none text-xs font-mono text-primary outline-none" value={block.content} onChange={e => updateBlock(block.id, e.target.value)} placeholder="URL de la imagen (https://...)" />
                                                )}
                                                {block.type === 'list' && (
                                                    <div className="relative group/rich">
                                                        <RichTextToolbar onAction={(action) => document.execCommand(action, false, null)} />
                                                        <div 
                                                            contentEditable
                                                            suppressContentEditableWarning
                                                            onBlur={(e) => updateBlock(block.id, e.currentTarget.innerHTML)}
                                                            className="w-full bg-white dark:bg-gray-900 p-4 rounded-2xl border-none text-sm text-gray-600 font-medium outline-none focus:ring-2 focus:ring-primary/20 min-h-[100px]"
                                                            dangerouslySetInnerHTML={{ __html: block.content }}
                                                        />
                                                        <p className="mt-2 text-[8px] text-gray-400 italic px-2">Presiona Enter para añadir un nuevo punto a la lista.</p>
                                                    </div>
                                                )}
                                                {block.type === 'extra' && (
                                                    <div className="space-y-2">
                                                        <select 
                                                            className="w-full bg-white dark:bg-gray-900 p-4 rounded-2xl border-none text-sm font-bold text-primary outline-none" 
                                                            value={block.content} 
                                                            onChange={e => updateBlock(block.id, e.target.value)}
                                                        >
                                                            <option value="">Selecciona un producto del catálogo Darmax...</option>
                                                            {extrasDisponibles.map(ex => (
                                                                <option key={ex.id} value={ex.id}>{ex.name} (${ex.basePrice})</option>
                                                            ))}
                                                        </select>
                                                        {block.content && extrasDisponibles.find(ex => ex.id === block.content) && (
                                                            <div className="mt-2 p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-center gap-4">
                                                                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-primary shadow-sm">
                                                                    <FaPlus />
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] text-primary font-black uppercase tracking-widest">Bloque de Producto</p>
                                                                    <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                                                        {extrasDisponibles.find(ex => ex.id === block.content).name} - ${extrasDisponibles.find(ex => ex.id === block.content).basePrice}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {loadingExtras && <p className="text-[9px] text-gray-400 animate-pulse px-2">Sincronizando catálogo con darmaxagua.com.mx...</p>}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in space-y-8">
            <div className="flex flex-wrap justify-between items-center gap-6">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-black text-gray-800 dark:text-white flex items-center gap-4 tracking-tighter uppercase italic">
                        <div className="bg-primary p-3 rounded-2xl shadow-lg shadow-primary/20 text-white">
                            <FaNewspaper className="text-2xl" />
                        </div>
                        GESTIÓN DE BLOG
                    </h1>
                    <div className="text-xs sm:text-sm text-gray-500 font-bold mt-2 flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                        Administra tus artículos y contenido educativo
                    </div>
                </div>
                <button onClick={() => { resetForm(); setBlocks([{id: uuidv4(), type: 'heading', content: ''}]); setView('editor'); }} className="btn-primary flex items-center justify-center gap-3 py-4 px-8 rounded-3xl shadow-2xl shadow-primary/30 font-black uppercase text-xs tracking-widest hover:scale-105 active:scale-95 transition-all">
                    <FaPlus /> Nuevo Artículo
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-[3rem] border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-900/50 border-b dark:border-gray-700">
                                <th className="px-8 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Publicación</th>
                                <th className="px-8 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Metadatos</th>
                                <th className="px-8 py-6 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Estatus</th>
                                <th className="px-8 py-6 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
                                            <p className="text-gray-400 font-black text-[10px] uppercase tracking-widest">Sincronizando Archivos...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : posts.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="py-20 text-center">
                                        <p className="text-gray-400 font-bold italic text-sm">No hay artículos registrados aún.</p>
                                    </td>
                                </tr>
                            ) : (
                                posts.map(post => (
                                    <tr key={post.id} className="group hover:bg-gray-50/50 dark:hover:bg-gray-900/20 transition-all">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-6">
                                                <div className="w-20 h-14 bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden shrink-0 shadow-inner flex items-center justify-center">
                                                    {post.image ? (
                                                        <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <FaImage className="text-gray-300" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="font-black text-gray-800 dark:text-white uppercase tracking-tight text-sm truncate max-w-xs">{post.title}</h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[9px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded uppercase tracking-tighter shadow-sm">{post.category}</span>
                                                        {post.isLive && (
                                                            <span className="text-[9px] font-black bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded uppercase tracking-tighter shadow-sm">En Vivo (Sitio Web)</span>
                                                        )}
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Slug: {post.slug}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-gray-800 dark:text-gray-200 uppercase tracking-tight italic">Por {post.author}</p>
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                                    {format(new Date(post.createdAt), 'dd MMMM yyyy', { locale: es })}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            {post.published ? (
                                                <div className="flex flex-col items-center gap-1 text-emerald-500">
                                                    <FaCheckCircle size={16} />
                                                    <span className="text-[8px] font-black uppercase tracking-widest">Público</span>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center gap-1 text-gray-400 opacity-50">
                                                    <FaTimesCircle size={16} />
                                                    <span className="text-[8px] font-black uppercase tracking-widest">Borrador</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex justify-end gap-2">
                                                <a href={`https://darmaxagua.com.mx/blog/${post.slug}`} target="_blank" rel="noopener noreferrer" className="p-3 bg-gray-100 dark:bg-gray-700 text-gray-400 hover:text-primary rounded-xl transition-all" title="Ver en el sitio"><FaEye size={14} /></a>
                                                <button onClick={() => handleEdit(post)} className="p-3 bg-gray-100 dark:bg-gray-700 text-gray-400 hover:text-blue-500 rounded-xl transition-all" title="Editar"><FaEdit size={14} /></button>
                                                <button onClick={() => { Swal.fire({ title: '¿Eliminar?', text: 'Borrarás este post permanentemente.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, borrar', cancelButtonText: 'No' }).then(res => { if(res.isConfirmed) { deleteBlogPost(post.id).then(() => loadPosts()); } }); }} className="p-3 bg-gray-100 dark:bg-gray-700 text-gray-400 hover:text-red-500 rounded-xl transition-all" title="Eliminar"><FaTrash size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Blog;
