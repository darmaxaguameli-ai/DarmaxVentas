import { useState } from "react";
import { Outlet } from "react-router-dom";
import GestionSidebar from "./GestionSidebar";
import { ThemeProvider } from "../../context/ThemeContext";
import { GestionProvider } from "./context/GestionContext"; // Importar

const GestionDashboard = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ThemeProvider>
      <div className="flex h-screen bg-light dark:bg-dark text-text-light dark:text-text-dark font-display">
        {/* Sidebar */}
        <GestionSidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Overlay for mobile when sidebar is open */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}

        {/* Main content area */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
          {/* Hamburger menu button for mobile */}
          <button
            className="md:hidden p-2 mb-4 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <GestionProvider> {/* Envolver el Outlet */}
            <Outlet />
          </GestionProvider>
        </main>
      </div>
    </ThemeProvider>
  );
};

export default GestionDashboard;
