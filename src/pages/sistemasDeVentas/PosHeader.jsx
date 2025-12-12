import { useState, useEffect } from 'react';
import { formatDate } from '@/utils/formatters';

const PayInIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const PayOutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const CloseRegisterIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
);


const PosHeader = ({ isDashboard, onNewOrderClick, onDashboardClick, onRefresh, isRefreshing, onLogout, isCashDrawerOpen, onCashMovementClick }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

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
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 bg-white dark:bg-gray-900 rounded-b-lg shadow-lg">
      <div className="flex flex-col mb-4 sm:mb-0">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          {isDashboard ? 'Panel de Vendedor' : 'Nuevo Pedido'}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-300">{formattedDate} | {formattedTime}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {isDashboard && onRefresh && (
            <button 
                onClick={onRefresh} 
                disabled={isRefreshing}
                className="flex items-center justify-center px-4 py-2 text-sm font-semibold bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200 rounded-lg shadow-sm hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors"
            >
                {isRefreshing ? (
                    <>
                        <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
                        Actualizando...
                    </>
                ) : (
                    <>
                        <span className="material-symbols-outlined mr-2">refresh</span>
                        Actualizar
                    </>
                )}
            </button>
        )}
        
        {isDashboard && isCashDrawerOpen && onCashMovementClick && (
            <button 
                onClick={onCashMovementClick} 
                className="flex items-center justify-center px-4 py-2 text-sm font-semibold bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75 transition-colors"
            >
                <span className="material-symbols-outlined mr-2">swap_horiz</span>
                Movimientos de Caja
            </button>
        )}

        {isDashboard ? (
            <button 
                onClick={onNewOrderClick} 
                className="flex items-center justify-center px-4 py-2 text-sm font-semibold bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition-colors"
            >
                <span className="material-symbols-outlined mr-2">add_circle</span>
                Crear Pedido
            </button>
        ) : (
            <button 
                onClick={onDashboardClick} 
                className="flex items-center justify-center px-4 py-2 text-sm font-semibold bg-gray-500 text-white rounded-lg shadow-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-75 transition-colors"
            >
                <span className="material-symbols-outlined mr-2">arrow_back</span>
                Volver al Panel
            </button>
        )}

        {/* Logout Button */}
        {onLogout && (
          <button
              onClick={onLogout}
              className={`flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-lg shadow-md transition-colors
                  ${isCashDrawerOpen 
                      ? 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500' 
                      : 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500'}`
                  }
          >
              <span className="material-symbols-outlined mr-2">
                  {isCashDrawerOpen ? 'lock' : 'logout'}
              </span>
              Cerrar Sesión
          </button>
        )}
      </div>
    </div>
  );
};

export default PosHeader;
