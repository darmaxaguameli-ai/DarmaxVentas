import { useState } from 'react';
import Swal from 'sweetalert2';

const TabButton = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors focus:outline-none ${
            active 
                ? 'bg-primary text-white' 
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
    >
        {children}
    </button>
);

const CashMovementModal = ({ isOpen, onClose, onSubmitTransaction }) => {
    const [activeTab, setActiveTab] = useState('ingreso'); // 'ingreso', 'retiro', 'cambio'
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');

    if (!isOpen) return null;

    const handleAmountChange = (e) => {
        // Allow only numbers and a single decimal point
        const value = e.target.value;
        if (/^\d*\.?\d*$/.test(value)) {
            setAmount(value);
        }
    };

    const handleSubmit = (type) => {
        if (navigator.vibrate) navigator.vibrate(50); // Feedback táctil
        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            Swal.fire('Error', 'Por favor, introduce un monto válido.', 'error');
            return;
        }
        if (!description.trim()) {
            Swal.fire('Error', 'Por favor, añade una descripción o motivo.', 'error');
            return;
        }

        if (type === 'cambio') {
            onSubmitTransaction({
                amount: numericAmount,
                description: `${description} (Salida por cambio)`,
                type: 'RETIRO'
            });
            onSubmitTransaction({
                amount: numericAmount,
                description: `${description} (Entrada por cambio)`,
                type: 'INGRESO'
            });
        } else {
            onSubmitTransaction({ amount: numericAmount, description, type });
        }
        
        // Reset form and close
        setAmount('');
        setDescription('');
        onClose();
    };
    
    const renderContent = () => {
        const isCambio = activeTab === 'cambio';
        const placeholder = isCambio ? "Monto del billete a cambiar" : "Monto";
        const descriptionPlaceholder = isCambio ? "Ej: Cambio de billete de $200" : "Ej: Compra de garrafón de agua";

        return (
            <div className="space-y-6">
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-gray-400 dark:text-gray-500">Monto</label>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-2xl text-gray-400">$</span>
                        <input 
                            type="text" // Use text to manage custom validation
                            inputMode="decimal"
                            value={amount}
                            onChange={handleAmountChange}
                            className="w-full p-4 pl-10 text-3xl font-black rounded-2xl bg-gray-50 dark:bg-gray-700/50 border-2 border-transparent focus:border-primary focus:bg-white dark:focus:bg-gray-700 focus:ring-0 transition-all text-gray-800 dark:text-white"
                            placeholder={placeholder}
                            autoFocus
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-gray-400 dark:text-gray-500">Motivo</label>
                    <input 
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/50 border-2 border-transparent focus:border-primary focus:bg-white dark:focus:bg-gray-700 focus:ring-0 transition-all text-gray-800 dark:text-white"
                        placeholder={descriptionPlaceholder}
                    />
                </div>
            </div>
        );
    }

    const getButtonText = () => {
        switch(activeTab) {
            case 'ingreso': return 'Registrar Ingreso';
            case 'retiro': return 'Registrar Retiro';
            case 'cambio': return 'Registrar Cambio';
            default: return 'Confirmar';
        }
    }

    const getButtonAction = () => {
        switch(activeTab) {
            case 'ingreso': return () => handleSubmit('INGRESO');
            case 'retiro': return () => handleSubmit('RETIRO');
            case 'cambio': return () => handleSubmit('cambio');
            default: return () => {};
        }
    }

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-end sm:items-center p-0 sm:p-4"
            onClick={onClose}
        >
          <div 
            className="bg-white dark:bg-gray-800 w-full max-w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl rounded-b-none sm:rounded-b-2xl shadow-2xl transform transition-all animate-slide-up sm:animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Drag Handle */}
            <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mt-3 mb-1 sm:hidden"></div>

            <div className="p-4 sm:p-6 pb-0 border-b border-transparent dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-xl font-black text-gray-800 dark:text-white">Movimientos</h3>
                <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-500 hover:bg-gray-200 transition-colors">
                    <span className="material-symbols-outlined text-lg">close</span>
                </button>
            </div>
            
            <div className="px-4 sm:px-6 mt-4">
                <div className="bg-gray-100 dark:bg-gray-900/50 p-1 rounded-xl flex">
                    <button onClick={() => setActiveTab('ingreso')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'ingreso' ? 'bg-white dark:bg-gray-700 text-green-600 shadow-sm' : 'text-gray-500'}`}>Ingreso</button>
                    <button onClick={() => setActiveTab('retiro')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'retiro' ? 'bg-white dark:bg-gray-700 text-red-500 shadow-sm' : 'text-gray-500'}`}>Retiro</button>
                    <button onClick={() => setActiveTab('cambio')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'cambio' ? 'bg-white dark:bg-gray-700 text-blue-500 shadow-sm' : 'text-gray-500'}`}>Cambio</button>
                </div>
            </div>

            <div className="p-4 sm:p-6">
                {renderContent()}
                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={getButtonAction()} className="w-full py-4 text-lg font-bold text-white bg-primary rounded-xl shadow-lg shadow-primary/30 hover:bg-primary-dark transition-all active:scale-95">
                        {getButtonText()}
                    </button>
                </div>
            </div>
          </div>
        </div>
      );
};

export default CashMovementModal;
