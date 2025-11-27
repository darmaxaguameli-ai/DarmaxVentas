// src/pages/cliente/orders/OrderSummaryStepFour.jsx
import { useLocation, useNavigate } from "react-router-dom";
import OrderLayout from "../../../layouts/OrderLayout";

const OrderSummaryStepFour = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Todo lo que venga de pasos anteriores
  const previousState = location.state || {};

  // Permite distinguir entre flujos:
  // - "refill"  -> rellenar garrafones (flujo actual)
  // - "buy"     -> comprar garrafones (flujo futuro)
  const mode = previousState.mode || "refill";

  const fromStepOne = previousState.fromStepOne || []; // garrafones seleccionados (refill)
  const fromStepTwo = previousState.fromStepTwo || []; // tipos de agua asignados (refill)
  const maxJugs = previousState.maxJugs ?? 0;
  const deliveryMethod = previousState.deliveryMethod || "delivery";

  // Para el flujo "buy" podemos enviar directamente un arreglo de items:
  // previousState.orderItems = [{ id, name, quantity, imageUrl, description }]
  const orderItemsFromState = Array.isArray(previousState.orderItems)
    ? previousState.orderItems
    : [];

  // ---- LÓGICA PARA FLUJO REFILL (ACTUAL) ----
  const garrafonesSeleccionados = fromStepOne.filter(
    (item) => item.quantity && item.quantity > 0
  );

  const tiposAguaAsignados = fromStepTwo.filter(
    (item) => item.quantity && item.quantity > 0
  );

  const totalGarrafonesRefill = garrafonesSeleccionados.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  // ---- UNIFICACIÓN DE ITEMS QUE SE MOSTRARÁN ----
  // Si viene orderItems (modo compra), usamos eso.
  // Si no, usamos los garrafones del refill.
  let mainItems = [];

  if (orderItemsFromState.length > 0) {
    // Flujo "buy"
    mainItems = orderItemsFromState;
  } else {
    // Flujo "refill"
    mainItems = garrafonesSeleccionados.map((item) => ({
      ...item,
      description: `Cantidad: ${item.quantity}`,
    }));
  }

  // Total de unidades (garrafones/piezas)
  const totalUnits =
    mainItems.reduce((sum, item) => sum + (item.quantity || 0), 0) ||
    totalGarrafonesRefill ||
    maxJugs ||
    0;

  // Textos para método de entrega (usando las claves acordadas)
  const deliveryLabels = {
    delivery: "Entrega a domicilio",
    home_collection: "Recolección a domicilio",
    pickup: "Recoger en sucursal",
  };

  const deliveryDescription = {
    delivery:
      "Un repartidor llevará tus garrafones a la dirección que nos indiques.",
    home_collection:
      "Pasamos a tu domicilio por los garrafones vacíos y luego te los entregamos llenos.",
    pickup:
      "Podrás pasar a la sucursal Darmax seleccionada para recoger tu pedido.",
  };

  const handleBack = () => {
    // Puedes sobreescribir este backPath desde pasos anteriores si quieres reutilizar
    // esta pantalla para otros flujos (ej: compra de garrafones)
    const backPath =
      previousState.backPath || "/pedidos/rellenar/entrega";

    navigate(backPath, {
      state: previousState,
    });
  };

  const handleConfirm = () => {
    // Aquí luego conectarás con backend / pago / registro de pedido
    console.log("Confirmar pedido", {
      ...previousState,
      mode,
      mainItems,
      tiposAguaAsignados,
      totalUnits,
      deliveryMethod,
    });

    // Ejemplo futuro:
    // navigate("/cliente/pedidos/confirmado", { state: { orderId: "ABC123" } });
  };

  const isRefill = mode === "refill";

  return (
    <OrderLayout
      title={
        isRefill
          ? "Revisa tu pedido de recarga"
          : "Revisa tu compra de garrafones"
      }
      subtitle="Confirma que los productos y el método de entrega sean correctos antes de finalizar."
      step={4}
      totalSteps={4}
    >
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mt-4">
        {/* Columna izquierda: detalle del pedido */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          {/* Card: Productos / Garrafones seleccionados */}
          <div className="rounded-2xl border border-light/60 dark:border-white/10 bg-white/95 dark:bg-dark/60 shadow-md backdrop-blur-xl">
            <h2 className="px-6 pt-5 pb-3 text-[20px] sm:text-[22px] font-bold tracking-[-0.02em] text-dark dark:text-white border-b border-light/60 dark:border-white/10">
              {isRefill ? "Tus garrafones" : "Tus productos"}
            </h2>

            {mainItems.length === 0 ? (
              <p className="px-6 py-5 text-base text-text-secondary dark:text-white/70">
                No se encontraron productos seleccionados. Vuelve al paso
                anterior para elegirlos.
              </p>
            ) : (
              <div className="flex flex-col divide-y divide-light/60 dark:divide-white/10">
                {mainItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-4 px-6 py-4"
                  >
                    <div className="flex items-center gap-4">
                      {item.imageUrl && (
                        <div
                          className="size-16 rounded-xl bg-center bg-cover bg-no-repeat"
                          style={{ backgroundImage: `url("${item.imageUrl}")` }}
                          aria-label={item.name}
                        />
                      )}
                      <div className="flex flex-col justify-center">
                        <p className="text-base sm:text-lg font-medium text-dark dark:text-white">
                          {item.name}
                        </p>
                        {item.description && (
                          <p className="text-sm sm:text-base text-text-secondary dark:text-white/70">
                            {item.description}
                          </p>
                        )}
                        {item.quantity != null && !item.description && (
                          <p className="text-sm sm:text-base text-text-secondary dark:text-white/70">
                            Cantidad:{" "}
                            <span className="font-semibold">
                              {item.quantity}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card: Tipos de agua asignados (solo aplica para refill y si hay datos) */}
          {isRefill && tiposAguaAsignados.length > 0 && (
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
                      {item.imageUrl && (
                        <div
                          className="size-16 rounded-xl bg-center bg-cover bg-no-repeat"
                          style={{ backgroundImage: `url("${item.imageUrl}")` }}
                          aria-label={item.name}
                        />
                      )}
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

            {/* Total de unidades */}
            <div className="flex items-center justify-between">
              <p className="text-base sm:text-lg font-medium text-text-secondary dark:text-white/80">
                {isRefill ? "Total de garrafones" : "Total de piezas"}
              </p>
              <p className="text-2xl sm:text-3xl font-extrabold text-primary">
                {totalUnits || 0}
              </p>
            </div>

            {/* Método de entrega */}
            <div className="mt-2 rounded-xl bg-light/60 dark:bg-dark/70 border border-light/60 dark:border-white/15 p-4 flex flex-col gap-2">
              <p className="text-xs sm:text-sm font-semibold text-text-secondary dark:text-white/70 uppercase tracking-[0.08em]">
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

            {maxJugs > 0 && isRefill && (
              <p className="mt-1 text-xs sm:text-sm text-text-secondary dark:text-white/60 text-center">
                Seleccionaste un total de{" "}
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
