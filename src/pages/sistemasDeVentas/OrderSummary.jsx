const OrderSummary = ({ 
    orderItems,
    customer,
    deliveryMethod,
    onQuantityChange, 
    onRemoveItem,
    subtotal, 
    shippingCost, 
    total,
    onCheckout,
    onCustomerSelect,
    onDeliverySelect,
    onRemoveCustomer,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl flex flex-col h-full">
      {/* Customer */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          {customer ? (
              <div className="flex items-center justify-between">
                <div>
                    <p className="font-semibold">Cliente:</p>
                    <p className="text-primary">{customer.phone}</p>
                </div>
                <button onClick={onRemoveCustomer} className="text-red-500 text-sm">Quitar</button>
              </div>
          ) : (
            <button onClick={onCustomerSelect} className="w-full text-left flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                  {/* Icon could go here */}
                </div>
                <div>
                    <p className="font-semibold">Agregar Cliente</p>
                    <p className="text-xs text-gray-500">por número de teléfono</p>
                </div>
            </button>
          )}
      </div>

      {/* Delivery */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <button onClick={onDeliverySelect} className="w-full text-left">
            <p className="font-semibold">Entrega:</p>
            <p className="text-primary capitalize">{deliveryMethod}</p>
        </button>
      </div>
      
      {/* Items */}
      <div className="flex-grow p-4 space-y-3 overflow-y-auto">
        {orderItems.length === 0 ? (
            <p className="text-center text-gray-500">El carrito está vacío</p>
        ) : (
            orderItems.map(item => (
                <div key={item.id} className="flex items-center">
                    <div className="flex-grow">
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-sm text-gray-500">${item.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => onQuantityChange(item.id, item.quantity - 1)} className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-700 text-xs">-</button>
                        <span>{item.quantity}</span>
                        <button onClick={() => onQuantityChange(item.id, item.quantity + 1)} className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-700 text-xs">+</button>
                    </div>
                    <p className="w-16 text-right font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                    <button onClick={() => onRemoveItem(item.id)} className="ml-2 text-red-500 hover:text-red-700">X</button>
                </div>
            ))
        )}
      </div>

      {/* Totals & Checkout */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
        <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
            <span className="font-semibold">${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Envío</span>
            <span className="font-semibold">${shippingCost.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xl font-bold">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
        </div>
        <button 
            onClick={onCheckout}
            disabled={orderItems.length === 0}
            className="w-full bg-primary text-white py-4 rounded-lg font-bold text-lg hover:bg-primary/90 transition-colors disabled:bg-gray-400"
        >
            Pagar
        </button>
      </div>
    </div>
  );
};

export default OrderSummary;
