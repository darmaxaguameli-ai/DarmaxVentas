import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useGestion } from '../context/GestionContext';
import { fetchProductCategories, createProductCategory, deleteProductCategory, deleteProductCategoriesBatch, deleteProductsBatch } from '../../../api/apiClient';
import Swal from 'sweetalert2';
import { toast } from 'sonner';
import { triggerHaptic } from '../../../utils/haptics';

const ManageSaleProducts = () => {
    const { state, addProduct, updateProduct, deleteProduct, fetchManagementData } = useGestion();
    const { inventory = [], loading } = state;

    const [categories, setCategories] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [selectedStatus, setSelectedStatus] = useState('ALL');
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [isCatModalOpen, setIsCatModalOpen] = useState(false);
    const [productToEdit, setProductToEdit] = useState(null);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
    const [selectedIds, setSelectedIds] = useState([]); // Selección múltiple (Ctrl + Clic)

    // Cargar categorías disponibles
    const loadCategories = async () => {
        try {
            const data = await fetchProductCategories();
            setCategories(data || []);
        } catch (error) {
            console.error('Error al cargar categorías de venta:', error);
        }
    };

    useEffect(() => {
        loadCategories();
    }, []);

    // Todos los productos de la tabla Product corresponden al catálogo de venta comercial (POS / mostrador)
    const saleProducts = useMemo(() => {
        return inventory || [];
    }, [inventory]);

    // Filtrado interactivo
    const filteredProducts = useMemo(() => {
        return saleProducts.filter(item => {
            const matchSearch = (item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                (item.category || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
            const matchStatus = selectedStatus === 'ALL' || (item.status || 'ACTIVE') === selectedStatus;
            return matchSearch && matchCategory && matchStatus;
        });
    }, [saleProducts, searchTerm, selectedCategory, selectedStatus]);

    // Métricas para Bento Grid
    const metrics = useMemo(() => {
        const total = saleProducts.length;
        const active = saleProducts.filter(p => (p.status || 'ACTIVE') === 'ACTIVE').length;
        const lowStock = saleProducts.filter(p => (p.stock || 0) <= 10).length;
        const outOfStock = saleProducts.filter(p => (p.stock || 0) === 0).length;
        return { total, active, lowStock, outOfStock };
    }, [saleProducts]);

    // Guardar (crear o editar)
    const handleSaveProduct = async (productData) => {
        try {
            triggerHaptic(15);
            const payload = {
                ...productData,
                isPublic: true, // Siempre público para venta POS
                stock: parseInt(productData.stock, 10) || 0,
                price: parseFloat(productData.price) || 0,
                waterPrice: parseFloat(productData.waterPrice) || 0
            };

            if (productToEdit?.id) {
                await updateProduct(productToEdit.id, payload);
                toast.success('Artículo de venta actualizado correctamente');
            } else {
                await addProduct(payload);
                toast.success('Nuevo artículo agregado al catálogo de venta POS');
            }
            setIsProductModalOpen(false);
            setProductToEdit(null);
            await loadCategories();
        } catch (error) {
            console.error('Error al guardar artículo de venta:', error);
        }
    };

    // Toggle rápido de estatus Activo/Inactivo
    const handleToggleStatus = async (product) => {
        try {
            triggerHaptic(10);
            const nextStatus = product.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
            await updateProduct(product.id, {
                ...product,
                status: nextStatus,
                isPublic: true
            });
            toast.success(`Artículo ${nextStatus === 'ACTIVE' ? 'activado para mostrador' : 'pausado'}`);
        } catch (error) {
            Swal.fire('Error', 'No se pudo cambiar el estado del artículo.', 'error');
        }
    };

    // Eliminar artículo
    const handleDelete = async (id, name) => {
        triggerHaptic(20);
        const result = await Swal.fire({
            title: '¿Eliminar artículo de venta?',
            html: `Se removerá <b>${name}</b> del catálogo comercial y no aparecerá en el mostrador ni en el POS.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await deleteProduct(id);
                setSelectedIds(prev => prev.filter(i => i !== id));
                toast.success('Artículo eliminado del catálogo de venta');
            } catch (error) {
                Swal.fire('Error', error.message || 'No se pudo eliminar el artículo.', 'error');
            }
        }
    };

    // Selección múltiple con Ctrl + Clic
    const toggleSelectProduct = (productId) => {
        triggerHaptic(10);
        setSelectedIds(prev => 
            prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
        );
    };

    const handleSelectAllVisible = () => {
        triggerHaptic(10);
        if (selectedIds.length === filteredProducts.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredProducts.map(p => p.id));
        }
    };

    // Eliminar de golpe todos los artículos seleccionados
    const handleDeleteBatch = async () => {
        const count = selectedIds.length;
        if (count === 0) return;

        triggerHaptic(25);
        const result = await Swal.fire({
            title: `¿Eliminar ${count} ${count === 1 ? 'artículo' : 'artículos'} de venta?`,
            html: `Se removerán <b>${count}</b> productos seleccionados de golpe del catálogo comercial y ya no aparecerán en el punto de venta.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#6B7280',
            confirmButtonText: `Sí, eliminar ${count} de golpe`,
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await deleteProductsBatch(selectedIds);
                setSelectedIds([]);
                if (fetchManagementData) await fetchManagementData();
                toast.success(`${count} artículos eliminados con éxito del catálogo de venta`);
            } catch (error) {
                console.error('Error al eliminar en lote:', error);
                try {
                    await Promise.all(selectedIds.map(id => deleteProduct(id)));
                    setSelectedIds([]);
                    if (fetchManagementData) await fetchManagementData();
                    toast.success(`${count} artículos eliminados con éxito del catálogo de venta`);
                } catch (fallbackErr) {
                    Swal.fire('Error', 'Ocurrió un error al eliminar algunos artículos.', 'error');
                }
            }
        }
    };

    return (
        <div className="space-y-6">
            {/* Header del apartado (sin icono al lado izquierdo) */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
                        Artículos para Venta en Mostrador (POS)
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Catálogo comercial visible en punto de venta, compras en línea y mostrador de atención a clientes.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    <button
                        onClick={() => setIsCatModalOpen(true)}
                        className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold bg-gray-100 hover:bg-gray-200 dark:bg-gray-700/60 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors duration-150"
                    >
                        <span className="material-symbols-outlined text-base text-primary">category</span>
                        <span>Categorías</span>
                    </button>
                    <button
                        onClick={() => {
                            setProductToEdit(null);
                            setIsProductModalOpen(true);
                        }}
                        className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold bg-primary hover:bg-primary-dark text-white shadow-md shadow-primary/25 transition-colors duration-150"
                    >
                        <span className="material-symbols-outlined text-base">add</span>
                        <span>Nuevo Artículo de Venta</span>
                    </button>
                </div>
            </div>

            {/* Bento Grid: Métricas Comerciales */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-4 rounded-3xl bg-gray-50/80 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-700/60">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">Total Artículos</span>
                        <span className="material-symbols-outlined text-primary text-lg">inventory_2</span>
                    </div>
                    <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mt-1">{metrics.total}</p>
                    <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-0.5">Catálogo de mostrador</p>
                </div>

                <div className="p-4 rounded-3xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/40">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Activos en POS</span>
                        <span className="material-symbols-outlined text-emerald-600 text-lg">check_circle</span>
                    </div>
                    <p className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-400 mt-1">{metrics.active}</p>
                    <p className="text-[11px] font-medium text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">Disponibles para venta</p>
                </div>

                <div className="p-4 rounded-3xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-800/40">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">Stock Bajo</span>
                        <span className="material-symbols-outlined text-amber-600 text-lg">warning</span>
                    </div>
                    <p className="text-2xl sm:text-3xl font-black text-amber-700 dark:text-amber-400 mt-1">{metrics.lowStock}</p>
                    <p className="text-[11px] font-medium text-amber-600/80 dark:text-amber-400/80 mt-0.5">10 o menos unidades</p>
                </div>

                <div className="p-4 rounded-3xl bg-red-50/60 dark:bg-red-950/20 border border-red-100 dark:border-red-800/40">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-red-700 dark:text-red-400">Agotados</span>
                        <span className="material-symbols-outlined text-red-600 text-lg">production_quantity_limits</span>
                    </div>
                    <p className="text-2xl sm:text-3xl font-black text-red-700 dark:text-red-400 mt-1">{metrics.outOfStock}</p>
                    <p className="text-[11px] font-medium text-red-600/80 dark:text-red-400/80 mt-0.5">Sin inventario físico</p>
                </div>
            </div>

            {/* Barra de Búsqueda, Filtros y Selector de Vista */}
            <div className="p-4 rounded-3xl bg-gray-50/80 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-700/60 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div className="relative flex-1">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg">search</span>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar artículo por nombre o categoría..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs sm:text-sm font-medium text-gray-800 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                            <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-primary/20"
                    >
                        <option value="ALL">Todas las Categorías</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))}
                    </select>

                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-primary/20"
                    >
                        <option value="ALL">Todos los Estados</option>
                        <option value="ACTIVE">Activos</option>
                        <option value="COMING_SOON">Próximamente</option>
                        <option value="INACTIVE">Inactivos</option>
                    </select>

                    <div className="hidden sm:flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-1 rounded-2xl">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded-xl transition-colors duration-150 ${viewMode === 'grid' ? 'bg-primary text-white shadow-xs' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
                            title="Vista en Cuadrícula"
                        >
                            <span className="material-symbols-outlined text-base">grid_view</span>
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-1.5 rounded-xl transition-colors duration-150 ${viewMode === 'table' ? 'bg-primary text-white shadow-xs' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
                            title="Vista en Tabla"
                        >
                            <span className="material-symbols-outlined text-base">view_list</span>
                        </button>
                    </div>

                    {selectedIds.length > 0 && (
                        <button
                            onClick={handleDeleteBatch}
                            className="px-3.5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-red-600/20 transition-colors duration-150"
                            title="Eliminar artículos seleccionados"
                        >
                            <span className="material-symbols-outlined text-base">delete_sweep</span>
                            <span>Eliminar ({selectedIds.length})</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Listado de Artículos */}
            {filteredProducts.length === 0 ? (
                <div className="text-center py-16 px-4 bg-gray-50/50 dark:bg-gray-900/20 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
                    <span className="material-symbols-outlined text-gray-300 dark:text-gray-600 text-5xl">point_of_sale</span>
                    <h3 className="text-base font-bold text-gray-700 dark:text-gray-300 mt-2">No se encontraron artículos para venta</h3>
                    <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                        {searchTerm || selectedCategory !== 'ALL' || selectedStatus !== 'ALL'
                            ? 'Intenta ajustar los filtros de búsqueda o categoría.'
                            : 'Agrega tu primer artículo para mostrador y estará visible en el POS.'}
                    </p>
                    <button
                        onClick={() => {
                            setProductToEdit(null);
                            setIsProductModalOpen(true);
                        }}
                        className="mt-4 px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-2xl shadow-md shadow-primary/25 hover:bg-primary-dark transition-colors duration-150"
                    >
                        Agregar Artículo
                    </button>
                </div>
            ) : viewMode === 'grid' ? (
                /* Vista Grid Bento */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredProducts.map(product => {
                        const isLowStock = (product.stock || 0) <= 10;
                        const isZeroStock = (product.stock || 0) === 0;
                        const isActive = (product.status || 'ACTIVE') === 'ACTIVE';
                        const isSelected = selectedIds.includes(product.id);

                        return (
                            <div
                                key={product.id}
                                onClick={(e) => {
                                    if (e.ctrlKey || e.metaKey) {
                                        e.preventDefault();
                                        toggleSelectProduct(product.id);
                                    }
                                }}
                                className={`group relative rounded-3xl p-4 border transition-colors duration-150 flex flex-col justify-between cursor-pointer select-none ${
                                    isSelected
                                        ? 'bg-primary/[0.04] dark:bg-primary/[0.09] border-primary ring-2 ring-primary/40 shadow-md'
                                        : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700/80 shadow-xs hover:border-gray-300 dark:hover:border-gray-600'
                                }`}
                            >
                                <div>
                                    {/* Cabecera de tarjeta: Imagen + Badges + Checkbox */}
                                    <div className="relative w-full h-40 bg-gray-50 dark:bg-gray-900/60 rounded-2xl overflow-hidden mb-3 border border-gray-100 dark:border-gray-700/50 flex items-center justify-center">
                                        {product.imageUrl ? (
                                            <img
                                                src={product.imageUrl}
                                                alt={product.name}
                                                className="w-full h-full object-contain p-2"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center text-gray-300 dark:text-gray-600">
                                                <span className="material-symbols-outlined text-4xl">local_drink</span>
                                                <span className="text-[10px] font-bold uppercase mt-1 tracking-wider">Sin Imagen</span>
                                            </div>
                                        )}

                                        {/* Status Badge flotante */}
                                        <div className="absolute top-2 left-2 z-10">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-xs ${
                                                isActive
                                                    ? 'bg-emerald-500/90 text-white'
                                                    : product.status === 'COMING_SOON'
                                                    ? 'bg-blue-500/90 text-white'
                                                    : 'bg-gray-600/90 text-white'
                                            }`}>
                                                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                                                {product.status === 'ACTIVE' ? 'Activo' : product.status === 'COMING_SOON' ? 'Próximo' : 'Pausado'}
                                            </span>
                                        </div>

                                        {/* Checkbox de Selección (Ctrl+Clic o Clic directo) */}
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleSelectProduct(product.id);
                                            }}
                                            className={`absolute top-2 right-2 z-20 w-7 h-7 rounded-xl flex items-center justify-center transition-colors duration-150 ${
                                                isSelected
                                                    ? 'bg-primary text-white shadow-md shadow-primary/30 opacity-100'
                                                    : selectedIds.length > 0
                                                    ? 'bg-white/90 dark:bg-gray-800/90 text-gray-400 border border-gray-300 dark:border-gray-600 hover:border-primary opacity-100'
                                                    : 'bg-white/80 dark:bg-gray-800/80 text-gray-400 border border-gray-300 dark:border-gray-600 hover:border-primary opacity-0 group-hover:opacity-100'
                                            }`}
                                            title={isSelected ? 'Deseleccionar (Ctrl+Clic)' : 'Seleccionar (Ctrl+Clic)'}
                                        >
                                            <span className={`material-symbols-outlined text-base ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                                                {isSelected ? 'check' : 'check_box_outline_blank'}
                                            </span>
                                        </button>

                                        {/* Categoría flotante inferior */}
                                        <div className="absolute bottom-2 right-2 z-10">
                                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-black/50 text-white backdrop-blur-md">
                                                {product.category || 'General'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Datos del producto */}
                                    <h4 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-2 leading-snug" title={product.name}>
                                        {product.name}
                                    </h4>

                                    {/* Precios */}
                                    <div className="mt-2.5 pt-2.5 border-t border-gray-100 dark:border-gray-700/60 flex items-baseline justify-between">
                                        <div>
                                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block">Precio Venta</span>
                                            <span className="text-xl font-black text-gray-900 dark:text-white">
                                                ${(product.price || 0).toFixed(2)}
                                            </span>
                                        </div>
                                        {product.waterPrice > 0 && (
                                            <div className="text-right">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-primary block">Recarga Líquido</span>
                                                <span className="text-base font-black text-primary">
                                                    ${product.waterPrice.toFixed(2)}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Existencia en Stock */}
                                    <div className="mt-2 flex items-center justify-between text-xs">
                                        <span className="text-gray-500 dark:text-gray-400 font-medium">Existencia:</span>
                                        <span className={`font-black px-2 py-0.5 rounded-lg text-xs ${
                                            isZeroStock
                                                ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400'
                                                : isLowStock
                                                ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                                                : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                                        }`}>
                                            {product.stock || 0} pzas
                                        </span>
                                    </div>
                                </div>

                                {/* Acciones en pie de tarjeta */}
                                <div
                                    className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between gap-2"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggleStatus(product);
                                        }}
                                        className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-colors duration-150 ${
                                            isActive
                                                ? 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300'
                                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                        }`}
                                    >
                                        {isActive ? 'Pausar' : 'Activar'}
                                    </button>

                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setProductToEdit(product);
                                                setIsProductModalOpen(true);
                                            }}
                                            className="p-2 rounded-xl text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors duration-150"
                                            title="Editar artículo"
                                        >
                                            <span className="material-symbols-outlined text-lg">edit</span>
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(product.id, product.name);
                                            }}
                                            className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors duration-150"
                                            title="Eliminar artículo"
                                        >
                                            <span className="material-symbols-outlined text-lg">delete</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* Vista Tabla Desktop */
                <div className="overflow-x-auto rounded-3xl border border-gray-100 dark:border-gray-700/80">
                    <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700/80 text-left">
                        <thead className="bg-gray-50/80 dark:bg-gray-900/60">
                            <tr>
                                <th className="px-4 py-4 w-10 text-center">
                                    <input
                                        type="checkbox"
                                        checked={filteredProducts.length > 0 && selectedIds.length === filteredProducts.length}
                                        onChange={handleSelectAllVisible}
                                        className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer accent-primary"
                                        title="Seleccionar todos los visibles"
                                    />
                                </th>
                                <th className="px-5 py-4 text-[10px] font-black uppercase tracking-wider text-gray-400">Artículo</th>
                                <th className="px-5 py-4 text-[10px] font-black uppercase tracking-wider text-gray-400">Categoría</th>
                                <th className="px-5 py-4 text-center text-[10px] font-black uppercase tracking-wider text-gray-400">Estado</th>
                                <th className="px-5 py-4 text-center text-[10px] font-black uppercase tracking-wider text-gray-400">Stock</th>
                                <th className="px-5 py-4 text-right text-[10px] font-black uppercase tracking-wider text-gray-400">Precio Venta</th>
                                <th className="px-5 py-4 text-right text-[10px] font-black uppercase tracking-wider text-gray-400">Recarga Agua</th>
                                <th className="px-5 py-4 text-right text-[10px] font-black uppercase tracking-wider text-gray-400">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60 bg-white dark:bg-gray-800">
                            {filteredProducts.map(product => {
                                const isSelected = selectedIds.includes(product.id);
                                return (
                                <tr
                                    key={product.id}
                                    onClick={(e) => {
                                        if (e.ctrlKey || e.metaKey) {
                                            e.preventDefault();
                                            toggleSelectProduct(product.id);
                                        }
                                    }}
                                    className={`transition-colors cursor-pointer select-none ${
                                        isSelected
                                            ? 'bg-primary/[0.06] dark:bg-primary/[0.12] hover:bg-primary/[0.09]'
                                            : 'hover:bg-gray-50/50 dark:hover:bg-gray-750'
                                    }`}
                                >
                                    <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => toggleSelectProduct(product.id)}
                                            className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer accent-primary"
                                        />
                                    </td>
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-11 h-11 rounded-xl bg-gray-50 dark:bg-gray-900 overflow-hidden flex items-center justify-center border border-gray-100 dark:border-gray-700 shrink-0">
                                                {product.imageUrl ? (
                                                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain p-1" />
                                                ) : (
                                                    <span className="material-symbols-outlined text-gray-400 text-lg">local_drink</span>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-bold text-xs text-gray-900 dark:text-white">{product.name}</p>
                                                <span className="text-[10px] text-gray-400 font-mono">ID: {product.id?.slice(0, 8)}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3">
                                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                            {product.category || 'General'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-center">
                                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                            (product.status || 'ACTIVE') === 'ACTIVE'
                                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                                                : product.status === 'COMING_SOON'
                                                ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
                                                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                                        }`}>
                                            {product.status || 'ACTIVE'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-center">
                                        <span className={`font-black text-xs ${
                                            (product.stock || 0) <= 0
                                                ? 'text-red-500'
                                                : (product.stock || 0) <= 10
                                                ? 'text-amber-500'
                                                : 'text-gray-800 dark:text-gray-200'
                                        }`}>
                                            {product.stock || 0}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-right font-black text-xs text-gray-900 dark:text-white">
                                        ${(product.price || 0).toFixed(2)}
                                    </td>
                                    <td className="px-5 py-3 text-right font-bold text-xs text-primary">
                                        {product.waterPrice > 0 ? `$${product.waterPrice.toFixed(2)}` : '—'}
                                    </td>
                                    <td className="px-5 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setProductToEdit(product);
                                                    setIsProductModalOpen(true);
                                                }}
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-primary transition-colors"
                                                title="Editar"
                                            >
                                                <span className="material-symbols-outlined text-base">edit</span>
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(product.id, product.name);
                                                }}
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                                                title="Eliminar"
                                            >
                                                <span className="material-symbols-outlined text-base">delete</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Barra Flotante Inferior de Eliminación Masiva */}
            {selectedIds.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-2xl bg-gray-900/95 dark:bg-gray-800/95 backdrop-blur-xl text-white rounded-3xl p-3.5 sm:px-6 sm:py-4 shadow-2xl border border-white/10 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-xs shadow-md shadow-primary/30 shrink-0">
                            {selectedIds.length}
                        </span>
                        <div>
                            <p className="text-xs sm:text-sm font-black">
                                {selectedIds.length === 1 ? '1 artículo seleccionado' : `${selectedIds.length} artículos seleccionados`}
                            </p>
                            <p className="text-[10px] text-gray-400 hidden sm:block">
                                Presiona Ctrl + Clic en las tarjetas para alternar selección
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <button
                            type="button"
                            onClick={handleSelectAllVisible}
                            className="px-3 py-2 rounded-xl text-xs font-bold text-gray-300 hover:text-white bg-white/10 hover:bg-white/15 transition-colors duration-150"
                        >
                            {selectedIds.length === filteredProducts.length ? 'Deseleccionar' : 'Todos'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedIds([])}
                            className="px-3 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-white transition-colors duration-150"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={handleDeleteBatch}
                            className="px-4 py-2 rounded-xl text-xs font-black bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30 flex items-center gap-1.5 transition-colors duration-150"
                        >
                            <span className="material-symbols-outlined text-base">delete_sweep</span>
                            <span>Eliminar de golpe ({selectedIds.length})</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Modal para Crear / Editar Artículo de Venta */}
            {isProductModalOpen && (
                <SaleProductModal
                    isOpen={isProductModalOpen}
                    productToEdit={productToEdit}
                    categories={categories}
                    onSave={handleSaveProduct}
                    onClose={() => {
                        setIsProductModalOpen(false);
                        setProductToEdit(null);
                    }}
                />
            )}

            {/* Modal para Administrar Categorías */}
            {isCatModalOpen && (
                <ManageCategoriesModal
                    isOpen={isCatModalOpen}
                    categories={categories}
                    products={saleProducts}
                    onClose={() => setIsCatModalOpen(false)}
                    onUpdated={loadCategories}
                />
            )}
        </div>
    );
};

// ====================================================================
// Modal: Alta / Edición de Producto de Venta
// ====================================================================
const SaleProductModal = ({ isOpen, productToEdit, categories, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        name: '',
        category: categories[0]?.name || 'Garrafones',
        price: '',
        waterPrice: '',
        stock: '',
        imageUrl: '',
        status: 'ACTIVE'
    });

    const [isAddingNewCat, setIsAddingNewCat] = useState(false);
    const [newCatName, setNewCatName] = useState('');

    useEffect(() => {
        if (productToEdit) {
            setFormData({
                name: productToEdit.name || '',
                category: productToEdit.category || categories[0]?.name || 'Garrafones',
                price: productToEdit.price !== undefined ? productToEdit.price : '',
                waterPrice: productToEdit.waterPrice || '',
                stock: productToEdit.stock !== undefined ? productToEdit.stock : '',
                imageUrl: productToEdit.imageUrl || '',
                status: productToEdit.status || 'ACTIVE'
            });
        } else {
            setFormData({
                name: '',
                category: categories[0]?.name || 'Garrafones',
                price: '',
                waterPrice: '',
                stock: '0',
                imageUrl: '',
                status: 'ACTIVE'
            });
        }
    }, [productToEdit, categories]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        const finalCategory = isAddingNewCat ? newCatName.trim() : formData.category;
        if (!formData.name.trim()) {
            Swal.fire('Campo requerido', 'Ingresa el nombre del producto.', 'warning');
            return;
        }
        if (!formData.price || parseFloat(formData.price) <= 0) {
            Swal.fire('Precio requerido', 'Ingresa un precio de venta válido mayor a 0.', 'warning');
            return;
        }

        onSave({
            ...formData,
            category: finalCategory || 'General'
        });
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100 dark:border-gray-700 flex flex-col max-h-[92vh] overflow-hidden">
                {/* Modal Header */}
                <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-gray-700/80 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/30">
                    <div>
                        <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">
                                {productToEdit ? 'edit_note' : 'add_box'}
                            </span>
                            {productToEdit ? 'Editar Artículo de Venta' : 'Nuevo Artículo para POS'}
                        </h3>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                            Se registrará con visibilidad pública para el mostrador y punto de venta
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 rounded-xl transition-colors"
                    >
                        <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                </div>

                {/* Formulario */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
                    {/* Nombre Comercial */}
                    <div>
                        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                            Nombre Comercial del Artículo *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Ej. Garrafón Darmax 20 Litros, Tapa Sello Azul..."
                            required
                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs sm:text-sm font-semibold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>

                    {/* Categoría */}
                    <div>
                        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                            Categoría Comercial *
                        </label>
                        {!isAddingNewCat ? (
                            <div className="flex gap-2">
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                                    className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs sm:text-sm font-semibold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                                >
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={() => setIsAddingNewCat(true)}
                                    className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 rounded-2xl text-xs font-bold text-gray-700 dark:text-gray-200"
                                    title="Escribir nueva categoría"
                                >
                                    + Nueva
                                </button>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newCatName}
                                    onChange={(e) => setNewCatName(e.target.value)}
                                    placeholder="Nombre de la nueva categoría..."
                                    className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs sm:text-sm font-semibold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsAddingNewCat(false);
                                        setNewCatName('');
                                    }}
                                    className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 rounded-2xl text-xs font-bold text-gray-500"
                                >
                                    Cancelar
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Precios: Venta y Recarga */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                                Precio Venta Mostrador ($) *
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.price}
                                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                                placeholder="0.00"
                                required
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs sm:text-sm font-black text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                                Precio Recarga Agua ($)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.waterPrice}
                                onChange={(e) => setFormData(prev => ({ ...prev, waterPrice: e.target.value }))}
                                placeholder="0.00 (Opcional)"
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs sm:text-sm font-black text-primary outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                    </div>

                    {/* Stock y Estatus */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                                Existencia en Stock *
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={formData.stock}
                                onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                                placeholder="0"
                                required
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs sm:text-sm font-black text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                                Estado en Mostrador
                            </label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs sm:text-sm font-semibold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                            >
                                <option value="ACTIVE">Activo (Visible en POS)</option>
                                <option value="COMING_SOON">Próximamente</option>
                                <option value="INACTIVE">Inactivo (Pausado)</option>
                            </select>
                        </div>
                    </div>

                    {/* URL de Imagen */}
                    <div>
                        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                            URL de Imagen del Producto
                        </label>
                        <input
                            type="text"
                            value={formData.imageUrl}
                            onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                            placeholder="https://ejemplo.com/imagen.jpg"
                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-mono text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-primary/20"
                        />
                        {formData.imageUrl && (
                            <div className="mt-2.5 flex items-center justify-center p-3 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700">
                                <img
                                    src={formData.imageUrl}
                                    alt="Vista previa"
                                    className="max-h-24 max-w-full object-contain"
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Botones de acción */}
                    <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex gap-2 justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-2xl text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2.5 rounded-2xl text-xs font-bold bg-primary hover:bg-primary-dark text-white shadow-md shadow-primary/25 transition-colors duration-150"
                        >
                            {productToEdit ? 'Guardar Cambios' : 'Registrar Artículo'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

// ====================================================================
// Modal: Gestión de Categorías Comerciales (Alta y Eliminación con Validación)
// ====================================================================
const ManageCategoriesModal = ({ isOpen, categories = [], products = [], onClose, onUpdated }) => {
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

    // Conteo de artículos asociados a cada categoría
    const getAssignedCount = (category) => {
        return products.filter(p => 
            p.categoryId === category.id || 
            (p.category && p.category.toLowerCase() === category.name.toLowerCase())
        ).length;
    };

    // Categorías elegibles para eliminación (sin productos)
    const deletableCats = localCategories.filter(cat => getAssignedCount(cat) === 0);
    const allDeletableSelected = deletableCats.length > 0 && selectedCatIds.length === deletableCats.length;

    const toggleSelectCategory = (catId) => {
        triggerHaptic(10);
        setSelectedCatIds(prev => 
            prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
        );
    };

    const toggleSelectAll = () => {
        triggerHaptic(10);
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
            const created = await createProductCategory({ name: trimmed, isPublic: true });
            toast.success('Categoría comercial creada con éxito');
            setName('');
            setLocalCategories(prev => [...prev, created]);
            if (onUpdated) onUpdated();
        } catch (error) {
            swalModal.fire('Error', error.message || 'No se pudo crear la categoría.', 'error');
        } finally {
            setSaving(false);
        }
    };

    // Eliminación individual con animación fluida
    const handleDelete = async (category) => {
        const assignedCount = getAssignedCount(category);

        if (assignedCount > 0) {
            swalModal.fire({
                title: 'No se puede eliminar la categoría',
                html: `La categoría <b>"${category.name}"</b> tiene <b>${assignedCount}</b> ${assignedCount === 1 ? 'artículo comercial asociado' : 'artículos comerciales asociados'}.<br/><br/>Para poder borrarla, debes reasignar o eliminar primero los artículos asociados.`,
                icon: 'warning',
                confirmButtonColor: '#137FEC',
                confirmButtonText: 'Entendido'
            });
            return;
        }

        triggerHaptic(15);
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
                await deleteProductCategory(category.id);
                // Actualización inmediata sin recargar toda la página
                setLocalCategories(prev => prev.filter(c => c.id !== category.id));
                setSelectedCatIds(prev => prev.filter(id => id !== category.id));
                toast.success(`Categoría "${category.name}" eliminada`);
                if (onUpdated) onUpdated();
            } catch (error) {
                const errorMsg = error?.response?.data?.error || error.message || 'No se pudo eliminar la categoría.';
                swalModal.fire('Error al eliminar', errorMsg, 'error');
            } finally {
                setDeletingIds(prev => prev.filter(id => id !== category.id));
            }
        }
    };

    // Eliminación múltiple en lote con animación fluida
    const handleDeleteBatch = async () => {
        const count = selectedCatIds.length;
        if (count === 0) return;

        triggerHaptic(20);
        const result = await swalModal.fire({
            title: `¿Eliminar ${count} ${count === 1 ? 'categoría seleccionada' : 'categorías seleccionadas'}?`,
            html: `Se removerán <b>${count}</b> categorías vacías de la base de datos.<br/>Esta acción no se puede deshacer.`,
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
                await deleteProductCategoriesBatch(selectedCatIds);
                const setDeleted = new Set(selectedCatIds);
                setLocalCategories(prev => prev.filter(c => !setDeleted.has(c.id)));
                setSelectedCatIds([]);
                toast.success(`${count} categorías eliminadas con éxito`);
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
                            Categorías de Mostrador (POS)
                        </h3>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                            Crea nuevas categorías o gestiona las existentes. Solo se pueden borrar categorías sin artículos.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-xl transition-colors"
                    >
                        <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                </div>

                {/* Formulario para agregar nueva categoría */}
                <form onSubmit={handleCreate} className="space-y-2">
                    <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block">
                        Nueva Categoría
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ej. Termos, Accesorios, Hielo..."
                            required
                            className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs sm:text-sm font-semibold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                        />
                        <button
                            type="submit"
                            disabled={saving || !name.trim()}
                            className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-2xl text-xs font-bold shadow-md shadow-primary/25 disabled:opacity-50 transition-colors duration-150 flex items-center gap-1 shrink-0"
                        >
                            {saving ? (
                                <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
                            ) : (
                                <span className="material-symbols-outlined text-base">add</span>
                            )}
                            <span>{saving ? 'Guardando...' : 'Agregar'}</span>
                        </button>
                    </div>
                </form>

                {/* Lista de categorías existentes con selección múltiple */}
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
                                className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 transition-colors duration-150"
                            >
                                <span className="material-symbols-outlined text-sm">
                                    {allDeletableSelected ? 'check_box' : 'check_box_outline_blank'}
                                </span>
                                <span>{allDeletableSelected ? 'Deseleccionar todas' : 'Seleccionar todas las vacías'}</span>
                            </button>
                        )}
                    </div>

                    {/* Barra de acción cuando hay elementos seleccionados */}
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
                                    className="px-2.5 py-1 text-[11px] font-bold text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 rounded-xl transition-colors duration-150"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDeleteBatch}
                                    disabled={isBatchDeleting}
                                    className="px-3.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors duration-150 flex items-center gap-1.5 disabled:opacity-50"
                                >
                                    {isBatchDeleting ? (
                                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
                                    ) : (
                                        <span className="material-symbols-outlined text-sm">delete</span>
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
                                const assignedCount = getAssignedCount(cat);
                                const hasProducts = assignedCount > 0;
                                const isDeleting = deletingIds.includes(cat.id);
                                const isSelected = selectedCatIds.includes(cat.id);

                                return (
                                    <div
                                        key={cat.id}
                                        className={`flex items-center justify-between p-3 rounded-2xl border transition-colors duration-150 ${
                                            isDeleting 
                                                ? 'bg-red-50/50 dark:bg-red-950/20 border-red-200 opacity-60 pointer-events-none' 
                                                : isSelected 
                                                    ? 'bg-primary/5 border-primary/40 shadow-xs' 
                                                    : 'bg-gray-50/80 dark:bg-gray-900/40 border-gray-100 dark:border-gray-700/60 hover:border-gray-200'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                            {/* Checkbox de selección si no tiene productos */}
                                            {!hasProducts && (
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    disabled={isDeleting}
                                                    onChange={() => toggleSelectCategory(cat.id)}
                                                    className="w-4 h-4 rounded text-primary focus:ring-primary/20 border-gray-300 dark:border-gray-600 dark:bg-gray-700 cursor-pointer shrink-0"
                                                />
                                            )}
                                            {hasProducts && (
                                                <span className="w-2 h-2 rounded-full bg-primary shrink-0 ml-1"></span>
                                            )}
                                            <div className="truncate">
                                                <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                                                    {cat.name}
                                                </p>
                                                <span className={`text-[10px] font-medium ${
                                                    hasProducts ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-gray-400'
                                                }`}>
                                                    {hasProducts ? `${assignedCount} ${assignedCount === 1 ? 'artículo asociado' : 'artículos asociados'}` : 'Sin artículos (eliminable)'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1 shrink-0">
                                            {isDeleting ? (
                                                <div className="p-1.5 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 font-bold">
                                                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-red-600 border-t-transparent"></div>
                                                    <span className="text-[10px]">Borrando...</span>
                                                </div>
                                            ) : hasProducts ? (
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(cat)}
                                                    className="p-1.5 rounded-xl text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors duration-150"
                                                    title={`No se puede borrar: tiene ${assignedCount} artículos asociados`}
                                                >
                                                    <span className="material-symbols-outlined text-base">lock</span>
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(cat)}
                                                    className="p-1.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors duration-150"
                                                    title="Eliminar categoría vacía"
                                                >
                                                    <span className="material-symbols-outlined text-base">delete</span>
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
                        className="px-5 py-2.5 rounded-2xl text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-150"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ManageSaleProducts;