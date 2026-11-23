import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { useGestion } from "./context/GestionContext";
import { 
    importInstallationMaterialsBulk, 
    fetchInstallationCategories, 
    createInstallationCategory, 
    deleteInstallationCategory, 
    deleteInstallationCategoriesBatch 
} from "../../api/apiClient";
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import { 
    FaBoxOpen, FaPlus, FaTrash, FaEdit, FaSearch, 
    FaTimes, FaSave, FaChevronRight,
    FaFileCode, FaCloudUploadAlt, FaTools
} from 'react-icons/fa';

const DEFAULT_CATEGORIES = [
    "General",
    "Filtración & Membranas",
    "Tubería & Conexiones",
    "Bombas & Motores",
    "Eléctrico & Control",
    "Tornillería & Fijación",
    "Insumos Químicos"
];

// ====================================================================
// Modal: Carga Masiva de Materiales de Instalación
// ====================================================================
const JsonImportModal = ({ isOpen, onClose, onImportSuccess }) => {
    const [jsonInput, setJsonInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    if (!isOpen) return null;

    const exampleJson = JSON.stringify([
        {
            "name": "Filtro de Carbón Activado 10x4.5",
            "category": "Filtración & Membranas",
            "unit": "Pza",
            "cost": 450.00,
            "stock": 20,
            "code": "FIL-CARB-10",
            "imageUrl": "https://img.darmaxagua.mx/filtro.jpg"
        },
        {
            "name": "Tubo PVC Hidráulico 1/2 pulgada",
            "category": "Tubería & Conexiones",
            "unit": "Tramo",
            "cost": 120.00,
            "stock": 35,
            "code": "TUB-PVC-05"
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
            
            const normalizedItems = itemsToProcess.map(raw => {
                const itemMap = {};
                Object.keys(raw).forEach(key => {
                    itemMap[key.toLowerCase().trim()] = raw[key];
                });

                return {
                    name: (itemMap.name || itemMap.nombre || itemMap.material || "").trim(),
                    code: itemMap.code || itemMap.codigo || "",
                    category: itemMap.category || itemMap.categoria || "General",
                    unit: itemMap.unit || itemMap.unidad || "Pza",
                    cost: parseFloat(itemMap.cost || itemMap.costo || itemMap.precio || itemMap.price) || 0,
                    stock: parseInt(itemMap.stock || itemMap.existencia || itemMap.cantidad, 10) || 0,
                    imageUrl: itemMap.imageurl || itemMap.imagen || ""
                };
            }).filter(item => item.name);

            if (normalizedItems.length === 0) throw new Error("No hay materiales válidos");

            const result = await importInstallationMaterialsBulk(normalizedItems);
            toast.success(`Carga masiva exitosa: ${result.count} materiales técnicos importados a la base de datos.`);
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
            <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700 flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/20 shrink-0">
                    <div>
                        <h2 className="text-xl font-black text-gray-800 dark:text-white uppercase tracking-tight flex items-center gap-2">
                            <FaFileCode className="text-primary" /> Carga Masiva de Materiales Técnicos
                        </h2>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                            Guardado en la tabla de Materiales de Instalación (BD)
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors p-2">
                        <FaTimes size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                    <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                            <FaChevronRight size={8}/> Estructura Requerida en JSON:
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
                            className="w-full h-64 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl p-5 font-mono text-xs outline-none focus:ring-4 focus:ring-primary/5 transition-colors dark:text-white"
                            placeholder='[ { "name": "Bomba 1HP", "cost": 1500, "unit": "Pza", ... } ]'
                            value={jsonInput}
                            onChange={(e) => setJsonInput(e.target.value)}
                        />
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex gap-3 bg-gray-50/50 dark:bg-gray-900/20 shrink-0">
                    <button type="button" onClick={onClose} className="flex-1 py-4 bg-white dark:bg-gray-800 text-gray-500 font-black rounded-2xl uppercase tracking-widest text-[10px] border border-gray-200 dark:border-gray-700 shadow-sm">
                        Cancelar
                    </button>
                    <button 
                        onClick={handleImport} 
                        disabled={isProcessing || !jsonInput.trim()}
                        className="flex-[2] py-4 bg-primary text-white font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-2xl shadow-primary/30 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isProcessing ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
                        ) : (
                            <> <FaCloudUploadAlt size={16} /> Ejecutar Importación a BD </>
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

// ====================================================================
// Modal: Alta / Edición de Material de Instalación
// ====================================================================
const InstallationMaterialModal = ({ isOpen, onClose, materialToEdit, onSave, categories }) => {
    const [material, setMaterial] = useState({
        name: '',
        code: '',
        category: categories[0] || 'General',
        unit: 'Pza',
        cost: '',
        stock: '',
        minStock: '5',
        imageUrl: '',
        status: 'ACTIVE',
        notes: ''
    });

    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategory, setNewCategory] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (materialToEdit) {
            setMaterial({
                name: materialToEdit.name || '',
                code: materialToEdit.code || '',
                category: materialToEdit.category || categories[0] || 'General',
                unit: materialToEdit.unit || 'Pza',
                cost: materialToEdit.cost !== undefined ? materialToEdit.cost : '',
                stock: materialToEdit.stock !== undefined ? materialToEdit.stock : '',
                minStock: materialToEdit.minStock !== undefined ? materialToEdit.minStock : '5',
                imageUrl: materialToEdit.imageUrl || '',
                status: materialToEdit.status || 'ACTIVE',
                notes: materialToEdit.notes || ''
            });
        } else {
            setMaterial({
                name: '',
                code: '',
                category: categories[0] || 'General',
                unit: 'Pza',
                cost: '',
                stock: '0',
                minStock: '5',
                imageUrl: '',
                status: 'ACTIVE',
                notes: ''
            });
        }
        setIsSaving(false);
    }, [materialToEdit, isOpen, categories]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setMaterial(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        const finalCategory = isAddingCategory ? newCategory.trim() : material.category;
        if (!material.name || !material.name.trim()) {
            Swal.fire('Error', 'Ingresa el nombre del material.', 'error');
            return;
        }

        try {
            setIsSaving(true);
            await onSave({
                ...material,
                name: material.name.trim(),
                category: finalCategory || 'General',
                stock: parseInt(material.stock, 10) || 0,
                minStock: parseInt(material.minStock, 10) || 0,
                cost: parseFloat(material.cost) || 0
            });
            setNewCategory('');
            setIsAddingCategory(false);
        } catch (error) {
            console.error("Error al guardar material de instalación:", error);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;
    const isEditing = !!materialToEdit;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700 flex flex-col max-h-[92vh]">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/20 shrink-0">
                    <div>
                        <h2 className="text-xl font-black text-gray-800 dark:text-white uppercase tracking-tight flex items-center gap-2">
                            {isEditing ? <FaEdit className="text-primary" /> : <FaTools className="text-primary" />}
                            {isEditing ? "Editar Material de Instalación" : "Nuevo Material para Instalación"}
                        </h2>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                            Almacén técnico e insumos para ingeniería
                        </p>
                    </div>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors p-2">
                        <FaTimes size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-4 custom-scrollbar">
                        {/* Nombre y Código */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="sm:col-span-2">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Nombre del Material *</label>
                                <input
                                    name="name"
                                    type="text"
                                    value={material.name}
                                    onChange={handleChange}
                                    placeholder="Ej: Tubo PVC 1/2, Bomba 1HP..."
                                    required
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 font-bold text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Código / SKU</label>
                                <input
                                    name="code"
                                    type="text"
                                    value={material.code}
                                    onChange={handleChange}
                                    placeholder="MAT-001"
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 font-mono text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                        </div>

                        {/* Categoría y Unidad */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Categoría Técnica</label>
                                {!isAddingCategory ? (
                                    <div className="flex gap-2">
                                        <select
                                            name="category"
                                            value={material.category}
                                            onChange={handleChange}
                                            className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                                        >
                                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                        <button
                                            type="button"
                                            onClick={() => setIsAddingCategory(true)}
                                            className="p-2 bg-gray-100 dark:bg-gray-700 rounded-xl hover:text-primary transition-colors"
                                            title="Nueva categoría"
                                        >
                                            <FaPlus size={10} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newCategory}
                                            onChange={(e) => setNewCategory(e.target.value)}
                                            placeholder="Nueva categoría..."
                                            className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                                            autoFocus
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setIsAddingCategory(false)}
                                            className="p-2 bg-gray-100 dark:bg-gray-700 rounded-xl hover:text-red-500 transition-colors"
                                        >
                                            <FaTimes size={10} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Unidad de Medida</label>
                                <select
                                    name="unit"
                                    value={material.unit}
                                    onChange={handleChange}
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                                >
                                    <option value="Pza">Pieza (Pza)</option>
                                    <option value="Mts">Metros (Mts)</option>
                                    <option value="Tramo">Tramo</option>
                                    <option value="Rollo">Rollo</option>
                                    <option value="Kg">Kilogramo (Kg)</option>
                                    <option value="Lts">Litros (Lts)</option>
                                    <option value="Kit">Kit / Paquete</option>
                                </select>
                            </div>
                        </div>

                        {/* Stock, Stock Mínimo y Costo */}
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Stock Almacén *</label>
                                <input
                                    name="stock"
                                    type="number"
                                    min="0"
                                    value={material.stock}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 font-black text-xs text-primary outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Alerta Mínimo</label>
                                <input
                                    name="minStock"
                                    type="number"
                                    min="0"
                                    value={material.minStock}
                                    onChange={handleChange}
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 font-bold text-xs outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Costo Adquisición ($)</label>
                                <input
                                    name="cost"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={material.cost}
                                    onChange={handleChange}
                                    placeholder="0.00"
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 font-bold text-xs outline-none"
                                />
                            </div>
                        </div>

                        {/* Estado y URL Imagen */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Estado</label>
                                <select
                                    name="status"
                                    value={material.status}
                                    onChange={handleChange}
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                                >
                                    <option value="ACTIVE">Activo</option>
                                    <option value="INACTIVE">Inactivo / Agotado</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">URL Imagen (Opcional)</label>
                                <input
                                    name="imageUrl"
                                    type="text"
                                    value={material.imageUrl}
                                    onChange={handleChange}
                                    placeholder="https://..."
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs font-mono outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex gap-3 bg-gray-50/50 dark:bg-gray-900/20 shrink-0">
                        <button type="button" onClick={onClose} disabled={isSaving} className="flex-1 py-3 bg-white dark:bg-gray-800 text-gray-500 font-black rounded-2xl uppercase tracking-widest text-[10px] border border-gray-200 dark:border-gray-700">
                            Cancelar
                        </button>
                        <button type="submit" disabled={isSaving} className="flex-[2] py-3 bg-primary hover:bg-primary-dark text-white font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-2xl shadow-primary/30 flex items-center justify-center gap-2">
                            {isSaving ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
                            ) : (
                                <FaSave size={14} />
                            )}
                            <span>{isEditing ? 'Guardar Cambios' : 'Registrar Material'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

// ====================================================================
// Modal: Gestión de Categorías Técnicas para Instalación
// ====================================================================
const ManageInstallationCategoriesModal = ({ isOpen, categories = [], materials = [], onClose, onUpdated }) => {
    const [name, setName] = useState('');
    const [saving, setSaving] = useState(false);
    const [localCategories, setLocalCategories] = useState(categories);
    const [selectedCatIds, setSelectedCatIds] = useState([]);
    const [deletingIds, setDeletingIds] = useState([]);
    const [isBatchDeleting, setIsBatchDeleting] = useState(false);

    // SweetAlert2 configurado con z-index superior al modal z-[9999]
    const swalModal = useMemo(() => {
        return Swal.mixin({
            customClass: {
                container: '!z-[100000]'
            },
            didOpen: () => {
                const container = Swal.getContainer();
                if (container) container.style.zIndex = '100000';
            }
        });
    }, []);

    useEffect(() => {
        setLocalCategories(categories);
    }, [categories]);

    if (!isOpen) return null;

    // Conteo de materiales asignados a cada categoría técnica
    const getAssignedCount = (catName) => {
        return materials.filter(m => 
            (m.category || '').toLowerCase().trim() === (catName || '').toLowerCase().trim()
        ).length;
    };

    const deletableCats = localCategories.filter(cat => getAssignedCount(cat.name) === 0);
    const allDeletableSelected = deletableCats.length > 0 && selectedCatIds.length === deletableCats.length;

    const toggleSelectCategory = (catId) => {
        setSelectedCatIds(prev => 
            prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
        );
    };

    const toggleSelectAll = () => {
        if (allDeletableSelected) {
            setSelectedCatIds([]);
        } else {
            setSelectedCatIds(deletableCats.map(c => c.id));
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) return;

        setSaving(true);
        try {
            const created = await createInstallationCategory({ name: trimmed });
            toast.success('Categoría técnica registrada con éxito');
            setName('');
            setLocalCategories(prev => [...prev, created]);
            if (onUpdated) onUpdated();
        } catch (error) {
            swalModal.fire('Error', error.message || 'No se pudo crear la categoría técnica.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (category) => {
        const assignedCount = getAssignedCount(category.name);

        if (assignedCount > 0) {
            swalModal.fire({
                title: 'No se puede eliminar la categoría técnica',
                html: `La categoría <b>"${category.name}"</b> tiene <b>${assignedCount}</b> ${assignedCount === 1 ? 'material técnico asociado' : 'materiales técnicos asociados'}.<br/><br/>Para poder borrarla, debes reasignar o eliminar primero los materiales de instalación correspondientes.`,
                icon: 'warning',
                confirmButtonColor: '#137FEC',
                confirmButtonText: 'Entendido'
            });
            return;
        }

        const result = await swalModal.fire({
            title: `¿Eliminar categoría "${category.name}"?`,
            text: 'Esta acción no se puede deshacer.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            setDeletingIds(prev => [...prev, category.id]);
            try {
                await deleteInstallationCategory(category.id);
                setLocalCategories(prev => prev.filter(c => c.id !== category.id));
                setSelectedCatIds(prev => prev.filter(id => id !== category.id));
                toast.success(`Categoría técnica "${category.name}" eliminada`);
                if (onUpdated) onUpdated();
            } catch (error) {
                const errorMsg = error?.response?.data?.error || error.message || 'No se pudo eliminar la categoría técnica.';
                swalModal.fire('Error al eliminar', errorMsg, 'error');
            } finally {
                setDeletingIds(prev => prev.filter(id => id !== category.id));
            }
        }
    };

    const handleDeleteBatch = async () => {
        const count = selectedCatIds.length;
        if (count === 0) return;

        const result = await swalModal.fire({
            title: `¿Eliminar ${count} ${count === 1 ? 'categoría seleccionada' : 'categorías seleccionadas'}?`,
            html: `Se removerán <b>${count}</b> categorías técnicas vacías de la base de datos.<br/>Esta acción no se puede deshacer.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#6B7280',
            confirmButtonText: `Sí, eliminar ${count}`,
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            setIsBatchDeleting(true);
            setDeletingIds(prev => [...prev, ...selectedCatIds]);
            try {
                await deleteInstallationCategoriesBatch(selectedCatIds);
                const setDeleted = new Set(selectedCatIds);
                setLocalCategories(prev => prev.filter(c => !setDeleted.has(c.id)));
                setSelectedCatIds([]);
                toast.success(`${count} categorías técnicas eliminadas`);
                if (onUpdated) onUpdated();
            } catch (error) {
                const errorMsg = error?.response?.data?.error || error.message || 'Error al eliminar categorías seleccionadas.';
                swalModal.fire('Error al eliminar', errorMsg, 'error');
            } finally {
                setIsBatchDeleting(false);
                setDeletingIds([]);
            }
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100 dark:border-gray-700 p-6 space-y-5">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">category</span>
                            Categorías Técnicas de Instalación
                        </h3>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                            Crea o gestiona las categorías del almacén técnico. Solo se pueden borrar categorías sin materiales asociados.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-xl transition-colors"
                    >
                        <FaTimes size={18} />
                    </button>
                </div>

                {/* Formulario para agregar nueva categoría */}
                <form onSubmit={handleCreate} className="space-y-2">
                    <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block">
                        Nueva Categoría Técnica
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ej. Válvulas, Filtros Sedimento, Tubería Cobre..."
                            required
                            className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs sm:text-sm font-semibold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                        />
                        <button
                            type="submit"
                            disabled={saving || !name.trim()}
                            className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-2xl text-xs font-bold shadow-md shadow-primary/25 disabled:opacity-50 transition-colors flex items-center gap-1.5 shrink-0"
                        >
                            {saving ? (
                                <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
                            ) : (
                                <FaPlus size={12} />
                            )}
                            <span>{saving ? 'Guardando...' : 'Agregar'}</span>
                        </button>
                    </div>
                </form>

                {/* Lista de categorías técnicas */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                                Categorías Existentes ({localCategories.length})
                            </span>
                            {deletableCats.length > 0 && (
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-lg">
                                    {deletableCats.length} eliminables
                                </span>
                            )}
                        </div>

                        {deletableCats.length > 1 && (
                            <button
                                type="button"
                                onClick={toggleSelectAll}
                                className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 transition-colors"
                            >
                                <span className="material-symbols-outlined text-sm">
                                    {allDeletableSelected ? 'check_box' : 'check_box_outline_blank'}
                                </span>
                                <span>{allDeletableSelected ? 'Deseleccionar todas' : 'Seleccionar todas las vacías'}</span>
                            </button>
                        )}
                    </div>

                    {/* Barra de acción múltiple */}
                    {selectedCatIds.length > 0 && (
                        <div className="mb-2.5 p-2.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-black text-red-700 dark:text-red-400 pl-1">
                                <span className="material-symbols-outlined text-base">delete_sweep</span>
                                <span>{selectedCatIds.length} {selectedCatIds.length === 1 ? 'categoría seleccionada' : 'categorías seleccionadas'}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => setSelectedCatIds([])}
                                    className="px-2.5 py-1 text-[11px] font-bold text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 rounded-xl transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDeleteBatch}
                                    disabled={isBatchDeleting}
                                    className="px-3.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
                                >
                                    {isBatchDeleting ? (
                                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
                                    ) : (
                                        <FaTrash size={10} />
                                    )}
                                    <span>Eliminar ({selectedCatIds.length})</span>
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="max-h-64 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                        {localCategories.length === 0 ? (
                            <p className="text-center py-6 text-xs text-gray-400 italic">No hay categorías registradas.</p>
                        ) : (
                            localCategories.map(cat => {
                                const assignedCount = getAssignedCount(cat.name);
                                const hasMaterials = assignedCount > 0;
                                const isDeleting = deletingIds.includes(cat.id);
                                const isSelected = selectedCatIds.includes(cat.id);

                                return (
                                    <div
                                        key={cat.id}
                                        className={`flex items-center justify-between p-3 rounded-2xl border transition-colors ${
                                            isDeleting 
                                                ? 'bg-red-50/50 dark:bg-red-950/20 border-red-200 opacity-60 pointer-events-none' 
                                                : isSelected 
                                                    ? 'bg-primary/5 border-primary/40' 
                                                    : 'bg-gray-50/80 dark:bg-gray-900/40 border-gray-100 dark:border-gray-700/60 hover:border-gray-200'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                            {!hasMaterials && (
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    disabled={isDeleting}
                                                    onChange={() => toggleSelectCategory(cat.id)}
                                                    className="w-4 h-4 rounded text-primary focus:ring-primary/20 border-gray-300 dark:border-gray-600 dark:bg-gray-700 cursor-pointer shrink-0"
                                                />
                                            )}
                                            {hasMaterials && (
                                                <span className="w-2 h-2 rounded-full bg-primary shrink-0 ml-1"></span>
                                            )}
                                            <div className="truncate">
                                                <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                                                    {cat.name}
                                                </p>
                                                <span className={`text-[10px] font-medium ${
                                                    hasMaterials ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-gray-400'
                                                }`}>
                                                    {hasMaterials ? `${assignedCount} ${assignedCount === 1 ? 'material asignado' : 'materiales asignados'}` : 'Sin materiales (eliminable)'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1 shrink-0">
                                            {isDeleting ? (
                                                <div className="p-1.5 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 font-bold">
                                                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-red-600 border-t-transparent"></div>
                                                    <span className="text-[10px]">Borrando...</span>
                                                </div>
                                            ) : hasMaterials ? (
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(cat)}
                                                    className="p-1.5 rounded-xl text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
                                                    title={`No se puede borrar: tiene ${assignedCount} materiales asociados`}
                                                >
                                                    <span className="material-symbols-outlined text-base">lock</span>
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(cat)}
                                                    className="p-1.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                                                    title="Eliminar categoría técnica vacía"
                                                >
                                                    <FaTrash size={12} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-gray-700/60">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-2xl text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

// ====================================================================
// Componente Principal: Inventario para Instalación (BD Separada)
// ====================================================================
const Inventario = () => {
    const { state, addInstallationMaterial, updateInstallationMaterial, deleteInstallationMaterial, fetchManagementData } = useGestion();
    const { installationMaterials = [], loading } = state;

    const [techCategories, setTechCategories] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCatModalOpen, setIsCatModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [materialToEdit, setMaterialToEdit] = useState(null);
    const [activeCategory, setActiveCategory] = useState("TODOS");
    const [searchQuery, setSearchQuery] = useState("");

    // Cargar categorías técnicas desde la base de datos
    const loadTechCategories = async () => {
        try {
            const data = await fetchInstallationCategories();
            setTechCategories(data || []);
        } catch (err) {
            console.error("Error al cargar categorías técnicas:", err);
        }
    };

    useEffect(() => {
        loadTechCategories();
    }, []);

    // Categorías dinámicas a partir de la BD de categorías y datos existentes
    const categoriesList = useMemo(() => {
        const found = new Set();
        (techCategories || []).forEach(c => {
            if (c.name) found.add(c.name);
        });
        (installationMaterials || []).forEach(m => {
            if (m.category) found.add(m.category);
        });
        if (found.size === 0) {
            DEFAULT_CATEGORIES.forEach(c => found.add(c));
        }
        return Array.from(found);
    }, [techCategories, installationMaterials]);

    // Filtrado de materiales
    const filteredMaterials = useMemo(() => {
        return (installationMaterials || []).filter(item => {
            const matchesCategory = activeCategory === "TODOS" || item.category === activeCategory;
            const matchesSearch = !searchQuery.trim() || 
                (item.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.code || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.category || "").toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [installationMaterials, activeCategory, searchQuery]);

    // Métricas del almacén
    const metrics = useMemo(() => {
        const total = (installationMaterials || []).length;
        const totalStock = (installationMaterials || []).reduce((acc, m) => acc + (parseInt(m.stock, 10) || 0), 0);
        const lowStock = (installationMaterials || []).filter(m => (parseInt(m.stock, 10) || 0) <= (parseInt(m.minStock, 10) || 5)).length;
        return { total, totalStock, lowStock };
    }, [installationMaterials]);

    const handleSaveMaterial = async (data) => {
        try {
            if (materialToEdit?.id) {
                await updateInstallationMaterial(materialToEdit.id, data);
                toast.success('Material de instalación actualizado');
            } else {
                await addInstallationMaterial(data);
                toast.success('Nuevo material registrado en almacén técnico');
            }
            setIsModalOpen(false);
            setMaterialToEdit(null);
            loadTechCategories();
        } catch (error) {
            console.error("Error al guardar material:", error);
        }
    };
    
    const handleDelete = async (id, name) => {
        const result = await Swal.fire({
            title: '¿Eliminar material?',
            html: `Se removerá <b>${name}</b> del inventario técnico de instalación de la base de datos.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });
        if (result.isConfirmed) {
            await deleteInstallationMaterial(id);
            toast.success('Material eliminado');
        }
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Bento Card: Encabezado Inventario para Instalación */}
            <div className="p-5 sm:p-6 lg:p-7 bg-white dark:bg-gray-800 rounded-3xl shadow-xs border border-gray-100 dark:border-gray-700/80 mb-5 sm:mb-6">
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                    <div className="space-y-1">
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-2.5">
                            <span className="material-symbols-outlined text-primary text-3xl">construction</span>
                            Inventario para Instalación
                        </h1>
                        <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
                            Gestión de materiales técnicos, tuberías, bombas y consumibles para ingeniería (Base de Datos dedicada)
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto">
                        <button 
                            onClick={() => setIsCatModalOpen(true)} 
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200/80 dark:border-gray-700 shadow-xs hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-colors"
                        >
                            <span className="material-symbols-outlined text-primary text-base">category</span>
                            <span>Categorías</span>
                        </button>
                        <button 
                            onClick={() => setIsImportModalOpen(true)} 
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200/80 dark:border-gray-700 shadow-xs hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-colors"
                        >
                            <FaFileCode className="text-emerald-500 text-sm" /> 
                            <span>Carga Masiva</span>
                        </button>
                        <button 
                            onClick={() => { setMaterialToEdit(null); setIsModalOpen(true); }} 
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold bg-primary hover:bg-primary-dark text-white shadow-md shadow-primary/25 transition-colors"
                        >
                            <FaPlus className="text-xs" /> 
                            <span>Nuevo Material</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Bento Grid: Métricas de Almacén Técnico */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="p-4 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-xs">
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Total Materiales</span>
                    <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">{metrics.total} <span className="text-xs font-bold text-gray-400">artículos</span></p>
                </div>
                <div className="p-4 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-xs">
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Piezas en Stock Total</span>
                    <p className="text-2xl font-black text-primary mt-1">{metrics.totalStock} <span className="text-xs font-bold text-gray-400">unidades</span></p>
                </div>
                <div className="p-4 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-xs">
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Alerta de Stock Bajo</span>
                    <p className={`text-2xl font-black mt-1 ${metrics.lowStock > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {metrics.lowStock} <span className="text-xs font-bold text-gray-400">requieren resurtido</span>
                    </p>
                </div>
            </div>

            {/* Buscador y Píldoras de Categorías (Sin barra tosca de scroll, distribución fluida) */}
            <div className="space-y-3">
                <div className="relative">
                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar por nombre, código o categoría técnica..."
                        className="w-full pl-11 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs sm:text-sm font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                    />
                </div>

                <div className="bg-white dark:bg-gray-800 p-2.5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs flex flex-wrap gap-2">
                    <button
                        onClick={() => setActiveCategory("TODOS")}
                        className={`px-4 py-2 font-bold rounded-xl text-xs whitespace-nowrap transition-colors ${
                            activeCategory === "TODOS" ? 'bg-primary text-white shadow-xs' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                    >
                        Todos ({installationMaterials.length})
                    </button>
                    {categoriesList.map(cat => {
                        const count = installationMaterials.filter(m => (m.category || '').toLowerCase().trim() === cat.toLowerCase().trim()).length;
                        return (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-4 py-2 font-bold rounded-xl text-xs whitespace-nowrap transition-colors ${
                                    activeCategory === cat ? 'bg-primary text-white shadow-xs' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                }`}
                            >
                                {cat} ({count})
                            </button>
                        );
                    })}
                </div>
            </div>
            
            {/* Tabla de Materiales */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/80 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Material / Insumo</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Categoría</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Existencia</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Unidad</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Costo Unitario</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="p-16 text-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary mx-auto"></div>
                                    </td>
                                </tr>
                            ) : filteredMaterials.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-16 text-center text-gray-400 font-bold text-sm">
                                        No hay materiales registrados en esta categoría técnica.
                                    </td>
                                </tr>
                            ) : filteredMaterials.map((item) => {
                                const isLowStock = (parseInt(item.stock, 10) || 0) <= (parseInt(item.minStock, 10) || 5);
                                return (
                                    <tr key={item.id} className="group hover:bg-gray-50/60 dark:hover:bg-gray-900/30">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-11 w-11 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-900 flex items-center justify-center border border-gray-100 dark:border-gray-700 shadow-inner shrink-0">
                                                    {item.imageUrl ? (
                                                        <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <FaBoxOpen className="text-gray-300 text-lg" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 dark:text-white text-xs">{item.name}</p>
                                                    {item.code && <span className="text-[10px] font-mono text-gray-400">{item.code}</span>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                                {item.category || "General"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`text-sm font-black ${isLowStock ? 'text-amber-500' : 'text-gray-800 dark:text-gray-200'}`}>
                                                {item.stock}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center text-xs font-bold text-gray-500">
                                            {item.unit || "Pza"}
                                        </td>
                                        <td className="px-6 py-4 text-right font-black text-gray-900 dark:text-white text-xs">
                                            ${(parseFloat(item.cost) || 0).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex gap-1.5 justify-end">
                                                <button
                                                    onClick={() => { setMaterialToEdit(item); setIsModalOpen(true); }}
                                                    className="p-2 bg-gray-100 hover:bg-primary hover:text-white dark:bg-gray-700 text-gray-500 dark:text-gray-300 rounded-xl transition-colors"
                                                    title="Editar material"
                                                >
                                                    <FaEdit size={12}/>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id, item.name)}
                                                    className="p-2 bg-gray-100 hover:bg-red-500 hover:text-white dark:bg-gray-700 text-gray-500 dark:text-gray-300 rounded-xl transition-colors"
                                                    title="Eliminar material"
                                                >
                                                    <FaTrash size={12}/>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals */}
            {isCatModalOpen && (
                <ManageInstallationCategoriesModal
                    isOpen={isCatModalOpen}
                    categories={techCategories}
                    materials={installationMaterials}
                    onClose={() => setIsCatModalOpen(false)}
                    onUpdated={loadTechCategories}
                />
            )}
            {isModalOpen && (
                <InstallationMaterialModal
                    isOpen={isModalOpen}
                    onClose={() => { setIsModalOpen(false); setMaterialToEdit(null); }}
                    onSave={handleSaveMaterial}
                    materialToEdit={materialToEdit}
                    categories={categoriesList}
                />
            )}
            {isImportModalOpen && (
                <JsonImportModal
                    isOpen={isImportModalOpen}
                    onClose={() => setIsImportModalOpen(false)}
                    onImportSuccess={fetchManagementData}
                />
            )}
        </div>
    );
};

export default Inventario;