import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useGestion } from './context/GestionContext';
import { useAuth } from '../../context/AuthContext';
import { 
    FaTools, FaPlus, FaTrash, FaEdit, FaEye, FaSearch, 
    FaBoxOpen, FaLayerGroup, FaTimes, FaSave, FaClipboardList,
    FaExclamationTriangle, FaGripVertical, FaCube, FaPuzzlePiece, 
    FaDownload, FaChevronDown, FaChevronUp
} from 'react-icons/fa';
import Swal from 'sweetalert2';
import { 
    DndContext, 
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// ====================================================================
// Componentes de Soporte DND
// ====================================================================

const SortableItem = ({ id, children, onRemove }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className="group relative bg-gray-50 dark:bg-gray-900/40 p-3 rounded-xl border border-gray-100 dark:border-gray-700 flex items-center gap-3">
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 text-gray-300 hover:text-primary transition-colors">
                <FaGripVertical size={12} />
            </div>
            <div className="flex-1 min-w-0">
                {children}
            </div>
            <button 
                type="button"
                onClick={onRemove}
                className="p-1 text-gray-300 hover:text-red-500 transition-colors"
            >
                <FaTrash size={10} />
            </button>
        </div>
    );
};

// ====================================================================
// Modales
// ====================================================================

const InstallationModelModal = ({ isOpen, onClose, modelToEdit, onSave, inventory, allModels }) => {
    const [name, setName] = useState(modelToEdit?.name || '');
    const [description, setDescription] = useState(modelToEdit?.description || '');
    const [isModule, setIsModule] = useState(modelToEdit?.isModule || false);
    
    const [selectedModules, setSelectedModules] = useState(
        modelToEdit?.modules?.map(m => ({
            id: m.moduleId,
            name: m.module?.name,
            materialCount: m.module?.materials?.length || 0
        })) || []
    );

    const [materials, setMaterials] = useState(
        modelToEdit?.materials?.map(m => ({
            productId: m.productId,
            name: m.product?.name,
            quantity: m.quantity,
            unit: m.unit || 'Pza'
        })) || []
    );

    const [searchQuery, setSearchQuery] = useState('');
    const [moduleSearch, setModuleSearch] = useState('');

    useEffect(() => {
        if (modelToEdit) {
            setName(modelToEdit.name || '');
            setDescription(modelToEdit.description || '');
            setIsModule(modelToEdit.isModule || false);
            setSelectedModules(modelToEdit.modules?.map(m => ({
                id: m.moduleId,
                name: m.module?.name,
                materialCount: m.module?.materials?.length || 0
            })) || []);
            setMaterials(modelToEdit.materials?.map(m => ({
                productId: m.productId,
                name: m.product?.name,
                quantity: m.quantity,
                unit: m.unit || 'Pza'
            })) || []);
        } else {
            setName('');
            setDescription('');
            setIsModule(false);
            setSelectedModules([]);
            setMaterials([]);
        }
    }, [modelToEdit, isOpen]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const filteredInventory = useMemo(() => {
        if (!searchQuery) return [];
        return (inventory || []).filter(p => 
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !materials.some(m => m.productId === p.id)
        ).slice(0, 5);
    }, [inventory, searchQuery, materials]);

    const availableModules = useMemo(() => {
        return (allModels || []).filter(m => 
            m.isModule && 
            m.id !== modelToEdit?.id && 
            !selectedModules.some(sm => sm.id === m.id) &&
            (moduleSearch === '' || m.name.toLowerCase().includes(moduleSearch.toLowerCase()))
        );
    }, [allModels, selectedModules, modelToEdit, moduleSearch]);

    const addMaterial = (product) => {
        setMaterials([...materials, { productId: product.id, name: product.name, quantity: 1, unit: 'Pza' }]);
        setSearchQuery('');
    };

    const addModule = (mod) => {
        setSelectedModules([...selectedModules, { id: mod.id, name: mod.name, materialCount: mod.materials?.length || 0 }]);
    };

    const updateMaterialField = (productId, field, value) => {
        setMaterials(materials.map(m => m.productId === productId ? { ...m, [field]: field === 'quantity' ? (parseFloat(value) || 0) : value } : m));
    };

    const removeMaterial = (productId) => setMaterials(materials.filter(m => m.productId !== productId));
    const removeModule = (moduleId) => setSelectedModules(selectedModules.filter(m => m.id !== moduleId));

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setSelectedModules((items) => {
                const oldIndex = items.findIndex(i => i.id === active.id);
                const newIndex = items.findIndex(i => i.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ name, description, isModule, materials, moduleIds: selectedModules.map(m => m.id) });
        onClose();
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-5xl flex flex-col h-[95vh] sm:h-[90vh] overflow-hidden animate-in zoom-in duration-300">
                <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/20">
                    <h2 className="text-xl font-black text-dark dark:text-white uppercase tracking-tight">
                        {modelToEdit ? 'Editar Ingeniería' : 'Nuevo Diseño'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-2">&times;</button>
                </div>

                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                    {/* LIBRERÍA - Solo para Modelos */}
                    {!isModule && (
                        <div className="hidden md:flex w-64 border-r dark:border-gray-700 flex-col bg-gray-50/50 dark:bg-gray-900/10 overflow-hidden shrink-0">
                            <div className="p-4 border-b dark:border-gray-700">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 italic">Módulos Reutilizables</p>
                                <input type="text" placeholder="Filtrar módulos..." className="w-full p-2.5 bg-white dark:bg-gray-800 rounded-xl text-xs font-bold outline-none border border-gray-100 dark:border-gray-700 focus:ring-2 focus:ring-primary/20 transition-all" value={moduleSearch} onChange={e => setModuleSearch(e.target.value)} />
                            </div>
                            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                                {availableModules.map(mod => (
                                    <div key={mod.id} onClick={() => addModule(mod)} className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm cursor-pointer hover:border-primary transition-all group">
                                        <p className="text-[10px] font-black uppercase truncate leading-none">{mod.name}</p>
                                        <p className="text-[8px] font-bold text-gray-400 uppercase mt-1 italic">{mod.materials?.length || 0} piezas</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* MESA DE TRABAJO */}
                    <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-gray-800">
                        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-8 custom-scrollbar">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block italic">Nombre del Diseño *</label>
                                        <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full input-style font-black text-lg uppercase" placeholder="VENDING 300 MAX" />
                                    </div>
                                    <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={isModule} onChange={e => setIsModule(e.target.checked)} className="sr-only peer" />
                                            <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                                        </label>
                                        <p className="text-[10px] font-black uppercase text-gray-500 italic">Es un Módulo Reutilizable</p>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block italic">Especificaciones Técnicas</label>
                                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows="4" className="w-full input-style text-xs font-medium resize-none h-full" placeholder="Detalles de ensamblaje o notas importantes..." />
                                </div>
                            </div>

                            {/* Ensamblaje Modular - Solo para Modelos Vending */}
                            {!isModule && (
                                <div className="space-y-4">
                                    <h4 className="text-[11px] font-black text-primary uppercase tracking-widest flex items-center gap-2 italic"><FaPuzzlePiece /> Ensamblaje Modular (Drag & Drop)</h4>
                                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                        <div className="space-y-2">
                                            <SortableContext items={selectedModules.map(m => m.id)} strategy={verticalListSortingStrategy}>
                                                {selectedModules.map((mod) => (
                                                    <SortableItem key={mod.id} id={mod.id} onRemove={() => removeModule(mod.id)}>
                                                        <p className="text-[10px] font-black uppercase leading-none">{mod.name}</p>
                                                        <p className="text-[8px] text-gray-400 font-bold uppercase mt-1">Módulo Integrado • {mod.materialCount} componentes</p>
                                                    </SortableItem>
                                                ))}
                                            </SortableContext>
                                        </div>
                                    </DndContext>
                                </div>
                            )}

                            <div className="space-y-4">
                                <h4 className="text-[11px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2 italic"><FaBoxOpen /> Lista de Materiales</h4>
                                <div className="relative">
                                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                                    <input type="text" placeholder="Añadir componente del inventario..." className="w-full input-style pl-11" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                                    {filteredInventory.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-top-2">
                                            {filteredInventory.map(p => (
                                                <button key={p.id} type="button" onClick={() => addMaterial(p)} className="w-full text-left px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex justify-between items-center transition-colors"><span className="text-[10px] font-bold uppercase">{p.name}</span><FaPlus size={8} className="text-primary"/></button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {materials.map((m) => (
                                        <div key={m.productId} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900/40 p-3 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                                            <p className="flex-1 text-[10px] font-black uppercase truncate leading-none">{m.name}</p>
                                            <div className="flex items-center gap-1 bg-white dark:bg-gray-800 rounded-lg p-1 border border-black/5">
                                                <input type="number" step="any" value={m.quantity} onChange={(e) => updateMaterialField(m.productId, 'quantity', e.target.value)} className="w-10 bg-transparent border-none py-0.5 text-[10px] font-black text-center focus:ring-0" />
                                                <select value={m.unit} onChange={(e) => updateMaterialField(m.productId, 'unit', e.target.value)} className="bg-transparent border-none py-0.5 text-[9px] font-bold text-gray-400 outline-none focus:ring-0"><option value="Pza">Pza</option><option value="Mts">Mts</option><option value="Lts">Lts</option><option value="Kg">Kg</option></select>
                                            </div>
                                            <button type="button" onClick={() => removeMaterial(m.productId)} className="p-1.5 text-gray-300 hover:text-red-500 transition-all"><FaTrash size={10}/></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t dark:border-gray-700 flex gap-3 bg-gray-50/50 dark:bg-gray-900/20">
                            <button type="button" onClick={onClose} className="flex-1 py-4 bg-white dark:bg-gray-800 text-gray-500 font-black rounded-2xl uppercase tracking-widest text-[10px] border border-gray-200 dark:border-gray-700">Cancelar</button>
                            <button type="submit" className="flex-[2] py-4 bg-primary text-white font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 active:scale-95 transition-all">
                                <FaSave size={16} /> {modelToEdit ? 'Guardar Cambios' : 'Registrar Diseño'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>,
        document.body
    );
};

const ModelDetailsModal = ({ isOpen, onClose, model }) => {
    const [openModules, setOpenModules] = useState({});

    const toggleModule = (id) => {
        setOpenModules(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const generatePDF = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        
        // Estilo de Cabecera
        doc.setFillColor(31, 41, 55); 
        doc.rect(0, 0, pageWidth, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text("FICHA TÉCNICA DARMAX", 20, 20);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`DISEÑO: ${model.name.toUpperCase()}`, 20, 30);
        doc.text(`TIPO: ${model.isModule ? 'MÓDULO' : 'MODELO VENDING'}`, 20, 35);
        doc.text(`FECHA: ${new Date().toLocaleDateString()}`, pageWidth - 60, 30);

        let finalY = 50;

        // Desglose por módulos
        if (!model.isModule && model.modules && model.modules.length > 0) {
            model.modules.forEach((modJoin, idx) => {
                doc.setTextColor(37, 99, 235);
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text(`MÓDULO: ${modJoin.module.name.toUpperCase()}`, 20, finalY);
                
                const modTableData = modJoin.module.materials.map(m => [
                    m.product?.name || 'S/N',
                    m.product?.category || 'General',
                    m.quantity,
                    m.unit
                ]);

                autoTable(doc, {
                    startY: finalY + 5,
                    head: [['Componente', 'Categoría', 'Cant.', 'Unidad']],
                    body: modTableData,
                    theme: 'striped',
                    headStyles: { fillColor: [59, 130, 246] },
                    styles: { fontSize: 9 }
                });
                
                finalY = doc.lastAutoTable.finalY + 15;
                if (finalY > 260) { doc.addPage(); finalY = 20; }
            });
        }

        // Componentes directos
        if (model.materials && model.materials.length > 0) {
            doc.setTextColor(16, 185, 129);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text(model.isModule ? "LISTA DE MATERIALES" : "COMPONENTES ADICIONALES", 20, finalY);

            const directData = model.materials.map(m => [
                m.product?.name || 'S/N',
                m.product?.category || 'General',
                m.quantity,
                m.unit
            ]);

            autoTable(doc, {
                startY: finalY + 5,
                head: [['Material', 'Categoría', 'Cant.', 'Unidad']],
                body: directData,
                theme: 'striped',
                headStyles: { fillColor: [16, 185, 129] },
                styles: { fontSize: 9 }
            });
            finalY = doc.lastAutoTable.finalY + 15;
            if (finalY > 260) { doc.addPage(); finalY = 20; }
        }

        doc.save(`FICHA_TECNICA_${model.name.replace(/\s+/g, '_')}.pdf`);
    };

    if (!isOpen || !model) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-4xl flex flex-col h-[95vh] sm:h-[90vh] overflow-hidden animate-in zoom-in duration-300 border border-gray-100 dark:border-gray-700">
                <div className="p-6 border-b dark:border-gray-700 flex justify-between items-start bg-gray-50/50 dark:bg-gray-900/20 shrink-0">
                    <div>
                        <div className="flex flex-wrap items-center gap-3">
                            <h2 className="text-2xl sm:text-3xl font-black text-dark dark:text-white uppercase tracking-tight leading-none">{model.name}</h2>
                            <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${model.isModule ? 'bg-indigo-100 text-indigo-600' : 'bg-blue-100 text-blue-600'}`}>
                                {model.isModule ? 'Módulo' : 'Paquete'}
                            </span>
                        </div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-2 italic">Análisis de Estructura de Materiales</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={generatePDF} className="bg-primary text-white p-3 rounded-2xl shadow-lg shadow-primary/20 hover:scale-110 transition-all flex items-center gap-2 text-[10px] font-black uppercase"><FaDownload /> Descargar PDF</button>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors p-2 text-2xl font-light">&times;</button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-10 custom-scrollbar">
                    {/* DESGLOSE POR MÓDULOS CON ACORDEÓN */}
                    {!model.isModule && model.modules?.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2 italic">
                                <FaPuzzlePiece /> Estructura Modular
                            </h3>
                            <div className="space-y-3">
                                {model.modules.map((modJoin, i) => (
                                    <div key={i} className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
                                        <button 
                                            onClick={() => toggleModule(modJoin.moduleId)}
                                            className="w-full p-4 flex justify-between items-center hover:bg-white dark:hover:bg-gray-800 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center text-indigo-500 shadow-sm border dark:border-gray-700"><FaCube size={14}/></div>
                                                <span className="font-black text-dark dark:text-white uppercase text-xs">{modJoin.module.name}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[9px] font-bold text-gray-400 uppercase">{modJoin.module.materials?.length || 0} materiales</span>
                                                {openModules[modJoin.moduleId] ? <FaChevronUp size={10} className="text-gray-300"/> : <FaChevronDown size={10} className="text-gray-300"/>}
                                            </div>
                                        </button>
                                        {openModules[modJoin.moduleId] && (
                                            <div className="p-4 pt-0 grid grid-cols-1 sm:grid-cols-2 gap-2 animate-in slide-in-from-top-2">
                                                {modJoin.module.materials?.map((m, j) => (
                                                    <div key={j} className="flex justify-between items-center bg-white dark:bg-gray-800 p-3 rounded-xl border border-black/5 shadow-sm">
                                                        <span className="text-[9px] font-bold text-gray-500 uppercase truncate pr-2">{m.product?.name}</span>
                                                        <span className="text-[10px] font-black text-indigo-600 whitespace-nowrap">{m.quantity} {m.unit}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* COMPONENTES DIRECTOS */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2 italic">
                            <FaBoxOpen /> {model.isModule ? 'Lista de Materiales' : 'Componentes Adicionales'}
                        </h3>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {model.materials?.map((m, i) => (
                                <div key={i} className="flex justify-between items-center bg-emerald-50/50 dark:bg-emerald-900/10 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800/30">
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-black text-emerald-800 dark:text-emerald-300 uppercase truncate">{m.product?.name || m.name}</p>
                                        <p className="text-[8px] font-bold text-emerald-600/50 uppercase">{m.product?.category || 'General'}</p>
                                    </div>
                                    <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">{m.quantity} <small className="text-[8px]">{m.unit}</small></span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-gray-50 dark:bg-gray-900/40 border-t dark:border-gray-700 flex justify-center">
                    <button onClick={onClose} className="w-full sm:w-64 py-4 bg-gray-800 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] hover:bg-black transition-all shadow-lg active:scale-95">Cerrar Visualizador</button>
                </div>
            </div>
        </div>,
        document.body
    );
};

// ====================================================================
// Componente Principal
// ====================================================================

const Instalacion = () => {
    const { user } = useAuth();
    const { state, addInstallationModel, updateInstallationModel, deleteInstallationModel } = useGestion();
    const { installationModels, inventory, loading: contextLoading } = state;
    
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedModel, setSelectedModel] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('MODELS'); 

    const isAdmin = user?.roles?.some(r => r.name === 'ADMIN') || user?.role === 'ADMIN';

    const handleSaveModel = async (data) => {
        try {
            if (selectedModel) {
                await updateInstallationModel(selectedModel.id, data);
                toast.success('Diseño actualizado');
            } else {
                await addInstallationModel(data);
                toast.success('Nuevo diseño registrado');
            }
            setSelectedModel(null);
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id, name) => {
        const result = await Swal.fire({
            title: '¿Eliminar diseño?',
            text: `Se borrará "${name}". Si es un módulo, se desvinculará de los modelos que lo usen.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Sí, eliminar',
            reverseButtons: true
        });

        if (result.isConfirmed) {
            try {
                await deleteInstallationModel(id);
                toast.success('Eliminado');
            } catch (error) {
                Swal.fire('Error', 'No se pudo eliminar.', 'error');
            }
        }
    };

    const filteredList = useMemo(() => {
        return (installationModels || []).filter(m => 
            (activeTab === 'MODELS' ? !m.isModule : m.isModule) &&
            m.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [installationModels, activeTab, searchTerm]);

    if (contextLoading) return (
        <div className="p-8 text-center flex flex-col items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
            <p className="text-gray-400 font-black text-[10px] uppercase tracking-[0.3em] animate-pulse">Sincronizando Ingeniería...</p>
        </div>
    );

    return (
        <div className="animate-fade-in space-y-8 pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-black text-gray-800 dark:text-white flex items-center gap-4 tracking-tighter uppercase italic">
                        <div className="bg-primary p-3 rounded-2xl shadow-lg shadow-primary/20 text-white">
                            <FaTools className="text-2xl" />
                        </div> 
                        INGENIERÍA
                    </h1>
                    <div className="text-[10px] text-gray-500 font-bold mt-2 flex items-center gap-2 uppercase tracking-widest">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div> 
                        Diseño Estructural y Lista de Materiales
                    </div>
                </div>
                {isAdmin && (
                    <button 
                        onClick={() => { setSelectedModel(null); setIsFormModalOpen(true); }}
                        className="btn-primary flex items-center justify-center gap-3 py-4 px-8 rounded-3xl shadow-2xl shadow-primary/30 font-black uppercase text-xs tracking-widest hover:scale-105 active:scale-95 transition-all w-full md:w-auto"
                    >
                        <FaPlus /> Nuevo {activeTab === 'MODELS' ? 'Modelo' : 'Módulo'}
                    </button>
                )}
            </div>

            {/* Tabs y Filtros */}
            <div className="flex flex-col lg:flex-row gap-4 items-center">
                <div className="flex bg-gray-100 dark:bg-gray-900/50 p-1 rounded-2xl w-full lg:w-fit shrink-0">
                    <button 
                        onClick={() => setActiveTab('MODELS')}
                        className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'MODELS' ? 'bg-white dark:bg-gray-800 shadow-md text-primary' : 'text-gray-400'}`}
                    >
                        <FaLayerGroup /> Modelos Vending
                    </button>
                    <button 
                        onClick={() => setActiveTab('MODULES')}
                        className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'MODULES' ? 'bg-white dark:bg-gray-800 shadow-md text-indigo-600' : 'text-gray-400'}`}
                    >
                        <FaCube /> Módulos Reutilizables
                    </button>
                </div>
                <div className="flex-1 w-full relative">
                    <FaSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                        type="text"
                        placeholder="Buscar por nombre técnico..."
                        className="w-full pl-14 pr-6 py-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Grid de Ingeniería */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredList.length > 0 ? (
                    filteredList.map(model => (
                        <div key={model.id} className="group bg-white dark:bg-gray-800 p-8 rounded-[3rem] border border-gray-50 dark:border-gray-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all relative overflow-hidden flex flex-col">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-700" />
                            
                            <div className="flex justify-between items-start mb-8 relative z-10">
                                <div className={`p-4 rounded-2xl shadow-inner transition-colors ${activeTab === 'MODELS' ? 'bg-blue-50 text-blue-500 group-hover:bg-primary group-hover:text-white' : 'bg-indigo-50 text-indigo-500 group-hover:bg-indigo-600 group-hover:text-white'}`}>
                                    {activeTab === 'MODELS' ? <FaLayerGroup size={24} /> : <FaCube size={24} />}
                                </div>
                                <div className="flex gap-2">
                                    {isAdmin && (
                                        <>
                                            <button onClick={() => { setSelectedModel(model); setIsFormModalOpen(true); }} className="p-3 bg-gray-50 dark:bg-gray-700 text-gray-400 hover:text-blue-500 rounded-xl transition-all"><FaEdit size={14}/></button>
                                            <button onClick={() => handleDelete(model.id, model.name)} className="p-3 bg-gray-50 dark:bg-gray-700 text-gray-400 hover:text-red-500 rounded-xl transition-all"><FaTrash size={14}/></button>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 relative z-10">
                                <h3 className="text-xl font-black text-gray-800 dark:text-white uppercase tracking-tight mb-3 leading-tight group-hover:text-primary transition-colors">
                                    {model.name}
                                </h3>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium line-clamp-3 leading-relaxed">
                                    {model.description || 'Sin especificaciones técnicas registradas.'}
                                </p>
                            </div>

                            <div className="mt-8 pt-8 border-t border-gray-50 dark:border-gray-700 relative z-10">
                                <div className="flex justify-between items-end">
                                    <div className="flex gap-4">
                                        {model.modules?.length > 0 && (
                                            <div>
                                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Módulos</p>
                                                <p className="text-lg font-black text-indigo-600">{model.modules.length}</p>
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Materiales</p>
                                            <p className="text-lg font-black text-gray-800 dark:text-white">{model.materials?.length || 0}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => { setSelectedModel(model); setIsViewModalOpen(true); }}
                                        className="bg-gray-800 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary transition-all shadow-lg active:scale-95"
                                    >
                                        Ficha Técnica
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-24 text-center bg-white dark:bg-gray-800 rounded-[4rem] border border-gray-100 dark:border-gray-700 shadow-inner">
                        <div className="max-w-xs mx-auto opacity-20">
                            <FaTools size={60} className="mx-auto mb-6" />
                            <p className="text-gray-500 font-black uppercase text-xs tracking-widest">No hay {activeTab === 'MODELS' ? 'modelos' : 'módulos'} de ingeniería</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            {isFormModalOpen && (
                <InstallationModelModal 
                    isOpen={isFormModalOpen}
                    onClose={() => { setIsFormModalOpen(false); setSelectedModel(null); }}
                    modelToEdit={selectedModel}
                    onSave={handleSaveModel}
                    inventory={inventory}
                    allModels={installationModels}
                />
            )}

            {isViewModalOpen && (
                <ModelDetailsModal 
                    isOpen={isViewModalOpen}
                    onClose={() => { setIsViewModalOpen(false); setSelectedModel(null); }}
                    model={selectedModel}
                />
            )}
        </div>
    );
};

export default Instalacion;
