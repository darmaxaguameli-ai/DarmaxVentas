import { useState } from 'react';

const CustomerModal = ({ isOpen, onClose, onCustomerAdd }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [foundCustomer, setFoundCustomer] = useState(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = () => {
    // Mock search logic
    if (searchTerm === '5512345678') {
      setFoundCustomer({
        id: 'CL-1023',
        name: 'Juan Pérez',
        phone: '5512345678',
        address: 'Av. Siempre Viva 742, Springfield',
      });
    } else {
      setFoundCustomer(null);
    }
    setSearched(true);
  };

  const handleAddCustomer = () => {
    onCustomerAdd(foundCustomer);
    resetAndClose();
  };
  
  const handleAddNewCustomer = () => {
    // For now, just adds the phone number. A more complex flow could be added here.
    onCustomerAdd({ phone: searchTerm, name: 'Nuevo Cliente' });
    resetAndClose();
  };

  const resetAndClose = () => {
    setSearchTerm('');
    setFoundCustomer(null);
    setSearched(false);
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Buscar o Agregar Cliente</h2>
        
        <div className="flex gap-2 mb-4">
            <input 
                type="tel"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 rounded-md bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600"
                placeholder="Teléfono o ID de Cliente"
            />
            <button onClick={handleSearch} className="px-4 py-2 text-white bg-primary rounded-lg">Buscar</button>
        </div>

        {searched && (
            <div className="mt-6">
                {foundCustomer ? (
                    <div className="bg-green-50 dark:bg-green-900/50 p-4 rounded-lg">
                        <h3 className="font-bold text-green-800 dark:text-green-200">Cliente Encontrado</h3>
                        <p>{foundCustomer.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{foundCustomer.phone}</p>
                        <button onClick={handleAddCustomer} className="mt-2 w-full px-4 py-2 text-sm text-white bg-green-600 rounded-lg">Agregar al Pedido</button>
                    </div>
                ) : (
                    <div className="bg-yellow-50 dark:bg-yellow-900/50 p-4 rounded-lg text-center">
                        <h3 className="font-bold text-yellow-800 dark:text-yellow-200">Cliente no encontrado</h3>
                        <p className="text-sm my-2">No se encontró un cliente con "{searchTerm}".</p>
                        <button onClick={handleAddNewCustomer} className="w-full px-4 py-2 text-sm text-white bg-blue-600 rounded-lg">Crear Nuevo Cliente con este Número</button>
                    </div>
                )}
            </div>
        )}

        <div className="flex justify-end gap-4 mt-6">
            <button onClick={resetAndClose} className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg">Cancelar</button>
        </div>
      </div>
    </div>
  );
};

export default CustomerModal;
