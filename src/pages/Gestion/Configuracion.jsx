import React, { useState, useMemo } from 'react';
import { useGestion } from './context/GestionContext';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2'; // Importar SweetAlert2
import ManageFranchisesStores from './components/ManageFranchisesStores';
import ManageSaleProducts from './components/ManageSaleProducts';
import { BACKGROUND_PRESETS } from './components/GestionBackgroundSelector';
import { updateBackgroundPreference } from '../../api/apiClient';
import { triggerHaptic } from '../../utils/haptics';
import { 
    FaPlus, 
    FaEdit, 
    FaTrash, 
    FaBoxes, 
    FaTag, 
    FaRulerCombined, 
    FaMoneyBillWave, 
    FaCube, 
    FaCheck, 
    FaInfoCircle, 
    FaTimes,
    FaLayerGroup,
    FaArrowUp,
    FaArrowDown,
    FaStar,
    FaSortNumericDown
} from 'react-icons/fa';

// ====================================================================
// Main Configuration Component
// ====================================================================
const Configuracion = () => {
    const { user, hasPermission } = useAuth();

    // Verificación de permisos granular
    const isAdmin = user?.roles?.some(r => r.name?.toUpperCase() === 'ADMIN') || user?.role === 'ADMIN';
    const canAccessBaseConfig = isAdmin || hasPermission('acceso.configuracionbase') || hasPermission('canAccessConfig');
    const canAccessFondo = isAdmin || canAccessBaseConfig || hasPermission('acceso.configuracion.fondo');
    const canAccessArticulosVenta = isAdmin || canAccessBaseConfig || hasPermission('acceso.articulosventa') || hasPermission('canAccessArticulosVenta');

    const [activeTab, setActiveTab] = useState(() => {
        if (canAccessArticulosVenta) return 'saleProducts';
        return canAccessFondo ? 'appearance' : 'franchises';
    });

    const getTabClassName = (tabName) => {
        return `px-4 py-2.5 text-xs sm:text-sm font-bold rounded-2xl transition-colors duration-150 cursor-pointer select-none ${
            activeTab === tabName
                ? 'bg-primary text-white shadow-xs'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
        }`;
    };

    return (
        <div className="space-y-6 pb-16">
            {/* Bento Card: Encabezado Configuración del Negocio */}
            <div className="p-5 sm:p-6 lg:p-7 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-xs border border-gray-100 dark:border-gray-700/80 mb-5 sm:mb-6">
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                    <div className="space-y-1">
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 dark:text-white">
                            Configuración del Sistema
                        </h1>
                        <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
                            {canAccessBaseConfig || canAccessArticulosVenta
                                ? 'Catálogo de artículos para venta POS, parámetros de sucursales, tipos de agua, precios y apariencia'
                                : 'Personalización de fondo de pantalla y estética Glassmorphism para tu cuenta'}
                        </p>
                    </div>
                </div>
            </div>
            
            {/* Pestañas de Navegación con permisos */}
            <div className="flex flex-wrap gap-2 mb-6">
                {canAccessArticulosVenta && (
                    <button onClick={() => setActiveTab('saleProducts')} className={getTabClassName('saleProducts')}>
                        Artículos para Venta
                    </button>
                )}
                {canAccessFondo && (
                    <button onClick={() => setActiveTab('appearance')} className={getTabClassName('appearance')}>
                        Fondo & Apariencia
                    </button>
                )}
                {canAccessBaseConfig && (
                    <>
                        <button onClick={() => setActiveTab('franchises')} className={getTabClassName('franchises')}>
                            Sucursales y Franquicias
                        </button>
                        <button onClick={() => setActiveTab('waterTypes')} className={getTabClassName('waterTypes')}>
                            Tipos de Agua
                        </button>
                        <button onClick={() => setActiveTab('servicePrices')} className={getTabClassName('servicePrices')}>
                            Precios de Servicios
                        </button>
                        <button onClick={() => setActiveTab('jugBrands')} className={getTabClassName('jugBrands')}>
                            Marcas de Garrafón
                        </button>
                    </>
                )}
            </div>

            {/* Canvas de contenido dinámico */}
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-xs border border-gray-100 dark:border-gray-700/80 p-5 sm:p-7">
                {activeTab === 'saleProducts' && canAccessArticulosVenta && <ManageSaleProducts />}
                {activeTab === 'appearance' && canAccessFondo && <ManageAppearance />}
                {activeTab === 'franchises' && canAccessBaseConfig && <ManageFranchisesStores />}
                {activeTab === 'waterTypes' && canAccessBaseConfig && <ManageWaterTypes />}
                {activeTab === 'servicePrices' && canAccessBaseConfig && <ManageServicePrices />}
                {activeTab === 'jugBrands' && canAccessBaseConfig && <ManageJugBrands />}
            </div>
        </div>
    );
};

// ====================================================================
// Componente de Gestión de Fondo y Apariencia (Guardado en BD)
// ====================================================================
const ManageAppearance = () => {
    const { user, refreshUser } = useAuth();
    const [selectedPreset, setSelectedPreset] = useState(() => {
        return user?.backgroundPreference || user?.clientPreferences?.backgroundPreference || localStorage.getItem('darmax_gestion_bg') || 'solid-light-ice';
    });
    const [selectedCategory, setSelectedCategory] = useState('Colores Sólidos');
    const [saving, setSaving] = useState(false);
    const [customColor, setCustomColor] = useState('#E2E8F0');
    const [customUrl, setCustomUrl] = useState('');

    const categories = ['Todos', 'Colores Sólidos', 'Oficinas & Plantas', 'Arquitectura', 'Agua & Naturaleza', 'Oscuro & Tech', 'Gradientes'];

    const filtered = useMemo(() => {
        if (selectedCategory === 'Todos') return BACKGROUND_PRESETS;
        return BACKGROUND_PRESETS.filter(p => p.category === selectedCategory);
    }, [selectedCategory]);

    const handleSelect = (id) => {
        triggerHaptic(10);
        setSelectedPreset(id);
        // Vista previa inmediata de golpe en la pantalla
        localStorage.setItem('darmax_gestion_bg', id);
        window.dispatchEvent(new CustomEvent('darmax_bg_change', { detail: id }));
        window.dispatchEvent(new Event('storage'));
    };

    const handleSaveToDatabase = async () => {
        triggerHaptic(15);
        setSaving(true);
        try {
            await updateBackgroundPreference(selectedPreset);
            localStorage.setItem('darmax_gestion_bg', selectedPreset);
            if (refreshUser) await refreshUser();
            await Swal.fire({
                title: '¡Fondo Guardado en tu Perfil!',
                text: 'La configuración de fondo se ha guardado exitosamente en la base de datos para tu cuenta.',
                icon: 'success',
                confirmButtonColor: '#137FEC',
                confirmButtonText: 'Excelente'
            });
        } catch (error) {
            console.error('Error guardando en BD:', error);
            Swal.fire({
                title: 'Guardado Localmente',
                text: 'El fondo está activo en tu dispositivo.',
                icon: 'info',
                confirmButtonColor: '#137FEC'
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Cabecera de Apariencia con botón Guardar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-700/80">
                <div className="space-y-1">
                    <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-emerald-500">wallpaper</span>
                        Fondo de Pantalla & Glassmorphism
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Selecciona tu estilo preferido y guárdalo en la base de datos para que persista en todas tus sesiones.
                    </p>
                </div>

                {/* Botón Guardar en BD */}
                <button
                    type="button"
                    onClick={handleSaveToDatabase}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary text-white font-bold text-xs hover:bg-primary-dark transition-colors duration-150 shadow-md shadow-primary/20 cursor-pointer disabled:opacity-50"
                >
                    <span className="material-symbols-outlined text-base">
                        {saving ? 'hourglass_top' : 'save'}
                    </span>
                    {saving ? 'Guardando en BD...' : 'Guardar en mi Cuenta'}
                </button>
            </div>

            {/* Categorías de Filtro */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 [scrollbar-width:none]">
                {categories.map((cat) => (
                    <button
                        key={cat}
                        type="button"
                        onClick={() => {
                            triggerHaptic(8);
                            setSelectedCategory(cat);
                        }}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors duration-150 whitespace-nowrap cursor-pointer ${
                            selectedCategory === cat
                                ? 'bg-primary text-white shadow-xs'
                                : 'bg-gray-100 dark:bg-gray-700/70 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Galería de Tarjetas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map((preset) => {
                    const isSelected = selectedPreset === preset.id;
                    return (
                        <div
                            key={preset.id}
                            onClick={() => handleSelect(preset.id)}
                            className={`relative p-3.5 rounded-2xl border transition-colors duration-150 cursor-pointer flex flex-col justify-between group ${
                                isSelected
                                    ? 'bg-primary/5 dark:bg-primary/10 border-primary ring-2 ring-primary/30 shadow-md shadow-primary/10'
                                    : 'bg-white/80 dark:bg-gray-800/80 border-gray-200/80 dark:border-gray-700/80 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md'
                            }`}
                        >
                            {/* Previsualización */}
                            <div className="relative w-full h-32 rounded-xl overflow-hidden mb-3 bg-slate-100 dark:bg-slate-800 shadow-inner flex items-center justify-center">
                                {preset.type === 'color' ? (
                                    <div
                                        className="w-full h-full flex items-center justify-center p-3 relative"
                                        style={{ backgroundColor: preset.color }}
                                    >
                                        <div className="w-full h-14 rounded-xl bg-white/75 dark:bg-gray-900/80 backdrop-blur-md border border-white/50 dark:border-white/20 shadow-md flex items-center justify-between px-3">
                                            <span className="text-[11px] font-bold text-gray-800 dark:text-white">
                                                Cristal
                                            </span>
                                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-black/10 dark:bg-white/10 text-gray-700 dark:text-gray-200">
                                                {preset.color}
                                            </span>
                                        </div>
                                    </div>
                                ) : preset.type === 'photo' && preset.thumb ? (
                                    <img
                                        src={preset.thumb}
                                        alt={preset.name}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-cyan-400 via-primary to-blue-700 relative overflow-hidden flex items-center justify-center">
                                        <div className="w-20 h-20 rounded-full bg-cyan-200/30 blur-xl absolute -top-4 -left-4" />
                                        <div className="w-24 h-24 rounded-full bg-blue-300/20 blur-xl absolute -bottom-4 -right-4" />
                                        <span className="material-symbols-outlined text-white/80 text-3xl">water_drop</span>
                                    </div>
                                )}

                                {/* Badge */}
                                <span className={`absolute top-2 left-2 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full backdrop-blur-md shadow-xs ${preset.tagColor}`}>
                                    {preset.badge}
                                </span>

                                {/* Checkmark */}
                                {isSelected && (
                                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shadow-md">
                                        <span className="material-symbols-outlined text-sm font-black">check</span>
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div>
                                <div className="flex items-center justify-between gap-2 mb-1">
                                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                                        {preset.name}
                                    </span>
                                    {isSelected && (
                                        <span className="text-[10px] font-extrabold text-primary uppercase tracking-wider">
                                            Activo
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">
                                    {preset.description}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Herramientas de Personalización Libre */}
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-700/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <input
                        type="color"
                        value={customColor}
                        onChange={(e) => {
                            setCustomColor(e.target.value);
                            handleSelect(`color:${e.target.value}`);
                        }}
                        className="w-10 h-10 rounded-xl border-0 cursor-pointer p-0 bg-transparent"
                        title="Selecciona cualquier color libre"
                    />
                    <div>
                        <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block">
                            Paleta de Color Libre ({customColor})
                        </span>
                        <span className="text-[11px] text-gray-500 dark:text-gray-400">
                            Haz clic para probar cualquier tonalidad personalizada
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <input
                        type="url"
                        value={customUrl}
                        onChange={(e) => setCustomUrl(e.target.value)}
                        placeholder="Pega la URL de tu foto (https://...)"
                        className="px-3.5 py-2 text-xs rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                        type="button"
                        onClick={() => {
                            if (!customUrl.trim()) return;
                            handleSelect(`custom:${customUrl.trim()}`);
                        }}
                        className="px-3.5 py-2 text-xs font-bold rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900 hover:opacity-90 transition-opacity cursor-pointer shrink-0"
                    >
                        Probar URL
                    </button>
                </div>
            </div>
        </div>
    );
};

// ====================================================================
// Water Type Management
// ====================================================================
const ManageWaterTypes = () => {
    const { state, addWaterType, updateWaterType, deleteWaterType } = useGestion();
    const { waterTypes } = state;
    const [isModalOpen, setModalOpen] = useState(false);
    const [itemToEdit, setItemToEdit] = useState(null);

    const handleSave = (data) => {
        if (itemToEdit) {
            updateWaterType(itemToEdit.id, data);
        } else {
            addWaterType(data);
        }
        setModalOpen(false);
        setItemToEdit(null);
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: '¡No podrás revertir esto!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            deleteWaterType(id);
        }
    };

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <h2 className="text-xl font-bold">Gestionar Tipos de Agua</h2>
                <button onClick={() => { setItemToEdit(null); setModalOpen(true); }} className="btn-primary">
                    Agregar Tipo de Agua
                </button>
            </div>
            {isModalOpen && <WaterTypeModal itemToEdit={itemToEdit} onSave={handleSave} onClose={() => setModalOpen(false)} />}
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead>
                        <tr>
                            <th className="th-style">Nombre</th>
                            <th className="th-style text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {waterTypes.map(wt => (
                            <tr key={wt.id}>
                                <td className="td-style">{wt.name}</td>
                                <td className="td-style text-right">
                                    <div className="flex flex-col gap-2 justify-end sm:flex-row">
                                        <button onClick={() => { setItemToEdit(wt); setModalOpen(true); }} className="btn-secondary">Editar</button>
                                        <button onClick={() => handleDelete(wt.id)} className="btn-danger">Eliminar</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const WaterTypeModal = ({ itemToEdit, onSave, onClose }) => {
    const [name, setName] = useState(itemToEdit?.name || '');
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
                <h3 className="text-lg font-bold mb-4">{itemToEdit ? 'Editar' : 'Agregar'} Tipo de Agua</h3>
                <form onSubmit={(e) => { e.preventDefault(); onSave({ name }); }}>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-style w-full mb-4" placeholder="Nombre (ej. Alcalina)" required />
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
                        <button type="submit" className="btn-primary">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// ====================================================================
// Service Price Management
// ====================================================================
const ManageServicePrices = () => {
    const { state, addServicePrice, updateServicePrice, deleteServicePrice } = useGestion();
    const { servicePrices, waterTypes, jugBrands } = state;
    const [isModalOpen, setModalOpen] = useState(false);
    const [itemToEdit, setItemToEdit] = useState(null);

    const handleSave = (data) => {
        if (itemToEdit) {
            updateServicePrice(itemToEdit.id, data);
        } else {
            addServicePrice(data);
        }
        setModalOpen(false);
        setItemToEdit(null);
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: '¡No podrás revertir esto!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            deleteServicePrice(id);
        }
    };
    
    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <h2 className="text-xl font-bold">Gestionar Precios de Servicios</h2>
                <button onClick={() => { setItemToEdit(null); setModalOpen(true); }} className="btn-primary">
                    Agregar Precio
                </button>
            </div>
            {isModalOpen && <ServicePriceModal itemToEdit={itemToEdit} waterTypes={waterTypes} jugBrands={jugBrands} onSave={handleSave} onClose={() => setModalOpen(false)} />}
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead>
                        <tr>
                            <th className="th-style">Servicio</th>
                            <th className="th-style">Método</th>
                            <th className="th-style">Tipo de Agua</th>
                            <th className="th-style">Marcas Aplicables</th>
                            <th className="th-style">Precio</th>
                            <th className="th-style text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {servicePrices.map(sp => (
                            <tr key={sp.id}>
                                <td className="td-style">{sp.name}</td>
                                <td className="td-style">{sp.method}</td>
                                <td className="td-style">{sp.waterType?.name || 'N/A'}</td>
                                <td className="td-style">
                                    {sp.jugBrands && sp.jugBrands.length > 0 
                                        ? sp.jugBrands.map(jb => jb.name).join(', ') 
                                        : 'Todas'}
                                </td>
                                <td className="td-style">${sp.price.toFixed(2)}</td>
                                <td className="td-style text-right">
                                    <div className="flex flex-col gap-2 justify-end sm:flex-row">
                                        <button onClick={() => { setItemToEdit(sp); setModalOpen(true); }} className="btn-secondary">Editar</button>
                                        <button onClick={() => handleDelete(sp.id)} className="btn-danger">Eliminar</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const ServicePriceModal = ({ itemToEdit, waterTypes, jugBrands, onSave, onClose }) => {
    const [name, setName] = useState(itemToEdit?.name || 'Recarga');
    const [method, setMethod] = useState(itemToEdit?.method || 'Mostrador');
    const [price, setPrice] = useState(itemToEdit?.price || '');
    const [waterTypeId, setWaterTypeId] = useState(itemToEdit?.waterTypeId || '');
    const [jugBrandIds, setJugBrandIds] = useState(itemToEdit?.jugBrands?.map(jb => jb.id) || []);

    const handleJugBrandChange = (brandId) => {
        setJugBrandIds(prevIds => 
            prevIds.includes(brandId)
                ? prevIds.filter(id => id !== brandId)
                : [...prevIds, brandId]
        );
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ 
            name,
            method,
            price: parseFloat(price),
            waterTypeId: waterTypeId || null,
            jugBrandIds,
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-lg">
                <h3 className="text-lg font-bold mb-4">{itemToEdit ? 'Editar' : 'Agregar'} Precio de Servicio</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="label-style">Nombre del Servicio</label>
                            <input name="name" type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-style w-full" required />
                        </div>
                        <div>
                            <label className="label-style">Método</label>
                            <select name="method" value={method} onChange={(e) => setMethod(e.target.value)} className="input-style w-full">
                                <option value="Mostrador">Mostrador</option>
                                <option value="Domicilio">Domicilio</option>
                                <option value="General">General (ej. Recolección)</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <div>
                            <label className="label-style">Tipo de Agua (opcional)</label>
                            <select name="waterTypeId" value={waterTypeId} onChange={(e) => setWaterTypeId(e.target.value)} className="input-style w-full">
                                <option value="">N/A (General)</option>
                                {waterTypes.map(wt => <option key={wt.id} value={wt.id}>{wt.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="label-style">Precio</label>
                            <input name="price" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="input-style w-full" required />
                        </div>
                    </div>
                    <div>
                        <label className="label-style">Marcas de Garrafón Aplicables (opcional)</label>
                        <p className="text-xs text-gray-500 mb-2">Si no seleccionas ninguna, el precio se aplicará a todas las marcas.</p>
                        <div className="max-h-32 overflow-y-auto space-y-2 p-3 border rounded-md">
                            {jugBrands.map(jb => (
                                <label key={jb.id} className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={jugBrandIds.includes(jb.id)}
                                        onChange={() => handleJugBrandChange(jb.id)}
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <span className="text-sm">{jb.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
                        <button type="submit" className="btn-primary">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// ====================================================================
// Jug Brand Management (Gestión de Marcas con Inventario de Tapas, Linners y Orden)
// ====================================================================
const ManageJugBrands = () => {
    const { state, addJugBrand, updateJugBrand, deleteJugBrand, reorderJugBrands } = useGestion();
    const { jugBrands = [], inventory = [] } = state;
    const [isModalOpen, setModalOpen] = useState(false);
    const [itemToEdit, setItemToEdit] = useState(null);
    const [isReordering, setIsReordering] = useState(false);

    const capProducts = useMemo(() => inventory.filter(p => p.category?.toLowerCase() === 'tapas'), [inventory]);

    // Ordenar las marcas de menor a mayor según el campo 'order'
    const sortedBrands = useMemo(() => {
        return [...jugBrands].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }, [jugBrands]);

    // Métricas calculadas para resumen
    const totalCapStock = useMemo(() => {
        return jugBrands.reduce((acc, jb) => acc + (Number(jb.capStock) || 0), 0);
    }, [jugBrands]);

    const totalLinerStock = useMemo(() => {
        return jugBrands.reduce((acc, jb) => acc + (Number(jb.linerStock) || 0), 0);
    }, [jugBrands]);

    const handleMove = async (index, direction) => {
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= sortedBrands.length || isReordering) return;

        const newSorted = [...sortedBrands];
        const temp = newSorted[index];
        newSorted[index] = newSorted[targetIndex];
        newSorted[targetIndex] = temp;

        const orderedIds = newSorted.map(b => b.id);
        setIsReordering(true);
        try {
            if (reorderJugBrands) {
                await reorderJugBrands(orderedIds);
            }
        } catch (error) {
            console.error('Error al reordenar marcas de garrafón:', error);
        } finally {
            setIsReordering(false);
        }
    };

    const handleSave = async (data) => {
        try {
            if (itemToEdit) {
                await updateJugBrand(itemToEdit.id, data);
            } else {
                await addJugBrand(data);
            }
            setModalOpen(false);
            setItemToEdit(null);
        } catch (error) {
            console.error('Error al guardar marca de garrafón:', error);
            Swal.fire({
                title: 'Error',
                text: 'No se pudo guardar la información de la marca de garrafón.',
                icon: 'error',
                customClass: { container: 'z-[99999]' }
            });
        }
    };

    const handleDelete = async (id, brandName) => {
        const result = await Swal.fire({
            title: `¿Eliminar "${brandName}"?`,
            text: 'Se eliminará esta marca de garrafón y su registro de inventario de tapas.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            customClass: { container: 'z-[99999]' }
        });

        if (result.isConfirmed) {
            try {
                await deleteJugBrand(id);
                Swal.fire({
                    title: 'Eliminada',
                    text: 'La marca ha sido eliminada correctamente.',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false,
                    customClass: { container: 'z-[99999]' }
                });
            } catch (error) {
                console.error('Error al eliminar marca:', error);
                Swal.fire({
                    title: 'Error',
                    text: 'No se pudo eliminar la marca de garrafón.',
                    icon: 'error',
                    customClass: { container: 'z-[99999]' }
                });
            }
        }
    };
    
    return (
        <div className="space-y-6">
            {/* Header con botón y descripción */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-100 dark:border-gray-700/60">
                <div>
                    <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                        <span>Marcas de Garrafón & Inventario de Tapas</span>
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">
                        Controla el stock de tapas/linners y define el <strong>orden de aparición</strong> para la selección de garrafones de clientes (Paso 1). La marca #1 se mostrará como destacada.
                    </p>
                </div>
                <button 
                    onClick={() => { setItemToEdit(null); setModalOpen(true); }} 
                    className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl shadow-md shadow-primary/20 shrink-0 self-start sm:self-auto"
                >
                    <FaPlus className="text-xs" />
                    <span>Agregar Marca</span>
                </button>
            </div>

            {/* KPI Cards informativos */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Marcas Registradas</p>
                        <p className="text-2xl font-black text-blue-950 dark:text-blue-100 mt-0.5">{jugBrands.length}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-800/60 flex items-center justify-center text-blue-600 dark:text-blue-300">
                        <FaLayerGroup />
                    </div>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/40 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Tapas en Stock</p>
                        <p className="text-2xl font-black text-emerald-950 dark:text-emerald-100 mt-0.5">
                            {totalCapStock.toLocaleString()} <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">pzas ({(totalCapStock / 1000).toFixed(2)} mil)</span>
                        </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-300">
                        <FaBoxes />
                    </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/40 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Linners en Stock</p>
                        <p className="text-2xl font-black text-amber-950 dark:text-amber-100 mt-0.5">
                            {totalLinerStock.toLocaleString()} <span className="text-xs font-medium text-amber-600 dark:text-amber-400">pzas ({(totalLinerStock / 1000).toFixed(2)} mil)</span>
                        </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-300">
                        <FaCube />
                    </div>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <JugBrandModal 
                    itemToEdit={itemToEdit} 
                    capProducts={capProducts} 
                    nextOrder={sortedBrands.length + 1}
                    onSave={handleSave} 
                    onClose={() => { setModalOpen(false); setItemToEdit(null); }} 
                />
            )}

            {/* Tabla de Marcas */}
            <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-xs">
                <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700/60">
                    <thead className="bg-gray-50/80 dark:bg-gray-800/80">
                        <tr>
                            <th className="th-style py-3.5 px-4 text-left w-28">Orden (Paso 1)</th>
                            <th className="th-style py-3.5 px-4 text-left">Marca / Garrafón</th>
                            <th className="th-style py-3.5 px-4 text-left">Control de Tapas</th>
                            <th className="th-style py-3.5 px-4 text-left">Control de Linners</th>
                            <th className="th-style py-3.5 px-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60 bg-white/60 dark:bg-gray-800/40">
                        {sortedBrands.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="py-8 text-center text-gray-400 dark:text-gray-500 text-sm">
                                    No hay marcas de garrafón registradas. Haz clic en "Agregar Marca" para comenzar.
                                </td>
                            </tr>
                        ) : (
                            sortedBrands.map((jb, index) => {
                                const capStockNum = Number(jb.capStock) || 0;
                                const linerStockNum = Number(jb.linerStock) || 0;
                                const capCostNum = Number(jb.capCost) || 0;
                                const linerCostNum = Number(jb.linerCost) || 0;
                                const isFirst = index === 0;
                                const isLast = index === sortedBrands.length - 1;

                                return (
                                    <tr key={jb.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-750/30 transition-colors">
                                        {/* Columna de Orden / Posición */}
                                        <td className="td-style py-4 px-4">
                                            <div className="flex items-center gap-2">
                                                <div className="flex flex-col gap-0.5">
                                                    <button
                                                        type="button"
                                                        disabled={isFirst || isReordering}
                                                        onClick={() => handleMove(index, 'up')}
                                                        className={`p-1.5 rounded-lg transition-colors ${
                                                            isFirst 
                                                                ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed opacity-40' 
                                                                : 'text-gray-600 hover:text-primary hover:bg-primary/10 dark:text-gray-400 dark:hover:text-primary'
                                                        }`}
                                                        title="Mover hacia arriba"
                                                    >
                                                        <FaArrowUp className="text-[11px]" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={isLast || isReordering}
                                                        onClick={() => handleMove(index, 'down')}
                                                        className={`p-1.5 rounded-lg transition-colors ${
                                                            isLast 
                                                                ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed opacity-40' 
                                                                : 'text-gray-600 hover:text-primary hover:bg-primary/10 dark:text-gray-400 dark:hover:text-primary'
                                                        }`}
                                                        title="Mover hacia abajo"
                                                    >
                                                        <FaArrowDown className="text-[11px]" />
                                                    </button>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-black text-sm text-gray-900 dark:text-white">
                                                        #{index + 1}
                                                    </span>
                                                    {isFirst && (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100/70 dark:bg-amber-900/40 px-1.5 py-0.5 rounded-md mt-0.5 whitespace-nowrap">
                                                            <FaStar className="text-[8px]" /> Destacada
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Marca con imagen */}
                                        <td className="td-style py-4 px-4">
                                            <div className="flex items-center gap-3">
                                                {jb.imageUrl ? (
                                                    <img 
                                                        src={jb.imageUrl} 
                                                        alt={jb.name} 
                                                        className="w-12 h-12 rounded-xl object-contain bg-gray-50 dark:bg-gray-700 p-1 border border-gray-100 dark:border-gray-600 shrink-0" 
                                                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg shrink-0">
                                                        {jb.name?.charAt(0)?.toUpperCase() || 'G'}
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-bold text-gray-900 dark:text-white text-base">
                                                        {jb.name}
                                                    </p>
                                                    {jb.compatibleCap && (
                                                        <span className="inline-block text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                                                            Catálogo: {jb.compatibleCap.name}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Tapas */}
                                        <td className="td-style py-4 px-4">
                                            <div className="space-y-1.5">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                                                        capStockNum === 0
                                                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                                                            : capStockNum < 100
                                                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                                                    }`}>
                                                        {capStockNum.toLocaleString()} pzas
                                                    </span>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                                        ({(capStockNum / 1000).toFixed(2)} mil)
                                                    </span>
                                                    {jb.capSize && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-[11px] font-semibold">
                                                            {jb.capSize}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    Costo: <span className="font-semibold text-gray-700 dark:text-gray-300">${capCostNum.toFixed(3)}/pza</span>
                                                    <span className="text-gray-400 dark:text-gray-500 ml-1.5">(${(capCostNum * 1000).toFixed(2)}/mil)</span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Linners */}
                                        <td className="td-style py-4 px-4">
                                            <div className="space-y-1.5">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                                                        linerStockNum === 0
                                                            ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                                                            : linerStockNum < 100
                                                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                                    }`}>
                                                        {linerStockNum.toLocaleString()} pzas
                                                    </span>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                                        ({(linerStockNum / 1000).toFixed(2)} mil)
                                                    </span>
                                                    {jb.linerSize && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-[11px] font-semibold">
                                                            {jb.linerSize}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    Costo: <span className="font-semibold text-gray-700 dark:text-gray-300">${linerCostNum.toFixed(3)}/pza</span>
                                                    <span className="text-gray-400 dark:text-gray-500 ml-1.5">(${(linerCostNum * 1000).toFixed(2)}/mil)</span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Acciones */}
                                        <td className="td-style py-4 px-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => { setItemToEdit(jb); setModalOpen(true); }} 
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-colors"
                                                >
                                                    <FaEdit className="text-[11px]" />
                                                    <span>Editar</span>
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(jb.id, jb.name)} 
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 transition-colors"
                                                >
                                                    <FaTrash className="text-[11px]" />
                                                    <span>Eliminar</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// ====================================================================
// JugBrandModal (Modal de Alta y Edición con Calculadora de Millares y Piezas)
// ====================================================================
const JugBrandModal = ({ itemToEdit, capProducts, nextOrder = 1, onSave, onClose }) => {
    // 1. Datos generales
    const [name, setName] = useState(itemToEdit?.name || '');
    const [imageUrl, setImageUrl] = useState(itemToEdit?.imageUrl || '');
    const [orderInput, setOrderInput] = useState(() => {
        if (!itemToEdit) return String(nextOrder);
        return String(itemToEdit.order ?? nextOrder);
    });
    const [compatibleCapId, setCompatibleCapId] = useState(itemToEdit?.compatibleCapId || '');

    // 2. Control de Tapas
    // Modo de ingreso: 'PIECES' (ej. 20, 2500) o 'THOUSANDS' (ej. 2, 2.5)
    const [capStockMode, setCapStockMode] = useState('PIECES');
    const [capStockInput, setCapStockInput] = useState(() => {
        if (!itemToEdit) return '0';
        return String(itemToEdit.capStock ?? 0);
    });
    const [capSize, setCapSize] = useState(itemToEdit?.capSize || '56 mm');
    // Modo de costo: 'PIECE' (ej. 0.35) o 'THOUSAND' (ej. 350)
    const [capCostMode, setCapCostMode] = useState('PIECE');
    const [capCostInput, setCapCostInput] = useState(() => {
        if (!itemToEdit) return '0';
        return String(itemToEdit.capCost ?? 0);
    });

    // 3. Control de Linners
    const [linerStockMode, setLinerStockMode] = useState('PIECES');
    const [linerStockInput, setLinerStockInput] = useState(() => {
        if (!itemToEdit) return '0';
        return String(itemToEdit.linerStock ?? 0);
    });
    const [linerSize, setLinerSize] = useState(itemToEdit?.linerSize || '56 mm');
    const [linerCostMode, setLinerCostMode] = useState('PIECE');
    const [linerCostInput, setLinerCostInput] = useState(() => {
        if (!itemToEdit) return '0';
        return String(itemToEdit.linerCost ?? 0);
    });

    // Cálculos normalizados para Tapas
    const calculatedCapStock = useMemo(() => {
        const val = parseFloat(capStockInput) || 0;
        return capStockMode === 'THOUSANDS' ? Math.round(val * 1000) : Math.round(val);
    }, [capStockInput, capStockMode]);

    const calculatedCapUnitCost = useMemo(() => {
        const val = parseFloat(capCostInput) || 0;
        return capCostMode === 'THOUSAND' ? (val / 1000) : val;
    }, [capCostInput, capCostMode]);

    // Cálculos normalizados para Linners
    const calculatedLinerStock = useMemo(() => {
        const val = parseFloat(linerStockInput) || 0;
        return linerStockMode === 'THOUSANDS' ? Math.round(val * 1000) : Math.round(val);
    }, [linerStockInput, linerStockMode]);

    const calculatedLinerUnitCost = useMemo(() => {
        const val = parseFloat(linerCostInput) || 0;
        return linerCostMode === 'THOUSAND' ? (val / 1000) : val;
    }, [linerCostInput, linerCostMode]);

    // Cambio dinámico de modo de stock de tapas (conservando el valor calculado)
    const handleCapStockModeChange = (newMode) => {
        if (newMode === capStockMode) return;
        const currentStock = calculatedCapStock;
        if (newMode === 'THOUSANDS') {
            setCapStockInput(String(Number((currentStock / 1000).toFixed(4))));
        } else {
            setCapStockInput(String(currentStock));
        }
        setCapStockMode(newMode);
    };

    // Cambio dinámico de modo de costo de tapas
    const handleCapCostModeChange = (newMode) => {
        if (newMode === capCostMode) return;
        const currentCost = calculatedCapUnitCost;
        if (newMode === 'THOUSAND') {
            setCapCostInput(String(Number((currentCost * 1000).toFixed(2))));
        } else {
            setCapCostInput(String(Number(currentCost.toFixed(4))));
        }
        setCapCostMode(newMode);
    };

    // Cambio dinámico de modo de stock de linners
    const handleLinerStockModeChange = (newMode) => {
        if (newMode === linerStockMode) return;
        const currentStock = calculatedLinerStock;
        if (newMode === 'THOUSANDS') {
            setLinerStockInput(String(Number((currentStock / 1000).toFixed(4))));
        } else {
            setLinerStockInput(String(currentStock));
        }
        setLinerStockMode(newMode);
    };

    // Cambio dinámico de modo de costo de linners
    const handleLinerCostModeChange = (newMode) => {
        if (newMode === linerCostMode) return;
        const currentCost = calculatedLinerUnitCost;
        if (newMode === 'THOUSAND') {
            setLinerCostInput(String(Number((currentCost * 1000).toFixed(2))));
        } else {
            setLinerCostInput(String(Number(currentCost.toFixed(4))));
        }
        setLinerCostMode(newMode);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) {
            Swal.fire({
                title: 'Nombre requerido',
                text: 'Por favor ingresa un nombre para la marca de garrafón.',
                icon: 'warning',
                customClass: { container: 'z-[99999]' }
            });
            return;
        }

        const parsedOrder = parseInt(orderInput, 10);

        onSave({
            name: name.trim(),
            imageUrl: imageUrl.trim() || null,
            order: isNaN(parsedOrder) ? nextOrder : Math.max(1, parsedOrder),
            compatibleCapId: compatibleCapId || null,
            capStock: Math.max(0, calculatedCapStock),
            capCost: Math.max(0, calculatedCapUnitCost),
            capSize: capSize.trim() || null,
            linerStock: Math.max(0, calculatedLinerStock),
            linerCost: Math.max(0, calculatedLinerUnitCost),
            linerSize: linerSize.trim() || null
        });
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[9999] flex justify-center items-center p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-2xl shadow-2xl border border-gray-100 dark:border-gray-700/80 overflow-hidden my-auto max-h-[92vh] flex flex-col">
                {/* Modal Header */}
                <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700/60 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50 shrink-0">
                    <div>
                        <h3 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white tracking-tight">
                            {itemToEdit ? `Editar Marca: ${itemToEdit.name}` : 'Registrar Marca de Garrafón'}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            Configura los datos del garrafón, el orden de aparición y el inventario directo de sus tapas y linners
                        </p>
                    </div>
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white flex items-center justify-center transition-colors"
                    >
                        <FaTimes className="text-sm" />
                    </button>
                </div>

                {/* Modal Body Scrollable */}
                <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1">
                    {/* SECCIÓN 1: DATOS BÁSICOS DE LA MARCA */}
                    <div className="p-4 rounded-2xl bg-gray-50/80 dark:bg-gray-750/40 border border-gray-100 dark:border-gray-700/60 space-y-4">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                            <FaTag />
                            <span>1. Información y Orden de Aparición</span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                                    Nombre de la Marca *
                                </label>
                                <input 
                                    type="text" 
                                    value={name} 
                                    onChange={(e) => setName(e.target.value)} 
                                    placeholder="Ej. Bonafont, Epura, Ciel, Santorini..." 
                                    className="input-style w-full" 
                                    required 
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center justify-between">
                                    <span>Posición (Paso 1)</span>
                                    <span className="text-[10px] text-gray-400">1 = Destacada</span>
                                </label>
                                <input 
                                    type="number" 
                                    min="1"
                                    value={orderInput} 
                                    onChange={(e) => setOrderInput(e.target.value)} 
                                    className="input-style w-full font-bold" 
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                                URL de Imagen del Garrafón
                            </label>
                            <input 
                                type="text" 
                                value={imageUrl} 
                                onChange={(e) => setImageUrl(e.target.value)} 
                                placeholder="https://ejemplo.com/garrafon.png" 
                                className="input-style w-full" 
                            />
                        </div>

                        {imageUrl && (
                            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                                <img 
                                    src={imageUrl} 
                                    alt="Vista previa" 
                                    className="w-12 h-12 object-contain rounded-lg p-1 bg-gray-50 dark:bg-gray-700" 
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    Vista previa de imagen cargada
                                </span>
                            </div>
                        )}
                    </div>

                    {/* SECCIÓN 2: CONTROL DE TAPAS */}
                    <div className="p-4 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/40 space-y-4">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                                <FaBoxes />
                                <span>2. Inventario de Tapas</span>
                            </div>
                            <span className="text-[11px] text-emerald-600 dark:text-emerald-400/80 bg-emerald-100/70 dark:bg-emerald-900/40 px-2 py-0.5 rounded-full font-medium">
                                Se descuenta 1 por venta
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Medida de la Tapa */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center justify-between">
                                    <span>Medida de Tapa</span>
                                    <span className="text-[11px] text-gray-400">Ej: 56 mm, 48 mm</span>
                                </label>
                                <input 
                                    type="text" 
                                    value={capSize} 
                                    onChange={(e) => setCapSize(e.target.value)} 
                                    placeholder="56 mm" 
                                    className="input-style w-full" 
                                />
                                <div className="flex gap-1.5 mt-1.5">
                                    {['56 mm', '48 mm', '53 mm', '38 mm'].map(size => (
                                        <button 
                                            key={size}
                                            type="button" 
                                            onClick={() => setCapSize(size)}
                                            className={`text-[10px] px-2 py-0.5 rounded-md font-semibold transition-colors ${
                                                capSize === size 
                                                    ? 'bg-emerald-600 text-white' 
                                                    : 'bg-emerald-100/60 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200'
                                            }`}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Existencia / Stock de Tapas */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                        Existencia / Stock
                                    </label>
                                    <div className="inline-flex rounded-lg p-0.5 bg-gray-200 dark:bg-gray-700 text-[11px]">
                                        <button
                                            type="button"
                                            onClick={() => handleCapStockModeChange('PIECES')}
                                            className={`px-2 py-0.5 rounded-md font-bold transition-colors duration-150 ${
                                                capStockMode === 'PIECES'
                                                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-xs'
                                                    : 'text-gray-500 dark:text-gray-400'
                                            }`}
                                        >
                                            Piezas
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleCapStockModeChange('THOUSANDS')}
                                            className={`px-2 py-0.5 rounded-md font-bold transition-colors duration-150 ${
                                                capStockMode === 'THOUSANDS'
                                                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-xs'
                                                    : 'text-gray-500 dark:text-gray-400'
                                            }`}
                                        >
                                            Millares (x1000)
                                        </button>
                                    </div>
                                </div>
                                <input 
                                    type="number" 
                                    step={capStockMode === 'THOUSANDS' ? "0.001" : "1"}
                                    min="0"
                                    value={capStockInput} 
                                    onChange={(e) => setCapStockInput(e.target.value)} 
                                    placeholder={capStockMode === 'THOUSANDS' ? "Ej. 2 para 2,000 pzas" : "Ej. 20 o 2500"} 
                                    className="input-style w-full font-bold" 
                                />
                                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold mt-1">
                                    Total: {calculatedCapStock.toLocaleString()} pzas ({(calculatedCapStock / 1000).toFixed(3)} millares)
                                </p>
                            </div>
                        </div>

                        {/* Costo de compra de Tapas */}
                        <div className="pt-2 border-t border-emerald-100/60 dark:border-emerald-900/40">
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                    Costo de Compra de Tapa
                                </label>
                                <div className="inline-flex rounded-lg p-0.5 bg-gray-200 dark:bg-gray-700 text-[11px]">
                                    <button
                                        type="button"
                                        onClick={() => handleCapCostModeChange('PIECE')}
                                        className={`px-2 py-0.5 rounded-md font-bold transition-colors duration-150 ${
                                            capCostMode === 'PIECE'
                                                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-xs'
                                                : 'text-gray-500 dark:text-gray-400'
                                        }`}
                                    >
                                        Por Pieza ($/pza)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleCapCostModeChange('THOUSAND')}
                                        className={`px-2 py-0.5 rounded-md font-bold transition-colors duration-150 ${
                                            capCostMode === 'THOUSAND'
                                                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-xs'
                                                : 'text-gray-500 dark:text-gray-400'
                                        }`}
                                    >
                                        Por Millar ($/mil)
                                    </button>
                                </div>
                            </div>
                            <input 
                                type="number" 
                                step="any"
                                min="0"
                                value={capCostInput} 
                                onChange={(e) => setCapCostInput(e.target.value)} 
                                placeholder={capCostMode === 'THOUSAND' ? "Ej. 350.00 por millar" : "Ej. 0.35 por pieza"} 
                                className="input-style w-full" 
                            />
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                                Costo unitario: <span className="font-bold text-gray-800 dark:text-gray-200">${calculatedCapUnitCost.toFixed(3)}/pza</span> | Costo por millar: <span className="font-bold text-gray-800 dark:text-gray-200">${(calculatedCapUnitCost * 1000).toFixed(2)}/mil</span>
                            </p>
                        </div>
                    </div>

                    {/* SECCIÓN 3: CONTROL DE LINNERS */}
                    <div className="p-4 rounded-2xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-800/40 space-y-4">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                                <FaCube />
                                <span>3. Inventario de Linners (Sellos / Empaques)</span>
                            </div>
                            <span className="text-[11px] text-amber-600 dark:text-amber-400/80 bg-amber-100/70 dark:bg-amber-900/40 px-2 py-0.5 rounded-full font-medium">
                                Sello interior para tapa
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Medida del Linner */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center justify-between">
                                    <span>Medida de Linner</span>
                                    <span className="text-[11px] text-gray-400">Ej: 56 mm, 48 mm</span>
                                </label>
                                <input 
                                    type="text" 
                                    value={linerSize} 
                                    onChange={(e) => setLinerSize(e.target.value)} 
                                    placeholder="56 mm" 
                                    className="input-style w-full" 
                                />
                                <div className="flex gap-1.5 mt-1.5">
                                    {['56 mm', '48 mm', '53 mm'].map(size => (
                                        <button 
                                            key={size}
                                            type="button" 
                                            onClick={() => setLinerSize(size)}
                                            className={`text-[10px] px-2 py-0.5 rounded-md font-semibold transition-colors ${
                                                linerSize === size 
                                                    ? 'bg-amber-600 text-white' 
                                                    : 'bg-amber-100/60 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 hover:bg-amber-200'
                                            }`}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Existencia / Stock de Linners */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                        Existencia / Stock
                                    </label>
                                    <div className="inline-flex rounded-lg p-0.5 bg-gray-200 dark:bg-gray-700 text-[11px]">
                                        <button
                                            type="button"
                                            onClick={() => handleLinerStockModeChange('PIECES')}
                                            className={`px-2 py-0.5 rounded-md font-bold transition-colors duration-150 ${
                                                linerStockMode === 'PIECES'
                                                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-xs'
                                                    : 'text-gray-500 dark:text-gray-400'
                                            }`}
                                        >
                                            Piezas
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleLinerStockModeChange('THOUSANDS')}
                                            className={`px-2 py-0.5 rounded-md font-bold transition-colors duration-150 ${
                                                linerStockMode === 'THOUSANDS'
                                                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-xs'
                                                    : 'text-gray-500 dark:text-gray-400'
                                            }`}
                                        >
                                            Millares (x1000)
                                        </button>
                                    </div>
                                </div>
                                <input 
                                    type="number" 
                                    step={linerStockMode === 'THOUSANDS' ? "0.001" : "1"}
                                    min="0"
                                    value={linerStockInput} 
                                    onChange={(e) => setLinerStockInput(e.target.value)} 
                                    placeholder={linerStockMode === 'THOUSANDS' ? "Ej. 1 para 1,000 pzas" : "Ej. 10 o 1000"} 
                                    className="input-style w-full font-bold" 
                                />
                                <p className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold mt-1">
                                    Total: {calculatedLinerStock.toLocaleString()} pzas ({(calculatedLinerStock / 1000).toFixed(3)} millares)
                                </p>
                            </div>
                        </div>

                        {/* Costo de compra de Linners */}
                        <div className="pt-2 border-t border-amber-100/60 dark:border-amber-900/40">
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                    Costo de Compra de Linner
                                </label>
                                <div className="inline-flex rounded-lg p-0.5 bg-gray-200 dark:bg-gray-700 text-[11px]">
                                    <button
                                        type="button"
                                        onClick={() => handleLinerCostModeChange('PIECE')}
                                        className={`px-2 py-0.5 rounded-md font-bold transition-colors duration-150 ${
                                            linerCostMode === 'PIECE'
                                                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-xs'
                                                : 'text-gray-500 dark:text-gray-400'
                                        }`}
                                    >
                                        Por Pieza ($/pza)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleLinerCostModeChange('THOUSAND')}
                                        className={`px-2 py-0.5 rounded-md font-bold transition-colors duration-150 ${
                                            linerCostMode === 'THOUSAND'
                                                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-xs'
                                                : 'text-gray-500 dark:text-gray-400'
                                        }`}
                                    >
                                        Por Millar ($/mil)
                                    </button>
                                </div>
                            </div>
                            <input 
                                type="number" 
                                step="any"
                                min="0"
                                value={linerCostInput} 
                                onChange={(e) => setLinerCostInput(e.target.value)} 
                                placeholder={linerCostMode === 'THOUSAND' ? "Ej. 120.00 por millar" : "Ej. 0.12 por pieza"} 
                                className="input-style w-full" 
                            />
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                                Costo unitario: <span className="font-bold text-gray-800 dark:text-gray-200">${calculatedLinerUnitCost.toFixed(3)}/pza</span> | Costo por millar: <span className="font-bold text-gray-800 dark:text-gray-200">${(calculatedLinerUnitCost * 1000).toFixed(2)}/mil</span>
                            </p>
                        </div>
                    </div>

                    {/* SECCIÓN 4: COMPATIBILIDAD CON INVENTARIO ANTERIOR (OPCIONAL) */}
                    <div className="pt-2">
                        <details className="text-xs group">
                            <summary className="cursor-pointer text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-semibold select-none flex items-center gap-1.5">
                                <span>Opciones avanzadas (Vinculación con inventario general)</span>
                            </summary>
                            <div className="mt-2.5 p-3 rounded-xl bg-gray-50 dark:bg-gray-750/30 border border-gray-100 dark:border-gray-700">
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                                    Tapa Compatible previa del Catálogo General
                                </label>
                                <select 
                                    value={compatibleCapId} 
                                    onChange={(e) => setCompatibleCapId(e.target.value)} 
                                    className="input-style w-full text-xs"
                                >
                                    <option value="">Ninguna (Manejo de stock directo en esta marca)</option>
                                    {capProducts.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                        </details>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700/60 shrink-0">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="btn-secondary px-5 py-2.5 rounded-2xl"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            className="btn-primary px-6 py-2.5 rounded-2xl shadow-md shadow-primary/20 inline-flex items-center gap-2"
                        >
                            <FaCheck className="text-xs" />
                            <span>Guardar Marca y Stock</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Configuracion;
