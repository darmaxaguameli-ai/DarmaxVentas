import { NavLink } from "react-router-dom";

const links = [
  { name: "Resumen", path: "/gestion", icon: "dashboard" },
  { name: "Inventario", path: "inventario", icon: "inventory_2" },
  { name: "Ingresos", path: "ingresos", icon: "payments" },
  { name: "Gastos", path: "gastos", icon: "receipt_long" },
  { name: "Usuarios", path: "usuarios", icon: "group" },
  { name: "Configuración", path: "configuracion", icon: "tune" },
  { name: "Control Diario de Ventas", path: "control-ventas-diarias", icon: "history" },
];

const GestionSidebar = () => {
  const baseLinkClasses = "flex items-center gap-3 rounded-lg px-3 py-2 transition-all";
  const activeLinkClasses = "bg-primary text-white shadow-md";
  const inactiveLinkClasses = "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-primary dark:hover:text-white";

  return (
    <aside className="w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 flex flex-col justify-between">
      <div className="flex flex-col">
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
            >
              <span className="material-symbols-outlined text-lg">{link.icon}</span>
              <span className="text-sm font-medium">{link.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="mt-8">
        <NavLink
            to="/"
            className={`${baseLinkClasses} ${inactiveLinkClasses}`}
          >
            <span className="material-symbols-outlined text-lg">home</span>
            <span className="text-sm font-medium">Volver a Inicio</span>
        </NavLink>
      </div>
    </aside>
  );
};

export default GestionSidebar;
