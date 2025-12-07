import { useState } from "react";
import { Link } from "react-router-dom";
import { useGestion } from "./context/GestionContext";
import Swal from 'sweetalert2'; // Importar SweetAlert2
import EmpleadoModal from "./components/EmpleadoModal";

const Empleados = () => {
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

  const handleSaveEmpleado = (empleado) => {
    if (empleado.id) {
      updateEmpleado(empleado.id, empleado); // edición
    } else {
      addEmpleado(empleado); // creación
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

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-[#111418] dark:text-white">
          Gestión de Empleados
        </h1>
        <div className="flex gap-2">
          <Link to="/gestion/recursos-humanos" className="btn-secondary">
            &larr; Volver a RRHH
          </Link>
          <button onClick={() => handleOpenModal()} className="btn-primary">
            Agregar Empleado
          </button>
        </div>
      </div>

      {isModalOpen && (
        <EmpleadoModal
          onClose={handleCloseModal}
          onSave={handleSaveEmpleado}
          empleadoToEdit={empleadoToEdit}
        />
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="th-style">ID</th>
              <th className="th-style">Nombre</th>
              <th className="th-style">Email Personal</th>
              <th className="th-style">Teléfono</th>
              <th className="th-style">Puesto</th>
              <th className="th-style text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <tr>
                <td
                  colSpan="6"
                  className="p-6 text-center text-gray-500 dark:text-gray-400"
                >
                  Cargando empleados...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="6" className="p-6 text-center text-red-500">
                  Error al cargar empleados: {error}
                </td>
              </tr>
            ) : empleados.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  className="p-6 text-center text-gray-500 dark:text-gray-400"
                >
                  No hay empleados registrados.
                </td>
              </tr>
            ) : (
              empleados.map((empleado) => (
                <tr key={empleado.id}>
                  <td className="td-style font-mono text-xs">
                    {empleado.id}
                  </td>
                  <td className="td-style font-medium">{empleado.nombreCompleto}</td>
                  <td className="td-style">{empleado.emailPersonal || "N/A"}</td>
                  <td className="td-style">{empleado.telefono || "N/A"}</td>
                  <td className="td-style">{empleado.puesto || "N/A"}</td>
                  <td className="td-style text-right space-x-4">
                    <button
                      onClick={() => handleOpenModal(empleado)}
                      className="text-primary hover:text-primary/90 font-medium"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(empleado.id)}
                      className="text-red-500 hover:text-red-700 font-medium"
                    >
                      Eliminar
                    </button>
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