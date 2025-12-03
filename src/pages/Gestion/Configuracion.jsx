import React, { useState, useMemo } from 'react';
import { useGestion } from './context/GestionContext';
import Swal from 'sweetalert2'; // Importar SweetAlert2

// ====================================================================
// Main Configuration Component
// ====================================================================
const Configuracion = () => {
    const [activeTab, setActiveTab] = useState('waterTypes');

    const getTabClassName = (tabName) => {
        return `px-4 py-2 font-medium rounded-t-lg transition-colors ${
            activeTab === tabName
                ? 'bg-primary text-white border-b-2 border-primary-dark'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`;
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-[#111418] dark:text-white mb-6">Configuración del Negocio</h1>
            
            <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                <nav className="flex flex-wrap space-x-2 sm:space-x-4"> {/* Añadido flex-wrap y ajustado space-x */}
                    <button onClick={() => setActiveTab('waterTypes')} className={getTabClassName('waterTypes')}>
                        Tipos de Agua
                    </button>
                    <button onClick={() => setActiveTab('servicePrices')} className={getTabClassName('servicePrices')}>
                        Precios de Servicios
                    </button>
                    <button onClick={() => setActiveTab('jugBrands')} className={getTabClassName('jugBrands')}>
                        Marcas de Garrafón
                    </button>
                </nav>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                {activeTab === 'waterTypes' && <ManageWaterTypes />}
                {activeTab === 'servicePrices' && <ManageServicePrices />}
                {activeTab === 'jugBrands' && <ManageJugBrands />}
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
            <div className="flex justify-between items-center mb-4">
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
                                <td className="td-style text-right space-x-2">
                                    <button onClick={() => { setItemToEdit(wt); setModalOpen(true); }} className="btn-secondary">Editar</button>
                                    <button onClick={() => handleDelete(wt.id)} className="btn-danger">Eliminar</button>
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
    const { servicePrices, waterTypes } = state;
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
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Gestionar Precios de Servicios</h2>
                <button onClick={() => { setItemToEdit(null); setModalOpen(true); }} className="btn-primary">
                    Agregar Precio
                </button>
            </div>
            {isModalOpen && <ServicePriceModal itemToEdit={itemToEdit} waterTypes={waterTypes} onSave={handleSave} onClose={() => setModalOpen(false)} />}
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead>
                        <tr>
                            <th className="th-style">Servicio</th>
                            <th className="th-style">Método</th>
                            <th className="th-style">Tipo de Agua</th>
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
                                <td className="td-style">${sp.price.toFixed(2)}</td>
                                <td className="td-style text-right space-x-2">
                                    <button onClick={() => { setItemToEdit(sp); setModalOpen(true); }} className="btn-secondary">Editar</button>
                                    <button onClick={() => handleDelete(sp.id)} className="btn-danger">Eliminar</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const ServicePriceModal = ({ itemToEdit, waterTypes, onSave, onClose }) => {
    const [data, setData] = useState({
        name: itemToEdit?.name || 'Recarga',
        method: itemToEdit?.method || 'Mostrador',
        price: itemToEdit?.price || '',
        waterTypeId: itemToEdit?.waterTypeId || '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setData(prev => ({...prev, [name]: value}));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ ...data, price: parseFloat(data.price) });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-lg">
                <h3 className="text-lg font-bold mb-4">{itemToEdit ? 'Editar' : 'Agregar'} Precio de Servicio</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"> {/* Responsivo */}
                        <div>
                            <label className="label-style">Nombre del Servicio</label>
                            <input name="name" type="text" value={data.name} onChange={handleChange} className="input-style w-full" required />
                        </div>
                        <div>
                            <label className="label-style">Método</label>
                            <select name="method" value={data.method} onChange={handleChange} className="input-style w-full">
                                <option value="Mostrador">Mostrador</option>
                                <option value="Domicilio">Domicilio</option>
                                <option value="General">General (ej. Recolección)</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"> {/* Responsivo */}
                         <div>
                            <label className="label-style">Tipo de Agua (opcional)</label>
                            <select name="waterTypeId" value={data.waterTypeId} onChange={handleChange} className="input-style w-full">
                                <option value="">N/A</option>
                                {waterTypes.map(wt => <option key={wt.id} value={wt.id}>{wt.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="label-style">Precio</label>
                            <input name="price" type="number" step="0.01" value={data.price} onChange={handleChange} className="input-style w-full" required />
                        </div>
                    </div>
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
// Jug Brand Management
// ====================================================================
const ManageJugBrands = () => {
    const { state, addJugBrand, updateJugBrand, deleteJugBrand } = useGestion();
    const { jugBrands, inventory } = state;
    const [isModalOpen, setModalOpen] = useState(false);
    const [itemToEdit, setItemToEdit] = useState(null);

    const capProducts = useMemo(() => inventory.filter(p => p.category?.toLowerCase() === 'tapas'), [inventory]);

    const handleSave = (data) => {
        if (itemToEdit) {
            updateJugBrand(itemToEdit.id, data);
        } else {
            addJugBrand(data);
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
            deleteJugBrand(id);
        }
    };
    
    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Gestionar Marcas de Garrafón</h2>
                <button onClick={() => { setItemToEdit(null); setModalOpen(true); }} className="btn-primary">
                    Agregar Marca
                </button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Aquí puedes asociar una marca de garrafón con su tapa compatible. Las tapas deben ser creadas primero como un producto con la categoría 'Tapas' en la sección de Inventario.
            </p>
            {isModalOpen && <JugBrandModal itemToEdit={itemToEdit} capProducts={capProducts} onSave={handleSave} onClose={() => setModalOpen(false)} />}
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead>
                        <tr>
                            <th className="th-style">Nombre de Marca</th>
                            <th className="th-style">Tapa Compatible</th>
                            <th className="th-style text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {jugBrands.map(jb => (
                            <tr key={jb.id}>
                                <td className="td-style">{jb.name}</td>
                                <td className="td-style">{jb.compatibleCap?.name || 'N/A'}</td>
                                <td className="td-style text-right space-x-2">
                                    <button onClick={() => { setItemToEdit(jb); setModalOpen(true); }} className="btn-secondary">Editar</button>
                                    <button onClick={() => handleDelete(jb.id)} className="btn-danger">Eliminar</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const JugBrandModal = ({ itemToEdit, capProducts, onSave, onClose }) => {
    const [data, setData] = useState({
        name: itemToEdit?.name || '',
        compatibleCapId: itemToEdit?.compatibleCapId || '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setData(prev => ({...prev, [name]: value}));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
                <h3 className="text-lg font-bold mb-4">{itemToEdit ? 'Editar' : 'Agregar'} Marca de Garrafón</h3>
                <form onSubmit={(e) => { e.preventDefault(); onSave(data); }}>
                    <div className="space-y-4">
                        <div>
                            <label className="label-style">Nombre de la Marca</label>
                            <input name="name" type="text" value={data.name} onChange={handleChange} className="input-style w-full" required />
                        </div>
                        <div>
                            <label className="label-style">Tapa Compatible (del Inventario)</label>
                            <select name="compatibleCapId" value={data.compatibleCapId} onChange={handleChange} className="input-style w-full">
                                <option value="">Ninguna</option>
                                {capProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                        <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
                        <button type="submit" className="btn-primary">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


export default Configuracion;
