import { useState, useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import GestionSidebar from "./GestionSidebar";
import NotificationTray from "../../components/common/NotificationTray";
import { ThemeProvider } from "../../context/ThemeContext";
import { GestionProvider } from "./context/GestionContext";
import { NotificationProvider } from "./context/NotificationContext";
import NotificationController from "./components/NotificationController";
import WelcomeModal from "./components/WelcomeModal";
import { Toaster } from "react-hot-toast";

const GestionDashboard = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false); // Para móvil
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });

  // Guardar en localStorage cuando cambie el estado
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', isSidebarCollapsed);
  }, [isSidebarCollapsed]);

  // Prevenir scroll en el fondo cuando el menú móvil está abierto (Mobile scroll lock)
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [isSidebarOpen]);

  const toggleSidebarCollapsed = () => {
    setSidebarCollapsed(!isSidebarCollapsed);
  };

  const location = useLocation();
  const mainContentRef = useRef(null);

  // Al navegar entre secciones de gestión, restablecer el scroll al inicio del contenedor
  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [location.pathname]);

  return (
    <ThemeProvider>
      <div className="flex h-screen h-[100dvh] bg-light dark:bg-dark text-text-light dark:text-text-dark font-display overflow-hidden antialiased overscroll-none">
        <Toaster position="top-right" reverseOrder={false} />
        
        {/* Sidebar flotante moderno (Tiene su propio botón de colapso/despliegue integrado) */}
        <GestionSidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
          isCollapsed={isSidebarCollapsed}
          toggleCollapsed={toggleSidebarCollapsed}
        />

        {/* Overlay con blur cinematográfico en móvil */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden transition-opacity duration-200"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          ></div>
        )}

        {/* Botón flotante móvil para abrir menú lateral */}
        <div className="md:hidden fixed top-3.5 left-4 z-40 select-none">
          <button
            className="h-11 w-11 flex items-center justify-center rounded-2xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl text-gray-700 dark:text-gray-200 shadow-md border border-gray-200/80 dark:border-gray-700/80 active:scale-95 transition-all touch-manipulation"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menú de navegación"
          >
            <span className="material-symbols-outlined text-2xl">menu</span>
          </button>
        </div>

        {/* Notificaciones (Botón flotante en móvil y escritorio) */}
        <div className="fixed top-3.5 right-4 sm:top-4 sm:right-6 md:right-8 z-40 select-none">
          <NotificationTray />
        </div>

        {/* Canvas de Contenido Principal sin salto de scroll */}
        <main 
          ref={mainContentRef} 
          className="flex-1 min-w-0 p-4 sm:p-6 md:p-8 md:pl-5 overflow-y-auto overscroll-contain transition-all duration-200 ease-out pt-16 md:pt-6 pb-[max(1.25rem,env(safe-area-inset-bottom,0px))]"
        >
          <NotificationProvider>
            <NotificationController />
            <Outlet />
          </NotificationProvider>
        </main>
      </div>
    </ThemeProvider>
  );
};

export default GestionDashboard;
