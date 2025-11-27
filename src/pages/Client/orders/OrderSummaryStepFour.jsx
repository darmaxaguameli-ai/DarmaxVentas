// src/pages/cliente/orders/OrderSummaryStepFour.jsx
import { useLocation, useNavigate } from "react-router-dom";
import OrderLayout from "../../../layouts/OrderLayout";

const OrderSummaryStepFour = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Todo lo que venga de pasos anteriores
  const previousState = location.state || {};

  const fromStepOne = previousState.fromStepOne || [];
  const fromStepTwo = previousState.fromStepTwo || [];
  const maxJugs = previousState.maxJugs ?? 0;
  const deliveryMethod = previousState.deliveryMethod || "delivery";

  // Solo mostramos los que tengan cantidad > 0
  const garrafonesSeleccionados = fromStepOne.filter(
    (item) => item.quantity && item.quantity > 0
  );

  const tiposAguaAsignados = fromStepTwo.filter(
    (item) => item.quantity && item.quantity > 0
  );

  const totalGarrafones = garrafonesSeleccionados.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const deliveryLabels = {
    delivery: "Entrega a domicilio",
    pickup: "Recoger en sucursal",
    collect: "Recolección y entrega de garrafones",
  };

  const deliveryDescription = {
    delivery:
      "Un repartidor llevará tus garrafones a la dirección que nos indiques.",
    pickup: "Podrás pasar a la sucursal Darmax seleccionada para recoger tu pedido.",
    collect:
      "Recolectamos tus garrafones vacíos y luego te los entregamos ya rellenos.",
  };

  const handleBack = () => {
    navigate("/pedidos/rellenar/entrega", {
      state: previousState,
    });
  };

  const handleConfirm = () => {
    // Aquí luego conectarás con backend / pago / registro de pedido
    console.log("Confirmar pedido", {
      ...previousState,
      garrafonesSeleccionados,
      tiposAguaAsignados,
      totalGarrafones,
      deliveryMethod,
    });

    // Aquí podrías navegar a una pantalla de éxito, por ejemplo:
    // navigate("/cliente/pedidos/confirmado");
  };

  return (
    <OrderLayout
      title="Revisa tu pedido"
      subtitle="Confirma que los garrafones y el método de entrega sean correctos antes de finalizar."
      step={4}
      totalSteps={4}
    >
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mt-4">
        {/* Columna izquierda: detalle del pedido */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          {/* Card: Garrafones seleccionados */}
          <div className="rounded-2xl border border-light/60 dark:border-white/10 bg-white/95 dark:bg-dark/60 shadow-md backdrop-blur-xl">
            <h2 className="px-6 pt-5 pb-3 text-[20px] sm:text-[22px] font-bold tracking-[-0.02em] text-dark dark:text-white border-b border-light/60 dark:border-white/10">
              Tus garrafones
            </h2>

            {garrafonesSeleccionados.length === 0 ? (
              <p className="px-6 py-5 text-base text-text-secondary dark:text-white/70">
                No se encontraron garrafones seleccionados. Vuelve al paso 1
                para elegir tus garrafones.
              </p>
            ) : (
              <div className="flex flex-col divide-y divide-light/60 dark:divide-white/10">
                {garrafonesSeleccionados.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-4 px-6 py-4"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="size-16 rounded-xl bg-center bg-cover bg-no-repeat"
                        style={{ backgroundImage: `url("${item.imageUrl}")` }}
                        aria-label={item.name}
                      />
                      <div className="flex flex-col justify-center">
                        <p className="text-base sm:text-lg font-medium text-dark dark:text-white">
                          {item.name}
                        </p>
                        <p className="text-sm sm:text-base text-text-secondary dark:text-white/70">
                          Cantidad:{" "}
                          <span className="font-semibold">
                            {item.quantity}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card: Tipos de agua asignados (Paso 2) */}
          {tiposAguaAsignados.length > 0 && (
            <div className="rounded-2xl border border-light/60 dark:border-white/10 bg-white/95 dark:bg-dark/60 shadow-md backdrop-blur-xl">
              <h2 className="px-6 pt-5 pb-3 text-[20px] sm:text-[22px] font-bold tracking-[-0.02em] text-dark dark:text-white border-b border-light/60 dark:border-white/10">
                Tipos de agua asignados
              </h2>

              <div className="flex flex-col divide-y divide-light/60 dark:divide-white/10">
                {tiposAguaAsignados.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-4 px-6 py-4"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="size-16 rounded-xl bg-center bg-cover bg-no-repeat"
                        style={{ backgroundImage: `url("${item.imageUrl}")` }}
                        aria-label={item.name}
                      />
                      <div className="flex flex-col justify-center">
                        <p className="text-base sm:text-lg font-medium text-dark dark:text-white">
                          {item.name}
                        </p>
                        <p className="text-sm sm:text-base text-text-secondary dark:text-white/70">
                          Garrafones asignados:{" "}
                          <span className="font-semibold">
                            {item.quantity}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Columna derecha: resumen general y botones grandes */}
        <div className="lg:col-span-2">
          <div className="sticky top-10 rounded-2xl border border-light/60 dark:border-white/10 bg-white/95 dark:bg-dark/60 shadow-md backdrop-blur-xl p-6 flex flex-col gap-6">
            <h3 className="text-lg sm:text-xl font-bold text-dark dark:text-white">
              Resumen del pedido
            </h3>

            {/* Total de garrafones */}
            <div className="flex items-center justify-between">
              <p className="text-base sm:text-lg font-medium text-text-secondary dark:text-white/80">
                Total de garrafones
              </p>
              <p className="text-2xl sm:text-3xl font-extrabold text-primary">
                {totalGarrafones || 0}
              </p>
            </div>

            {/* Método de entrega */}
            <div className="mt-2 rounded-xl bg-light/60 dark:bg-dark/70 border border-light/60 dark:border-white/15 p-4 flex flex-col gap-2">
              <p className="text-sm font-semibold text-text-secondary dark:text-white/70 uppercase tracking-[0.08em]">
                Método de entrega
              </p>
              <p className="text-base sm:text-lg font-bold text-dark dark:text-white">
                {deliveryLabels[deliveryMethod] || "Entrega a domicilio"}
              </p>
              <p className="text-sm sm:text-base text-text-secondary dark:text-white/70">
                {deliveryDescription[deliveryMethod] ||
                  "Un repartidor llevará tus garrafones a la dirección que nos indiques."}
              </p>
            </div>

            {/* Botones grandes para adultos mayores */}
            <div className="flex flex-col gap-3 mt-2">
              <button
                type="button"
                onClick={handleConfirm}
                className="w-full rounded-xl bg-primary py-3.5 px-4 text-lg font-semibold text-white
                           hover:bg-primary/90 transition-colors
                           focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-dark"
              >
                Confirmar pedido
              </button>

              <button
                type="button"
                onClick={handleBack}
                className="w-full rounded-xl py-3.5 px-4 text-lg font-semibold text-primary
                           hover:bg-primary/10 transition-colors"
              >
                Volver al paso anterior
              </button>
            </div>

            {maxJugs > 0 && (
              <p className="mt-1 text-xs sm:text-sm text-text-secondary dark:text-white/60 text-center">
                Has seleccionado un total de{" "}
                <span className="font-semibold">{maxJugs}</span> garrafones en
                este pedido.
              </p>
            )}
          </div>
        </div>
      </div>
    </OrderLayout>
  );
};

export default OrderSummaryStepFour;
