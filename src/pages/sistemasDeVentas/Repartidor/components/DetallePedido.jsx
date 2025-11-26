import { useState } from 'react';
import SignaturePad from './SignaturePad';

const DetallePedido = ({ order, onUpdateOrder }) => {
  const [showSignature, setShowSignature] = useState(false);

  if (!order) {
    return <div className="p-4 text-center text-gray-500">Selecciona un pedido para ver los detalles</div>;
  }

  const handleSaveSignature = (signature) => {
    onUpdateOrder(order.id, { status: 'DELIVERED', signature });
    setShowSignature(false);
  };

  const handleMarkAsDelivered = () => {
    // If you don't need a signature, you can just update the status
    if(!showSignature){
        onUpdateOrder(order.id, { status: 'DELIVERED' });
    }
  };

  const { customer, items, delivery, total } = order;

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md flex flex-col h-full">
      <h3 className="text-xl font-bold mb-4">Detalle del Pedido</h3>
      <div className="flex-grow">
        <div className="mb-4">
          <p className="font-semibold">Cliente:</p>
          <p>{delivery.name}</p>
          <p>{delivery.address}</p>
          <p>{delivery.phone}</p>
          {delivery.references && <p className="text-sm text-gray-500">Referencias: {delivery.references}</p>}
        </div>
        <div className="mb-4">
          <p className="font-semibold">Items:</p>
          <ul className="list-disc pl-5">
            {items.map(item => (
              <li key={item.id}>{item.product.name} x {item.quantity}</li>
            ))}
          </ul>
        </div>
        <div className="mb-4">
            <p className="font-semibold">Total del Pedido:</p>
            <p className="text-2xl font-bold text-primary">${total.toFixed(2)}</p>
        </div>

        {showSignature && <SignaturePad onSave={handleSaveSignature} />}
      </div>
      
      <div className="mt-auto flex flex-col gap-2">
        {!showSignature && (
            <button 
                onClick={() => setShowSignature(true)}
                className="w-full bg-blue-500 text-white py-3 rounded-lg font-bold hover:bg-blue-600"
            >
                Firmar de Recibido
            </button>
        )}
        <button 
            onClick={handleMarkAsDelivered}
            className="w-full bg-green-500 text-white py-3 rounded-lg font-bold hover:bg-green-600"
        >
            Marcar como Entregado
        </button>
      </div>
    </div>
  );
};

export default DetallePedido;
