// src/pages/cliente/orders/RefillAssignStepTwo.jsx
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import OrderLayout from "../../../layouts/OrderLayout";

const RefillAssignStepTwo = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Total de garrafones seleccionado en el Paso 1
  const maxJugs = location.state?.maxJugs ?? 0;

  const [products, setProducts] = useState(() => [
    {
      id: "premium",
      name: "Agua Premium",
      quantity: 0,
      featured: true,
      imageUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBTRVNohQGHFBIoOVWt09upHMGaDfTjggm9hSZDZPpoIbyFDFwj8Hwls4Bu4Jt0z-I0zlD6rGZuPgFLNAZX_Rp10k7zaOAypOsW0YOx_aesQnxkEq6DyYkUB5CqS1F8a0z5pWE-ypqbtAbNM4Np_GKvHyzEtrjSMe4ix1h8yb-_q3_VmnKyvOOesbq73drHVvURX_RHYCYf5ACdbYjuozn8Qyipi7Of1l4PSlDVfO-NTsy-yTMjkF1gUb1ftXcHZnI_9dpqii7PCB0",
    },
    {
      id: "alcalina",
      name: "Agua Alcalina",
      quantity: 0,
      imageUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCVAie7BW96pA3Uratok-bSvGNFyqMOvaD3APx6cd8xZ4gbAiKHwbj7OimlIFUfUY-yOlbED284bp8Em0poa_sRIiWRAMMIQsEtqf4IllyH8lgKTL07MSxMN2QsoOogm_La93aEuHIKTuWudeIdNnPnLswoM7XL8ZZU6pkQOe_KMsWu3YOE6-2AfmzMG29kIrMfwHqyL2qUq3yrN71jY4oTWAgIUeUS5R6Aze3mTjF_P7ACkzk9xSWGq7H0W1_VDZHpc5-icAGyIEo",
    },
  ]);

  const totalAssigned = products.reduce((sum, p) => sum + p.quantity, 0);
  const remaining = Math.max(0, maxJugs - totalAssigned);

  const changeQuantity = (id, delta) => {
    setProducts((prev) => {
      const totalBefore = prev.reduce((s, p) => s + p.quantity, 0);

      return prev.map((p) => {
        if (p.id !== id) return p;

        const newQty = p.quantity + delta;
        if (newQty < 0) return p; // no negativos

        const newTotal = totalBefore + delta;
        if (newTotal < 0 || newTotal > maxJugs) return p; // respetar límite del paso 1

        return { ...p, quantity: newQty };
      });
    });
  };

  const handleBack = () => {
    navigate("/pedidos/rellenar"); // Paso 1
  };

  const handleContinue = () => {
    console.log("Asignación final:", products);
    navigate("/pedidos/rellenar/entrega", {
      state: {
        fromStepTwo: products,
        maxJugs,
      },
    });
  };

  return (
    <OrderLayout
      title="Asigna tus garrafones"
      subtitle="Distribuye tu total de garrafones entre los tipos de agua disponibles."
      step={2}
      totalSteps={4}
    >
      {/* Bloque de resumen total */}
      <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
        <div className="flex min-w-[240px] flex-col gap-2">
          <p className="text-base sm:text-lg text-text-secondary dark:text-white/80">
            Ajusta cuántos garrafones quieres de cada tipo de agua.
          </p>
          {maxJugs > 0 && (
            <p className="text-sm sm:text-base text-text-secondary dark:text-white/70">
              Tienes{" "}
              <span className="font-bold text-primary">{maxJugs}</span>{" "}
              garrafones en total.
              {remaining > 0 && (
                <>
                  {" "}
                  Te faltan{" "}
                  <span className="font-bold text-primary">
                    {remaining}
                  </span>{" "}
                  por asignar.
                </>
              )}
            </p>
          )}
        </div>

        <div className="flex flex-col items-start sm:items-end gap-1">
          <p className="text-sm sm:text-base font-medium text-text-secondary dark:text-white/80">
            Total asignado
          </p>
          <p className="text-3xl sm:text-4xl font-black">
            <span className="text-primary">{totalAssigned}</span>
            <span className="text-text-secondary dark:text-white/60 text-xl sm:text-2xl">
              {" "}
              / {maxJugs}
            </span>
          </p>
        </div>
      </div>

      {/* Nota de ayuda para adultos mayores */}
      <p className="mb-4 text-sm sm:text-base text-text-secondary dark:text-white/75">
        <span className="font-semibold text-dark dark:text-white">
          Tip:
        </span>{" "}
        toca la tarjeta del tipo de agua o usa los botones{" "}
        <strong>+</strong> y <strong>–</strong> para aumentar o disminuir.
      </p>

      {/* Grid de tipos de agua – optimizado y clickeable */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 max-w-3xl mx-auto">
        {products.map((product) => {
          const handleCardClick = () => changeQuantity(product.id, 1);

          const handleMinus = (e) => {
            e.stopPropagation();
            changeQuantity(product.id, -1);
          };

          const handlePlus = (e) => {
            e.stopPropagation();
            changeQuantity(product.id, 1);
          };

          return (
            <div
              key={product.id}
              onClick={handleCardClick}
              className={`flex flex-col gap-4 rounded-2xl cursor-pointer select-none
                          border bg-white/95 dark:bg-dark/60 
                          shadow-md backdrop-blur-xl transition-all
              ${
                product.featured
                  ? "border-primary/80 dark:border-primary shadow-lg"
                  : "border-light/60 dark:border-white/10 hover:border-primary/50"
              }`}
            >
              <div
                className="w-full rounded-t-2xl aspect-[4/3] sm:aspect-[3/2] bg-white
                           bg-center bg-no-repeat bg-contain"
                style={{ backgroundImage: `url("${product.imageUrl}")` }}
                aria-label={product.name}
              />
              <div className="px-4 pb-4 pt-1 flex flex-col gap-4">
                <p className="text-lg sm:text-xl font-semibold text-dark dark:text-white leading-snug">
                  {product.name}
                </p>
                <div className="flex items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={handleMinus}
                    className="flex h-11 w-11 items-center justify-center rounded-full
                               bg-light dark:bg-dark text-text-secondary dark:text-white/80
                               hover:bg-light/80 dark:hover:bg-dark/80 transition-colors"
                  >
                    <span className="material-symbols-outlined text-2xl">
                      remove
                    </span>
                  </button>
                  <span className="text-2xl font-black text-dark dark:text-white">
                    {product.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={handlePlus}
                    className="flex h-11 w-11 items-center justify-center rounded-full
                               bg-light dark:bg-dark text-text-secondary dark:text-white/80
                               hover:bg-light/80 dark:hover:bg-dark/80 transition-colors"
                  >
                    <span className="material-symbols-outlined text-2xl">
                      add
                    </span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer dentro del layout */}
      <footer className="mt-auto pt-2">
        <div className="flex flex-col-reverse sm:flex-row gap-4 justify-between items-center">
          <button
            type="button"
            onClick={handleBack}
            className="
              flex h-12 sm:h-14 w-full sm:w-auto items-center justify-center
              rounded-lg border border-slate-300
              bg-slate-100 text-dark 
              dark:bg-slate-800 dark:text-white dark:border-slate-600
              text-base sm:text-lg font-semibold
              px-6 sm:px-8                 /* <-- AGREGA ESTO */
              hover:bg-slate-200 dark:hover:bg-slate-700
              transition-all
            "
          >
            Volver al paso 1
          </button>


          <button
            type="button"
            onClick={handleContinue}
            className="flex h-12 sm:h-14 w-full sm:w-auto items-center justify-center rounded-xl
                       bg-primary px-8 sm:px-10 text-base sm:text-lg font-semibold text-white
                       shadow-sm hover:bg-primary/90
                       focus-visible:outline focus-visible:outline-2 
                       focus-visible:outline-offset-2 focus-visible:outline-primary
                       transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={totalAssigned !== maxJugs || maxJugs === 0}
          >
            Continuar al paso 3
          </button>
        </div>
      </footer>
    </OrderLayout>
  );
};

export default RefillAssignStepTwo;
