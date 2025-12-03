import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import { AuthProvider } from "./pages/sistemasDeVentas/context/AuthContext.jsx";
import { OrderProvider } from "./pages/sistemasDeVentas/context/OrderContext.jsx";
import { AuthProvider as GlobalAuthProvider } from "./context/AuthContext.jsx";
import { ConfigProvider } from "./context/ConfigContext.jsx";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <GlobalAuthProvider>
        <ConfigProvider>
          <AuthProvider>
            <OrderProvider>
              <App />
            </OrderProvider>
          </AuthProvider>
        </ConfigProvider>
      </GlobalAuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
