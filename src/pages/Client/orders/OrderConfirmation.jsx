// src/pages/Client/orders/OrderConfirmation.jsx
import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import OrderLayout from '../../../layouts/OrderLayout';
import ClientOrderHeader from '../../../components/ClientOrderHeader';

const OrderConfirmation = () => {
  const location = useLocation();
  const orderId = location.state?.orderId;
  const orderType = location.state?.orderType || 'refill';

  return (
    <div className="font-display relative flex min-h-screen w-full flex-col bg-light dark:bg-dark text-dark dark:text-white overflow-x-hidden select-none">
      <div className="flex flex-1 justify-center px-4 sm:px-6 lg:px-12 py-8">
        <div className="flex w-full max-w-2xl flex-col items-center gap-10 text-center">
          <ClientOrderHeader />
          
          <main className="w-full flex flex-col items-center mt-8">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400">
                <span className="material-symbols-outlined text-6xl">
                task_alt
                </span>
            </div>

            <h1 className="mt-6 text-3xl md:text-4xl font-black tracking-[-0.03em]">
              ¡Pedido confirmado!
            </h1>

            <p className="mt-3 max-w-xl text-text-secondary dark:text-white/80 text-base sm:text-lg">
              {isRefill 
                ? "Hemos recibido tu solicitud de recarga y la estamos procesando. Recibirás una notificación cuando tu pedido esté en camino."
                : "Gracias por tu compra. Hemos registrado tu pedido y lo prepararemos para la entrega."
              }
            </p>

            {orderId && (
              <div className="mt-8 rounded-2xl border border-primary/40 bg-primary/5 dark:bg-primary/15 px-8 py-4">
                <p className="text-base text-text-secondary dark:text-white/70">
                  Tu número de pedido es:
                </p>
                <p className="text-2xl font-bold text-primary tracking-wider">
                  {orderId}
                </p>
              </div>
            )}

            <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full">
                <Link 
                    to="/mis-pedidos"
                    className="flex h-14 w-full items-center justify-center rounded-xl bg-primary px-8 text-lg font-semibold text-white shadow-sm hover:bg-primary/90 transition-all"
                >
                    Ver mis pedidos
                </Link>
                <Link 
                    to="/pedidos"
                    className="flex h-14 w-full items-center justify-center rounded-xl border border-slate-300 bg-slate-100 text-dark dark:bg-slate-800 dark:text-white dark:border-slate-600 text-lg font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                    Hacer otro pedido
                </Link>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

// Pequeño helper para determinar si es recarga.
// En el futuro, esto podría ser más robusto si 'orderType' es más explícito.
const isRefill = (type) => type === 'refill';

export default OrderConfirmation;
