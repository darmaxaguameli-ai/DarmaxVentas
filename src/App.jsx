// src/App.jsx
import { Routes, Route } from "react-router-dom";

// Auth / landing
import HomePage from "./pages/HomePage.jsx";
import Register from "./pages/Register";
import Login from "./pages/Login";

// Sistema de Ventas
import ProductGrid from "./pages/sistemasDeVentas/ProductGrid.jsx";
import VentaMostrador from "./pages/sistemasDeVentas/VentaMostrador.jsx";
import StartDayModal from "./pages/sistemasDeVentas/StartDayModal.jsx";
import RepartidorDashboard from "./pages/sistemasDeVentas/Repartidor/RepartidorDashboard.jsx";

// Gestión
import { GestionProvider } from "./pages/Gestion/context/GestionContext.jsx";
import GestionDashboard from "./pages/Gestion/GestionDashboard.jsx";
import Resumen from "./pages/Gestion/Resumen.jsx";
import Inventario from "./pages/Gestion/Inventario.jsx";
import Ingresos from "./pages/Gestion/Ingresos.jsx";
import Gastos from "./pages/Gestion/Gastos.jsx";

// Cliente – flujo de pedidos
import OrderSelection from "./pages/Client/orders/OrderSelection.jsx";
import RefillJugStepOne from "./pages/Client/orders/RefillJugStepOne.jsx";
import RefillAssignStepTwo from "./pages/Client/orders/RefillAssignStepTwo.jsx";
import DeliveryMethodStepThree from "./pages/Client/orders/DeliveryMethodStepThree.jsx";
import OrderSummaryStepFour from "./pages/Client/orders/OrderSummaryStepFour.jsx";
import IdentifyClient from "./pages/Client/orders/IdentifyClient";
import PickupClientDataStep from "./pages/Client/orders/PickupClientDataStep.jsx";
import ClientDataConfirmation from "./pages/Client/orders/ClientDataConfirmation.jsx";
import BuyJugsStepOne from "./pages/Client/orders/BuyJugsStepOne.jsx";
import BuyJugsFillOptionStepTwo from "./pages/Client/orders/BuyJugsFillOptionStepTwo.jsx";

function App() {
  return (
    <Routes>
      {/* Público / Auth */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Register />} />


      {/* Sistema de Ventas */}
      <Route path="/ventas/productos" element={<ProductGrid />} />
      <Route path="/ventas/mostrador" element={<VentaMostrador />} />
      <Route path="/ventas/inicio" element={<StartDayModal />} />
      <Route path="/repartidor" element={<RepartidorDashboard />} />


      {/* Gestión */}
      <Route
        path="/gestion"
        element={
          <GestionProvider>
            <GestionDashboard />
          </GestionProvider>
        }
      >
        <Route index element={<Resumen />} />
        <Route path="inventario" element={<Inventario />} />
        <Route path="ingresos" element={<Ingresos />} />
        <Route path="gastos" element={<Gastos />} />
      </Route>


      {/* Cliente – flujo de pedidos */}
      <Route path="/pedidos" element={<OrderSelection />} />
      <Route path="/pedidos/rellenar" element={<RefillJugStepOne />} />
      <Route path="/pedidos/rellenar/asignar" element={<RefillAssignStepTwo />} />
      <Route path="/pedidos/rellenar/entrega" element={<DeliveryMethodStepThree />} />
      <Route path="/pedidos/rellenar/resumen" element={<OrderSummaryStepFour />} />
      <Route path="/pedidos/identificar" element={<IdentifyClient />} />
      <Route path="/pedidos/rellenar/datos-cliente" element={<PickupClientDataStep />} />
      <Route path="/pedidos/rellenar/datos-confirmados" element={<ClientDataConfirmation />}/>
      <Route path="/pedidos/comprar" element={<BuyJugsStepOne />} />
      <Route path="/pedidos/comprar/opcion-llenado" element={<BuyJugsFillOptionStepTwo />} />
    </Routes>
  );
}

export default App;
