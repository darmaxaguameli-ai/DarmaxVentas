import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext"; // Import useTheme

const links = [
  { name: "Resumen", path: "/gestion", icon: "dashboard" },
  { name: "Inventario", path: "inventario", icon: "inventory_2" },
  { name: "Ingresos", path: "ingresos", icon: "payments" },
  { name: "Gastos", path: "gastos", icon: "receipt_long" },
  { name: "Usuarios", path: "usuarios", icon: "group" },
  { name: "Configuración", path: "configuracion", icon: "tune" },
  { name: "Control Diario de Ventas", path: "control-ventas-diarias", icon: "history" },
];

const GestionSidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme(); // Use theme context
  const baseLinkClasses = "flex items-center gap-3 rounded-lg px-3 py-2 transition-all";
  const activeLinkClasses = "bg-primary text-white shadow-md";
  const inactiveLinkClasses = "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-primary dark:hover:text-white";

  const handleLogout = () => {
    const name = user?.name || 'Usuario';
    navigate('/logout-success', { state: { name } });
    setTimeout(logout, 50);
  };

  return (
    <aside
      className={`inset-y-0 left-0 z-40 w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 flex flex-col justify-between
        transform transition-transform duration-300 ease-in-out flex-shrink-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 md:shadow-none`}
    >
      <div className="flex flex-col">
        {/* Close button for mobile */}
        <div className="flex justify-end md:hidden mb-4">
          <button onClick={onClose} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex items-center gap-2 p-2 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-2xl font-bold text-white shadow-sm">
            D
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-base font-semibold tracking-wide text-dark dark:text-white">
              Darmax Gestión
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Panel Administrativo
            </span>
          </div>
        </div>
        <nav className="flex flex-col gap-2">
          {links.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              end={link.path === "/gestion"}
              className={({ isActive }) =>
                `${baseLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`
              }
              onClick={onClose} // Close sidebar on navigation for mobile
            >
              <span className="material-symbols-outlined text-lg">{link.icon}</span>
              <span className="text-sm font-medium">{link.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="mt-8 space-y-2">
        {/* Theme Toggle Button */}
        <button
            onClick={toggleTheme}
            className={`${baseLinkClasses} ${inactiveLinkClasses} w-full`}
          >
            <span className="material-symbols-outlined text-lg">
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
            <span className="text-sm font-medium">
              {theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
            </span>
        </button>

        <NavLink
            to="/"
            className={`${baseLinkClasses} ${inactiveLinkClasses}`}
            onClick={onClose} // Close sidebar on navigation for mobile
          >
            <span className="material-symbols-outlined text-lg">home</span>
            <span className="text-sm font-medium">Volver a Inicio</span>
        </NavLink>
        {/* Botón de Cerrar Sesión */}
        <button
            onClick={() => { handleLogout(); onClose(); }} // Close sidebar on logout
            className={`${baseLinkClasses} ${inactiveLinkClasses} w-full`}
          >
            <span className="material-symbols-outlined text-lg">logout</span>
            <span className="text-sm font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};

export default GestionSidebar;
