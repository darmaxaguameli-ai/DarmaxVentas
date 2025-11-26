// src/App.jsx
import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage.jsx";
<<<<<<< HEAD
import UsersPage from "./pages/UsersPage.jsx";
import VentaMostrador from "./pages/sistemasDeVentas/VentaMostrador.jsx";
import GestionDashboard from "./pages/Gestion/GestionDashboard.jsx";
import RepartidorDashboard from "./pages/sistemasDeVentas/Repartidor/RepartidorDashboard.jsx";

function App() {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/venta" element={<VentaMostrador />} />
        <Route path="/gestion" element={<GestionDashboard />} />
        <Route path="/repartidor" element={<RepartidorDashboard />} />
      </Routes>
    </MainLayout>
=======

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
    </Routes>
>>>>>>> fdcb154 (Update(login):new pages and routes)
  );
}

export default App;
