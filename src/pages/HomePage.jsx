// src/pages/HomePage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout.jsx";
import { MdLogin, MdPersonAdd } from 'react-icons/md';
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

const HomePage = () => {
  const [isExiting, setIsExiting] = useState(false);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, hasPermission, loading } = useAuth();

  // Redirección automática si ya está logueado
  useEffect(() => {
    if (!loading && isAuthenticated) {
      let redirectPath = '/pedidos';
      
      if (hasPermission('canAccessManagement')) {
        redirectPath = '/gestion';
      } else if (hasPermission('canAccessPOS')) {
        redirectPath = '/ventas/mostrador';
      } else if (hasPermission('canAccessDelivery')) {
        redirectPath = '/repartidor/dashboard';
      }

      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, loading, hasPermission, navigate]);

  const handleNavigation = (path) => {
    setIsExiting(true);
    setTimeout(() => {
      navigate(path);
    }, 700); // Duración de la animación sincronizada
  };

  if (loading || (isAuthenticated && !isExiting)) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-light dark:bg-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="flex flex-col justify-center items-center h-screen w-full overflow-hidden">
        {/* Main Card - Hybrid mode: Full screen mobile / Floating desktop */}
        <div
          className={`
                    bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 
                    p-8 sm:p-12 flex flex-col items-center justify-center text-center relative overflow-hidden 
                    transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1) shadow-2xl
                    ${isExiting
              ? 'w-[448px] h-[600px] rounded-[2.5rem] scale-95 opacity-100'
              : 'w-full h-full sm:w-[94%] sm:max-w-[1400px] sm:h-[88vh] rounded-none sm:rounded-[3rem] shadow-none sm:shadow-2xl border-0 sm:border animate-slide-up'
            }
                `}
        >
          {/* Decorative Background Elements (Dynamic) */}
          <div className={`absolute -top-20 -right-20 bg-primary/10 rounded-full blur-[100px] transition-all duration-1000 ${isExiting ? 'w-0 h-0 opacity-0' : 'w-64 sm:w-[500px] h-64 sm:h-[500px]'}`}></div>
          <div className={`absolute -bottom-20 -left-20 bg-blue-400/10 rounded-full blur-[100px] transition-all duration-1000 ${isExiting ? 'w-0 h-0 opacity-0' : 'w-64 sm:w-[500px] h-64 sm:h-[500px]'}`}></div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className={`absolute top-4 right-4 sm:top-8 sm:right-8 p-3 rounded-2xl bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary hover:bg-white dark:hover:bg-gray-700 transition-all duration-300 z-50 shadow-sm border border-gray-100 dark:border-gray-600 ${isExiting ? 'opacity-0 scale-0' : 'opacity-100 scale-100'}`}
            title={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
          >
            <span className="material-symbols-outlined text-2xl flex items-center justify-center">
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

          {/* Main Content Wrapper - Fades out fast on exit */}
          <div className={`flex-grow flex flex-col items-center justify-center w-full transition-all duration-300 ${isExiting ? 'opacity-0 scale-90 blur-sm' : 'opacity-100'}`}>
            {/* Logo Section */}
            <div className="mb-4 sm:mb-8 w-full flex justify-center">
              <img
                src={theme === 'dark' ? '/img/logos/LogoTO.png' : '/img/logos/darmax-logo.png'}
                alt="Logo DARMAX"
                className="h-20 sm:h-32 lg:h-40 w-auto object-contain drop-shadow-xl"
              />
            </div>

            {/* Text Content */}
            <h1 className="font-black text-gray-900 dark:text-white tracking-tight mb-3 sm:mb-4 text-2xl sm:text-4xl md:text-5xl lg:text-6xl">
              Bienvenido a <span className="text-primary block sm:inline">Darmax Agua</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-8 sm:mb-12 mx-auto text-sm sm:text-base lg:text-lg max-w-xl">
              La forma más rápida, confiable y moderna de pedir agua purificada directamente a la puerta de tu hogar.
            </p>

            {/* Action Buttons Container */}
            <div className="w-full grid gap-3 sm:gap-4 max-w-xl grid-cols-1 sm:grid-cols-2 mx-auto">
              {/* Botón Registrarse */}
              <button
                onClick={() => handleNavigation('/registro')}
                className="group relative h-14 flex items-center justify-center gap-3 rounded-xl bg-primary text-white hover:text-white font-bold text-base shadow-lg shadow-primary/30 hover:bg-primary-dark transition-all active:scale-[0.98] hover:-translate-y-1"
              >
                <MdPersonAdd className="text-xl" />
                <span>Registrarse</span>
              </button>

              {/* Botón Iniciar Sesión */}
              <button
                onClick={() => handleNavigation('/login')}
                className="group h-14 flex items-center justify-center gap-3 rounded-xl bg-white dark:bg-gray-700 text-gray-700 dark:text-white font-bold text-base border-2 border-gray-100 dark:border-gray-600 hover:border-primary/30 transition-all active:scale-[0.98] hover:-translate-y-1 shadow-sm hover:shadow-md"
              >
                <MdLogin className="text-xl text-gray-400 dark:text-gray-300 group-hover:text-primary transition-colors" />
                <span>Iniciar Sesión</span>
              </button>
            </div>
          </div>

          {/* Internal Help Links - Desktop only */}
          <div className={`hidden sm:block mt-auto pt-6 border-t border-gray-100 dark:border-gray-700 w-full transition-all duration-300 ${isExiting ? 'opacity-0 translate-y-10' : 'opacity-100'}`}>
            <div className="flex flex-wrap justify-center gap-6 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
              <a href="#" className="hover:text-primary transition-colors">Términos</a>
              <a href="#" className="hover:text-primary transition-colors">Privacidad</a>
              <a href="#" className="hover:text-primary transition-colors">Ayuda</a>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default HomePage;
