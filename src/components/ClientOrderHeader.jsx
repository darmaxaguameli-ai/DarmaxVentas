import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { triggerHaptic } from '../utils/haptics';
import Swal from 'sweetalert2';
import {
  RiHome5Line,
  RiHome5Fill,
  RiFileList3Line,
  RiFileList3Fill,
  RiShoppingBag3Line,
  RiShoppingBag3Fill,
  RiUser3Line,
  RiUser3Fill,
  RiSunLine,
  RiSunFill,
  RiMoonClearLine,
  RiMoonClearFill,
  RiLogoutBoxRLine,
  RiLoginCircleLine,
} from 'react-icons/ri';

const ClientOrderHeader = ({ primaryLink, showOrderSelectionButton }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user, isAuthenticated } = useAuth(); 
  const { theme, toggleTheme } = useTheme();

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
      setTimeout(() => {
        logout();
      }, 100);
    }
  };

  return (
    <nav
      className="flex items-center justify-between 
                 fixed bottom-3 left-1/2 -translate-x-1/2 w-[calc(100%-1.25rem)] max-w-lg z-[100]
                 rounded-3xl 
                 border border-white/70 dark:border-white/10
                 bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl
                 shadow-2xl shadow-black/15
                 px-2 py-1 pb-[max(0.35rem,env(safe-area-inset-bottom))]
                 
                 sm:relative sm:bottom-auto sm:left-auto sm:translate-x-0 sm:w-full sm:max-w-none sm:rounded-3xl 
                 sm:border sm:border-white/70 sm:dark:border-white/10 sm:shadow-xl sm:shadow-primary/5 
                 sm:px-6 sm:py-3.5 sm:bg-white/80 sm:dark:bg-gray-800/80 sm:backdrop-blur-2xl"
    >
      {/* --- DESKTOP / TOTEM LOGO & INFO (Hidden on mobile) --- */}
      <Link 
        to="/pedidos" 
        onClick={() => triggerHaptic(10)}
        className="hidden sm:flex items-center gap-3.5 group cursor-pointer select-none"
      >
        <img 
          src={theme === 'dark' ? '/img/logos/LogoTO.png' : '/img/logos/darmax-logo.png'} 
          alt="Darmax Logo" 
          className="h-12 w-auto object-contain drop-shadow-sm group-hover:scale-105 transition-transform duration-200" 
        />
        <h2 className="text-2xl font-black tracking-tight leading-none text-gray-900 dark:text-white group-hover:text-primary transition-colors">
          Darmax Agua
        </h2>
      </Link>

      {/* --- MOBILE NAVIGATION DOCK (Visible only on mobile) --- */}
      <div className="flex sm:hidden w-full items-center justify-between px-0.5 py-0.5">
        {[
          {
            to: '/pedidos',
            icon: RiHome5Line,
            activeIcon: RiHome5Fill,
            label: 'Inicio',
            active: currentPath === '/pedidos',
          },
          {
            to: linkToShow.to,
            icon: linkToShow.to === '/mis-pedidos' ? RiFileList3Line : RiShoppingBag3Line,
            activeIcon: linkToShow.to === '/mis-pedidos' ? RiFileList3Fill : RiShoppingBag3Fill,
            label: linkToShow.label || 'Pedidos',
            active: currentPath === '/mis-pedidos' || (currentPath.startsWith('/pedidos/') && currentPath !== '/pedidos'),
            show: isAuthenticated,
          },
          {
            to: '/login',
            icon: RiLoginCircleLine,
            activeIcon: RiLoginCircleLine,
            label: 'Entrar',
            active: isActive('/login'),
            show: !isAuthenticated,
          },
          {
            to: '/profile',
            icon: RiUser3Line,
            activeIcon: RiUser3Fill,
            label: 'Perfil',
            active: isActive('/profile'),
            show: isAuthenticated,
          },
          {
            action: toggleTheme,
            icon: theme === 'dark' ? RiSunLine : RiMoonClearLine,
            activeIcon: theme === 'dark' ? RiSunFill : RiMoonClearFill,
            iconColor: theme === 'dark' ? 'text-amber-400' : 'text-indigo-500',
            label: theme === 'dark' ? 'Claro' : 'Oscuro',
            active: false,
            show: isAuthenticated,
          },
          {
            action: handleLogout,
            icon: RiLogoutBoxRLine,
            activeIcon: RiLogoutBoxRLine,
            label: 'Salir',
            active: false,
            isDanger: true,
            show: isAuthenticated,
          },
        ].filter(item => item.show !== false).map((item, index) => {
          const IconComponent = item.active ? item.activeIcon : item.icon;

          const Content = () => (
            <div className="flex flex-col items-center justify-center gap-1 select-none w-full">
              <div
                className={`flex items-center justify-center w-10 h-8 rounded-full transition-all duration-200 ${
                  item.isDanger
                    ? 'text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 active:scale-90'
                    : item.active
                    ? 'bg-primary/15 dark:bg-primary/25 text-primary dark:text-blue-400 shadow-sm shadow-primary/20 scale-105'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/70 dark:hover:bg-gray-800/70 active:scale-95'
                }`}
              >
                <IconComponent className={`text-[21px] transition-transform ${item.iconColor || ''}`} />
              </div>
              <span
                className={`text-[10px] tracking-tight leading-none transition-colors ${
                  item.isDanger
                    ? 'text-rose-500 font-semibold'
                    : item.active
                    ? 'text-primary dark:text-blue-400 font-bold'
                    : 'text-gray-500 dark:text-gray-400 font-medium'
                }`}
              >
                {item.label}
              </span>
            </div>
          );

          return item.to ? (
            <Link 
              key={index} 
              to={item.to} 
              onClick={() => triggerHaptic(10)}
              className="flex-1 flex items-center justify-center py-1 touch-manipulation cursor-pointer"
            >
              <Content />
            </Link>
          ) : (
            <button 
              key={index} 
              type="button"
              onClick={() => {
                triggerHaptic(12);
                item.action();
              }} 
              className="flex-1 flex items-center justify-center py-1 touch-manipulation cursor-pointer border-0 bg-transparent"
            >
              <Content />
            </button>
          );
        })}
      </div>

      {/* --- DESKTOP / TOTEM RIGHT MENU (Touch-friendly & Glassmorphic) --- */}
      <div className="hidden sm:flex items-center gap-3">
        {isAuthenticated ? (
          <>
            <Link
              to={linkToShow.to}
              onClick={() => triggerHaptic(10)}
              className="flex items-center gap-2 h-11 px-4 rounded-2xl bg-white/70 dark:bg-gray-700/60 border border-gray-200/80 dark:border-gray-600/80 text-sm font-bold text-gray-700 dark:text-gray-200 hover:text-primary dark:hover:text-primary shadow-xs hover:scale-105 active:scale-95 transition-all"
            >
              <RiFileList3Line className="text-xl text-primary" />
              <span>{linkToShow.label}</span>
            </Link>

            <button
              type="button"
              onClick={() => {
                triggerHaptic(12);
                toggleTheme();
              }}
              className="h-11 w-11 flex items-center justify-center rounded-2xl bg-white/70 dark:bg-gray-700/60 border border-gray-200/80 dark:border-gray-600/80 text-gray-700 dark:text-gray-200 hover:text-primary shadow-xs hover:scale-105 active:scale-95 transition-all cursor-pointer"
              aria-label="Cambiar tema"
              title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
            >
              {theme === 'dark' ? (
                <RiSunLine className="text-xl text-amber-400" />
              ) : (
                <RiMoonClearLine className="text-xl text-indigo-500" />
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic(10);
                navigate('/profile');
              }}
              className="h-11 w-11 flex items-center justify-center rounded-2xl bg-white/70 dark:bg-gray-700/60 border border-gray-200/80 dark:border-gray-600/80 text-gray-700 dark:text-gray-200 hover:text-primary shadow-xs hover:scale-105 active:scale-95 transition-all cursor-pointer"
              aria-label="Perfil"
              title="Mi Perfil"
            >
              <RiUser3Line className="text-xl" />
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic(12);
                handleLogout();
              }}
              className="h-11 w-11 flex items-center justify-center rounded-2xl bg-white/70 dark:bg-gray-700/60 border border-gray-200/80 dark:border-gray-600/80 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 shadow-xs hover:scale-105 active:scale-95 transition-all cursor-pointer"
              aria-label="Cerrar Sesión"
              title="Cerrar Sesión"
            >
              <RiLogoutBoxRLine className="text-xl" />
            </button>
          </>
        ) : (
          showOrderSelectionButton && (
            <Link
              to="/pedidos"
              onClick={() => triggerHaptic(10)}
              className="flex h-11 items-center justify-center rounded-2xl bg-primary px-5 text-sm font-bold text-white shadow-md shadow-primary/25 hover:bg-primary-dark hover:scale-105 active:scale-95 transition-all cursor-pointer"
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
