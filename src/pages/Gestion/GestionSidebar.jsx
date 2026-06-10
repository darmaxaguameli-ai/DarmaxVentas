import React, { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

// Definición de la estructura del menú
const menuStructure = [
  {
    type: "link",
    name: "Resumen",
    path: "/gestion",
    icon: "dashboard",
    permission: "canViewSummary", // ✅ Cambiado de canAccessManagement
  },
  {
    type: "group",
    name: "Operaciones",
    icon: "storefront",
    children: [
      { name: "Inventario", path: "inventario", icon: "inventory_2", permission: "canAccessInventory" },
    ],
  },
  {
    type: "group",
    name: "Darmax Corp",
    icon: "corporate_fare",
    children: [
      { name: "Área Legal", path: "legal", icon: "balance", permission: "canAccessLegal" },
    ],
  },
  {
    type: "group",
    name: "Ingeniería",
    icon: "engineering",
    children: [
      { name: "Instalación", path: "instalacion", icon: "construction", permission: "canAccessInstallation" },
    ],
  },
  {
    type: "group",
    name: "Exhibición",
    icon: "public",
    children: [
      { name: "Mapa de Instalaciones", path: "mapa-instalaciones", icon: "map", permission: "canAccessShowcase" },
    ],
  },
  {
    type: "group",
    name: "Marketing",
    icon: "campaign",
    children: [
      { name: "Marketing Planner", path: "marketing", icon: "ads_click", permission: "canAccessMarketing" },
      { name: "Promociones", path: "promociones", icon: "loyalty", permission: "canAccessMarketing" },
    ],
  },
  {
    type: "group",
    name: "Contenido y Guías",
    icon: "web",
    children: [
      { name: "Editor de Blog", path: "blog", icon: "newspaper", permission: "canAccessMarketing" },
      { name: "Centro de Guías", path: "guias", icon: "menu_book", permission: "canViewSummary" },
    ],
  },
  {
    type: "group",
    name: "Ventas de Campo",
    icon: "groups",
    children: [
      { name: "Prospección", path: "prospeccion", icon: "trending_up", permission: "canAccessLeads" },
    ],
  },
  {
    type: "group",
    name: "Cotizadores",
    icon: "request_quote",
    children: [
      { name: "Cotizador Dist.", path: "cotizador-distribuidores", icon: "local_shipping", permission: "canAccessDistributorQuotes" },
      { name: "Cotizador Emprendedor", path: "cotizador", icon: "star", permission: "canAccessQuotes" },
    ],
  },
  {
    type: "group",
    name: "Finanzas",
    icon: "account_balance_wallet",
    children: [
      { name: "Ingresos", path: "ingresos", icon: "payments", permission: "canAccessFinances" },
      { name: "Gastos", path: "gastos", icon: "receipt_long", permission: "canAccessFinances" },
    ],
  },
  {
    type: "group",
    name: "Administración",
    icon: "settings_suggest",
    children: [
      { name: "Usuarios", path: "usuarios", icon: "group", permission: "canAccessRH" },
      { name: "Recursos Humanos", path: "recursos-humanos", icon: "folder_managed", permission: "canAccessRH" },
      { name: "Roles y Permisos", path: "roles", icon: "security", permission: "canAccessRH" },
      { name: "Configuración", path: "configuracion", icon: "tune", permission: "canAccessConfig" },
    ],
  },
];

const SidebarItem = ({ item, isCollapsed, user, onClose, isMobile, isOpen, onToggle }) => {
  const { hasPermission } = useAuth();
  const [isFlyoutOpen, setIsFlyoutOpen] = useState(false);
  const location = useLocation();
  const itemRef = useRef(null);

  const effectiveCollapsed = isMobile ? false : isCollapsed;

  // Flyout logic for collapsed desktop sidebar
  useEffect(() => {
    if (isMobile || !effectiveCollapsed) return;

    const handleClickOutside = (event) => {
      if (itemRef.current && !itemRef.current.contains(event.target)) {
        setIsFlyoutOpen(false);
      }
    };

    if (isFlyoutOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isFlyoutOpen, effectiveCollapsed, isMobile]);
  
  // 1. Verificación de Permisos Dinámicos para el ítem raíz
  if (item.permission && !hasPermission(item.permission)) return null;
  if (item.adminOnly && user?.role !== 'ADMIN') return null;

  // 2. Filtrar hijos basados en permisos
  const visibleChildren = item.children?.filter(child => {
    if (child.permission && !hasPermission(child.permission)) return false;
    if (child.adminOnly && user?.role !== 'ADMIN') return false;
    return true;
  });

  if (item.type === 'group' && (!visibleChildren || visibleChildren.length === 0)) return null;

  const isActive = item.type === 'link'
    ? location.pathname === item.path || (item.path !== '/gestion' && location.pathname.includes(item.path))
    : visibleChildren.some(child => location.pathname.split('/').includes(child.path));

  const baseClasses = `flex items-center w-full rounded-lg px-3 py-2 transition-all duration-200 cursor-pointer ${effectiveCollapsed ? 'justify-center relative' : ''}`;
  const activeClasses = "bg-primary/10 text-primary font-medium";
  const inactiveClasses = "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-primary dark:hover:text-white";

  if (item.type === 'link') {
    return (
      <NavLink
        to={item.path}
        end={item.path === "/gestion"}
        className={({ isActive }) => `${baseClasses} ${isActive ? "bg-primary text-white shadow-md" : inactiveClasses} ${effectiveCollapsed ? '' : 'gap-3'}`}
        onClick={onClose}
        title={effectiveCollapsed ? item.name : ''}
      >
        <span className="material-symbols-outlined text-xl">{item.icon}</span>
        {!effectiveCollapsed && <span>{item.name}</span>}
      </NavLink>
    );
  }

  const handleGroupClick = () => {
      if (effectiveCollapsed) {
          setIsFlyoutOpen(!isFlyoutOpen);
      } else {
          onToggle();
      }
  }

  // Renderizado de Grupo
  return (
    <div
      ref={itemRef}
      className={`mb-1 ${effectiveCollapsed ? 'relative' : ''}`}
    >
      <div
        className={`${baseClasses} ${isActive && !isOpen ? activeClasses : inactiveClasses} ${effectiveCollapsed ? '' : 'justify-between'}`}
        onClick={handleGroupClick}
        title={effectiveCollapsed ? item.name : ''}
      >
        <div className={`flex items-center ${effectiveCollapsed ? 'justify-center' : 'gap-3'}`}>
          <span className="material-symbols-outlined text-xl">{item.icon}</span>
          {!effectiveCollapsed && <span>{item.name}</span>}
        </div>
        {!effectiveCollapsed && (
          <span className={`material-symbols-outlined text-sm transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
            expand_more
          </span>
        )}
      </div>

      {/* Submenú Normal (Acordeón) - Móvil o Escritorio Expandido */}
      {!effectiveCollapsed && (
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-48 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
          <div className="ml-4 pl-3 border-l-2 border-gray-200 dark:border-gray-700 space-y-1">
            {visibleChildren.map((child) => (
              <NavLink
                key={child.name}
                to={child.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${isActive
                    ? "text-primary font-semibold bg-blue-50 dark:bg-blue-900/20"
                    : "text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-white"
                  }`
                }
                onClick={onClose}
              >
                <span className="material-symbols-outlined text-lg">{child.icon}</span>
                <span>{child.name}</span>
              </NavLink>
            ))}
          </div>
        </div>
      )}

      {/* Submenú Flotante (Flyout) - Solo Escritorio Colapsado */}
      {effectiveCollapsed && isFlyoutOpen && (
        <div className="absolute left-full top-0 ml-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 py-2 animate-fade-in">
          <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 mb-1">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{item.name}</span>
          </div>
          {visibleChildren.map((child) => (
            <NavLink
              key={child.name}
              to={child.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2 text-sm transition-colors ${isActive
                  ? "text-primary font-semibold bg-blue-50 dark:bg-blue-900/20"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`
              }
              onClick={() => {
                setIsFlyoutOpen(false);
                onClose();
              }}
            >
              <span className="material-symbols-outlined text-lg">{child.icon}</span>
              <span>{child.name}</span>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
};

const GestionSidebar = ({ isOpen, onClose, isCollapsed, toggleCollapsed }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  // Find the active group based on the current URL to open it on load
  const getActiveGroup = () => {
    const activeGroup = menuStructure.find(item => 
        item.type === 'group' && 
        item.children.some(child => location.pathname.includes(child.path))
    );
    return activeGroup ? activeGroup.name : null;
  };
  
  const [openGroup, setOpenGroup] = useState(getActiveGroup());
  
  // Update open group when route changes
  useEffect(() => {
    if (!isCollapsed) { // Only auto-open groups when sidebar is expanded
      setOpenGroup(getActiveGroup());
    }
  }, [location.pathname, isCollapsed]);


  const handleToggleGroup = (groupName) => {
    setOpenGroup(prevOpenGroup => (prevOpenGroup === groupName ? null : groupName));
  };
  
  const handleLogout = () => {
    const name = user?.name || 'Usuario';
    navigate('/logout-success', { state: { name } });
    setTimeout(logout, 50);
  };

  const footerLinkClasses = `flex items-center rounded-lg px-3 py-2 transition-all text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-primary dark:hover:text-white w-full gap-3 ${isCollapsed ? 'md:justify-center' : ''}`;

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col justify-between 
        transform transition-all duration-300 ease-in-out flex-shrink-0 overflow-hidden
        ${isOpen ? 'translate-x-0 w-64 p-4 shadow-xl' : '-translate-x-full w-0 p-0'} 
        md:relative md:translate-x-0 md:shadow-none md:p-0
        ${isCollapsed ? 'md:w-20' : 'md:w-64'}
        ${isCollapsed ? 'md:px-2 md:overflow-visible' : 'md:p-4 md:overflow-hidden'}
      `}
    >
      <div className={`flex flex-col h-full ${isCollapsed ? 'md:overflow-visible' : 'overflow-hidden'}`}>
        <div className="flex justify-end md:hidden mb-4">
          <button onClick={onClose} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className={`flex items-center p-2 mt-2 mb-8 ${isCollapsed ? 'md:justify-center' : 'gap-3'}`}>
          <img 
            src={theme === 'dark' ? '/img/logos/LogoTO.png' : '/img/logos/darmax-logo.png'} 
            alt="Darmax Logo" 
            className="h-10 w-10 object-contain" 
          />
          {(!isCollapsed || isOpen) && (
            <div className={`flex flex-col leading-none overflow-hidden ${isCollapsed ? 'md:hidden' : ''}`}>
              <span className="text-sm font-bold tracking-tight text-dark dark:text-white truncate">
                Darmax Gestión
              </span>
              <div className="flex items-center mt-1.5">
                <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase truncate border ${
                    user?.store 
                    ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800' 
                    : 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800'
                }`}>
                    {user?.store?.name || 'Acceso Global'}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className={`flex-1 pr-1 custom-scrollbar space-y-1 ${isCollapsed ? 'md:overflow-visible' : 'overflow-y-auto'}`}>
          {menuStructure.map((item, index) => (
            <SidebarItem 
                key={index} 
                item={item} 
                isCollapsed={isCollapsed} 
                isMobile={isOpen}
                user={user} 
                onClose={onClose}
                isOpen={openGroup === item.name}
                onToggle={() => handleToggleGroup(item.name)}
            />
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 space-y-1">
            <button onClick={toggleTheme} className={footerLinkClasses} title="Cambiar Tema">
                <span className="material-symbols-outlined text-xl">
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                </span>
                {(!isCollapsed || isOpen) && <span className={`text-sm font-medium ${isCollapsed ? 'md:hidden' : ''}`}>{theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}</span>}
            </button>

            <NavLink to="/" className={footerLinkClasses} onClick={onClose} title="Ir a Inicio">
                <span className="material-symbols-outlined text-xl">home</span>
                {(!isCollapsed || isOpen) && <span className={`text-sm font-medium ${isCollapsed ? 'md:hidden' : ''}`}>Volver a Inicio</span>}
            </NavLink>
            
            <button onClick={() => { handleLogout(); onClose(); }} className={footerLinkClasses} title="Cerrar Sesión">
                <span className="material-symbols-outlined text-xl">logout</span>
                {(!isCollapsed || isOpen) && <span className={`text-sm font-medium ${isCollapsed ? 'md:hidden' : ''}`}>Cerrar Sesión</span>}
            </button>
        </div>
      </div>
    </aside>
  );
};

export default GestionSidebar;
