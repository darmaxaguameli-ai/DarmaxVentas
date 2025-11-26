import { useState } from 'react';

const StartDayModal = ({ onStartSession }) => {
  const [amount, setAmount] = useState('');

  const handleStart = () => {
    onStartSession(parseFloat(amount) || 0);
  };

  return (
    <div className="fixed inset-0 bg-gray-100 dark:bg-gray-900 z-50 flex justify-center items-center">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-sm text-center">
        <h2 className="text-2xl font-bold mb-4">Iniciar Caja</h2>
        <p className="mb-6 text-gray-600 dark:text-gray-400">Ingresa el monto inicial de efectivo en la caja para comenzar el día.</p>
        
        <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Monto Inicial</label>
            <input 
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-3 text-center text-xl rounded-md bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600"
                placeholder="0.00"
                autoFocus
            />
        </div>

        <button 
            onClick={handleStart} 
            className="w-full mt-4 px-6 py-3 text-lg font-semibold text-white bg-primary rounded-lg hover:bg-primary/90"
        >
            Iniciar Sesión de Venta
        </button>
      </div>
    </div>
  );
};

export default StartDayModal;
