import React, { useState, useEffect, useRef, useContext, useMemo } from "react";
import { createPortal } from "react-dom";
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
    permission: ["acceso.resumenoperativo", "canViewSummary"],
  },
  {
    type: "group",
    name: "Cotizadores",
    icon: "request_quote",
    children: [
      { name: "Cotizador Dist.", path: "cotizador-distribuidores", icon: "local_shipping", permission: ["acceso.cotizadordistribuidor", "canAccessDistributorQuotes"] },
      { name: "Cotizador Darmax", path: "cotizador", icon: "request_quote", permission: ["acceso.cotizadordarmax", "canAccessQuotes"] },
    ],
  },
  {
    type: "group",
    name: "Operaciones",
    icon: "storefront",
    children: [
      { name: "Inventario Global", path: "inventario", icon: "inventory_2", permission: ["acceso.inventarioglobal", "canAccessInventory"] },
      { name: "Cortes Vending", path: "vending", icon: "smart_toy", permission: ["acceso.cortesvending", "canAccessVending"] },
    ],
  },
  {
    type: "group",
    name: "Ingeniería y Proyectos",
    icon: "engineering",
    children: [
      { name: "Control de Instalación", path: "instalacion", icon: "construction", permission: ["acceso.controlinstalacion", "canAccessInstallation"] },
      { name: "Mapa de Instalaciones", path: "mapa-instalaciones", icon: "map", permission: ["acceso.mapainstalaciones", "canAccessShowcase"] },
    ],
  },
  {
    type: "group",
    name: "Sistemas",
    icon: "terminal",
    children: [
      { 
        name: "Proyectos y Actividades", 
        path: "sistemas", 
        icon: "terminal", 
        permission: [
          "acceso.proyectosactividades", 
          "proyectosactividades.jefe", 
          "proyectosactividades.colaborador", 
          "acceso.proyectosactividades.jefe", 
          "acceso.proyectosactividades.colaborador"
        ] 
      },
      { 
        name: "Roles y Permisos", 
        path: "roles", 
        icon: "security", 
        permission: [
          "acceso.permisosyroles", 
          "acceso.rolesypermisos", 
          "canManageSistemas"
        ] 
      },
    ],
  },
  {
    type: "group",
    name: "Marketing y Estrategia",
    icon: "campaign",
    children: [
      { 
        name: "Planner Digital", 
        path: "marketing", 
        icon: "ads_click", 
        permission: [
          "acceso.plannerdigital", 
          "plannerdigital.jefe", 
          "plannerdigital.colaborador", 
          "acceso.plannerdigital.jefe", 
          "acceso.plannerdigital.colaborador"
        ] 
      },
      { 
        name: "Promociones", 
        path: "promociones", 
        icon: "loyalty", 
        permission: ["acceso.promociones"] 
      },
    ],
  },
  {
    type: "group",
    name: "Contenido y Recursos",
    icon: "auto_stories",
    children: [
      { name: "Editor de Blog", path: "blog", icon: "newspaper", permission: ["acceso.editorblog"] },
      { name: "Centro de Guías", path: "guias", icon: "menu_book", permission: ["acceso.centrodeguias"] },
    ],
  },
  {
    type: "group",
    name: "Finanzas y Contabilidad",
    icon: "account_balance_wallet",
    children: [
      { name: "Tesorería (Ingresos)", path: "ingresos", icon: "account_balance_wallet", permission: ["acceso.tesoreriaingresos", "canAccessFinances"] },
      { name: "Compras y CxP", path: "compras", icon: "shopping_cart", permission: ["acceso.comprasxcp"] },
      { name: "Contabilidad ERP", path: "contabilidad", icon: "account_balance", permission: ["acceso.contabilidaderp", "canAccessAccounting"] },
      { name: "Facturación (CFDI 4.0)", path: "fiscal", icon: "receipt_long", permission: ["acceso.facturacioncfdi"] },
      { name: "Prospección / Leads", path: "prospeccion", icon: "trending_up", permission: ["acceso.prospeccionleads", "canAccessLeads"] },
      { name: "CRM y Cobranza", path: "crm", icon: "people", permission: ["acceso.crmycobranza"] },
    ],
  },
  {
    type: "group",
    name: "Legal",
    icon: "gavel",
    children: [
      { name: "Gestión Documental", path: "documentos", icon: "folder_open", permission: ["acceso.gestiondocumental"] },
      { name: "Área Legal", path: "legal", icon: "balance", permission: ["acceso.arealegal", "canAccessLegal"] },
    ],
  },
  {
    type: "group",
    name: "Administración",
    icon: "settings_suggest",
    children: [
      { name: "Directorio", path: "usuarios", icon: "group", permission: ["acceso.directorio"] },
      { name: "RRHH y Nóminas", path: "recursos-humanos", icon: "folder_managed", permission: ["acceso.rrhhynominas", "canAccessRH"] },
      { name: "Configuración Base", path: "configuracion", icon: "tune", permission: ["acceso.configuracionbase", "canAccessConfig"] },
    ],
  },
  {
    type: "group",
    name: "Otros Entornos",
    icon: "swap_horiz",
    children: [
      { name: "Caja y Mostrador (POS)", path: "/ventas/mostrador", icon: "point_of_sale", permission: ["canAccessPOS", "acceso.pos", "acceso.ventasmostrador"] },
      { name: "Dashboard Repartidor", path: "/repartidor/dashboard", icon: "local_shipping", permission: ["canAccessDelivery", "acceso.delivery", "acceso.repartidor"] },
      { name: "Selector de Entorno", path: "/role-selector", icon: "apps" },
    ],
  },
];

// Tooltip flotante estilizado con portal (nunca se corta con overflow ni desborda el sidebar)
const DropletTooltip = ({ text, subtext, parentRef }) => {
  const [coords, setCoords] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const parent = parentRef?.current;
    if (!parent) return;

    let timeoutId;

    const handleMouseEnter = () => {
      clearTimeout(timeoutId);
      const rect = parent.getBoundingClientRect();
      setCoords({
        top: rect.top + rect.height / 2,
        left: rect.right + 10,
      });
      setVisible(true);
    };

    const handleMouseLeave = () => {
      timeoutId = setTimeout(() => {
        setVisible(false);
      }, 50);
    };

    parent.addEventListener('mouseenter', handleMouseEnter);
    parent.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      clearTimeout(timeoutId);
      parent.removeEventListener('mouseenter', handleMouseEnter);
      parent.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [parentRef]);

  if (!visible || !coords) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        transform: 'translateY(-50%)',
        zIndex: 99999,
        pointerEvents: 'none',
      }}
      className="hidden md:flex items-center transition-all duration-150 ease-out animate-fade-in"
    >
      {/* Pico / Apéndice conector */}
      <div className="w-2.5 h-2.5 bg-white/95 dark:bg-gray-900/95 border-l border-b border-gray-200/80 dark:border-gray-700/80 rotate-45 -mr-1.5 z-10 rounded-[1px] shadow-xs" />
      
      {/* Cuerpo de la pestaña glassmorphic */}
      <div className="relative flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-white/95 dark:bg-gray-900/95 text-gray-900 dark:text-white shadow-xl shadow-gray-900/10 dark:shadow-black/40 border border-gray-200/80 dark:border-gray-700/80 backdrop-blur-2xl whitespace-nowrap">
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
    </div>,
    document.body
  );
};

const SidebarItem = ({ item, isCollapsed, user, onClose, isMobile, isOpen, onToggle }) => {
  const { hasPermission } = useAuth();
  const [isFlyoutOpen, setIsFlyoutOpen] = useState(false);
  const location = useLocation();
  const itemRef = useRef(null);
  const linkRef = useRef(null);
  const groupRef = useRef(null);
  const flyoutRef = useRef(null);

  const effectiveCollapsed = isMobile ? false : isCollapsed;

  // Flyout logic para escritorio colapsado con portal
  useEffect(() => {
    if (isMobile || !effectiveCollapsed) {
      setIsFlyoutOpen(false);
      return;
    }

    const handleClickOutside = (event) => {
      if (
        itemRef.current && !itemRef.current.contains(event.target) &&
        (!flyoutRef.current || !flyoutRef.current.contains(event.target))
      ) {
        setIsFlyoutOpen(false);
      }
    };

    const handleScroll = () => {
      setIsFlyoutOpen(false);
    };

    if (isFlyoutOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", handleScroll, true);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isFlyoutOpen, effectiveCollapsed, isMobile]);

  // Auto-scroll suave para asegurar que el submenú desplegado sea completamente visible
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
    : visibleChildren?.some(child => child.path.startsWith('/') ? location.pathname === child.path : location.pathname.split('/').includes(child.path));

  // Ítem de Enlace Directo
  if (item.type === 'link') {
    return (
      <NavLink
        ref={linkRef}
        to={item.path}
        end={item.path === "/gestion"}
        className={({ isActive }) =>
          `group relative flex items-center transition-all duration-150 cursor-pointer select-none active:scale-[0.97] ${
            effectiveCollapsed
              ? `w-10 h-10 mx-auto justify-center rounded-2xl ${
                  isActive 
                    ? "bg-gradient-to-tr from-primary to-blue-600 text-white hover:text-white shadow-md shadow-primary/25 font-bold hover:brightness-110" 
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 hover:text-gray-900 dark:hover:text-white"
                }`
              : `w-full px-3 py-2 rounded-2xl gap-3 ${
                  isActive 
                    ? "bg-primary text-white hover:text-white hover:bg-primary-dark shadow-sm shadow-primary/25 font-bold" 
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100/70 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-white font-medium"
                }`
          }`
        }
        onClick={onClose}
      >
        <span className="material-symbols-outlined text-xl flex-shrink-0">{item.icon}</span>
        {!effectiveCollapsed && <span className="text-xs font-bold truncate">{item.name}</span>}

        {/* Tooltip Gota vía Portal al posarse sobre el icono colapsado */}
        {effectiveCollapsed && (
          <DropletTooltip parentRef={linkRef} text={item.name} />
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

  // Renderizado de Grupo (Acordeón o Flyout)
  return (
    <div
      ref={itemRef}
      className={`mb-0.5 ${effectiveCollapsed ? 'relative' : ''}`}
    >
      <div
        ref={groupRef}
        className={`group relative flex items-center transition-all duration-150 cursor-pointer select-none active:scale-[0.97] ${
          effectiveCollapsed
            ? `w-10 h-10 mx-auto justify-center rounded-2xl ${
                isActive && !isOpen
                  ? "bg-blue-50 text-primary hover:text-primary dark:bg-blue-950/50 dark:text-blue-300 font-bold border border-primary/20 hover:bg-blue-100/80 dark:hover:bg-blue-900/40"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 hover:text-gray-900 dark:hover:text-white"
              }`
            : `w-full px-3 py-2 rounded-2xl justify-between ${
                isActive && !isOpen
                  ? "bg-blue-50/90 text-primary hover:text-primary dark:bg-blue-950/50 dark:text-blue-300 font-bold border-l-2 border-primary shadow-2xs hover:bg-blue-100/80 dark:hover:bg-blue-900/40"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100/70 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-white font-medium"
              }`
        }`}
        onClick={handleGroupClick}
      >
        <div className={`flex items-center ${effectiveCollapsed ? 'justify-center' : 'gap-3 min-w-0'}`}>
          <span className="material-symbols-outlined text-xl flex-shrink-0">{item.icon}</span>
          {!effectiveCollapsed && <span className="text-xs font-bold tracking-tight truncate">{item.name}</span>}
        </div>
        {!effectiveCollapsed && (
          <span className={`material-symbols-outlined text-sm transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : 'text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200'}`}>
            expand_more
          </span>
        )}
      </div>

      {/* Tooltip con contador vía Portal al posarse sobre el grupo colapsado */}
      {effectiveCollapsed && !isFlyoutOpen && (
        <DropletTooltip 
          parentRef={groupRef}
          text={item.name} 
          subtext={`${visibleChildren?.length || 0} opciones`} 
        />
      )}

      {/* Submenú Normal (Acordeón) - Móvil o Escritorio Expandido */}
      {!effectiveCollapsed && (
        <div className={`overflow-hidden transition-all duration-200 ease-out ${isOpen ? 'max-h-[500px] opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
          <div className="ml-4 pl-2.5 border-l-2 border-gray-200/80 dark:border-gray-800/80 space-y-0.5 my-1">
            {visibleChildren?.map((child) => (
              <NavLink
                key={child.name}
                to={child.path}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs transition-all active:scale-[0.98] ${isActive
                    ? "bg-primary text-white hover:text-white hover:bg-primary-dark font-bold shadow-sm shadow-primary/25"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-white font-medium"
                  }`
                }
                onClick={onClose}
              >
                <span className="material-symbols-outlined text-lg flex-shrink-0">{child.icon}</span>
                <span className="truncate">{child.name}</span>
              </NavLink>
            ))}
          </div>
        </div>
      )}

      {/* Submenú Flotante (Flyout Glassmorphic) - Solo Escritorio Colapsado vía Portal */}
      {effectiveCollapsed && isFlyoutOpen && itemRef.current && createPortal(
        <div
          ref={flyoutRef}
          style={{
            position: 'fixed',
            top: `${Math.max(12, Math.min(itemRef.current.getBoundingClientRect().top, window.innerHeight - 340))}px`,
            left: `${itemRef.current.getBoundingClientRect().right + 12}px`,
            zIndex: 99999,
          }}
          className="w-56 bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800/80 py-2 animate-fade-in ring-1 ring-black/5 dark:ring-white/10"
        >
          <div className="px-3.5 py-1.5 border-b border-gray-100 dark:border-gray-800 mb-1 flex items-center justify-between">
            <span className="text-[10px] font-black text-gray-400 dark:text-gray-400 uppercase tracking-wider">{item.name}</span>
            <span className="text-[10px] font-bold text-primary dark:text-blue-400 bg-primary/10 px-1.5 py-0.2 rounded-full">
              {visibleChildren?.length || 0}
            </span>
          </div>
          {visibleChildren?.map((child) => (
            <NavLink
              key={child.name}
              to={child.path}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 text-xs transition-all rounded-xl mx-1.5 active:scale-95 ${isActive
                  ? "bg-primary text-white hover:text-white hover:bg-primary-dark font-bold shadow-sm shadow-primary/25"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-800/70 hover:text-gray-900 dark:hover:text-white font-medium"
                }`
              }
              onClick={() => {
                setIsFlyoutOpen(false);
                onClose();
              }}
            >
              <span className="material-symbols-outlined text-lg flex-shrink-0">{child.icon}</span>
              <span className="truncate">{child.name}</span>
            </NavLink>
          ))}
        </div>,
        document.body
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
      const byUserId = empleados.find(e => e.userId && e.userId === user.id);
      if (byUserId?.puesto) return byUserId.puesto;

      const byEmail = empleados.find(e => 
        (e.emailPersonal && user.email && e.emailPersonal.toLowerCase() === user.email.toLowerCase()) ||
        (e.user?.email && user.email && e.user.email.toLowerCase() === user.email.toLowerCase())
      );
      if (byEmail?.puesto) return byEmail.puesto;

      const byName = empleados.find(e => 
        e.nombreCompleto && user.name && e.nombreCompleto.trim().toLowerCase() === user.name.trim().toLowerCase()
      );
      if (byName?.puesto) return byName.puesto;
    }

    if (user.empleado?.puesto) return user.empleado.puesto;
    if (user.puesto) return user.puesto;

    if (user.role === 'ADMIN' || user.roles?.some(r => r.name?.toUpperCase() === 'ADMIN')) {
      return 'Dirección General';
    }
    return user.roleRef?.name || user.roles?.[0]?.name || user.role || 'Colaborador';
  }, [user, empleados]);

  // Detectar grupo activo según la ruta actual
  const getActiveGroup = () => {
    const activeGroup = menuStructure.find(item => 
      item.type === 'group' && 
      item.children?.some(child => child.path.startsWith('/') ? location.pathname === child.path : location.pathname.includes(child.path))
    );
    return activeGroup ? activeGroup.name : null;
  };
  
  const [openGroup, setOpenGroup] = useState(getActiveGroup());
  
  useEffect(() => {
    if (!isCollapsed) {
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

  const avatarRef = useRef(null);
  const themeBtnRef = useRef(null);
  const logoutBtnRef = useRef(null);

  return (
    <aside
      className={`fixed z-50 flex flex-col flex-shrink-0
        bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl backdrop-saturate-150
        border border-gray-200/80 dark:border-gray-800/80
        transition-all duration-200 ease-out
        
        /* Móvil: Drawer flotante tipo Sheet con respeto de safe-area */
        top-[max(0.75rem,env(safe-area-inset-top,0px))] bottom-[max(0.75rem,env(safe-area-inset-bottom,0px))] left-3 w-72 max-w-[calc(100vw-1.5rem)] rounded-3xl shadow-2xl
        ${isOpen 
          ? 'translate-x-0 opacity-100 visible pointer-events-auto' 
          : '-translate-x-[calc(100%+1.5rem)] opacity-0 invisible pointer-events-none'
        }
        
        /* Escritorio: Isla flotante independiente */
        md:relative md:top-auto md:bottom-auto md:left-auto md:translate-x-0 md:opacity-100 md:visible md:pointer-events-auto
        md:my-3 md:ml-3 md:h-[calc(100dvh-1.5rem)] md:max-h-[calc(100dvh-1.5rem)]
        md:rounded-3xl md:shadow-xl md:shadow-gray-900/5 dark:md:shadow-black/35
        md:overflow-visible
        ${isCollapsed 
          ? 'md:w-20 md:p-2.5' 
          : 'md:w-64 md:p-3.5'
        }
      `}
    >
      {/* Botón flotante situado a un lado del logo, justo en la unión entre el sidebar y el contenido derecho */}
      <button 
        type="button"
        onClick={toggleCollapsed}
        aria-label={isCollapsed ? "Desplegar menú lateral" : "Colapsar menú lateral"}
        className="hidden md:flex absolute -right-3.5 top-[22px] z-50 w-7 h-7 items-center justify-center rounded-full bg-white dark:bg-gray-800 text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-primary border border-gray-200/90 dark:border-gray-700/80 shadow-md hover:shadow-lg hover:scale-110 active:scale-95 transition-all duration-150 cursor-pointer"
        title={isCollapsed ? "Desplegar menú lateral" : "Colapsar menú lateral"}
      >
        <span className="material-symbols-outlined text-sm font-black transition-transform duration-200">
          {isCollapsed ? 'chevron_right' : 'chevron_left'}
        </span>
      </button>

      <div className="flex flex-col h-full min-h-0 overflow-hidden md:overflow-visible">
        {/* Encabezado con Logo, Empresa y Cerrar en móvil (Sin botón debajo del logo) */}
        <div className={`flex items-center justify-between pb-3.5 pt-1.5 px-1.5 mb-3 select-none flex-shrink-0 border-b border-gray-100 dark:border-gray-800/70 ${isCollapsed ? 'md:justify-center' : ''}`}>
          <div className={`flex items-center gap-3 overflow-hidden ${isCollapsed ? 'md:justify-center' : ''}`}>
            <button
              type="button"
              onClick={isCollapsed ? toggleCollapsed : undefined}
              className={`flex-shrink-0 transition-transform active:scale-95 ${isCollapsed ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
              title={isCollapsed ? "Click para expandir barra lateral" : undefined}
            >
              <img 
                src={theme === 'dark' ? '/img/logos/LogoTO.png' : '/img/logos/darmax-logo.png'} 
                alt="Darmax Logo" 
                className="h-9 w-9 object-contain drop-shadow-xs" 
              />
            </button>

            {(!isCollapsed || isOpen) && (
              <div className={`flex flex-col overflow-hidden ${isCollapsed ? 'md:hidden' : ''}`}>
                <span className="text-sm font-black tracking-tight text-gray-900 dark:text-white truncate">
                  Darmax Gestión
                </span>
                <div className="flex items-center mt-1.5">
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider truncate border ${
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
            className="md:hidden h-9 w-9 flex items-center justify-center rounded-xl text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95 transition-all flex-shrink-0 touch-manipulation"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Contenedor de Apartados con Scroll Suave sin Barra Visible */}
        <div className="flex-1 min-h-0 pr-0.5 pb-2 space-y-1 overscroll-contain select-none overflow-y-auto overflow-x-hidden touch-pan-y [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
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

        {/* Perfil del Usuario y Acciones Rápidas */}
        <div className={`flex-shrink-0 mt-auto pt-2.5 border-t border-gray-100 dark:border-gray-800/70 ${isCollapsed ? 'md:flex md:flex-col md:items-center' : ''}`}>
          {(!isCollapsed || isOpen) ? (
            <div className="p-2 sm:p-2.5 rounded-2xl bg-gray-50/70 dark:bg-gray-800/40 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/40 shadow-xs space-y-2">
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

              {/* Botones de Modo Claro/Oscuro y Salir */}
              <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-gray-200/40 dark:border-gray-700/50">
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-[11px] font-bold text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700/60 transition-all active:scale-95 border border-gray-200/60 dark:border-gray-700/50 shadow-2xs"
                  title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
                >
                  <span className="material-symbols-outlined text-sm">
                    {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                  </span>
                  <span>{theme === 'dark' ? 'Claro' : 'Oscuro'}</span>
                </button>

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
            /* Modo Colapsado en Escritorio con Tooltips Gota */
            <div className="flex flex-col items-center gap-2 py-1">
              <div 
                ref={avatarRef}
                className="relative group w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary to-blue-500 text-white flex items-center justify-center font-black text-xs shadow-xs cursor-pointer hover:opacity-90 active:scale-95 transition-all"
              >
                {(user?.name || 'U')[0]}
                <DropletTooltip 
                  parentRef={avatarRef}
                  text={user?.name || 'Usuario'} 
                  subtext={userPuesto} 
                />
              </div>
              <div className="relative group">
                <button
                  ref={themeBtnRef}
                  type="button"
                  onClick={toggleTheme}
                  className="w-10 h-10 flex items-center justify-center rounded-2xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors active:scale-95"
                  title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
                >
                  <span className="material-symbols-outlined text-base">
                    {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                  </span>
                </button>
                <DropletTooltip parentRef={themeBtnRef} text={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'} />
              </div>
              <div className="relative group">
                <button
                  ref={logoutBtnRef}
                  type="button"
                  onClick={() => { handleLogout(); onClose(); }}
                  className="w-10 h-10 flex items-center justify-center rounded-2xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors active:scale-95"
                  title="Cerrar Sesión"
                >
                  <span className="material-symbols-outlined text-base">logout</span>
                </button>
                <DropletTooltip parentRef={logoutBtnRef} text="Cerrar Sesión" />
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default GestionSidebar;
