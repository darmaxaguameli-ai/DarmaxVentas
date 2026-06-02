import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import GestionSidebar from "./GestionSidebar";
import NotificationTray from "../../components/common/NotificationTray";
import { ThemeProvider } from "../../context/ThemeContext";
import { GestionProvider } from "./context/GestionContext";
import { NotificationProvider } from "./context/NotificationContext"; // Import NotificationProvider
import NotificationController from "./components/NotificationController"; // Import Controller
import WelcomeModal from "./components/WelcomeModal";
import { Toaster } from "react-hot-toast";

const GestionDashboard = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false); // Para móvil
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Leer del localStorage. 'false' es el valor por defecto si no hay nada.
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });

  // Guardar en localStorage cuando cambie el estado
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', isSidebarCollapsed);
  }, [isSidebarCollapsed]);

  const toggleSidebarCollapsed = () => {
    setSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <ThemeProvider>
      <div className="flex h-screen bg-light dark:bg-dark text-text-light dark:text-text-dark font-display overflow-hidden">
        <Toaster position="top-right" reverseOrder={false} />
        
        <GestionSidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
          isCollapsed={isSidebarCollapsed}
          toggleCollapsed={toggleSidebarCollapsed}
        />

        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}

        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto transition-all duration-300 ease-in-out">
          <div className="flex items-center justify-between mb-4">
            <button
              className="md:hidden h-10 w-10 flex items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 shadow-sm"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <button
              className="hidden md:flex h-10 w-10 items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 shadow-sm"
              onClick={toggleSidebarCollapsed}
            >
              <span className="material-symbols-outlined">
                {isSidebarCollapsed ? 'menu_open' : 'menu'}
              </span>
            </button>
            <div>
              <NotificationTray />
            </div> 
          </div>
          <NotificationProvider>
            <GestionProvider>
              {/* <WelcomeModal /> */}
              <NotificationController />
              <Outlet />
            </GestionProvider>
          </NotificationProvider>
        </main>
      </div>
    </ThemeProvider>
  );
};

export default GestionDashboard;
