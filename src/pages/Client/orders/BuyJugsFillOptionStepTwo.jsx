// src/pages/Client/orders/BuyJugsFillOptionStepTwo.jsx
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import OrderLayout from "../../../layouts/OrderLayout";
import { useConfig } from "../../../context/ConfigContext";
import { useHaptic } from "../../../hooks/useHaptic";

const BuyJugsFillOptionStepTwo = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selection } = useHaptic();

  const previousState = location.state || {};
  const fromStepOneBuy = previousState.selectedProducts || [];
  
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
    const nextState = {
      ...previousState,
      mode: "buy",
      buyFlow,
      backPath: "/pedidos/comprar/opcion-llenado",
    };

    if (selectedOption === "full" || hasRefills) {
      // Ir a asignación
      navigate("/pedidos/comprar/asignar-agua", { state: nextState });
    } else {
      // Solo productos secos o garrafones vacíos, ir a entrega estándar
      navigate("/pedidos/rellenar/entrega", { state: nextState });
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
          <span className="font-bold text-primary">
            {totalJugsBuy} {totalJugsBuy === 1 ? 'garrafón' : 'garrafones'}
          </span>{" "}
          en total.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-3xl mx-auto my-2">
          {/* Solo garrafón */}
          <button
            type="button"
            onClick={() => {
              selection();
              setSelectedOption("empty");
            }}
            className={`group relative overflow-hidden flex flex-col items-center justify-between gap-4 rounded-3xl p-6 sm:p-8 text-center
                        backdrop-blur-2xl transition-all duration-300 border active:scale-[0.98]
            ${
              isEmpty
                ? "border-primary ring-2 ring-primary/50 bg-gradient-to-b from-primary/10 via-white/95 to-white/90 dark:from-primary/20 dark:via-gray-800/95 dark:to-gray-800/90 shadow-xl shadow-primary/20 scale-[1.02]"
                : "border-white/80 dark:border-white/10 bg-white/80 dark:bg-gray-800/80 shadow-md shadow-cyan-500/5 hover:border-primary/40 hover:shadow-xl hover:-translate-y-1"
            }`}
          >
            {isEmpty && (
              <div className="absolute top-3 right-3 animate-in zoom-in-75 duration-200">
                <span className="material-symbols-outlined text-primary text-2xl font-black">
                  check_circle
                </span>
              </div>
            )}
            <div
              className={`flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-3xl transition-transform group-hover:scale-105 duration-300
              ${
                isEmpty
                  ? "bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-xl shadow-amber-500/30"
                  : "bg-gradient-to-br from-amber-400/20 to-orange-500/20 text-amber-600 dark:text-amber-400"
              }`}
            >
              <span className="material-symbols-outlined text-4xl sm:text-5xl">
                inventory_2
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <h3 className="text-xl sm:text-2xl font-black text-dark dark:text-white leading-tight">
                Solo garrafón
              </h3>
              <p className="text-xs sm:text-sm text-text-secondary dark:text-white/70 max-w-xs mx-auto leading-relaxed">
                Únicamente el envase nuevo sellado y vacío (sin agua).
              </p>
            </div>
            <div className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-colors ${
              isEmpty ? "bg-primary text-white" : "bg-gray-100 dark:bg-gray-700/60 text-gray-500 dark:text-gray-300"
            }`}>
              {isEmpty ? "Seleccionado" : "Tocar para seleccionar"}
            </div>
          </button>

          {/* Garrafón lleno */}
          <button
            type="button"
            onClick={() => {
              selection();
              setSelectedOption("full");
            }}
            className={`group relative overflow-hidden flex flex-col items-center justify-between gap-4 rounded-3xl p-6 sm:p-8 text-center
                        backdrop-blur-2xl transition-all duration-300 border active:scale-[0.98]
            ${
              isFull
                ? "border-cyan-500 ring-2 ring-cyan-500/50 bg-gradient-to-b from-cyan-500/10 via-white/95 to-white/90 dark:from-cyan-500/20 dark:via-gray-800/95 dark:to-gray-800/90 shadow-xl shadow-cyan-500/20 scale-[1.02]"
                : "border-white/80 dark:border-white/10 bg-white/80 dark:bg-gray-800/80 shadow-md shadow-cyan-500/5 hover:border-cyan-400/60 hover:shadow-xl hover:-translate-y-1"
            }`}
          >
            {isFull && (
              <div className="absolute top-3 right-3 animate-in zoom-in-75 duration-200">
                <span className="material-symbols-outlined text-cyan-500 text-2xl font-black">
                  check_circle
                </span>
              </div>
            )}
            <div
              className={`flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-3xl transition-transform group-hover:scale-105 duration-300
              ${
                isFull
                  ? "bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-600 text-white shadow-xl shadow-cyan-500/30"
                  : "bg-gradient-to-br from-cyan-400/20 to-blue-500/20 text-cyan-600 dark:text-cyan-400"
              }`}
            >
              <span className="material-symbols-outlined text-4xl sm:text-5xl">
                water_full
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <h3 className="text-xl sm:text-2xl font-black text-dark dark:text-white leading-tight">
                Garrafón con agua
              </h3>
              <p className="text-xs sm:text-sm text-text-secondary dark:text-white/70 max-w-xs mx-auto leading-relaxed">
                Envase nuevo lleno de agua pura o alcalina, listo para tu consumo.
              </p>
            </div>
            <div className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-colors ${
              isFull ? "bg-cyan-500 text-white" : "bg-gray-100 dark:bg-gray-700/60 text-gray-500 dark:text-gray-300"
            }`}>
              {isFull ? "Seleccionado" : "Tocar para seleccionar"}
            </div>
          </button>
        </div>

        {/* Footer botones */}
        <div className="mt-auto pt-4 flex flex-col-reverse sm:flex-row gap-4 justify-between items-center">
          <button
            type="button"
            onClick={handleBack}
            className="flex h-11 sm:h-12 w-full sm:w-auto items-center justify-center rounded-2xl
                       border border-white/80 dark:border-white/10
                       bg-white/80 text-gray-700 
                       dark:bg-gray-800/80 dark:text-gray-200
                       text-sm sm:text-base font-bold
                       px-6
                       hover:bg-white dark:hover:bg-gray-700
                       backdrop-blur-xl shadow-sm
                       transition-all duration-200 active:scale-95 cursor-pointer"
          >
            Volver al paso 1
          </button>

          <button
            type="button"
            disabled={!selectedOption || configLoading}
            onClick={handleContinue}
            className="flex h-11 sm:h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-2xl
                       bg-primary hover:bg-primary-dark px-7 text-sm sm:text-base font-bold text-white
                       shadow-md shadow-primary/25 hover:shadow-lg
                       transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <span>
              {selectedOption === "full"
                ? "Elegir tipo de agua"
                : "Elegir método de entrega"}
            </span>
            <span className="material-symbols-outlined text-lg">arrow_forward</span>
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
