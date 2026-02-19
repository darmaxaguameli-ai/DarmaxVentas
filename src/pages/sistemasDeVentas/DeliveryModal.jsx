import { useState, useEffect } from 'react';
import { MdClose, MdStorefront, MdLocalShipping, MdLocationOn } from 'react-icons/md';

const DeliveryModal = ({ isOpen, onClose, onSave, initialData, customer }) => {
  const [method, setMethod] = useState('mostrador');
  const [collect, setCollect] = useState(false);
  const [deliveryDetails, setDeliveryDetails] = useState({ 
    name: '',
    phone: '',
    street: '',
    neighborhood: '',
    municipality: '',
    state: '',
    city: '',
    postalCode: '',
    references: '',
    lat: null,
    lng: null,
    deliveryTimeSlot: ''
  });

  useEffect(() => {
    if (isOpen) {
      setMethod(initialData.method || 'mostrador');
      setCollect(initialData.collectEmptyJugs || false);
      
      // Si hay un cliente seleccionado y no hay datos de entrega previos, pre-llenar
      if (customer && !initialData.deliveryDetails) {
        setDeliveryDetails({
          name: customer.name || '',
          phone: customer.phone || '',
          street: customer.street || '',
          neighborhood: customer.neighborhood || '',
          municipality: customer.municipality || '',
          state: customer.state || '',
          city: customer.city || '',
          postalCode: customer.postalCode || '',
          references: customer.references || '',
          lat: customer.lat || null,
          lng: customer.lng || null,
          deliveryTimeSlot: ''
        });
      } else {
        setDeliveryDetails(initialData.deliveryDetails || { 
          name: '', phone: '', street: '', neighborhood: '', municipality: '', state: '', city: '', postalCode: '', references: '', lat: null, lng: null, deliveryTimeSlot: '' 
        });
      }
    }
  }, [isOpen, initialData, customer]);

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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <div>
                <h3 className="text-xl font-black text-gray-800 dark:text-white uppercase tracking-tight">Opciones de Entrega</h3>
                <p className="text-xs text-gray-500 font-bold uppercase">Logística del Pedido</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                <MdClose className="text-2xl text-gray-400" />
            </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-2 gap-4 mb-8">
                <button 
                    onClick={() => setMethod('mostrador')} 
                    className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${method === 'mostrador' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 dark:border-gray-700 text-gray-400'}`}
                >
                    <MdStorefront className="text-4xl" />
                    <span className="font-black uppercase text-xs">Mostrador</span>
                </button>
                <button 
                    onClick={() => setMethod('domicilio')} 
                    className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${method === 'domicilio' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 dark:border-gray-700 text-gray-400'}`}
                >
                    <MdLocalShipping className="text-4xl" />
                    <span className="font-black uppercase text-xs">A Domicilio</span>
                </button>
            </div>

            {method === 'domicilio' && (
              <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300 pb-4">
                <label className="flex items-center gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-2xl cursor-pointer border border-orange-100 dark:border-orange-800/50">
                  <input 
                    type="checkbox" 
                    checked={collect} 
                    onChange={(e) => setCollect(e.target.checked)} 
                    className="h-5 w-5 rounded-lg text-orange-600 focus:ring-orange-500" 
                  />
                  <span className="text-xs font-bold text-orange-800 dark:text-orange-300 uppercase">Recolectar garrafones vacíos (+$10.00)</span>
                </label>

                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black uppercase text-gray-400 ml-2 mb-1 block">Nombre en Entrega</label>
                            <input 
                                type="text" 
                                value={deliveryDetails.name} 
                                onChange={(e) => setDeliveryDetails({...deliveryDetails, name: e.target.value})} 
                                className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-primary outline-none font-bold text-sm text-gray-800 dark:text-white"
                                placeholder="Nombre de quien recibe"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase text-gray-400 ml-2 mb-1 block">Teléfono de contacto</label>
                            <input 
                                type="tel" 
                                value={deliveryDetails.phone} 
                                onChange={(e) => setDeliveryDetails({...deliveryDetails, phone: e.target.value})} 
                                className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-primary outline-none font-bold text-sm text-gray-800 dark:text-white"
                                placeholder="5512345678"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black uppercase text-gray-400 ml-2 mb-1 block">Calle y Número</label>
                            <input 
                                type="text" 
                                value={deliveryDetails.street} 
                                onChange={(e) => setDeliveryDetails({...deliveryDetails, street: e.target.value})} 
                                className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-primary outline-none font-bold text-sm text-gray-800 dark:text-white"
                                placeholder="Av. Principal 123"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase text-gray-400 ml-2 mb-1 block">Colonia</label>
                            <input 
                                type="text" 
                                value={deliveryDetails.neighborhood} 
                                onChange={(e) => setDeliveryDetails({...deliveryDetails, neighborhood: e.target.value})} 
                                className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-primary outline-none font-bold text-sm text-gray-800 dark:text-white"
                                placeholder="Col. Centro"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="text-[10px] font-black uppercase text-gray-400 ml-2 mb-1 block">CP</label>
                            <input 
                                type="text" 
                                value={deliveryDetails.postalCode} 
                                onChange={(e) => setDeliveryDetails({...deliveryDetails, postalCode: e.target.value})} 
                                className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-primary outline-none font-bold text-sm text-gray-800 dark:text-white"
                                placeholder="00000"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="text-[10px] font-black uppercase text-gray-400 ml-2 mb-1 block">Franja Horaria / Hora</label>
                            <input 
                                type="text" 
                                value={deliveryDetails.deliveryTimeSlot} 
                                onChange={(e) => setDeliveryDetails({...deliveryDetails, deliveryTimeSlot: e.target.value})} 
                                className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-primary outline-none font-bold text-sm text-gray-800 dark:text-white"
                                placeholder="Ej. 10:00 AM o Mañana"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black uppercase text-gray-400 ml-2 mb-1 block">Referencias</label>
                        <input 
                            type="text" 
                            value={deliveryDetails.references} 
                            onChange={(e) => setDeliveryDetails({...deliveryDetails, references: e.target.value})} 
                            className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-primary outline-none font-bold text-sm text-gray-800 dark:text-white"
                            placeholder="Ej. Portón negro, frente al Oxxo"
                        />
                    </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-8">
              <button 
                onClick={onClose} 
                className="flex-1 py-4 rounded-2xl bg-gray-100 dark:bg-gray-700 text-gray-500 font-black uppercase text-xs"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave} 
                className="flex-[2] py-4 rounded-2xl bg-primary text-white font-black uppercase text-xs shadow-lg shadow-primary/20 active:scale-95 transition-all"
              >
                Confirmar Logística
              </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryModal;