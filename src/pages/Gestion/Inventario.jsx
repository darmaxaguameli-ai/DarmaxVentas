import { useState, useEffect, useMemo } from "react";
import { useGestion } from "./context/GestionContext";
import { fetchProductCategories, updateProductCategory, createProductCategory } from "../../api/apiClient";
import { toast } from 'sonner';
import Swal from 'sweetalert2';

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
            toast.success(`Categoría "${newCatName}" creada.`);
            setNewCatName('');
            onUpdate();
        } catch (error) {
            Swal.fire('Error', error.message || 'No se pudo crear la categoría.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleTogglePublic = async (category) => {
        try {
            await updateProductCategory(category.id, { isPublic: !category.isPublic });
            onUpdate();
            toast.success(`Categoría "${category.name}" actualizada.`);
        } catch (error) {
            Swal.fire('Error', 'No se pudo actualizar la categoría.', 'error');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-dark dark:text-white">Gestionar Categorías</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Formulario Nueva Categoría */}
                <form onSubmit={handleCreateCategory} className="mb-6 flex gap-2">
                    <input 
                        type="text" 
                        value={newCatName} 
                        onChange={(e) => setNewCatName(e.target.value)}
                        placeholder="Nueva categoría (ej: Termos)"
                        className="flex-1 input-style"
                        disabled={isSubmitting}
                    />
                    <button 
                        type="submit" 
                        disabled={isSubmitting || !newCatName.trim()}
                        className="btn-primary px-4"
                    >
                        {isSubmitting ? '...' : 'Crear'}
                    </button>
                </form>

                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                    {categories.length === 0 ? (
                        <p className="text-center text-gray-500 py-4 italic">No hay categorías registradas.</p>
                    ) : (
                        categories.map(cat => (
                            <div key={cat.id} className="flex items-center justify-between p-3 rounded-lg border dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
                                <div>
                                    <p className="font-bold text-dark dark:text-white">{cat.name}</p>
                                    <p className="text-xs text-text-secondary dark:text-white/60">
                                        {cat.isPublic ? 'Visible en tienda' : 'Solo uso interno'}
                                    </p>
                                </div>
                                <button 
                                    onClick={() => handleTogglePublic(cat)}
                                    className={`px-3 py-1 rounded-full text-[10px] font-black transition-all ${
                                        cat.isPublic 
                                        ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300'
                                    }`}
                                >
                                    {cat.isPublic ? 'PÚBLICA' : 'INTERNA'}
                                </button>
                            </div>
                        ))
                    )}
                </div>
                <div className="mt-6 flex justify-end">
                    <button onClick={onClose} className="btn-primary w-full">Cerrar</button>
                </div>
            </div>
        </div>
    );
};

const ProductModal = ({ isOpen, onClose, productToEdit, onSave, categories }) => {
    const [product, setProduct] = useState({ 
        name: '', 
        stock: '', 
        price: '', 
        waterPrice: '', 
        category: '', 
        imageUrl: '', 
        status: 'ACTIVE',
        isPublic: true 
    });
    const [uploadType, setUploadType] = useState('url');
    const [newCategory, setNewCategory] = useState('');
    const [isAddingCategory, setIsAddingCategory] = useState(false);

    useEffect(() => {
        if (productToEdit) {
            setProduct({
                ...productToEdit,
                status: productToEdit.status || 'ACTIVE',
                waterPrice: productToEdit.waterPrice || '',
                isPublic: productToEdit.isPublic !== undefined ? productToEdit.isPublic : true
            });
            setUploadType(productToEdit.imageUrl && !productToEdit.imageUrl.startsWith('http') ? 'file' : 'url');
        } else {
            setProduct({ 
                name: '', 
                stock: '', 
                price: '', 
                waterPrice: '', 
                category: categories[0]?.name || '', 
                imageUrl: '', 
                status: 'ACTIVE', 
                isPublic: true 
            });
            setUploadType('url');
        }

        return () => {
            if (product.imageUrl && product.imageUrl.startsWith('blob:')) {
                URL.revokeObjectURL(product.imageUrl);
            }
        };
    }, [productToEdit, isOpen, categories]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setProduct(prev => ({ 
            ...prev, 
            [name]: type === 'checkbox' ? checked : value 
        }));
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const newImageUrl = URL.createObjectURL(file);
            setProduct(prev => ({ ...prev, imageUrl: newImageUrl }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const finalCategory = isAddingCategory ? newCategory : product.category;
        
        if (!finalCategory) {
            Swal.fire('Error', 'Debes seleccionar o crear una categoría.', 'error');
            return;
        }

        onSave({
            ...product,
            category: finalCategory,
            stock: parseInt(product.stock, 10) || 0,
            price: parseFloat(product.price) || 0,
            waterPrice: parseFloat(product.waterPrice) || 0,
        });
        setNewCategory('');
        setIsAddingCategory(false);
        onClose();
    };

    if (!isOpen) return null;

    const isEditing = !!productToEdit;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-4 text-dark dark:text-white">
                    {isEditing ? "Editar Producto" : "Nuevo Producto"}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre del Producto</label>
                        <input name="name" type="text" value={product.name} onChange={handleChange} required className="mt-1 block w-full input-style" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Categoría</label>
                        <div className="flex gap-2 mt-1">
                            {!isAddingCategory ? (
                                <>
                                    <select name="category" value={product.category} onChange={handleChange} className="flex-1 input-style">
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                                        ))}
                                    </select>
                                    <button type="button" onClick={() => setIsAddingCategory(true)} className="px-3 bg-gray-100 dark:bg-gray-700 rounded-md border dark:border-gray-600">
                                        <span className="material-symbols-outlined text-sm">add</span>
                                    </button>
                                </>
                            ) : (
                                <>
                                    <input 
                                        type="text" 
                                        value={newCategory} 
                                        onChange={(e) => setNewCategory(e.target.value)} 
                                        placeholder="Nueva categoría..." 
                                        className="flex-1 input-style"
                                        autoFocus
                                    />
                                    <button type="button" onClick={() => setIsAddingCategory(false)} className="px-3 bg-gray-100 dark:bg-gray-700 rounded-md border dark:border-gray-600">
                                        <span className="material-symbols-outlined text-sm">close</span>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Estado</label>
                            <select name="status" value={product.status} onChange={handleChange} required className="mt-1 block w-full input-style">
                                <option value="ACTIVE">Activo</option>
                                <option value="COMING_SOON">Próximamente</option>
                                <option value="INACTIVE">Inactivo</option>
                            </select>
                        </div>
                        <div className="flex items-end pb-3">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input name="isPublic" type="checkbox" checked={product.isPublic} onChange={handleChange} className="h-4 w-4 text-primary rounded" />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Visible en Tienda</span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Imagen del Producto</label>
                        <div className="flex gap-2 mb-3">
                            <button type="button" onClick={() => setUploadType('url')} className={`px-4 py-2 text-xs font-bold rounded-md ${uploadType === 'url' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700'}`}>URL</button>
                            <button type="button" onClick={() => setUploadType('file')} className={`px-4 py-2 text-xs font-bold rounded-md ${uploadType === 'file' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700'}`}>ARCHIVO</button>
                        </div>
                        {uploadType === 'url' ? (
                            <input name="imageUrl" type="text" value={product.imageUrl || ''} onChange={handleChange} placeholder="https://..." className="mt-1 block w-full input-style" />
                        ) : (
                            <input type="file" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Stock</label>
                            <input name="stock" type="number" value={product.stock} onChange={handleChange} required className="mt-1 block w-full input-style" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Precio Venta</label>
                            <input name="price" type="number" step="0.01" value={product.price} onChange={handleChange} required className="mt-1 block w-full input-style" />
                        </div>
                    </div>

                    {product.category === 'Garrafones' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Precio Agua (Llenado)</label>
                            <input name="waterPrice" type="number" step="0.01" value={product.waterPrice} onChange={handleChange} className="mt-1 block w-full input-style" />
                        </div>
                    )}

                    <div className="flex justify-end gap-4 pt-4 border-t dark:border-gray-700">
                        <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
                        <button type="submit" className="btn-primary">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const Inventario = () => {
    const { state, addProduct, updateProduct, deleteProduct } = useGestion();
    const { inventory, loading, error } = state;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCatModalOpen, setIsCatModalOpen] = useState(false);
    const [productToEdit, setProductToEdit] = useState(null);
    const [activeCategory, setActiveCategory] = useState("");
    const [dbCategories, setDbCategories] = useState([]);

    const loadCategories = async () => {
        try {
            const data = await fetchProductCategories();
            setDbCategories(data);
            if (!activeCategory && data.length > 0) setActiveCategory(data[0].name);
        } catch (err) {
            console.error("Error loading categories:", err);
        }
    };

    useEffect(() => {
        loadCategories();
    }, []);

    const filteredInventory = useMemo(() => {
        return inventory.filter(p => p.category === activeCategory);
    }, [inventory, activeCategory]);

    const handleSaveProduct = async (product) => {
        if (product.id) await updateProduct(product.id, product);
        else await addProduct(product);
        await loadCategories();
        setActiveCategory(product.category);
    };
    
    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: '¡No podrás revertir esto!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });
        if (result.isConfirmed) deleteProduct(id);
    }

    return (
        <div>
            <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold text-dark dark:text-white">Inventario</h1>
                <div className="flex gap-3">
                    <button onClick={() => setIsCatModalOpen(true)} className="btn-secondary flex items-center gap-2">
                        <span className="material-symbols-outlined">settings_suggest</span>
                        Categorías
                    </button>
                    <button onClick={() => { setProductToEdit(null); setIsModalOpen(true); }} className="btn-primary">
                        Nuevo Producto
                    </button>
                </div>
            </div>

            <ProductModal 
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              onSave={handleSaveProduct}
              productToEdit={productToEdit}
              categories={dbCategories}
            />

            <CategoryManagerModal 
                isOpen={isCatModalOpen}
                onClose={() => setIsCatModalOpen(false)}
                categories={dbCategories}
                onUpdate={loadCategories}
            />

            <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                <nav className="flex flex-wrap -mb-px space-x-2 sm:space-x-4 overflow-x-auto scrollbar-hide">
                    {dbCategories.map(category => (
                        <button 
                            key={category.id} 
                            onClick={() => setActiveCategory(category.name)}
                            className={`px-4 py-2 font-medium rounded-t-lg transition-all flex items-center gap-2 whitespace-nowrap ${
                                activeCategory === category.name
                                    ? 'bg-primary text-white'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                        >
                            {category.name}
                            {!category.isPublic && (
                                <span className="material-symbols-outlined text-[14px]">visibility_off</span>
                            )}
                        </button>
                    ))}
                </nav>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
                <table className="min-w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="th-style">Imagen</th>
                            <th className="th-style">Producto</th>
                            <th className="th-style text-center">Tienda</th>
                            <th className="th-style text-center">Stock</th>
                            <th className="th-style text-right">Precio</th>
                            <th className="th-style text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {loading ? (
                            <tr><td colSpan="6" className="p-6 text-center text-gray-500">Cargando...</td></tr>
                        ) : filteredInventory.length === 0 ? (
                             <tr><td colSpan="6" className="p-6 text-center text-gray-500">{`No hay productos en "${activeCategory}".`}</td></tr>
                        ) : (
                            filteredInventory.map((item) => (
                                <tr key={item.id}>
                                    <td className="td-style">
                                        <div className="h-10 w-10 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center border dark:border-gray-600">
                                            {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" /> : <span className="material-symbols-outlined text-gray-400 text-xl">inventory_2</span>}
                                        </div>
                                    </td>
                                    <td className="td-style font-medium">{item.name}</td>
                                    <td className="td-style text-center">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.isPublic ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                                            {item.isPublic ? "PÚBLICO" : "INTERNO"}
                                        </span>
                                    </td>
                                    <td className="td-style text-center">{item.stock}</td>
                                    <td className="td-style text-right">${(item.price || 0).toFixed(2)}</td>
                                    <td className="td-style text-right">
                                        <div className="flex gap-2 justify-end">
                                            <button onClick={() => { setProductToEdit(item); setIsModalOpen(true); }} className="text-primary font-medium">Editar</button>
                                            <button onClick={() => handleDelete(item.id)} className="text-red-500 font-medium">Eliminar</button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Inventario;
