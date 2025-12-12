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
                    <label className="block text-sm font-medium mb-2 text-gray-600 dark:text-gray-300">Monto</label>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-xl text-gray-500">$</span>
                        <input 
                            type="text" // Use text to manage custom validation
                            value={amount}
                            onChange={handleAmountChange}
                            className="w-full p-3 pl-10 text-xl font-semibold rounded-lg bg-gray-100 dark:bg-gray-700 border-2 border-transparent focus:border-primary focus:ring-0 transition"
                            placeholder={placeholder}
                            autoFocus
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-2 text-gray-600 dark:text-gray-300">Descripción / Motivo</label>
                    <input 
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full p-3 rounded-lg bg-gray-100 dark:bg-gray-700 border-2 border-transparent focus:border-primary focus:ring-0 transition"
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
            className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"
            onClick={onClose}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md transform transition-all animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold text-center">Movimientos de Caja</h3>
            </div>
            
            <div className="p-2 bg-gray-100 dark:bg-gray-900 flex justify-center space-x-2">
                <TabButton active={activeTab === 'ingreso'} onClick={() => setActiveTab('ingreso')}>Ingreso</TabButton>
                <TabButton active={activeTab === 'retiro'} onClick={() => setActiveTab('retiro')}>Retiro</TabButton>
                <TabButton active={activeTab === 'cambio'} onClick={() => setActiveTab('cambio')}>Cambio de Billete</TabButton>
            </div>

            <div className="p-6">
                {renderContent()}
                <div className="flex justify-end gap-4 mt-8">
                    <button onClick={onClose} className="px-6 py-3 font-semibold text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">Cancelar</button>
                    <button onClick={getButtonAction()} className="px-6 py-3 font-semibold text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors">
                        {getButtonText()}
                    </button>
                </div>
            </div>
          </div>
        </div>
      );
};

export default CashMovementModal;
