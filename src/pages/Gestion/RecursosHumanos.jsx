import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useGestion } from './context/GestionContext';

const EstatusEmpleado = {
  ACTIVO: "ACTIVO",
  INACTIVO: "INACTIVO"
};

const TipoTerminacion = {
  RENUNCIA: "RENUNCIA",
  DESPIDO: "DESPIDO",
  LIQUIDACION: "LIQUIDACION"
};


const EmpleadoModal = ({ isOpen, onClose, onSave, empleadoToEdit, empleados }) => {
    const isEditing = !!empleadoToEdit;
    const [empleado, setEmpleado] = useState(null);

    React.useEffect(() => {
        if (isOpen) {
            const initialData = isEditing ? { ...empleadoToEdit } : {
                nombreCompleto: '',
                puesto: '',
                sueldo: '',
                telefono: '',
                emailPersonal: '',
                street: '',
                neighborhood: '',
                city: '',
                postalCode: '',
                fechaContratacion: new Date().toISOString().slice(0, 10),
                estatus: EstatusEmpleado.ACTIVO,
                fechaTerminacion: '',
                tipoTerminacion: '',
                managerId: '',
            };
             if (isEditing) {
                initialData.fechaContratacion = initialData.fechaContratacion ? new Date(initialData.fechaContratacion).toISOString().slice(0, 10) : '';
                initialData.fechaTerminacion = initialData.fechaTerminacion ? new Date(initialData.fechaTerminacion).toISOString().slice(0, 10) : '';
                initialData.managerId = initialData.managerId || '';
            }
            setEmpleado(initialData);
        }
    }, [isOpen, empleadoToEdit, isEditing]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        let finalValue = value;
        if (name === 'sueldo') {
            finalValue = value === '' ? '' : parseFloat(value);
        }
        setEmpleado(prev => ({...prev, [name]: finalValue}));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const dataToSave = { ...empleado };
        if (dataToSave.managerId === '') {
            dataToSave.managerId = null;
        }
        onSave(dataToSave);
        onClose();
    };

    if (!isOpen || !empleado) return null;

    const potentialManagers = empleados.filter(e => e.id !== empleado.id);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-2xl">
                <h2 className="text-2xl font-bold mb-6 text-[#111418] dark:text-white">
                    {isEditing ? 'Editar Empleado' : 'Agregar Nuevo Empleado'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input name="nombreCompleto" value={empleado.nombreCompleto} onChange={handleChange} placeholder="Nombre Completo" className="input-style" required />
                        <input name="puesto" value={empleado.puesto} onChange={handleChange} placeholder="Puesto" className="input-style" required />
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input name="sueldo" type="number" step="0.01" value={empleado.sueldo} onChange={handleChange} placeholder="Sueldo" className="input-style" required />
                        <input name="telefono" value={empleado.telefono || ''} onChange={handleChange} placeholder="Teléfono" className="input-style" />
                    </div>
                    <input name="emailPersonal" type="email" value={empleado.emailPersonal || ''} onChange={handleChange} placeholder="Email Personal" className="input-style" />
                    
                    {/* Address */}
                    <hr className="my-4 border-gray-200 dark:border-gray-700" />
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">Dirección</h3>
                    <input name="street" value={empleado.street || ''} onChange={handleChange} placeholder="Calle y Número" className="input-style" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input name="neighborhood" value={empleado.neighborhood || ''} onChange={handleChange} placeholder="Colonia" className="input-style" />
                        <input name="city" value={empleado.city || ''} onChange={handleChange} placeholder="Ciudad" className="input-style" />
                    </div>
                    <input name="postalCode" value={empleado.postalCode || ''} onChange={handleChange} placeholder="Código Postal" className="input-style" />

                    {/* HR Info */}
                    <hr className="my-4 border-gray-200 dark:border-gray-700" />
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">Información de RRHH</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="label-style">Fecha de Contratación</label>
                            <input name="fechaContratacion" type="date" value={empleado.fechaContratacion} onChange={handleChange} className="input-style" required />
                        </div>
                        <div>
                           <label className="label-style">Estatus</label>
                           <select name="estatus" value={empleado.estatus} onChange={handleChange} className="input-style">
                               {Object.values(EstatusEmpleado).map(s => <option key={s} value={s}>{s}</option>)}
                           </select>
                        </div>
                    </div>

                    <div>
                        <label className="label-style">Jefe Inmediato (Manager)</label>
                        <select name="managerId" value={empleado.managerId} onChange={handleChange} className="input-style">
                            <option value="">Sin Jefe</option>
                            {potentialManagers.map(p => <option key={p.id} value={p.id}>{p.nombreCompleto}</option>)}
                        </select>
                    </div>

                    {empleado.estatus === EstatusEmpleado.INACTIVO && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                            <div>
                                <label className="label-style">Fecha de Terminación</label>
                                <input name="fechaTerminacion" type="date" value={empleado.fechaTerminacion || ''} onChange={handleChange} className="input-style" />
                            </div>
                            <div>
                               <label className="label-style">Motivo de Terminación</label>
                               <select name="tipoTerminacion" value={empleado.tipoTerminacion || ''} onChange={handleChange} className="input-style">
                                   <option value="">Seleccionar...</option>
                                   {Object.values(TipoTerminacion).map(t => <option key={t} value={t}>{t}</option>)}
                               </select>
                            </div>
                        </div>
                    )}
                    
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
                        <button type="submit" className="btn-primary">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const RecursosHumanos = () => {
    const { state, addEmpleado, updateEmpleado, deleteEmpleado } = useGestion();
    const { empleados, loading, error } = state;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [empleadoToEdit, setEmpleadoToEdit] = useState(null);

    const handleOpenModal = (empleado = null) => {
        setEmpleadoToEdit(empleado);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEmpleadoToEdit(null);
        setIsModalOpen(false);
    };

    const handleSaveEmpleado = (empleadoData) => {
        if (empleadoToEdit) {
            updateEmpleado(empleadoToEdit.id, empleadoData);
        } else {
            addEmpleado(empleadoData);
        }
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
            deleteEmpleado(id);
        }
    };

    const EstatusBadge = ({ estatus }) => {
        const styles = estatus === 'ACTIVO' 
            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
        return <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${styles}`}>{estatus}</span>;
    };

    const formatCurrency = (value) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value || 0);
    const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric'}) : 'N/A';

    return (
        <div>
            <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold text-[#111418] dark:text-white">Recursos Humanos</h1>
                <button onClick={() => handleOpenModal()} className="btn-primary">Agregar Empleado</button>
            </div>
            
            <EmpleadoModal 
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveEmpleado}
                empleadoToEdit={empleadoToEdit}
            />

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
                <table className="min-w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="th-style">Nombre</th>
                            <th className="th-style">Puesto</th>
                            <th className="th-style">Sueldo</th>
                            <th className="th-style">Estatus</th>
                            <th className="th-style">Fecha Contratación</th>
                            <th className="th-style text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                         {loading && !empleados.length ? (
                            <tr><td colSpan="6" className="p-6 text-center">Cargando...</td></tr>
                        ) : error ? (
                            <tr><td colSpan="6" className="p-6 text-center text-red-500">{error}</td></tr>
                        ) : (
                            empleados.map(empleado => (
                                <tr key={empleado.id}>
                                    <td className="td-style font-medium">{empleado.nombreCompleto}</td>
                                    <td className="td-style">{empleado.puesto}</td>
                                    <td className="td-style">{formatCurrency(empleado.sueldo)}</td>
                                    <td className="td-style"><EstatusBadge estatus={empleado.estatus} /></td>
                                    <td className="td-style">{formatDate(empleado.fechaContratacion)}</td>
                                    <td className="td-style text-right space-x-4">
                                        <Link to={`/gestion/recursos-humanos/${empleado.id}`} className="text-primary hover:text-primary/90 font-medium">
                                            Ver Detalles
                                        </Link>
                                        <button onClick={() => handleDelete(empleado.id)} className="text-red-500 hover:text-red-700 font-medium">Eliminar</button>
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

export default RecursosHumanos;
