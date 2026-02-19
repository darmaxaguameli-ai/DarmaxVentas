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
  const [signatureData, setSignatureData] = useState(null);

  useEffect(() => {
    setShowSignature(false);
    setSignatureData(order?.signature || null); // Load existing signature if any
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
    setSignatureData(signature);
    setShowSignature(false);
    // Visual feedback could be added here
  };

  const handleMarkAsDelivered = () => {
    if (!signatureData) {
        // Shake animation or alert if trying to deliver without signature
        import('sweetalert2').then(Swal => {
            Swal.default.fire({
                icon: 'warning',
                title: 'Firma Requerida',
                text: 'Debes obtener la firma del cliente antes de finalizar la entrega.',
                confirmButtonColor: '#3b82f6'
            });
        });
        return;
    }
    onUpdateOrder(order.id, { status: 'ENTREGADO', signature: signatureData });
  };

  const { items, cliente, total, status, deliveryLat, deliveryLng, deliveryTimeSlot } = order;
  const isDelivered = status === 'ENTREGADO';
  const fullAddress = [
    cliente.street, 
    cliente.neighborhood, 
    cliente.municipality,
    cliente.city, 
    cliente.state,
    cliente.postalCode
  ].filter(Boolean).join(', ');

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
                    {deliveryTimeSlot && (
                        <p className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-1 mb-2">
                            <span className="material-symbols-outlined text-sm">schedule</span>
                            Horario: {deliveryTimeSlot}
                        </p>
                    )}
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
                    label="Llamar al cliente" 
                    colorClass="bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
                />
            </div>
        </DetailSection>

        {/* Products */}
        <DetailSection title="Productos" icon={MdReceipt}>
          <div className="space-y-3">
            {items.map(item => {
              const waterTypeName = item.servicePrice?.waterType?.name;
              return (
                <div key={item.id} className="flex justify-between items-center bg-white dark:bg-gray-700/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center gap-3">
                      <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-black min-w-[32px] h-8 rounded-lg flex items-center justify-center text-sm border border-blue-100 dark:border-blue-800">
                          {item.quantity}x
                      </span>
                      <div className="flex flex-col">
                        <span className="text-gray-800 dark:text-gray-200 font-bold text-sm sm:text-base leading-tight">
                            {item.name || item.jugBrandName || 'Producto'}
                        </span>
                        {waterTypeName && (
                          <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                            Agua {waterTypeName}
                          </span>
                        )}
                      </div>
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white text-base">
                      {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              );
            })}
          </div>
        </DetailSection>

        {/* Signature Area (Portal to Body) */}
        {showSignature && !isDelivered && createPortal(
          <div className="fixed inset-0 z-[5000] bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
             <div className="bg-white dark:bg-gray-900 w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300">
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                    <h3 className="font-black text-lg text-gray-800 dark:text-white uppercase tracking-wide">Firma de Recibido</h3>
                    <button onClick={() => setShowSignature(false)} className="p-2 hover:bg-gray-200 rounded-full dark:hover:bg-gray-700 dark:text-gray-400 transition-colors">
                        <MdClose className="text-2xl" />
                    </button>
                </div>
                <div className="p-4 sm:p-6 bg-white dark:bg-gray-900">
                    <SignaturePad onSave={handleSaveSignature} onCancel={() => setShowSignature(false)} />
                </div>
             </div>
          </div>,
          document.body // Target: Body
        )}

        {isDelivered && (
          <div className="p-6 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 text-center animate-fade-in my-6">
            <div className="bg-green-100 dark:bg-green-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                <MdCheckCircle className="text-4xl text-green-600 dark:text-green-200" />
            </div>
            <h3 className="font-bold text-xl text-green-800 dark:text-green-200 mb-1">¡Pedido Entregado!</h3>
            <p className="text-green-700 dark:text-green-300 text-sm">Esta orden ha sido completada exitosamente.</p>
          </div>
        )}
      </div>
      
      {/* Bottom Action Bar (Sticky on Mobile) */}
      {!isDelivered && (
        <div className="mt-auto p-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 flex gap-3 sticky bottom-0 z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <button 
              onClick={() => setShowSignature(true)}
              className={`flex-1 py-3.5 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 border-2 ${
                  signatureData 
                  ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800'
                  : 'bg-white text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-white dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
          >
              {signatureData ? <MdCheckCircle className="text-xl" /> : <MdEdit className="text-xl" />}
              {signatureData ? 'Firmado' : 'Firmar'}
          </button>
          <button 
              onClick={handleMarkAsDelivered}
              disabled={!signatureData}
              className={`flex-[2] py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg ${
                  signatureData
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-green-500/30 active:scale-95'
                  : 'bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed shadow-none'
              }`}
          >
              <MdCheckCircle className="text-2xl" />
              Confirmar Entrega
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
