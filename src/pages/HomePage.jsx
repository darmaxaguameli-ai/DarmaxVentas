// src/pages/HomePage.jsx
import { useState } from 'react';
import { Link, useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout.jsx";
import { MdLogin, MdPersonAdd } from 'react-icons/md';

const HomePage = () => {
  const [isExiting, setIsExiting] = useState(false);
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    setIsExiting(true);
    setTimeout(() => {
      navigate(path);
    }, 400); // Duración de la animación
  };

  return (

    <MainLayout>

      <div className="flex flex-col justify-center items-center h-full sm:min-h-0 min-h-[80vh] px-4 py-8 w-full overflow-y-auto custom-scrollbar">

        {/* Main Card */}

        <div
          className={`
                    bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-lg border border-gray-100 dark:border-gray-700 
                    p-6 sm:p-12 md:py-14 md:px-32 flex flex-col items-center justify-center text-center relative overflow-hidden 
                    transition-all duration-500 ease-in-out min-h-0 lg:h-[82vh] w-full
                    ${isExiting
              ? 'max-w-md scale-95 opacity-80 translate-y-4 rounded-3xl'
              : 'sm:w-[95%] lg:w-[95%] scale-100 opacity-100 animate-slide-up'
            }
                `}
        >

          {/* Decorative Background Elements (Dynamic) */}
          <div className={`absolute -top-20 -right-20 bg-primary/5 rounded-full blur-3xl transition-all duration-700 ${isExiting ? 'w-32 h-32' : 'w-64 sm:w-96 h-64 sm:h-96'}`}></div>
          <div className={`absolute -bottom-20 -left-20 bg-blue-400/5 rounded-full blur-3xl transition-all duration-700 ${isExiting ? 'w-32 h-32' : 'w-64 sm:w-96 h-64 sm:h-96'}`}></div>

          {/* Logo Section - Escalado responsivo */}
          <div className={`mb-6 sm:mb-12 w-full flex justify-center transition-all duration-500 ${isExiting ? 'scale-50' : 'scale-100 sm:scale-110'}`}>
            <img
              src="/img/logos/darmax-logo.png"
              alt="Logo DARMAX"
              className="h-20 sm:h-32 lg:h-48 w-auto object-contain drop-shadow-md"
            />
          </div>

          {/* Text Content */}
          <h1 className={`font-black text-gray-900 dark:text-white tracking-tight mb-4 sm:mb-6 transition-all duration-500 ${isExiting ? 'text-2xl' : 'text-3xl sm:text-5xl md:text-7xl'}`}>
            Bienvenido a <span className="text-primary block sm:inline">Darmax Agua</span>
          </h1>
          <p className={`text-gray-500 dark:text-gray-400 leading-relaxed mb-8 sm:mb-16 mx-auto transition-all duration-500 ${isExiting ? 'text-sm max-w-xs opacity-0' : 'text-base sm:text-lg lg:text-2xl max-w-2xl opacity-100'}`}>
            La forma más rápida, confiable y moderna de pedir agua purificada directamente a la puerta de tu hogar.
          </p>

          {/* Action Buttons Container */}
          <div className={`w-full grid gap-4 sm:gap-6 transition-all duration-500 ${isExiting ? 'max-w-xs grid-cols-1 mx-auto' : 'max-w-2xl grid-cols-1 sm:grid-cols-2 mx-auto'}`}>

            {/* Botón Registrarse */}
            <button
              onClick={() => handleNavigation('/registro')}
              className="group relative h-16 flex items-center justify-center gap-3 rounded-2xl bg-primary text-white hover:text-white font-bold text-lg shadow-xl shadow-primary/30 hover:bg-primary-dark transition-all active:scale-[0.98] hover:-translate-y-1"
            >
              <div className="absolute inset-0 bg-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <MdPersonAdd className="text-2xl" />
              <span>Registrarse</span>
            </button>

            {/* Botón Iniciar Sesión */}
            <button
              onClick={() => handleNavigation('/login')}
              className="group h-16 flex items-center justify-center gap-3 rounded-2xl bg-white dark:bg-gray-700 text-gray-700 dark:text-white hover:text-primary dark:hover:text-primary-light font-bold text-lg border-2 border-gray-100 dark:border-gray-600 hover:border-primary/30 transition-all active:scale-[0.98] hover:-translate-y-1 shadow-sm hover:shadow-md"
            >
              <MdLogin className="text-2xl text-gray-400 dark:text-gray-300 group-hover:text-primary transition-colors" />
              <span>Iniciar Sesión</span>
            </button>
          </div>

          {/* Footer Links */}
          <div className={`mt-12 pt-8 border-t border-gray-100 dark:border-gray-700 w-full transition-opacity duration-300 ${isExiting ? 'opacity-0' : 'opacity-100'}`}>
            <div className="flex flex-wrap justify-center gap-6 text-sm font-semibold text-gray-400 dark:text-gray-500">
              <a href="#" className="hover:text-primary transition-colors">Términos de Servicio</a>
              <a href="#" className="hover:text-primary transition-colors">Política de Privacidad</a>
              <a href="#" className="hover:text-primary transition-colors">Ayuda</a>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default HomePage;