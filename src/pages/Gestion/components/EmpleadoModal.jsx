import { useState, useEffect } from "react";
import { FaUserShield, FaKey, FaUserCheck, FaTimes, FaEnvelope, FaMapMarkerAlt, FaBriefcase, FaCheck, FaInfoCircle } from "react-icons/fa";
import apiClient from "@/api/apiClient";

const EmpleadoModal = ({ onClose, empleadoToEdit, onSave, empleados = [], users = [], roles = [] }) => {
  const [systemAccessEnabled, setSystemAccessEnabled] = useState(!!empleadoToEdit?.userId);
  const [changePassword, setChangePassword] = useState(false);
  const [localRoles, setLocalRoles] = useState(roles || []);
  const [loadingRoles, setLoadingRoles] = useState(false);
  
  const initialEmpleadoState = {
    nombreCompleto: "",
    puesto: "",
    sueldo: 0,
    sexo: "", // Nuevo campo
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
    roleIds: [] // Lista de roles para RBAC v2
  };

  const [empleado, setEmpleado] = useState(() => {
    if (empleadoToEdit) {
        // Extraer IDs de roles actuales si existen en el objeto user vinculado
        const currentRoleIds = empleadoToEdit.user?.roles?.map(r => r.id) || 
                             (empleadoToEdit.user?.roleId ? [empleadoToEdit.user.roleId] : []);

        return {
            ...initialEmpleadoState,
            ...empleadoToEdit,
            fechaContratacion: new Date(empleadoToEdit.fechaContratacion).toISOString().split('T')[0],
            sueldo: parseFloat(empleadoToEdit.sueldo || 0),
            sexo: empleadoToEdit.sexo || empleadoToEdit.user?.sexo || "", // Cargar de empleado o usuario
            managerId: empleadoToEdit.managerId || null,
            userId: empleadoToEdit.userId || null,
            roleIds: currentRoleIds
        };
    }
    return initialEmpleadoState;
  });

  useEffect(() => {
    if (roles && roles.length > 0) {
        setLocalRoles(roles);
    }
  }, [roles]);

  useEffect(() => {
    // Si por alguna razón no hay roles y el contexto no los cargó, fetch de respaldo
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
  }, []); // Solo al montar como respaldo extremo

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === "userId" && value) {
      const selectedUser = users.find(u => u.id === value);
      if (selectedUser) {
        setEmpleado(prev => ({
          ...prev,
          userId: value,
          nombreCompleto: prev.nombreCompleto || selectedUser.name || "",
          emailPersonal: prev.emailPersonal || selectedUser.email || "",
          telefono: prev.telefono || selectedUser.phone || "",
          sexo: prev.sexo || selectedUser.sexo || "", // Vincular sexo del usuario
          roleIds: selectedUser.roles?.map(r => r.id) || (selectedUser.roleId ? [selectedUser.roleId] : [])
        }));
        setSystemAccessEnabled(true);
        return;
      }
    }

    setEmpleado((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : (value ?? "") }));
  };

  const toggleRoleId = (roleId) => {
      setEmpleado(prev => {
          const isSelected = prev.roleIds.includes(roleId);
          return {
              ...prev,
              roleIds: isSelected 
                ? prev.roleIds.filter(id => id !== roleId) 
                : [...prev.roleIds, roleId]
          };
      });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const empleadoData = { ...empleado };

    empleadoData.sueldo = parseFloat(empleadoData.sueldo);
    
    const fieldsToNullify = ['telefono', 'emailPersonal', 'street', 'neighborhood', 'city', 'postalCode', 'managerId', 'userId', 'sexo'];
    fieldsToNullify.forEach(field => {
      if (empleadoData[field] === "" || empleadoData[field] === "null" || empleadoData[field] === null) {
        empleadoData[field] = null;
      }
    });

    if (systemAccessEnabled) {
        if (!empleado.userId) {
            empleadoData._createAccount = {
                email: empleado.emailPersonal,
                password: empleado.password,
                sexo: empleado.sexo, // ✅ Incluir sexo al crear cuenta
                roleIds: empleado.roleIds 
            };
        } else {
            if (changePassword && empleado.password) {
                empleadoData.newPassword = empleado.password;
            }
            empleadoData.sexo = empleado.sexo; // ✅ Incluir sexo en actualización
            empleadoData.roleIds = empleado.roleIds;
        }
    } else {
        empleadoData.userId = null;
    }

    onSave(empleadoData);
    onClose();
  };

  const isEditing = !!empleadoToEdit;
  const potentialManagers = empleados.filter(e => e.id !== empleadoToEdit?.id);
  const staffRoles = (localRoles || []).filter(r => r.name !== 'CLIENTE');

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/20">
            <h2 className="text-xl font-black text-gray-800 dark:text-white uppercase tracking-tight flex items-center gap-3">
                <span className="p-2 bg-primary/10 text-primary rounded-xl">
                    <FaUserCheck />
                </span>
                {isEditing ? "Editar Expediente" : "Nuevo Ingreso"}
            </h2>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                <FaTimes size={20} />
            </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8 max-h-[85vh] overflow-y-auto custom-scrollbar">
          
          {/* DATOS PERSONALES */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <FaInfoCircle className="text-gray-400" />
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Datos Identificativos</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-full md:col-span-1">
                <label className="text-[10px] font-black text-gray-400 uppercase block mb-1.5 ml-1 italic">Nombre Completo</label>
                <input name="nombreCompleto" value={empleado.nombreCompleto || ""} onChange={handleChange} required className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-primary outline-none uppercase" />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase block mb-1.5 ml-1 italic">Email Personal / Acceso</label>
                <div className="relative">
                    <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input name="emailPersonal" type="email" value={empleado.emailPersonal || ""} onChange={handleChange} required className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl font-bold focus:ring-2 focus:ring-primary outline-none" placeholder="ejemplo@darmax.com" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase block mb-1.5 ml-1 italic">Sexo</label>
                <select name="sexo" value={empleado.sexo || ""} onChange={handleChange} required className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-primary outline-none">
                    <option value="">Selecciona...</option>
                    <option value="HOMBRE">HOMBRE</option>
                    <option value="MUJER">MUJER</option>
                    <option value="OTRO">OTRO</option>
                </select>
              </div>
            </div>
          </div>

          {/* DIRECCIÓN */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <FaMapMarkerAlt className="text-gray-400" />
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Domicilio del Colaborador</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase block mb-1.5 ml-1 italic">Calle y Número</label>
                    <input name="street" value={empleado.street || ""} onChange={handleChange} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-2.5 font-bold focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase block mb-1.5 ml-1 italic">Código Postal</label>
                    <input name="postalCode" value={empleado.postalCode || ""} onChange={handleChange} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-2.5 font-bold focus:ring-2 focus:ring-primary outline-none" maxLength="5" />
                </div>
                <div className="md:col-span-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase block mb-1.5 ml-1 italic">Colonia</label>
                    <input name="neighborhood" value={empleado.neighborhood || ""} onChange={handleChange} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-2.5 font-bold focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase block mb-1.5 ml-1 italic">Ciudad/Estado</label>
                    <input name="city" value={empleado.city || ""} onChange={handleChange} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-2.5 font-bold focus:ring-2 focus:ring-primary outline-none" />
                </div>
            </div>
          </div>

          {/* ACCESO AL SISTEMA (REDISEÑADO PARA MULTI-ROL) */}
          <div className="p-6 bg-blue-50/50 dark:bg-blue-900/10 rounded-3xl border-2 border-blue-100 dark:border-blue-800/30">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500 text-white rounded-lg shadow-lg shadow-blue-500/20">
                            <FaUserShield size={18} />
                        </div>
                        <div>
                            <span className="text-sm font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest block leading-none">
                                Cuenta de Sistema
                            </span>
                            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter mt-1 block">
                                Permite el acceso a los módulos web
                            </span>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={systemAccessEnabled} onChange={(e) => setSystemAccessEnabled(e.target.checked)} className="sr-only peer" />
                        <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 shadow-inner"></div>
                    </label>
                </div>

                {systemAccessEnabled && (
                    <div className="space-y-6 animate-in slide-in-from-top-4 duration-300">
                        {/* Selector de Roles (Multi-selección) */}
                        <div>
                            <label className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest block mb-3 ml-1">Roles y Puestos Asignados (RBAC v2)</label>
                            <div className="flex flex-wrap gap-2">
                                {loadingRoles ? (
                                    <div className="text-xs text-gray-400 italic">Cargando roles...</div>
                                ) : staffRoles.map(role => (
                                    <button
                                        key={role.id}
                                        type="button"
                                        onClick={() => toggleRoleId(role.id)}
                                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 border-2 ${
                                            empleado.roleIds.includes(role.id)
                                            ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-600/20'
                                            : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-400 hover:border-blue-200'
                                        }`}
                                    >
                                        {empleado.roleIds.includes(role.id) && <FaCheck size={10} />}
                                        {role.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {!empleado.userId ? (
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5 ml-1 italic">Contraseña Temporal</label>
                                    <div className="relative">
                                        <FaKey className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                                        <input name="password" type="password" value={empleado.password || ""} onChange={handleChange} required={systemAccessEnabled} placeholder="Mínimo 6 caracteres" className="w-full pl-11 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" />
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col h-full justify-center">
                                    {!changePassword ? (
                                        <button type="button" onClick={() => setChangePassword(true)} className="text-[10px] font-black text-blue-600 uppercase hover:underline flex items-center gap-2 p-3 bg-white dark:bg-gray-900 rounded-xl border border-blue-100 dark:border-gray-700 shadow-sm">
                                            <FaKey /> Cambiar Contraseña de Acceso
                                        </button>
                                    ) : (
                                        <div className="relative animate-in zoom-in-95 duration-200">
                                            <FaKey className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" />
                                            <input name="password" type="password" value={empleado.password || ""} onChange={handleChange} placeholder="Nueva contraseña" className="w-full pl-11 pr-12 py-3 bg-white dark:bg-gray-900 border-2 border-blue-500 rounded-xl text-sm font-bold outline-none shadow-lg shadow-blue-500/10" />
                                            <button type="button" onClick={() => {setChangePassword(false); setEmpleado({...empleado, password: ""})}} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500">
                                                <FaTimes size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

          {/* DATOS LABORALES */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <FaBriefcase className="text-gray-400" />
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Contratación y Cargo</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase block mb-1.5 ml-1 italic">Puesto Nominal (Firma)</label>
                <input name="puesto" value={empleado.puesto || ""} onChange={handleChange} required placeholder="Ej: Gerente Operativo" className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-2.5 font-bold focus:ring-2 focus:ring-primary outline-none uppercase" />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase block mb-1.5 ml-1 italic">Sueldo Base Mensual</label>
                <input name="sueldo" type="number" step="0.01" value={empleado.sueldo || 0} onChange={handleChange} required className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-2.5 font-bold focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase block mb-1.5 ml-1 italic">Teléfono Corporativo/Personal</label>
                <input name="telefono" value={empleado.telefono || ""} onChange={handleChange} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-2.5 font-bold focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase block mb-1.5 ml-1 italic">Fecha de Alta</label>
                <input name="fechaContratacion" type="date" value={empleado.fechaContratacion || ""} onChange={handleChange} required className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-2.5 font-bold focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase block mb-1.5 ml-1 italic">Reporta a (Jefe)</label>
                    <select name="managerId" value={empleado.managerId || ""} onChange={handleChange} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-2.5 font-bold outline-none focus:ring-2 focus:ring-primary">
                        <option value="">-- Sin Jefe (Dirección) --</option>
                        {potentialManagers.map(m => (
                            <option key={m.id} value={m.id}>{m.nombreCompleto}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase block mb-1.5 ml-1 italic">Estatus Expediente</label>
                    <select name="estatus" value={empleado.estatus || "ACTIVO"} onChange={handleChange} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-2.5 font-bold outline-none focus:ring-2 focus:ring-primary">
                        <option value="ACTIVO">ACTIVO</option>
                        <option value="INACTIVO">INACTIVO</option>
                    </select>
                </div>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-50 dark:border-gray-700 flex gap-4">
            <button type="button" onClick={onClose} className="flex-1 py-4 bg-gray-50 dark:bg-gray-700 text-gray-500 font-black rounded-2xl uppercase text-[10px] tracking-widest hover:bg-gray-100 transition-all border border-gray-100 dark:border-gray-600">Cancelar</button>
            <button type="submit" className="flex-[2] py-4 bg-primary text-white font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 transition-all">
                {isEditing ? "Confirmar Cambios en Expediente" : "Finalizar Alta de Empleado"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmpleadoModal;
