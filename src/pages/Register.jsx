// src/pages/Register.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from 'sonner'; // Importar sonner
import MainLayout from "../layouts/MainLayout";
import axios from "axios";
import Button from "../components/common/Button";
import Swal from 'sweetalert2';
import { MdArrowBack, MdPersonAdd, MdHowToReg, MdVisibility, MdVisibilityOff, MdPhone, MdBadge, MdEmail, MdPerson } from 'react-icons/md';

// --- Sub-Componentes Visuales ---

const InputField = ({ label, type, name, value, onChange, placeholder, icon, readOnly = false, required = true }) => (
  <div className="mb-3.5 sm:mb-4 text-left">
    <label className="block text-[11px] sm:text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1 ml-1">
      {label}
    </label>
    <div className={`relative flex items-center bg-gray-50/90 dark:bg-gray-700/80 rounded-xl border ${readOnly ? 'border-gray-200 dark:border-gray-600 opacity-70' : 'border-gray-300 dark:border-gray-600 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20'} transition-all shadow-xs`}>
      {icon && <div className="pl-3.5 text-gray-400 dark:text-gray-500 text-lg sm:text-xl flex-shrink-0">{icon}</div>}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly}
        required={required}
        className="w-full py-2.5 sm:py-3 px-3.5 bg-transparent outline-none text-gray-800 dark:text-white placeholder:text-gray-400 text-base"
      />
    </div>
  </div>
);

const PasswordField = ({ label, name, value, onChange, show, toggle }) => (
  <div className="mb-3.5 sm:mb-4 text-left">
    <label className="block text-[11px] sm:text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1 ml-1">
      {label}
    </label>
    <div className="relative flex items-center bg-gray-50/90 dark:bg-gray-700/80 rounded-xl border border-gray-300 dark:border-gray-600 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all shadow-xs">
      <input
        type={show ? "text" : "password"}
        name={name}
        value={value}
        onChange={onChange}
        placeholder="••••••••"
        className="w-full py-2.5 sm:py-3 px-3.5 bg-transparent outline-none text-gray-800 dark:text-white text-base"
      />
      <button
        type="button"
        onClick={toggle}
        className="p-2.5 pr-3.5 text-gray-400 hover:text-primary transition-colors cursor-pointer"
        aria-label={show ? "Ocultar contraseña" : "Ver contraseña"}
      >
        {show ? <MdVisibilityOff size={20}/> : <MdVisibility size={20}/>}
      </button>
    </div>
  </div>
);

const Register = () => {
  // Estados de vista: 'menu' | 'register' | 'activate'
  const [viewMode, setViewMode] = useState('menu');
  const navigate = useNavigate();

  // Estado general
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");

  // Datos del formulario
  const [formData, setFormData] = useState({
    name: "",
    sexo: "",
    email: "",
    password: "",
    confirmPassword: "",
    clientCategory: "PARTICULAR",
  });

  // Estado específico para Activación (Usuarios existentes)
  const [searchIdentifier, setSearchIdentifier] = useState("");
  const [searchType, setSearchType] = useState("phone"); // 'phone' | 'customId'
  const [foundUser, setFoundUser] = useState(null);

  // --- Handlers ---

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({ name: "", sexo: "", email: "", password: "", confirmPassword: "" });
    setFoundUser(null);
    setSearchIdentifier("");
    setError("");
    setLoading(false);
  };

  // Buscar usuario existente
  const handleSearchUser = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    let identifierForApi = searchIdentifier;
    if (searchType === "customId") {
      identifierForApi = searchIdentifier.toUpperCase().startsWith('CLI-') 
        ? searchIdentifier 
        : "CLI-" + searchIdentifier;
    }

    try {
      const response = await axios.get(`/api/users/check`, {
        params: { identifier: identifierForApi, type: searchType },
      });

      const user = response.data;
      
      if (user.hasPassword) {
        Swal.fire({
            icon: 'info',
            title: 'Cuenta ya activa',
            text: 'Este usuario ya tiene una contraseña. Por favor inicia sesión.',
            confirmButtonText: 'Ir al Login',
            confirmButtonColor: '#3b82f6'
        }).then(() => navigate('/login'));
        return;
      }

      setFoundUser(user);
      setFormData(prev => ({ ...prev, name: user.name, email: user.email || "" }));

    } catch (err) {
      console.error(err);
      if (err.response?.status === 404) {
        setError("No encontramos un cliente con esos datos. Verifica o regístrate como nuevo.");
      } else {
        setError("Error al buscar. Intenta de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Enviar Registro (Nuevo o Activación)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validaciones
    if (!formData.name || !formData.password || !formData.confirmPassword) {
      setError("Por favor completa los campos requeridos.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (formData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);

    try {
      if (viewMode === 'activate' && foundUser) {
        // Completar registro existente
        await axios.post(`/api/complete-registration`, {
            userId: foundUser.id,
            name: formData.name,
            sexo: formData.sexo,
            clientCategory: formData.clientCategory,
            email: formData.email,
            password: formData.password, 
        });
        toast.success("¡Cuenta activada con éxito!");
      } else {
        // Crear nuevo usuario
        if (!formData.email) {
            setLoading(false);
            setError("El correo es obligatorio para nuevos registros.");
            return;
        }
        await axios.post("/api/users", {
            ...formData,
            role: "CLIENTE",
        });
        toast.success("¡Registro creado exitosamente!");
      }

      // Éxito - Mensaje Detallado
      await Swal.fire({
        title: '¡Casi listo!',
        text: 'Te hemos enviado un correo de verificación. Por favor, revísalo para activar tu cuenta y poder iniciar sesión.',
        icon: 'info',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Entendido'
      });
      navigate("/login");

    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || "Error al procesar el registro.";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // --- VISTAS ---

  const renderMenu = () => (
    <div className="animate-fade-in">
      <div className="text-center mb-4 sm:mb-6">
        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-2 text-primary shadow-xs animate-fade-in">
          <span className="material-symbols-outlined text-2xl sm:text-3xl">water_drop</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">Bienvenido a Darmax</h1>
        <p className="mt-0.5 sm:mt-1 text-gray-500 dark:text-gray-400 text-xs sm:text-sm">Elige cómo quieres comenzar</p>
      </div>

      <div className="space-y-3 sm:space-y-4 animate-slide-up">
        <button
          onClick={() => { setViewMode('register'); resetForm(); }}
          className="w-full group flex items-center p-3.5 sm:p-4 bg-gray-50/80 dark:bg-gray-700/50 border-2 border-transparent hover:border-primary/30 hover:bg-white dark:hover:bg-gray-700 rounded-2xl transition-all text-left shadow-xs hover:shadow-md cursor-pointer active:scale-[0.99]"
        >
          <div className="w-11 h-11 bg-primary text-white rounded-xl flex items-center justify-center mr-3.5 group-hover:scale-110 transition-transform flex-shrink-0">
            <MdPersonAdd size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-gray-900 dark:text-white text-base sm:text-lg leading-tight">Soy nuevo cliente</h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">Quiero crear una cuenta desde cero.</p>
          </div>
        </button>

        <button
          onClick={() => { setViewMode('activate'); resetForm(); }}
          className="w-full group flex items-center p-3.5 sm:p-4 bg-gray-50/80 dark:bg-gray-700/50 border-2 border-transparent hover:border-green-500/30 hover:bg-white dark:hover:bg-gray-700 rounded-2xl transition-all text-left shadow-xs hover:shadow-md cursor-pointer active:scale-[0.99]"
        >
          <div className="w-11 h-11 bg-green-600 text-white rounded-xl flex items-center justify-center mr-3.5 group-hover:scale-110 transition-transform flex-shrink-0">
            <MdHowToReg size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-gray-900 dark:text-white text-base sm:text-lg leading-tight">Ya soy cliente</h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">Activar acceso con mi Teléfono o ID.</p>
          </div>
        </button>
      </div>

      {/* Pregunta arriba y botón debajo */}
      <div className="mt-4 sm:mt-6 pt-3.5 sm:pt-4 border-t border-gray-100 dark:border-gray-700/80 text-center animate-fade-in">
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-2">¿Ya tienes acceso web?</p>
        <Link 
          to="/login" 
          className="inline-flex items-center justify-center w-full py-2.5 px-4 rounded-xl font-bold text-sm text-primary dark:text-blue-400 bg-primary/10 hover:bg-primary/20 dark:bg-primary/20 dark:hover:bg-primary/30 border border-primary/20 transition-all active:scale-95"
        >
          Inicia Sesión aquí
        </Link>
      </div>
    </div>
  );

  const renderRegisterForm = () => (
    <div className="animate-slide-up">
      <button 
        onClick={() => setViewMode('menu')}
        className="flex items-center text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-white mb-3 sm:mb-5 transition-colors font-bold text-xs sm:text-sm cursor-pointer"
      >
        <MdArrowBack className="mr-1" size={16} /> VOLVER AL MENÚ
      </button>
      
      <div className="mb-3.5 sm:mb-5 text-left">
        <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">Registro Nuevo</h2>
        <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-0.5">Crea tu cuenta de cliente en Darmax</p>
      </div>
      
      <form onSubmit={handleSubmit}>
        <InputField 
          label="Nombre Completo" 
          type="text" 
          name="name" 
          value={formData.name} 
          onChange={handleChange} 
          placeholder="Ej. Juan Pérez" 
          icon={<MdPerson />}
        />
        
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 mb-3.5 sm:mb-4">
          <div className="text-left">
            <label className="block text-[11px] sm:text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1 ml-1">Sexo</label>
            <select name="sexo" value={formData.sexo} onChange={handleChange} className="w-full py-2.5 sm:py-3 px-2.5 sm:px-3 bg-gray-50/90 dark:bg-gray-700/80 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-gray-800 dark:text-white text-xs sm:text-sm transition-all" required>
              <option value="">Selecciona...</option>
              <option value="HOMBRE">Hombre</option>
              <option value="MUJER">Mujer</option>
              <option value="OTRO">Otro</option>
            </select>
          </div>

          <div className="text-left">
            <label className="block text-[11px] sm:text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1 ml-1">Tipo de Cliente</label>
            <select name="clientCategory" value={formData.clientCategory} onChange={handleChange} className="w-full py-2.5 sm:py-3 px-2.5 sm:px-3 bg-gray-50/90 dark:bg-gray-700/80 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-gray-800 dark:text-white text-xs sm:text-sm transition-all" required>
              <option value="PARTICULAR">Hogar / Particular</option>
              <option value="EMPRESA">Empresa / Oficina</option>
              <option value="HOSPITAL">Hospital / Clínica</option>
              <option value="ESCUELA">Escuela / Universidad</option>
              <option value="OTRO">Otro</option>
            </select>
          </div>
        </div>

        <InputField 
          label="Correo Electrónico" 
          type="email" 
          name="email" 
          value={formData.email} 
          onChange={handleChange} 
          placeholder="tu@correo.com" 
          icon={<MdEmail />}
        />
        
        <PasswordField label="Contraseña" name="password" value={formData.password} onChange={handleChange} show={showPassword} toggle={() => setShowPassword(!showPassword)} />
        <PasswordField label="Confirmar Contraseña" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} show={showConfirm} toggle={() => setShowConfirm(!showConfirm)} />

        {error && (
          <div className="mb-3.5 p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-xs sm:text-sm text-center font-medium animate-shake">
            {error}
          </div>
        )}

        <div className="mt-4 sm:mt-6">
          <Button type="submit" disabled={loading} className="w-full py-3 sm:py-3.5 text-base font-bold shadow-md shadow-primary/20">
            {loading ? 'Procesando...' : 'Crear mi Cuenta'}
          </Button>
        </div>
      </form>
    </div>
  );

  const renderActivationForm = () => (
    <div className="animate-slide-up">
      <button 
        onClick={() => foundUser ? setFoundUser(null) : setViewMode('menu')}
        className="flex items-center text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-white mb-3 sm:mb-5 transition-colors font-bold text-xs sm:text-sm cursor-pointer"
      >
        <MdArrowBack className="mr-1" size={16} /> {foundUser ? 'BUSCAR OTRO' : 'VOLVER AL MENÚ'}
      </button>

      {!foundUser ? (
        // PASO 1: BUSCAR
        <>
          <div className="mb-3.5 sm:mb-5 text-left">
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">Activar Cuenta</h2>
            <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-0.5">Ingresa tus datos registrados previamente</p>
          </div>

          <div className="flex bg-gray-100 dark:bg-gray-900/50 p-1 rounded-xl mb-4 sm:mb-6">
            <button 
              type="button"
              onClick={() => { setSearchType('phone'); setSearchIdentifier(''); }} 
              className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${searchType === 'phone' ? 'bg-white dark:bg-gray-700 shadow text-primary' : 'text-gray-500'}`}
            >
              Teléfono
            </button>
            <button 
              type="button"
              onClick={() => { setSearchType('customId'); setSearchIdentifier(''); }} 
              className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${searchType === 'customId' ? 'bg-white dark:bg-gray-700 shadow text-primary' : 'text-gray-500'}`}
            >
              ID Cliente
            </button>
          </div>

          <form onSubmit={handleSearchUser}>
            <div className="mb-4 sm:mb-6">
              <label className="block text-[11px] sm:text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1 ml-1">
                {searchType === 'phone' ? 'Número de Teléfono' : 'ID de Cliente'}
              </label>
              <div className="relative flex items-center bg-gray-50/90 dark:bg-gray-700/80 rounded-xl border border-gray-300 dark:border-gray-600 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all shadow-xs">
                <div className="pl-3.5 text-gray-400 dark:text-gray-500 text-lg sm:text-xl">
                  {searchType === 'phone' ? <MdPhone /> : <MdBadge />}
                </div>
                <input
                  type={searchType === 'phone' ? 'tel' : 'text'}
                  value={searchIdentifier}
                  onChange={(e) => setSearchIdentifier(e.target.value)}
                  className="w-full py-2.5 sm:py-3.5 pl-3.5 pr-3.5 bg-transparent outline-none text-gray-800 dark:text-white text-base font-bold"
                  placeholder={searchType === 'phone' ? '5512345678' : 'CLI-1234'}
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <div className="mb-4 p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-xs sm:text-sm text-center font-medium animate-shake">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} variant="secondary" className="w-full py-3 sm:py-3.5 text-base font-bold">
              {loading ? 'Buscando...' : 'Buscar mi cuenta'}
            </Button>
          </form>
        </>
      ) : (
        // PASO 2: COMPLETAR PERFIL
        <>
          <div className="bg-green-50 dark:bg-green-900/20 p-3.5 sm:p-4 rounded-2xl border border-green-100 dark:border-green-800 mb-4 sm:mb-5 flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 bg-green-600 text-white rounded-xl flex items-center justify-center flex-shrink-0">
              <MdHowToReg size={22} />
            </div>
            <div>
              <p className="text-green-700 dark:text-green-400 font-black text-base sm:text-lg leading-tight">¡Te encontramos!</p>
              <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm">Hola, <strong>{foundUser.name}</strong></p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <InputField 
              label="Confirma tu Nombre" 
              type="text" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              placeholder="Tu nombre" 
              icon={<MdPerson />}
            />
            
            <div className="mb-3.5 sm:mb-4 text-left">
              <label className="block text-[11px] sm:text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1 ml-1">Sexo</label>
              <select name="sexo" value={formData.sexo} onChange={handleChange} className="w-full py-2.5 sm:py-3 px-3 bg-gray-50/90 dark:bg-gray-700/80 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-gray-800 dark:text-white text-xs sm:text-sm transition-all" required>
                <option value="">Selecciona...</option>
                <option value="HOMBRE">Hombre</option>
                <option value="MUJER">Mujer</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>

            <InputField 
              label="Correo Electrónico" 
              type="email" 
              name="email" 
              value={formData.email} 
              onChange={handleChange} 
              placeholder="tu@correo.com" 
              icon={<MdEmail />}
            />
            
            <div className="my-4 border-t border-gray-100 dark:border-gray-700/80 pt-4">
              <div className="mb-3.5 text-center">
                <p className="text-xs sm:text-sm font-black text-primary uppercase tracking-widest">Seguridad de Acceso</p>
                <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">Crea tu contraseña para entrar al sistema</p>
              </div>
              <PasswordField label="Nueva Contraseña" name="password" value={formData.password} onChange={handleChange} show={showPassword} toggle={() => setShowPassword(!showPassword)} />
              <PasswordField label="Confirmar Contraseña" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} show={showConfirm} toggle={() => setShowConfirm(!showConfirm)} />
            </div>

            {error && (
              <div className="mb-4 p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-xs sm:text-sm text-center font-medium animate-shake">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full py-3 sm:py-3.5 text-base font-bold shadow-md shadow-primary/20">
              {loading ? 'Activando...' : 'Activar mi Cuenta'}
            </Button>
          </form>
        </>
      )}
    </div>
  );

  return (
    <MainLayout>
      <div className="min-h-[calc(100dvh-4rem)] sm:min-h-[80vh] flex flex-col justify-center items-center px-4 py-3 sm:py-8 w-full font-display">
        <div className="w-full max-w-sm sm:max-w-md mx-auto bg-white dark:bg-gray-800 rounded-3xl sm:rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-700/80 p-5 sm:p-8 transition-all overflow-hidden flex flex-col justify-center animate-in fade-in zoom-in-105 slide-in-from-bottom-4 duration-500 ease-out">
          {viewMode === 'menu' && renderMenu()}
          {viewMode === 'register' && renderRegisterForm()}
          {viewMode === 'activate' && renderActivationForm()}
        </div>
      </div>
    </MainLayout>
  );
};

export default Register;
