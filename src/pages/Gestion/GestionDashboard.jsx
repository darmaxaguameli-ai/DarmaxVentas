import { useState } from "react";
import { Outlet } from "react-router-dom";
import GestionSidebar from "./GestionSidebar";
import { ThemeProvider } from "../../context/ThemeContext";
import { GestionProvider } from "./context/GestionContext"; // Importar

const GestionDashboard = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false); // Para móvil
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false); // Para escritorio

  const toggleSidebarCollapsed = () => {
    setSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <ThemeProvider>
      <div className="flex h-screen bg-light dark:bg-dark text-text-light dark:text-text-dark font-display">
        {/* Sidebar */}
        <GestionSidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
          isCollapsed={isSidebarCollapsed} // Pasar el nuevo estado
          toggleCollapsed={toggleSidebarCollapsed} // Pasar la función de alternar
        />

        {/* Overlay for mobile when sidebar is open */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}

        {/* Main content area */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto transition-all duration-300 ease-in-out">
          <div className="flex items-center justify-between mb-4">
            {/* Hamburger menu button for mobile */}
            <button
              className="md:hidden p-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            {/* Toggle collapse button for desktop */}
            <button
              className="hidden md:block p-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
              onClick={toggleSidebarCollapsed}
            >
              <span className="material-symbols-outlined">
                {isSidebarCollapsed ? 'menu_open' : 'menu'}
              </span>
            </button>
            {/* Placeholder for any right-aligned elements in header */}
            <div></div> 
          </div>
          <GestionProvider> {/* Envolver el Outlet */}
            <Outlet />
          </GestionProvider>
        </main>
      </div>
    </ThemeProvider>
  );
};

export default GestionDashboard;
