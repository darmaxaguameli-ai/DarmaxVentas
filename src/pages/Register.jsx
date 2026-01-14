// src/pages/Register.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import axios from "axios";
import Button from "../components/common/Button";
import Swal from 'sweetalert2';
import { MdArrowBack, MdPersonAdd, MdHowToReg, MdVisibility, MdVisibilityOff, MdPhone, MdBadge, MdEmail, MdPerson } from 'react-icons/md';

// --- Sub-Componentes Visuales ---

const InputField = ({ label, type, name, value, onChange, placeholder, icon, readOnly = false, required = true }) => (
  <div className="mb-5 text-left">
    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5 ml-1">
      {label}
    </label>
    <div className={`relative flex items-center bg-gray-50 dark:bg-gray-700 rounded-xl border ${readOnly ? 'border-gray-200 dark:border-gray-600 opacity-70' : 'border-gray-300 dark:border-gray-600 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20'} transition-all`}>
      {icon && <div className="pl-4 text-gray-400 dark:text-gray-500 text-xl">{icon}</div>}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly}
        required={required}
        className="w-full py-3.5 px-4 bg-transparent outline-none text-gray-800 dark:text-white placeholder:text-gray-400 text-base"
      />
    </div>
  </div>
);

const PasswordField = ({ label, name, value, onChange, show, toggle }) => (
  <div className="mb-5 text-left">
    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5 ml-1">
      {label}
    </label>
    <div className="relative flex items-center bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-300 dark:border-gray-600 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
      <input
        type={show ? "text" : "password"}
        name={name}
        value={value}
        onChange={onChange}
        placeholder="••••••••"
        className="w-full py-3.5 px-4 bg-transparent outline-none text-gray-800 dark:text-white text-base"
      />
      <button
        type="button"
        onClick={toggle}
        className="p-3 pr-4 text-gray-400 hover:text-primary transition-colors"
      >
        {show ? <MdVisibilityOff size={22}/> : <MdVisibility size={22}/>}
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
            email: formData.email,
            password: formData.password, 
        });
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
      }

      // Éxito
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
      setError(err.response?.data?.message || err.response?.data?.error || "Error al procesar el registro.");
    } finally {
      setLoading(false);
    }
  };

  // --- VISTAS ---

  const renderMenu = () => (
    <div className="animate-fade-in">
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary animate-fade-in">
            <span className="material-symbols-outlined text-4xl">water_drop</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">Bienvenido a Darmax</h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400 text-sm sm:text-base">Elige cómo quieres comenzar</p>
      </div>

      <div className="space-y-4 animate-slide-up">
          <button
            onClick={() => { setViewMode('register'); resetForm(); }}
            className="w-full group flex items-center p-5 bg-gray-50 dark:bg-gray-700/50 border-2 border-transparent hover:border-primary/30 hover:bg-white dark:hover:bg-gray-700 rounded-2xl transition-all text-left shadow-sm hover:shadow-md"
          >
            <div className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                <MdPersonAdd size={24} />
            </div>
            <div className="min-w-0 flex-1">
                <h3 className="font-bold text-gray-900 dark:text-white text-lg leading-tight">Soy nuevo cliente</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">Quiero crear una cuenta desde cero.</p>
            </div>
          </button>

          <button
            onClick={() => { setViewMode('activate'); resetForm(); }}
            className="w-full group flex items-center p-5 bg-gray-50 dark:bg-gray-700/50 border-2 border-transparent hover:border-green-500/30 hover:bg-white dark:hover:bg-gray-700 rounded-2xl transition-all text-left shadow-sm hover:shadow-md"
          >
            <div className="w-12 h-12 bg-green-600 text-white rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                <MdHowToReg size={24} />
            </div>
            <div className="min-w-0 flex-1">
                <h3 className="font-bold text-gray-900 dark:text-white text-lg leading-tight">Ya soy cliente</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">Activar acceso con mi Teléfono o ID.</p>
            </div>
          </button>
      </div>

      <div className="mt-10 pt-6 border-t border-gray-100 dark:border-gray-700 text-center animate-fade-in">
        <p className="text-sm text-gray-500 dark:text-gray-400">¿Ya tienes acceso web?</p>
        <Link to="/login" className="font-bold text-primary hover:text-primary-dark hover:underline mt-1 inline-block">
            Inicia Sesión aquí
        </Link>
      </div>
    </div>
  );

  const renderRegisterForm = () => (
    <div className="animate-slide-up">
        <button 
            onClick={() => setViewMode('menu')}
            className="flex items-center text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-white mb-8 transition-colors font-bold text-sm"
        >
            <MdArrowBack className="mr-1" size={18} /> VOLVER AL MENÚ
        </button>
        
        <div className="mb-8 text-left">
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">Registro Nuevo</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Crea tu cuenta de cliente en Darmax</p>
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
            
            <div className="mb-5 text-left">
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Sexo</label>
                <select name="sexo" value={formData.sexo} onChange={handleChange} className="w-full py-3.5 px-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-gray-800 dark:text-white text-base transition-all" required>
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
            
            <PasswordField label="Contraseña" name="password" value={formData.password} onChange={handleChange} show={showPassword} toggle={() => setShowPassword(!showPassword)} />
            <PasswordField label="Confirmar Contraseña" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} show={showConfirm} toggle={() => setShowConfirm(!showConfirm)} />

            {error && (
              <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm text-center font-medium">
                {error}
              </div>
            )}

            <div className="mt-8">
                <Button type="submit" disabled={loading} className="w-full py-4 text-lg">
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
            className="flex items-center text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-white mb-8 transition-colors font-bold text-sm"
        >
            <MdArrowBack className="mr-1" size={18} /> {foundUser ? 'BUSCAR OTRO' : 'VOLVER AL MENÚ'}
        </button>

        {!foundUser ? (
            // PASO 1: BUSCAR
            <>
                <div className="mb-8 text-left">
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">Activar Cuenta</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Ingresa tus datos registrados previamente</p>
                </div>

                <div className="flex bg-gray-100 dark:bg-gray-900/50 p-1 rounded-xl mb-8">
                    <button 
                        onClick={() => { setSearchType('phone'); setSearchIdentifier(''); }} 
                        className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${searchType === 'phone' ? 'bg-white dark:bg-gray-700 shadow text-primary' : 'text-gray-500'}`}
                    >
                        Teléfono
                    </button>
                    <button 
                        onClick={() => { setSearchType('customId'); setSearchIdentifier(''); }} 
                        className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${searchType === 'customId' ? 'bg-white dark:bg-gray-700 shadow text-primary' : 'text-gray-500'}`}
                    >
                        ID Cliente
                    </button>
                </div>

                <form onSubmit={handleSearchUser}>
                    <div className="mb-8">
                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5 ml-1">
                            {searchType === 'phone' ? 'Número de Teléfono' : 'ID de Cliente'}
                        </label>
                        <div className="relative flex items-center bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-300 dark:border-gray-600 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                            <div className="pl-4 text-gray-400 dark:text-gray-500 text-xl">
                                {searchType === 'phone' ? <MdPhone /> : <MdBadge />}
                            </div>
                            <input
                                type={searchType === 'phone' ? 'tel' : 'text'}
                                value={searchIdentifier}
                                onChange={(e) => setSearchIdentifier(e.target.value)}
                                className="w-full py-4 pl-4 pr-4 bg-transparent outline-none text-gray-800 dark:text-white text-lg font-bold"
                                placeholder={searchType === 'phone' ? '5512345678' : 'CLI-1234'}
                                autoFocus
                            />
                        </div>
                    </div>

                    {error && (
                      <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm text-center font-medium">
                        {error}
                      </div>
                    )}

                    <Button type="submit" disabled={loading} variant="secondary" className="w-full py-4 text-lg">
                        {loading ? 'Buscando...' : 'Buscar mi cuenta'}
                    </Button>
                </form>
            </>
        ) : (
            // PASO 2: COMPLETAR PERFIL
            <>
                <div className="bg-green-50 dark:bg-green-900/20 p-5 rounded-2xl border border-green-100 dark:border-green-800 mb-8 flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0">
                        <MdHowToReg size={24} />
                    </div>
                    <div>
                        <p className="text-green-700 dark:text-green-400 font-black text-lg leading-tight">¡Te encontramos!</p>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">Hola, <strong>{foundUser.name}</strong></p>
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
                    
                    <div className="mb-5 text-left">
                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Sexo</label>
                        <select name="sexo" value={formData.sexo} onChange={handleChange} className="w-full py-3.5 px-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-gray-800 dark:text-white text-base transition-all" required>
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
                    
                    <div className="my-8 border-t border-gray-100 dark:border-gray-700 pt-8">
                        <div className="mb-6 text-center">
                            <p className="text-sm font-black text-primary uppercase tracking-widest">Seguridad de Acceso</p>
                            <p className="text-xs text-gray-500 mt-1">Crea tu contraseña para entrar al sistema</p>
                        </div>
                        <PasswordField label="Nueva Contraseña" name="password" value={formData.password} onChange={handleChange} show={showPassword} toggle={() => setShowPassword(!showPassword)} />
                        <PasswordField label="Confirmar Contraseña" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} show={showConfirm} toggle={() => setShowConfirm(!showConfirm)} />
                    </div>

                    {error && (
                      <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm text-center font-medium">
                        {error}
                      </div>
                    )}

                    <Button type="submit" disabled={loading} className="w-full py-4 text-lg">
                        {loading ? 'Activando...' : 'Activar mi Cuenta'}
                    </Button>
                </form>
            </>
        )}
    </div>
  );

  return (
    <MainLayout>
      <div className="min-h-[80vh] flex flex-col justify-center items-center px-4 py-8 w-full font-display">
        <div className="w-full max-w-md mx-auto bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-700 p-8 sm:p-10 transition-all overflow-hidden flex flex-col justify-center">
            {viewMode === 'menu' && renderMenu()}
            {viewMode === 'register' && renderRegisterForm()}
            {viewMode === 'activate' && renderActivationForm()}
        </div>
      </div>
    </MainLayout>
  );
};

export default Register;
