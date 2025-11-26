import { Outlet } from "react-router-dom";
import GestionSidebar from "./GestionSidebar";

const GestionDashboard = () => {
  return (
    <div className="flex h-screen bg-light dark:bg-dark text-text-light dark:text-text-dark font-display">
      <GestionSidebar />
      <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default GestionDashboard;
