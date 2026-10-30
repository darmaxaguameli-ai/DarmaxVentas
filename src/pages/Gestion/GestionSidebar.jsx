import React, { useState, useEffect, useRef, useContext, useMemo } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { GestionContext } from "./context/GestionContext";

// Definición de la estructura del menú
const menuStructure = [
  {
    type: "link",
    name: "Resumen Operativo",
    path: "/gestion",
    icon: "dashboard",
    permission: "canViewSummary",
  },
  {
    type: "group",
    name: "Cotizadores",
    icon: "request_quote",
    children: [
      { name: "Cotizador Dist.", path: "cotizador-distribuidores", icon: "local_shipping", permission: "canAccessDistributorQuotes" },
      { name: "Cotizador Darmax", path: "cotizador", icon: "request_quote", permission: "canAccessQuotes" },
    ],
  },
  {
    type: "group",
    name: "Operaciones",
    icon: "storefront",
    children: [
      { name: "Inventario Global", path: "inventario", icon: "inventory_2", permission: "canAccessInventory" },
      { name: "Cortes Vending", path: "vending", icon: "smart_toy", permission: "canAccessVending" },
    ],
  },
  {
    type: "group",
    name: "Ingeniería y Proyectos",
    icon: "engineering",
    children: [
      { name: "Control de Instalación", path: "instalacion", icon: "construction", permission: "canAccessInstallation" },
      { name: "Mapa de Instalaciones", path: "mapa-instalaciones", icon: "map", permission: "canAccessShowcase" },
    ],
  },
  {
    type: "group",
    name: "Sistemas",
    icon: "terminal",
    permission: ["canAccessSistemas", "canManageSistemas"],
    children: [
      { name: "Proyectos y Actividades", path: "sistemas", icon: "terminal", permission: ["canAccessSistemas", "canManageSistemas"] },
    ],
  },
  {
    type: "group",
    name: "Marketing y Estrategia",
    icon: "campaign",
    children: [
      { name: "Planner Digital", path: "marketing", icon: "ads_click", permission: "canAccessMarketing" },
      { name: "Promociones", path: "promociones", icon: "loyalty", permission: "canAccessMarketing" },
    ],
  },
  {
    type: "group",
    name: "Contenido y Recursos",
    icon: "auto_stories",
    children: [
      { name: "Editor de Blog", path: "blog", icon: "newspaper", permission: "canAccessMarketing" },
      { name: "Centro de Guías", path: "guias", icon: "menu_book", permission: "canViewSummary" },
    ],
  },
  {
    type: "group",
    name: "Finanzas y Contabilidad",
    icon: "account_balance_wallet",
    children: [
      { name: "Tesorería (Ingresos)", path: "ingresos", icon: "account_balance_wallet", permission: "canAccessFinances" },
      { name: "Compras y CxP", path: "compras", icon: "shopping_cart", permission: "canAccessFinances" },
      { name: "Contabilidad ERP", path: "contabilidad", icon: "account_balance", permission: "canAccessAccounting" },
      { name: "Facturación (CFDI 4.0)", path: "fiscal", icon: "receipt_long", permission: "canAccessAccounting" },
      { name: "Prospección / Leads", path: "prospeccion", icon: "trending_up", permission: "canAccessLeads" },
      { name: "CRM y Cobranza", path: "crm", icon: "people", permission: "canAccessLeads" },
    ],
  },
  {
    type: "group",
    name: "Legal",
    icon: "gavel",
    children: [
      { name: "Gestión Documental", path: "documentos", icon: "folder_open", permission: "canAccessLegal" },
      { name: "Área Legal", path: "legal", icon: "balance", permission: "canAccessLegal" },
    ],
  },
  {
    type: "group",
    name: "Administración",
    icon: "settings_suggest",
    children: [
      { name: "Directorio", path: "usuarios", icon: "group", permission: "canAccessRH" },
      { name: "RRHH y Nóminas", path: "recursos-humanos", icon: "folder_managed", permission: "canAccessRH" },
      { name: "Roles y Permisos", path: "roles", icon: "security", permission: "canAccessRH" },
      { name: "Configuración Base", path: "configuracion", icon: "tune", permission: "canAccessConfig" },
    ],
  },
];

// Tooltip flotante que emerge directamente desde la barra lateral manteniendo su mismo color y material
const DropletTooltip = ({ text, subtext }) => (
  <div className="hidden md:flex pointer-events-none absolute left-full ml-1 top-1/2 -translate-y-1/2 z-[150] items-center opacity-0 -translate-x-3 scale-95 group-hover:opacity-100 group-hover:translate-x-0 group-hover:scale-100 transition-all duration-200 ease-out origin-left">
    {/* Pico / Apéndice conector del mismo color y borde de la barra */}
    <div className="w-2.5 h-2.5 bg-white/95 dark:bg-gray-900/95 border-l border-b border-gray-200/80 dark:border-gray-700/80 rotate-45 -mr-1.5 z-10 rounded-[1px] shadow-xs" />
    
    {/* Cuerpo de la pestaña del mismo color glassmorphic de la barra lateral */}
    <div className="relative flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white/95 dark:bg-gray-900/95 text-gray-900 dark:text-white shadow-xl shadow-gray-900/10 dark:shadow-black/40 border border-gray-200/80 dark:border-gray-700/80 backdrop-blur-2xl whitespace-nowrap">
      <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
      <span className="text-xs font-bold tracking-tight text-gray-900 dark:text-white">
        {text}
      </span>
      {subtext && (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
          {subtext}
        </span>
      )}
    </div>
  </div>
);

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

  // Auto-scroll suave para asegurar que el submenú desplegado sea completamente visible en móvil y escritorio
  useEffect(() => {
    if (isOpen && !effectiveCollapsed && itemRef.current) {
      const timer = setTimeout(() => {
        itemRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen, effectiveCollapsed]);
  
  const checkPerm = (perm) => {
    if (!perm) return true;
    if (Array.isArray(perm)) return perm.some(p => hasPermission(p));
    return hasPermission(perm);
  };

  // 1. Verificación de Permisos Dinámicos para el ítem raíz
  if (item.permission && !checkPerm(item.permission)) return null;
  if (item.adminOnly && user?.role !== 'ADMIN') return null;

  // 2. Filtrar hijos basados en permisos
  const visibleChildren = item.children?.filter(child => {
    if (child.permission && !checkPerm(child.permission)) return false;
    if (child.adminOnly && user?.role !== 'ADMIN') return false;
    return true;
  });

  if (item.type === 'group' && (!visibleChildren || visibleChildren.length === 0)) return null;

  const isActive = item.type === 'link'
    ? location.pathname === item.path || (item.path !== '/gestion' && location.pathname.includes(item.path))
    : visibleChildren.some(child => location.pathname.split('/').includes(child.path));

  const baseClasses = `flex items-center w-full rounded-xl px-3 py-2 transition-all duration-150 cursor-pointer select-none active:scale-[0.98] ${effectiveCollapsed ? 'justify-center relative' : ''}`;
  const activeClasses = "bg-primary/10 text-primary dark:text-blue-400 font-bold border-l-2 border-primary shadow-xs";
  const inactiveClasses = "text-gray-600 dark:text-gray-400 hover:bg-gray-100/70 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-white font-medium";

  if (item.type === 'link') {
    return (
      <NavLink
        to={item.path}
        end={item.path === "/gestion"}
        className={({ isActive }) => `${baseClasses} ${isActive ? "bg-gradient-to-r from-primary to-blue-600 text-white shadow-md shadow-blue-500/20 font-bold" : inactiveClasses} ${effectiveCollapsed ? 'group' : 'gap-3'}`}
        onClick={onClose}
      >
        <span className="material-symbols-outlined text-xl">{item.icon}</span>
        {!effectiveCollapsed && <span className="text-xs font-bold">{item.name}</span>}

        {/* Efecto Gota al posarse sobre el icono */}
        {effectiveCollapsed && (
          <DropletTooltip text={item.name} />
        )}
      </NavLink>
    );
  }

  const handleGroupClick = () => {
      if (effectiveCollapsed) {
          setIsFlyoutOpen(!isFlyoutOpen);
      } else {
          onToggle();
      }
  };

  // Renderizado de Grupo
  return (
    <div
      ref={itemRef}
      className={`mb-0.5 ${effectiveCollapsed ? 'relative group' : ''}`}
    >
      <div
        className={`${baseClasses} ${isActive && !isOpen ? activeClasses : inactiveClasses} ${effectiveCollapsed ? '' : 'justify-between'}`}
        onClick={handleGroupClick}
      >
        <div className={`flex items-center ${effectiveCollapsed ? 'justify-center' : 'gap-3'}`}>
          <span className="material-symbols-outlined text-xl">{item.icon}</span>
          {!effectiveCollapsed && <span className="text-xs font-bold tracking-tight">{item.name}</span>}
        </div>
        {!effectiveCollapsed && (
          <span className={`material-symbols-outlined text-sm transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : 'text-gray-400'}`}>
            expand_more
          </span>
        )}
      </div>

      {/* Efecto Gota al posarse sobre el icono del grupo */}
      {effectiveCollapsed && !isFlyoutOpen && (
        <DropletTooltip 
          text={item.name} 
          subtext={`${visibleChildren?.length || 0} opciones`} 
        />
      )}

      {/* Submenú Normal (Acordeón) - Móvil o Escritorio Expandido */}
      {!effectiveCollapsed && (
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[500px] opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
          <div className="ml-4 pl-3 border-l-2 border-gray-200/80 dark:border-gray-700/80 space-y-0.5 my-1">
            {visibleChildren.map((child) => (
              <NavLink
                key={child.name}
                to={child.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-1.5 rounded-xl text-xs transition-all active:scale-[0.98] ${isActive
                    ? "text-primary dark:text-blue-400 font-bold bg-blue-50/90 dark:bg-blue-950/40 border-l-2 border-primary shadow-xs"
                    : "text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-white hover:bg-gray-100/60 dark:hover:bg-gray-800/40 font-medium"
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

      {/* Submenú Flotante (Flyout Glassmorphic) - Solo Escritorio Colapsado */}
      {effectiveCollapsed && isFlyoutOpen && (
        <div className="absolute left-full top-0 ml-2.5 w-56 bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700/80 z-[100] py-2 animate-fade-in ring-1 ring-black/5 dark:ring-white/10">
          <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800 mb-1">
            <span className="text-[10px] font-black text-gray-400 dark:text-gray-400 uppercase tracking-wider">{item.name}</span>
          </div>
          {visibleChildren.map((child) => (
            <NavLink
              key={child.name}
              to={child.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2 text-xs transition-colors rounded-xl mx-1.5 ${isActive
                  ? "text-primary dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/30"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-gray-800/60 font-medium"
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
  const gestionContext = useContext(GestionContext);
  const empleados = gestionContext?.state?.empleados || [];

  // Puesto de trabajo real vinculado desde Empleados
  const userPuesto = useMemo(() => {
    if (!user) return 'Colaborador';
    if (Array.isArray(empleados) && empleados.length > 0) {
      // 1. Coincidencia directa por userId
      const byUserId = empleados.find(e => e.userId && e.userId === user.id);
      if (byUserId?.puesto) return byUserId.puesto;

      // 2. Coincidencia por correo
      const byEmail = empleados.find(e => 
        (e.emailPersonal && user.email && e.emailPersonal.toLowerCase() === user.email.toLowerCase()) ||
        (e.user?.email && user.email && e.user.email.toLowerCase() === user.email.toLowerCase())
      );
      if (byEmail?.puesto) return byEmail.puesto;

      // 3. Coincidencia por nombre completo
      const byName = empleados.find(e => 
        e.nombreCompleto && user.name && e.nombreCompleto.trim().toLowerCase() === user.name.trim().toLowerCase()
      );
      if (byName?.puesto) return byName.puesto;
    }

    // 4. Si el usuario de sesión ya tiene el empleado embebido
    if (user.empleado?.puesto) return user.empleado.puesto;
    if (user.puesto) return user.puesto;

    // 5. Fallback por rol si es Administrador o rol específico
    if (user.role === 'ADMIN' || user.roles?.some(r => r.name?.toUpperCase() === 'ADMIN')) {
      return 'Dirección General';
    }
    return user.roleRef?.name || user.roles?.[0]?.name || user.role || 'Colaborador';
  }, [user, empleados]);

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

  return (
    <aside
      className={`fixed top-0 bottom-0 left-0 z-40 
        h-screen h-[100dvh] max-h-[100dvh]
        bg-white/85 dark:bg-gray-900/90 backdrop-blur-2xl backdrop-saturate-150
        flex flex-col
        transform transition-all duration-300 ease-in-out flex-shrink-0
        ${isOpen 
          ? 'translate-x-0 w-72 max-w-[85vw] p-3.5 pb-[calc(0.875rem+env(safe-area-inset-bottom,0px))] shadow-2xl border-r border-gray-200/80 dark:border-gray-800/80 visible pointer-events-auto' 
          : '-translate-x-full w-72 max-w-[85vw] p-0 shadow-none border-r border-transparent invisible pointer-events-none'
        } 
        md:relative md:h-full md:max-h-full md:translate-x-0 md:shadow-none md:visible md:pointer-events-auto md:border-r md:border-gray-200/80 dark:md:border-gray-800/80
        overflow-hidden ${isCollapsed ? 'md:w-20 md:px-2 md:py-4 md:overflow-visible' : 'md:w-64 md:p-4 md:overflow-hidden'}
      `}
    >
      <div className={`flex flex-col h-full min-h-0 overflow-hidden ${isCollapsed ? 'md:overflow-visible' : 'md:overflow-hidden'}`}>
        {/* Encabezado con Logo, Empresa y Botón cerrar en móvil */}
        <div className={`flex items-center justify-between p-2 mt-0.5 mb-3 select-none flex-shrink-0 ${isCollapsed ? 'md:justify-center' : ''}`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex-shrink-0">
              <img 
                src={theme === 'dark' ? '/img/logos/LogoTO.png' : '/img/logos/darmax-logo.png'} 
                alt="Darmax Logo" 
                className="h-9 w-9 object-contain" 
              />
            </div>
            {(!isCollapsed || isOpen) && (
              <div className={`flex flex-col leading-tight overflow-hidden ${isCollapsed ? 'md:hidden' : ''}`}>
                <span className="text-sm font-black tracking-tight text-gray-900 dark:text-white truncate">
                  Darmax Gestión
                </span>
                <div className="flex items-center mt-1">
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider truncate border ${
                      user?.store 
                      ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' 
                      : 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800'
                  }`}>
                      {user?.store?.name || 'Acceso Global'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Botón cerrar en móvil integrado en el header */}
          <button 
            type="button"
            onClick={onClose} 
            aria-label="Cerrar barra lateral"
            className="md:hidden p-1.5 rounded-xl text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95 transition-all flex-shrink-0"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Contenedor de Apartados con Scroll Suave sin Barra Visible */}
        <div className={`flex-1 min-h-0 pr-1 pb-2 space-y-1 overscroll-contain select-none overflow-y-auto overflow-x-hidden touch-pan-y [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${
          isCollapsed 
            ? 'md:overflow-visible md:overflow-x-visible md:overflow-y-visible' 
            : 'md:overflow-y-auto md:overflow-x-hidden'
        }`}>
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

        {/* Perfil del Usuario y Botones de Acción (Debajo del nombre, uno al lado del otro) */}
        <div className={`flex-shrink-0 mt-auto pt-2.5 border-t border-gray-200/60 dark:border-gray-800/60 ${isCollapsed ? 'md:flex md:flex-col md:items-center' : ''}`}>
          {(!isCollapsed || isOpen) ? (
            <div className="p-2 sm:p-2.5 rounded-2xl bg-white/60 dark:bg-gray-800/50 backdrop-blur-md border border-gray-200/60 dark:border-gray-700/50 shadow-xs space-y-2">
              {/* Información de Usuario */}
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-blue-500 text-white flex items-center justify-center font-black text-xs shadow-xs flex-shrink-0">
                  {(user?.name || 'U')[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-gray-800 dark:text-white truncate leading-tight">
                    {user?.name || 'Usuario'}
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium truncate capitalize">
                    {userPuesto}
                  </p>
                </div>
              </div>

              {/* Botones de Modo Claro/Oscuro y Salir: Uno al lado del otro debajo del nombre */}
              <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-gray-100 dark:border-gray-700/60">
                {/* Botón Tema */}
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-[11px] font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-700/60 transition-all active:scale-95 border border-gray-200/60 dark:border-gray-700/50 shadow-2xs"
                  title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
                >
                  <span className="material-symbols-outlined text-sm">
                    {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                  </span>
                  <span>{theme === 'dark' ? 'Claro' : 'Oscuro'}</span>
                </button>

                {/* Botón Cerrar Sesión */}
                <button
                  type="button"
                  onClick={() => { handleLogout(); onClose(); }}
                  className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50/80 dark:hover:bg-rose-950/30 transition-all active:scale-95 border border-rose-200/60 dark:border-rose-900/40 shadow-2xs"
                  title="Cerrar Sesión"
                >
                  <span className="material-symbols-outlined text-sm">logout</span>
                  <span>Salir</span>
                </button>
              </div>
            </div>
          ) : (
            /* Modo Colapsado en Escritorio con Tooltip Gota */
            <div className="flex flex-col items-center gap-2 py-1">
              <div 
                className="relative group w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-blue-500 text-white flex items-center justify-center font-black text-xs shadow-xs cursor-pointer hover:opacity-90 transition-opacity"
              >
                {(user?.name || 'U')[0]}
                <DropletTooltip 
                  text={user?.name || 'Usuario'} 
                  subtext={userPuesto} 
                />
              </div>
              <div className="relative group">
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <span className="material-symbols-outlined text-base">
                    {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                  </span>
                </button>
                <DropletTooltip text={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'} />
              </div>
              <div className="relative group">
                <button
                  type="button"
                  onClick={() => { handleLogout(); onClose(); }}
                  className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                >
                  <span className="material-symbols-outlined text-base">logout</span>
                </button>
                <DropletTooltip text="Cerrar Sesión" />
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default GestionSidebar;
