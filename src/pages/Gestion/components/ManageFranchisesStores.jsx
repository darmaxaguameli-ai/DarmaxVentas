import React, { useState } from 'react';
import { useGestion } from '../context/GestionContext';
import Swal from 'sweetalert2';

// ====================================================================
// ManageFranchisesStores Component
// ====================================================================
const ManageFranchisesStores = () => {
    const { state } = useGestion();
    const { franchises } = state;
    const [activeSubTab, setActiveSubTab] = useState('stores'); // 'franchises' or 'stores'

    // Si no hay franquicias, forzar a la pestaña de franquicias o mostrar alerta
    const hasFranchises = franchises && franchises.length > 0;

    return (
        <div className="space-y-6">
            <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700 pb-2">
                <button 
                    onClick={() => setActiveSubTab('stores')}
                    className={`pb-2 px-1 text-sm font-medium transition-colors ${
                        activeSubTab === 'stores' 
                        ? 'border-b-2 border-primary text-primary' 
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                >
                    Sucursales
                </button>
                <button 
                    onClick={() => setActiveSubTab('franchises')}
                    className={`pb-2 px-1 text-sm font-medium transition-colors ${
                        activeSubTab === 'franchises' 
                        ? 'border-b-2 border-primary text-primary' 
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                >
                    Franquicias
                </button>
            </div>

            {activeSubTab === 'franchises' && <FranchiseList />}
            {activeSubTab === 'stores' && (
                hasFranchises 
                ? <StoreList /> 
                : <div className="text-center p-8 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <p className="text-gray-600 dark:text-gray-400 mb-4">No tienes ninguna franquicia registrada. Necesitas crear una antes de agregar sucursales.</p>
                    <button onClick={() => setActiveSubTab('franchises')} className="btn-primary">Ir a Crear Franquicia</button>
                  </div>
            )}
        </div>
    );
};

// ====================================================================
// Franchise List & Modal
// ====================================================================
const FranchiseList = () => {
    const { state, addFranchise, updateFranchise, deleteFranchise } = useGestion();
    const { franchises } = state;
    const [isModalOpen, setModalOpen] = useState(false);
    const [itemToEdit, setItemToEdit] = useState(null);

    const handleSave = async (data) => {
        if (itemToEdit) {
            await updateFranchise(itemToEdit.id, data);
        } else {
            await addFranchise(data);
        }
        setModalOpen(false);
        setItemToEdit(null);
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: '¿Eliminar franquicia?',
            text: 'Esto eliminará también todas las sucursales asociadas.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            deleteFranchise(id);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">Listado de Franquicias</h3>
                <button onClick={() => { setItemToEdit(null); setModalOpen(true); }} className="btn-primary text-sm">
                    Nueva Franquicia
                </button>
            </div>
            
            {isModalOpen && <FranchiseModal itemToEdit={itemToEdit} onSave={handleSave} onClose={() => setModalOpen(false)} />}
            
            <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
                <table className="min-w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="th-style">Nombre</th>
                            <th className="th-style">Sucursales</th>
                            <th className="th-style text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {franchises.length === 0 ? (
                            <tr><td colSpan="3" className="p-4 text-center text-gray-500">No hay franquicias registradas.</td></tr>
                        ) : (
                            franchises.map(f => (
                                <tr key={f.id}>
                                    <td className="td-style font-medium">{f.name}</td>
                                    <td className="td-style">{f.stores?.length || 0}</td>
                                    <td className="td-style text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => { setItemToEdit(f); setModalOpen(true); }} className="text-primary hover:underline">Editar</button>
                                            <button onClick={() => handleDelete(f.id)} className="text-red-500 hover:underline">Eliminar</button>
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
};

const FranchiseModal = ({ itemToEdit, onSave, onClose }) => {
    const [name, setName] = useState(itemToEdit?.name || '');
    
    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ name });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
                <h3 className="text-lg font-bold mb-4">{itemToEdit ? 'Editar' : 'Crear'} Franquicia</h3>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="label-style">Nombre de la Franquicia</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-style w-full" required placeholder="Ej: Agua Pura S.A." />
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
// Store List & Modal
// ====================================================================
const StoreList = () => {
    const { state, addStore, updateStore, deleteStore } = useGestion();
    const { stores, franchises } = state;
    const [isModalOpen, setModalOpen] = useState(false);
    const [itemToEdit, setItemToEdit] = useState(null);

    const handleSave = async (data) => {
        if (itemToEdit) {
            await updateStore(itemToEdit.id, data);
        } else {
            await addStore(data);
        }
        setModalOpen(false);
        setItemToEdit(null);
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: '¿Eliminar sucursal?',
            text: 'Se perderán los historiales de ventas de esta sucursal.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            deleteStore(id);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">Listado de Sucursales</h3>
                <button onClick={() => { setItemToEdit(null); setModalOpen(true); }} className="btn-primary text-sm">
                    Nueva Sucursal
                </button>
            </div>
            
            {isModalOpen && <StoreModal itemToEdit={itemToEdit} franchises={franchises} onSave={handleSave} onClose={() => setModalOpen(false)} />}
            
            <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
                <table className="min-w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="th-style">Nombre</th>
                            <th className="th-style">Franquicia</th>
                            <th className="th-style">Dirección</th>
                            <th className="th-style">Coords</th>
                            <th className="th-style text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {stores.length === 0 ? (
                            <tr><td colSpan="5" className="p-4 text-center text-gray-500">No hay sucursales registradas.</td></tr>
                        ) : (
                            stores.map(s => (
                                <tr key={s.id}>
                                    <td className="td-style font-medium">{s.name}</td>
                                    <td className="td-style text-sm text-gray-500">{s.franchise?.name}</td>
                                    <td className="td-style text-sm">{s.address}</td>
                                    <td className="td-style text-xs font-mono">
                                        {s.latitud && s.longitud ? `${s.latitud.toFixed(4)}, ${s.longitud.toFixed(4)}` : <span className="text-red-400">Sin coords</span>}
                                    </td>
                                    <td className="td-style text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => { setItemToEdit(s); setModalOpen(true); }} className="text-primary hover:underline">Editar</button>
                                            <button onClick={() => handleDelete(s.id)} className="text-red-500 hover:underline">Eliminar</button>
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
};

const StoreModal = ({ itemToEdit, franchises, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        name: itemToEdit?.name || '',
        address: itemToEdit?.address || '',
        franchiseId: itemToEdit?.franchiseId || (franchises.length > 0 ? franchises[0].id : ''),
        latitud: itemToEdit?.latitud || '',
        longitud: itemToEdit?.longitud || ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = { ...formData };
        if (payload.latitud) payload.latitud = parseFloat(payload.latitud);
        if (payload.longitud) payload.longitud = parseFloat(payload.longitud);
        
        // Remove empty coords so backend can auto-geocode if address is present
        if (!payload.latitud) delete payload.latitud;
        if (!payload.longitud) delete payload.longitud;

        onSave(payload);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-bold mb-4">{itemToEdit ? 'Editar' : 'Crear'} Sucursal</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="label-style">Nombre de la Sucursal</label>
                        <input name="name" type="text" value={formData.name} onChange={handleChange} className="input-style w-full" required placeholder="Ej: Centro, Norte, Matriz" />
                    </div>
                    
                    <div>
                        <label className="label-style">Franquicia</label>
                        <select name="franchiseId" value={formData.franchiseId} onChange={handleChange} className="input-style w-full" required>
                            {franchises.map(f => (
                                <option key={f.id} value={f.id}>{f.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="label-style">Dirección Completa</label>
                        <textarea name="address" value={formData.address} onChange={handleChange} className="input-style w-full" rows="2" required placeholder="Calle, Número, Colonia, Ciudad, CP" />
                        <p className="text-xs text-gray-500 mt-1">Si dejas las coordenadas vacías, el sistema intentará obtenerlas automáticamente usando esta dirección.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label-style">Latitud (Opcional)</label>
                            <input name="latitud" type="number" step="any" value={formData.latitud} onChange={handleChange} className="input-style w-full" placeholder="19.4326" />
                        </div>
                        <div>
                            <label className="label-style">Longitud (Opcional)</label>
                            <input name="longitud" type="number" step="any" value={formData.longitud} onChange={handleChange} className="input-style w-full" placeholder="-99.1332" />
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

export default ManageFranchisesStores;
