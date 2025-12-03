// src/pages/cliente/orders/ClientDataConfirmation.jsx
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import OrderLayout from "../../../layouts/OrderLayout";

const ClientDataConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const previousState = location.state || {};
  const clientData = previousState.clientData;

  // Si alguien entra sin datos de cliente, lo regresamos al formulario
  useEffect(() => {
    if (!clientData) {
      navigate("/pedidos/rellenar/datos-cliente", { replace: true });
    }
  }, [clientData, navigate]);

  if (!clientData) return null;

  const handleGoToSummary = () => {
    navigate("/pedidos/rellenar/resumen", {
      state: {
        ...previousState,
        clientData,
        userHasProfile: true, // ✅ para que DeliveryMethodStepThree sepa que ya tiene datos
      },
    });
  };

  const handleEditData = () => {
    navigate("/pedidos/rellenar/datos-cliente", {
      state: {
        ...previousState,
        clientData,
      },
    });
  };

  return (
    <OrderLayout
      title="Tus datos han sido guardados"
      subtitle="Por favor anota tu nombre y tu ID de cliente. Te servirán para futuros pedidos."
      step={4}
      totalSteps={4}
    >
      <div className="flex flex-col gap-8 max-w-3xl mx-auto">
        {/* Bloque principal: tarjeta con el ID y el nombre */}
        <div
          className="
            rounded-2xl border border-light/60 dark:border-white/10
            bg-white/95 dark:bg-dark/60 shadow-lg backdrop-blur-xl
            p-6 sm:p-8 flex flex-col gap-6
          "
        >
          <p className="text-base sm:text-lg text-text-secondary dark:text-white/80">
            <span className="font-semibold text-dark dark:text-white">
              Importante:
            </span>{" "}
            guarda estos datos en un lugar seguro. Te los pediremos si haces
            pedidos por teléfono o en sucursal.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* ID de cliente */}
            <div className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-text-secondary dark:text-white/70 uppercase tracking-wide">
                ID de cliente
              </span>
              <div
                className="
                  rounded-xl bg-light/80 dark:bg-dark/70 border border-primary/50 
                  px-4 py-3 sm:px-5 sm:py-4
                  flex items-center justify-between gap-3
                "
              >
                <span className="text-2xl sm:text-3xl font-black text-primary">
                  {clientData.customId}
                </span>
                <span className="material-symbols-outlined text-primary text-2xl sm:text-3xl">
                  badge
                </span>
              </div>
              <p className="text-xs sm:text-sm text-text-secondary dark:text-white/70">
                Puedes decirle este ID al repartidor o al personal de sucursal
                para localizar tu información rápidamente.
              </p>
            </div>

            {/* Nombre del cliente */}
            <div className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-text-secondary dark:text-white/70 uppercase tracking-wide">
                Nombre registrado
              </span>
              <div
                className="
                  rounded-xl bg-light/80 dark:bg-dark/70 border border-light/60 dark:border-white/20 
                  px-4 py-3 sm:px-5 sm:py-4
                  flex items-center gap-3
                "
              >
                <span className="material-symbols-outlined text-primary text-2xl sm:text-3xl">
                  person
                </span>
                <span className="text-lg sm:text-xl font-semibold text-dark dark:text-white">
                  {clientData.name}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-text-secondary dark:text-white/70">
                Este es el nombre con el que aparecerán tus pedidos en el
                sistema Darmax.
              </p>
            </div>
          </div>

          {/* Recomendación grande para adultos mayores */}
          <div
            className="
              mt-4 rounded-xl bg-primary/5 border border-primary/40 
              px-4 py-3 sm:px-5 sm:py-4 flex items-start gap-3
            "
          >
            <span className="material-symbols-outlined text-primary text-2xl sm:text-3xl mt-0.5">
              edit_note
            </span>
            <p className="text-sm sm:text-base text-text-secondary dark:text-white/80 leading-relaxed">
              Te recomendamos{" "}
              <span className="font-semibold text-primary">
                anotar tu ID de cliente y tu nombre
              </span>{" "}
              en una hoja o libreta junto al teléfono de la purificadora, para
              que siempre los tengas a la mano.
            </p>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
          <button
            type="button"
            onClick={handleEditData}
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
            Corregir mis datos
          </button>

          <button
            type="button"
            onClick={handleGoToSummary}
            className="
              flex h-12 sm:h-14 w-full sm:w-auto items-center justify-center
              rounded-xl bg-primary px-8 sm:px-10
              text-base sm:text-lg font-semibold text-white
              shadow-sm hover:bg-primary/90
              focus-visible:outline focus-visible:outline-2 
              focus-visible:outline-offset-2 focus-visible:outline-primary
              transition-all
            "
          >
            Ir al resumen del pedido
          </button>
        </div>
      </div>
    </OrderLayout>
  );
};

export default ClientDataConfirmation;
