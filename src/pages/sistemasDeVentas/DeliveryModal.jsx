import { useState, useEffect } from 'react';

const DeliveryModal = ({ isOpen, onClose, onSave, initialData }) => {
  const [method, setMethod] = useState('mostrador');
  const [collect, setCollect] = useState(false);
  const [deliveryDetails, setDeliveryDetails] = useState({ 
    address: '', 
    phone: '', 
    references: '', 
    name: '' 
  });

  useEffect(() => {
    if (isOpen) {
      setMethod(initialData.method || 'mostrador');
      setCollect(initialData.collectEmptyJugs || false);
      setDeliveryDetails(initialData.deliveryDetails || { address: '', phone: '', references: '', name: '' });
    }
  }, [isOpen, initialData]);

  const handleSave = () => {
    onSave({
      method,
      collectEmptyJugs: method === 'domicilio' ? collect : false,
      deliveryDetails: method === 'domicilio' ? deliveryDetails : null,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"
        onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg transform transition-all animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold">Opciones de Entrega</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        </div>

        <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <button onClick={() => setMethod('mostrador')} className={`p-6 rounded-lg border-2 text-center transition-colors ${method === 'mostrador' ? 'border-primary bg-primary/10' : 'border-gray-300 dark:border-gray-600 hover:border-primary/50'}`}>
                    <h3 className="font-bold text-lg">Recoger en Mostrador</h3>
                </button>
                <button onClick={() => setMethod('domicilio')} className={`p-6 rounded-lg border-2 text-center transition-colors ${method === 'domicilio' ? 'border-primary bg-primary/10' : 'border-gray-300 dark:border-gray-600 hover:border-primary/50'}`}>
                    <h3 className="font-bold text-lg">Entrega a Domicilio</h3>
                </button>
            </div>

            {method === 'domicilio' && (
              <div className="p-4 border dark:border-gray-700 rounded-md animate-fade-in">
                <label className="flex items-center gap-3 cursor-pointer mb-4">
                  <input type="checkbox" checked={collect} onChange={(e) => setCollect(e.target.checked)} className="h-5 w-5 rounded text-primary focus:ring-primary" />
                  <span>Recolectar garrafones vacíos (Costo extra: $10.00)</span>
                </label>
                <div className="space-y-4">
                    <input type="text" value={deliveryDetails.name} onChange={(e) => setDeliveryDetails({...deliveryDetails, name: e.target.value})} placeholder="Nombre del Cliente" className="w-full p-3 rounded-md bg-gray-100 dark:bg-gray-700 border-2 border-transparent focus:border-primary focus:ring-0 transition"/>
                    <input type="text" value={deliveryDetails.address} onChange={(e) => setDeliveryDetails({...deliveryDetails, address: e.target.value})} placeholder="Dirección de Entrega" className="w-full p-3 rounded-md bg-gray-100 dark:bg-gray-700 border-2 border-transparent focus:border-primary focus:ring-0 transition"/>
                    <input type="tel" value={deliveryDetails.phone} onChange={(e) => setDeliveryDetails({...deliveryDetails, phone: e.target.value})} placeholder="Número de Teléfono" className="w-full p-3 rounded-md bg-gray-100 dark:bg-gray-700 border-2 border-transparent focus:border-primary focus:ring-0 transition"/>
                    <input type="text" value={deliveryDetails.references} onChange={(e) => setDeliveryDetails({...deliveryDetails, references: e.target.value})} placeholder="Referencias (Ej. Edificio, color de casa)" className="w-full p-3 rounded-md bg-gray-100 dark:bg-gray-700 border-2 border-transparent focus:border-primary focus:ring-0 transition"/>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-4 mt-8">
              <button onClick={onClose} className="px-6 py-3 font-semibold text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">Cancelar</button>
              <button onClick={handleSave} className="px-6 py-3 font-semibold text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors">Guardar</button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryModal;
