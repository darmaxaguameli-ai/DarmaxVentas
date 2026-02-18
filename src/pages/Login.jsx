// src/pages/Login.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { useAuth } from "../context/AuthContext";
import Button from "../components/common/Button";
import { MdVisibility, MdVisibilityOff, MdEmail, MdLock } from 'react-icons/md';

const InputField = ({ label, type, value, onChange, placeholder, icon, required = true }) => (
  <div className="mb-5">
    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5 ml-1">
      {label}
    </label>
    <div className="relative flex items-center bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-300 dark:border-gray-600 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
      {icon && <div className="pl-4 text-gray-400 dark:text-gray-500 text-xl">{icon}</div>}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full py-3.5 px-4 bg-transparent outline-none text-gray-800 dark:text-white placeholder:text-gray-400 text-base"
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
      <div className="min-h-[80vh] flex flex-col justify-center items-center px-4 py-8 w-full font-display">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-700 p-8 sm:p-10 transition-all overflow-hidden flex flex-col justify-center animate-in fade-in zoom-in-105 slide-in-from-bottom-4 duration-500 ease-out">
          
          {/* Header */}
          <div className="mb-10 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary animate-fade-in">
                <span className="material-symbols-outlined text-4xl">login</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              Bienvenido de nuevo
            </h1>
            <p className="mt-2 text-gray-500 dark:text-gray-400 text-sm sm:text-base">
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

            <div className="mb-6">
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5 ml-1">
                Contraseña
              </label>
              <div className="relative flex items-center bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-300 dark:border-gray-600 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <div className="pl-4 text-gray-400 dark:text-gray-500 text-xl"><MdLock /></div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full py-3.5 px-4 bg-transparent outline-none text-gray-800 dark:text-white placeholder:text-gray-400 text-base"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-3 pr-4 text-gray-400 hover:text-primary transition-colors"
                >
                  {showPassword ? <MdVisibilityOff size={22}/> : <MdVisibility size={22}/>}
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm text-center font-medium animate-shake">
                {error}
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <label className="flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400 group-hover:text-primary transition-colors select-none">
                  Recuérdame
                </span>
              </label>
              
              <Link 
                to="/forgot-password"
                className="text-sm font-bold text-primary hover:text-primary-dark hover:underline transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 text-lg shadow-lg shadow-primary/25"
            >
              {isSubmitting ? 'Iniciando...' : 'Iniciar Sesión'}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 text-center animate-fade-in">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              ¿No tienes una cuenta?{" "}
              <Link
                to="/registro"
                className="font-bold text-primary hover:text-primary-dark hover:underline ml-1"
              >
                Regístrate gratis
              </Link>
            </p>
          </div>

        </div>
      </div>
    </MainLayout>
  );
};
export default Login;