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
      logout();
      navigate('/logout-success', { state: { name: user?.name } });
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
      <div className="flex sm:hidden w-full items-center justify-between px-1 gap-1">
        {/* 1. Inicio */}
        <Link 
            to="/pedidos" 
            className={`flex flex-col items-center gap-0.5 p-2 rounded-lg transition-colors ${isActive('/pedidos') ? 'text-primary' : 'text-text-secondary dark:text-white/60 hover:text-primary active:text-primary'}`}
        >
          <span className="material-symbols-outlined text-2xl">home</span>
          <span className="text-[9px] font-semibold">Inicio</span>
        </Link>

        {/* 2. Action Button (Pedidos/Cart or Login) */}
        {isAuthenticated ? (
            <Link 
                to={linkToShow.to} 
                className={`flex flex-col items-center gap-0.5 p-2 rounded-lg transition-colors ${isActive(linkToShow.to) ? 'text-primary' : 'text-text-secondary dark:text-white/60 hover:text-primary active:text-primary'}`}
            >
              <span className="material-symbols-outlined text-2xl">
                {linkToShow.to === '/mis-pedidos' ? 'receipt_long' : 'add_shopping_cart'}
              </span>
              <span className="text-[9px] font-semibold">Pedidos</span>
            </Link>
        ) : (
            <Link 
                to="/login" 
                className={`flex flex-col items-center gap-0.5 p-2 rounded-lg transition-colors ${isActive('/login') ? 'text-primary' : 'text-text-secondary dark:text-white/60 hover:text-primary active:text-primary'}`}
            >
              <span className="material-symbols-outlined text-2xl">login</span>
              <span className="text-[9px] font-semibold">Entrar</span>
            </Link>
        )}

        {/* 3. Perfil (Direct Link) */}
        {isAuthenticated && (
            <Link 
                to="/profile"
                className={`flex flex-col items-center gap-0.5 p-2 rounded-lg transition-colors ${isActive('/profile') ? 'text-primary' : 'text-text-secondary dark:text-white/60 hover:text-primary'}`}
            >
                <span className="material-symbols-outlined text-2xl">person</span>
                <span className="text-[9px] font-semibold">Perfil</span>
            </Link>
        )}

        {/* 4. Tema (Toggle) */}
        {isAuthenticated && (
            <button
                onClick={toggleTheme}
                className="flex flex-col items-center gap-0.5 p-2 rounded-lg transition-colors text-text-secondary dark:text-white/60 hover:text-primary"
            >
                <span className="material-symbols-outlined text-2xl">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
                <span className="text-[9px] font-semibold">Tema</span>
            </button>
        )}

        {/* 5. Salir (Logout) */}
        {isAuthenticated && (
            <button
                onClick={handleLogout}
                className="flex flex-col items-center gap-0.5 p-2 rounded-lg transition-colors text-red-500/80 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
            >
                <span className="material-symbols-outlined text-2xl">logout</span>
                <span className="text-[9px] font-semibold">Salir</span>
            </button>
        )}
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
