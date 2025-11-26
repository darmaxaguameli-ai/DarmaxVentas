import { NavLink } from "react-router-dom";

const links = [
  { name: "Resumen", path: "/gestion" },
  { name: "Inventario", path: "inventario" },
  { name: "Ingresos", path: "ingresos" },
  { name: "Gastos", path: "gastos" },
];

const GestionSidebar = () => {
  const baseLinkClasses = "flex items-center gap-3 rounded-lg px-3 py-2 transition-all";
  const activeLinkClasses = "bg-primary text-white";
  const inactiveLinkClasses = "text-text-secondary dark:text-gray-400 hover:bg-primary/10 hover:text-primary";

  return (
    <aside className="w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-4 flex flex-col">
      <div className="flex items-center gap-2 p-2 mb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-xl font-bold text-white">
          D
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold tracking-wide text-dark dark:text-white">
            Darmax Gestión
          </span>
          <span className="text-[11px] text-text-secondary dark:text-gray-400">
            Agua Purificada
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
            <span>{link.name}</span>
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto">
        <NavLink
            to="/"
            className={`${baseLinkClasses} ${inactiveLinkClasses}`}
          >
            <span>Volver a Inicio</span>
        </NavLink>
      </div>
    </aside>
  );
};

export default GestionSidebar;
