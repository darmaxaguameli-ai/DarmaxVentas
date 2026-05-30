// src/pages/Client/orders/BuyJugsFillOptionStepTwo.jsx
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import OrderLayout from "../../../layouts/OrderLayout";
import { useConfig } from "../../../context/ConfigContext"; // Importar useConfig

const BuyJugsFillOptionStepTwo = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const previousState = location.state || {};
  const fromStepOneBuy = previousState.fromStepOneBuy || [];
  
  // Solo los garrafones pasan por el proceso de llenado/asignación de agua
  const jugsToFill = fromStepOneBuy.filter(p => p.category === 'Garrafones');
  const otherItems = fromStepOneBuy.filter(p => p.category !== 'Garrafones');
  const totalJugsBuy = jugsToFill.reduce((sum, p) => sum + p.quantity, 0);

  const [selectedOption, setSelectedOption] = useState("full"); // Default "full" for better UX
  const { waterTypes, servicePrices, loading: configLoading, error: configError } = useConfig();


  const handleBack = () => {
    navigate("/pedidos/comprar", {
      state: previousState,
    });
  };

  const handleContinue = () => {
    if (!selectedOption) return;

    const buyFlow = {
      fromStepOneBuy,
      totalJugsBuy,
      fillOption: selectedOption,
      availableWaterTypes: waterTypes,
      servicePrices: servicePrices,
    };

    const hasRefills = (location.state?.selectedRefills?.length || 0) > 0;

    if (selectedOption === "full" || hasRefills) {
      // Ir a asignación si hay garrafones nuevos llenos O si ya traíamos recargas del otro flujo
      navigate("/pedidos/comprar/asignar-agua", {
        state: {
          ...previousState,
          mode: "buy",
          buyFlow,
          backPath: "/pedidos/comprar/opcion-llenado",
        },
      });
    } else {
      // Solo productos secos o garrafones vacíos, ir a entrega
      navigate("/pedidos/rellenar/entrega", {
        state: {
          ...previousState,
          mode: "buy",
          buyFlow,
          backPath: "/pedidos/comprar/opcion-llenado",
        },
      });
    }
  };

  const isEmpty = selectedOption === "empty";
  const isFull = selectedOption === "full";

  const renderContent = () => {
    if (configLoading) {
      return <div className="text-center py-10">Cargando tipos de agua...</div>;
    }
    if (configError) {
      return <div className="text-center py-10 text-red-500">{configError}</div>;
    }
    return (
      <>
        <p className="mt-1 text-sm sm:text-base text-text-secondary dark:text-white/80">
          Has seleccionado{" "}
          <span className="font-semibold text-primary">
            {totalJugsBuy}
          </span>{" "}
          garrafones en total.
        </p>

        <div className="grid grid-cols-2 gap-3 sm:gap-6 max-w-3xl mx-auto">
          {/* Solo garrafón */}
          <button
            type="button"
            onClick={() => setSelectedOption("empty")}
            className={`flex flex-col items-center justify-center gap-2 sm:gap-3 rounded-2xl px-3 py-6 sm:px-6 sm:py-8 text-center
                        shadow-md backdrop-blur-xl transition-all border
            ${
              isEmpty
                ? "border-primary bg-white/95 dark:bg-dark/70 dark:border-primary scale-[1.02]"
                : "border-light/60 dark:border-white/10 bg-white/90 dark:bg-dark/60 hover:border-primary/40"
            }`}
          >
            <div
              className={`flex h-14 w-14 sm:h-20 sm:w-20 items-center justify-center rounded-full
              ${
                isEmpty
                  ? "bg-primary/10 text-primary"
                  : "bg-light dark:bg-dark text-text-secondary dark:text-white/70"
              }`}
            >
              <span className="material-symbols-outlined text-3xl sm:text-5xl">
                inventory_2
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-base sm:text-2xl font-bold text-dark dark:text-white leading-tight">
                Solo garrafón
              </h3>
              <p className="text-xs sm:text-base text-text-secondary dark:text-white/70 max-w-xs mx-auto">
                Solo el envase vacío.
              </p>
            </div>
          </button>

          {/* Garrafón lleno */}
          <button
            type="button"
            onClick={() => setSelectedOption("full")}
            className={`flex flex-col items-center justify-center gap-2 sm:gap-3 rounded-2xl px-3 py-6 sm:px-6 sm:py-8 text-center
                        shadow-md backdrop-blur-xl transition-all border
            ${
              isFull
                ? "border-primary bg-white/95 dark:bg-dark/70 dark:border-primary scale-[1.02]"
                : "border-light/60 dark:border-white/10 bg-white/90 dark:bg-dark/60 hover:border-primary/40"
            }`}
          >
            <div
              className={`flex h-14 w-14 sm:h-20 sm:w-20 items-center justify-center rounded-full
              ${
                isFull
                  ? "bg-primary/10 text-primary"
                  : "bg-light dark:bg-dark text-text-secondary dark:text-white/70"
              }`}
            >
              <span className="material-symbols-outlined text-3xl sm:text-5xl">
                water_full
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-base sm:text-2xl font-bold text-dark dark:text-white leading-tight">
                Garrafón lleno
              </h3>
              <p className="text-xs sm:text-base text-text-secondary dark:text-white/70 max-w-xs mx-auto">
                Listo para usarse.
              </p>
            </div>
          </button>
        </div>

        {/* Footer botones */}
        <div className="mt-auto pt-2 flex flex-col-reverse sm:flex-row gap-4 justify-between items-center">
          <button
            type="button"
            onClick={handleBack}
            className="flex h-12 sm:h-14 w-full sm:w-auto items-center justify-center
                       rounded-lg border border-slate-300
                       bg-slate-100 text-dark 
                       dark:bg-slate-800 dark:text-white dark:border-slate-600
                       text-base sm:text-lg font-semibold
                       px-6 sm:px-8
                       hover:bg-slate-200 dark:hover:bg-slate-700
                       transition-all"
          >
            Volver al paso 1
          </button>

          <button
            type="button"
            disabled={!selectedOption || configLoading} // Disable if config loading
            onClick={handleContinue}
            className="flex h-12 sm:h-14 w-full sm:w-auto items-center justify-center rounded-xl
                       bg-primary px-8 sm:px-10 text-base sm:text-lg font-semibold text-white
                       shadow-sm hover:bg-primary/90
                       focus-visible:outline focus-visible:outline-2 
                       focus-visible:outline-offset-2 focus-visible:outline-primary
                       transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {selectedOption === "full"
              ? "Elegir tipo de agua"
              : "Elegir método de entrega"}
          </button>
        </div>
      </>
    );
  };

  return (
    <OrderLayout
      title="¿Cómo quieres tus garrafones?"
      subtitle="Elige si deseas solo el envase o los garrafones ya llenos de agua."
      step={2}
      totalSteps={4}
    >
      <div className="flex flex-col gap-6">
        {renderContent()}
      </div>
    </OrderLayout>
  );
};

export default BuyJugsFillOptionStepTwo;
