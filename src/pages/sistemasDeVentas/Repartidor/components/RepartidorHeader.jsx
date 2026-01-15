import { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { useTheme } from '../../../../context/ThemeContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MdLocalShipping, MdPaid, MdLogout, MdLocationOn, MdLocationSearching, MdDarkMode, MdLightMode, MdLabelOff } from 'react-icons/md';

const RepartidorHeader = ({
  onLogout,
  onCashMovementClick,
  isCashDrawerOpen,
  isRefreshing,
  onRefresh,
  locationAccuracy,
}) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = format(currentTime, 'HH:mm');
  const formattedDate = format(currentTime, 'd MMM', { locale: es });

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 h-14 lg:h-20 transition-all">
      <div className="h-full px-3 lg:px-6 flex items-center justify-between">
        
        {/* Logo & User Info */}
        <div className="flex items-center gap-3 lg:gap-4">
            <div className={`flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 rounded-xl transition-transform ${isRefreshing ? 'animate-pulse' : ''}`}>
                <img src="/img/logos/darmax-logo.png" alt="Darmax Logo" className="h-full w-auto object-contain drop-shadow-sm" />
            </div>
            <div className="leading-tight flex flex-col justify-center">
                <h1 className="text-sm lg:text-lg font-black text-gray-900 dark:text-white hidden sm:block tracking-tight">Darmax Reparto</h1>
                <h1 className="text-base font-black text-gray-900 dark:text-white sm:hidden tracking-tight">Darmax</h1>
                <p className="text-[10px] lg:text-sm text-gray-500 dark:text-gray-400 font-medium truncate max-w-[100px] sm:max-w-none hidden sm:block">
                  {user ? user.name.split(' ')[0] : '...'}
                </p>
            </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 lg:gap-6">
            
            {/* GPS Status */}
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 lg:px-3 lg:py-1.5 bg-gray-50 dark:bg-gray-700/50 rounded-full border border-gray-100 dark:border-gray-700">
                {locationAccuracy < 100 ? (
                     <MdLocationOn className="text-green-500 text-sm lg:text-lg" />
                ) : (
                     <MdLocationSearching className="text-yellow-500 text-sm lg:text-lg animate-pulse" />
                )}
                <span className="text-[10px] lg:text-xs font-semibold text-gray-600 dark:text-gray-300">
                    {locationAccuracy ? `${Math.round(locationAccuracy)}m` : '...'}
                </span>
            </div>

            {/* Time (Hidden on mobile) */}
            <div className="hidden md:flex flex-col items-end mr-2">
                <p className="font-mono text-xl font-bold text-gray-800 dark:text-white leading-none">{formattedTime}</p>
                <p className="text-xs text-gray-400 capitalize">{formattedDate}</p>
            </div>
            
            <div className="flex items-center gap-1 lg:gap-2 pl-2 border-l border-gray-100 dark:border-gray-700">
                <button
                    onClick={toggleTheme}
                    className="p-2 lg:px-3 lg:py-2 flex items-center gap-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 dark:bg-gray-700/50 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
                    title="Cambiar Tema"
                >
                    {theme === 'dark' ? <MdLightMode className="text-lg lg:text-xl" /> : <MdDarkMode className="text-lg lg:text-xl" />}
                </button>

                <button 
                    onClick={onCashMovementClick}
                    disabled={!isCashDrawerOpen}
                    className="p-2 lg:px-4 lg:py-2 flex items-center gap-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700/50 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors"
                    title="Caja"
                >
                    <MdPaid className="text-lg lg:text-xl" />
                    <span className="hidden lg:inline text-sm font-bold">Caja</span>
                </button>
                <button
                  onClick={onLogout}
                  className="p-2 lg:px-4 lg:py-2 flex items-center gap-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/40 transition-colors"
                  title={isCashDrawerOpen ? 'Cerrar Caja' : 'Salir'}
                >
                  <MdLogout className="text-lg lg:text-xl" />
                  <span className="hidden lg:inline text-sm font-bold">{isCashDrawerOpen ? 'Cerrar' : 'Salir'}</span>
                </button>
            </div>
        </div>
      </div>
    </header>
  );
};

export default RepartidorHeader;
