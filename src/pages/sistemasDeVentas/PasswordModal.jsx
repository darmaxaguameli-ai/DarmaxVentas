import { useState, useEffect } from 'react';

const PasswordModal = ({ isOpen, onClose, onConfirm }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError('');
    }
  }, [isOpen]);

  const handleConfirm = () => {
    // Hardcoded password for now
    if (password === 'darmax') {
      onConfirm();
      onClose();
    } else {
      setError('Contraseña incorrecta');
      setTimeout(() => setError(''), 3000); // Clear error after 3 seconds
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleConfirm();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"
        onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm text-center transform transition-all animate-fade-in-up p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-4">Se requiere autorización</h2>
        <p className="mb-6 text-gray-500 dark:text-gray-400">Ingresa la contraseña de administrador para continuar.</p>
        
        <div className="mb-4">
            <label className="sr-only">Contraseña</label>
            <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                className={`w-full p-3 text-center text-2xl tracking-widest font-bold rounded-lg bg-gray-100 dark:bg-gray-700 border-2 transition-colors ${error ? 'border-red-500' : 'border-transparent focus:border-primary'} focus:ring-0`}
                autoFocus
            />
            {error && <p className="text-red-500 text-sm mt-2 animate-shake">{error}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4 mt-8">
            <button onClick={onClose} className="px-6 py-3 font-semibold text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">Cancelar</button>
            <button onClick={handleConfirm} className="px-6 py-3 font-semibold text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors">Confirmar</button>
        </div>
      </div>
    </div>
  );
};

export default PasswordModal;
