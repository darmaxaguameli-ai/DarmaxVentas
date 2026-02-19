import { useState, useEffect } from 'react';
import { generateEndOfDayReport } from './reportGenerator';
import { useHaptic } from '../../hooks/useHaptic';
import { MdLockClock, MdCheckCircle, MdClose, MdTrendingUp, MdTrendingDown, MdAttachMoney, MdStyle } from 'react-icons/md';

const CloseRegisterModal = ({ isOpen, onClose, sessionData, onEndSession, hideTags = false }) => {
  const [realCash, setRealCash] = useState('');
  const { triggerSuccess } = useHaptic();

  useEffect(() => {
    if (!isOpen) {
      setRealCash('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const { openingCash, transactions, initialTags, damagedTags, orders } = sessionData;
  const sales = transactions.filter(t => t.tipo === 'VENTA').reduce((s, t) => s + t.amount, 0);
  const payIns = transactions.filter(t => t.tipo === 'INGRESO').reduce((s, t) => s + t.amount, 0);
  const payOuts = transactions.filter(t => t.tipo === 'RETIRO').reduce((s, t) => s + t.amount, 0);
  
  // Calcular sellos consumidos por ventas
  const soldJugsCount = (orders || []).reduce((total, order) => {
      return total + (order.items || []).reduce((sum, item) => sum + item.quantity, 0);
  }, 0);

  const expectedInDrawer = openingCash + sales + payIns - payOuts;
  const expectedFinalTags = (initialTags || 0) - (damagedTags || 0) - soldJugsCount;

  const difference = parseFloat(realCash) - expectedInDrawer;

  const handleGenerateReportAndEnd = () => {
    triggerSuccess();
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[1000] flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in slide-in-from-bottom-10 duration-500 max-h-[90vh]">
        
        {/* Header Visual */}
        <div className="bg-red-50 dark:bg-red-900/10 p-6 text-center border-b border-red-100 dark:border-red-900/20 relative">
            <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-white dark:hover:bg-gray-700 transition-colors"
            >
                <MdClose className="text-xl" />
            </button>
            <div className="w-16 h-16 bg-red-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xl shadow-red-600/20 -rotate-3">
                <MdLockClock className="text-3xl" />
            </div>
            <h2 className="text-xl font-black text-gray-800 dark:text-white uppercase tracking-tight">Cerrar Turno</h2>
            <p className="text-[10px] text-red-600 dark:text-red-400 font-black uppercase tracking-[0.2em] mt-1">Corte de Caja Diario</p>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
            
            {/* Resumen Financiero */}
            <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Efectivo Inicial</p>
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-200">${openingCash.toFixed(2)}</p>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50">
                    <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Ventas Totales</p>
                    <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-300">
                        <MdTrendingUp className="text-sm" />
                        <p className="text-sm font-bold">${sales.toFixed(2)}</p>
                    </div>
                </div>
                <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50">
                    <p className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">Otros Ingresos</p>
                    <p className="text-sm font-bold text-blue-700 dark:text-blue-300">+${payIns.toFixed(2)}</p>
                </div>
                <div className="p-3 rounded-2xl bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/50">
                    <p className="text-[9px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest mb-1">Gastos / Retiros</p>
                    <div className="flex items-center gap-1 text-orange-700 dark:text-orange-300">
                        <MdTrendingDown className="text-sm" />
                        <p className="text-sm font-bold">-${payOuts.toFixed(2)}</p>
                    </div>
                </div>
            </div>

            {/* Inventario de Etiquetas */}
            {!hideTags && (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-xl flex items-center justify-center">
                            <MdStyle className="text-xl" />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Etiquetas Restantes</p>
                            <p className="text-xs text-amber-800 dark:text-amber-400 font-bold">
                                {initialTags} iniciales - {damagedTags} rotas - {soldJugsCount} vendidas
                            </p>
                        </div>
                    </div>
                    <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{expectedFinalTags}</p>
                </div>
            )}

            {/* Total Esperado */}
            <div className="p-5 rounded-3xl bg-gray-900 dark:bg-black shadow-xl flex justify-between items-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-primary/10 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-1000"></div>
                <div className="relative z-10">
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Saldo Esperado en Caja</p>
                    <p className="text-3xl font-black text-white">${expectedInDrawer.toFixed(2)}</p>
                </div>
                <MdAttachMoney className="text-5xl text-white/10 relative z-10" />
            </div>

            {/* Input Efectivo Real */}
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-4 tracking-[0.2em]">Efectivo Real Entregado</label>
                <div className="relative group">
                    <span className="absolute inset-y-0 left-6 flex items-center text-2xl font-black text-primary">$</span>
                    <input 
                        type="number"
                        inputMode="decimal"
                        value={realCash}
                        onChange={(e) => setRealCash(e.target.value)}
                        className="w-full py-6 px-12 text-center text-4xl font-black rounded-3xl bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-primary focus:bg-white dark:focus:bg-gray-800 outline-none transition-all text-gray-800 dark:text-white"
                        placeholder="0.00"
                        autoFocus
                    />
                </div>
            </div>

            {realCash && (
                 <div className={`flex justify-between items-center p-4 rounded-2xl border-2 transition-all animate-fade-in ${
                     difference === 0 
                     ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300' 
                     : difference > 0
                        ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300'
                        : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300'
                 }`}>
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-widest opacity-70">Diferencia (Sobrante/Faltante)</p>
                        <p className="text-xl font-black">{difference >= 0 ? '+' : ''}${difference.toFixed(2)}</p>
                    </div>
                    <span className="text-3xl">{difference === 0 ? '✅' : difference > 0 ? '💰' : '⚠️'}</span>
                </div>
            )}

            <button 
                onClick={handleGenerateReportAndEnd} 
                disabled={!realCash}
                className="w-full py-5 text-sm font-black uppercase tracking-[0.2em] text-white bg-primary rounded-2xl shadow-xl shadow-primary/25 hover:bg-primary-dark active:scale-[0.98] disabled:opacity-50 disabled:grayscale transition-all flex items-center justify-center gap-2"
            >
                <MdCheckCircle className="text-xl" />
                Finalizar y Cerrar Caja
            </button>
        </div>
      </div>
    </div>
  );
};

export default CloseRegisterModal;