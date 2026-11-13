// src/pages/Client/orders/IdentifyClient.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import OrderLayout from "../../../layouts/OrderLayout";
import apiClient from "../../../api/apiClient";
import Button from "../../../components/common/Button";

const IdentifyClient = () => {
  const navigate = useNavigate();

  const [searchIdentifier, setSearchIdentifier] = useState("");
  const [searchType, setSearchType] = useState("customId"); // 'customId' or 'phone'
  const [error, setError] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleCustomIdChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, ""); // Solo números
    setSearchIdentifier(value);
  };

  const handlePhoneChange = (e) => {
    setSearchIdentifier(e.target.value.replace(/[^0-9]/g, "")); // Solo números
  };
  
  const handleSearchAndContinue = async () => {
    setError("");
    if (!searchIdentifier) {
      setError("Por favor, introduce tu ID o teléfono.");
      return;
    }
    
    setIsSearching(true);

    let identifierForApi = searchIdentifier;
    if (searchType === "customId") {
      identifierForApi = "CLI-" + searchIdentifier;
    }

    try {
      const response = await apiClient.get(`/users/check`, {
        params: {
          identifier: identifierForApi,
          type: searchType,
        },
      });
      
      const foundUser = response.data;
      
      // Si se encuentra el usuario, se navega al siguiente paso con sus datos
      navigate("/pedidos/rellenar", {
        state: { 
          clientData: foundUser,
          // Se podría añadir un 'origin' para saber de dónde vino, si fuera necesario
        },
      });

    } catch (err) {
      console.error("Error checking user:", err);
      if (err.response && err.response.status === 404) {
        setError("No se encontró ningún cliente con ese identificador.");
      } else {
        setError("Ocurrió un error al verificar tu cuenta. Intenta de nuevo.");
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleGoToStart = () => {
    navigate('/pedidos');
  };

  return (
    <OrderLayout
      title="Identifícate como cliente"
      subtitle="Ingresa tu ID de cliente o teléfono para cargar automáticamente tus datos y agilizar tu pedido."
      step={0}
      totalSteps={4}
    >
      <div className="max-w-md mx-auto mt-6 flex flex-col gap-5 sm:gap-6">
        
        {/* Segmented Control Glass */}
        <div className="flex gap-1.5 p-1.5 rounded-2xl bg-white/70 dark:bg-gray-800/70 border border-white/80 dark:border-white/10 backdrop-blur-xl shadow-xs w-full">
          <button
            type="button"
            onClick={() => setSearchType("customId")}
            className={`flex-1 py-3 text-xs sm:text-sm font-bold rounded-xl transition-all active:scale-95 ${
              searchType === "customId"
                ? "bg-primary text-white shadow-md shadow-primary/25"
                : "bg-transparent text-gray-600 dark:text-gray-300 hover:text-primary"
            }`}
          >
            ID de Cliente
          </button>
          <button
            type="button"
            onClick={() => setSearchType("phone")}
            className={`flex-1 py-3 text-xs sm:text-sm font-bold rounded-xl transition-all active:scale-95 ${
              searchType === "phone"
                ? "bg-primary text-white shadow-md shadow-primary/25"
                : "bg-transparent text-gray-600 dark:text-gray-300 hover:text-primary"
            }`}
          >
            Número de Teléfono
          </button>
        </div>

        {searchType === "customId" && (
          <label className="flex flex-col gap-2">
            <span className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
              Tu ID de Cliente Darmax
            </span>
            <div className="flex items-center h-14 w-full rounded-2xl border border-white/80 dark:border-white/10 bg-white/80 dark:bg-gray-800/80 px-4 text-xl backdrop-blur-xl shadow-xs focus-within:ring-2 focus-within:ring-primary/50 transition-all">
              <span className="text-primary font-black mr-1.5 text-lg select-none">CLI-</span>
              <input
                type="text"
                value={searchIdentifier}
                onChange={handleCustomIdChange}
                placeholder="1234"
                className="flex-1 bg-transparent outline-none font-bold text-gray-900 dark:text-white placeholder:text-gray-400"
                autoFocus
              />
            </div>
          </label>
        )}

        {searchType === "phone" && (
          <label className="flex flex-col gap-2">
            <span className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
              Tu número de teléfono (10 dígitos)
            </span>
            <div className="flex items-center h-14 w-full rounded-2xl border border-white/80 dark:border-white/10 bg-white/80 dark:bg-gray-800/80 px-4 text-xl backdrop-blur-xl shadow-xs focus-within:ring-2 focus-within:ring-primary/50 transition-all">
              <span className="material-symbols-outlined text-primary mr-2 text-2xl select-none">phone</span>
              <input
                type="tel"
                value={searchIdentifier}
                onChange={handlePhoneChange}
                placeholder="Ej. 5512345678"
                className="flex-1 bg-transparent outline-none font-bold text-gray-900 dark:text-white placeholder:text-gray-400"
                autoFocus
              />
            </div>
          </label>
        )}

        {error && (
            <div className="text-red-500 text-xs sm:text-sm font-bold text-center p-3 bg-red-500/10 border border-red-500/20 rounded-2xl animate-shake">
                {error}
            </div>
        )}

        <button
          onClick={handleSearchAndContinue}
          disabled={isSearching}
          className="h-11 sm:h-12 w-full flex items-center justify-center gap-2 rounded-2xl bg-primary hover:bg-primary-dark font-bold text-white text-sm sm:text-base shadow-md shadow-primary/25 hover:shadow-lg transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isSearching ? (
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
              Buscando cuenta...
            </span>
          ) : (
            <>
              <span>Buscar y Continuar</span>
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </>
          )}
        </button>
        
        <button
            type="button"
            onClick={handleGoToStart}
            className="text-xs sm:text-sm text-center font-bold text-text-secondary dark:text-white/70 hover:text-primary dark:hover:text-primary transition-colors py-1"
          >
            ← O volver a la pantalla principal
        </button>
      </div>
    </OrderLayout>
  );
};

export default IdentifyClient;
