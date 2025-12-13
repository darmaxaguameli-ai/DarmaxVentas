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
      subtitle="Usa tu ID de cliente o teléfono para cargar tus datos y agilizar tu pedido."
      step={0}
      totalSteps={4}
    >
      <div className="max-w-lg mx-auto mt-8 flex flex-col gap-6">
        
        <div className="flex gap-2 p-1 rounded-lg bg-light dark:bg-dark/70 w-full">
          <button
            type="button"
            onClick={() => setSearchType("customId")}
            className={`w-1/2 px-3 py-2 text-sm font-bold rounded-md transition-colors ${
              searchType === "customId"
                ? "bg-primary text-white shadow"
                : "bg-transparent text-text-secondary dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5"
            }`}
          >
            ID Cliente
          </button>
          <button
            type="button"
            onClick={() => setSearchType("phone")}
            className={`w-1/2 px-3 py-2 text-sm font-bold rounded-md transition-colors ${
              searchType === "phone"
                ? "bg-primary text-white shadow"
                : "bg-transparent text-text-secondary dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5"
            }`}
          >
            Teléfono
          </button>
        </div>

        {searchType === "customId" && (
          <label className="flex flex-col">
            <p className="pb-2 text-sm font-medium text-dark dark:text-white">
              Tu ID de Cliente
            </p>
            <div className="flex items-center h-14 w-full rounded-xl border border-slate-300 bg-white px-4 text-lg
                          dark:border-slate-700 dark:bg-dark
                          focus-within:ring-2 ring-primary outline-none">
              <span className="text-text-secondary dark:text-white/50 mr-1">CLI-</span>
              <input
                type="text"
                value={searchIdentifier}
                onChange={handleCustomIdChange}
                placeholder="1234"
                className="flex-1 bg-transparent outline-none text-dark dark:text-white placeholder:text-text-secondary dark:placeholder:text-white/50"
              />
            </div>
          </label>
        )}

        {searchType === "phone" && (
          <label className="flex flex-col">
            <p className="pb-2 text-sm font-medium text-dark dark:text-white">
              Tu número de teléfono
            </p>
            <input
              type="tel"
              value={searchIdentifier}
              onChange={handlePhoneChange}
              placeholder="Ej. 5512345678"
              className="h-14 w-full rounded-xl border border-slate-300 bg-white px-4 text-lg
                         dark:border-slate-700 dark:bg-dark text-dark dark:text-white
                         placeholder:text-text-secondary dark:placeholder:text-white/50
                         focus:ring-2 ring-primary outline-none"
            />
          </label>
        )}

        {error && (
            <div className="text-red-500 text-sm text-center p-2 bg-red-500/10 rounded-md -mt-2">
                {error}
            </div>
        )}

        <Button
          onClick={handleSearchAndContinue}
          disabled={isSearching}
          fullWidth
          size="large"
        >
          {isSearching ? 'Buscando...' : 'Buscar y Continuar'}
        </Button>
        
        <button
            type="button"
            onClick={handleGoToStart}
            className="text-sm text-center font-medium text-text-secondary dark:text-white/70 hover:text-primary dark:hover:text-primary transition-colors"
          >
            &larr; O volver al inicio
        </button>
      </div>
    </OrderLayout>
  );
};

export default IdentifyClient;
