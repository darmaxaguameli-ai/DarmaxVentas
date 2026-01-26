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
  },
  {
    type: "group",
    name: "Operaciones",
    icon: "storefront",
    children: [
      { name: "Inventario", path: "inventario", icon: "inventory_2" },
      { name: "Cotizador Dist.", path: "cotizador-distribuidores", icon: "local_shipping" },
    ],
  },
  {
    type: "group",
    name: "Finanzas",
    icon: "account_balance_wallet",
    children: [
      { name: "Ingresos", path: "ingresos", icon: "payments" },
      { name: "Gastos", path: "gastos", icon: "receipt_long" },
    ],
  },
  {
    type: "group",
    name: "Administración",
    icon: "settings_suggest",
    children: [
      { name: "Usuarios", path: "usuarios", icon: "group" },
      { name: "Recursos Humanos", path: "recursos-humanos", icon: "folder_managed", adminOnly: true },
      { name: "Cotizador Darmax", path: "cotizador", icon: "request_quote" },
      { name: "Configuración", path: "configuracion", icon: "tune" },
    ],
  },
];

const SidebarItem = ({ item, isCollapsed, user, onClose, isMobile }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const itemRef = useRef(null); 

  // Force expanded behavior on mobile
  const effectiveCollapsed = isMobile ? false : isCollapsed;

  // Close menu when clicking outside (only relevant for desktop collapsed mode)
  useEffect(() => {
    if (isMobile || !effectiveCollapsed) return; // Disable click outside logic on mobile/expanded

    const handleClickOutside = (event) => {
        if (itemRef.current && !itemRef.current.contains(event.target)) {
            setIsOpen(false);
        }
    };
    
    if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
    }
    
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, effectiveCollapsed, isMobile]);

  // ... (rest of permissions logic same as before)
  if (item.adminOnly && user?.role !== 'ADMIN') return null;
  const visibleChildren = item.children?.filter(child => !child.adminOnly || user?.role === 'ADMIN');
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

  // Renderizado de Grupo
  return (
    <div 
        ref={itemRef}
        className={`mb-1 ${effectiveCollapsed ? 'relative' : ''}`}
    >
      <div 
        className={`${baseClasses} ${isActive && !isOpen ? activeClasses : inactiveClasses} ${effectiveCollapsed ? '' : 'justify-between'}`}
        onClick={() => setIsOpen(!isOpen)}
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
                    `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                    isActive 
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
      {effectiveCollapsed && isOpen && (
          <div className="absolute left-full top-0 ml-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 py-2 animate-fade-in">
              <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 mb-1">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{item.name}</span>
              </div>
              {visibleChildren.map((child) => (
                <NavLink
                key={child.name}
                to={child.path}
                className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                    isActive 
                        ? "text-primary font-semibold bg-blue-50 dark:bg-blue-900/20" 
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`
                }
                onClick={() => {
                    setIsOpen(false);
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

  // Helper para detectar si estamos en móvil visualmente (usando la prop isOpen que viene del layout padre)
  // Nota: isOpen controla la visibilidad en móvil. isCollapsed controla el ancho en desktop.
  // Si isOpen es true, significa que el sidebar está visible en móvil (overlay).
  
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
        ${isCollapsed ? 'md:w-20' : 'md:w-64'} /* Desktop Widths override mobile w-0 */
        ${isCollapsed ? 'md:px-2 md:overflow-visible' : 'md:p-4 md:overflow-hidden'} /* Desktop Paddings and Overflow */
      `}
    >
      <div className={`flex flex-col h-full ${isCollapsed ? 'md:overflow-visible' : 'overflow-hidden'}`}>
        {/* Header */}
        <div className="flex justify-end md:hidden mb-4">
          <button onClick={onClose} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className={`flex items-center p-2 mt-2 mb-8 ${isCollapsed ? 'md:justify-center' : 'gap-3'}`}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-2xl font-bold text-white shadow-sm flex-shrink-0">
            D
          </div>
          {/* Mostrar texto si NO está colapsado (Desktop) O si estamos en móvil (siempre expandido visualmente) */}
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

        {/* Navigation - Scrollable Area */}
        <div className={`flex-1 pr-1 custom-scrollbar space-y-1 ${isCollapsed ? 'md:overflow-visible' : 'overflow-y-auto'}`}>
          {menuStructure.map((item, index) => (
            <SidebarItem 
                key={index} 
                item={item} 
                isCollapsed={isCollapsed} 
                isMobile={isOpen} // Pass mobile state
                user={user} 
                onClose={onClose} 
            />
          ))}
        </div>

        {/* Footer Actions */}
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
