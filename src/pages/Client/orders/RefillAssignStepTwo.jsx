// src/pages/cliente/orders/RefillAssignStepTwo.jsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import OrderLayout from "../../../layouts/OrderLayout";
import '../../../animations.css'; // Import the new animations

const RefillAssignStepTwo = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const maxJugs = location.state?.maxJugs ?? 0;

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWaterTypes = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get('/api/water-types');
        const formattedProducts = response.data.map((wt, index) => ({
          id: wt.id,
          name: `Agua ${wt.name}`,
          quantity: 0,
          featured: wt.name === 'Premium', // Make Premium featured
        }));
        setProducts(formattedProducts);
      } catch (err) {
        console.error("Error fetching water types:", err);
        setError("No se pudieron cargar los tipos de agua. Por favor, intenta de nuevo.");
      } finally {
        setLoading(false);
      }
    };
    fetchWaterTypes();
  }, []);

  const totalAssigned = products.reduce((sum, p) => sum + p.quantity, 0);
  const remaining = Math.max(0, maxJugs - totalAssigned);

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
    navigate("/pedidos/rellenar"); // Paso 1
  };
  
  const handleContinue = () => {
    navigate("/pedidos/rellenar/entrega", {
      state: {
        ...location.state, // Pass previous state along
        fromStepTwo: products.filter(p => p.quantity > 0),
        maxJugs,
      },
    });
  };

  const renderContent = () => {
    if (loading) {
      return <div className="text-center py-10">Cargando tipos de agua...</div>;
    }

    if (error) {
      return <div className="text-center py-10 text-red-500">{error}</div>;
    }
    
    return (
      <>
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
                className={`flex flex-col rounded-2xl cursor-pointer select-none
                            border bg-white/95 dark:bg-dark/60 
                            shadow-md backdrop-blur-xl transition-all
                ${
                  product.featured
                    ? "border-primary/80 dark:border-primary shadow-lg"
                    : "border-light/60 dark:border-white/10 hover:border-primary/50"
                }`}
              >
                <div className="wave-container">
                  <div className="wave"></div>
                  <div className="wave two"></div>
                </div>

                <div className="px-4 pb-4 pt-4 flex flex-col gap-4 justify-center items-center">
                  <p className="text-xl sm:text-2xl font-bold text-dark dark:text-white text-center">
                    {product.name}
                  </p>
                  <div className="flex items-center justify-between gap-4 w-full max-w-[150px]">
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
      </>
    );
  };

  return (
    <OrderLayout
      title="Asigna tus garrafones"
      subtitle="Distribuye tu total de garrafones entre los tipos de agua disponibles."
      step={2}
      totalSteps={4}
    >
      <div className="flex flex-col gap-6">
        {renderContent()}
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
              px-6 sm:px-8
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
