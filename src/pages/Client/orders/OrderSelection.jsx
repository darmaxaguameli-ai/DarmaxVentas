import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useClient } from "../context/ClientContext";
import ClientOrderHeader from "../../../components/ClientOrderHeader";
import PriceTable from "../../../components/PriceTable";
import { useHaptic } from "../../../hooks/useHaptic";

const OrderSelection = () => {
  const navigate = useNavigate();
  const { logout, user, isAuthenticated } = useAuth();
  const { selectedStore, allStores, selectStore, loadingLocation } = useClient();
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const { selection } = useHaptic();

  return (
    <div className="font-display relative flex min-h-screen w-full flex-col bg-slate-50/50 dark:bg-[#0c1322] text-dark dark:text-white overflow-x-hidden select-none">
      {/* Ambient water glow background effects (Kiosk Totem Atmosphere) */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute -top-32 -left-20 h-96 w-96 rounded-full bg-cyan-400/20 dark:bg-cyan-500/15 blur-3xl animate-pulse" style={{ animationDuration: '7s' }} />
        <div className="absolute top-1/3 -right-24 h-96 w-96 rounded-full bg-blue-500/15 dark:bg-blue-600/15 blur-3xl animate-pulse" style={{ animationDuration: '9s' }} />
        <div className="absolute -bottom-24 left-1/3 h-80 w-80 rounded-full bg-teal-400/15 dark:bg-teal-500/10 blur-3xl" />
      </div>

      {/* Contenedor principal */}
      <div className="flex flex-1 justify-center px-4 pb-[130px] pt-[calc(1rem+env(safe-area-inset-top))] sm:p-6 md:p-8">
        <div className="flex h-full w-full max-w-4xl flex-col items-center gap-6 sm:gap-8">
          {/* Header con estilo Glassmorphic */}
          <ClientOrderHeader showOrderSelectionButton={true} />

          {/* Main content */}
          <main className="w-full flex flex-col items-center text-center flex-grow">
            
            {/* Store Selection Capsule */}
            <div className="mb-4 sm:mb-6 animate-fade-in">
              {loadingLocation ? (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-white/60 dark:border-white/10 text-xs sm:text-sm text-gray-500 italic shadow-sm">
                  <span className="material-symbols-outlined animate-spin text-sm text-primary">progress_activity</span>
                  Localizando sucursal más cercana...
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5">
                  <button 
                    onClick={() => {
                      selection();
                      setIsStoreModalOpen(true);
                    }}
                    className="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/80 dark:border-white/10 shadow-sm hover:shadow-md hover:border-primary/50 transition-all duration-200 active:scale-95"
                  >
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span className="material-symbols-outlined text-primary text-base sm:text-lg">storefront</span>
                    <span className="text-xs sm:text-sm font-bold text-gray-800 dark:text-white truncate max-w-[170px] sm:max-w-none">
                      {selectedStore?.name || 'Selecciona Sucursal'}
                    </span>
                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider bg-primary/10 group-hover:bg-primary group-hover:text-white px-2 py-0.5 rounded-full transition-colors">
                      Cambiar
                    </span>
                  </button>
                  {selectedStore && (
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 max-w-xs truncate font-medium">
                      {selectedStore.address}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Titular Principal Kiosko */}
            <div className="max-w-xl mx-auto space-y-2">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
                Bienvenido a{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-cyan-500 to-teal-500">
                  Darmax Agua
                </span>
              </h1>
              <p className="text-sm sm:text-lg text-text-secondary dark:text-white/80 leading-snug">
                Elige una opción tocando la pantalla para iniciar tu pedido.
              </p>
            </div>

            {/* Cards Grandes Totem / Touch Kiosk */}
            <div className="mt-6 sm:mt-8 grid w-full max-w-3xl grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8 animate-in slide-in-from-bottom-6 fade-in duration-500">
              {/* Card: Rellenar Garrafón */}
              <Link
                to="/pedidos/rellenar"
                state={{ storeId: selectedStore?.id }}
                className="group relative overflow-hidden flex flex-col items-center justify-between rounded-3xl 
                           border border-white/80 dark:border-white/10 
                           bg-white/80 dark:bg-gray-800/80 
                           p-6 sm:p-8 text-center shadow-lg shadow-emerald-500/5 backdrop-blur-2xl 
                           transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-emerald-500/20 hover:border-emerald-400/60 active:scale-[0.98]"
              >
                {/* Aquatic glow backdrop within card */}
                <div className="absolute -top-16 -right-16 h-36 w-36 rounded-full bg-emerald-400/15 blur-2xl group-hover:bg-emerald-400/25 transition-colors pointer-events-none" />

                <div className="relative flex flex-col items-center gap-4 w-full">
                  <div
                    className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-3xl
                               bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-600 text-white shadow-xl shadow-emerald-500/30
                               ring-4 ring-emerald-100 dark:ring-emerald-950/40 transition-transform group-hover:scale-110 duration-300"
                  >
                    <span className="material-symbols-outlined text-4xl sm:text-5xl">
                      recycling
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5 sm:gap-2">
                    <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                      Rellenar garrafón
                    </p>
                    <p className="text-xs sm:text-sm text-text-secondary dark:text-white/70 max-w-xs mx-auto leading-relaxed">
                      ¡Dale nueva vida a tus envases! Tráelos vacíos y los rellenamos con agua ultra purificada.
                    </p>
                  </div>
                </div>

                {/* Touch CTA Pill */}
                <div className="mt-5 w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-sm group-hover:bg-emerald-500 group-hover:text-white transition-all duration-200">
                  <span>Iniciar recarga</span>
                  <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </div>
              </Link>

              {/* Card: Comprar Productos */}
              <Link
                to="/pedidos/comprar"
                state={{ storeId: selectedStore?.id }}
                className="group relative overflow-hidden flex flex-col items-center justify-between rounded-3xl
                          border border-white/80 dark:border-white/10 
                          bg-white/80 dark:bg-gray-800/80 
                          p-6 sm:p-8 text-center shadow-lg shadow-cyan-500/5 backdrop-blur-2xl 
                          transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-cyan-500/20 hover:border-cyan-400/60 active:scale-[0.98]"
              >
                {/* Aquatic glow backdrop within card */}
                <div className="absolute -top-16 -right-16 h-36 w-36 rounded-full bg-cyan-400/15 blur-2xl group-hover:bg-cyan-400/25 transition-colors pointer-events-none" />

                <div className="relative flex flex-col items-center gap-4 w-full">
                  <div
                    className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-3xl
                              bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-600 text-white shadow-xl shadow-cyan-500/30
                              ring-4 ring-cyan-100 dark:ring-cyan-950/40 transition-transform group-hover:scale-110 duration-300"
                  >
                    <span className="material-symbols-outlined text-4xl sm:text-5xl">
                      water_drop
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5 sm:gap-2">
                    <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                      Comprar productos
                    </p>
                    <p className="text-xs sm:text-sm text-text-secondary dark:text-white/70 max-w-xs mx-auto leading-relaxed">
                      Garrafones nuevos con o sin agua, termos térmicos, bombas dosificadoras y más.
                    </p>
                  </div>
                </div>

                {/* Touch CTA Pill */}
                <div className="mt-5 w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-cyan-500/10 text-primary dark:text-cyan-400 font-bold text-sm group-hover:bg-primary group-hover:text-white transition-all duration-200">
                  <span>Ver catálogo</span>
                  <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </div>
              </Link>
            </div>

            {/* Opción: Ya soy cliente (VIP Glass Card) */}
            {!isAuthenticated && (
              <div className="mt-6 sm:mt-8 w-full max-w-3xl">
                <div className="rounded-3xl border border-white/80 dark:border-white/10 bg-gradient-to-r from-cyan-500/10 via-primary/5 to-teal-500/10 dark:from-cyan-950/30 dark:via-primary/20 dark:to-teal-950/30 backdrop-blur-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
                  <div className="flex items-center gap-4 text-left w-full sm:w-auto">
                    <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-cyan-600 text-white shadow-md shadow-primary/25">
                      <span className="material-symbols-outlined text-2xl sm:text-3xl">
                        verified_user
                      </span>
                    </div>
                    <div>
                      <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-tight">
                        ¿Ya eres cliente Darmax?
                      </p>
                      <p className="text-xs sm:text-sm text-text-secondary dark:text-white/70 mt-0.5">
                        Identifícate con tu ID o teléfono para cargar tu dirección y puntos de lealtad.
                      </p>
                    </div>
                  </div>

                  <Link
                    to="/pedidos/identificar"
                    className="flex h-11 sm:h-12 w-full sm:w-auto px-6 items-center justify-center gap-2 rounded-2xl
                              bg-primary hover:bg-primary-dark text-white text-sm sm:text-base font-bold
                              shadow-md shadow-primary/25 hover:shadow-lg transition-all duration-200 active:scale-95 shrink-0 cursor-pointer"
                  >
                    <span>Identificarme</span>
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </Link>
                </div>
              </div>
            )}

            {/* Componente de tabla de precios */}
            <PriceTable />

          </main>

          {/* Footer */}
          <footer className="hidden sm:flex w-full flex-col items-center gap-4 py-8 text-center text-text-secondary dark:text-white/60">
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-8">
              <a
                href="#"
                className="text-xs sm:text-sm font-medium hover:text-primary dark:hover:text-primary transition-colors"
              >
                Ayuda y soporte
              </a>
              <span className="text-gray-300 dark:text-gray-700 hidden sm:inline">•</span>
              <a
                href="#"
                className="text-xs sm:text-sm font-medium hover:text-primary dark:hover:text-primary transition-colors"
              >
                Términos de servicio
              </a>
            </div>
            <p className="text-[11px] sm:text-xs text-gray-400 dark:text-gray-500">
              © {new Date().getFullYear()} Darmax Agua Purificada. Todos los derechos reservados.
            </p>
          </footer>
        </div>
      </div>

      {/* Store Selection Modal con Glassmorphism */}
      {isStoreModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-md transition-all">
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-2xl w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl border border-white/60 dark:border-white/10 overflow-hidden animate-in slide-in-from-bottom-10 sm:fade-in sm:zoom-in duration-300">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700/60 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-xl">storefront</span>
                </div>
                <h3 className="text-xl font-bold">Cambiar Sucursal</h3>
              </div>
              <button 
                onClick={() => setIsStoreModalOpen(false)} 
                className="h-9 w-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2.5">
              {allStores.map(store => {
                const isSelected = selectedStore?.id === store.id;
                return (
                  <button
                    key={store.id}
                    onClick={() => {
                      selection();
                      selectStore(store.id);
                      setIsStoreModalOpen(false);
                    }}
                    className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between ${
                      isSelected 
                        ? 'border-primary bg-primary/10 dark:bg-primary/20 shadow-sm' 
                        : 'border-gray-200/80 dark:border-gray-700/80 hover:border-primary/50 hover:bg-gray-50/80 dark:hover:bg-gray-700/40'
                    }`}
                  >
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white text-base">{store.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{store.address}</p>
                    </div>
                    {isSelected && (
                      <span className="material-symbols-outlined text-primary text-2xl shrink-0 ml-3">
                        check_circle
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="p-5 bg-gray-50/80 dark:bg-gray-900/50 pb-8 sm:pb-5 border-t border-gray-100 dark:border-gray-700/60">
              <button 
                onClick={() => setIsStoreModalOpen(false)}
                className="w-full h-12 rounded-2xl bg-primary hover:bg-primary-dark text-white font-bold transition-all shadow-md shadow-primary/25"
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderSelection;

