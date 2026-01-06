import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import SignaturePad from './SignaturePad';
import { MdPhone, MdNavigation, MdReceipt, MdPerson, MdCheckCircle, MdEdit, MdClose, MdLocationOn } from 'react-icons/md';

const DetailSection = ({ title, icon: Icon, children }) => (
    <div className="mb-6 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
        <h4 className="text-sm font-bold uppercase text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
            {Icon && <Icon className="text-lg" />}
            {title}
        </h4>
        {children}
    </div>
);

const ActionButton = ({ href, onClick, icon: Icon, label, colorClass }) => {
    const Component = href ? 'a' : 'button';
    const props = href ? { href, target: '_blank', rel: 'noopener noreferrer' } : { onClick };

    return (
        <Component 
            {...props}
            className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold transition-all active:scale-95 shadow-sm ${colorClass}`}
        >
            {Icon && <Icon className="text-xl" />}
            {label}
        </Component>
    );
};

const DetallePedido = ({ order, onUpdateOrder }) => {
  const [showSignature, setShowSignature] = useState(false);

  useEffect(() => {
    setShowSignature(false);
  }, [order]);

  if (!order) {
    return (
        <div className="p-8 text-center text-gray-500 h-full flex flex-col justify-center items-center bg-gray-50/50 dark:bg-gray-900/50">
            <div className="w-20 h-20 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <MdReceipt className="text-4xl text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300">Sin pedido seleccionado</h3>
            <p className="text-sm text-gray-400 mt-1 max-w-xs">Toca un pedido de la lista para ver sus detalles y gestionar la entrega.</p>
        </div>
    );
  }

  const handleSaveSignature = (signature) => {
    onUpdateOrder(order.id, { status: 'ENTREGADO', signature });
    setShowSignature(false);
  };

  const handleMarkAsDelivered = () => {
    onUpdateOrder(order.id, { status: 'ENTREGADO' });
  };

  const { items, cliente, total, status, deliveryLat, deliveryLng } = order;
  const isDelivered = status === 'ENTREGADO';
  const fullAddress = [cliente.street, cliente.neighborhood, cliente.city, cliente.postalCode].filter(Boolean).join(', ');

  // Robust coordinate check (Priority: Order Delivery Coords -> Client Default Coords)
  let lat = Number(deliveryLat);
  let lng = Number(deliveryLng);
  let hasCoordinates = Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0;

  if (!hasCoordinates) {
      lat = Number(cliente.lat);
      lng = Number(cliente.lng);
      hasCoordinates = Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0;
  }

  // Build Navigation URLs
  // Documentation: https://waze.com/ul?ll=40.75889500%2C-73.98513100&navigate=yes&zoom=17
  const wazeUrl = hasCoordinates
      ? `https://waze.com/ul?ll=${lat}%2C${lng}&navigate=yes&zoom=17`
      : `https://waze.com/ul?q=${encodeURIComponent(fullAddress)}&navigate=yes`;

  return (
    <div className="p-4 lg:p-6 bg-white dark:bg-gray-800 h-full flex flex-col relative">
      
      {/* Scrollable Content */}
      <div className="flex-grow overflow-y-auto custom-scrollbar space-y-4 pb-20 lg:pb-0">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-2">
            <div>
                <h2 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight">
                    {formatCurrency(total)}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total a cobrar</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${isDelivered ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                {status.replace('_', ' ')}
            </div>
        </div>

        {/* Customer Info */}
        <DetailSection title="Cliente" icon={MdPerson}>
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-lg font-bold text-gray-800 dark:text-white mb-1">{cliente.name}</p>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 leading-relaxed">{fullAddress}</p>
                </div>
                {hasCoordinates && (
                    <div title="Ubicación precisa verificada" className="bg-green-100 text-green-600 p-1.5 rounded-lg">
                        <MdLocationOn className="text-xl" />
                    </div>
                )}
            </div>
            
            {cliente.references && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-100 dark:border-yellow-900/30 mb-3">
                    <p className="text-xs text-yellow-700 dark:text-yellow-400 font-bold mb-1">Referencias:</p>
                    <p className="text-sm text-yellow-800 dark:text-yellow-300 italic">"{cliente.references}"</p>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                 <ActionButton 
                    href={`tel:${cliente.phone}`} 
                    icon={MdPhone} 
                    label="Llamar" 
                    colorClass="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
                />
                <ActionButton 
                    href={wazeUrl}
                    icon={MdNavigation} 
                    label="Ir con Waze" 
                    colorClass="bg-cyan-50 text-cyan-700 hover:bg-cyan-100 dark:bg-cyan-900/30 dark:text-cyan-300 flex-1"
                />
            </div>
        </DetailSection>

        {/* Products */}
        <DetailSection title="Productos" icon={MdReceipt}>
          <ul className="space-y-3">
            {items.map(item => (
              <li key={item.id} className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700/50 pb-2 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                    <span className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold w-8 h-8 rounded-lg flex items-center justify-center text-sm">
                        {item.quantity}
                    </span>
                    <span className="text-gray-700 dark:text-gray-300 font-medium">
                        {item.name || item.jugBrandName}
                    </span>
                </div>
                <span className="font-bold text-gray-800 dark:text-white">
                    {formatCurrency(item.price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
        </DetailSection>

        {/* Signature Area (Portal to Body) */}
        {showSignature && !isDelivered && createPortal(
          <div className="fixed inset-0 z-[5000] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-fade-in">
             <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-white">Firma de Recibido</h3>
                    <button onClick={() => setShowSignature(false)} className="p-2 hover:bg-gray-100 rounded-full dark:hover:bg-gray-700 dark:text-white">
                        <MdClose className="text-xl" />
                    </button>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-900">
                    <SignaturePad onSave={handleSaveSignature} onCancel={() => setShowSignature(false)} />
                </div>
             </div>
          </div>,
          document.body // Target: Body
        )}

        {isDelivered && (
          <div className="p-6 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 text-center animate-fade-in">
            <div className="bg-green-100 dark:bg-green-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                <MdCheckCircle className="text-4xl text-green-600 dark:text-green-200" />
            </div>
            <h3 className="font-bold text-xl text-green-800 dark:text-green-200 mb-1">¡Pedido Entregado!</h3>
            <p className="text-green-700 dark:text-green-300 text-sm">Esta orden ha sido completada exitosamente.</p>
          </div>
        )}
      </div>
      
      {/* Bottom Action Bar (Sticky on Mobile) */}
      {!isDelivered && (
        <div className="mt-auto pt-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex gap-3 sticky bottom-0 z-10">
          <button 
              onClick={() => setShowSignature(true)}
              className="flex-1 bg-gray-900 text-white dark:bg-white dark:text-gray-900 py-4 rounded-xl font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-gray-200 dark:shadow-none"
          >
              <MdEdit className="text-xl" />
              Firmar
          </button>
          <button 
              onClick={handleMarkAsDelivered}
              className="flex-1 bg-primary text-white py-4 rounded-xl font-bold hover:bg-primary-dark transition-colors flex items-center justify-center gap-2 shadow-lg shadow-primary/30"
          >
              <MdCheckCircle className="text-xl" />
              Entregar
          </button>
        </div>
      )}
    </div>
  );
};

// Helper for currency formatting if not available in scope (though it should be imported if used, but for safety in this isolated component file)
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
    }).format(amount);
};

export default DetallePedido;
