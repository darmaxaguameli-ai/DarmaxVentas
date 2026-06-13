import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useGestion } from './context/GestionContext';
import { useAuth } from '../../context/AuthContext';
import { 
    FaTools, FaPlus, FaTrash, FaEdit, FaEye, FaSearch, 
    FaBoxOpen, FaLayerGroup, FaTimes, FaSave, FaClipboardList,
    FaExclamationTriangle, FaGripVertical, FaCube, FaPuzzlePiece
} from 'react-icons/fa';
import Swal from 'sweetalert2';
import { 
    DndContext, 
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects
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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-5xl flex flex-col h-[90vh]">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-dark dark:text-white uppercase tracking-tight leading-none">
                        {modelToEdit ? 'Editar Ingeniería' : 'Nuevo Diseño Modular'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
                        <FaTimes size={24} />
                    </button>
                </div>

                <div className="flex-1 flex overflow-hidden gap-6">
                    {/* LIBRERÍA */}
                    <div className="w-64 border dark:border-gray-700 rounded-xl flex flex-col bg-gray-50 dark:bg-gray-900/20 overflow-hidden shrink-0">
                        <div className="p-3 border-b dark:border-gray-700">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 italic">Librería de Módulos</p>
                            <input type="text" placeholder="Filtrar..." className="w-full p-2 bg-white dark:bg-gray-800 rounded-lg text-xs font-bold outline-none border dark:border-gray-700" value={moduleSearch} onChange={e => setModuleSearch(e.target.value)} />
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                            {availableModules.map(mod => (
                                <div key={mod.id} onClick={() => addModule(mod)} className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm cursor-pointer hover:border-primary transition-all group">
                                    <p className="text-[10px] font-black uppercase truncate leading-none">{mod.name}</p>
                                    <p className="text-[8px] font-bold text-gray-400 uppercase mt-1 italic">{mod.materials?.length || 0} componentes</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* MESA DE TRABAJO */}
                    <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                        <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Nombre del Modelo</label>
                                        <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full input-style font-black text-lg" placeholder="VENDING 300" />
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border dark:border-gray-700">
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={isModule} onChange={e => setIsModule(e.target.checked)} className="sr-only peer" />
                                            <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                                        </label>
                                        <p className="text-[10px] font-black uppercase text-gray-500 italic">Convertir en Módulo Reutilizable</p>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Descripción</label>
                                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows="3" className="w-full input-style text-xs h-full" placeholder="Notas técnicas..." />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-[11px] font-black text-primary uppercase tracking-widest flex items-center gap-2 italic"><FaPuzzlePiece /> Ensamblaje de Módulos</h4>
                                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                    <div className="space-y-2">
                                        <SortableContext items={selectedModules.map(m => m.id)} strategy={verticalListSortingStrategy}>
                                            {selectedModules.map((mod) => (
                                                <SortableItem key={mod.id} id={mod.id} onRemove={() => removeModule(mod.id)}>
                                                    <p className="text-[10px] font-black uppercase leading-none">{mod.name}</p>
                                                    <p className="text-[8px] text-gray-400 font-bold uppercase mt-1 italic">Módulo Integrado • {mod.materialCount} componentes</p>
                                                </SortableItem>
                                            ))}
                                        </SortableContext>
                                    </div>
                                </DndContext>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-[11px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2 italic"><FaBoxOpen /> Componentes Directos</h4>
                                <div className="relative">
                                    <input type="text" placeholder="Buscar material..." className="w-full input-style pr-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                                    {filteredInventory.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden">
                                            {filteredInventory.map(p => (
                                                <button key={p.id} type="button" onClick={() => addMaterial(p)} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex justify-between items-center"><span className="text-[10px] font-bold uppercase">{p.name}</span><FaPlus size={8}/></button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {materials.map((m) => (
                                        <div key={m.productId} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900/40 p-2 rounded-xl border border-gray-100 dark:border-gray-700">
                                            <p className="flex-1 text-[9px] font-black uppercase truncate">{m.name}</p>
                                            <input type="number" step="any" value={m.quantity} onChange={(e) => updateMaterialField(m.productId, 'quantity', e.target.value)} className="w-10 bg-white dark:bg-gray-800 border-none rounded py-0.5 text-[10px] font-black text-center" />
                                            <select value={m.unit} onChange={(e) => updateMaterialField(m.productId, 'unit', e.target.value)} className="bg-transparent border-none py-0.5 text-[9px] font-bold text-gray-400 outline-none"><option value="Pza">Pza</option><option value="Mts">Mts</option><option value="Lts">Lts</option><option value="Kg">Kg</option></select>
                                            <button type="button" onClick={() => removeMaterial(m.productId)} className="text-gray-300 hover:text-red-500"><FaTrash size={10}/></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-6 border-t dark:border-gray-700 shrink-0 mt-2">
                            <button type="button" onClick={onClose} className="btn-secondary px-8">Cancelar</button>
                            <button type="submit" className="btn-primary px-10">
                                {modelToEdit ? 'Guardar Cambios' : 'Registrar Ingeniería'}
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
    const totalBOM = useMemo(() => {
        const bom = {};
        model?.materials?.forEach(m => {
            const key = m.product?.name || m.productId;
            if (!bom[key]) bom[key] = { quantity: 0, unit: m.unit, category: m.product?.category };
            bom[key].quantity += m.quantity;
        });
        model?.modules?.forEach(modJoin => {
            modJoin.module?.materials?.forEach(m => {
                const key = m.product?.name || m.productId;
                if (!bom[key]) bom[key] = { quantity: 0, unit: m.unit, category: m.product?.category };
                bom[key].quantity += m.quantity * modJoin.quantity;
            });
        });
        return Object.entries(bom).sort((a, b) => (a[1].category || '').localeCompare(b[1].category || ''));
    }, [model]);

    if (!isOpen || !model) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg flex flex-col max-h-[85vh]">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-2xl font-black text-dark dark:text-white uppercase tracking-tight leading-none">{model.name}</h2>
                        <p className="text-[10px] text-primary font-black uppercase tracking-[0.2em] mt-1 italic">Explosión de Materiales Consolidada</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
                        <FaTimes size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar pr-1">
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl overflow-hidden border dark:border-gray-700">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-gray-100 dark:bg-gray-700 text-[9px] font-black uppercase text-gray-400"><tr className="border-b dark:border-gray-600"><th className="px-4 py-2">Componente</th><th className="px-4 py-2 text-right">Cant.</th></tr></thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {totalBOM.map(([name, data], i) => (
                                    <tr key={i} className="hover:bg-white dark:hover:bg-gray-800 transition-colors">
                                        <td className="px-4 py-2"><p className="font-black text-gray-700 dark:text-white uppercase leading-none">{name}</p><p className="text-[8px] text-gray-400 font-bold uppercase italic">{data.category || 'Varios'}</p></td>
                                        <td className="px-4 py-2 text-right"><span className="font-black text-primary">{data.quantity}</span> <span className="text-[9px] text-gray-400">{data.unit}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-100 dark:border-amber-800/30 flex items-start gap-3">
                        <FaExclamationTriangle className="text-amber-500 mt-0.5 shrink-0" size={14} />
                        <p className="text-[10px] text-amber-800 dark:text-amber-400 font-bold uppercase leading-tight italic">Consolidado final incluyendo materiales de módulos integrados.</p>
                    </div>
                </div>

                <div className="mt-6">
                    <button onClick={onClose} className="w-full btn-primary py-3 uppercase tracking-widest text-xs">Cerrar Maestro</button>
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
    const [activeTab, setActiveTab] = useState('MODELS'); // 'MODELS' o 'MODULES'

    const isAdmin = user?.roles?.some(r => r.name === 'ADMIN') || user?.role === 'ADMIN';

    const handleSaveModel = async (data) => {
        try {
            if (selectedModel) {
                await updateInstallationModel(selectedModel.id, data);
                toast.success('Ingeniería actualizada');
            } else {
                await addInstallationModel(data);
                toast.success('Nuevo modelo registrado');
            }
            setSelectedModel(null);
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id, name) => {
        const result = await Swal.fire({
            title: '¿Eliminar ingeniería?',
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
                        Diseño Modular y Maestro de Materiales
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
                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Piezas BOM</p>
                                            <p className="text-lg font-black text-gray-800 dark:text-white">{model.materials?.length || 0}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => { setSelectedModel(model); setIsViewModalOpen(true); }}
                                        className="bg-gray-800 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary transition-all shadow-lg active:scale-95"
                                    >
                                        Explosión BOM
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
