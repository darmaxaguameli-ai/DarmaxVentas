import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import apiClient from "@/api/apiClient";

const EmpleadoModal = ({ onClose, empleadoToEdit, onSave, empleados = [], users = [], roles = [], allStores = [] }) => {
  const [activeTab, setActiveTab] = useState("personal"); // 'personal' | 'laboral' | 'acceso'
  const [systemAccessEnabled, setSystemAccessEnabled] = useState(!!empleadoToEdit?.userId);
  const [changePassword, setChangePassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [localRoles, setLocalRoles] = useState(roles || []);
  const [loadingRoles, setLoadingRoles] = useState(false);
  
  const initialEmpleadoState = {
    nombreCompleto: "",
    puesto: "",
    sueldo: 0,
    sexo: "",
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
            fechaContratacion: empleadoToEdit.fechaContratacion 
              ? new Date(empleadoToEdit.fechaContratacion).toISOString().split('T')[0]
              : new Date().toISOString().split('T')[0],
            sueldo: parseFloat(empleadoToEdit.sueldo || 0),
            sexo: (empleadoToEdit.sexo || empleadoToEdit.user?.sexo || "").toUpperCase(),
            managerId: empleadoToEdit.managerId || null,
            userId: empleadoToEdit.userId || null,
            roleIds: currentRoleIds,
            storeId: empleadoToEdit.user?.storeId || empleadoToEdit.storeId || ""
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
    // Si no hay roles y el contexto no los cargó, fetch de respaldo
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
  }, []);

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
          sexo: (prev.sexo || selectedUser.sexo || "").toUpperCase(),
          roleIds: selectedUser.roles?.map(r => r.id) || (selectedUser.roleId ? [selectedUser.roleId] : []),
          storeId: selectedUser.storeId || ""
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

    empleadoData.sueldo = parseFloat(empleadoData.sueldo) || 0;
    
    const fieldsToNullify = ['telefono', 'emailPersonal', 'street', 'neighborhood', 'city', 'postalCode', 'managerId', 'userId', 'sexo', 'storeId'];
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
                sexo: empleado.sexo,
                roleIds: empleado.roleIds,
                storeId: empleado.storeId || null
            };
        } else {
            if (changePassword && empleado.password) {
                empleadoData.newPassword = empleado.password;
            }
            empleadoData.sexo = empleado.sexo;
            empleadoData.roleIds = empleado.roleIds;
            empleadoData.storeId = empleado.storeId || null;
        }
    } else {
        empleadoData.userId = null;
    }

    onSave(empleadoData);
    onClose();
  };

  const isEditing = !!empleadoToEdit;
  const potentialManagers = (empleados || []).filter(e => e.id !== empleadoToEdit?.id);
  const staffRoles = (localRoles || []).filter(r => r.name !== 'CLIENTE');

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-850 rounded-3xl w-full max-w-3xl shadow-2xl border border-gray-200/80 dark:border-gray-700/80 flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden transform transition-all duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera Fija del Modal (Estilo Sistemas) */}
        <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-slate-50 via-white to-blue-50/40 dark:from-gray-900 dark:via-gray-850 dark:to-blue-950/20 flex items-start justify-between gap-4 flex-shrink-0">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-100/70 dark:bg-blue-900/40 px-2.5 py-0.5 rounded-full">
                Capital Humano
              </span>
              <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                isEditing
                  ? (empleado.estatus === 'ACTIVO' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-900/30 dark:text-rose-300')
                  : 'bg-purple-50 text-purple-600 border border-purple-200 dark:bg-purple-900/30 dark:text-purple-300'
              }`}>
                {isEditing ? `Expediente: ${empleado.estatus}` : 'Nuevo Registro'}
              </span>
            </div>
            <h2 className="text-base sm:text-lg md:text-xl font-black text-gray-900 dark:text-white leading-snug">
              {isEditing ? `Editar Expediente: ${empleado.nombreCompleto || 'Colaborador'}` : "Nuevo Ingreso de Personal"}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              {isEditing 
                ? "Actualiza la información personal, asignación de puesto y accesos al sistema." 
                : "Captura los datos del colaborador, define su cargo y configura sus credenciales de acceso."}
            </p>
          </div>

          <button 
            type="button"
            onClick={onClose} 
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0 active:scale-95"
            title="Cerrar modal"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Barra de Pestañas Segmentadas */}
        <div className="px-5 pt-3 sm:px-6 bg-gray-50/50 dark:bg-gray-900/40 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              onClick={() => setActiveTab("personal")}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${
                activeTab === "personal"
                  ? "bg-white dark:bg-gray-800 text-primary shadow-xs border border-gray-200/80 dark:border-gray-700/80"
                  : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <span className="material-symbols-outlined text-sm">badge</span>
              <span>1. Personal & Contacto</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("laboral")}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${
                activeTab === "laboral"
                  ? "bg-white dark:bg-gray-800 text-primary shadow-xs border border-gray-200/80 dark:border-gray-700/80"
                  : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <span className="material-symbols-outlined text-sm">work</span>
              <span>2. Puesto & Operación</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("acceso")}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${
                activeTab === "acceso"
                  ? "bg-white dark:bg-gray-800 text-primary shadow-xs border border-gray-200/80 dark:border-gray-700/80"
                  : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <span className="material-symbols-outlined text-sm">key</span>
              <span>3. Acceso & Roles ({empleado.roleIds?.length || 0})</span>
            </button>
          </div>
        </div>

        {/* Formulario Principal con Scroll Interno Suave */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 custom-scrollbar space-y-5">
          {/* ==================================================== */}
          {/* PESTAÑA 1: DATOS PERSONALES Y DOMICILIO              */}
          {/* ==================================================== */}
          {activeTab === "personal" && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Sección Datos Identificativos */}
              <div className="space-y-3">
                <span className="text-[11px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-primary">person</span>
                  Identificación del Colaborador
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Nombre Completo <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      name="nombreCompleto" 
                      value={empleado.nombreCompleto || ""} 
                      onChange={handleChange} 
                      required 
                      placeholder="Ej: Carlos Eduardo Ramírez Soto"
                      className="w-full bg-gray-50/80 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/80 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Email Personal / Acceso <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base">
                        mail
                      </span>
                      <input 
                        name="emailPersonal" 
                        type="email" 
                        value={empleado.emailPersonal || ""} 
                        onChange={handleChange} 
                        required 
                        placeholder="ejemplo@darmax.com" 
                        className="w-full pl-9 pr-3.5 py-2.5 bg-gray-50/80 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/80 rounded-xl text-xs font-bold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Teléfono de Contacto
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base">
                        call
                      </span>
                      <input 
                        name="telefono" 
                        value={empleado.telefono || ""} 
                        onChange={handleChange} 
                        placeholder="Ej: 998 123 4567" 
                        className="w-full pl-9 pr-3.5 py-2.5 bg-gray-50/80 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/80 rounded-xl text-xs font-bold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                      Sexo / Género
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {["HOMBRE", "MUJER", "OTRO"].map(sex => {
                        const isSelected = empleado.sexo === sex;
                        return (
                          <button
                            key={sex}
                            type="button"
                            onClick={() => setEmpleado(prev => ({ ...prev, sexo: sex }))}
                            className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                              isSelected
                                ? "bg-primary text-white border-primary shadow-xs"
                                : "bg-gray-50/80 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-primary/50"
                            }`}
                          >
                            {sex === "HOMBRE" ? "Hombre" : sex === "MUJER" ? "Mujer" : "Otro"}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sección Domicilio */}
              <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <span className="text-[11px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-primary">location_on</span>
                  Domicilio Residencial
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Calle y Número
                    </label>
                    <input 
                      name="street" 
                      value={empleado.street || ""} 
                      onChange={handleChange} 
                      placeholder="Ej: Av. Kabah Mz 4 Lt 12"
                      className="w-full bg-gray-50/80 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/80 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Código Postal
                    </label>
                    <input 
                      name="postalCode" 
                      value={empleado.postalCode || ""} 
                      onChange={handleChange} 
                      placeholder="77500" 
                      maxLength="5" 
                      className="w-full bg-gray-50/80 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/80 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Colonia / Fraccionamiento
                    </label>
                    <input 
                      name="neighborhood" 
                      value={empleado.neighborhood || ""} 
                      onChange={handleChange} 
                      placeholder="Ej: Región 95"
                      className="w-full bg-gray-50/80 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/80 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Ciudad / Municipio
                    </label>
                    <input 
                      name="city" 
                      value={empleado.city || ""} 
                      onChange={handleChange} 
                      placeholder="Ej: Cancún, Q. Roo"
                      className="w-full bg-gray-50/80 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/80 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* PESTAÑA 2: PUESTO, NÓMINA Y OPERACIÓN                */}
          {/* ==================================================== */}
          {activeTab === "laboral" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <span className="text-[11px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-primary">work_history</span>
                Condiciones Laborales y Adscripción
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Puesto Nominal <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    name="puesto" 
                    value={empleado.puesto || ""} 
                    onChange={handleChange} 
                    required 
                    placeholder="Ej: Encargado de Purificadora" 
                    className="w-full bg-gray-50/80 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/80 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Sueldo Base Mensual (MXN) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">$</span>
                    <input 
                      name="sueldo" 
                      type="number" 
                      step="0.01" 
                      value={empleado.sueldo || 0} 
                      onChange={handleChange} 
                      required 
                      className="w-full pl-8 pr-3.5 py-2.5 bg-gray-50/80 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/80 rounded-xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Fecha de Ingreso <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    name="fechaContratacion" 
                    type="date" 
                    value={empleado.fechaContratacion || ""} 
                    onChange={handleChange} 
                    required 
                    className="w-full bg-gray-50/80 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/80 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Sucursal Asignada
                  </label>
                  <select 
                    name="storeId" 
                    value={empleado.storeId || ""} 
                    onChange={handleChange} 
                    className="w-full bg-gray-50/80 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/80 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all cursor-pointer"
                  >
                    <option value="">-- Sin Sucursal (Acceso Global) --</option>
                    {(allStores || []).map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Reporta a (Jefe Inmediato)
                  </label>
                  <select 
                    name="managerId" 
                    value={empleado.managerId || ""} 
                    onChange={handleChange} 
                    className="w-full bg-gray-50/80 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/80 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all cursor-pointer"
                  >
                    <option value="">-- Sin Jefe (Dirección General) --</option>
                    {potentialManagers.map(m => (
                      <option key={m.id} value={m.id}>{m.nombreCompleto}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Estatus del Expediente
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEmpleado(prev => ({ ...prev, estatus: "ACTIVO" }))}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
                        empleado.estatus === "ACTIVO"
                          ? "bg-emerald-500 text-white border-emerald-500 shadow-xs"
                          : "bg-gray-50/80 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-200"></span>
                      <span>Activo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEmpleado(prev => ({ ...prev, estatus: "INACTIVO" }))}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
                        empleado.estatus === "INACTIVO"
                          ? "bg-rose-500 text-white border-rose-500 shadow-xs"
                          : "bg-gray-50/80 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-rose-200"></span>
                      <span>Inactivo</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* PESTAÑA 3: ACCESO AL SISTEMA Y ROLES (RBAC v2)       */}
          {/* ==================================================== */}
          {activeTab === "acceso" && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Tarjeta de Interruptor de Acceso */}
              <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-xs flex-shrink-0">
                    <span className="material-symbols-outlined text-xl">admin_panel_settings</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                      Habilitar Acceso al Sistema
                    </h4>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      Permite que el colaborador inicie sesión con su correo electrónico y contraseña.
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                  <input 
                    type="checkbox" 
                    checked={systemAccessEnabled} 
                    onChange={(e) => setSystemAccessEnabled(e.target.checked)} 
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {systemAccessEnabled ? (
                <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                  {/* Selector de Roles RBAC v2 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                        Roles y Permisos Asignados (RBAC v2)
                      </label>
                      <span className="text-[10px] text-gray-400 font-medium">
                        Selecciona uno o varios roles
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {loadingRoles ? (
                        <div className="text-xs text-gray-400 italic py-2">Cargando catálogo de roles...</div>
                      ) : staffRoles.map(role => {
                        const isSelected = empleado.roleIds?.includes(role.id);
                        return (
                          <button
                            key={role.id}
                            type="button"
                            onClick={() => toggleRoleId(role.id)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border active:scale-95 ${
                              isSelected
                                ? 'bg-primary border-primary text-white shadow-xs'
                                : 'bg-gray-50/80 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-primary/50'
                            }`}
                          >
                            <span className="material-symbols-outlined text-sm">
                              {isSelected ? 'check_circle' : 'radio_button_unchecked'}
                            </span>
                            <span>{role.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Contraseña de Acceso */}
                  <div className="pt-2">
                    {!empleado.userId ? (
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                          Contraseña Provisional <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base">
                            lock
                          </span>
                          <input 
                            name="password" 
                            type={showPassword ? "text" : "password"} 
                            value={empleado.password || ""} 
                            onChange={handleChange} 
                            required={systemAccessEnabled} 
                            placeholder="Mínimo 6 caracteres" 
                            className="w-full pl-9 pr-10 py-2.5 bg-gray-50/80 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/80 rounded-xl text-xs font-bold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                          >
                            <span className="material-symbols-outlined text-base">
                              {showPassword ? "visibility_off" : "visibility"}
                            </span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {!changePassword ? (
                          <button 
                            type="button" 
                            onClick={() => setChangePassword(true)} 
                            className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-gray-800/80 hover:bg-gray-100 dark:hover:bg-gray-700/80 text-primary rounded-xl text-xs font-bold border border-gray-200 dark:border-gray-700 transition-all active:scale-95"
                          >
                            <span className="material-symbols-outlined text-base">password</span>
                            <span>Restablecer o Cambiar Contraseña</span>
                          </button>
                        ) : (
                          <div className="space-y-1.5 p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold text-amber-800 dark:text-amber-300">
                                Nueva Contraseña
                              </label>
                              <button 
                                type="button" 
                                onClick={() => { setChangePassword(false); setEmpleado({ ...empleado, password: "" }); }}
                                className="text-[10px] text-gray-400 hover:text-rose-500 font-bold"
                              >
                                Cancelar cambio
                              </button>
                            </div>
                            <div className="relative">
                              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base">
                                lock
                              </span>
                              <input 
                                name="password" 
                                type={showPassword ? "text" : "password"} 
                                value={empleado.password || ""} 
                                onChange={handleChange} 
                                placeholder="Escribe la nueva contraseña..." 
                                className="w-full pl-9 pr-10 py-2 bg-white dark:bg-gray-900 border border-amber-300 dark:border-amber-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500" 
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                              >
                                <span className="material-symbols-outlined text-base">
                                  {showPassword ? "visibility_off" : "visibility"}
                                </span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-gray-400 border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
                  <span className="material-symbols-outlined text-3xl mb-1 text-gray-300 dark:text-gray-600">
                    lock_open
                  </span>
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400">
                    Acceso de usuario desactivado
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Activa el interruptor superior si este colaborador necesita acceder con credenciales al sistema.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Pie de Página Fijo con Acciones */}
          <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3">
            <button 
              type="button" 
              onClick={onClose} 
              className="py-2.5 px-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold rounded-xl text-xs hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95 transition-all"
            >
              Cancelar
            </button>

            <div className="flex items-center gap-2">
              {activeTab !== "acceso" && (
                <button
                  type="button"
                  onClick={() => setActiveTab(activeTab === "personal" ? "laboral" : "acceso")}
                  className="py-2.5 px-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-bold rounded-xl text-xs hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95 transition-all flex items-center gap-1"
                >
                  <span>Siguiente</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              )}

              <button 
                type="submit" 
                className="py-2.5 px-5 bg-primary text-white font-bold rounded-xl text-xs shadow-xs hover:bg-primary-dark active:scale-95 transition-all flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">check</span>
                <span>{isEditing ? "Guardar Cambios" : "Dar de Alta"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default EmpleadoModal;
