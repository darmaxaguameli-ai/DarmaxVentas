import { useState, useEffect, useRef } from 'react';
import { checkUser } from '../../api/apiClient';
import Swal from 'sweetalert2';

const CustomerModal = ({ isOpen, onClose, onCustomerAdd }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchMethod, setSearchMethod] = useState('phone'); // 'phone' | 'id'
  const [foundCustomer, setFoundCustomer] = useState(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  const handleSearch = async () => {
    if (!searchTerm) return;
    setLoading(true);
    setFoundCustomer(null);
    setSearched(false);

    try {
        let identifier = searchTerm.trim();
        let type = 'phone';

        if (searchMethod === 'id') {
             // Force ID search logic
             // If user just typed numbers, prepend CLI-
             if (/^\d+$/.test(identifier)) {
                 identifier = `CLI-${identifier}`;
             } else if (!identifier.toUpperCase().startsWith('CLI-')) {
                 // If they typed something else but didn't add CLI-, add it? 
                 // Or assume they might have typed the full ID.
                 // Let's ensure it starts with CLI- if it's numeric-ish or short
                 identifier = `CLI-${identifier.replace(/^CLI-/i, '')}`;
             }
             type = 'customId';
        } else {
             // Phone search (keep existing smart logic or strict phone?)
             // Keeping it strict to phone for this mode to avoid confusion, 
             // but allowing the smart fallback if they happen to type an ID in phone mode is fine?
             // No, let's keep it clean based on UI selection.
             type = 'phone';
        }

        // Final attempt with determined type/identifier
        const user = await checkUser(identifier, type);
        setFoundCustomer(user);

    } catch (error) {
         console.log("User not found");
    } finally {
        setLoading(false);
        setSearched(true);
    }
  };
  
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setFoundCustomer(null);
      setSearched(false);
      setSearchMethod('phone'); // Reset to phone by default
    } else {
        // Focus input on open
        setTimeout(() => {
            inputRef.current?.focus();
        }, 100);
    }
  }, [isOpen]);

  const handleAddCustomer = () => {
    onCustomerAdd(foundCustomer);
    onClose();
  };
  
  const handleAddNewCustomer = () => {
    // Pass a temporary object. The parent component (NewOrderFlow) must handle creation.
    const newCustomerData = {
        name: '',
        isNew: true
    };
    
    if (searchMethod === 'phone') {
        newCustomerData.phone = searchTerm;
    } 
    // If ID mode, we don't usually create users with custom IDs manually here, 
    // but we can pass it if needed. Usually new users are created by Phone.
    
    onCustomerAdd(newCustomerData);
    onClose();
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  const handleMethodChange = (method) => {
      setSearchMethod(method);
      setSearchTerm('');
      setFoundCustomer(null);
      setSearched(false);
      inputRef.current?.focus();
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
            <h3 className="text-xl font-bold">Buscar Cliente</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        </div>

        <div className="p-6">
            {/* Search Method Tabs */}
            <div className="flex p-1 bg-gray-100 dark:bg-gray-700 rounded-lg mb-4">
                <button 
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-bold transition-all ${searchMethod === 'phone' ? 'bg-white dark:bg-gray-600 shadow-sm text-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                    onClick={() => handleMethodChange('phone')}
                >
                    Teléfono
                </button>
                <button 
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-bold transition-all ${searchMethod === 'id' ? 'bg-white dark:bg-gray-600 shadow-sm text-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                    onClick={() => handleMethodChange('id')}
                >
                    ID Cliente
                </button>
            </div>

            <div className="flex gap-2 mb-4 relative">
                <div className="relative w-full">
                    {searchMethod === 'id' && (
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 dark:text-gray-400 font-bold">CLI-</span>
                        </div>
                    )}
                    <input 
                        ref={inputRef}
                        type={searchMethod === 'phone' ? "tel" : "text"} // 'number' can be annoying with spinners, text is fine with validation if needed
                        inputMode={searchMethod === 'phone' ? "tel" : "numeric"}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className={`w-full p-3 rounded-lg bg-gray-100 dark:bg-gray-700 border-2 border-transparent focus:border-primary focus:ring-0 transition ${searchMethod === 'id' ? 'pl-12' : ''}`}
                        placeholder={searchMethod === 'phone' ? "Número de teléfono" : "0000"}
                        disabled={loading}
                    />
                </div>
                <button 
                    onClick={handleSearch} 
                    disabled={loading}
                    className="px-6 py-3 font-semibold text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center"
                >
                    {loading ? <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span> : 'Buscar'}
                </button>
            </div>

            {searched && (
                <div className="mt-6 animate-fade-in">
                    {foundCustomer ? (
                        <div className="bg-green-50 dark:bg-green-900/50 p-4 rounded-lg">
                            <h3 className="font-bold text-green-800 dark:text-green-200 mb-2">Cliente Encontrado</h3>
                            <p className="font-semibold text-lg">{foundCustomer.name}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{foundCustomer.phone}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{foundCustomer.street} {foundCustomer.neighborhood}</p>
                            <button onClick={handleAddCustomer} className="mt-4 w-full px-4 py-3 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors">Agregar al Pedido</button>
                        </div>
                    ) : (
                        <div className="bg-yellow-50 dark:bg-yellow-900/50 p-4 rounded-lg text-center">
                            <h3 className="font-bold text-yellow-800 dark:text-yellow-200">Cliente no encontrado</h3>
                            <p className="text-sm my-2">No se encontró un cliente con {searchMethod === 'phone' ? "ese teléfono" : "ese ID"}.</p>
                            {searchMethod === 'phone' && (
                                <button onClick={handleAddNewCustomer} className="w-full mt-4 px-4 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">Crear Nuevo Cliente</button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default CustomerModal;
