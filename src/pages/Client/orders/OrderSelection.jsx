// src/pages/OrderSelection.jsx
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import ClientOrderHeader from "../../../components/ClientOrderHeader"; // Import the new header component

const OrderSelection = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  return (
    <div className="font-display relative flex min-h-screen w-full flex-col bg-light dark:bg-dark text-dark dark:text-white overflow-x-hidden">
      {/* Contenedor principal */}
      <div className="flex flex-1 justify-center px-4 sm:px-6 lg:px-12 py-8">
        <div className="flex w-full max-w-4xl flex-col items-center gap-10">
          {/* Header */}
          <ClientOrderHeader showOrderSelectionButton={true} />

          {/* Main content */}
          <main className="w-full flex flex-col items-center text-center mt-4">
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
            <div className="mt-10 grid w-full max-w-3xl grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
              {/* Card: Rellenar Garrafón */}
              <Link
                to="/pedidos/rellenar"
                className="group flex flex-col gap-4 rounded-2xl 
                           border border-light/60 dark:border-white/10 
                           bg-white/95 dark:bg-dark/70 
                           px-6 py-7 text-center shadow-md backdrop-blur-xl 
                           transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div
                  className="mx-auto flex h-20 w-20 items-center justify-center rounded-full
                             bg-primary/10 text-primary transition-all 
                             group-hover:bg-primary group-hover:text-white"
                >
                  <span className="material-symbols-outlined text-4xl sm:text-5xl">
                    recycling
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <p className="text-lg sm:text-xl font-bold">
                    Rellenar garrafón
                  </p>
                  <p className="text-sm sm:text-base text-text-secondary dark:text-white/70">
                    Programa una recarga para tus garrafones vacíos.
                  </p>
                </div>
              </Link>

              {/* Card: Comprar Garrafón */}
              <Link
                to="/pedidos/comprar"
                className="group flex flex-col gap-4 rounded-2xl
                          border border-light/60 dark:border-white/10 
                          bg-white/95 dark:bg-dark/70 
                          px-6 py-7 text-center shadow-md backdrop-blur-xl 
                          transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div
                  className="mx-auto flex h-20 w-20 items-center justify-center rounded-full
                            bg-primary/10 text-primary transition-all 
                            group-hover:bg-primary group-hover:text-white"
                >
                  <span className="material-symbols-outlined text-4xl sm:text-5xl">
                    water_drop
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <p className="text-lg sm:text-xl font-bold">
                    Comprar garrafones
                  </p>
                  <p className="text-sm sm:text-base text-text-secondary dark:text-white/70">
                    Elige cuántos garrafones de 20L y 10L necesitas.
                  </p>
                </div>
              </Link>

            </div>

          {/* Opción: Ya soy cliente */}
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
          </main>

          {/* Footer */}
          <footer className="flex w-full flex-col items-center gap-6 py-10 text-center text-text-secondary dark:text-white/60">
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
    </div>
  );
};

export default OrderSelection;
