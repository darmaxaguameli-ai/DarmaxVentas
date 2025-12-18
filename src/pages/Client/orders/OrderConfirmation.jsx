// src/pages/Client/orders/OrderConfirmation.jsx
import { useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import ClientOrderHeader from '../../../components/ClientOrderHeader';
import { useAuth } from '../../../context/AuthContext';

const OrderConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const orderId = location.state?.orderId;
  const clientData = location.state?.clientData;
  const orderType = location.state?.orderType || 'refill';

  const isFullAuth = isAuthenticated;
  const isSemiAuth = !isAuthenticated && !!clientData;
  const isGuest = !isAuthenticated && !clientData;

  useEffect(() => {
    // Redirección automática solo para invitados puros
    if (isGuest) {
      const timer = setTimeout(() => {
        navigate('/pedidos');
      }, 60000); // 60 segundos

      return () => clearTimeout(timer); // Limpia el temporizador si el componente se desmonta
    }
  }, [isGuest, navigate]);

  const registrationUrl = `${window.location.origin}/registro`;

  return (
    <div className="font-display relative flex min-h-screen w-full flex-col bg-light dark:bg-dark text-dark dark:text-white overflow-x-hidden select-none">
      <div className="flex flex-1 justify-center px-4 sm:px-6 lg:px-12 py-8">
        <div className="flex w-full max-w-2xl flex-col items-center gap-6 text-center sm:gap-10">
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
              {isRefill(orderType) 
                ? "Hemos recibido tu solicitud de recarga y la estamos procesando. El personal de mostrador se encargará."
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
            
            <div className="mt-10 flex w-full flex-col items-center gap-4">
              {isFullAuth ? (
                // --- Vista para usuario autenticado ---
                <div className="flex w-full flex-col items-center gap-4 sm:flex-row">
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
              ) : isSemiAuth ? (
                // --- Vista para usuario semi-autenticado ---
                <>
                  <div className="w-full rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-6 text-center">
                    <p className="text-lg font-bold text-dark dark:text-white">¡Completa tu registro!</p>
                    <p className="mt-2 text-sm text-text-secondary dark:text-white/70">
                      Escanea el código QR o visita <strong>{registrationUrl}</strong> en tu celular para crear una contraseña y ver tu historial de pedidos.
                    </p>
                    <div className="mt-4 flex justify-center bg-white p-3 rounded-lg w-min mx-auto">
                      <QRCodeSVG value={registrationUrl} size={128} />
                    </div>
                    <p className="mt-4 text-xs text-text-secondary dark:text-white/60">
                      Tu ID de Cliente es: <strong className='text-primary'>{clientData.customId}</strong>. Puedes usarlo para registrarte.
                    </p>
                  </div>
                   <Link 
                        to="/pedidos"
                        className="flex h-14 w-full items-center justify-center rounded-xl bg-primary px-8 text-lg font-semibold text-white shadow-sm hover:bg-primary/90 transition-all"
                    >
                        Hacer otro pedido
                    </Link>
                </>
              ) : (
                // --- Vista para invitado puro ---
                 <Link 
                    to="/pedidos"
                    className="flex h-14 w-full items-center justify-center rounded-xl bg-primary px-8 text-lg font-semibold text-white shadow-sm hover:bg-primary/90 transition-all"
                >
                    Hacer otro pedido
                </Link>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

// Pequeño helper para determinar si es recarga.
const isRefill = (type) => type === 'refill';

export default OrderConfirmation;
