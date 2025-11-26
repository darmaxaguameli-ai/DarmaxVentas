// src/pages/cliente/orders/DeliveryMethodStepThree.jsx
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import OrderLayout from "../../../layouts/OrderLayout";

const DeliveryMethodStepThree = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const previousState = location.state || {};

  // "delivery" | "home_collection" | "pickup"
  const [deliveryMethod, setDeliveryMethod] = useState("delivery");

  const handleBack = () => {
    navigate("/pedidos/rellenar/asignar", {
      state: {
        ...previousState,
        deliveryMethod,
      },
    });
  };

  const handleContinue = () => {
    if (!deliveryMethod) return;

    navigate("/pedidos/rellenar/resumen", {
      state: {
        ...previousState,
        deliveryMethod,
      },
    });
  };

  const isDelivery = deliveryMethod === "delivery";
  const isHomeCollection = deliveryMethod === "home_collection";
  const isPickup = deliveryMethod === "pickup";

  return (
    <OrderLayout
      title="Elige tu método de entrega"
      subtitle="Decide cómo quieres que manejemos tus garrafones."
      step={3}
      totalSteps={4}
    >
      {/* Tip para adultos mayores */}
      <p className="mt-2 mb-4 text-sm sm:text-base text-text-secondary dark:text-white/80">
        <span className="font-semibold text-dark dark:text-white">Tip:</span>{" "}
        toca una de las opciones para seleccionar cómo quieres recibir o
        entregar tus garrafones.
      </p>

      {/* 3 opciones: grid responsiva */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-2 mb-6 max-w-5xl mx-auto">
        {/* 1. Entrega a domicilio */}
        <button
          type="button"
          onClick={() => setDeliveryMethod("delivery")}
          aria-pressed={isDelivery}
          className={`flex flex-col items-center justify-center gap-4 rounded-2xl px-6 py-8 text-center
                      shadow-md backdrop-blur-xl transition-all border
            ${
              isDelivery
                ? "border-primary bg-white/95 dark:bg-dark/70 dark:border-primary scale-[1.02]"
                : "border-light/60 dark:border-white/10 bg-white/90 dark:bg-dark/60 hover:border-primary/40"
            }`}
        >
          <div
            className={`flex h-20 w-20 items-center justify-center rounded-full
              ${
                isDelivery
                  ? "bg-primary/10 text-primary"
                  : "bg-light dark:bg-dark text-text-secondary dark:text-white/70"
              }`}
          >
            <span className="material-symbols-outlined text-4xl sm:text-5xl">
              local_shipping
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-xl sm:text-2xl font-bold text-dark dark:text-white">
              Entrega a domicilio
            </h3>
            <p className="text-sm sm:text-base text-text-secondary dark:text-white/70 max-w-xs mx-auto">
              Llevamos tus garrafones llenos directamente a tu casa.
            </p>
          </div>
        </button>

        {/* 2. Recolección a domicilio */}
        <button
          type="button"
          onClick={() => setDeliveryMethod("home_collection")}
          aria-pressed={isHomeCollection}
          className={`flex flex-col items-center justify-center gap-4 rounded-2xl px-6 py-8 text-center
                      shadow-md backdrop-blur-xl transition-all border
            ${
              isHomeCollection
                ? "border-primary bg-white/95 dark:bg-dark/70 dark:border-primary scale-[1.02]"
                : "border-light/60 dark:border-white/10 bg-white/90 dark:bg-dark/60 hover:border-primary/40"
            }`}
        >
          <div
            className={`flex h-20 w-20 items-center justify-center rounded-full
              ${
                isHomeCollection
                  ? "bg-primary/10 text-primary"
                  : "bg-light dark:bg-dark text-text-secondary dark:text-white/70"
              }`}
          >
            <span className="material-symbols-outlined text-4xl sm:text-5xl">
              recycling
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-xl sm:text-2xl font-bold text-dark dark:text-white">
              Recolección a domicilio
            </h3>
            <p className="text-sm sm:text-base text-text-secondary dark:text-white/70 max-w-xs mx-auto">
              Pasamos a tu casa a recoger tus garrafones vacíos para recarga.
            </p>
          </div>
        </button>

        {/* 3. Recoger en sucursal */}
        <button
          type="button"
          onClick={() => setDeliveryMethod("pickup")}
          aria-pressed={isPickup}
          className={`flex flex-col items-center justify-center gap-4 rounded-2xl px-6 py-8 text-center
                      shadow-md backdrop-blur-xl transition-all border
            ${
              isPickup
                ? "border-primary bg-white/95 dark:bg-dark/70 dark:border-primary scale-[1.02]"
                : "border-light/60 dark:border-white/10 bg-white/90 dark:bg-dark/60 hover:border-primary/40"
            }`}
        >
          <div
            className={`flex h-20 w-20 items-center justify-center rounded-full
              ${
                isPickup
                  ? "bg-primary/10 text-primary"
                  : "bg-light dark:bg-dark text-text-secondary dark:text-white/70"
              }`}
          >
            <span className="material-symbols-outlined text-4xl sm:text-5xl">
              storefront
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-xl sm:text-2xl font-bold text-dark dark:text-white">
              Recoger en sucursal
            </h3>
            <p className="text-sm sm:text-base text-text-secondary dark:text-white/70 max-w-xs mx-auto">
              Lleva tus garrafones directamente a nuestra sucursal Darmax.
            </p>
          </div>
        </button>
      </div>

      {/* Footer dentro del layout */}
      <footer className="mt-auto pt-2">
        <div className="flex flex-col-reverse sm:flex-row gap-4 justify-between items-center">
          {/* Botón Volver */}
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
            Volver al paso 2
          </button>

          {/* Botón Continuar */}
          <button
            type="button"
            onClick={handleContinue}
            disabled={!deliveryMethod}
            className="flex h-12 sm:h-14 w-full sm:w-auto items-center justify-center rounded-xl
                       bg-primary px-8 sm:px-10 text-base sm:text-lg font-semibold text-white
                       shadow-sm hover:bg-primary/90
                       focus-visible:outline focus-visible:outline-2 
                       focus-visible:outline-offset-2 focus-visible:outline-primary
                       transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Continuar al resumen y pago
          </button>
        </div>
      </footer>
    </OrderLayout>
  );
};

export default DeliveryMethodStepThree;
