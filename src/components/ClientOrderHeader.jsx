import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const ClientOrderHeader = ({ primaryLink, showOrderSelectionButton }) => {
  const navigate = useNavigate();
  const { logout, user, isAuthenticated } = useAuth(); // Destructure isAuthenticated
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const linkToShow = primaryLink || { to: '/mis-pedidos', label: 'Mis pedidos' };

  return (
    <header
      className="flex w-full items-center justify-between 
                 rounded-2xl border border-light/60 dark:border-white/10
                 bg-white/90 dark:bg-dark/60 shadow-md backdrop-blur-xl 
                 px-4 py-4 sm:px-6"
    >
      <Link to="/pedidos" className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl text-primary bg-transparent">
          <img src="/img/logos/darmax-logo.png" alt="Darmax Logo" className="h-full w-auto object-contain" />
        </div>

        <div className="flex flex-col">
          <span className="hidden sm:block text-xs font-semibold text-text-secondary dark:text-white/60">
            Sistema de pedidos
          </span>
          <h2 className="text-lg sm:text-xl font-bold tracking-[-0.02em]">
            Darmax Agua
          </h2>
        </div>
      </Link>

      <div className="flex items-center gap-2 sm:gap-4"> {/* Adjusted gap for better mobile spacing */}
        <button
          onClick={toggleTheme}
          className="flex sm:hidden h-10 w-10 items-center justify-center rounded-full bg-light dark:bg-primary/20 text-text-secondary dark:text-white"
          aria-label="Cambiar tema"
        >
          <span className="material-symbols-outlined text-2xl">
            {theme === 'dark' ? 'light_mode' : 'dark_mode'}
          </span>
        </button>
        {isAuthenticated ? (
          <>
            {/* --- Link Dinámico --- */}
            <Link
              to={linkToShow.to}
              className="hidden sm:block text-sm sm:text-base font-medium text-text-secondary dark:text-white/70 hover:text-primary dark:hover:text-primary transition-colors"
            >
              {linkToShow.label}
            </Link>
            <Link
              to={linkToShow.to}
              className="flex sm:hidden h-10 w-10 items-center justify-center rounded-full bg-light dark:bg-primary/20 text-text-secondary dark:text-white"
              aria-label={linkToShow.label}
            >
              <span className="material-symbols-outlined text-2xl">
                {linkToShow.to === '/mis-pedidos' ? 'receipt_long' : 'add_shopping_cart'}
              </span>
            </Link>

            {/* Theme button for desktop/tablet, placed before profile dropdown */}
            <button
              onClick={toggleTheme}
              className="hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-light dark:bg-primary/20 text-text-secondary dark:text-white"
              aria-label="Cambiar tema"
            >
              <span className="material-symbols-outlined text-2xl">
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
            </button>

            {/* --- Profile Dropdown Menu --- */}
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(prev => !prev)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-light dark:bg-primary/20 text-text-secondary dark:text-white"
                aria-label="Abrir menú de usuario"
              >
                <span className="material-symbols-outlined text-2xl">
                  person
                </span>
              </button>
              {isMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800 dark:ring-gray-700 z-50">
                  <Link
                    to="/profile"
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Mi Perfil
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      navigate('/logout-success', { state: { name: user?.name } });
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
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
