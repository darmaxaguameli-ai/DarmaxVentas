// src/App.jsx
import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { Toaster, toast } from "sonner";
import { ClientProvider } from "./pages/Client/context/ClientContext";
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

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
import Roles from "./pages/Gestion/Roles.jsx";
import Leads from "./pages/Gestion/Leads.jsx";
import Marketing from "./pages/Gestion/Marketing.jsx";
import Promociones from "./pages/Gestion/Promociones.jsx";
import Blog from "./pages/Gestion/Blog.jsx";
import Legal from "./pages/Gestion/Legal.jsx";
import Instalacion from "./pages/Gestion/Instalacion.jsx";
import Configuracion from "./pages/Gestion/Configuracion.jsx";
import CotizadorDistribuidoresPage from "./pages/Gestion/CotizadorDistribuidoresPage.jsx";
import DarmaxQuote from "./pages/Gestion/DarmaxQuote.jsx";
import PublicQuoteView from "./pages/Gestion/PublicQuoteView.jsx";

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
import PuntoDeVentaPage from "./pages/PuntoDeVenta/PuntoDeVentaPage.jsx";

import Maintenance from "./pages/Maintenance.jsx";
import RoleSelector from "./pages/RoleSelector.jsx";
import ForceChangePassword from "./pages/ForceChangePassword.jsx";
import ScrollToTop from "./components/common/ScrollToTop.jsx";

function App() {
  const isMaintenanceMode = import.meta.env.VITE_MAINTENANCE_MODE === 'true'; // ACTIVAR DESDE .env

  // --- Push Notification Setup ---
  const registerPush = () => {
    // Solo se ejecuta en plataformas nativas (iOS/Android)
    if (Capacitor.getPlatform() === 'web') {
      return;
    }

    // 1. Solicitar permiso para recibir notificaciones
    PushNotifications.requestPermissions().then(result => {
      if (result.receive === 'granted') {
        // Si el permiso es concedido, registrarse para recibir notificaciones
        PushNotifications.register();
      } else {
        // El usuario no concedió el permiso
        console.warn('Permiso de notificaciones no concedido.');
      }
    });

    // 2. Evento que se dispara al registrarse exitosamente
    PushNotifications.addListener('registration', (token) => {
      console.info('Token de registro Push:', token.value);
      //
      // --- TAREA CRÍTICA ---
      // Aquí debes enviar este `token.value` a tu servidor backend y
      // asociarlo con el usuario que ha iniciado sesión.
      // Ejemplo:
      // apiClient.post('/api/user/save-fcm-token', { token: token.value });
      //
    });

    // 3. Evento que se dispara si hay un error en el registro
    PushNotifications.addListener('registrationError', (error) => {
      console.error('Error en el registro de notificaciones:', JSON.stringify(error));
    });

    // 4. Evento que se dispara cuando se recibe una notificación y la app está en primer plano
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Notificación Push recibida:', notification);
        // Usamos el toaster que ya tienes para mostrar una alerta amigable
        toast.info(notification.title, {
            description: notification.body,
            duration: 6000,
        });
    });

    // 5. Evento que se dispara cuando el usuario TOCA la notificación
    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('Acción de notificación Push realizada:', notification);
        // Ejemplo de cómo podrías redirigir al usuario a una página específica
        // const url = notification.notification.data.url;
        // if (url) {
        //   navigate(url);
        // }
      },
    );
  }
  // --- Fin de Push Notification Setup ---

  // Ejecutar el registro de notificaciones cuando el componente se monta
  useEffect(() => {
    registerPush();
  }, []);

  return (
    <ClientProvider>
      <Toaster richColors position="top-center" />
      <ScrollToTop />
      <Routes>
        {/* Público / Auth */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/login-success" element={<ProtectedRoute><LoginSuccess /></ProtectedRoute>} />
        <Route path="/role-selector" element={<ProtectedRoute><RoleSelector /></ProtectedRoute>} />
        <Route path="/change-password-force" element={<ProtectedRoute><ForceChangePassword /></ProtectedRoute>} />
        <Route path="/logout-success" element={<LogoutSuccess />} />
        <Route path="/registro" element={<Register />} />
        <Route path="/cotizacion/ver/:id" element={<PublicQuoteView />} />

        {/* Cliente Profile & Pedidos */}
        <Route path="/profile" element={<ProtectedRoute><ClientProfile /></ProtectedRoute>} />
        <Route path="/mis-pedidos" element={<ProtectedRoute><MisPedidos /></ProtectedRoute>} />

        {/* Punto de Venta */}
        <Route path="/punto-de-venta" element={<PuntoDeVentaPage />} />

        {/* Sistema de Ventas */}
        <Route path="/ventas/productos" element={<ProductGrid />} />
        <Route path="/ventas/mostrador" element={<ProtectedRoute permission="canAccessPOS"><VentaMostrador /></ProtectedRoute>} />
        <Route path="/repartidor/dashboard" element={<ProtectedRoute permission="canAccessDelivery"><RepartidorDashboard /></ProtectedRoute>} />

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
          <Route path="roles" element={<Roles />} />
          <Route path="prospeccion" element={<Leads />} />
          <Route path="marketing" element={<Marketing />} />
          <Route path="promociones" element={<Promociones />} />
          <Route path="blog" element={<Blog />} />
          <Route path="legal" element={<Legal />} />
          <Route path="instalacion" element={<Instalacion />} />
          <Route path="configuracion" element={<Configuracion />} />
          <Route path="cotizador" element={<DarmaxQuote />} />
          <Route path="cotizador-distribuidores" element={<CotizadorDistribuidoresPage />} />
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

        {/* Mantenimiento */}
        <Route path="/mantenimiento" element={<Maintenance />} />
      </Routes>
    </ClientProvider>
  );
}

export default App;
