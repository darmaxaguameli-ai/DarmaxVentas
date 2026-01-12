import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useClient } from '../pages/Client/context/ClientContext'; // Import useClient
import Swal from 'sweetalert2';

const ClientOrderHeader = ({ primaryLink, showOrderSelectionButton }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user, isAuthenticated } = useAuth(); 
  const { theme, toggleTheme } = useTheme();
  const { selectedStore, loadingLocation } = useClient(); // Use client context

  const linkToShow = primaryLink || { to: '/mis-pedidos', label: 'Pedidos' };
  const currentPath = location.pathname;

  const isActive = (path) => currentPath === path;

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: '¿Cerrar sesión?',
      text: "Tendrás que ingresar de nuevo para ver tus pedidos.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      background: theme === 'dark' ? '#1f2937' : '#fff',
      color: theme === 'dark' ? '#fff' : '#000'
    });

    if (result.isConfirmed) {
      const userName = user?.name; // Guardar nombre antes de limpiar
      navigate('/logout-success', { state: { name: userName } });
      // Pequeño delay para asegurar que la navegación ocurra antes de que 
      // AuthContext actualice y potencialmente redirija a /login
      setTimeout(() => {
          logout();
      }, 100);
    }
  };

  return (
    <nav
      className="flex items-center justify-between 
                 fixed bottom-0 left-0 w-full z-[100]
                 rounded-t-[1.5rem] 
                 border-t border-gray-200 dark:border-gray-700
                 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md
                 px-4 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]
                 
                 sm:relative sm:inset-auto sm:w-full sm:rounded-2xl sm:border sm:border-b sm:shadow-md sm:px-6 sm:py-4 sm:bg-white/90 sm:dark:bg-dark/60 sm:pb-4 sm:pt-4"
    >
      {/* --- DESKTOP LOGO & INFO (Hidden on mobile) --- */}
      <Link to="/pedidos" className="hidden sm:flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl text-primary bg-transparent">
          <img src="/img/logos/darmax-logo.png" alt="Darmax Logo" className="h-full w-auto object-contain" />
        </div>

        <div className="flex flex-col items-start">
          <span className="text-xs font-semibold text-text-secondary dark:text-white/60">
            Sistema de pedidos
          </span>
          <h2 className="text-xl font-bold tracking-[-0.02em] leading-tight">
            Darmax Agua
          </h2>
          {/* Store Indicator Desktop */}
          <div className="flex items-center gap-1 mt-0.5">
            {loadingLocation ? (
                <span className="text-xs text-gray-400 animate-pulse">Ubicando sucursal...</span>
            ) : selectedStore ? (
                <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-xs font-medium flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">store</span>
                    <span className="truncate">{selectedStore.name}</span>
                </span>
            ) : (
                <span className="text-xs text-gray-400">Sin sucursal cercana</span>
            )}
          </div>
        </div>
      </Link>

      {/* --- MOBILE NAVIGATION BAR (Visible only on mobile) --- */}
      <div className="flex sm:hidden w-full items-center justify-around px-1 py-2">
        {/* Helper for Nav Items */}
        {[
            { to: '/pedidos', icon: 'home', label: 'Inicio', active: currentPath === '/pedidos' },
            { 
                to: linkToShow.to, 
                icon: linkToShow.to === '/mis-pedidos' ? 'receipt_long' : 'add_shopping_cart', 
                label: 'Pedidos', 
                active: currentPath === '/mis-pedidos' || (currentPath.startsWith('/pedidos/') && currentPath !== '/pedidos'), 
                show: isAuthenticated 
            },
            { to: '/login', icon: 'login', label: 'Entrar', active: isActive('/login'), show: !isAuthenticated },
            { to: '/profile', icon: 'person', label: 'Perfil', active: isActive('/profile'), show: isAuthenticated },
            { action: toggleTheme, icon: theme === 'dark' ? 'light_mode' : 'dark_mode', label: 'Tema', active: false, show: isAuthenticated },
            { action: handleLogout, icon: 'logout', label: 'Salir', active: false, isDanger: true, show: isAuthenticated }
        ].filter(item => item.show !== false).map((item, index) => {
            const activeClass = item.active 
                ? 'bg-primary/10 text-primary' 
                : 'text-text-secondary/70 dark:text-white/50 hover:bg-gray-50 dark:hover:bg-white/5';
            
            const iconClass = item.active ? 'text-primary' : 'text-current';

            // Common content for Link and Button
            const Content = () => (
                <>
                    <div className={`
                        flex items-center justify-center rounded-2xl px-5 py-1.5 mb-1 transition-all duration-300
                        ${item.isDanger ? 'bg-red-50 text-red-500 dark:bg-red-900/20' : activeClass}
                    `}>
                        <span className="material-symbols-outlined text-2xl">
                            {item.icon}
                        </span>
                    </div>
                    <span className={`text-[10px] font-bold ${item.active ? 'text-primary' : (item.isDanger ? 'text-red-500' : 'text-text-secondary/70 dark:text-white/50')}`}>
                        {item.label}
                    </span>
                </>
            );

            return item.to ? (
                <Link key={index} to={item.to} className="flex flex-col items-center justify-center w-full">
                    <Content />
                </Link>
            ) : (
                <button key={index} onClick={item.action} className="flex flex-col items-center justify-center w-full">
                    <Content />
                </button>
            );
        })}
      </div>

      {/* --- DESKTOP RIGHT MENU (Hidden on mobile) --- */}
      <div className="hidden sm:flex items-center gap-4">
        {isAuthenticated ? (
          <>
            <Link
              to={linkToShow.to}
              className="text-sm font-medium text-text-secondary dark:text-white/70 hover:text-primary dark:hover:text-primary transition-colors"
            >
              {linkToShow.label}
            </Link>
            <button
              onClick={toggleTheme}
              className="hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-light dark:bg-primary/20 text-text-secondary dark:text-white"
              aria-label="Cambiar tema"
            >
              <span className="material-symbols-outlined text-2xl">
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-light dark:bg-primary/20 text-text-secondary dark:text-white"
              aria-label="Perfil"
            >
              <span className="material-symbols-outlined text-2xl">person</span>
            </button>
            <button
              onClick={handleLogout}
              className="hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-light dark:bg-primary/20 text-text-secondary dark:text-white"
              aria-label="Cerrar Sesión"
            >
              <span className="material-symbols-outlined text-2xl">logout</span>
            </button>
          </>
        ) : (
          showOrderSelectionButton && (
            <Link
              to="/pedidos"
              className="flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 transition-colors"
            >
              Inicio
            </Link>
          )
        )}
      </div>
    </nav>
  );
};

export default ClientOrderHeader;
