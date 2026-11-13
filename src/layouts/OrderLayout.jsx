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
                 bg-light dark:bg-dark text-dark dark:text-white overflow-x-hidden select-none"
    >
      {/* Decorative Water Glass Aura Orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
      <div className="absolute top-1/3 -right-32 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

      <div className="flex h-full grow flex-col relative z-10">
        <div className="flex flex-1 justify-center px-4 pb-[110px] pt-0 sm:pt-[calc(1rem+env(safe-area-inset-top))] sm:p-6 md:p-8">
          <div className="flex flex-col w-full max-w-4xl flex-1 gap-6">
            {/* Header */}
            <ClientOrderHeader showOrderSelectionButton={true} />

            {/* Contenido */}
            <main className="flex-grow">
              {/* 1. Mobile Fixed Header (Title Only) */}
              <div className="md:hidden fixed top-0 left-0 w-full z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl 
                              px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3 shadow-xs border-b border-gray-200/60 dark:border-gray-800/60 transition-all">
                 <div className="text-lg font-black text-dark dark:text-white leading-tight flex items-center min-h-[2rem]">
                    {title}
                 </div>
              </div>
              
              {/* Spacer for Fixed Header */}
              <div className="md:hidden h-[calc(3.5rem+env(safe-area-inset-top))] w-full mb-4"></div>

              {/* 2. Desktop Header + Mobile Info (Subtitle + Progress) */}
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-4 px-1 sm:px-0 mb-6">
                <div className="flex flex-grow flex-col gap-1.5">
                  {/* Desktop Title Wrapper */}
                  <div className="hidden md:block">
                    <p className="text-2xl sm:text-3xl md:text-4xl font-black leading-tight tracking-tight text-gray-900 dark:text-white">
                        {title}
                    </p>
                  </div>
                  {subtitle && (
                    <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base leading-normal">
                      {subtitle}
                    </p>
                  )}
                </div>

                {/* Stepper Pill Indicator */}
                <div className="flex w-full sm:w-auto flex-col items-start sm:items-end gap-1.5 sm:min-w-[180px]">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary dark:text-blue-400 border border-primary/20">
                      Paso {step} de {totalSteps}
                    </span>
                    <span className="text-xs font-bold text-gray-400 dark:text-gray-500">
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-200/80 dark:bg-gray-700/80 overflow-hidden p-0.5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-primary transition-all duration-300 shadow-xs"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Wrapper de contenido (Glassmorphic Card) */}
              <section
                className="rounded-3xl border border-white/80 dark:border-white/10
                           bg-white/85 dark:bg-gray-800/85 
                           shadow-xl shadow-primary/5 backdrop-blur-2xl p-5 sm:p-8 md:p-10 transition-all"
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
