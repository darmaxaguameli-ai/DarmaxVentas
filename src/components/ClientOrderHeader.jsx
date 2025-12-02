import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ClientOrderHeader = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  return (
    <header
      className="flex w-full items-center justify-between 
                 rounded-2xl border border-light/60 dark:border-white/10
                 bg-white/90 dark:bg-dark/60 shadow-md backdrop-blur-xl 
                 px-6 py-4"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <svg
            fill="none"
            viewBox="0 0 48 48"
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
          >
            <path
              d="M4 4H17.3334V17.3334H30.6666V30.6666H44V44H4V4Z"
              fill="currentColor"
            />
          </svg>
        </div>

        <div className="flex flex-col">
          <span className="text-xs font-semibold text-text-secondary dark:text-white/60">
            Sistema de pedidos
          </span>
          <h2 className="text-lg sm:text-xl font-bold tracking-[-0.02em]">
            Darmax – Agua Pura
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Link
          to="/mis-pedidos"
          className="hidden sm:block text-sm sm:text-base font-medium text-text-secondary dark:text-white/70 hover:text-primary dark:hover:text-primary transition-colors"
        >
          Mis pedidos
        </Link>

        <button
          onClick={() => navigate('/client/profile')}
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
      </div>
    </header>
  );
};

export default ClientOrderHeader;
