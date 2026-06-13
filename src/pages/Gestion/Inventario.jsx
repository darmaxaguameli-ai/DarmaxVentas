import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useGestion } from "./context/GestionContext";
import { fetchProductCategories, updateProductCategory, createProductCategory, importProductsBulk } from "../../api/apiClient";
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import { 
    FaBoxOpen, FaPlus, FaTrash, FaEdit, FaSearch, 
    FaTimes, FaSave, FaImage, FaCheckCircle, 
    FaTag, FaLayerGroup, FaEye, FaEyeSlash, FaChevronRight,
    FaFileCode, FaCloudUploadAlt
} from 'react-icons/fa';

const JsonImportModal = ({ isOpen, onClose, onImportSuccess, categories }) => {
    const [jsonInput, setJsonInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    if (!isOpen) return null;

    const exampleJson = JSON.stringify([
        {
            "nombre": "Filtro de Carbón Activado 10x4.5",
            "categoria": categories[0]?.name || "Insumos",
            "precio": 450.00,
            "existencia": 20,
            "imagen": "https://img.darmaxagua.mx/filtro.jpg"
        },
        {
            "name": "Membrana 100 GPD",
            "category": "Insumos",
            "price": 850,
            "stock": 15
        }
    ], null, 2);

    const handleImport = async () => {
        try {
            let cleanInput = jsonInput.trim();
            cleanInput = cleanInput.replace(/,\s*([\]}])/g, '$1');
            
            let data;
            try {
                data = JSON.parse(cleanInput);
            } catch (e) {
                try {
                    data = JSON.parse(`[${cleanInput}]`);
                } catch (e2) {
                    throw new Error("Formato JSON no reconocido");
                }
            }
            
            const itemsToProcess = Array.isArray(data) ? data : [data];
            
            setIsProcessing(true);
            
            // ✅ NORMALIZACIÓN MASIVA: Preparamos los datos para el servidor
            const normalizedItems = itemsToProcess.map(raw => {
                const itemMap = {};
                Object.keys(raw).forEach(key => {
                    itemMap[key.toLowerCase().trim()] = raw[key];
                });

                return {
                    name: (itemMap.name || itemMap.nombre || itemMap.producto || "").toUpperCase().trim(),
                    category: itemMap.category || itemMap.categoria || categories[0]?.name || "General",
                    price: parseFloat(itemMap.price || itemMap.precio || itemMap.costo) || 0,
                    stock: parseInt(itemMap.stock || itemMap.existencia || itemMap.cantidad || itemMap.unidades) || 0,
                    waterPrice: parseFloat(itemMap.waterprice || itemMap.preciorecarga) || 0,
                    imageUrl: itemMap.imageurl || itemMap.imagen || ""
                };
            }).filter(item => item.name);

            if (normalizedItems.length === 0) throw new Error("No hay productos válidos");

            // ✅ UNA SOLA PETICIÓN MASIVA AL SERVIDOR
            const result = await importProductsBulk(normalizedItems);
            
            toast.success(`Carga masiva exitosa: ${result.count} productos importados.`);
            onImportSuccess();
            setJsonInput('');
            onClose();
        } catch (err) {
            Swal.fire('Error de Importación', err.message || 'El contenido no tiene un formato válido.', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700 flex flex-col max-h-[90vh] animate-in zoom-in duration-300">
                <div className="p-6 border-b border-gray-50 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/20 shrink-0">
                    <div>
                        <h2 className="text-xl font-black text-gray-800 dark:text-white uppercase tracking-tight flex items-center gap-2">
                            <FaFileCode className="text-primary" /> Carga Masiva (Vía Petición Segura)
                        </h2>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1 italic">Los datos se guardarán como 'Internos' (Protegidos)</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors p-2">
                        <FaTimes size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                    <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                            <FaChevronRight size={8}/> Estructura Requerida:
                        </p>
                        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800 shadow-inner">
                            <pre className="text-[10px] font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                                {exampleJson}
                            </pre>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Pega el JSON aquí:</label>
                        <textarea 
                            className="w-full h-64 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl p-5 font-mono text-xs outline-none focus:ring-4 focus:ring-primary/5 transition-all dark:text-white"
                            placeholder='[ { "name": "...", "price": 100, ... } ]'
                            value={jsonInput}
                            onChange={(e) => setJsonInput(e.target.value)}
                        />
                    </div>
                </div>

                <div className="p-6 border-t border-gray-50 dark:border-gray-700 flex gap-3 bg-gray-50/50 dark:bg-gray-900/20 shrink-0">
                    <button type="button" onClick={onClose} className="flex-1 py-4 bg-white dark:bg-gray-800 text-gray-500 font-black rounded-2xl uppercase tracking-widest text-[10px] border border-gray-200 dark:border-gray-700 shadow-sm">Cancelar</button>
                    <button 
                        onClick={handleImport} 
                        disabled={isProcessing || !jsonInput.trim()}
                        className="flex-[2] py-4 bg-primary text-white font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-2xl shadow-primary/30 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isProcessing ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
                        ) : (
                            <> <FaCloudUploadAlt size={16} /> Ejecutar Petición Masiva </>
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

const CategoryManagerModal = ({ isOpen, onClose, categories, onUpdate }) => {
    const [newCatName, setNewCatName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleCreateCategory = async (e) => {
        e.preventDefault();
        if (!newCatName.trim()) return;
        
        setIsSubmitting(true);
        try {
            await createProductCategory({ name: newCatName.trim(), isPublic: true });
            toast.success(`Categoría creada`);
            setNewCatName('');
            onUpdate();
        } catch (error) {
            Swal.fire('Error', error.message || 'No se pudo crear.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleTogglePublic = async (category) => {
        try {
            await updateProductCategory(category.id, { isPublic: !category.isPublic });
            onUpdate();
            toast.success(`Estado actualizado`);
        } catch (error) {
            Swal.fire('Error', 'No se pudo actualizar.', 'error');
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700 flex flex-col max-h-[85vh]">
                <div className="p-6 border-b border-gray-50 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/20 shrink-0">
                    <div>
                        <h2 className="text-xl font-black text-gray-800 dark:text-white uppercase tracking-tight flex items-center gap-2">
                            <FaLayerGroup className="text-primary" /> Gestionar Categorías
                        </h2>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Control de visibilidad en tienda</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors p-2">
                        <FaTimes size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    <form onSubmit={handleCreateCategory} className="flex gap-2">
                        <input 
                            type="text" 
                            value={newCatName} 
                            onChange={(e) => setNewCatName(e.target.value)}
                            placeholder="Nombre (ej: Termos)"
                            className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                            disabled={isSubmitting}
                        />
                        <button type="submit" disabled={isSubmitting || !newCatName.trim()} className="btn-primary px-6 text-[10px] uppercase font-black tracking-widest">
                            {isSubmitting ? '...' : 'Crear'}
                        </button>
                    </form>

                    <div className="space-y-3">
                        {categories.map(cat => (
                            <div key={cat.id} className="flex items-center justify-between p-4 rounded-2xl border border-gray-50 dark:border-gray-700 bg-white dark:bg-gray-900/40 shadow-sm">
                                <div>
                                    <p className="font-black text-gray-800 dark:text-white uppercase text-xs tracking-tight">{cat.name}</p>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <div className={`w-1.5 h-1.5 rounded-full ${cat.isPublic ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                                        <p className="text-[8px] text-gray-400 font-black uppercase tracking-[0.1em]">{cat.isPublic ? 'Visible' : 'Interno'}</p>
                                    </div>
                                </div>
                                <button onClick={() => handleTogglePublic(cat)} className={`px-4 py-1.5 rounded-xl text-[9px] font-black tracking-widest transition-all ${cat.isPublic ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                                    {cat.isPublic ? <FaEye size={12}/> : <FaEyeSlash size={12}/>}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-6 bg-gray-50 dark:bg-gray-900/40 border-t dark:border-gray-700 shrink-0">
                    <button onClick={onClose} className="w-full py-4 bg-gray-800 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-lg">Cerrar Panel</button>
                </div>
            </div>
        </div>,
        document.body
    );
};

const ProductModal = ({ isOpen, onClose, productToEdit, onSave, categories }) => {
    const [product, setProduct] = useState({ name: '', stock: '', price: '', waterPrice: '', category: '', imageUrl: '', status: 'ACTIVE', isPublic: true });
    const [uploadType, setUploadType] = useState('url');
    const [newCategory, setNewCategory] = useState('');
    const [isAddingCategory, setIsAddingCategory] = useState(false);

    useEffect(() => {
        if (productToEdit) {
            setProduct({ ...productToEdit, status: productToEdit.status || 'ACTIVE', waterPrice: productToEdit.waterPrice || '', isPublic: productToEdit.isPublic !== undefined ? productToEdit.isPublic : true });
            setUploadType(productToEdit.imageUrl && !productToEdit.imageUrl.startsWith('http') ? 'file' : 'url');
        } else {
            setProduct({ name: '', stock: '', price: '', waterPrice: '', category: categories[0]?.name || '', imageUrl: '', status: 'ACTIVE', isPublic: true });
            setUploadType('url');
        }
    }, [productToEdit, isOpen, categories]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setProduct(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const finalCategory = isAddingCategory ? newCategory : product.category;
        if (!finalCategory) { Swal.fire('Error', 'Debes seleccionar o crear una categoría.', 'error'); return; }
        onSave({ ...product, category: finalCategory, stock: parseInt(product.stock, 10) || 0, price: parseFloat(product.price) || 0, waterPrice: parseFloat(product.waterPrice) || 0 });
        setNewCategory(''); setIsAddingCategory(false); onClose();
    };

    if (!isOpen) return null;

    const isEditing = !!productToEdit;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700 flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-50 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/20 shrink-0">
                    <div>
                        <h2 className="text-xl font-black text-gray-800 dark:text-white uppercase tracking-tight flex items-center gap-2">
                            {isEditing ? <FaEdit className="text-primary" /> : <FaPlus className="text-primary" />}
                            {isEditing ? "Editar Producto" : "Nuevo Producto"}
                        </h2>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Configuración técnica de inventario</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors p-2">
                        <FaTimes size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                    <div className="space-y-4">
                        <div>
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block italic">Nombre Comercial *</label>
                            <input name="name" type="text" value={product.name} onChange={handleChange} required className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-3 font-black text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 uppercase" />
                        </div>
                        <div>
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block italic">Categoría del Catálogo</label>
                            <div className="flex gap-2">
                                {!isAddingCategory ? (
                                    <>
                                        <select name="category" value={product.category} onChange={handleChange} className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-2 text-[11px] font-black uppercase outline-none">
                                            {categories.map(cat => ( <option key={cat.id} value={cat.name}>{cat.name}</option> ))}
                                        </select>
                                        <button type="button" onClick={() => setIsAddingCategory(true)} className="p-3 bg-white dark:bg-gray-700 rounded-xl border border-gray-100 dark:border-gray-600 hover:text-primary transition-colors shadow-sm"><FaPlus size={12} /></button>
                                    </>
                                ) : (
                                    <>
                                        <input type="text" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Nueva categoría..." className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-2 text-xs font-bold outline-none" autoFocus />
                                        <button type="button" onClick={() => setIsAddingCategory(false)} className="p-3 bg-white dark:bg-gray-700 rounded-xl border border-gray-100 dark:border-gray-600 hover:text-red-500 transition-colors shadow-sm"><FaTimes size={12} /></button>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block italic">Estado</label>
                                <select name="status" value={product.status} onChange={handleChange} required className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase outline-none">
                                    <option value="ACTIVE">Activo</option><option value="COMING_SOON">Próximamente</option><option value="INACTIVE">Inactivo</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input name="isPublic" type="checkbox" checked={product.isPublic} onChange={handleChange} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                                </label>
                                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Tienda</span>
                            </div>
                        </div>
                        <div>
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block italic">URL Imagen</label>
                            <input name="imageUrl" type="text" value={product.imageUrl || ''} onChange={handleChange} placeholder="https://..." className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl text-xs font-mono outline-none" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block italic">Stock</label>
                                <input name="stock" type="number" value={product.stock} onChange={handleChange} required className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-2.5 font-black text-primary outline-none" />
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block italic">Precio Venta</label>
                                <input name="price" type="number" step="0.01" value={product.price} onChange={handleChange} required className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-2.5 font-black text-gray-800 dark:text-white outline-none" />
                            </div>
                        </div>
                        {product.category === 'Garrafones' && (
                            <div className="animate-in slide-in-from-top-2">
                                <label className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1.5 block italic">Precio Recarga</label>
                                <input name="waterPrice" type="number" step="0.01" value={product.waterPrice} onChange={handleChange} className="w-full bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-xl px-4 py-3 font-black text-indigo-600 outline-none" />
                            </div>
                        )}
                    </div>
                </form>

                <div className="p-6 border-t border-gray-50 dark:border-gray-700 flex gap-3 bg-gray-50/50 dark:bg-gray-900/20 shrink-0">
                    <button type="button" onClick={onClose} className="flex-1 py-4 bg-white dark:bg-gray-800 text-gray-500 font-black rounded-2xl uppercase tracking-widest text-[10px] border border-gray-200 dark:border-gray-700">Cancelar</button>
                    <button onClick={handleSubmit} className="flex-[2] py-4 bg-primary text-white font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-2xl shadow-primary/30">
                        <FaSave size={16} className="inline mr-2" /> {isEditing ? 'Guardar' : 'Registrar'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

const Inventario = () => {
    const { state, addProduct, updateProduct, deleteProduct } = useGestion();
    const { inventory, loading } = state;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCatModalOpen, setIsCatModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [productToEdit, setProductToEdit] = useState(null);
    const [activeCategory, setActiveCategory] = useState("");
    const [dbCategories, setDbCategories] = useState([]);

    const loadCategories = async () => {
        try {
            const data = await fetchProductCategories();
            setDbCategories(data);
            if (!activeCategory && data.length > 0) setActiveCategory(data[0].name);
        } catch (err) { console.error(err); }
    };

    useEffect(() => { loadCategories(); }, []);

    const filteredInventory = useMemo(() => (inventory || []).filter(p => p.category === activeCategory), [inventory, activeCategory]);

    const handleSaveProduct = async (product) => {
        if (product.id) await updateProduct(product.id, product);
        else await addProduct(product);
        await loadCategories();
        setActiveCategory(product.category);
    };
    
    const handleDelete = async (id) => {
        const result = await Swal.fire({ title: '¿Eliminar?', text: 'Irreversible.', icon: 'warning', showCancelButton: true });
        if (result.isConfirmed) deleteProduct(id);
    }

    return (
        <div className="animate-fade-in space-y-8 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-black text-gray-800 dark:text-white flex items-center gap-4 tracking-tighter uppercase italic"><div className="bg-primary p-3 rounded-2xl shadow-lg shadow-primary/20 text-white"><FaBoxOpen className="text-2xl" /></div> INVENTARIO</h1>
                    <div className="text-[10px] text-gray-500 font-bold mt-2 flex items-center gap-2 uppercase tracking-widest"><div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div> Control de Insumos y Catálogo</div>
                </div>
                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    <button onClick={() => setIsImportModalOpen(true)} className="flex-1 md:flex-none px-6 py-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 font-black rounded-3xl uppercase tracking-widest text-[10px] border border-emerald-100 dark:border-emerald-800 flex items-center justify-center gap-2 shadow-sm hover:bg-emerald-100 transition-all"><FaFileCode size={14}/> Carga Masiva</button>
                    <button onClick={() => setIsCatModalOpen(true)} className="flex-1 md:flex-none px-6 py-4 bg-white dark:bg-gray-800 text-gray-400 font-black rounded-3xl uppercase tracking-widest text-[10px] border border-gray-100 dark:border-gray-700 flex items-center justify-center gap-2 shadow-sm hover:bg-gray-50 transition-all"><FaLayerGroup size={14}/> Categorías</button>
                    <button onClick={() => { setProductToEdit(null); setIsModalOpen(true); }} className="w-full sm:w-auto md:flex-none btn-primary py-4 px-8 rounded-3xl shadow-2xl font-black uppercase text-[10px] tracking-widest transition-all"><FaPlus /> Nuevo Producto</button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-2 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm overflow-x-auto scrollbar-hide">
                <nav className="flex space-x-2">
                    {dbCategories.map(category => (
                        <button key={category.id} onClick={() => setActiveCategory(category.name)} className={`px-6 py-3 font-black rounded-2xl transition-all text-[10px] uppercase tracking-widest whitespace-nowrap ${activeCategory === category.name ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}>{category.name}</button>
                    ))}
                </nav>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-[3rem] border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-900/50 border-b dark:border-gray-700"><th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Insumo</th><th className="px-8 py-6 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Tienda</th><th className="px-8 py-6 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Existencia</th><th className="px-8 py-6 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Precio</th><th className="px-8 py-6 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Acciones</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                            {loading ? ( <tr><td colSpan="5" className="p-20 text-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary mx-auto"></div></td></tr> ) : filteredInventory.length === 0 ? ( <tr><td colSpan="5" className="p-20 text-center text-gray-400 font-bold italic text-sm">No hay productos en esta categoría.</td></tr> ) : filteredInventory.map((item) => (
                                <tr key={item.id} className="group hover:bg-gray-50/50 dark:hover:bg-gray-900/20 transition-all">
                                    <td className="px-8 py-6"><div className="flex items-center gap-6"><div className="h-16 w-16 rounded-2xl overflow-hidden bg-gray-50 dark:bg-gray-900 flex items-center justify-center border dark:border-gray-700 shadow-inner group-hover:scale-110 transition-transform">{item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" /> : <FaBoxOpen className="text-gray-200 text-2xl" />}</div><div><p className="font-black text-gray-800 dark:text-white uppercase text-sm">{item.name}</p><span className="text-[8px] font-black px-2 py-0.5 rounded uppercase mt-1 inline-block bg-emerald-50 text-emerald-600">{item.status}</span></div></div></td>
                                    <td className="px-8 py-6 text-center"><div className="flex flex-col items-center gap-1">{item.isPublic ? <FaEye className="text-emerald-500" /> : <FaEyeSlash className="text-gray-300" />}<span className="text-[8px] font-black uppercase text-gray-400">{item.isPublic ? "Público" : "Interno"}</span></div></td>
                                    <td className="px-8 py-6 text-center"><p className={`text-lg font-black ${item.stock < 10 ? 'text-red-500' : 'text-gray-800 dark:text-gray-200'}`}>{item.stock}</p><p className="text-[8px] font-bold text-gray-400 uppercase">Disponibles</p></td>
                                    <td className="px-8 py-6 text-right font-black text-gray-900 dark:text-white text-lg">${(item.price || 0).toFixed(2)}</td>
                                    <td className="px-8 py-6 text-right"><div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => { setProductToEdit(item); setIsModalOpen(true); }} className="p-3 bg-gray-50 dark:bg-gray-700 text-gray-400 hover:text-blue-500 rounded-xl transition-all"><FaEdit size={14}/></button><button onClick={() => handleDelete(item.id)} className="p-3 bg-gray-50 dark:bg-gray-700 text-gray-400 hover:text-red-500 rounded-xl transition-all"><FaTrash size={14}/></button></div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals */}
            {isModalOpen && <ProductModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveProduct} productToEdit={productToEdit} categories={dbCategories} />}
            {isCatModalOpen && <CategoryManagerModal isOpen={isCatModalOpen} onClose={() => setIsCatModalOpen(false)} categories={dbCategories} onUpdate={loadCategories} />}
            {isImportModalOpen && <JsonImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onImportSuccess={loadCategories} categories={dbCategories} />}
        </div>
    );
}

export default Inventario;
