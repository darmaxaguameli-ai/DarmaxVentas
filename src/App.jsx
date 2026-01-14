// src/App.jsx
import { Routes, Route } from "react-router-dom";
import { ClientProvider } from "./pages/Client/context/ClientContext";

// Auth / landing
import HomePage from "./pages/HomePage.jsx";
import Register from "./pages/Register";
import Login from "./pages/Login";
import LoginSuccess from "./pages/LoginSuccess.jsx";
import LogoutSuccess from "./pages/LogoutSuccess.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import VerifyEmail from "./pages/VerifyEmail.jsx";

// Sistema de Ventas
import ProductGrid from "./pages/sistemasDeVentas/ProductGrid.jsx";
import VentaMostrador from "./pages/sistemasDeVentas/VentaMostrador.jsx";
import StartDayModal from "./pages/sistemasDeVentas/StartDayModal.jsx";
import RepartidorDashboard from "./pages/sistemasDeVentas/Repartidor/RepartidorDashboard.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AdminProtectedRoute from "./components/AdminProtectedRoute.jsx";

// Gestión
import { GestionProvider } from "./pages/Gestion/context/GestionContext.jsx";
import GestionDashboard from "./pages/Gestion/GestionDashboard.jsx";
import Resumen from "./pages/Gestion/Resumen.jsx";
import Inventario from "./pages/Gestion/Inventario.jsx";
import Ingresos from "./pages/Gestion/Ingresos.jsx";
import Gastos from "./pages/Gestion/Gastos.jsx";
import Usuarios from "./pages/Gestion/Usuarios.jsx";
import Empleados from "./pages/Gestion/Empleados.jsx";
import RecursosHumanos from "./pages/Gestion/RecursosHumanos.jsx";
import EmpleadoDetalle from "./pages/Gestion/EmpleadoDetalle.jsx";
import Configuracion from "./pages/Gestion/Configuracion.jsx";
import ControlVentasDiarias from "./pages/Gestion/ControlVentasDiarias.jsx";
import DarmaxQuote from "./pages/Gestion/DarmaxQuote.jsx";

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
import BuyJugsAssignWaterStepThree from "./pages/Client/orders/BuyJugsAssignWaterStepThree.jsx";
import OrderConfirmation from "./pages/Client/orders/OrderConfirmation.jsx";
import ClientProfile from "./pages/Client/ClientProfile";
import MisPedidos from "./pages/Client/MisPedidos.jsx";

import ScrollToTop from "./components/common/ScrollToTop.jsx";

function App() {
  return (
    <ClientProvider>
      <ScrollToTop />
      <Routes>
        {/* Público / Auth */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/login-success" element={<ProtectedRoute><LoginSuccess /></ProtectedRoute>} />
        <Route path="/logout-success" element={<LogoutSuccess />} />
        <Route path="/registro" element={<Register />} />

        {/* Cliente Profile & Pedidos */}
        <Route path="/profile" element={<ProtectedRoute><ClientProfile /></ProtectedRoute>} />
        <Route path="/mis-pedidos" element={<ProtectedRoute><MisPedidos /></ProtectedRoute>} />

        {/* Sistema de Ventas */}
        <Route path="/ventas/productos" element={<ProductGrid />} />
        <Route path="/ventas/mostrador" element={<ProtectedRoute allowedRoles={['ADMIN', 'VENDEDOR']}><VentaMostrador /></ProtectedRoute>} />
        <Route path="/repartidor/dashboard" element={<ProtectedRoute allowedRoles={['ADMIN', 'REPARTIDOR']}><RepartidorDashboard /></ProtectedRoute>} />

        {/* Gestión */}
        <Route
          path="/gestion"
          element={
            <GestionProvider>
              <AdminProtectedRoute>
                <GestionDashboard />
              </AdminProtectedRoute>
            </GestionProvider>
          }
        >
          <Route index element={<Resumen />} />
          <Route path="inventario" element={<Inventario />} />
          <Route path="ingresos" element={<Ingresos />} />
          <Route path="gastos" element={<Gastos />} />
          <Route path="usuarios" element={<Usuarios />} />
          <Route path="empleados" element={<Empleados />} />
          <Route path="recursos-humanos" element={<RecursosHumanos />} />
          <Route path="recursos-humanos/:id" element={<EmpleadoDetalle />} />
          <Route path="configuracion" element={<Configuracion />} />
          <Route path="control-ventas-diarias" element={<ControlVentasDiarias />} />
          <Route path="cotizador" element={<DarmaxQuote />} />
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
        <Route path="/pedidos/comprar/asignar-agua" element={<BuyJugsAssignWaterStepThree />} />
        <Route path="/pedidos/confirmado" element={<OrderConfirmation />} />
      </Routes>
    </ClientProvider>
  );
}

export default App;
