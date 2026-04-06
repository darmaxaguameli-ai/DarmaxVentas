// src/pages/Maintenance.jsx
import { useState } from 'react';
import { useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout.jsx";
import { MdSettingsSuggest, MdRefresh, MdHome } from 'react-icons/md';
import { useTheme } from "../context/ThemeContext";

const Maintenance = () => {
  const [isExiting, setIsExiting] = useState(false);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleNavigation = (path) => {
    setIsExiting(true);
    setTimeout(() => {
      navigate(path);
    }, 700);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <MainLayout>
      <div className="flex flex-col justify-center items-center h-screen w-full overflow-hidden bg-light dark:bg-dark">
        {/* Main Card */}
        <div
          className={`
            bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 
            p-8 sm:p-12 flex flex-col items-center justify-center text-center relative overflow-hidden 
            transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1) shadow-2xl
            ${isExiting
              ? 'w-[448px] h-[600px] rounded-[2.5rem] scale-95 opacity-100'
              : 'w-full h-full sm:w-[90%] sm:max-w-[1000px] sm:h-[80vh] rounded-none sm:rounded-[3rem] shadow-none sm:shadow-2xl border-0 sm:border animate-slide-up'
            }
          `}
        >
          {/* Decorative Background Elements */}
          <div className={`absolute -top-20 -right-20 bg-amber-400/10 rounded-full blur-[100px] transition-all duration-1000 ${isExiting ? 'w-0 h-0 opacity-0' : 'w-64 sm:w-[400px] h-64 sm:h-[400px]'}`}></div>
          <div className={`absolute -bottom-20 -left-20 bg-primary/10 rounded-full blur-[100px] transition-all duration-1000 ${isExiting ? 'w-0 h-0 opacity-0' : 'w-64 sm:w-[400px] h-64 sm:h-[400px]'}`}></div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`absolute top-4 right-4 sm:top-8 sm:right-8 p-3 rounded-2xl bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 hover:text-primary transition-all duration-300 z-50 shadow-sm border border-gray-100 dark:border-gray-600 ${isExiting ? 'opacity-0 scale-0' : 'opacity-100 scale-100'}`}
          >
            <span className="material-symbols-outlined text-2xl flex items-center justify-center">
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

          {/* Main Content */}
          <div className={`flex-grow flex flex-col items-center justify-center w-full transition-all duration-300 ${isExiting ? 'opacity-0 scale-90 blur-sm' : 'opacity-100'}`}>
            
            {/* Animated Maintenance Icon */}
            <div className="mb-8 relative">
              <div className="absolute inset-0 bg-amber-400/20 rounded-full blur-2xl animate-pulse"></div>
              <div className="relative p-6 bg-amber-50 dark:bg-amber-900/20 rounded-3xl border-2 border-amber-100 dark:border-amber-800/50">
                <MdSettingsSuggest className="text-7xl sm:text-8xl text-amber-500 animate-spin-slow" />
              </div>
            </div>

            {/* Logo (Optional but recommended for branding) */}
            <div className="mb-6 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
               <img
                src={theme === 'dark' ? '/img/logos/LogoTO.png' : '/img/logos/darmax-logo.png'}
                alt="Logo DARMAX"
                className="h-12 sm:h-16 w-auto object-contain"
              />
            </div>

            {/* Text Content */}
            <h1 className="font-black text-gray-900 dark:text-white tracking-tight mb-4 text-3xl sm:text-5xl lg:text-6xl">
              Estamos en <span className="text-amber-500 block sm:inline italic">Mantenimiento</span>
            </h1>
            
            <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-10 mx-auto text-sm sm:text-base lg:text-lg max-w-xl">
              Estamos realizando mejoras importantes en el sistema para brindarte una mejor experiencia. 
              Estaremos de vuelta en unos minutos. ¡Gracias por tu paciencia!
            </p>

            {/* Action Buttons */}
            <div className="w-full flex justify-center max-w-md mx-auto">
              <button
                onClick={handleRefresh}
                className="group h-14 w-full sm:w-64 flex items-center justify-center gap-3 rounded-xl bg-amber-500 text-white font-bold text-base shadow-lg shadow-amber-500/30 hover:bg-amber-600 transition-all active:scale-[0.98] hover:-translate-y-1"
              >
                <MdRefresh className="text-2xl group-hover:rotate-180 transition-transform duration-500" />
                <span>Reintentar</span>
              </button>
            </div>

          </div>

          {/* Footer Branding */}
          <div className="mt-auto pt-6 border-t border-gray-100 dark:border-gray-700 w-full opacity-50">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
              SISTEMA INTEGRAL DE GESTIÓN DARMAX &copy; 2026
            </p>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}} />
    </MainLayout>
  );
};

export default Maintenance;
