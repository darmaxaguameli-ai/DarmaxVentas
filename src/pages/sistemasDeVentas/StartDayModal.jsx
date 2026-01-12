import { useState } from 'react';

const StartDayModal = ({ onStartSession }) => {
  const [amount, setAmount] = useState('');

  const handleStart = () => {
    if (navigator.vibrate) navigator.vibrate(50); // Feedback táctil
    onStartSession(parseFloat(amount) || 0);
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleStart();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-sm text-center transform transition-all animate-slide-up sm:animate-fade-in-up">
        <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-6 sm:hidden"></div> {/* Mobile Handle */}
        
        <h2 className="text-3xl font-black mb-2 text-gray-800 dark:text-white">Iniciar Turno</h2>
        <p className="mb-8 text-gray-500 dark:text-gray-400 font-medium">Ingresa el fondo de caja inicial.</p>
        
        <div className="mb-6">
            <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-gray-400 dark:text-gray-500">Monto Inicial</label>
            <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-2xl text-gray-400">$</span>
                <input 
                    type="number"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full p-4 pl-10 text-center text-4xl font-black rounded-2xl bg-gray-50 dark:bg-gray-700/50 border-2 border-transparent focus:border-primary focus:bg-white dark:focus:bg-gray-700 focus:ring-0 transition-all text-primary"
                    placeholder="0.00"
                    autoFocus
                />
            </div>
        </div>

        <button 
            onClick={handleStart} 
            className="w-full mt-2 py-4 text-lg font-bold text-white bg-primary rounded-xl shadow-lg shadow-primary/30 hover:bg-primary-dark active:scale-95 transition-all"
        >
            Iniciar Sesión
        </button>
      </div>
    </div>
  );
};

export default StartDayModal;

