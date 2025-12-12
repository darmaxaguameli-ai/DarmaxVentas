import { useState, useEffect } from 'react';
import { generateEndOfDayReport } from './reportGenerator';

const CloseRegisterModal = ({ isOpen, onClose, sessionData, onEndSession }) => {
  const [realCash, setRealCash] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setRealCash('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const { openingCash, transactions } = sessionData;
  const sales = transactions.filter(t=>t.tipo === 'VENTA').reduce((s,t)=>s+t.amount, 0);
  const payIns = transactions.filter(t=>t.tipo === 'INGRESO').reduce((s,t)=>s+t.amount, 0);
  const payOuts = transactions.filter(t=>t.tipo === 'RETIRO').reduce((s,t)=>s+t.amount, 0);
  
  const expectedInDrawer = openingCash + sales + payIns - payOuts;

  const difference = parseFloat(realCash) - expectedInDrawer;

  const getDifferenceStyling = () => {
    if (isNaN(difference) || difference === 0) return 'text-green-500';
    if (difference > 0) return 'text-blue-500';
    return 'text-red-500';
  };
  
  const handleGenerateReportAndEnd = () => {
    const realCashInDrawer = parseFloat(realCash) || 0;
    generateEndOfDayReport({
      ...sessionData,
      expectedInDrawer,
      realCashInDrawer,
      difference: isNaN(difference) ? 0 : difference,
    });
    onEndSession(realCashInDrawer);
    onClose();
  };

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"
        onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg transform transition-all animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold">Cierre de Caja</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        </div>

        <div className="p-6">
            <div className="space-y-3 text-lg mb-6">
              <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Fondo Inicial:</span> <span className="font-semibold">${openingCash.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Ventas en Efectivo:</span> <span className="font-semibold text-green-500">+${sales.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Ingresos:</span> <span className="font-semibold text-blue-500">+${payIns.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Retiros:</span> <span className="font-semibold text-yellow-500">-${payOuts.toFixed(2)}</span></div>
              <hr className="my-2 border-gray-200 dark:border-gray-600"/>
              <div className="flex justify-between font-bold text-xl"><span className="text-gray-800 dark:text-white">Total Esperado:</span> <span className="text-primary">${expectedInDrawer.toFixed(2)}</span></div>
            </div>
            
            <div className="mb-6">
                <label className="block text-sm font-medium mb-2 text-gray-600 dark:text-gray-300">Monto Contado Real</label>
                <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-2xl text-gray-500">$</span>
                    <input 
                        type="number"
                        value={realCash}
                        onChange={(e) => setRealCash(e.target.value)}
                        className="w-full p-4 pl-10 text-center text-3xl font-bold rounded-lg bg-gray-100 dark:bg-gray-700 border-2 border-transparent focus:border-primary focus:ring-0 transition"
                        placeholder="0.00"
                        autoFocus
                    />
                </div>
            </div>

            {realCash && (
                 <div className={`flex justify-between font-bold text-xl p-4 rounded-lg bg-opacity-20 ${difference === 0 ? 'bg-green-100' : 'bg-red-100'} dark:${difference === 0 ? 'bg-green-900/50' : 'bg-red-900/50'}`}>
                    <span className="text-gray-800 dark:text-white">Diferencia:</span> 
                    <span className={getDifferenceStyling()}>
                        {difference >= 0 ? '+' : '-'}${Math.abs(difference).toFixed(2)}
                    </span>
                </div>
            )}

            <div className="flex justify-end gap-4 mt-8">
                <button onClick={onClose} className="px-6 py-3 font-semibold text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">Cancelar</button>
                <button onClick={handleGenerateReportAndEnd} className="px-6 py-3 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">Generar Reporte y Cerrar</button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default CloseRegisterModal;
