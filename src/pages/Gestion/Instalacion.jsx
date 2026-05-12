import React, { useState, useMemo } from 'react';
import { useGestion } from './context/GestionContext';
import { useAuth } from '../../context/AuthContext';
import { 
    FaTools, FaPlus, FaTrash, FaEdit, FaEye, FaSearch, 
    FaBoxOpen, FaLayerGroup, FaTimes, FaSave, FaClipboardList,
    FaExclamationTriangle
} from 'react-icons/fa';
import Swal from 'sweetalert2';

const InstallationModelModal = ({ isOpen, onClose, modelToEdit, onSave, inventory }) => {
    const [name, setName] = useState(modelToEdit?.name || '');
    const [description, setDescription] = useState(modelToEdit?.description || '');
    const [materials, setMaterials] = useState(
        modelToEdit?.materials?.map(m => ({
            productId: m.productId,
            name: m.product?.name,
            quantity: m.quantity
        })) || []
    );
    const [searchQuery, setSearchQuery] = useState('');

    const filteredInventory = useMemo(() => {
        if (!searchQuery) return [];
        return inventory.filter(p => 
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !materials.some(m => m.productId === p.id)
        ).slice(0, 5);
    }, [inventory, searchQuery, materials]);

    const addMaterial = (product) => {
        setMaterials([...materials, { productId: product.id, name: product.name, quantity: 1 }]);
        setSearchQuery('');
    };

    const updateQuantity = (productId, qty) => {
        setMaterials(materials.map(m => 
            m.productId === productId ? { ...m, quantity: parseFloat(qty) || 0 } : m
        ));
    };

    const removeMaterial = (productId) => {
        setMaterials(materials.filter(m => m.productId !== productId));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (materials.length === 0) {
            Swal.fire('Error', 'Debes añadir al menos un material.', 'error');
            return;
        }
        onSave({ name, description, materials });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700 flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-50 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/20">
                    <div>
                        <h2 className="text-xl font-black text-gray-800 dark:text-white uppercase tracking-tight flex items-center gap-2">
                            {modelToEdit ? <FaEdit className="text-primary" /> : <FaPlus className="text-primary" />}
                            {modelToEdit ? 'Editar Modelo de Instalación' : 'Nuevo Modelo de Instalación'}
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Define la lista de materiales requerida.</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors p-2">
                        <FaTimes size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="p-8 space-y-6">
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block italic">Nombre del Modelo / Paquete *</label>
                                <input 
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-3 font-black text-lg text-gray-800 dark:text-white focus:ring-2 focus:ring-primary outline-none uppercase"
                                    placeholder="Ej: VENDING TOUCH 300"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block italic">Descripción Breve</label>
                                <textarea 
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows="2"
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary resize-none"
                                    placeholder="Detalles técnicos o notas generales..."
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-px flex-1 bg-gray-100 dark:bg-gray-700"></div>
                                <label className="text-[10px] font-black text-primary uppercase tracking-widest">Lista de Materiales (BOM)</label>
                                <div className="h-px flex-1 bg-gray-100 dark:bg-gray-700"></div>
                            </div>

                            {/* Buscador de Insumos */}
                            <div className="relative">
                                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input 
                                    type="text"
                                    placeholder="Buscar material en inventario..."
                                    className="w-full pl-11 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                {filteredInventory.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                                        {filteredInventory.map(p => (
                                            <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => addMaterial(p)}
                                                className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex justify-between items-center group transition-colors"
                                            >
                                                <div>
                                                    <p className="text-sm font-bold text-gray-800 dark:text-white leading-none">{p.name}</p>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">{p.category}</p>
                                                </div>
                                                <FaPlus className="text-gray-300 group-hover:text-primary transition-colors" size={12} />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Lista de Materiales Seleccionados */}
                            <div className="space-y-2">
                                {materials.length === 0 ? (
                                    <div className="text-center py-10 bg-gray-50/50 dark:bg-gray-900/30 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700 opacity-60">
                                        <FaBoxOpen className="mx-auto text-2xl text-gray-400 mb-2" />
                                        <p className="text-[10px] font-black uppercase text-gray-400 italic">No has añadido materiales aún</p>
                                    </div>
                                ) : (
                                    materials.map((m) => (
                                        <div key={m.productId} className="flex items-center gap-4 bg-white dark:bg-gray-900 p-3 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm animate-in slide-in-from-left-4 duration-300">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-black text-gray-800 dark:text-white truncate">{m.name}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-black text-gray-400 uppercase">Cant:</span>
                                                <input 
                                                    type="number"
                                                    min="0.1"
                                                    step="0.5"
                                                    value={m.quantity}
                                                    onChange={(e) => updateQuantity(m.productId, e.target.value)}
                                                    className="w-16 bg-gray-50 dark:bg-gray-800 border-none rounded-lg px-2 py-1.5 text-center text-xs font-black text-primary outline-none focus:ring-2 focus:ring-primary/20"
                                                />
                                                <button 
                                                    type="button"
                                                    onClick={() => removeMaterial(m.productId)}
                                                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                                >
                                                    <FaTrash size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-t border-gray-50 dark:border-gray-700 flex gap-3 bg-gray-50/50 dark:bg-gray-900/20">
                        <button type="button" onClick={onClose} className="flex-1 py-4 bg-white dark:bg-gray-800 text-gray-600 font-black rounded-2xl uppercase tracking-widest text-xs hover:bg-gray-100 border border-gray-200 dark:border-gray-700 transition-all">Cancelar</button>
                        <button type="submit" className="flex-[2] py-4 bg-primary text-white font-black rounded-2xl uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all flex items-center justify-center gap-2">
                            <FaSave /> {modelToEdit ? 'Guardar Cambios' : 'Crear Modelo'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ModelDetailsModal = ({ isOpen, onClose, model }) => {
    if (!isOpen || !model) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700 flex flex-col max-h-[85vh]">
                <div className="p-6 border-b border-gray-50 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/20">
                    <div>
                        <h2 className="text-xl font-black text-gray-800 dark:text-white uppercase tracking-tight">{model.name}</h2>
                        <p className="text-[10px] text-primary font-black uppercase tracking-widest mt-1">Lista Maestra de Materiales</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors p-2">
                        <FaTimes size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {model.description && (
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800/30">
                            <p className="text-xs text-blue-800 dark:text-blue-300 font-medium leading-relaxed italic">
                                "{model.description}"
                            </p>
                        </div>
                    )}

                    <div className="space-y-3">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <FaClipboardList className="text-primary" /> Componentes Requeridos
                        </h4>
                        <div className="divide-y divide-gray-50 dark:divide-gray-700 border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">
                            {model.materials?.map((m) => (
                                <div key={m.id} className="flex justify-between items-center p-4 bg-white dark:bg-gray-800">
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-gray-800 dark:text-white truncate">{m.product?.name}</p>
                                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-tighter mt-0.5">{m.product?.category || 'General'}</p>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-base font-black text-primary">{m.quantity}</span>
                                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Unidades</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-2xl border border-amber-100 dark:border-amber-800/30 flex items-start gap-3">
                        <FaExclamationTriangle className="text-amber-500 mt-0.5" />
                        <p className="text-[9px] text-amber-800 dark:text-amber-300 font-bold uppercase leading-tight">
                            Verifica que todo el material esté disponible en stock antes de iniciar la instalación.
                        </p>
                    </div>
                </div>

                <div className="p-6 bg-gray-50 dark:bg-gray-900/40 border-t dark:border-gray-700">
                    <button onClick={onClose} className="w-full py-4 bg-gray-800 text-white font-black rounded-2xl uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-all">
                        Entendido
                    </button>
                </div>
            </div>
        </div>
    );
};

const Instalacion = () => {
    const { user } = useAuth();
    const { state, inventory, addInstallationModel, updateInstallationModel, deleteInstallationModel, loading: contextLoading } = useGestion();
    const { installationModels } = state;
    
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedModel, setSelectedModel] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const isAdmin = user?.roles?.some(r => r.name === 'ADMIN') || user?.role === 'ADMIN';

    const handleSaveModel = async (data) => {
        try {
            if (selectedModel) {
                await updateInstallationModel(selectedModel.id, data);
                Swal.fire('¡Actualizado!', 'Modelo actualizado correctamente.', 'success');
            } else {
                await addInstallationModel(data);
                Swal.fire('¡Creado!', 'Nuevo modelo de instalación registrado.', 'success');
            }
            setSelectedModel(null);
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id, name) => {
        const result = await Swal.fire({
            title: '¿Eliminar modelo?',
            text: `Se borrará la lista de materiales para "${name}".`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Sí, eliminar',
            reverseButtons: true
        });

        if (result.isConfirmed) {
            try {
                await deleteInstallationModel(id);
                Swal.fire('Eliminado', 'Registro removido.', 'success');
            } catch (error) {
                Swal.fire('Error', 'No se pudo eliminar el modelo.', 'error');
            }
        }
    };

    const filteredModels = installationModels.filter(m => 
        m.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (contextLoading) return (
        <div className="p-8 text-center flex flex-col items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
            <p className="text-gray-500 font-medium italic">Sincronizando ingeniería...</p>
        </div>
    );

    return (
        <div className="animate-fade-in space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-black text-gray-800 dark:text-white flex items-center gap-4 tracking-tighter uppercase italic">
                        <div className="bg-primary p-3 rounded-2xl shadow-lg shadow-primary/20 text-white">
                            <FaTools className="text-2xl" />
                        </div> 
                        INSTALACIÓN
                    </h1>
                    <div className="text-xs sm:text-sm text-gray-500 font-bold mt-2 flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div> 
                        Maestro de Materiales y Modelos de Ingeniería
                    </div>
                </div>
                {isAdmin && (
                    <button 
                        onClick={() => { setSelectedModel(null); setIsFormModalOpen(true); }}
                        className="btn-primary flex items-center justify-center gap-3 py-4 px-8 rounded-3xl shadow-2xl shadow-primary/30 font-black uppercase text-xs tracking-widest hover:scale-105 active:scale-95 transition-all w-full md:w-auto"
                    >
                        <FaPlus /> Crear Nuevo Modelo
                    </button>
                )}
            </div>

            {/* Quick Stats / Filter */}
            <div className="bg-white dark:bg-gray-800 p-2 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col md:flex-row items-center gap-4">
                <div className="flex-1 w-full relative">
                    <FaSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                        type="text"
                        placeholder="Buscar modelo de vending o paquete..."
                        className="w-full pl-14 pr-6 py-4 bg-gray-50/50 dark:bg-gray-900/50 border-none rounded-[1.5rem] text-sm font-bold outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="px-6 py-4 hidden md:flex items-center gap-3 border-l dark:border-gray-700">
                    <div className="text-right">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Modelos</p>
                        <p className="text-xl font-black text-gray-800 dark:text-white leading-none mt-1">{installationModels.length}</p>
                    </div>
                    <FaLayerGroup className="text-primary text-xl" />
                </div>
            </div>

            {/* Models Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredModels.length > 0 ? (
                    filteredModels.map(model => (
                        <div key={model.id} className="bg-white dark:bg-gray-800 p-6 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl group transition-all relative overflow-hidden flex flex-col">
                            <div className="flex justify-between items-start mb-6">
                                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-2xl shadow-inner group-hover:bg-primary/10 transition-colors">
                                    <FaBoxOpen className="text-xl text-gray-400 group-hover:text-primary transition-colors" />
                                </div>
                                <div className="flex gap-2">
                                    {isAdmin ? (
                                        <>
                                            <button onClick={() => { setSelectedModel(model); setIsFormModalOpen(true); }} className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                                                <FaEdit size={14} />
                                            </button>
                                            <button onClick={() => handleDelete(model.id, model.name)} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm">
                                                <FaTrash size={14} />
                                            </button>
                                        </>
                                    ) : (
                                        <button onClick={() => { setSelectedModel(model); setIsViewModalOpen(true); }} className="btn-primary p-3 rounded-xl">
                                            <FaEye size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1">
                                <h3 className="text-xl font-black text-gray-800 dark:text-white uppercase tracking-tight mb-2 leading-tight group-hover:text-primary transition-colors">
                                    {model.name}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium line-clamp-2 h-8">
                                    {model.description || 'Sin descripción técnica registrada.'}
                                </p>
                            </div>

                            <div className="mt-6 pt-6 border-t dark:border-gray-700 flex justify-between items-center">
                                <div>
                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Componentes</p>
                                    <p className="text-lg font-black text-gray-800 dark:text-white">{model.materials?.length || 0}</p>
                                </div>
                                <button 
                                    onClick={() => { setSelectedModel(model); setIsViewModalOpen(true); }}
                                    className="text-[9px] font-black uppercase tracking-widest text-primary flex items-center gap-2 hover:translate-x-1 transition-transform"
                                >
                                    Ver Lista <FaClipboardList />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-20 text-center bg-gray-50/30 dark:bg-gray-900/30 rounded-[3rem] border-2 border-dashed border-gray-100 dark:border-gray-700">
                        <p className="text-gray-400 font-black uppercase italic text-sm">No se encontraron modelos de instalación.</p>
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
