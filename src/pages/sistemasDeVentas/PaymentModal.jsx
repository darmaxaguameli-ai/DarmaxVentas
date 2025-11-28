import { useState, useEffect } from 'react';

const PaymentModal = ({ isOpen, onClose, total, onPaymentConfirm }) => {
  const [amountReceived, setAmountReceived] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setAmountReceived('');
    }
  }, [isOpen]);

  const change = (parseFloat(amountReceived) || 0) - total;

  const handleConfirm = () => {
    onPaymentConfirm({
        method: 'cash', // Assuming cash for now
        amountReceived: parseFloat(amountReceived) || total,
        total: total,
        change: change >= 0 ? change : 0,
    });
    onClose();
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleConfirm();
    }
  };

  const quickCashOptions = [50, 100, 200, 500].filter(val => val > total);
  if (!quickCashOptions.includes(Math.ceil(total / 50) * 50) && Math.ceil(total / 50) * 50 > total) {
    quickCashOptions.unshift(Math.ceil(total/50)*50);
    quickCashOptions.sort((a,b) => a-b);
  }


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
            <h3 className="text-xl font-bold">Procesar Pago</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        </div>
        <div className="p-6 text-center">
            <p className="text-lg text-gray-500 dark:text-gray-400">Total a Pagar</p>
            <p 
              className="text-6xl font-bold text-primary my-2 cursor-pointer"
              onClick={() => setAmountReceived(total.toFixed(2))}
            >
              ${total.toFixed(2)}
            </p>
            
            <div className="my-6">
                <label className="block text-sm font-medium mb-2">Monto Recibido</label>
                <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-2xl text-gray-500">$</span>
                    <input 
                        type="number"
                        value={amountReceived}
                        onChange={(e) => setAmountReceived(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="w-full p-4 pl-10 text-center text-3xl font-bold rounded-lg bg-gray-100 dark:bg-gray-700 border-2 border-transparent focus:border-primary focus:ring-0 transition"
                        placeholder="0.00"
                        autoFocus
                    />
                </div>
            </div>

            {change >= 0 && amountReceived && (
                <div className="mb-6 bg-green-50 dark:bg-green-900/50 p-4 rounded-lg">
                    <p className="text-lg text-green-800 dark:text-green-200">Cambio:</p>
                    <p className="text-4xl font-bold text-green-600 dark:text-green-400">${change.toFixed(2)}</p>
                </div>
            )}
            
            <div className="flex justify-center gap-2 mb-6">
              {quickCashOptions.map(amount => (
                <button key={amount} onClick={() => setAmountReceived(amount)} className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-full text-sm font-semibold hover:bg-primary hover:text-white transition-colors">${amount}</button>
              ))}
            </div>

            <div className="grid grid-cols-1">
                <button onClick={handleConfirm} className="px-6 py-4 text-lg font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors">Confirmar Pago</button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
