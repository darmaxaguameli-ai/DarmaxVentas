import { useState, useEffect } from 'react';
import { generateEndOfDayReport } from './reportGenerator';

const CloseRegisterModal = ({ isOpen, onClose, sessionData, onEndSession, hideTags = false }) => {
  const [realCash, setRealCash] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setRealCash('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const { openingCash, transactions, initialTags, damagedTags } = sessionData;
  const sales = transactions.filter(t=>t.tipo === 'VENTA').reduce((s,t)=>s+t.amount, 0);
  const payIns = transactions.filter(t=>t.tipo === 'INGRESO').reduce((s,t)=>s+t.amount, 0);
  const payOuts = transactions.filter(t=>t.tipo === 'RETIRO').reduce((s,t)=>s+t.amount, 0);
  
  const expectedInDrawer = openingCash + sales + payIns - payOuts;
  const expectedFinalTags = (initialTags || 0) - (damagedTags || 0);

  const difference = parseFloat(realCash) - expectedInDrawer;

  const getDifferenceStyling = () => {
    if (isNaN(difference) || difference === 0) return 'text-green-500';
    if (difference > 0) return 'text-blue-500';
    return 'text-red-500';
  };
  
  const handleGenerateReportAndEnd = () => {
    if (navigator.vibrate) navigator.vibrate([50, 50, 50]); // Success vibration pattern
    const realCashInDrawer = parseFloat(realCash) || 0;
    generateEndOfDayReport({
      ...sessionData,
      expectedInDrawer,
      realCashInDrawer,
      difference: isNaN(difference) ? 0 : difference,
      finalTags: expectedFinalTags
    });
    onEndSession(realCashInDrawer);
    onClose();
  };

  return (
    <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-end sm:items-center p-0 sm:p-4"
        onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 w-full max-w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl rounded-b-none sm:rounded-b-2xl shadow-2xl transform transition-all animate-slide-up sm:animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Handle */}
        <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mt-3 mb-1 sm:hidden"></div>

        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tight">Cierre de Caja</h3>
            <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-500 hover:bg-gray-200 transition-colors">
                <span className="material-symbols-outlined">close</span>
            </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto max-h-[80vh]">
            {/* Cash Summary Cards */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl border border-gray-100 dark:border-gray-600">
                    <p className="text-xs text-gray-500 uppercase font-bold">Fondo Inicial</p>
                    <p className="text-lg font-bold text-gray-800 dark:text-white">${openingCash.toFixed(2)}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-xl border border-green-100 dark:border-green-800">
                    <p className="text-xs text-green-600 uppercase font-bold">Ventas</p>
                    <p className="text-lg font-bold text-green-700 dark:text-green-400">+${sales.toFixed(2)}</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-800">
                    <p className="text-xs text-blue-600 uppercase font-bold">Ingresos</p>
                    <p className="text-lg font-bold text-blue-700 dark:text-blue-400">+${payIns.toFixed(2)}</p>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-xl border border-yellow-100 dark:border-yellow-800">
                    <p className="text-xs text-yellow-600 uppercase font-bold">Gastos/Retiros</p>
                    <p className="text-lg font-bold text-yellow-700 dark:text-yellow-400">-${payOuts.toFixed(2)}</p>
                </div>
            </div>

            {/* Tag Inventory Summary */}
            {!hideTags && (
                <div className="bg-orange-50 dark:bg-orange-900/10 p-3 rounded-xl border border-orange-100 dark:border-orange-800/30 mb-6 flex justify-between items-center">
                    <div>
                        <p className="text-xs text-orange-600 dark:text-orange-400 uppercase font-bold mb-1">Inventario Etiquetas</p>
                        <div className="flex gap-3 text-sm text-gray-600 dark:text-gray-400">
                            <span>Inicio: <strong>{initialTags || 0}</strong></span>
                            <span>Dañadas: <strong>{damagedTags || 0}</strong></span>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-400 uppercase font-bold">Restantes</p>
                        <p className="text-xl font-black text-orange-600 dark:text-orange-400">{expectedFinalTags}</p>
                    </div>
                </div>
            )}

            <div className="bg-gray-900 text-white p-4 rounded-xl shadow-lg mb-6 flex justify-between items-center">
                <span className="text-sm font-bold uppercase tracking-wider opacity-80">Total Esperado</span>
                <span className="text-2xl font-black">${expectedInDrawer.toFixed(2)}</span>
            </div>
            
            <div className="mb-6">
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-gray-400 dark:text-gray-500">¿Cuánto hay en caja?</label>
                <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-3xl text-gray-400">$</span>
                    <input 
                        type="number"
                        inputMode="decimal"
                        value={realCash}
                        onChange={(e) => setRealCash(e.target.value)}
                        className="w-full p-4 pl-10 text-center text-4xl font-black rounded-2xl bg-gray-50 dark:bg-gray-700/50 border-2 border-transparent focus:border-primary focus:bg-white dark:focus:bg-gray-700 focus:ring-0 transition-all text-gray-800 dark:text-white"
                        placeholder="0.00"
                        autoFocus
                    />
                </div>
            </div>

            {realCash && (
                 <div className={`flex justify-between items-center p-4 rounded-xl border-2 mb-2 animate-fade-in ${
                     difference === 0 
                     ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300' 
                     : difference > 0
                        ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300'
                        : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300'
                 }`}>
                    <span className="font-bold text-sm uppercase">Diferencia</span> 
                    <span className="text-2xl font-black">
                        {difference >= 0 ? '+' : ''}${difference.toFixed(2)}
                    </span>
                </div>
            )}

            <div className="mt-6">
                <button 
                    onClick={handleGenerateReportAndEnd} 
                    className="w-full py-4 text-lg font-bold text-white bg-primary rounded-xl shadow-lg shadow-primary/30 hover:bg-primary-dark transition-all active:scale-95"
                >
                    Cerrar Turno
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default CloseRegisterModal;
