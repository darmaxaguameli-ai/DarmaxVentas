import { useState, useEffect } from "react";
import { FaUserShield, FaKey, FaUserCheck, FaInfoCircle, FaTimes, FaSpinner, FaEnvelope } from "react-icons/fa";
import apiClient from "@/api/apiClient";

const EmpleadoModal = ({ onClose, empleadoToEdit, onSave, empleados = [], users = [], roles = [] }) => {
  // El interruptor se inicializa según si el empleado ya tiene una cuenta vinculada
  const [systemAccessEnabled, setSystemAccessEnabled] = useState(!!empleadoToEdit?.userId);
  const [changePassword, setChangePassword] = useState(false);
  const [localRoles, setLocalRoles] = useState(roles || []);
  const [loadingRoles, setLoadingRoles] = useState(false);
  
  const initialEmpleadoState = {
    nombreCompleto: "",
    puesto: "",
    sueldo: 0,
    telefono: "",
    emailPersonal: "", 
    street: "",
    neighborhood: "",
    city: "",
    postalCode: "",
    fechaContratacion: new Date().toISOString().split('T')[0],
    estatus: "ACTIVO",
    userId: null,
    managerId: null,
    password: "",
    roleId: ""
  };

  const [empleado, setEmpleado] = useState(() => {
    if (empleadoToEdit) {
        return {
            ...initialEmpleadoState,
            ...empleadoToEdit,
            fechaContratacion: new Date(empleadoToEdit.fechaContratacion).toISOString().split('T')[0],
            sueldo: parseFloat(empleadoToEdit.sueldo || 0),
            managerId: empleadoToEdit.managerId || null,
            userId: empleadoToEdit.userId || null,
            roleId: empleadoToEdit.user?.roleId || ""
        };
    }
    return initialEmpleadoState;
  });

  useEffect(() => {
    if (!localRoles || localRoles.length === 0) {
        const fetchRoles = async () => {
            try {
                setLoadingRoles(true);
                const response = await apiClient.get('/roles');
                setLocalRoles(response.data || []);
            } catch (error) {
                console.error("Error cargando roles:", error);
            } finally {
                setLoadingRoles(false);
            }
        };
        fetchRoles();
    }
  }, [roles]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Si seleccionamos vincular una cuenta existente
    if (name === "userId" && value) {
      const selectedUser = users.find(u => u.id === value);
      if (selectedUser) {
        setEmpleado(prev => ({
          ...prev,
          userId: value,
          nombreCompleto: prev.nombreCompleto || selectedUser.name || "",
          emailPersonal: prev.emailPersonal || selectedUser.email || "",
          telefono: prev.telefono || selectedUser.phone || "",
          roleId: selectedUser.roleId || ""
        }));
        setSystemAccessEnabled(true); // Activar el switch automáticamente al vincular
        return;
      }
    }

    setEmpleado((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : (value ?? "") }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const empleadoData = { ...empleado };

    empleadoData.sueldo = parseFloat(empleadoData.sueldo);
    
    const fieldsToNullify = ['telefono', 'emailPersonal', 'street', 'neighborhood', 'city', 'postalCode', 'managerId', 'userId'];
    fieldsToNullify.forEach(field => {
      if (empleadoData[field] === "" || empleadoData[field] === "null" || empleadoData[field] === null) {
        empleadoData[field] = null;
      }
    });

    // Lógica de Acceso al Sistema
    if (systemAccessEnabled) {
        if (!empleado.userId) {
            // Caso: Crear cuenta nueva
            empleadoData._createAccount = {
                email: empleado.emailPersonal,
                password: empleado.password,
                roleId: empleado.roleId
            };
        } else {
            // Caso: Ya tiene cuenta, verificar si cambió contraseña
            if (changePassword && empleado.password) {
                empleadoData.newPassword = empleado.password;
            }
        }
    } else {
        // Si el switch está apagado, nos aseguramos de que no haya userId vinculado
        empleadoData.userId = null;
    }

    onSave(empleadoData);
    onClose();
  };

  const isEditing = !!empleadoToEdit;
  const potentialManagers = empleados.filter(e => e.id !== empleadoToEdit?.id);

  const availableUsers = users.filter(u => {
    const isStaff = u.role !== 'CLIENTE';
    if (!isStaff) return false;
    const isAlreadyLinked = empleados.some(e => e.userId === u.id && e.id !== empleadoToEdit?.id);
    return !isAlreadyLinked;
  });

  const staffRoles = (localRoles || []).filter(r => r.name !== 'CLIENTE');

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/20">
            <h2 className="text-xl font-black text-gray-800 dark:text-white uppercase tracking-tight flex items-center gap-3">
                <span className="p-2 bg-primary/10 text-primary rounded-xl">
                    <FaUserCheck />
                </span>
                {isEditing ? "Editar Expediente" : "Nuevo Ingreso de Personal"}
            </h2>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                <FaTimes size={20} />
            </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-full md:col-span-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Nombre Completo</label>
                <input name="nombreCompleto" value={empleado.nombreCompleto || ""} onChange={handleChange} required className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-2 font-bold focus:ring-2 focus:ring-primary outline-none uppercase" />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Email del Empleado</label>
                <div className="relative">
                    <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input name="emailPersonal" type="email" value={empleado.emailPersonal || ""} onChange={handleChange} required className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl font-bold focus:ring-2 focus:ring-primary outline-none" placeholder="ejemplo@darmax.com" />
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN DE ACCESO AL SISTEMA */}
          <div className="p-5 bg-primary/5 dark:bg-primary/10 rounded-2xl border border-primary/20">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                        <FaUserShield className="text-primary" />
                        <span className="text-sm font-black text-primary uppercase tracking-widest">
                            Acceso al Sistema
                        </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={systemAccessEnabled}
                            onChange={(e) => setSystemAccessEnabled(e.target.checked)}
                            className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                    </label>
                </div>

                {systemAccessEnabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Rol / Puesto en Sistema</label>
                            <select 
                                name="roleId" 
                                value={empleado.roleId} 
                                onChange={handleChange} 
                                required={systemAccessEnabled}
                                className="w-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                                disabled={loadingRoles}
                            >
                                {loadingRoles ? (
                                    <option>Cargando roles...</option>
                                ) : (
                                    <>
                                        <option value="">-- Seleccionar Rol --</option>
                                        {staffRoles.map(role => (
                                            <option key={role.id} value={role.id}>{role.name}</option>
                                        ))}
                                    </>
                                )}
                            </select>
                        </div>

                        <div>
                            {!empleado.userId ? (
                                <>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Contraseña de Acceso</label>
                                    <div className="relative">
                                        <FaKey className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                                        <input 
                                            name="password" 
                                            type="password" 
                                            value={empleado.password || ""} 
                                            onChange={handleChange} 
                                            required={systemAccessEnabled}
                                            placeholder="Definir contraseña"
                                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col h-full justify-center">
                                    {!changePassword ? (
                                        <button 
                                            type="button"
                                            onClick={() => setChangePassword(true)}
                                            className="text-[10px] font-bold text-primary uppercase hover:underline flex items-center gap-1"
                                        >
                                            <FaKey className="text-[8px]" /> Cambiar contraseña de acceso
                                        </button>
                                    ) : (
                                        <div className="relative animate-in zoom-in-95 duration-200">
                                            <FaKey className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
                                            <input 
                                                name="password" 
                                                type="password" 
                                                value={empleado.password || ""} 
                                                onChange={handleChange} 
                                                placeholder="Nueva contraseña"
                                                className="w-full pl-10 pr-10 py-2 bg-white dark:bg-gray-900 border border-primary/30 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary"
                                            />
                                            <button 
                                                type="button" 
                                                onClick={() => {setChangePassword(false); setEmpleado({...empleado, password: ""})}}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
                                            >
                                                <FaTimes size={12} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Opción de vincular cuenta existente solo si no hay una vinculada y el switch está apagado */}
                {!systemAccessEnabled && !empleado.userId && (
                    <div className="col-span-full mt-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Vincular cuenta existente (Opcional)</label>
                        <select 
                            name="userId" 
                            value={empleado.userId || ""} 
                            onChange={handleChange} 
                            className="w-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-2 text-sm font-bold outline-none"
                        >
                            <option value="">-- No vincular cuenta --</option>
                            {availableUsers.map(user => (
                                <option key={user.id} value={user.id}>{user.name} ({user.roleRelation?.name || user.role})</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

          {/* OTROS DATOS LABORALES */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 dark:border-gray-700 pb-2">Información Laboral</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Puesto Laboral</label>
                <input name="puesto" value={empleado.puesto || ""} onChange={handleChange} required className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-2 font-bold focus:ring-2 focus:ring-primary outline-none uppercase" />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Sueldo Mensual</label>
                <input name="sueldo" type="number" step="0.01" value={empleado.sueldo || 0} onChange={handleChange} required className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-2 font-bold focus:ring-2 focus:ring-primary outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Teléfono</label>
                <input name="telefono" value={empleado.telefono || ""} onChange={handleChange} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-2 font-bold focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Fecha Contratación</label>
                <input name="fechaContratacion" type="date" value={empleado.fechaContratacion || ""} onChange={handleChange} required className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-2 font-bold focus:ring-2 focus:ring-primary outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Jefe Inmediato</label>
                    <select name="managerId" value={empleado.managerId || ""} onChange={handleChange} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-2 font-bold outline-none focus:ring-2 focus:ring-primary">
                        <option value="">Ninguno (Reporta a Dirección)</option>
                        {potentialManagers.map(m => (
                            <option key={m.id} value={m.id}>{m.nombreCompleto}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Estatus Laboral</label>
                    <select name="estatus" value={empleado.estatus || "ACTIVO"} onChange={handleChange} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-2 font-bold outline-none focus:ring-2 focus:ring-primary">
                        <option value="ACTIVO">ACTIVO</option>
                        <option value="INACTIVO">INACTIVO</option>
                    </select>
                </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-50 dark:border-gray-700 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-500 font-black rounded-xl uppercase text-[10px] tracking-widest hover:bg-gray-200 transition-all">Cancelar</button>
            <button type="submit" className="px-8 py-2.5 bg-primary text-white font-black rounded-xl uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-95 transition-all">
                {isEditing ? "Actualizar Expediente" : "Finalizar Registro"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmpleadoModal;
