// src/pages/cliente/orders/OrderSummaryStepFour.jsx
import { useLocation, useNavigate } from "react-router-dom";
import OrderLayout from "../../../layouts/OrderLayout";

const OrderSummaryStepFour = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Aquí llega todo lo que mandaste desde los pasos anteriores (si ya lo envías)
  const previousState = location.state || {};

  // TODO: luego esto lo armaremos dinámico desde state
  const orderItems = [
    {
      id: 1,
      name: "Garrafón 20L - Agua Purificada",
      description: "Cantidad: 2",
      price: 50.0,
      imageUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDcm6i_HvVwpqDEBQLFyiTCMTrbq9ggnh7ehVXS2n7SazlEKPz6a83e-Sxrg0kvcVq_4nTfi2yWSwUpN2-PA3vzOxNVSBjti6prZsKCl2J7kYj3GlT1l53Ul8eo23n8OUV-y7aSYMqM3gG1qIGhqsAVHhWU99WzlJl-k_uxZ9ZenIiorVC0v0QS_gXmZwdQYUQltMyYiTjdC9APRRWXmJLY_xi-kJciJfskvUeW_EPzXB5boatc-URhdIPGwq3kl0tpbjAF8s5_zzA",
    },
    {
      id: 2,
      name: "Garrafón 10L - Agua Alcalina",
      description: "Cantidad: 1",
      price: 35.0,
      imageUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBTIIPHc8rSOQzSzXwtaj0zyLvBMQ3WYQomgbRtL2j2QtvjYyARKq5mSWJIGE2Wc3QB0RIAspUEj60jnuX410473nZW9gN_--xF51L-zSeuj1ieQhe7tX4jRxQG80baK_5P4ehvD-mOZkLzra6si8w-7UGKI5JC-B2oLyasvemvi0XaqhWZ8bmWqhYpN8pXXCZ4PbXo5S1G-0aC7rxLYCEy0dUB60w-JwbzZpE0Xdy-qDwWJ34e74bpzvkhmerfPMmxZDlkT7Os-T4",
    },
  ];

  const subtotal = orderItems.reduce((sum, item) => sum + item.price, 0);
  const shipping = 0;
  const total = subtotal + shipping;

  const handleBack = () => {
    navigate("/pedidos/rellenar/entrega", {
      state: previousState,
    });
  };

  const handleConfirm = () => {
    // Aquí luego conectarás con backend / pago
    console.log("Confirmar pedido", {
      ...previousState,
      orderItems,
      subtotal,
      shipping,
      total,
    });
    // Después puedes navegar a una pantalla de éxito
    // navigate("/cliente/pedidos/confirmado");
  };

  return (
    <OrderLayout
      title="Revisa tu pedido"
      subtitle="Confirma los detalles de tu pedido y el método de pago antes de finalizar."
      step={4}
      totalSteps={4}
    >
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mt-4">
        {/* Columna izquierda: pedido + método de pago */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          {/* Card: Tu pedido */}
          <div className="rounded-2xl border border-light/60 dark:border-white/10 bg-white/95 dark:bg-dark/60 shadow-md backdrop-blur-xl">
            <h2 className="px-6 pt-5 pb-3 text-[20px] font-bold tracking-[-0.02em] text-dark dark:text-white border-b border-light/60 dark:border-white/10">
              Tu pedido
            </h2>

            <div className="flex flex-col divide-y divide-light/60 dark:divide-white/10">
              {orderItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 px-6 py-4"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="size-14 rounded-lg bg-center bg-cover bg-no-repeat"
                      style={{ backgroundImage: `url("${item.imageUrl}")` }}
                      aria-label={item.name}
                    />
                    <div className="flex flex-col justify-center">
                      <p className="text-base font-medium text-dark dark:text-white line-clamp-1">
                        {item.name}
                      </p>
                      <p className="text-sm text-text-secondary dark:text-white/70 line-clamp-2">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <p className="text-base font-semibold text-dark dark:text-white">
                      ${item.price.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card: Método de pago (visual por ahora) */}
          <div className="rounded-2xl border border-light/60 dark:border-white/10 bg-white/95 dark:bg-dark/60 shadow-md backdrop-blur-xl">
            <h2 className="px-6 pt-5 pb-3 text-[20px] font-bold tracking-[-0.02em] text-dark dark:text-white">
              Elige tu método de pago
            </h2>

            <div className="p-6 flex flex-col sm:flex-row gap-4">
              {/* Efectivo seleccionado (visual) */}
              <button
                type="button"
                className="flex-1 p-4 rounded-xl border-2 border-primary bg-primary/10 dark:bg-primary/20 text-left flex items-center gap-4"
              >
                <span className="material-symbols-outlined text-primary text-3xl">
                  payments
                </span>
                <div className="flex flex-col">
                  <span className="font-semibold text-dark dark:text-white">
                    Efectivo
                  </span>
                  <span className="text-sm text-text-secondary dark:text-white/70">
                    Pagar al entregar o en mostrador.
                  </span>
                </div>
              </button>

              {/* Tarjeta (no seleccionado visualmente) */}
              <button
                type="button"
                className="flex-1 p-4 rounded-xl border border-light/60 dark:border-white/15 text-left flex items-center gap-4 hover:border-primary/60 transition-colors"
              >
                <span className="material-symbols-outlined text-text-secondary dark:text-white/60 text-3xl">
                  credit_card
                </span>
                <div className="flex flex-col">
                  <span className="font-semibold text-dark dark:text-white">
                    Tarjeta
                  </span>
                  <span className="text-sm text-text-secondary dark:text-white/70">
                    Crédito o débito (próximamente).
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Columna derecha: resumen y acciones */}
        <div className="lg:col-span-2">
          <div className="sticky top-10 rounded-2xl border border-light/60 dark:border-white/10 bg-white/95 dark:bg-dark/60 shadow-md backdrop-blur-xl p-6 flex flex-col gap-6">
            <h3 className="text-lg font-bold text-dark dark:text-white">
              Resumen de compra
            </h3>

            <div className="space-y-3 border-b border-light/60 dark:border-white/10 pb-4">
              <div className="flex justify-between gap-x-6">
                <p className="text-sm text-text-secondary dark:text-white/70">
                  Subtotal
                </p>
                <p className="text-sm font-medium text-dark dark:text-white">
                  ${subtotal.toFixed(2)}
                </p>
              </div>
              <div className="flex justify-between gap-x-6">
                <p className="text-sm text-text-secondary dark:text-white/70">
                  Envío
                </p>
                <p className="text-sm font-medium text-dark dark:text-white">
                  {shipping === 0 ? "Gratis" : `$${shipping.toFixed(2)}`}
                </p>
              </div>
            </div>

            <div className="flex justify-between gap-x-6 py-2">
              <p className="text-base font-bold text-text-secondary dark:text-white/80">
                Total a pagar
              </p>
              <p className="text-2xl font-bold text-dark dark:text-white">
                ${total.toFixed(2)}
              </p>
            </div>

            <div className="flex flex-col gap-3 mt-2">
              <button
                type="button"
                onClick={handleConfirm}
                className="w-full rounded-lg bg-primary py-3 px-4 text-base font-semibold text-white
                           hover:bg-primary/90 transition-colors
                           focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-dark"
              >
                Confirmar pedido
              </button>

              <button
                type="button"
                onClick={handleBack}
                className="w-full rounded-lg py-3 px-4 text-base font-semibold text-primary
                           hover:bg-primary/10 transition-colors"
              >
                Volver al paso anterior
              </button>
            </div>
          </div>
        </div>
      </div>
    </OrderLayout>
  );
};

export default OrderSummaryStepFour;
