import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useClient } from "../context/ClientContext"; // Import useClient
import ClientOrderHeader from "../../../components/ClientOrderHeader";
import PriceTable from "../../../components/PriceTable";
import { useHaptic } from "../../../hooks/useHaptic";

const OrderSelection = () => {
  const navigate = useNavigate();
  const { logout, user, isAuthenticated } = useAuth();
  const { selectedStore, allStores, selectStore, loadingLocation } = useClient(); // Use client context
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const { triggerSelection } = useHaptic();

  return (
    <div className="font-display relative flex min-h-screen w-full flex-col bg-light dark:bg-dark text-dark dark:text-white overflow-x-hidden select-none">
      {/* Contenedor principal */}
      <div className="flex flex-1 justify-center px-4 pb-[130px] pt-[calc(1rem+env(safe-area-inset-top))] sm:p-6 md:p-8">
        <div className="flex h-full w-full max-w-4xl flex-col items-center gap-6">
          {/* Header */}
          <ClientOrderHeader showOrderSelectionButton={true} />

          {/* Main content */}
          <main className="w-full flex flex-col items-center text-center flex-grow">
            
            {/* Store Selection Banner */}
            <div className="mb-6 animate-fade-in">
                {loadingLocation ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500 italic">
                        <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                        Buscando la sucursal más cercana...
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2">
                        <button 
                            onClick={() => {
                                triggerSelection();
                                setIsStoreModalOpen(true);
                            }}
                            className="flex items-center gap-2 backdrop-blur-md bg-white/60 dark:bg-black/30 px-4 py-1.5 rounded-full border border-gray-200 dark:border-white/10 shadow-sm hover:scale-105 transition-transform active:scale-95"
                        >
                            <span className="material-symbols-outlined text-primary text-lg">storefront</span>
                            <span className="text-xs sm:text-sm font-bold text-gray-800 dark:text-white truncate max-w-[150px] sm:max-w-none">
                                {selectedStore?.name || 'Selecciona Sucursal'}
                            </span>
                            <span className="text-[10px] font-bold text-primary uppercase ml-1 tracking-wider bg-primary/10 px-2 py-0.5 rounded-full">
                                Cambiar
                            </span>
                        </button>
                        {selectedStore && (
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 max-w-xs truncate">
                                {selectedStore.address}
                            </p>
                        )}
                    </div>
                )}
            </div>

            <h1 className="text-3xl md:text-4xl font-black tracking-[-0.03em]">
              Bienvenido a Darmax
            </h1>

            <p className="mt-2 max-w-xl text-text-secondary dark:text-white/80 text-base sm:text-lg">
              Elige una opción para empezar tu pedido de agua.
            </p>

            {/* Tip para adultos mayores */}
            <p className="mt-2 text-sm sm:text-base text-text-secondary dark:text-white/70 max-w-xl">
              <span className="font-semibold text-dark dark:text-white">
                Tip:
              </span>{" "}
              puedes tocar cualquiera de las tarjetas de abajo para continuar.
            </p>

            {/* Cards */}
            <div className="mt-6 grid w-full max-w-3xl grid-cols-2 gap-3 sm:gap-6 md:grid-cols-2 md:gap-8 animate-in slide-in-from-bottom-8 fade-in duration-500">
              {/* Card: Rellenar Garrafón */}
              <Link
                to="/pedidos/rellenar"
                state={{ storeId: selectedStore?.id }} // Pass store context to flow
                className="group flex flex-col gap-3 rounded-2xl 
                           border border-light/60 dark:border-white/10 
                           bg-white/95 dark:bg-dark/70 
                           px-3 py-5 sm:px-6 sm:py-7 text-center shadow-md backdrop-blur-xl 
                           transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div
                  className="mx-auto flex h-14 w-14 sm:h-20 sm:w-20 items-center justify-center rounded-full
                             bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30
                             ring-4 ring-emerald-50 dark:ring-emerald-900/20 transition-transform group-hover:scale-110 duration-300"
                >
                  <span className="material-symbols-outlined text-3xl sm:text-5xl">
                    recycling
                  </span>
                </div>

                <div className="flex flex-col gap-1 sm:gap-2">
                  <p className="text-base sm:text-xl font-bold leading-tight">
                    Rellenar garrafón
                  </p>
                  <p className="text-xs sm:text-base text-text-secondary dark:text-white/70">
                    ¡Dale nueva vida a tu garrafón! Tráelo y lo rellenamos.
                  </p>
                </div>
              </Link>

              {/* Card: Comprar Garrafón */}
              <Link
                to="/pedidos/comprar"
                state={{ storeId: selectedStore?.id }} // Pass store context to flow
                className="group flex flex-col gap-3 rounded-2xl
                          border border-light/60 dark:border-white/10 
                          bg-white/95 dark:bg-dark/70 
                          px-3 py-5 sm:px-6 sm:py-7 text-center shadow-md backdrop-blur-xl 
                          transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div
                  className="mx-auto flex h-14 w-14 sm:h-20 sm:w-20 items-center justify-center rounded-full
                            bg-gradient-to-br from-cyan-500 to-teal-600 text-white shadow-lg shadow-cyan-500/30
                            ring-4 ring-cyan-50 dark:ring-cyan-900/20 transition-transform group-hover:scale-110 duration-300"
                >
                  <span className="material-symbols-outlined text-3xl sm:text-5xl">
                    water_drop
                  </span>
                </div>

                <div className="flex flex-col gap-1 sm:gap-2">
                  <p className="text-base sm:text-xl font-bold leading-tight">
                    Comprar garrafones
                  </p>
                  <p className="text-xs sm:text-base text-text-secondary dark:text-white/70">
                    Nuevos de 20L y 10L.
                  </p>
                </div>
              </Link>

            </div>

            {/* Opción: Ya soy cliente */}
            {!isAuthenticated && (
              <div className="mt-8 w-full max-w-3xl">
                <div className="rounded-2xl border border-primary/40 bg-primary/5 dark:bg-primary/15 px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3 text-left">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white">
                      <span className="material-symbols-outlined text-2xl">
                        verified_user
                      </span>
                    </div>
                    <div>
                      <p className="text-base sm:text-lg font-semibold">
                        ¿Ya eres cliente Darmax?
                      </p>
                      <p className="text-sm sm:text-base text-text-secondary dark:text-white/70">
                        Identifícate rápidamente escribiendo tu nombre registrado.
                      </p>
                    </div>
                  </div>

                  <Link
                    to="/pedidos/identificar"
                    className="flex h-11 px-6 items-center justify-center rounded-lg
                              bg-primary text-white text-sm sm:text-base font-semibold
                              shadow-sm hover:bg-primary/90 transition-colors"
                  >
                    Continuar
                  </Link>
                </div>
              </div>
            )}

            {/* Componente de tabla de precios */}
            <PriceTable />

          </main>

          {/* Footer */}
          <footer className="hidden sm:flex w-full flex-col items-center gap-6 py-10 text-center text-text-secondary dark:text-white/60">
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-8">
              <a
                href="#"
                className="text-sm sm:text-base hover:text-primary dark:hover:text-primary"
              >
                Ayuda y soporte
              </a>
              <a
                href="#"
                className="text-sm sm:text-base hover:text-primary dark:hover:text-primary"
              >
                Términos de servicio
              </a>
            </div>
            <p className="text-xs sm:text-sm">
              © {new Date().getFullYear()} Darmax. Todos los derechos reservados.
            </p>
          </footer>
        </div>
      </div>

      {/* Store Selection Modal */}
      {isStoreModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm transition-all">
              <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 sm:fade-in sm:zoom-in duration-300">
                  <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center">
                      <h3 className="text-xl font-bold">Cambiar Sucursal</h3>
                      <button onClick={() => setIsStoreModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                          <span className="material-symbols-outlined">close</span>
                      </button>
                  </div>
                  <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3">
                      {allStores.map(store => (
                          <button
                            key={store.id}
                            onClick={() => {
                                triggerSelection();
                                selectStore(store.id);
                                setIsStoreModalOpen(false);
                            }}
                            className={`w-full text-left p-4 rounded-xl border transition-all ${
                                selectedStore?.id === store.id 
                                ? 'border-primary bg-primary/5' 
                                : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                            }`}
                          >
                              <p className="font-bold text-gray-800 dark:text-white">{store.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{store.address}</p>
                          </button>
                      ))}
                  </div>
                  <div className="p-6 bg-gray-50 dark:bg-gray-900/50 pb-8 sm:pb-6">
                      <button 
                        onClick={() => setIsStoreModalOpen(false)}
                        className="w-full btn-primary"
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

