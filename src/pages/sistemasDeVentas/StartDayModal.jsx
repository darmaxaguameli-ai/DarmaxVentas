import { useState } from 'react';

const StartDayModal = ({ onStartSession }) => {
  const [amount, setAmount] = useState('');

  const handleStart = () => {
    onStartSession(parseFloat(amount) || 0);
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleStart();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-sm text-center transform transition-all animate-fade-in-up">
        <h2 className="text-3xl font-bold mb-2 text-gray-800 dark:text-white">Iniciar Turno</h2>
        <p className="mb-8 text-gray-500 dark:text-gray-400">Ingresa el monto inicial en caja para comenzar el día.</p>
        
        <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-gray-600 dark:text-gray-300">Monto Inicial</label>
            <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-2xl text-gray-500">$</span>
                <input 
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full p-4 pl-10 text-center text-3xl font-bold rounded-lg bg-gray-100 dark:bg-gray-700 border-2 border-transparent focus:border-primary focus:ring-0 transition"
                    placeholder="0.00"
                    autoFocus
                />
            </div>
        </div>

        <button 
            onClick={handleStart} 
            className="w-full mt-4 px-6 py-4 text-lg font-bold text-white bg-primary rounded-lg shadow-lg hover:bg-primary-dark transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
        >
            Iniciar Sesión
        </button>
      </div>
    </div>
  );
};

export default StartDayModal;

