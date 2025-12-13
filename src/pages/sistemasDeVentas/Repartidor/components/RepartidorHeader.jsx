// src/pages/sistemasDeVentas/Repartidor/components/RepartidorHeader.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const RepartidorHeader = ({ 
  onLogout,
  onCashMovementClick,
  isCashDrawerOpen,
  isRefreshing,
  onRefresh,
}) => {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = format(currentTime, 'HH:mm:ss');
  const formattedDate = format(currentTime, 'eeee, d \'de\' MMMM', { locale: es });

  return (
    <header className="fixed top-0 left-0 right-0 z-20 flex items-center justify-between p-4 bg-white dark:bg-gray-800 shadow-md">
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary text-white">
            <span className="material-symbols-outlined text-2xl">local_shipping</span>
        </div>
        <div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">Dashboard de Repartidor</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {user ? `Repartidor: ${user.name}` : 'Cargando...'}
            </p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden sm:flex flex-col items-end">
            <p className="font-mono text-lg font-semibold text-gray-800 dark:text-white">{formattedTime}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{formattedDate}</p>
        </div>
        
        <div className="flex items-center gap-2">
            <button 
                onClick={onCashMovementClick}
                disabled={!isCashDrawerOpen}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
                <span className="material-symbols-outlined">paid</span>
                Caja
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 bg-red-100 rounded-lg hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900"
            >
              <span className="material-symbols-outlined">logout</span>
              {isCashDrawerOpen ? 'Cerrar Caja' : 'Salir'}
            </button>
        </div>
      </div>
    </header>
  );
};

export default RepartidorHeader;
