import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useGestion } from "./context/GestionContext";
import Swal from 'sweetalert2';
import EmpleadoModal from "./components/EmpleadoModal";
import { toast } from "sonner";

const Empleados = () => {
  const { state, addEmpleado, updateEmpleado, deleteEmpleado } = useGestion();
  const { empleados, users, roles, stores, loading, error } = state;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [empleadoToEdit, setEmpleadoToEdit] = useState(null);

  // Filtros y Búsqueda
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODOS"); // 'TODOS' | 'ACTIVO' | 'INACTIVO'
  const [accessFilter, setAccessFilter] = useState("TODOS"); // 'TODOS' | 'CON_ACCESO' | 'SIN_ACCESO'

  const handleOpenModal = (empleado = null) => {
    setEmpleadoToEdit(empleado);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEmpleadoToEdit(null);
    setIsModalOpen(false);
  };

  const handleSaveEmpleado = async (empleado) => {
    try {
      if (empleado.id) {
        await updateEmpleado(empleado.id, empleado);
        toast.success("Expediente de empleado actualizado");
      } else {
        await addEmpleado(empleado);
        toast.success("Empleado registrado exitosamente");
      }
      handleCloseModal();
    } catch (err) {
      toast.error("Error al procesar la solicitud");
      console.error(err);
    }
  };

  const handleDelete = async (id, nombre) => {
    const result = await Swal.fire({
      title: '¿Confirmar baja de empleado?',
      text: `Se dará de baja a "${nombre || 'este colaborador'}" del sistema de Recursos Humanos.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, dar de baja',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await deleteEmpleado(id);
        toast.success("Colaborador dado de baja correctamente");
      } catch (err) {
        toast.error("Error al dar de baja al empleado");
      }
    }
  };

  // Filtrado reactivo de empleados
  const filteredEmpleados = useMemo(() => {
    return (empleados || []).filter((emp) => {
      // 1. Filtro de búsqueda por texto
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch = !term || 
        (emp.nombreCompleto && emp.nombreCompleto.toLowerCase().includes(term)) ||
        (emp.puesto && emp.puesto.toLowerCase().includes(term)) ||
        (emp.emailPersonal && emp.emailPersonal.toLowerCase().includes(term)) ||
        (emp.telefono && emp.telefono.toLowerCase().includes(term));

      // 2. Filtro por estatus laboral
      const matchesStatus = statusFilter === "TODOS" || emp.estatus === statusFilter;

      // 3. Filtro por acceso al sistema
      const hasAccess = !!emp.user || !!emp.userId;
      const matchesAccess = 
        accessFilter === "TODOS" ||
        (accessFilter === "CON_ACCESO" && hasAccess) ||
        (accessFilter === "SIN_ACCESO" && !hasAccess);

      return matchesSearch && matchesStatus && matchesAccess;
    });
  }, [empleados, searchTerm, statusFilter, accessFilter]);

  // Cálculos de métricas rápidas
  const totalCount = empleados?.length || 0;
  const activeCount = (empleados || []).filter(e => e.estatus === 'ACTIVO').length;
  const withAccessCount = (empleados || []).filter(e => e.user || e.userId).length;
  const totalSalaries = useMemo(() => {
    return (empleados || [])
      .filter(e => e.estatus === 'ACTIVO')
      .reduce((sum, e) => sum + (parseFloat(e.sueldo) || 0), 0);
  }, [empleados]);

  return (
    <div className="space-y-6 pb-20">
      {/* Modal de Crear / Editar Empleado */}
      {isModalOpen && (
        <EmpleadoModal
          onClose={handleCloseModal}
          onSave={handleSaveEmpleado}
          empleadoToEdit={empleadoToEdit}
          empleados={empleados}
          users={users}
          roles={roles}
          allStores={stores}
        />
      )}

      {/* Encabezado sin avatar al lado del título */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
              Expedientes & Nómina
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Gestión de Personal
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">
            Directorio integral de colaboradores, expedientes laborales, asignación de roles y accesos al sistema.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <Link 
            to="/gestion/recursos-humanos" 
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold text-xs hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95 transition-all border border-gray-200/60 dark:border-gray-700/60"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            <span>Panel RRHH</span>
          </Link>
          <button 
            type="button"
            onClick={() => handleOpenModal()} 
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white font-bold text-xs shadow-xs hover:bg-primary-dark active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-base">person_add</span>
            <span>Agregar Empleado</span>
          </button>
        </div>
      </div>

      {/* Resumen de Métricas de Personal */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/80 dark:border-gray-800/80 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider">Total Plantilla</span>
            <span className="material-symbols-outlined text-base text-blue-500">groups</span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">{totalCount}</p>
          <p className="text-[10px] text-gray-400 font-medium mt-0.5">Colaboradores dados de alta</p>
        </div>

        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/80 dark:border-gray-800/80 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider">Personal Activo</span>
            <span className="material-symbols-outlined text-base text-emerald-500">check_circle</span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">{activeCount}</p>
          <p className="text-[10px] text-gray-400 font-medium mt-0.5">En operación diaria</p>
        </div>

        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/80 dark:border-gray-800/80 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider">Con Acceso al Sistema</span>
            <span className="material-symbols-outlined text-base text-purple-500">key</span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400">{withAccessCount}</p>
          <p className="text-[10px] text-gray-400 font-medium mt-0.5">Usuarios vinculados</p>
        </div>

        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/80 dark:border-gray-800/80 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider">Nómina Mensual</span>
            <span className="material-symbols-outlined text-base text-primary">payments</span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
            {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(totalSalaries)}
          </p>
          <p className="text-[10px] text-gray-400 font-medium mt-0.5">Sueldo neto colaboradores activos</p>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/80 dark:border-gray-800/80 p-3 sm:p-4 rounded-3xl shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Input de Búsqueda */}
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
              search
            </span>
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, puesto, email o teléfono..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/60 rounded-xl text-xs font-bold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
            />
            {searchTerm && (
              <button 
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            )}
          </div>

          {/* Filtros de Estatus y Acceso */}
          <div className="flex flex-wrap items-center gap-2">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/60 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-700 dark:text-gray-300 focus:outline-none cursor-pointer"
            >
              <option value="TODOS">Todos los Estatus</option>
              <option value="ACTIVO">Solo Activos</option>
              <option value="INACTIVO">Solo Inactivos (Baja)</option>
            </select>

            <select 
              value={accessFilter}
              onChange={(e) => setAccessFilter(e.target.value)}
              className="bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/60 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-700 dark:text-gray-300 focus:outline-none cursor-pointer"
            >
              <option value="TODOS">Todos los Accesos</option>
              <option value="CON_ACCESO">Con Cuenta de Sistema</option>
              <option value="SIN_ACCESO">Sin Cuenta</option>
            </select>

            {(searchTerm || statusFilter !== "TODOS" || accessFilter !== "TODOS") && (
              <button 
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("TODOS");
                  setAccessFilter("TODOS");
                }}
                className="px-3 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white flex items-center gap-1 transition-colors"
                title="Limpiar filtros"
              >
                <span className="material-symbols-outlined text-sm">filter_alt_off</span>
                <span className="hidden sm:inline">Limpiar</span>
              </button>
            )}
          </div>
        </div>

        {/* Contador de resultados */}
        <div className="flex items-center justify-between text-[11px] text-gray-400 font-medium px-1">
          <span>Mostrando <strong>{filteredEmpleados.length}</strong> de {totalCount} colaboradores</span>
          {filteredEmpleados.length !== totalCount && (
            <span className="text-primary font-bold">Filtros activos</span>
          )}
        </div>
      </div>

      {/* Contenedor Principal: Tabla en Escritorio / Tarjetas en Móvil */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-200/80 dark:border-gray-800/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-gray-400 font-bold uppercase tracking-widest animate-pulse text-xs">
            Cargando expedientes de personal...
          </div>
        ) : error ? (
          <div className="p-16 text-center text-rose-500 font-bold text-sm">
            Error al consultar personal: {error}
          </div>
        ) : filteredEmpleados.length === 0 ? (
          <div className="p-16 text-center text-gray-400 space-y-2">
            <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600">
              person_search
            </span>
            <p className="text-sm font-bold text-gray-600 dark:text-gray-300">
              No se encontraron colaboradores que coincidan con la búsqueda
            </p>
            <p className="text-xs text-gray-400">
              Prueba modificando los términos del filtro o agrega un nuevo colaborador.
            </p>
          </div>
        ) : (
          <>
            {/* Tabla en Escritorio (md en adelante) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full text-left">
                <thead>
                  <tr className="bg-gray-50/70 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 text-[11px] font-black text-gray-400 uppercase tracking-wider">
                    <th className="px-6 py-4">Personal / Colaborador</th>
                    <th className="px-6 py-4">Sueldo Actual</th>
                    <th className="px-6 py-4">Acceso al Sistema</th>
                    <th className="px-6 py-4">Estatus</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredEmpleados.map((empleado) => (
                    <tr key={empleado.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors group">
                      {/* Personal / Colaborador */}
                      <td className="px-6 py-4">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight truncate">
                            {empleado.nombreCompleto}
                          </p>
                          <p className="text-[11px] text-gray-400 font-medium truncate mt-0.5">
                            {empleado.puesto || 'Sin puesto asignado'}
                          </p>
                        </div>
                      </td>

                      {/* Sueldo Actual */}
                      <td className="px-6 py-4">
                        <p className="text-sm font-black text-gray-900 dark:text-white">
                          {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(empleado.sueldo || 0)}
                        </p>
                        <p className="text-[10px] text-gray-400 font-medium">Neto Mensual</p>
                      </td>

                      {/* Acceso al Sistema */}
                      <td className="px-6 py-4">
                        {empleado.user || empleado.userId ? (
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                              Con acceso
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-gray-400">
                            <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                            <span className="text-[11px] font-medium italic">Sin cuenta de acceso</span>
                          </div>
                        )}
                      </td>

                      {/* Estatus */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          empleado.estatus === "ACTIVO" 
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800" 
                            : "bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${empleado.estatus === "ACTIVO" ? "bg-emerald-500" : "bg-rose-500"}`}></span>
                          <span>{empleado.estatus}</span>
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link 
                            to={`/gestion/recursos-humanos/${empleado.id}`} 
                            className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                            title="Ver Expediente Completo"
                          >
                            <span className="material-symbols-outlined text-lg">folder_managed</span>
                          </Link>
                          <button 
                            type="button"
                            onClick={() => handleOpenModal(empleado)} 
                            className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                            title="Editar Datos"
                          >
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleDelete(empleado.id, empleado.nombreCompleto)} 
                            className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all"
                            title="Dar de Baja"
                          >
                            <span className="material-symbols-outlined text-lg">person_off</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Vista de Tarjetas para Móviles (sin hover requeridos) */}
            <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800 p-2">
              {filteredEmpleados.map((empleado) => (
                <div key={empleado.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                        {empleado.nombreCompleto}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate mt-0.5">
                        {empleado.puesto || 'Sin puesto'}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase flex-shrink-0 ${
                      empleado.estatus === "ACTIVO" 
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-200" 
                        : "bg-rose-50 text-rose-600 border border-rose-200"
                    }`}>
                      {empleado.estatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="bg-gray-50 dark:bg-gray-800/60 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800">
                      <p className="text-[10px] text-gray-400 uppercase font-black">Sueldo Mensual</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">
                        {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(empleado.sueldo || 0)}
                      </p>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800/60 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800">
                      <p className="text-[10px] text-gray-400 uppercase font-black">Acceso Sistema</p>
                      <p className={`text-xs font-bold mt-0.5 truncate ${
                        empleado.user || empleado.userId ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500 italic'
                      }`}>
                        {empleado.user || empleado.userId ? 'Con acceso' : 'Sin cuenta de acceso'}
                      </p>
                    </div>
                  </div>

                  {/* Botones de Acción Accesibles para Pantallas Táctiles */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                    <Link 
                      to={`/gestion/recursos-humanos/${empleado.id}`} 
                      className="flex items-center justify-center gap-1 py-2 px-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold active:scale-95 transition-all"
                    >
                      <span className="material-symbols-outlined text-sm">folder_managed</span>
                      <span>Expediente</span>
                    </Link>

                    <button 
                      type="button"
                      onClick={() => handleOpenModal(empleado)} 
                      className="flex items-center justify-center gap-1 py-2 px-2 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 rounded-xl text-xs font-bold active:scale-95 transition-all"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                      <span>Editar</span>
                    </button>

                    <button 
                      type="button"
                      onClick={() => handleDelete(empleado.id, empleado.nombreCompleto)} 
                      className="flex items-center justify-center gap-1 py-2 px-2 bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 rounded-xl text-xs font-bold active:scale-95 transition-all"
                    >
                      <span className="material-symbols-outlined text-sm">person_off</span>
                      <span>Baja</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Empleados;
