import { useState } from 'react';

const CustomerModal = ({ isOpen, onClose, onCustomerAdd }) => {
  const [phone, setPhone] = useState('');

  const handleSubmit = () => {
    onCustomerAdd({ phone });
    setPhone('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-4">Agregar Cliente</h2>
        <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Número de Teléfono</label>
            <input 
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2 rounded-md bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600"
                placeholder="Ej. 55 1234 5678"
            />
        </div>
        <div className="flex justify-end gap-4 mt-6">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg">Cancelar</button>
            <button onClick={handleSubmit} className="px-4 py-2 text-sm text-white bg-primary rounded-lg">Guardar Cliente</button>
        </div>
      </div>
    </div>
  );
};

export default CustomerModal;
