import { useState, useEffect } from 'react';

const CashDrawerModal = ({ isOpen, onClose, onConfirm, defaultType = 'in' }) => {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [type, setType] = useState(defaultType);

  useEffect(() => {
    if (isOpen) {
      setType(defaultType);
    }
  }, [isOpen, defaultType]);

  const handleConfirm = () => {
    onConfirm({
      amount: parseFloat(amount),
      reason,
      type,
    });
    setAmount('');
    setReason('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Movimiento de Caja</h2>
        
        <div className="flex justify-center mb-6">
            <div className="bg-gray-200 dark:bg-gray-700 p-1 rounded-lg flex">
                <button onClick={() => setType('in')} className={`px-4 py-1 rounded-md text-sm font-semibold ${type === 'in' ? 'bg-white dark:bg-gray-900 shadow' : ''}`}>Ingreso</button>
                <button onClick={() => setType('out')} className={`px-4 py-1 rounded-md text-sm font-semibold ${type === 'out' ? 'bg-white dark:bg-gray-900 shadow' : ''}`}>Retiro</button>
            </div>
        </div>

        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium mb-1">Monto</label>
                <input 
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full p-2 rounded-md bg-gray-100 dark:bg-gray-700"
                    placeholder="0.00"
                />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">Motivo</label>
                <input 
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full p-2 rounded-md bg-gray-100 dark:bg-gray-700"
                    placeholder="Ej. Cambio para cliente, retiro del día"
                />
            </div>
        </div>

        <div className="flex justify-end gap-4 mt-6">
            <button onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg">Cancelar</button>
            <button onClick={handleConfirm} className="px-4 py-2 text-white bg-primary rounded-lg">Confirmar Movimiento</button>
        </div>
      </div>
    </div>
  );
};

export default CashDrawerModal;
