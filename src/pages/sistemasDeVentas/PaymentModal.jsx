import { useState } from 'react';

const PaymentModal = ({ isOpen, onClose, total, onPaymentConfirm }) => {
  
  const [amountReceived, setAmountReceived] = useState('');
  const change = (parseFloat(amountReceived) || 0) - total;

  const handleConfirm = () => {
    onPaymentConfirm({
        method: 'cash', // Assuming cash for now
        amountReceived: parseFloat(amountReceived) || 0,
        total: total,
        change: change,
    });
    setAmountReceived('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-sm text-center">
        <h2 className="text-2xl font-bold mb-2">Pago</h2>
        <p className="text-4xl font-bold text-primary mb-4">${total.toFixed(2)}</p>
        
        <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Monto Recibido</label>
            <input 
                type="number"
                value={amountReceived}
                onChange={(e) => setAmountReceived(e.target.value)}
                className="w-full p-3 text-center text-xl rounded-md bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600"
                placeholder="0.00"
            />
        </div>

        {change >= 0 && amountReceived && (
            <div className="mb-6">
                <p className="text-lg">Cambio:</p>
                <p className="text-3xl font-bold text-green-500">${change.toFixed(2)}</p>
            </div>
        )}
        
        <div className="grid grid-cols-2 gap-4 mt-6">
            <button onClick={onClose} className="px-6 py-3 text-lg font-semibold text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg">Cancelar</button>
            <button onClick={handleConfirm} className="px-6 py-3 text-lg font-semibold text-white bg-green-500 rounded-lg">Confirmar Pago</button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
