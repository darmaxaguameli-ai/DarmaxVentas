import { useState, useEffect } from 'react';
import { formatDate } from '@/utils/formatters';
import useHaptic from '../../hooks/useHaptic';

const PosHeader = ({ isDashboard, onNewOrderClick, onDashboardClick, onRefresh, isRefreshing, onLogout, isCashDrawerOpen, onCashMovementClick }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { triggerSelection } = useHaptic();

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
    <div className="flex flex-row justify-between items-center p-3 md:p-4 bg-white dark:bg-gray-900 shadow-md md:rounded-b-lg sticky top-0 z-30 w-full transition-all duration-300">
      <div className="flex flex-col min-w-0">
        <h1 className="text-xl md:text-3xl font-black text-gray-800 dark:text-white truncate tracking-tight leading-none">
          {isDashboard ? 'Ventas' : 'Pedido'}
        </h1>
        <p className="text-[10px] md:text-sm text-gray-500 dark:text-gray-400 font-bold mt-1 hidden sm:block">
            {formattedDate} • {formattedTime}
        </p>
      </div>
      
      <div className="flex items-center gap-1.5 md:gap-3">
        {isDashboard && onRefresh && (
            <button 
                onClick={() => { triggerSelection(); onRefresh(); }}
                disabled={isRefreshing}
                className="h-10 md:h-12 px-2 md:px-4 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all active:scale-95 flex items-center justify-center gap-2 border border-transparent"
                title="Actualizar"
            >
                <span className={`material-symbols-outlined text-xl md:text-2xl ${isRefreshing ? 'animate-spin' : ''}`}>
                    {isRefreshing ? 'progress_activity' : 'refresh'}
                </span>
                <span className="hidden lg:inline font-bold text-sm">Actualizar</span>
            </button>
        )}
        
        {isDashboard && isCashDrawerOpen && onCashMovementClick && (
            <button 
                onClick={() => { triggerSelection(); onCashMovementClick(); }}
                className="h-10 md:h-12 px-2 md:px-4 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-xl hover:bg-green-200 dark:hover:bg-green-900/50 transition-all active:scale-95 flex items-center justify-center gap-2 border border-green-200/50 dark:border-green-800/50"
                title="Movimientos de Caja"
            >
                <span className="material-symbols-outlined text-xl md:text-2xl">swap_horiz</span>
                <span className="hidden lg:inline font-bold text-sm">Caja</span>
            </button>
        )}

        {isDashboard ? (
            <button 
                onClick={() => { triggerSelection(); onNewOrderClick(); }}
                className="h-10 md:h-12 px-2 md:px-4 bg-primary text-white rounded-xl shadow-md shadow-primary/20 hover:bg-primary-dark transition-all active:scale-95 flex items-center justify-center gap-2"
            >
                <span className="material-symbols-outlined text-xl md:text-2xl">add</span>
                <span className="hidden lg:inline font-bold text-sm uppercase tracking-tight">Nuevo</span>
            </button>
        ) : (
            <button 
                onClick={() => { triggerSelection(); onDashboardClick(); }}
                className="h-10 md:h-12 px-2 md:px-4 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
                <span className="material-symbols-outlined text-xl md:text-2xl">arrow_back</span>
                <span className="hidden md:inline font-bold text-sm">Volver</span>
            </button>
        )}

        {/* Logout Button */}
        {onLogout && (
          <button
              onClick={() => { triggerSelection(); onLogout(); }}
              className={`h-10 md:h-12 px-2 md:px-4 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2
                  ${isCashDrawerOpen 
                      ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 border border-red-100 dark:border-red-800 hover:bg-red-100' 
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200'}`
                  }
              title={isCashDrawerOpen ? 'Cerrar Caja' : 'Salir'}
          >
              <span className="material-symbols-outlined text-xl md:text-2xl">
                  {isCashDrawerOpen ? 'lock' : 'logout'}
              </span>
              <span className="hidden lg:inline font-bold text-sm">
                  {isCashDrawerOpen ? 'Cerrar' : 'Salir'}
              </span>
          </button>
        )}
      </div>
    </div>
  );
};

export default PosHeader;
