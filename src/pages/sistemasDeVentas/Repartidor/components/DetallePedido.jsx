import { useState, useEffect } from 'react';
import SignaturePad from './SignaturePad';

const DetailSection = ({ title, children }) => (
    <div className="mb-5">
        <h4 className="text-sm font-bold uppercase text-gray-500 dark:text-gray-400 mb-2">{title}</h4>
        {children}
    </div>
);

const DetallePedido = ({ order, onUpdateOrder }) => {
  const [showSignature, setShowSignature] = useState(false);

  useEffect(() => {
    setShowSignature(false);
  }, [order]);

  if (!order) {
    return (
        <div className="p-6 text-center text-gray-500 bg-white dark:bg-gray-800 rounded-lg shadow-md h-full flex flex-col justify-center items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 mx-auto text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            <h3 className="mt-4 text-lg font-medium">No hay pedido seleccionado</h3>
            <p className="text-sm text-gray-400">Selecciona un pedido de la lista para ver los detalles.</p>
        </div>
    );
  }

  const handleSaveSignature = (signature) => {
    onUpdateOrder(order.id, { status: 'DELIVERED', signature });
    setShowSignature(false);
  };

  const handleMarkAsDelivered = () => {
    onUpdateOrder(order.id, { status: 'DELIVERED' });
  };

  const { items, delivery, total, status } = order;

  const isDelivered = status === 'DELIVERED';

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md flex flex-col h-full animate-fade-in">
      <h3 className="text-2xl font-bold mb-4">Detalle del Pedido</h3>
      <div className="flex-grow overflow-y-auto custom-scrollbar pr-2">
        <DetailSection title="Cliente y Entrega">
          <p className="text-lg font-semibold text-gray-800 dark:text-white">{delivery.name}</p>
          <p className="text-gray-600 dark:text-gray-300">{delivery.address}</p>
          <a href={`tel:${delivery.phone}`} className="text-primary hover:underline">{delivery.phone}</a>
          {delivery.references && <p className="text-sm text-gray-500 mt-1">Referencias: {delivery.references}</p>}
        </DetailSection>

        <DetailSection title="Productos">
          <ul className="space-y-2">
            {items.map(item => (
              <li key={item.id} className="flex justify-between items-center">
                <span>{item.name} <span className="text-gray-500">x</span> <span className="font-bold">{item.quantity}</span></span>
                <span className="font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </DetailSection>

        <DetailSection title="Total">
            <p className="text-4xl font-bold text-primary">${total.toFixed(2)}</p>
        </DetailSection>

        {showSignature && !isDelivered && (
          <div className="animate-fade-in">
            <DetailSection title="Firma de Recibido">
              <SignaturePad onSave={handleSaveSignature} />
            </DetailSection>
          </div>
        )}

        {isDelivered && (
          <div className="p-4 rounded-lg bg-green-100 dark:bg-green-900/50 text-center">
            <p className="font-bold text-green-800 dark:text-green-200">¡Pedido Entregado!</p>
          </div>
        )}
      </div>
      
      {!isDelivered && (
        <div className="mt-auto flex-shrink-0 flex flex-col sm:flex-row gap-2 pt-4">
          <button 
              onClick={() => setShowSignature(true)}
              className="w-full bg-blue-500 text-white py-3 rounded-lg font-bold hover:bg-blue-600 transition-colors disabled:bg-gray-400"
              disabled={showSignature}
          >
              Firmar de Recibido
          </button>
          <button 
              onClick={handleMarkAsDelivered}
              className="w-full bg-green-500 text-white py-3 rounded-lg font-bold hover:bg-green-600 transition-colors"
          >
              Marcar como Entregado
          </button>
        </div>
      )}
    </div>
  );
};

export default DetallePedido;
