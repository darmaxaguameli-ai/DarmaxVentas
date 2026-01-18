import { useState, useEffect } from 'react';
import { formatDate } from '@/utils/formatters';
import { useHaptic } from '../../hooks/useHaptic';
import { useTheme } from '../../context/ThemeContext'; // Import Theme Context
import { MdDarkMode, MdLightMode, MdLabelOff } from 'react-icons/md'; // Import Icons

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
    month: 'long',
    year: 'numeric',
  });
  const formattedTime = currentTime.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  return (
    <div className="flex flex-row justify-between items-center p-2 sm:p-4 bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30 w-full transition-all duration-300 h-16 sm:h-auto">
      <div className="flex flex-col min-w-0">
        <h1 className="text-lg sm:text-3xl font-black text-gray-800 dark:text-white truncate tracking-tight leading-none">
          {isDashboard ? 'Punto de Venta' : 'Nuevo Pedido'}
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-bold mt-1 hidden sm:block">
            {formattedDate} • {formattedTime}
        </p>
      </div>
      
      <div className="flex items-center gap-2">
        
        {/* Theme Toggle */}
        <button
            onClick={() => { selection(); toggleTheme(); }}
            className="w-10 h-10 sm:w-auto sm:h-12 px-0 sm:px-4 bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all active:scale-95 flex items-center justify-center gap-2 border border-transparent"
            title="Cambiar Tema"
        >
            {theme === 'dark' ? <MdLightMode className="text-xl sm:text-2xl" /> : <MdDarkMode className="text-xl sm:text-2xl" />}
        </button>

        {isDashboard && isCashDrawerOpen && (
            <>
                {onReportDamagedTags && (
                    <button
                        onClick={() => { selection(); onReportDamagedTags(); }}
                        className="h-10 md:h-12 px-2 md:px-4 bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 rounded-xl hover:bg-orange-100 dark:hover:bg-orange-900/50 transition-all active:scale-95 flex items-center justify-center gap-2 border border-orange-200/50 dark:border-orange-800/50"
                        title="Reportar Etiquetas Rotas"
                    >
                        <MdLabelOff className="text-xl sm:text-2xl" />
                        <span className="hidden lg:inline font-bold text-sm">Etiquetas</span>
                    </button>
                )}
                
                {onCashMovementClick && (
                    <button 
                        onClick={() => { selection(); onCashMovementClick(); }}
                        className="h-10 md:h-12 px-2 md:px-4 bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/50 transition-all active:scale-95 flex items-center justify-center gap-2 border border-green-200/50 dark:border-green-800/50"
                        title="Movimientos de Caja"
                    >
                        <span className="material-symbols-outlined text-xl sm:text-2xl">swap_horiz</span>
                        <span className="hidden lg:inline font-bold text-sm">Caja</span>
                    </button>
                )}
            </>
        )}

        {isDashboard ? (
            <button 
                onClick={() => { selection(); onNewOrderClick(); }}
                className="w-10 h-10 sm:w-auto sm:h-12 px-0 sm:px-4 bg-primary text-white rounded-xl shadow-md shadow-primary/20 hover:bg-primary-dark transition-all active:scale-95 flex items-center justify-center gap-2"
                title="Nuevo Pedido"
            >
                <span className="material-symbols-outlined text-xl sm:text-2xl">add</span>
                <span className="hidden md:inline font-bold text-sm uppercase tracking-tight">Nuevo</span>
            </button>
        ) : (
            <button 
                onClick={() => { selection(); onDashboardClick(); }}
                className="w-10 h-10 sm:w-auto sm:h-12 px-0 sm:px-4 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
                <span className="material-symbols-outlined text-xl sm:text-2xl">arrow_back</span>
                <span className="hidden md:inline font-bold text-sm">Volver</span>
            </button>
        )}

        {/* Logout Button */}
        {onLogout && (
          <button
              onClick={() => { selection(); onLogout(); }}
              className={`w-10 h-10 sm:w-auto sm:h-12 px-0 sm:px-4 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2
                  ${isCashDrawerOpen 
                      ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 border border-red-100 dark:border-red-800 hover:bg-red-100' 
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200'}`
                  }
              title={isCashDrawerOpen ? 'Cerrar Caja' : 'Salir'}
          >
              <span className="material-symbols-outlined text-xl sm:text-2xl">
                  {isCashDrawerOpen ? 'lock' : 'logout'}
              </span>
              <span className="hidden md:inline font-bold text-sm">
                  {isCashDrawerOpen ? 'Cerrar' : 'Salir'}
              </span>
          </button>
        )}
      </div>
    </div>
  );
};

export default PosHeader;
