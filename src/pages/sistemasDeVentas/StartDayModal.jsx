import { useState } from 'react';
import Swal from 'sweetalert2';
import { useHaptic } from '../../hooks/useHaptic';
import { MdPayments, MdStyle, MdPlayArrow } from 'react-icons/md';

const StartDayModal = ({ onStartSession, hideTags = false }) => {
  const [amount, setAmount] = useState('');
  const [initialTags, setInitialTags] = useState('');
  const { impact } = useHaptic();

  const handleStart = () => {
    impact('medium');
    
    const parsedAmount = parseFloat(amount);
    const parsedTags = hideTags ? 0 : parseInt(initialTags, 10);

    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
        Swal.fire({
            title: 'Monto inválido',
            text: 'Debes ingresar un monto inicial mayor a 0.',
            icon: 'warning',
            confirmButtonColor: '#4f46e5'
        });
        return;
    }

    if (!hideTags && (initialTags === '' || isNaN(parsedTags) || parsedTags < 0)) {
        Swal.fire({
            title: 'Etiquetas faltantes',
            text: 'Debes ingresar la cantidad de etiquetas iniciales.',
            icon: 'warning',
            confirmButtonColor: '#4f46e5'
        });
        return;
    }

    onStartSession(parsedAmount, parsedTags);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[1000] flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in slide-in-from-bottom-10 duration-500">
        
        {/* Header Visual */}
        <div className="bg-primary/5 p-8 text-center border-b border-primary/10">
            <div className="w-20 h-20 bg-primary text-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-primary/20 rotate-3">
                <MdPayments className="text-4xl" />
            </div>
            <h2 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tight">Abrir Caja</h2>
            <p className="text-sm text-gray-500 font-bold uppercase tracking-widest mt-1">Inicio de Jornada</p>
        </div>
        
        <div className="p-8 space-y-6">
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-4 tracking-[0.2em]">Efectivo Inicial</label>
                <div className="relative group">
                    <span className="absolute inset-y-0 left-6 flex items-center text-2xl font-black text-primary transition-transform group-focus-within:scale-110">$</span>
                    <input 
                        type="number"
                        inputMode="decimal"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full py-6 px-12 text-center text-4xl font-black rounded-3xl bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-primary focus:bg-white dark:focus:bg-gray-800 outline-none transition-all text-gray-800 dark:text-white"
                        placeholder="0.00"
                        autoFocus
                    />
                </div>
            </div>

            {!hideTags && (
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-4 tracking-[0.2em]">Folios de Etiquetas</label>
                    <div className="relative group">
                        <span className="absolute inset-y-0 left-6 flex items-center text-2xl font-black text-orange-500">
                            <MdStyle />
                        </span>
                        <input 
                            type="number"
                            inputMode="numeric"
                            value={initialTags}
                            onChange={(e) => setInitialTags(e.target.value)}
                            className="w-full py-5 px-12 text-center text-3xl font-black rounded-3xl bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-orange-500 focus:bg-white dark:focus:bg-gray-800 outline-none transition-all text-gray-800 dark:text-white"
                            placeholder="0"
                        />
                    </div>
                </div>
            )}

            <button 
                onClick={handleStart} 
                className="w-full py-5 text-sm font-black uppercase tracking-[0.2em] text-white bg-primary rounded-2xl shadow-xl shadow-primary/25 hover:bg-primary-dark active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
                <MdPlayArrow className="text-xl" />
                Comenzar Turno
            </button>
        </div>
      </div>
    </div>
  );
};

export default StartDayModal;