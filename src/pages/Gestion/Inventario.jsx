import { useState, useEffect } from "react";
import { useGestion } from "./context/GestionContext";

const ProductModal = ({ isOpen, onClose, productToEdit, onSave }) => {
    const [product, setProduct] = useState({ name: '', quantity: '', price: '', category: '' });

    useEffect(() => {
        if (productToEdit) {
            setProduct(productToEdit);
        } else {
            setProduct({ name: '', quantity: '', price: '', category: '' });
        }
    }, [productToEdit, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProduct(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...product,
            quantity: parseInt(product.quantity, 10),
            price: parseFloat(product.price),
        });
        onClose();
    };

    if (!isOpen) return null;

    const isEditing = !!productToEdit;

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
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cantidad</label>
                            <input name="quantity" type="number" value={product.quantity} onChange={handleChange} required className="mt-1 block w-full input-style" />
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
    const { state, addProduct, updateProduct, deleteProduct } = useGestion();
    const { inventory } = state;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [productToEdit, setProductToEdit] = useState(null);

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
                            <th className="th-style">Producto</th>
                            <th className="th-style">Categoría</th>
                            <th className="th-style">Cantidad</th>
                            <th className="th-style">Precio Unitario</th>
                            <th className="th-style text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {inventory.map((item) => (
                            <tr key={item.id}>
                                <td className="td-style font-medium">{item.name}</td>
                                <td className="td-style">{item.category}</td>
                                <td className="td-style">{item.quantity}</td>
                                <td className="td-style text-right">${item.price.toFixed(2)}</td>
                                <td className="td-style text-right space-x-4">
                                    <button onClick={() => handleOpenModal(item)} className="text-primary hover:text-primary/90 font-medium">Editar</button>
                                    <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700 font-medium">Eliminar</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Inventario;