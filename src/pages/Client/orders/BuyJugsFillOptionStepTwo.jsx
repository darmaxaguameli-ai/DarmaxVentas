import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react"; // ← FALTABA ESTE
import OrderLayout from "../../../layouts/OrderLayout";


const BuyJugsFillOptionStepTwo = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { totalJugs = 0, products = [] } = location.state || {};

  const [mode, setMode] = useState("filled"); // "filled" | "empty"

  const handleBack = () => {
    navigate("/pedidos/comprar", {
      state: { totalJugs, products },
    });
  };

  const handleContinue = () => {
    if (!mode || totalJugs === 0) return;

    if (mode === "empty") {
      // Solo compra de garrafones vacíos → directo a método de entrega
      navigate("/pedidos/comprar/entrega", {
        state: {
          totalJugs,
          products,
          buyMode: "empty",
        },
      });
    } else {
      // Compra de garrafones llenos → reasignar agua (similar al Paso 2 de rellenar)
      navigate("/pedidos/comprar/asignar-agua", {
        state: {
          totalJugs,
          products,
          buyMode: "filled",
        },
      });
    }
  };

  const isEmpty = mode === "empty";
  const isFilled = mode === "filled";

  return (
    <OrderLayout
      title="¿Garrafones vacíos o llenos?"
      subtitle="Elige si quieres solo el garrafón o ya con agua incluida."
      step={2}
      totalSteps={4}
    >
      <div className="flex flex-col gap-6">
        <p className="text-sm sm:text-base text-text-secondary dark:text-white/80">
          Tienes seleccionados{" "}
          <span className="font-bold text-primary">{totalJugs}</span>{" "}
          garrafones Darmax. Ahora decide cómo los quieres.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Solo garrafón vacío */}
          <button
            type="button"
            onClick={() => setMode("empty")}
            className={`flex flex-col items-center justify-center gap-3 rounded-2xl px-6 py-8 text-center
                        shadow-md backdrop-blur-xl transition-all border
              ${
                isEmpty
                  ? "border-primary bg-white/95 dark:bg-dark/70 dark:border-primary scale-[1.02]"
                  : "border-light/60 dark:border-white/10 bg-white/90 dark:bg-dark/60 hover:border-primary/40"
              }`}
          >
            <div
              className={`flex h-16 w-16 items-center justify-center rounded-full
                ${
                  isEmpty
                    ? "bg-primary/10 text-primary"
                    : "bg-light dark:bg-dark text-text-secondary dark:text-white/70"
                }`}
            >
              <span className="material-symbols-outlined text-4xl">
                inventory_2
              </span>
            </div>
            <h3 className="text-xl font-bold text-dark dark:text-white">
              Solo garrafón
            </h3>
            <p className="text-sm sm:text-base text-text-secondary dark:text-white/70 max-w-xs">
              Compra los garrafones vacíos para usarlos más adelante.
            </p>
          </button>

          {/* Garrafón lleno */}
          <button
            type="button"
            onClick={() => setMode("filled")}
            className={`flex flex-col items-center justify-center gap-3 rounded-2xl px-6 py-8 text-center
                        shadow-md backdrop-blur-xl transition-all border
              ${
                isFilled
                  ? "border-primary bg-white/95 dark:bg-dark/70 dark:border-primary scale-[1.02]"
                  : "border-light/60 dark:border-white/10 bg-white/90 dark:bg-dark/60 hover:border-primary/40"
              }`}
          >
            <div
              className={`flex h-16 w-16 items-center justify-center rounded-full
                ${
                  isFilled
                    ? "bg-primary/10 text-primary"
                    : "bg-light dark:bg-dark text-text-secondary dark:text-white/70"
                }`}
            >
              <span className="material-symbols-outlined text-4xl">
                water_drop
              </span>
            </div>
            <h3 className="text-xl font-bold text-dark dark:text-white">
              Garrafón lleno
            </h3>
            <p className="text-sm sm:text-base text-text-secondary dark:text-white/70 max-w-xs">
              Te entregamos los garrafones ya llenos de agua Darmax.
            </p>
          </button>
        </div>

        {/* Footer botones */}
        <div className="flex flex-col-reverse sm:flex-row gap-4 justify-between items-center mt-4">
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
            Volver al paso anterior
          </button>

          <button
            type="button"
            onClick={handleContinue}
            disabled={!mode || totalJugs === 0}
            className="flex h-12 sm:h-14 w-full sm:w-auto items-center justify-center rounded-xl
                       bg-primary px-8 sm:px-10 text-base sm:text-lg font-semibold text-white
                       shadow-sm hover:bg-primary/90
                       focus-visible:outline focus-visible:outline-2 
                       focus-visible:outline-offset-2 focus-visible:outline-primary
                       transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Continuar
          </button>
        </div>
      </div>
    </OrderLayout>
  );
};

export default BuyJugsFillOptionStepTwo;
