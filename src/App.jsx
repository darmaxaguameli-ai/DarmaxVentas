import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout.jsx";
import HomePage from "./pages/HomePage.jsx";
import UsersPage from "./pages/UsersPage.jsx";

function App() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md">
        <h1 className="text-2xl font-bold text-slate-900">
          Tailwind funcionando ✅
        </h1>
        <p className="text-slate-600 mt-2">
          Vite + React + Tailwind + Prisma + Vercel listos para empezar.
        </p>
      </div>
    </div>
  );
}

export default App;

