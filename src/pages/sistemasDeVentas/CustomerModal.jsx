import { useState, useEffect } from 'react';
import { checkUser } from '../../api/apiClient';
import Swal from 'sweetalert2';

const CustomerModal = ({ isOpen, onClose, onCustomerAdd }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [foundCustomer, setFoundCustomer] = useState(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm) return;
    setLoading(true);
    setFoundCustomer(null);
    setSearched(false);

    try {
        // Try searching by phone first
        const user = await checkUser(searchTerm, 'phone');
        setFoundCustomer(user);
    } catch (error) {
        // If not found by phone, try by customId
        try {
             const userById = await checkUser(searchTerm, 'customId');
             setFoundCustomer(userById);
        } catch (err) {
             // Not found in either
             console.log("User not found");
        }
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
    }
  }, [isOpen]);

  const handleAddCustomer = () => {
    onCustomerAdd(foundCustomer);
    onClose();
  };
  
  const handleAddNewCustomer = () => {
    // Pass a temporary object. The parent component (NewOrderFlow) must handle creation.
    onCustomerAdd({ 
        phone: searchTerm, 
        name: '', // Empty name to prompt user later or default
        isNew: true // Flag to indicate this needs to be created
    });
    onClose();
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
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
            <h3 className="text-xl font-bold">Buscar o Agregar Cliente</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        </div>

        <div className="p-6">
            <div className="flex gap-2 mb-4">
                <input 
                    type="tel"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full p-3 rounded-lg bg-gray-100 dark:bg-gray-700 border-2 border-transparent focus:border-primary focus:ring-0 transition"
                    placeholder="Teléfono o ID de Cliente"
                    autoFocus
                    disabled={loading}
                />
                <button 
                    onClick={handleSearch} 
                    disabled={loading}
                    className="px-6 py-3 font-semibold text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                    {loading ? '...' : 'Buscar'}
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
                            <p className="text-sm my-2">No se encontró un cliente con "{searchTerm}".</p>
                            <button onClick={handleAddNewCustomer} className="w-full mt-4 px-4 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">Crear Nuevo Cliente con este Número</button>
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
