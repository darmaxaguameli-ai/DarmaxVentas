import { useState, useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import GestionSidebar from "./GestionSidebar";
import NotificationTray from "../../components/common/NotificationTray";
import NavigationSearchModal from "./components/NavigationSearchModal";
import { ThemeProvider } from "../../context/ThemeContext";
import { GestionProvider } from "./context/GestionContext";
import { NotificationProvider } from "./context/NotificationContext";
import NotificationController from "./components/NotificationController";
import WelcomeModal from "./components/WelcomeModal";
import { Toaster } from "react-hot-toast";
import { triggerHaptic } from "../../utils/haptics";

const GestionDashboard = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false); // Para móvil
  const [isSearchOpen, setIsSearchOpen] = useState(false); // Buscador rápido de apartados
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });

  // Atajo global de teclado para abrir el buscador rápido (Ctrl + K o Cmd + K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
        {/* Backdrop para cerrar sidebar en móvil con transición suave */}
        <div
          className={`fixed inset-0 bg-black/50 backdrop-blur-xs z-40 md:hidden transition-opacity duration-300 ${
            isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => {
            triggerHaptic(10);
            setSidebarOpen(false);
          }}
          aria-hidden="true"
        />

        {/* Barra flotante inferior en celular: Barra única dividida [ 🔍 Buscar | ☰ ] */}
        <div 
          className={`md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-40 select-none transition-all duration-300 pb-[env(safe-area-inset-bottom,0px)] ${
            isSidebarOpen ? 'opacity-0 pointer-events-none translate-y-8' : 'opacity-100 translate-y-0'
          }`}
        >
          <div className="flex items-center bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-xl shadow-black/15 border border-gray-200/90 dark:border-gray-700/80 p-1">
            {/* Lado izquierdo: Búsqueda rápida */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic(12);
                setIsSearchOpen(true);
              }}
              aria-label="Buscar apartados del sistema"
              className="h-11 px-3.5 flex items-center justify-center gap-1.5 rounded-xl text-primary dark:text-blue-400 active:scale-95 transition-transform touch-manipulation cursor-pointer"
              title="Buscar apartados"
            >
              <span className="material-symbols-outlined text-2xl font-bold">search</span>
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">Buscar</span>
            </button>

            {/* Línea divisoria | */}
            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-0.5" aria-hidden="true" />

            {/* Lado derecho: Menú Hamburguesa (sin texto, solo ícono, sin hover color, con respuesta háptica) */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic(15);
                setSidebarOpen(true);
              }}
              aria-label="Abrir menú de navegación"
              className="h-11 w-11 flex items-center justify-center rounded-xl text-gray-800 dark:text-gray-100 active:scale-90 transition-transform touch-manipulation cursor-pointer"
              title="Abrir menú de navegación"
            >
              <span className="material-symbols-outlined text-2xl font-bold">menu</span>
            </button>
          </div>
        </div>

        {/* Acciones flotantes superiores (Búsqueda en escritorio y Notificaciones con auto-ocultamiento al abrir sidebar móvil) */}
        <div className="fixed top-3.5 right-4 sm:top-4 sm:right-6 md:right-8 z-40 flex items-center gap-2.5 select-none">
          {/* Botón de Búsqueda rápida (visible en escritorio) */}
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            aria-label="Buscar apartados (Ctrl + K)"
            className="hidden md:flex items-center gap-2 h-10 sm:h-11 px-3.5 rounded-2xl bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-gray-200/80 dark:border-gray-700/80 shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            title="Buscar apartados (Ctrl + K)"
          >
            <span className="material-symbols-outlined text-lg text-primary">search</span>
            <span className="text-xs font-semibold">Buscar...</span>
            <kbd className="hidden lg:inline-flex items-center text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
              ⌘K
            </kbd>
          </button>

          {/* Botón flotante de Notificaciones (se oculta en móvil al abrir el drawer para que no quede pegado) */}
          <div 
            className={`transition-opacity duration-200 ${
              isSidebarOpen ? 'max-md:opacity-0 max-md:pointer-events-none' : 'opacity-100'
            }`}
          >
            <NotificationTray />
          </div>
        </div>

        {/* Modal de Búsqueda rápida de apartados por permisos */}
        <NavigationSearchModal 
          isOpen={isSearchOpen} 
          onClose={() => setIsSearchOpen(false)} 
        />

        {/* Canvas de Contenido Principal sin salto de scroll */}
        <main 
          ref={mainContentRef} 
          className="flex-1 min-w-0 p-4 sm:p-6 md:p-8 md:pl-5 overflow-y-auto overscroll-contain transition-all duration-200 ease-out pt-16 md:pt-6 pb-16 md:pb-8"
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
