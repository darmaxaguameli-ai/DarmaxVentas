// src/App.jsx
import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage.jsx";

// Importar vistas del sistema de ventas
import ProductGrid from "./pages/sistemasDeVentas/ProductGrid.jsx";
import VentaMostrador from "./pages/sistemasDeVentas/VentaMostrador.jsx";
import StartDayModal from "./pages/sistemasDeVentas/StartDayModal.jsx";
import RepartidorDashboard from "./pages/sistemasDeVentas/Repartidor/RepartidorDashboard.jsx";

// Importar vistas de gestión
import GestionDashboard from "./pages/Gestion/GestionDashboard.jsx";
import Resumen from "./pages/Gestion/Resumen.jsx";
import Inventario from "./pages/Gestion/Inventario.jsx";
import Ingresos from "./pages/Gestion/Ingresos.jsx";
import Gastos from "./pages/Gestion/Gastos.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />

      {/* Rutas: Sistema de Ventas */}
      <Route path="/ventas/productos" element={<ProductGrid />} />
      <Route path="/ventas/mostrador" element={<VentaMostrador />} />
      <Route path="/ventas/inicio" element={<StartDayModal />} />
      <Route path="/repartidor" element={<RepartidorDashboard />} />

      {/* Rutas: Gestión */}
      <Route path="/gestion" element={<GestionDashboard />}>
        <Route index element={<Resumen />} />
        <Route path="inventario" element={<Inventario />} />
        <Route path="ingresos" element={<Ingresos />} />
        <Route path="gastos" element={<Gastos />} />
      </Route>
    </Routes>
  );
}

export default App;
