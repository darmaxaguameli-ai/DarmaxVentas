// src/pages/Login.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { useAuth } from "../context/AuthContext";
import Button from "../components/common/Button";
import { MdVisibility, MdVisibilityOff, MdEmail, MdLock } from 'react-icons/md';

const InputField = ({ label, type, value, onChange, placeholder, icon, required = true }) => (
  <div className="mb-3.5 sm:mb-4">
    <label className="block text-[11px] sm:text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1 ml-1">
      {label}
    </label>
    <div className="relative flex items-center bg-gray-50/90 dark:bg-gray-700/80 rounded-xl border border-gray-300 dark:border-gray-600 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all shadow-xs">
      {icon && <div className="pl-3.5 text-gray-400 dark:text-gray-500 text-lg sm:text-xl flex-shrink-0">{icon}</div>}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full py-2.5 sm:py-3 px-3.5 bg-transparent outline-none text-gray-800 dark:text-white placeholder:text-gray-400 text-base"
      />
    </div>
  </div>
);

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (!email || !password) {
        throw new Error("El email y la contraseña son obligatorios.");
      }

      const user = await login(email, password, rememberMe);
      
      navigate("/login-success", { state: { name: user.name, role: user.role, sexo: user.sexo }, replace: true });

    } catch (err) {
      console.error(err);
      setError(err.message || "No se pudo iniciar sesión. Verifica tus credenciales.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="min-h-[calc(100dvh-4rem)] sm:min-h-[80vh] flex flex-col justify-center items-center px-4 py-3 sm:py-8 w-full font-display">
        <div className="w-full max-w-sm sm:max-w-md bg-white dark:bg-gray-800 rounded-3xl sm:rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-700/80 p-5 sm:p-8 transition-all overflow-hidden flex flex-col justify-center animate-in fade-in zoom-in-105 slide-in-from-bottom-4 duration-500 ease-out">
          
          {/* Header */}
          <div className="mb-4 sm:mb-6 text-center">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-2 text-primary shadow-xs animate-fade-in">
              <span className="material-symbols-outlined text-2xl sm:text-3xl">login</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              Bienvenido de nuevo
            </h1>
            <p className="mt-0.5 sm:mt-1 text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
              Accede a tu cuenta Darmax
            </p>
          </div>

          <form onSubmit={handleSubmit} className="animate-slide-up">
            
            <InputField 
                label="Correo Electrónico" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="tu@correo.com"
                icon={<MdEmail />}
            />

            <div className="mb-3.5 sm:mb-4">
              <label className="block text-[11px] sm:text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1 ml-1">
                Contraseña
              </label>
              <div className="relative flex items-center bg-gray-50/90 dark:bg-gray-700/80 rounded-xl border border-gray-300 dark:border-gray-600 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all shadow-xs">
                <div className="pl-3.5 text-gray-400 dark:text-gray-500 text-lg sm:text-xl flex-shrink-0"><MdLock /></div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full py-2.5 sm:py-3 px-3.5 bg-transparent outline-none text-gray-800 dark:text-white placeholder:text-gray-400 text-base"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-2.5 pr-3.5 text-gray-400 hover:text-primary transition-colors cursor-pointer"
                  aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                >
                  {showPassword ? <MdVisibilityOff size={20}/> : <MdVisibility size={20}/>}
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-xs sm:text-sm text-center font-medium animate-shake">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between gap-2 mb-4 sm:mb-6">
              <label className="flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="ml-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 group-hover:text-primary transition-colors select-none">
                  Recuérdame
                </span>
              </label>
              
              <Link 
                to="/forgot-password"
                className="text-xs sm:text-sm font-bold text-primary hover:text-primary-dark hover:underline transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 sm:py-3.5 text-base font-bold shadow-md shadow-primary/20"
            >
              {isSubmitting ? 'Iniciando...' : 'Iniciar Sesión'}
            </Button>
          </form>

          {/* Registro - Pregunta arriba y botón debajo */}
          <div className="mt-4 sm:mt-6 pt-3.5 sm:pt-4 border-t border-gray-100 dark:border-gray-700/80 text-center animate-fade-in">
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-2">
              ¿No tienes una cuenta?
            </p>
            <Link
              to="/registro"
              className="inline-flex items-center justify-center w-full py-2.5 px-4 rounded-xl font-bold text-sm text-primary dark:text-blue-400 bg-primary/10 hover:bg-primary/20 dark:bg-primary/20 dark:hover:bg-primary/30 border border-primary/20 transition-all active:scale-95"
            >
              Regístrate gratis
            </Link>
          </div>

        </div>
      </div>
    </MainLayout>
  );
};
export default Login;