import { useState } from 'react';

const PasswordModal = ({ isOpen, onClose, onConfirm }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    // Hardcoded password for now
    if (password === 'darmax') {
      onConfirm();
      setPassword('');
      setError('');
      onClose();
    } else {
      setError('Contraseña incorrecta');
    }
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-sm text-center">
        <h2 className="text-2xl font-bold mb-4">Se requiere autorización</h2>
        <p className="mb-6 text-gray-600 dark:text-gray-400">Ingresa la contraseña de administrador para continuar.</p>
        
        <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-left">Contraseña</label>
            <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 text-center text-xl rounded-md bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600"
                autoFocus
            />
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6">
            <button onClick={handleClose} className="px-6 py-3 text-lg font-semibold text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg">Cancelar</button>
            <button onClick={handleConfirm} className="px-6 py-3 text-lg font-semibold text-white bg-primary rounded-lg">Confirmar</button>
        </div>
      </div>
    </div>
  );
};

export default PasswordModal;
