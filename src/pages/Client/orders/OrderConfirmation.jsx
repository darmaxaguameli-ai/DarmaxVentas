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
    <div className="font-display relative flex min-h-screen w-full flex-col bg-slate-50/50 dark:bg-[#0c1322] text-dark dark:text-white overflow-x-hidden select-none">
      {/* Ambient water glow background effects */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-emerald-400/20 dark:bg-emerald-500/15 blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute bottom-10 left-1/4 h-80 w-80 rounded-full bg-cyan-400/15 dark:bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="flex flex-1 justify-center px-4 pb-[130px] pt-[calc(1rem+env(safe-area-inset-top))] sm:p-6 md:p-8">
        <div className="flex h-full w-full max-w-2xl flex-col items-center justify-between text-center gap-6">
          <ClientOrderHeader />
          
          <main className="w-full flex flex-col items-center my-auto">
            <div className="w-full rounded-3xl bg-white/85 dark:bg-gray-800/85 backdrop-blur-2xl border border-white/80 dark:border-white/10 p-6 sm:p-10 shadow-2xl shadow-emerald-500/10 flex flex-col items-center animate-in zoom-in-95 fade-in duration-300">
              
              {/* Icono de Confirmación Luminoso */}
              <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-600 text-white shadow-xl shadow-emerald-500/30 ring-4 ring-emerald-100 dark:ring-emerald-950/40">
                <span className="material-symbols-outlined text-5xl sm:text-6xl">
                  task_alt
                </span>
              </div>

              <h1 className="mt-6 text-3xl sm:text-4xl font-black tracking-tight leading-tight">
                ¡Pedido Confirmado con Éxito!
              </h1>

              <p className="mt-2.5 max-w-md text-text-secondary dark:text-white/80 text-sm sm:text-base leading-relaxed">
                {isRefill(orderType) 
                  ? "Hemos recibido tu solicitud de recarga. Nuestro personal en sucursal preparará tus garrafones."
                  : "Gracias por tu compra. Hemos registrado tu pedido y comenzaremos a prepararlo de inmediato."
                }
              </p>

              {orderId && (
                <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/5 dark:bg-primary/10 px-8 py-3.5 flex flex-col items-center">
                  <p className="text-xs uppercase font-black text-gray-500 dark:text-gray-400 tracking-wider">
                    Número de pedido
                  </p>
                  <p className="text-2xl sm:text-3xl font-black text-primary tracking-wider mt-0.5">
                    {orderId}
                  </p>
                </div>
              )}
              
              <div className="mt-8 flex w-full flex-col items-center gap-4">
                {isFullAuth ? (
                  // --- Vista para usuario autenticado ---
                  <div className="flex w-full flex-col items-center gap-3 sm:flex-row">
                    <Link 
                        to="/mis-pedidos"
                        className="flex h-13 sm:h-14 w-full items-center justify-center rounded-2xl bg-primary hover:bg-primary-dark px-8 text-base font-bold text-white shadow-xl shadow-primary/25 transition-all active:scale-95"
                    >
                        Ver mis pedidos
                    </Link>
                    <Link 
                        to="/pedidos"
                        className="flex h-13 sm:h-14 w-full items-center justify-center rounded-2xl border border-white/80 dark:border-white/10 bg-white/80 dark:bg-gray-800/80 text-dark dark:text-white text-base font-bold hover:bg-white dark:hover:bg-gray-700 backdrop-blur-xl shadow-sm transition-all active:scale-95"
                    >
                        Hacer otro pedido
                    </Link>
                  </div>
                ) : isSemiAuth ? (
                  // --- Vista para usuario semi-autenticado ---
                  <>
                    <div className="w-full rounded-2xl border border-dashed border-primary/40 bg-gradient-to-r from-primary/5 to-cyan-500/5 p-6 text-center">
                      <p className="text-base sm:text-lg font-bold text-dark dark:text-white">¡Guarda tu registro en tu celular!</p>
                      <p className="mt-1.5 text-xs sm:text-sm text-text-secondary dark:text-white/70">
                        Escanea el código QR o visita <strong>{registrationUrl}</strong> para crear tu contraseña y ver tu historial.
                      </p>
                      <div className="mt-4 flex justify-center bg-white p-3 rounded-2xl shadow-sm w-min mx-auto">
                        <QRCodeSVG value={registrationUrl} size={128} />
                      </div>
                      <p className="mt-3 text-xs text-text-secondary dark:text-white/60">
                        Tu ID de Cliente es: <strong className='text-primary'>{clientData.customId}</strong>
                      </p>
                    </div>
                    <Link 
                        to="/pedidos"
                        className="flex h-11 sm:h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary hover:bg-primary-dark px-6 text-sm sm:text-base font-bold text-white shadow-md shadow-primary/25 hover:shadow-lg transition-all duration-200 active:scale-95 cursor-pointer"
                    >
                        <span>Hacer otro pedido</span>
                        <span className="material-symbols-outlined text-lg">arrow_forward</span>
                    </Link>
                  </>
                ) : (
                  // --- Vista para invitado puro ---
                  <Link 
                      to="/pedidos"
                      className="flex h-11 sm:h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary hover:bg-primary-dark px-6 text-sm sm:text-base font-bold text-white shadow-md shadow-primary/25 hover:shadow-lg transition-all duration-200 active:scale-95 cursor-pointer"
                  >
                      <span>Hacer otro pedido</span>
                      <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </Link>
                )}
              </div>

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
