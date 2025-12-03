import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ClientOrderHeader = ({ primaryLink, showOrderSelectionButton }) => {
  const navigate = useNavigate();
  const { logout, user, isAuthenticated } = useAuth(); // Destructure isAuthenticated

  const linkToShow = primaryLink || { to: '/mis-pedidos', label: 'Mis pedidos' };

  return (
    <header
      className="flex w-full items-center justify-between 
                 rounded-2xl border border-light/60 dark:border-white/10
                 bg-white/90 dark:bg-dark/60 shadow-md backdrop-blur-xl 
                 px-6 py-4"
    >
      <Link to="/pedidos" className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl text-primary bg-transparent">
          <img src="/img/logos/darmax-logo.png" alt="Darmax Logo" className="h-full w-auto object-contain" />
        </div>

        <div className="flex flex-col">
          <span className="text-xs font-semibold text-text-secondary dark:text-white/60">
            Sistema de pedidos
          </span>
          <h2 className="text-lg sm:text-xl font-bold tracking-[-0.02em]">
            Darmax Agua
          </h2>
        </div>
      </Link>

      <div className="flex items-center gap-2 sm:gap-4"> {/* Adjusted gap for better mobile spacing */}
        {isAuthenticated ? (
          <>
            <Link
              to={linkToShow.to}
              className="hidden sm:block text-sm sm:text-base font-medium text-text-secondary dark:text-white/70 hover:text-primary dark:hover:text-primary transition-colors"
            >
              {linkToShow.label}
            </Link>

            <button
              onClick={() => navigate('/profile')}
              className="flex h-10 w-10 items-center justify-center rounded-full
                         bg-light dark:bg-primary/20 text-text-secondary dark:text-white"
              aria-label="Perfil"
            >
              <span className="material-symbols-outlined text-2xl">
                person
              </span>
            </button>

            <button
              onClick={() => {
                logout();
                navigate('/logout-success', { state: { name: user?.name } });
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full
                         bg-light dark:bg-primary/20 text-text-secondary dark:text-white"
              aria-label="Cerrar Sesión"
            >
              <span className="material-symbols-outlined text-2xl">
                logout
              </span>
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
