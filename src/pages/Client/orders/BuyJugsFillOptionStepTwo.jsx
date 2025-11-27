// src/pages/Client/orders/BuyJugsFillOptionStepTwo.jsx
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import OrderLayout from "../../../layouts/OrderLayout";

const BuyJugsFillOptionStepTwo = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const previousState = location.state || {};
  const fromStepOneBuy = previousState.fromStepOneBuy || [];
  const totalJugsBuy = previousState.totalJugsBuy || 0;

  const [selectedOption, setSelectedOption] = useState("empty"); // "empty" | "full"

  const handleBack = () => {
    navigate("/pedidos/comprar", {
      state: previousState,
    });
  };

  const handleContinue = () => {
    if (!selectedOption) return;

    // Guardamos info común del flujo de compra
    const buyFlow = {
      fromStepOneBuy,
      totalJugsBuy,
      fillOption: selectedOption,
    };

    if (selectedOption === "full") {
      // 👉 GARAFÓN LLENO:
      // primero ir a elegir el TIPO de agua (similar al paso 2 del flujo de rellenar)
      navigate("/pedidos/comprar/asignar-agua", {
        state: {
          ...previousState,
          mode: "buy",
          buyFlow,
          backPath: "/pedidos/comprar/llenado",
        },
      });
    } else {
      // 👉 SOLO GARAFÓN:
      // saltamos directo al método de entrega y luego al resumen
      navigate("/pedidos/rellenar/entrega", {
        state: {
          ...previousState,
          mode: "buy",
          buyFlow,
          backPath: "/pedidos/comprar/llenado",
        },
      });
    }
  };

  const isEmpty = selectedOption === "empty";
  const isFull = selectedOption === "full";

  return (
    <OrderLayout
      title="¿Cómo quieres tus garrafones?"
      subtitle="Elige si deseas solo el envase o los garrafones ya llenos de agua."
      step={2}
      totalSteps={4}
    >
      <div className="flex flex-col gap-6">
        <p className="mt-1 text-sm sm:text-base text-text-secondary dark:text-white/80">
          Has seleccionado{" "}
          <span className="font-semibold text-primary">
            {totalJugsBuy}
          </span>{" "}
          garrafones en total.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Solo garrafón */}
          <button
            type="button"
            onClick={() => setSelectedOption("empty")}
            className={`flex flex-col items-center justify-center gap-3 rounded-2xl px-6 py-8 text-center
                        shadow-md backdrop-blur-xl transition-all border
            ${
              isEmpty
                ? "border-primary bg-white/95 dark:bg-dark/70 dark:border-primary scale-[1.02]"
                : "border-light/60 dark:border-white/10 bg-white/90 dark:bg-dark/60 hover:border-primary/40"
            }`}
          >
            <div
              className={`flex h-20 w-20 items-center justify-center rounded-full
              ${
                isEmpty
                  ? "bg-primary/10 text-primary"
                  : "bg-light dark:bg-dark text-text-secondary dark:text-white/70"
              }`}
            >
              <span className="material-symbols-outlined text-4xl sm:text-5xl">
                inventory_2
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-xl sm:text-2xl font-bold text-dark dark:text-white">
                Solo garrafón
              </h3>
              <p className="text-sm sm:text-base text-text-secondary dark:text-white/70 max-w-xs mx-auto">
                Comprarás únicamente el envase vacío. Ideal si ya tienes agua.
              </p>
            </div>
          </button>

          {/* Garrafón lleno */}
          <button
            type="button"
            onClick={() => setSelectedOption("full")}
            className={`flex flex-col items-center justify-center gap-3 rounded-2xl px-6 py-8 text-center
                        shadow-md backdrop-blur-xl transition-all border
            ${
              isFull
                ? "border-primary bg-white/95 dark:bg-dark/70 dark:border-primary scale-[1.02]"
                : "border-light/60 dark:border-white/10 bg-white/90 dark:bg-dark/60 hover:border-primary/40"
            }`}
          >
            <div
              className={`flex h-20 w-20 items-center justify-center rounded-full
              ${
                isFull
                  ? "bg-primary/10 text-primary"
                  : "bg-light dark:bg-dark text-text-secondary dark:text-white/70"
              }`}
            >
              <span className="material-symbols-outlined text-4xl sm:text-5xl">
                water_full
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-xl sm:text-2xl font-bold text-dark dark:text-white">
                Garrafón lleno
              </h3>
              <p className="text-sm sm:text-base text-text-secondary dark:text-white/70 max-w-xs mx-auto">
                Recibe tus garrafones llenos, listos para usarse.
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
            disabled={!selectedOption}
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
      </div>
    </OrderLayout>
  );
};

export default BuyJugsFillOptionStepTwo;
