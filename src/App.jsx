import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout.jsx";
import HomePage from "./pages/HomePage.jsx";
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
  );
}

export default App;
