import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useClient } from '../pages/Client/context/ClientContext'; // Import useClient

const ClientOrderHeader = ({ primaryLink, showOrderSelectionButton }) => {
  const navigate = useNavigate();
  const { logout, user, isAuthenticated } = useAuth(); 
  const { theme, toggleTheme } = useTheme();
  const { selectedStore, loadingLocation } = useClient(); // Use client context
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const linkToShow = primaryLink || { to: '/mis-pedidos', label: 'Mis pedidos' };

  return (
    <header
      className="flex items-center justify-between 
                 fixed bottom-0 left-0 w-full z-50
                 rounded-t-[2.5rem] 
                 border-t border-light/60 dark:border-white/10
                 bg-white/95 dark:bg-dark/90 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.2)] backdrop-blur-xl 
                 px-6 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))]
                 
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
      <div className="flex sm:hidden w-full items-center justify-around">
        {/* Home / Pedidos */}
        <Link to="/pedidos" className="flex flex-col items-center gap-1 text-text-secondary dark:text-white/60 hover:text-primary active:text-primary transition-colors">
          <span className="material-symbols-outlined text-2xl">home</span>
          <span className="text-[10px] font-medium">Inicio</span>
        </Link>

        {/* Action Button (Orders/Cart or Login) */}
        {isAuthenticated ? (
            <Link to={linkToShow.to} className="flex flex-col items-center gap-1 text-text-secondary dark:text-white/60 hover:text-primary active:text-primary transition-colors">
              <span className="material-symbols-outlined text-2xl">
                {linkToShow.to === '/mis-pedidos' ? 'receipt_long' : 'add_shopping_cart'}
              </span>
              <span className="text-[10px] font-medium">Pedidos</span>
            </Link>
        ) : (
            <Link to="/login" className="flex flex-col items-center gap-1 text-text-secondary dark:text-white/60 hover:text-primary active:text-primary transition-colors">
              <span className="material-symbols-outlined text-2xl">login</span>
              <span className="text-[10px] font-medium">Entrar</span>
            </Link>
        )}

        {/* Profile / Menu */}
        {isAuthenticated && (
            <div className="relative">
                <button
                    onClick={() => setIsMenuOpen(prev => !prev)}
                    className={`flex flex-col items-center gap-1 transition-colors ${isMenuOpen ? 'text-primary' : 'text-text-secondary dark:text-white/60'}`}
                >
                    <span className="material-symbols-outlined text-2xl">person</span>
                    <span className="text-[10px] font-medium">Perfil</span>
                </button>
                {/* Mobile Menu Popup (Upwards) */}
                {isMenuOpen && (
                    <div className="absolute bottom-full right-0 mb-4 w-48 rounded-xl bg-white dark:bg-gray-800 p-2 shadow-2xl border border-gray-100 dark:border-gray-700 animate-in slide-in-from-bottom-2 fade-in duration-200">
                        <Link to="/profile" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <span className="material-symbols-outlined text-xl">account_circle</span>
                            Mi Perfil
                        </Link>
                        <button
                            onClick={toggleTheme}
                            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        >
                            <span className="material-symbols-outlined text-xl">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
                            Cambiar Tema
                        </button>
                        <div className="h-px bg-gray-100 dark:bg-gray-700 my-1"></div>
                        <button
                            onClick={() => {
                                logout();
                                navigate('/logout-success', { state: { name: user?.name } });
                                setIsMenuOpen(false);
                            }}
                            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10"
                        >
                            <span className="material-symbols-outlined text-xl">logout</span>
                            Cerrar Sesión
                        </button>
                    </div>
                )}
            </div>
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
              onClick={() => {
                logout();
                navigate('/logout-success', { state: { name: user?.name } });
              }}
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
    </header>
  );
};

export default ClientOrderHeader;
