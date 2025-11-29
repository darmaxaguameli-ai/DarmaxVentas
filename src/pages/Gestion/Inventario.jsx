import { useState, useEffect } from "react";
import { useGestion } from "./context/GestionContext";

const ProductModal = ({ isOpen, onClose, productToEdit, onSave }) => {
    const [product, setProduct] = useState({ name: '', stock: '', price: '', category: '', imageUrl: '' });
    const [uploadType, setUploadType] = useState('url');

    useEffect(() => {
        if (productToEdit) {
            setProduct(productToEdit);
            setUploadType('url');
        } else {
            setProduct({ name: '', stock: '', price: '', category: '', imageUrl: '' });
            setUploadType('url');
        }

        return () => {
            if (product.imageUrl && product.imageUrl.startsWith('blob:')) {
                URL.revokeObjectURL(product.imageUrl);
            }
        };
    }, [productToEdit, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProduct(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const newImageUrl = URL.createObjectURL(file);
            if (product.imageUrl && product.imageUrl.startsWith('blob:')) {
                URL.revokeObjectURL(product.imageUrl);
            }
            setProduct(prev => ({ ...prev, imageUrl: newImageUrl }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...product,
            stock: parseInt(product.stock, 10) || 0,
            price: parseFloat(product.price) || 0,
        });
        onClose();
    };

    if (!isOpen) return null;

    const isEditing = !!productToEdit;

    const tabStyle = "px-4 py-2 text-sm font-medium rounded-md transition-colors";
    const activeTabStyle = "bg-primary text-white";
    const inactiveTabStyle = "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4 text-[#111418] dark:text-white">
                    {isEditing ? "Editar Producto" : "Agregar Nuevo Producto"}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre del Producto</label>
                        <input name="name" type="text" value={product.name} onChange={handleChange} required className="mt-1 block w-full input-style" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Categoría</label>
                        <input name="category" type="text" value={product.category} onChange={handleChange} required className="mt-1 block w-full input-style" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Imagen del Producto</label>
                        <div className="flex gap-2 mb-3">
                            <button type="button" onClick={() => setUploadType('url')} className={`${tabStyle} ${uploadType === 'url' ? activeTabStyle : inactiveTabStyle}`}>
                                Usar URL
                            </button>
                            <button type="button" onClick={() => setUploadType('file')} className={`${tabStyle} ${uploadType === 'file' ? activeTabStyle : inactiveTabStyle}`}>
                                Subir Archivo
                            </button>
                        </div>
                        {uploadType === 'url' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">URL de Imagen</label>
                                <input name="imageUrl" type="text" value={product.imageUrl || ''} onChange={handleChange} placeholder="https://ejemplo.com/imagen.png" className="mt-1 block w-full input-style" />
                            </div>
                        )}
                        {uploadType === 'file' && (
                            <div>
                                <input type="file" id="file-upload" className="hidden" accept="image/*" onChange={handleFileChange} />
                                <label htmlFor="file-upload" className="cursor-pointer mt-1 block w-full text-center p-4 border-2 border-dashed rounded-md text-gray-500 dark:text-gray-400 hover:border-primary dark:hover:border-primary-dark transition-colors">
                                    {product.imageUrl ? 'Cambiar imagen' : 'Seleccionar una imagen'}
                                </label>
                                {product.imageUrl && (
                                    <div className="mt-4 flex justify-center">
                                        <img src={product.imageUrl} alt="Previsualización" className="h-32 w-32 rounded-md object-cover"/>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Stock</label>
                            <input name="stock" type="number" value={product.stock} onChange={handleChange} required className="mt-1 block w-full input-style" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Precio Unitario</label>
                            <input name="price" type="number" step="0.01" value={product.price} onChange={handleChange} required className="mt-1 block w-full input-style" />
                        </div>
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
                        <button type="submit" className="btn-primary">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const Inventario = () => {
    const { state, fetchInventory, addProduct, updateProduct, deleteProduct } = useGestion();
    const { inventory, loading, error } = state;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [productToEdit, setProductToEdit] = useState(null);

    useEffect(() => {
        fetchInventory();
    }, [fetchInventory]);

    const handleOpenModal = (product = null) => {
        setProductToEdit(product);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setProductToEdit(null);
        setIsModalOpen(false);
    };

    const handleSaveProduct = (product) => {
        if (product.id) {
            updateProduct(product);
        } else {
            addProduct(product);
        }
    };
    
    const handleDelete = (id) => {
        if(window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
            deleteProduct(id);
        }
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-[#111418] dark:text-white">Inventario</h1>
                <button onClick={() => handleOpenModal()} className="btn-primary">
                    Agregar Producto
                </button>
            </div>

            <ProductModal 
              isOpen={isModalOpen}
              onClose={handleCloseModal}
              onSave={handleSaveProduct}
              productToEdit={productToEdit}
            />
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
                <table className="min-w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="th-style">Imagen</th>
                            <th className="th-style">Producto</th>
                            <th className="th-style">Categoría</th>
                            <th className="th-style">Stock</th>
                            <th className="th-style">Precio Unitario</th>
                            <th className="th-style text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {loading ? (
                            <tr>
                                <td colSpan="6" className="p-6 text-center text-gray-500 dark:text-gray-400">
                                    Cargando...
                                </td>
                            </tr>
                        ) : error ? (
                             <tr>
                                <td colSpan="6" className="p-6 text-center text-red-500">
                                    Error al cargar el inventario: {error}
                                </td>
                            </tr>
                        ) : inventory.length === 0 ? (
                             <tr>
                                <td colSpan="6" className="p-6 text-center text-gray-500 dark:text-gray-400">
                                    No hay productos en el inventario.
                                </td>
                            </tr>
                        ) : (
                            inventory.map((item) => (
                                <tr key={item.id}>
                                    <td className="td-style">
                                        <img src={item.imageUrl || 'https://via.placeholder.com/150'} alt={item.name} className="h-10 w-10 rounded-md object-cover" />
                                    </td>
                                    <td className="td-style font-medium">{item.name}</td>
                                    <td className="td-style">{item.category}</td>
                                    <td className="td-style">{item.stock}</td>
                                    <td className="td-style text-right">${(item.price || 0).toFixed(2)}</td>
                                    <td className="td-style text-right space-x-4">
                                        <button onClick={() => handleOpenModal(item)} className="text-primary hover:text-primary/90 font-medium">Editar</button>
                                        <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700 font-medium">Eliminar</button>
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