// src/pages/cliente/orders/BuyJugsAssignWaterStepThree.jsx
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import OrderLayout from "../../../layouts/OrderLayout";

// Helper to map water type names to images
const waterTypeImageMap = {
  'Premium': 'https://lh3.googleusercontent.com/aida-public/AB6AXuBTRVNohQGHFBIoOVWt09upHMGaDfTjggm9hSZDZPpoIbyFDFwj8Hwls4Bu4Bu4Jt0z-I0zlD6rGZuPgFLNAZX_Rp10k7zaOAypOsW0YOx_aesQnxkEq6DyYkUB5CqS1F8a0z5pWE-ypqbtAbNM4Np_GKvHyzEtrjSMe4ix1h8yb-_q3_VmnKyvOOesbq73drHVvURX_RHYCYf5ACdbYjuozn8Qyipi7Of1l4PSlDVfO-NTsy-yTMjkF1gUb1ftXcHZnI_9dpqii7PCB0',
  'Alcalina': 'https://lh3.googleusercontent.com/aida-public/AB6AXuCVAie7BW96pA3Uratok-bSvGNFyqMOvaD3APx6cd8xZ4gbAiKHwbj7OimlIFUfUY-yOlbED284bp8Em0poa_sRIiWRAMMIQsEtqf4IllyH8lgKTL07MSxMN2QsoOogm_La93aEuHIKTuWudeIdNnPnLswoM7XL8ZZU6pkQOe_KMsWu3YOE6-2AfmzMG29kIrMfwHqyL2qUq3yrN71jY4oTWAgIUeUS5R6Aze3mTjF_P7ACkzk9xSWGq7H0W1_VDZHpc5-icAGyIEo',
};

const getImageUrlForWaterType = (waterTypeName) => {
  return waterTypeImageMap[waterTypeName] || '/img/default-water-type.png';
};

const BuyJugsAssignWaterStepThree = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const previousState = location.state || {};
  const maxJugs = previousState?.fromBuyStepOne?.totalJugs ?? previousState?.maxJugs ?? 0;
  const servicePrices = previousState?.buyFlow?.servicePrices || [];

  // Helper to find price for water type
  const getWaterPrice = (waterTypeId) => {
    if (!servicePrices.length) return 0;
    // Try to find a 'Recarga' or similar service for this water type, defaulting to 'Domicilio' if possible
    // This logic might need adjustment based on your specific ServicePrice naming conventions
    const priceObj = servicePrices.find(sp => 
      sp.waterTypeId === waterTypeId && 
      (sp.name.toLowerCase().includes('recarga') || sp.name.toLowerCase().includes('llenado'))
    ) || servicePrices.find(sp => sp.waterTypeId === waterTypeId); // Fallback to any price for this type

    return priceObj ? priceObj.price : 0;
  };

  // Initialize products from waterTypes passed via navigation state
  const initialWaterTypes = previousState?.buyFlow?.availableWaterTypes?.map(wt => ({
    id: wt.id,
    name: `Agua ${wt.name}`,
    quantity: 0,
    featured: wt.name === 'Premium', // Example: make Premium featured
    imageUrl: getImageUrlForWaterType(wt.name),
    price: getWaterPrice(wt.id) // Add calculated price
  })) || [];

  const [products, setProducts] = useState(initialWaterTypes);

  // If no water types are loaded, navigate back
  useEffect(() => {
    if (initialWaterTypes.length === 0) {
      console.warn("No water types found in state, navigating back.");
      navigate("/pedidos/comprar/opcion-llenado", { replace: true, state: previousState });
    }
  }, [initialWaterTypes.length, navigate, previousState]);

  const totalAssigned = products.reduce((sum, p) => sum + p.quantity, 0);

  const changeQuantity = (id, delta) => {
    setProducts((prev) => {
      const totalBefore = prev.reduce((s, p) => s + p.quantity, 0);

      return prev.map((p) => {
        if (p.id !== id) return p;

        const newQty = p.quantity + delta;
        if (newQty < 0) return p;

        const newTotal = totalBefore + delta;
        if (newTotal < 0 || newTotal > maxJugs) return p;

        return { ...p, quantity: newQty };
      });
    });
  };

  const handleBack = () => {
    navigate("/pedidos/comprar/opcion-llenado", {
      state: {
        ...previousState,
      },
    });
  };

  const handleContinue = () => {
    navigate("/pedidos/comprar/resumen", {
      state: {
        ...previousState,
        maxJugs,
        waterAssignment: products,
      },
    });
  };

    const handleGoToStart = () => {
      navigate('/pedidos');
    };
  
    return (
      <OrderLayout
        title="Asigna el agua a tus garrafones"
        subtitle="Distribuye tus garrafones entre Agua Premium y Agua Alcalina."
        step={3}
        totalSteps={4}
      >
        {/* Resumen total arriba */}
        <div className="flex flex-wrap justify-between items-end gap-4 mb-4">
          <div className="flex min-w-[240px] flex-col gap-2">
            <p className="text-base text-text-secondary dark:text-white/80">
              Ajusta cuántos garrafones quieres de cada tipo de agua.
            </p>
            {maxJugs > 0 && (
              <p className="text-sm text-text-secondary dark:text-white/70">
                Tienes{" "}
                <span className="font-semibold text-primary">{maxJugs}</span>{" "}
                garrafones seleccionados en el paso anterior.
              </p>
            )}
          </div>
          <div className="flex flex-col items-start sm:items-end gap-1">
            <p className="text-sm font-medium text-text-secondary dark:text-white/70">
              Total asignado
            </p>
            <p className="text-3xl font-bold">
              <span className="text-primary">{totalAssigned}</span>
              <span className="text-text-secondary dark:text-white/60 text-xl">
                {" "}
                / {maxJugs}
              </span>
            </p>
          </div>
        </div>
  
        {/* Grid de tipos de agua, accesible en tablet/celular/escritorio */}
        {products.length === 0 ? (
          <div className="text-center py-10 text-red-500">No hay tipos de agua disponibles para asignar.</div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-6 mb-6 max-w-3xl mx-auto">
            {products.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => changeQuantity(product.id, 1)} // tap en la card suma 1
                className={`flex flex-col gap-2 sm:gap-4 rounded-2xl 
                            border bg-white/95 dark:bg-dark/60 
                            shadow-md backdrop-blur-xl transition-all text-left
                ${
                  product.featured
                    ? "border-primary/70 dark:border-primary"
                    : "border-light/60 dark:border-white/10 hover:border-primary/40"
                }`}
              >
                <div
                  className="w-full bg-center bg-no-repeat bg-cover rounded-t-2xl aspect-[4/3] sm:aspect-[3/2]"
                  style={{ backgroundImage: `url("${product.imageUrl}")` }}
                  aria-label={product.name}
                />
                <div className="px-3 pb-3 pt-1 sm:px-4 sm:pb-4 flex flex-col gap-2 sm:gap-4 flex-grow">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                    <p className="text-sm sm:text-lg font-bold text-dark dark:text-white leading-tight">
                      {product.name}
                    </p>
                     {product.price > 0 && (
                        <span className="inline-block w-fit text-[10px] sm:text-sm font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-lg">
                          +${product.price}
                        </span>
                      )}
                  </div>
                  
                  <div className="flex items-center justify-between gap-2 sm:gap-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        changeQuantity(product.id, -1);
                      }}
                      className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full
                                 bg-light dark:bg-dark text-text-secondary dark:text-white/70
                                 hover:bg-light/80 dark:hover:bg-dark/80 transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg sm:text-xl">
                        remove
                      </span>
                    </button>
                    <span className="text-lg sm:text-2xl font-black text-dark dark:text-white tabular-nums">
                      {product.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        changeQuantity(product.id, 1);
                      }}
                      className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full
                                 bg-light dark:bg-dark text-text-secondary dark:text-white/70
                                 hover:bg-light/80 dark:hover:bg-dark/80 transition-colors"
                    >
                        <span className="material-symbols-outlined text-lg sm:text-xl">
                          add
                        </span>
                      </button>
                    </div>
                  </div>
                </button>
              ))}
            </div>
        )}
        
  
        {/* Footer dentro del layout */}
        <footer className="mt-auto pt-2">
          <div className="flex flex-col-reverse items-center gap-4 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={handleGoToStart}
              className="text-sm font-medium text-text-secondary dark:text-white/70 hover:text-primary dark:hover:text-primary transition-colors"
            >
              &larr; Volver al inicio
            </button>
            <div className="flex w-full flex-col-reverse gap-4 sm:w-auto sm:flex-row">
              <button
                type="button"
                onClick={handleBack}
                className="
                  flex h-12 w-full items-center justify-center rounded-lg border border-slate-300
                  bg-slate-100 px-6 text-base font-semibold
                  text-dark transition-all
                  hover:bg-slate-200 dark:border-slate-600 dark:bg-slate-800
                  dark:text-white dark:hover:bg-slate-700 sm:w-auto sm:px-8 sm:text-lg
                "
              >
                Volver al paso 2
              </button>
  
              <button
                type="button"
                onClick={handleContinue}
                disabled={totalAssigned !== maxJugs || maxJugs === 0}
                className="flex h-12 w-full items-center justify-center rounded-lg
                         bg-primary px-8 text-base font-semibold text-white
                         shadow-sm transition-all hover:bg-primary/90 focus-visible:outline
                         focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary
                         disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                Continuar al resumen
              </button>
            </div>
          </div>
        </footer>
      </OrderLayout>
    );
  };
  
  export default BuyJugsAssignWaterStepThree;
