// src/layouts/OrderLayout.jsx
import ClientOrderHeader from "../components/ClientOrderHeader";

const OrderLayout = ({
  title,
  subtitle,
  step,
  totalSteps,
  children,
}) => {
  const progress = (step / totalSteps) * 100;

  return (
    <div
      className="font-display relative flex min-h-screen w-full flex-col 
                 bg-light dark:bg-dark text-dark dark:text-white overflow-x-hidden"
    >
      <div className="flex h-full grow flex-col">
        <div className="flex flex-1 justify-center p-4 sm:p-6 md:p-8">
          <div className="flex flex-col w-full max-w-4xl flex-1 gap-6">
            {/* Header */}
            <ClientOrderHeader showOrderSelectionButton={true} />

            {/* Contenido */}
            <main className="flex-grow">
              {/* Encabezado de paso + barra de progreso */}
              <div className="flex flex-wrap justify-between gap-4 px-1 sm:px-0 mb-6">
                <div className="flex min-w-[260px] flex-col gap-2">
                  <p className="text-2xl sm:text-3xl md:text-4xl font-black leading-tight tracking-[-0.03em]">
                    {title}
                  </p>
                  {subtitle && (
                    <p className="text-text-secondary dark:text-white/70 text-base leading-normal">
                      {subtitle}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 min-w-[190px]">
                  <span className="text-sm font-medium text-text-secondary dark:text-white/70">
                    Paso {step} de {totalSteps}
                  </span>
                  <div className="h-2 w-full rounded-full bg-light dark:bg-dark/60 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Wrapper de contenido (card) */}
              <section
                className="rounded-2xl border border-light/60 dark:border-white/10
                           bg-white/95 dark:bg-dark/60 
                           shadow-lg backdrop-blur-xl p-4 sm:p-6 md:p-8"
              >
                {children}
              </section>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderLayout;
