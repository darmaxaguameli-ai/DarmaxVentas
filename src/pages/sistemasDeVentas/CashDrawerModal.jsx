import { useState, useEffect } from 'react';

const CashDrawerModal = ({ isOpen, onClose, onConfirm, defaultType = 'in' }) => {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [type, setType] = useState(defaultType);

  useEffect(() => {
    if (isOpen) {
      setType(defaultType);
      setAmount('');
      setReason('');
    }
  }, [isOpen, defaultType]);

  const handleConfirm = () => {
    if (!amount || !reason) {
        // Maybe show an error to the user
        return;
    }
    onConfirm({
      amount: parseFloat(amount),
      reason,
      type,
    });
    onClose();
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleConfirm();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"
        onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md transform transition-all animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold">Movimiento de Caja</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        </div>

        <div className="p-6">
            <div className="flex justify-center mb-6">
                <div className="bg-gray-200 dark:bg-gray-700 p-1 rounded-lg flex">
                    <button onClick={() => setType('in')} className={`px-6 py-2 rounded-md text-sm font-semibold transition-colors ${type === 'in' ? 'bg-white dark:bg-gray-900 shadow' : 'hover:bg-white/50 dark:hover:bg-gray-900/50'}`}>Ingreso</button>
                    <button onClick={() => setType('out')} className={`px-6 py-2 rounded-md text-sm font-semibold transition-colors ${type === 'out' ? 'bg-white dark:bg-gray-900 shadow' : 'hover:bg-white/50 dark:hover:bg-gray-900/50'}`}>Retiro</button>
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Monto</label>
                    <input 
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="w-full p-3 rounded-lg bg-gray-100 dark:bg-gray-700 border-2 border-transparent focus:border-primary focus:ring-0 transition"
                        placeholder="0.00"
                        autoFocus
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Motivo</label>
                    <input 
                        type="text"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="w-full p-3 rounded-lg bg-gray-100 dark:bg-gray-700 border-2 border-transparent focus:border-primary focus:ring-0 transition"
                        placeholder="Ej. Cambio para cliente, retiro del día"
                    />
                </div>
            </div>

            <div className="flex justify-end gap-4 mt-8">
                <button onClick={onClose} className="px-6 py-3 font-semibold text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">Cancelar</button>
                <button onClick={handleConfirm} className="px-6 py-3 font-semibold text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors">Confirmar Movimiento</button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default CashDrawerModal;
