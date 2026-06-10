import React, { useState, useEffect, useRef } from 'react';
import apiClient, { 
    fetchBlogPosts, 
    createBlogPost, 
    updateBlogPost, 
    deleteBlogPost,
    fetchExternalBlogPosts,
    createExternalBlogPost,
    updateExternalBlogPost,
    deleteExternalBlogPost
} from '../../api/apiClient';
import Swal from 'sweetalert2';
import { 
    FaPlus, FaEdit, FaTrash, FaEye, FaImage, FaVideo, 
    FaNewspaper, FaCheckCircle, FaTimesCircle, FaArrowLeft, 
    FaSave, FaCode, FaHeading, FaParagraph, FaLightbulb, 
    FaListUl, FaQuoteLeft, FaChevronUp, FaChevronDown, FaBold, FaItalic,
    FaUndo, FaRedo, FaColumns, FaGlobe, FaShieldAlt
} from 'react-icons/fa';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

// ====================================================================
// Block Editor Helpers & Components
// ====================================================================

const getEmbedUrl = (url) => {
  if (!url) return "";
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) return `https://www.youtube.com/embed/${match[2]}`;
  }
  if (url.includes("instagram.com")) {
    let cleanUrl = url.split("?")[0];
    if (cleanUrl.endsWith("/")) cleanUrl = cleanUrl.slice(0, -1);
    return `${cleanUrl}/embed`;
  }
  if (url.includes("facebook.com")) {
    if (url.includes("plugins/video.php")) return url;
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=0&width=560`;
  }
  if (url.includes("tiktok.com")) {
    const match = url.match(/\/video\/(\d+)/);
    if (match && match[1]) return `https://www.tiktok.com/embed/v2/${match[1]}`;
  }
  return url;
};

const ACCENT_COLORS = {
    cyan: { hex: '#06b6d4', bg: 'rgba(6, 182, 212, 0.05)', label: 'Cyan' },
    teal: { hex: '#168387', bg: 'rgba(22, 131, 135, 0.05)', label: 'Teal' },
    indigo: { hex: '#6366f1', bg: 'rgba(99, 102, 241, 0.05)', label: 'Indigo' },
    rose: { hex: '#f43f5e', bg: 'rgba(244, 63, 94, 0.05)', label: 'Rose' },
    amber: { hex: '#f59e0b', bg: 'rgba(245, 158, 11, 0.05)', label: 'Amber' },
};

const BLOCK_TYPES = [
    { type: 'heading', label: 'Título H2', icon: <FaHeading />, color: 'text-cyan-600' },
    { type: 'paragraph', label: 'Párrafo', icon: <FaParagraph />, color: 'text-slate-500' },
    { type: 'highlight', label: 'Cita / Destacado', icon: <FaQuoteLeft />, color: 'text-blue-500' },
    { type: 'video', label: 'Video Central', icon: <FaVideo />, color: 'text-red-500' },
    { type: 'video-sidebar', label: 'Video Lateral', icon: <FaVideo />, color: 'text-orange-500' },
    { type: 'tip', label: 'Tip de Darmax', icon: <FaLightbulb />, color: 'text-amber-500' },
    { type: 'image', label: 'Imagen', icon: <FaImage />, color: 'text-emerald-500' },
    { type: 'list', label: 'Lista', icon: <FaListUl />, color: 'text-indigo-500' },
    { type: 'comparison', label: 'Comparativa', icon: <FaColumns />, color: 'text-indigo-600' },
    { type: 'extra', label: 'Producto/Accesorio', icon: <FaPlus />, color: 'text-purple-500' },
];

const compileToHTML = (blocks, extras = []) => {
    return blocks.map((block, idx) => {
        const contentWrapper = (html) => `<div class="mx-auto px-4 mb-8">${html}</div>`;
        switch (block.type) {
            case 'heading':
                const accent = ACCENT_COLORS[block.accent] || ACCENT_COLORS.cyan;
                let finalHeading = block.content;
                if (block.content.includes('//')) {
                    const [line1, line2] = block.content.split('//').map(s => s.trim());
                    finalHeading = `${line1}<br/><span style="color: ${accent.hex}">${line2}</span>`;
                }
                return contentWrapper(`<h2 style="border-left: 8px solid ${accent.hex}; background-color: ${accent.bg}; font-size: 28px; line-height: 1.3;" class="pl-10 py-6 font-black text-slate-900 rounded-r-2xl mt-16 mb-8 shadow-sm tracking-tight">${finalHeading}</h2>`);
            case 'paragraph':
                const paragraphs = block.content.split('<div>').map(p => {
                    let text = p.replace('</div>', '').trim();
                    if (!text || text === '<br>') return '';
                    return `<p style="font-size: 18px; line-height: 1.8;" class="text-slate-600 mb-6">${text}</p>`;
                }).filter(p => p !== '').join('');
                return contentWrapper(paragraphs || `<p style="font-size: 18px; line-height: 1.8;" class="text-slate-600 mb-8">${block.content}</p>`);
            case 'highlight':
                return contentWrapper(`<div class="border-l-8 border-cyan-500 rounded-2xl bg-slate-50 pl-10 pr-10 py-12 pb-14 mt-12 mb-16 shadow-sm mx-2 md:mx-6"><p style="font-size: 21px; line-height: 1.7;" class="font-bold text-slate-700 italic leading-relaxed">${block.content}</p></div>`);
            case 'video':
                return contentWrapper(`<div class="aspect-video w-full rounded-[2.5rem] overflow-hidden my-14 shadow-2xl border border-slate-100 bg-black"><iframe src="${getEmbedUrl(block.content)}" class="w-full h-full" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe></div>`);
            case 'video-sidebar':
                const isAfterHeading = idx > 0 && blocks[idx-1].type === 'heading';
                const overlapClass = (isAfterHeading && block.align === 'right') ? 'lg:-mt-40' : '';
                const alignClass = block.align === 'left' ? `float-left mr-8 ml-0 lg:-ml-12 ${overlapClass}` : `float-right ml-8 mr-0 lg:-mr-12 ${overlapClass}`;
                return `<div class="${alignClass} mb-14 w-[320px] sm:w-[360px] aspect-[9/16] rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white bg-black z-10 relative ring-1 ring-slate-100"><iframe src="${getEmbedUrl(block.content)}" class="w-full h-full border-0" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe></div>`;
            case 'tip':
                return contentWrapper(`<div class="bg-cyan-50 p-10 rounded-3xl border border-cyan-100 my-14 shadow-inner shadow-cyan-900/5"><h4 class="font-black text-cyan-900 mb-4 text-xl flex items-center gap-2">💡 Tip clave de Darmax:</h4><p style="font-size: 17px; line-height: 1.7;" class="text-cyan-800 italic">${block.content}</p></div>`);
            case 'image':
                return `<div class="max-w-4xl mx-auto rounded-[3rem] overflow-hidden my-20 shadow-2xl shadow-slate-900/15"><img src="${block.content}" alt="Blog Image" class="w-full h-auto" /></div>`;
            case 'list':
                const listItems = block.content.split('<div>').filter(i => i.trim()).map(i => {
                    let cleaned = i.replace('</div>', '').trim();
                    return cleaned ? `<li style="font-size: 18px; line-height: 1.8;" class="relative pl-0 mb-6 text-slate-600 list-none border-l-4 border-cyan-500/20 pl-6">${cleaned}</li>` : '';
                }).filter(i => i !== '').join('');
                return contentWrapper(`<ul class="space-y-4 mb-14 pl-0">${listItems || block.content.split('\n').map(i => `<li style="font-size: 18px; line-height: 1.8;" class="relative pl-0 mb-6 text-slate-600 list-none border-l-4 border-cyan-500/20 pl-6">${i.trim()}</li>`).join('')}</ul>`);
            case 'extra':
                const extra = extras.find(ex => ex.id === block.content);
                if (!extra) return '';
                return `<div class="bg-white border border-gray-100 rounded-[2rem] p-8 my-12 shadow-xl shadow-slate-200/50 flex flex-col md:flex-row items-center gap-8"><div class="flex-1"><span class="text-[10px] font-black text-primary uppercase tracking-widest mb-2 block">Accesorio Destacado</span><h3 class="text-2xl font-black text-slate-900 mb-2">${extra.name}</h3><p class="text-slate-500 text-sm leading-relaxed mb-4">${extra.description || 'Potencia tu planta de agua con este componente original de Darmax.'}</p><div class="flex items-center gap-4"><span class="text-2xl font-black text-slate-900">$${extra.basePrice} <small class="text-xs font-bold text-slate-400 uppercase">MXN</small></span><a href="https://darmaxagua.com.mx/configurador" class="bg-primary text-white text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-xl hover:scale-105 transition-all">Cotizar ahora</a></div></div></div>`;
            case 'comparison':
                let cols = [];
                try { cols = JSON.parse(block.content); } catch (e) { return ''; }
                const gridCols = cols.length === 1 ? 'grid-cols-1' : cols.length === 2 ? 'md:grid-cols-2' : cols.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-4';
                const colItems = cols.map(col => {
                    const colorMap = {
                        cyan: { bg: 'bg-cyan-50/50', heading: 'text-cyan-950', text: 'text-cyan-900', strong: 'prose-strong:text-cyan-950' },
                        teal: { bg: 'bg-teal-50/50', heading: 'text-teal-950', text: 'text-teal-900', strong: 'prose-strong:text-teal-950' },
                        indigo: { bg: 'bg-indigo-50/50', heading: 'text-indigo-950', text: 'text-indigo-900', strong: 'prose-strong:text-indigo-950' },
                        rose: { bg: 'bg-rose-50/50', heading: 'text-rose-950', text: 'text-rose-900', strong: 'prose-strong:text-rose-950' },
                        amber: { bg: 'bg-amber-50/50', heading: 'text-amber-950', text: 'text-amber-900', strong: 'prose-strong:text-amber-950' },
                    };
                    const cls = colorMap[col.accent] || colorMap.cyan;
                    return `<div class="${cls.bg} rounded-[2.5rem] p-8 md:p-10 shadow-sm transition-transform hover:scale-[1.02]"><h3 class="text-xl font-black ${cls.heading} mb-6 uppercase tracking-tight">${col.title}</h3><div class="prose prose-slate prose-sm max-w-none ${cls.text} ${cls.strong} leading-relaxed font-medium">${col.content}</div></div>`;
                }).join('');
                return `<div class="mx-auto px-4 my-16"><div class="grid grid-cols-1 ${gridCols} gap-6 md:gap-8">${colItems}</div></div>`;
            default:
                return '';
        }
    }).join('\n');
};

const RichTextToolbar = ({ onAction, onUndo, onRedo, canUndo, canRedo, hideFormatting = false, accent, onAccentChange, containerId }) => {
    const [activeStyles, setActiveStyles] = useState({ bold: false, italic: false });
    useEffect(() => {
        const checkStyles = () => {
            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0 || !containerId) return;
            const container = document.getElementById(containerId);
            if (!container || !container.contains(selection.anchorNode)) {
                setActiveStyles({ bold: false, italic: false });
                return;
            }
            setActiveStyles({ bold: document.queryCommandState('bold'), italic: document.queryCommandState('italic') });
        };
        document.addEventListener('selectionchange', checkStyles);
        return () => document.removeEventListener('selectionchange', checkStyles);
    }, [containerId]);

    return (
        <div className="absolute -top-12 right-0 flex items-center gap-1 bg-white dark:bg-gray-800 p-1.5 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 z-10 animate-in fade-in slide-in-from-bottom-2">
            {onAccentChange && (
                <div className="flex items-center gap-1 border-r border-gray-100 dark:border-gray-700 pr-1 mr-1">
                    <select className="text-[8px] font-black bg-gray-50 dark:bg-gray-900 px-2 py-1.5 rounded-lg border-none outline-none uppercase tracking-widest text-primary" value={accent} onChange={(e) => onAccentChange(e.target.value)}>
                        {Object.entries(ACCENT_COLORS).map(([key, val]) => (<option key={key} value={key}>{val.label}</option>))}
                    </select>
                </div>
            )}
            <div className={`flex gap-1 ${!hideFormatting ? 'border-r border-gray-100 dark:border-gray-700 pr-1 mr-1' : ''}`}>
                <button type="button" onClick={(e) => { e.preventDefault(); onUndo(); }} disabled={!canUndo} className={`p-2 rounded-lg transition-colors ${!canUndo ? 'text-gray-200 cursor-not-allowed opacity-30' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-primary'}`}><FaUndo size={11} /></button>
                <button type="button" onClick={(e) => { e.preventDefault(); onRedo(); }} disabled={!canRedo} className={`p-2 rounded-lg transition-colors ${!canRedo ? 'text-gray-200 cursor-not-allowed opacity-30' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-primary'}`}><FaRedo size={11} /></button>
            </div>
            {!hideFormatting && (
                <>
                    <button type="button" onMouseDown={(e) => { e.preventDefault(); onAction('bold'); }} className={`p-2 rounded-lg transition-colors ${activeStyles.bold ? 'bg-primary text-white shadow-inner' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'}`}><FaBold size={11} /></button>
                    <button type="button" onMouseDown={(e) => { e.preventDefault(); onAction('italic'); }} className={`p-2 rounded-lg transition-colors ${activeStyles.italic ? 'bg-primary text-white shadow-inner' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'}`}><FaItalic size={11} /></button>
                </>
            )}
        </div>
    );
};

const Blog = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('list');
    const [activeTab, setActiveTab] = useState('WEB'); // 'WEB' o 'INTERNAL'
    const [editingPost, setEditingPost] = useState(null);
    const [extrasDisponibles, setExtrasDisponibles] = useState([]);
    const [loadingExtras, setLoadingExtras] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        excerpt: '',
        category: 'Articulo',
        author: 'Darmax',
        image: '',
        videoUrl: '',
        tags: 'Darmax',
        published: true,
        target: 'WEB'
    });
    const [blocks, setBlocks] = useState([]);
    const [blockHistories, setBlockHistories] = useState({});

    useEffect(() => { loadPosts(); loadExtras(); }, [activeTab]);

    const saveToBlockHistory = (id, content) => {
        setBlockHistories(prev => {
            const current = prev[id] || { undo: [], redo: [] };
            if (current.undo.length > 0 && current.undo[current.undo.length - 1] === content) return prev;
            return { ...prev, [id]: { undo: [...current.undo.slice(-19), content], redo: [] } };
        });
    };

    const handleBlockUndo = (id) => {
        const history = blockHistories[id];
        if (!history || history.undo.length === 0) return;
        setBlocks(prevBlocks => {
            const currentBlock = prevBlocks.find(b => b.id === id);
            if (!currentBlock) return prevBlocks;
            const previousContent = history.undo[history.undo.length - 1];
            const newUndo = history.undo.slice(0, -1);
            const newRedo = [currentBlock.content, ...history.redo.slice(0, 19)];
            setBlockHistories(prevH => ({ ...prevH, [id]: { undo: newUndo, redo: newRedo } }));
            return prevBlocks.map(b => b.id === id ? { ...b, content: previousContent } : b);
        });
    };

    const handleBlockRedo = (id) => {
        const history = blockHistories[id];
        if (!history || history.redo.length === 0) return;
        setBlocks(prevBlocks => {
            const currentBlock = prevBlocks.find(b => b.id === id);
            if (!currentBlock) return prevBlocks;
            const nextContent = history.redo[0];
            const newRedo = history.redo.slice(1);
            const newUndo = [...history.undo, currentBlock.content];
            setBlockHistories(prevH => ({ ...prevH, [id]: { undo: newUndo, redo: newRedo } }));
            return prevBlocks.map(b => b.id === id ? { ...b, content: nextContent } : b);
        });
    };

    const loadPosts = async () => {
        setLoading(true);
        try {
            if (activeTab === 'WEB') {
                const data = await fetchExternalBlogPosts();
                setPosts(data.map(p => ({ ...p, isExternal: true })));
            } else {
                const data = await fetchBlogPosts('INTERNAL');
                setPosts(data || []);
            }
        } catch (error) { 
            console.error("Error loading posts:", error);
            setPosts([]); 
        } finally { 
            setLoading(false); 
        }
    };

    const loadExtras = async () => {
        setLoadingExtras(true);
        try {
            const response = await fetch('https://darmaxagua.com.mx/api/configurador/extras');
            if (response.ok) {
                const data = await response.json();
                const uniqueExtras = data.reduce((acc, current) => {
                    if (!acc.find(item => item.id === current.id)) return acc.concat([current]);
                    return acc;
                }, []);
                setExtrasDisponibles(uniqueExtras);
            }
        } catch (error) { console.error(error); } finally { setLoadingExtras(false); }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const htmlContent = compileToHTML(blocks, extrasDisponibles);
        const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(t => t !== "");
        const payload = { ...formData, content: htmlContent, blocks: blocks, tags: tagsArray };
        
        try {
            if (activeTab === 'WEB') {
                if (editingPost) {
                    await updateExternalBlogPost(editingPost.id, payload);
                    toast.success('Artículo web actualizado');
                } else {
                    await createExternalBlogPost(payload);
                    toast.success('Artículo publicado en la web');
                }
            } else {
                if (editingPost) {
                    await updateBlogPost(editingPost.id, payload);
                    toast.success('Guía técnica actualizada');
                } else {
                    await createBlogPost(payload);
                    toast.success('Guía técnica guardada localmente');
                }
            }
            setView('list'); loadPosts(); resetForm();
        } catch (error) { 
            console.error("Error saving post:", error);
            Swal.fire('Error', 'No se pudo guardar.', 'error'); 
        }
    };

    const resetForm = () => {
        setFormData({ title: '', excerpt: '', category: 'Articulo', author: 'Darmax', image: '', videoUrl: '', tags: 'Darmax', published: true, target: activeTab });
        setBlocks([]); setEditingPost(null);
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
            tags: (post.tags || ["Darmax"]).join(', '), 
            published: post.published,
            target: post.target || 'WEB'
        });
        setBlocks(post.blocks || [{ id: uuidv4(), type: 'paragraph', content: '' }]);
        setView('editor');
    };

    const addBlock = (type) => { 
        let initialContent = '';
        if (type === 'comparison') {
            initialContent = JSON.stringify([
                { id: uuidv4(), title: 'Opción A', content: 'Detalles...', accent: 'cyan' },
                { id: uuidv4(), title: 'Opción B', content: 'Detalles...', accent: 'teal' }
            ]);
        }
        setBlocks([...blocks, { id: uuidv4(), type, content: initialContent, accent: 'cyan', align: 'right' }]); 
    };

    const updateBlock = (id, newContent, accent = 'cyan', align = 'right') => {
        const oldBlock = blocks.find(b => b.id === id);
        if (oldBlock && oldBlock.content !== newContent) saveToBlockHistory(id, oldBlock.content);
        setBlocks(prev => prev.map(b => b.id === id ? { ...b, content: newContent, accent, align } : b));
    };

    const removeBlock = (id) => {
        setBlocks(blocks.filter(b => b.id !== id));
        setBlockHistories(prev => { const newState = { ...prev }; delete newState[id]; return newState; });
    };

    const moveBlock = (index, direction) => {
        const newBlocks = [...blocks];
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= newBlocks.length) return;
        [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
        setBlocks(newBlocks);
    };

    const handleDelete = async (post) => {
        const result = await Swal.fire({ 
            title: '¿Eliminar artículo?', 
            text: 'Esta acción no se puede deshacer.', 
            icon: 'warning', 
            showCancelButton: true,
            confirmButtonText: 'Sí, borrar',
            confirmButtonColor: '#ef4444'
        });

        if (result.isConfirmed) {
            try {
                if (activeTab === 'WEB') {
                    await deleteExternalBlogPost(post.id);
                } else {
                    await deleteBlogPost(post.id);
                }
                toast.success("Eliminado correctamente");
                loadPosts();
            } catch (error) {
                Swal.fire('Error', 'No se pudo eliminar.', 'error');
            }
        }
    };

    if (view === 'editor') {
        return (
            <div className="animate-fade-in space-y-8 pb-20">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <button onClick={() => setView('list')} className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors font-black uppercase text-[10px] tracking-widest"><FaArrowLeft /> Volver al listado</button>
                    <button onClick={handleSave} className="btn-primary flex items-center gap-3 py-3 px-8 shadow-xl shadow-primary/20"><FaSave /> {editingPost ? 'Guardar Cambios' : 'Publicar Ahora'}</button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm sticky top-6">
                            <h3 className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-widest flex items-center gap-2 mb-6 border-b dark:border-gray-700 pb-4"><FaNewspaper className="text-primary" /> Configuración Post</h3>
                            <div className="space-y-4">
                                <div><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block italic">Destino del Contenido</label><select className="w-full bg-gray-100 dark:bg-gray-900 p-3 rounded-xl border-none font-black text-[10px] uppercase tracking-widest outline-none text-primary" value={formData.target} onChange={e => setFormData({...formData, target: e.target.value})}><option value="WEB">Sitio Web Público</option><option value="INTERNAL">Gestión Interna (Guías)</option></select></div>
                                <div><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block italic">Título Principal *</label><input type="text" required className="w-full bg-gray-50 dark:bg-gray-900 p-3 rounded-xl border-none font-bold text-sm outline-none focus:ring-2 focus:ring-primary" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} /></div>
                                <div><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block italic">Extracto (Resumen corto) *</label><textarea rows="3" required className="w-full bg-gray-50 dark:bg-gray-900 p-3 rounded-xl border-none font-medium text-xs outline-none focus:ring-2 focus:ring-primary resize-none" value={formData.excerpt} onChange={e => setFormData({...formData, excerpt: e.target.value})} /></div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block italic">Categoría</label><select className="w-full bg-gray-50 dark:bg-gray-900 p-3 rounded-xl border-none font-bold text-[10px] outline-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}><option value="Articulo">Articulo</option><option value="Mantenimiento">Mantenimiento</option><option value="Manejo">Manejo</option><option value="Guía Rápida">Guía Rápida</option><option value="Vending">Vending</option></select></div>
                                    <div><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block italic">Autor</label><input type="text" className="w-full bg-gray-50 dark:bg-gray-900 p-3 rounded-xl border-none font-bold text-[10px] outline-none" value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})} /></div>
                                </div>
                                <div><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block italic">URL Imagen Portada</label><input type="text" className="w-full bg-gray-50 dark:bg-gray-900 p-3 rounded-xl border-none font-bold text-[10px] outline-none" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} /></div>
                                <div className="pt-4 flex items-center justify-between bg-gray-50 dark:bg-gray-900/40 p-4 rounded-2xl"><span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Visible</span><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={formData.published} onChange={e => setFormData({...formData, published: e.target.checked})} className="sr-only peer" /><div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div></label></div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-8 space-y-6">
                        <div className="bg-white dark:bg-gray-800 p-6 sm:p-10 rounded-[3rem] border border-gray-100 dark:border-gray-700 shadow-xl min-h-[600px] flex flex-col">
                            <div className="flex flex-wrap gap-2 mb-10 pb-6 border-b dark:border-gray-700">
                                {BLOCK_TYPES.map(bt => (
                                    <button key={bt.type} onClick={() => addBlock(bt.type)} className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-900 hover:bg-primary/10 hover:text-primary rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"><span className={bt.color}>{bt.icon}</span>{bt.label}</button>
                                ))}
                            </div>
                            <div className="space-y-4 flex-1">
                                {blocks.map((block, idx) => (
                                    <div key={block.id} className="group relative bg-gray-50/30 dark:bg-gray-900/20 p-4 sm:p-6 rounded-3xl border border-transparent hover:border-primary/20 transition-all">
                                        <div className="absolute -left-3 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => moveBlock(idx, -1)} className="p-2 bg-white dark:bg-gray-800 shadow-md rounded-lg text-gray-400 hover:text-primary"><FaChevronUp size={10}/></button>
                                            <button onClick={() => moveBlock(idx, 1)} className="p-2 bg-white dark:bg-gray-800 shadow-md rounded-lg text-gray-400 hover:text-primary"><FaChevronDown size={10}/></button>
                                            <button onClick={() => removeBlock(block.id)} className="p-2 bg-white dark:bg-gray-800 shadow-md rounded-lg text-gray-400 hover:text-red-500"><FaTrash size={10}/></button>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center px-1">
                                                <div className="flex items-center gap-3"><div className={`p-2 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 ${BLOCK_TYPES.find(t => t.type === block.type)?.color}`}>{BLOCK_TYPES.find(t => t.type === block.type)?.icon}</div><span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">{BLOCK_TYPES.find(t => t.type === block.type)?.label}</span></div>
                                                {block.type === 'heading' && (<select className="text-[9px] font-black bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg border-none outline-none uppercase tracking-widest" value={block.accent} onChange={e => updateBlock(block.id, block.content, e.target.value)}>{Object.entries(ACCENT_COLORS).map(([key, val]) => (<option key={key} value={key}>{val.label}</option>))}</select>)}
                                            </div>
                                            
                                            {/* BLOQUE: TÍTULO */}
                                            {block.type === 'heading' && (
                                                <div className="relative group/heading">
                                                    <RichTextToolbar onAction={() => {}} onUndo={() => handleBlockUndo(block.id)} onRedo={() => handleBlockRedo(block.id)} canUndo={(blockHistories[block.id]?.undo || []).length > 0} canRedo={(blockHistories[block.id]?.redo || []).length > 0} hideFormatting={true} accent={block.accent} onAccentChange={(newAccent) => updateBlock(block.id, block.content, newAccent)} />
                                                    <textarea rows="2" value={block.content} onChange={(e) => updateBlock(block.id, e.target.value, block.accent)} style={{ borderLeft: `8px solid ${ACCENT_COLORS[block.accent]?.hex || '#06b6d4'}`, backgroundColor: ACCENT_COLORS[block.accent]?.bg || 'rgba(6, 182, 212, 0.05)', fontSize: '28px', lineHeight: '1.3' }} className="w-full p-6 pl-12 rounded-r-2xl border-none font-black text-gray-800 dark:text-white outline-none transition-all resize-none overflow-hidden" placeholder="Título... (Usa // para resaltar)" />
                                                </div>
                                            )}

                                            {/* BLOQUE: PÁRRAFO */}
                                            {block.type === 'paragraph' && (
                                                <div className="relative group/rich">
                                                    <RichTextToolbar onAction={(action) => document.execCommand(action, false, null)} onUndo={() => handleBlockUndo(block.id)} onRedo={() => handleBlockRedo(block.id)} canUndo={(blockHistories[block.id]?.undo || []).length > 0} canRedo={(blockHistories[block.id]?.redo || []).length > 0} />
                                                    <div contentEditable suppressContentEditableWarning onBlur={(e) => updateBlock(block.id, e.currentTarget.innerHTML)} style={{ fontSize: '18px', lineHeight: '1.7' }} className="w-full bg-white dark:bg-gray-900 p-6 rounded-2xl border-none text-gray-600 dark:text-gray-300 outline-none min-h-[120px]" dangerouslySetInnerHTML={{ __html: block.content }} />
                                                </div>
                                            )}

                                            {/* BLOQUE: CITA / DESTACADO */}
                                            {block.type === 'highlight' && (
                                                <div className="space-y-2">
                                                    <div className="relative">
                                                        <RichTextToolbar onAction={() => {}} onUndo={() => handleBlockUndo(block.id)} onRedo={() => handleBlockRedo(block.id)} canUndo={(blockHistories[block.id]?.undo || []).length > 0} canRedo={(blockHistories[block.id]?.redo || []).length > 0} hideFormatting={true} />
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 italic">" Texto de la Cita / Frase "</p>
                                                    </div>
                                                    <textarea rows="3" style={{ fontSize: '22px', lineHeight: '1.6' }} className="w-full bg-white dark:bg-gray-900 p-8 rounded-2xl border-l-8 border-cyan-500 font-bold italic text-slate-700 outline-none focus:ring-2 focus:ring-cyan-500/10 leading-tight" value={block.content} onChange={e => updateBlock(block.id, e.target.value)} placeholder="Frase destacada o cita..." />
                                                </div>
                                            )}

                                            {/* BLOQUE: VIDEO */}
                                            {(block.type === 'video' || block.type === 'video-sidebar') && (
                                                <div className="space-y-4">
                                                    {block.type === 'video-sidebar' && (
                                                        <div className="flex items-center gap-4 bg-white dark:bg-gray-800 p-3 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm w-fit">
                                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic px-1">Lado:</span>
                                                            <div className="flex gap-1">
                                                                <button onClick={() => updateBlock(block.id, block.content, block.accent, 'left')} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${block.align === 'left' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}>Izquierda</button>
                                                                <button onClick={() => updateBlock(block.id, block.content, block.accent, 'right')} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${block.align === 'right' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-gray-100 text-gray-400 hover:bg-gray-100'}`}>Derecha</button>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div className="relative">
                                                        <RichTextToolbar onAction={() => {}} onUndo={() => handleBlockUndo(block.id)} onRedo={() => handleBlockRedo(block.id)} canUndo={(blockHistories[block.id]?.undo || []).length > 0} canRedo={(blockHistories[block.id]?.redo || []).length > 0} hideFormatting={true} />
                                                        <p className="text-[10px] font-black text-red-500 uppercase tracking-widest px-1 italic">URL DEL VIDEO (Reels, TikTok, YouTube):</p>
                                                        <input type="text" className="w-full bg-white dark:bg-gray-900 p-4 rounded-2xl border-none text-xs font-mono text-primary outline-none focus:ring-2 focus:ring-red-500/10" value={block.content} onChange={e => updateBlock(block.id, e.target.value, block.accent, block.align)} placeholder="https://..." />
                                                    </div>
                                                </div>
                                            )}

                                            {/* BLOQUE: IMAGEN */}
                                            {block.type === 'image' && (
                                                <div className="space-y-2">
                                                    <div className="relative">
                                                        <RichTextToolbar onAction={() => {}} onUndo={() => handleBlockUndo(block.id)} onRedo={() => handleBlockRedo(block.id)} canUndo={(blockHistories[block.id]?.undo || []).length > 0} canRedo={(blockHistories[block.id]?.redo || []).length > 0} hideFormatting={true} />
                                                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest px-1">URL DE LA IMAGEN:</p>
                                                    </div>
                                                    <input type="text" className="w-full bg-white dark:bg-gray-900 p-4 rounded-2xl border-none text-xs font-mono text-primary outline-none focus:ring-2 focus:ring-emerald-500/10" value={block.content} onChange={e => updateBlock(block.id, e.target.value)} placeholder="https://..." />
                                                </div>
                                            )}

                                            {/* BLOQUE: LISTA */}
                                            {block.type === 'list' && (
                                                <div className="relative group/rich space-y-2">
                                                    <div className="relative">
                                                        <RichTextToolbar onAction={(action) => document.execCommand(action, false, null)} onUndo={() => handleBlockUndo(block.id)} onRedo={() => handleBlockRedo(block.id)} canUndo={(blockHistories[block.id]?.undo || []).length > 0} canRedo={(blockHistories[block.id]?.redo || []).length > 0} />
                                                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest px-1">Puntos de la Lista:</p>
                                                    </div>
                                                    <div contentEditable suppressContentEditableWarning onBlur={(e) => updateBlock(block.id, e.currentTarget.innerHTML)} style={{ fontSize: '18px', lineHeight: '1.7' }} className="w-full bg-white dark:bg-gray-900 p-6 rounded-2xl border-none text-gray-600 font-medium outline-none min-h-[100px]" dangerouslySetInnerHTML={{ __html: block.content }} />
                                                </div>
                                            )}

                                            {/* BLOQUE: TIP */}
                                            {block.type === 'tip' && (
                                                <div className="space-y-2">
                                                    <div className="relative">
                                                        <RichTextToolbar onAction={() => {}} onUndo={() => handleBlockUndo(block.id)} onRedo={() => handleBlockRedo(block.id)} canUndo={(blockHistories[block.id]?.undo || []).length > 0} canRedo={(blockHistories[block.id]?.redo || []).length > 0} hideFormatting={true} />
                                                        <h4 className="text-[11px] font-black text-cyan-900 dark:text-cyan-400 px-1 flex items-center gap-2">💡 Tip clave de Darmax:</h4>
                                                    </div>
                                                    <textarea rows="2" style={{ fontSize: '16px', lineHeight: '1.6' }} className="w-full bg-cyan-50 dark:bg-cyan-900/20 p-6 rounded-2xl border border-cyan-100 text-cyan-800 italic outline-none focus:ring-2 focus:ring-cyan-500/20" value={block.content} onChange={e => updateBlock(block.id, e.target.value)} placeholder="Escribe aquí el consejo práctico..." />
                                                </div>
                                            )}

                                            {/* BLOQUE: COMPARATIVA */}
                                            {block.type === 'comparison' && (
                                                <div className="space-y-6">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        {(() => {
                                                            let columns = [];
                                                            try { columns = JSON.parse(block.content); } catch (e) { columns = []; }
                                                            const colorMap = {
                                                                cyan: { bg: 'bg-cyan-50/50', heading: 'text-cyan-950', text: 'text-cyan-900' },
                                                                teal: { bg: 'bg-teal-50/50', heading: 'text-teal-950', text: 'text-teal-900' },
                                                                indigo: { bg: 'bg-indigo-50/50', heading: 'text-indigo-950', text: 'text-indigo-900' },
                                                                rose: { bg: 'bg-rose-50/50', heading: 'text-rose-950', text: 'text-rose-900' },
                                                                amber: { bg: 'bg-amber-50/50', heading: 'text-amber-950', text: 'text-amber-900' },
                                                            };
                                                            return columns.map((col, cIdx) => {
                                                                const cls = colorMap[col.accent] || colorMap.cyan;
                                                                return (
                                                                    <div key={col.id || cIdx} className={`${cls.bg} p-6 rounded-[2rem] shadow-sm space-y-4 relative group/col`}>
                                                                        <div className="flex justify-between items-center">
                                                                            <select className="text-[9px] font-black bg-white/50 dark:bg-black/20 px-3 py-1.5 rounded-lg border-none outline-none uppercase tracking-widest text-primary" value={col.accent} onChange={(e) => { const newCols = [...columns]; newCols[cIdx].accent = e.target.value; updateBlock(block.id, JSON.stringify(newCols)); }}>{Object.entries(ACCENT_COLORS).map(([key, val]) => (<option key={key} value={key}>{val.label}</option>))}</select>
                                                                            <button onClick={() => { const newCols = columns.filter((_, i) => i !== cIdx); updateBlock(block.id, JSON.stringify(newCols)); }} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><FaTimesCircle size={14} /></button>
                                                                        </div>
                                                                        <input type="text" className={`w-full bg-transparent border-b border-black/5 font-black text-sm uppercase tracking-tight outline-none focus:border-primary py-1 ${cls.heading}`} placeholder="Título..." value={col.title} onChange={(e) => { const newCols = [...columns]; newCols[cIdx].title = e.target.value; updateBlock(block.id, JSON.stringify(newCols)); }} />
                                                                        <div className="relative">
                                                                            <RichTextToolbar onAction={(action) => document.execCommand(action, false, null)} onUndo={() => handleBlockUndo(block.id)} onRedo={() => handleBlockRedo(block.id)} canUndo={(blockHistories[block.id]?.undo || []).length > 0} canRedo={(blockHistories[block.id]?.redo || []).length > 0} containerId={`col-editor-${block.id}-${cIdx}`} />
                                                                            <div id={`col-editor-${block.id}-${cIdx}`} contentEditable suppressContentEditableWarning onBlur={(e) => { const newCols = [...columns]; newCols[cIdx].content = e.currentTarget.innerHTML; updateBlock(block.id, JSON.stringify(newCols)); }} className={`w-full min-h-[100px] text-xs outline-none leading-relaxed ${cls.text}`} dangerouslySetInnerHTML={{ __html: col.content }} />
                                                                        </div>
                                                                    </div>
                                                                );
                                                            });
                                                        })()}
                                                    </div>
                                                    <button onClick={() => { let columns = []; try { columns = JSON.parse(block.content); } catch (e) { columns = []; } const newCols = [...columns, { id: uuidv4(), title: 'Nueva Columna', content: 'Detalles...', accent: 'cyan' }]; updateBlock(block.id, JSON.stringify(newCols)); }} className="w-full py-4 border-2 border-dashed border-gray-100 dark:border-gray-700 rounded-3xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2"><FaPlus /> Añadir Columna</button>
                                                </div>
                                            )}

                                            {/* BLOQUE: PRODUCTO EXTRA */}
                                            {block.type === 'extra' && (
                                                <div className="space-y-3">
                                                    <div className="relative">
                                                        <RichTextToolbar onAction={() => {}} onUndo={() => handleBlockUndo(block.id)} onRedo={() => handleBlockRedo(block.id)} canUndo={(blockHistories[block.id]?.undo || []).length > 0} canRedo={(blockHistories[block.id]?.redo || []).length > 0} hideFormatting={true} />
                                                        <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest px-1">Producto del Catálogo:</p>
                                                    </div>
                                                    <select className="w-full bg-white dark:bg-gray-900 p-4 rounded-2xl border-none text-sm font-bold text-primary outline-none" value={block.content} onChange={e => updateBlock(block.id, e.target.value)}><option value="">Selecciona un producto...</option>{extrasDisponibles.map(ex => ( <option key={ex.id} value={ex.id}>{ex.name} (${ex.basePrice})</option> ))}</select>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
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
                    <h1 className="text-3xl sm:text-4xl font-black text-gray-800 dark:text-white flex items-center gap-4 tracking-tighter uppercase italic"><div className="bg-primary p-3 rounded-2xl shadow-lg shadow-primary/20 text-white"><FaNewspaper className="text-2xl" /></div> EDITOR DE CONTENIDO</h1>
                    <div className="text-xs sm:text-sm text-gray-500 font-bold mt-2 flex items-center gap-2"><div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div> Administra artículos web y guías internas</div>
                </div>
                <button onClick={() => { resetForm(); setBlocks([{id: uuidv4(), type: 'heading', content: ''}]); setView('editor'); }} className="btn-primary flex items-center justify-center gap-3 py-4 px-8 rounded-3xl shadow-2xl shadow-primary/30 font-black uppercase text-xs tracking-widest"><FaPlus /> Nuevo {activeTab === 'WEB' ? 'Artículo' : 'Guía Técnica'}</button>
            </div>

            <div className="flex bg-gray-100 dark:bg-gray-900/50 p-1 rounded-2xl w-fit">
                <button onClick={() => setActiveTab('WEB')} className={`flex items-center gap-2 px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'WEB' ? 'bg-white dark:bg-gray-800 shadow-md text-primary' : 'text-gray-400'}`}><FaGlobe /> Sitio Web</button>
                <button onClick={() => setActiveTab('INTERNAL')} className={`flex items-center gap-2 px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'INTERNAL' ? 'bg-white dark:bg-gray-800 shadow-md text-indigo-600' : 'text-gray-400'}`}><FaShieldAlt /> Gestión Interna (Guías)</button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-[3rem] border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-900/50 border-b dark:border-gray-700"><th className="px-8 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Contenido</th><th className="px-8 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Información</th><th className="px-8 py-6 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Estatus</th><th className="px-8 py-6 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Acciones</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                            {loading ? ( <tr><td colSpan="4" className="py-20 text-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary mx-auto"></div></td></tr> ) : posts.length === 0 ? ( <tr><td colSpan="4" className="py-20 text-center text-gray-400 italic text-sm">No hay contenido en esta sección.</td></tr> ) : (
                                posts.map(post => (
                                    <tr key={post.id} className="group hover:bg-gray-50/50 dark:hover:bg-gray-900/20 transition-all">
                                        <td className="px-8 py-6"><div className="flex items-center gap-6"><div className="w-20 h-14 bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden shrink-0 flex items-center justify-center">{post.image ? <img src={post.image} className="w-full h-full object-cover" /> : <FaImage className="text-gray-300" />}</div><div className="min-w-0"><h3 className="font-black text-gray-800 dark:text-white uppercase text-sm truncate max-w-xs">{post.title}</h3><div className="flex items-center gap-2 mt-1"><span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-tighter shadow-sm ${activeTab === 'WEB' ? 'bg-primary/10 text-primary' : 'bg-indigo-100 text-indigo-600'}`}>{post.category}</span>{post.isLive && <span className="text-[9px] font-black bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded uppercase tracking-tighter shadow-sm">Live</span>}</div></div></div></td>
                                        <td className="px-8 py-6"><div className="space-y-1"><p className="text-[10px] font-black text-gray-800 dark:text-gray-200 uppercase tracking-tight italic">Por {post.author}</p><p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{format(new Date(post.createdAt), 'dd MMM yyyy', { locale: es })}</p></div></td>
                                        <td className="px-8 py-6 text-center">{post.published ? <div className="text-emerald-500 flex flex-col items-center gap-1"><FaCheckCircle size={16}/><span className="text-[8px] font-black uppercase">Público</span></div> : <div className="text-gray-400 opacity-50 flex flex-col items-center gap-1"><FaTimesCircle size={16}/><span className="text-[8px] font-black uppercase">Borrador</span></div>}</td>
                                        <td className="px-8 py-6 text-right"><div className="flex justify-end gap-2"><button onClick={() => handleEdit(post)} className="p-3 bg-gray-100 dark:bg-gray-700 text-gray-400 hover:text-blue-500 rounded-xl transition-all"><FaEdit size={14} /></button><button onClick={() => handleDelete(post)} className="p-3 bg-gray-100 dark:bg-gray-700 text-gray-400 hover:text-red-500 rounded-xl transition-all"><FaTrash size={14} /></button></div></td>
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
