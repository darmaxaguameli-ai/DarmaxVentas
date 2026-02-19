import { useState, useEffect } from 'react';
import { formatDate } from '@/utils/formatters';
import { useHaptic } from '../../hooks/useHaptic';
import { useTheme } from '../../context/ThemeContext'; // Import Theme Context
import { MdDarkMode, MdLightMode, MdLabelOff, MdSwapHoriz, MdAdd, MdArrowBack, MdLock, MdLogout } from 'react-icons/md'; // Import Icons

const PosHeader = ({ isDashboard, onNewOrderClick, onDashboardClick, onLogout, isCashDrawerOpen, onCashMovementClick, onReportDamagedTags }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { selection } = useHaptic();
  const { theme, toggleTheme } = useTheme(); // Use Theme

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  const formattedDate = formatDate(currentTime, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const formattedTime = currentTime.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const logoSrc = theme === 'dark' ? '/img/logos/LogoTO.png' : '/img/logos/darmax-logo.png';

  return (
    <>
      {/* --- TOP BAR (Mobile & Desktop) --- */}
      <div className="flex flex-row justify-between items-center px-4 py-3 sm:py-4 bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30 w-full transition-all duration-300 pt-[calc(0.75rem+env(safe-area-inset-top))] sm:pt-[calc(1rem+env(safe-area-inset-top))]">
        <div className="flex items-center gap-3 min-w-0">
          <img src={logoSrc} alt="Logo" className="h-8 sm:h-12 w-auto object-contain" />
          <div className="flex flex-col min-w-0">
            <h1 className="text-base sm:text-2xl font-black text-gray-800 dark:text-white truncate tracking-tight leading-none uppercase">
              {isDashboard ? 'Mostrador' : 'Nuevo Pedido'}
            </h1>
            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-bold mt-1">
                {formattedDate} • {formattedTime}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Desktop Actions (Hidden on mobile) */}
          <div className="hidden sm:flex items-center gap-2">
            {isDashboard && isCashDrawerOpen && (
                <>
                    {onReportDamagedTags && (
                        <button
                            onClick={() => { selection(); onReportDamagedTags(); }}
                            className="h-11 px-4 bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 rounded-xl hover:bg-orange-100 dark:hover:bg-orange-900/50 transition-all active:scale-95 flex items-center justify-center gap-2 border border-orange-200/50 dark:border-orange-800/50"
                        >
                            <MdLabelOff className="text-xl" />
                            <span className="font-bold text-sm uppercase">Etiquetas</span>
                        </button>
                    )}
                    
                    {onCashMovementClick && (
                        <button 
                            onClick={() => { selection(); onCashMovementClick(); }}
                            className="h-11 px-4 bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/50 transition-all active:scale-95 flex items-center justify-center gap-2 border border-green-200/50 dark:border-green-800/50"
                        >
                            <MdSwapHoriz className="text-xl" />
                            <span className="font-bold text-sm uppercase">Caja</span>
                        </button>
                    )}
                </>
            )}

            {isDashboard ? (
                <button 
                    onClick={() => { selection(); onNewOrderClick(); }}
                    className="h-11 px-5 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2 border border-primary/20"
                >
                    <MdAdd className="text-xl" />
                    <span className="font-bold text-sm uppercase tracking-tight">Nuevo</span>
                </button>
            ) : (
                <button 
                    onClick={() => { selection(); onDashboardClick(); }}
                    className="h-11 px-5 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all active:scale-95 flex items-center justify-center gap-2 border border-gray-200 dark:border-gray-700"
                >
                    <MdArrowBack className="text-xl" />
                    <span className="font-bold text-sm uppercase">Volver</span>
                </button>
            )}

            {onLogout && (
              <button
                  onClick={() => { selection(); onLogout(); }}
                  className={`h-11 px-4 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2
                      ${isCashDrawerOpen 
                          ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 border border-red-100 dark:border-red-800 hover:bg-red-100' 
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200'}`
                      }
              >
                  {isCashDrawerOpen ? <MdLock className="text-xl" /> : <MdLogout className="text-xl" />}
                  <span className="font-bold text-sm uppercase">
                      {isCashDrawerOpen ? 'Cerrar' : 'Salir'}
                  </span>
              </button>
            )}
          </div>

          {/* Theme Toggle (Visible on both) */}
          <button
              onClick={() => { selection(); toggleTheme(); }}
              className="w-10 h-10 sm:w-11 sm:h-11 bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all active:scale-95 flex items-center justify-center border border-transparent shadow-sm"
              title="Cambiar Tema"
          >
              {theme === 'dark' ? <MdLightMode className="text-xl" /> : <MdDarkMode className="text-xl" />}
          </button>
        </div>
      </div>

      {/* --- BOTTOM BAR (Mobile Only) --- */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 px-4 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] flex items-center justify-around shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        {isDashboard && isCashDrawerOpen && (
            <>
                <button
                    onClick={() => { selection(); onReportDamagedTags(); }}
                    className="flex flex-col items-center justify-center gap-1 text-orange-600 dark:text-orange-400"
                >
                    <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                        <MdLabelOff className="text-2xl" />
                    </div>
                    <span className="text-[10px] font-bold uppercase">Tags</span>
                </button>
                
                <button 
                    onClick={() => { selection(); onCashMovementClick(); }}
                    className="flex flex-col items-center justify-center gap-1 text-green-600 dark:text-green-400"
                >
                    <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-xl">
                        <MdSwapHoriz className="text-2xl" />
                    </div>
                    <span className="text-[10px] font-bold uppercase">Caja</span>
                </button>
            </>
        )}

        {isDashboard ? (
            <button 
                onClick={() => { selection(); onNewOrderClick(); }}
                className="flex flex-col items-center justify-center gap-1 text-primary"
            >
                <div className="p-2 bg-primary/10 rounded-xl">
                    <MdAdd className="text-2xl" />
                </div>
                <span className="text-[10px] font-bold uppercase">Nuevo</span>
            </button>
        ) : (
            <button 
                onClick={() => { selection(); onDashboardClick(); }}
                className="flex flex-col items-center justify-center gap-1 text-gray-600 dark:text-gray-300"
            >
                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl">
                    <MdArrowBack className="text-2xl" />
                </div>
                <span className="text-[10px] font-bold uppercase">Volver</span>
            </button>
        )}

        {onLogout && (
          <button
              onClick={() => { selection(); onLogout(); }}
              className={`flex flex-col items-center justify-center gap-1 ${isCashDrawerOpen ? 'text-red-600 dark:text-red-400' : 'text-gray-500'}`}
          >
              <div className={`p-2 rounded-xl ${isCashDrawerOpen ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  {isCashDrawerOpen ? <MdLock className="text-2xl" /> : <MdLogout className="text-2xl" />}
              </div>
              <span className="text-[10px] font-bold uppercase">{isCashDrawerOpen ? 'Cerrar' : 'Salir'}</span>
          </button>
        )}
      </div>
    </>
  );
};

export default PosHeader;
