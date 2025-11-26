import { useState } from 'react';

const DeliveryModal = ({ isOpen, onClose, onSave, initialData }) => {
  const [method, setMethod] = useState(initialData.method);
  const [collect, setCollect] = useState(initialData.collectEmptyJugs);
  const [deliveryDetails, setDeliveryDetails] = useState(initialData.deliveryDetails || { 
    address: '', 
    phone: '', 
    references: '', 
    name: '' 
  });

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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-6">Opciones de Entrega</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <button onClick={() => setMethod('mostrador')} className={`p-6 rounded-lg border-2 text-center ${method === 'mostrador' ? 'border-primary' : 'border-gray-300'}`}>
                <h3 className="font-bold">Recoger en Mostrador</h3>
            </button>
            <button onClick={() => setMethod('domicilio')} className={`p-6 rounded-lg border-2 text-center ${method === 'domicilio' ? 'border-primary' : 'border-gray-300'}`}>
                <h3 className="font-bold">Entrega a Domicilio</h3>
            </button>
        </div>

        {method === 'domicilio' && (
          <div className="p-4 border rounded-md">
            <label className="flex items-center gap-3 cursor-pointer mb-4">
              <input type="checkbox" checked={collect} onChange={(e) => setCollect(e.target.checked)} className="h-5 w-5 rounded text-primary" />
              <span>Recolectar garrafones vacíos (Costo extra: $10.00)</span>
            </label>
            <div className="space-y-2">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre</label>
                <input type="text" value={deliveryDetails.name} onChange={(e) => setDeliveryDetails({...deliveryDetails, name: e.target.value})} placeholder="Nombre del Cliente" className="w-full p-2 rounded bg-gray-100 dark:bg-gray-700"/>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Dirección</label>
                <input type="text" value={deliveryDetails.address} onChange={(e) => setDeliveryDetails({...deliveryDetails, address: e.target.value})} placeholder="Dirección de Entrega" className="w-full p-2 rounded bg-gray-100 dark:bg-gray-700"/>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Teléfono</label>
                <input type="tel" value={deliveryDetails.phone} onChange={(e) => setDeliveryDetails({...deliveryDetails, phone: e.target.value})} placeholder="Número de Teléfono" className="w-full p-2 rounded bg-gray-100 dark:bg-gray-700"/>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Referencias</label>
                <input type="text" value={deliveryDetails.references} onChange={(e) => setDeliveryDetails({...deliveryDetails, references: e.target.value})} placeholder="Referencias (Ej. Edificio, color de casa)" className="w-full p-2 rounded bg-gray-100 dark:bg-gray-700"/>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-4 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg">Cancelar</button>
          <button onClick={handleSave} className="px-4 py-2 text-white bg-primary rounded-lg">Guardar</button>
        </div>
      </div>
    </div>
  );
};

export default DeliveryModal;
