import { useState } from "react";
import { Link } from "react-router-dom";
import { useGestion } from "./context/GestionContext";
import Swal from 'sweetalert2';
import EmpleadoModal from "./components/EmpleadoModal";
import { FaUserTie, FaPlus, FaArrowLeft, FaIdCard, FaDollarSign, FaUserShield } from 'react-icons/fa';

const Empleados = () => {
  const { state, addEmpleado, updateEmpleado, deleteEmpleado } = useGestion();
  const { empleados, users, roles, loading, error } = state;

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

  const handleSaveEmpleado = (empleado) => {
    if (empleado.id) {
      updateEmpleado(empleado.id, empleado);
    } else {
      addEmpleado(empleado);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: 'Esta acción dará de baja al empleado en el sistema de RRHH.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      deleteEmpleado(id);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
        <div>
            <h1 className="text-3xl font-black text-gray-800 dark:text-white flex items-center gap-3 uppercase tracking-tighter">
                <span className="p-2 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-xl">
                    <FaUserTie />
                </span>
                Gestión de Personal
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Administra expedientes de RRHH y accesos al sistema.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/gestion/recursos-humanos" className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl font-bold text-xs uppercase hover:bg-gray-200 transition-all">
            <FaArrowLeft /> Panel RRHH
          </Link>
          <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2 shadow-lg shadow-primary/20">
            <FaPlus /> Agregar Empleado
          </button>
        </div>
      </div>

      {isModalOpen && (
        <EmpleadoModal
          onClose={handleCloseModal}
          onSave={handleSaveEmpleado}
          empleadoToEdit={empleadoToEdit}
          empleados={empleados}
          users={users}
          roles={roles}
        />
      )}

      <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800">
              <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Personal</th>
              <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Sueldo Actual</th>
              <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Acceso Sistema</th>
              <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Estatus</th>
              <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {loading ? (
              <tr>
                <td colSpan="5" className="p-12 text-center text-gray-400 font-bold uppercase tracking-widest animate-pulse">
                  Cargando Personal...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="5" className="p-12 text-center text-red-500 font-bold">
                  Error: {error}
                </td>
              </tr>
            ) : empleados.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-12 text-center text-gray-400 font-bold italic">
                  No hay empleados registrados.
                </td>
              </tr>
            ) : (
              empleados.map((empleado) => (
                <tr key={empleado.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/40 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-black shadow-inner">
                            {empleado.nombreCompleto.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-800 dark:text-white leading-tight uppercase tracking-tight">{empleado.nombreCompleto}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">{empleado.puesto}</p>
                        </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-black text-gray-800 dark:text-gray-200">
                        {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(empleado.sueldo)}
                    </p>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Mensuales</p>
                  </td>
                  <td className="px-6 py-4">
                    {empleado.user ? (
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Activo</span>
                                <span className="text-[9px] text-gray-400 font-bold opacity-70">
                                    {empleado.user.roleRelation?.name || empleado.user.role}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 opacity-40">
                            <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sin Cuenta</span>
                        </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest inline-block ${
                      empleado.estatus === "ACTIVO" 
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800" 
                      : "bg-red-50 text-red-600 border border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
                    }`}>
                      {empleado.estatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link 
                            to={`/gestion/recursos-humanos/${empleado.id}`} 
                            className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                            title="Ver Expediente Completo"
                        >
                            <span className="material-symbols-outlined text-lg">folder_managed</span>
                        </Link>
                        <button 
                            onClick={() => handleOpenModal(empleado)} 
                            className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                            title="Editar Datos"
                        >
                            <span className="material-symbols-outlined text-lg">edit</span>
                        </button>
                        <button 
                            onClick={() => handleDelete(empleado.id)} 
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="Dar de Baja"
                        >
                            <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
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

export default Empleados;
