const UserPlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.375 12.375 0 0110.5 21.75c-2.551 0-4.863-.868-6.682-2.315z" />
    </svg>
);

const TruckIconSvg = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125V14.25m-17.25 4.5v-9m17.25 9v-9m-1.344-6.392l-2.25-2.25a1.125 1.125 0 00-1.591 0L12 7.5v7.5m0 0l-2.25 2.25a1.125 1.125 0 01-1.591 0l-2.25-2.25m0 0l2.25-2.25a1.125 1.125 0 00-1.591-1.591l-2.25 2.25" />
    </svg>
)

const TrashIconSvg = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
)


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
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Resumen de Orden</h2>
      </div>

      {/* Customer & Delivery */}
      <div className="p-4 grid grid-cols-2 gap-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          {customer ? (
              <div className="bg-blue-50 dark:bg-blue-900/50 p-3 rounded-lg relative group">
                <p className="text-xs text-blue-800 dark:text-blue-300 font-bold uppercase">CLIENTE</p>
                <div className="pr-5">
                    <p className="font-bold text-gray-800 dark:text-white truncate">{customer.name || 'Cliente'}</p>
                    <p className="text-sm text-primary font-semibold">{customer.phone}</p>
                </div>
                <button onClick={onRemoveCustomer} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                </button>
              </div>
          ) : (
            <button onClick={onCustomerSelect} className="w-full text-left flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 dark:bg-gray-700/50 dark:hover:bg-gray-700 transition-colors">
                <UserPlusIcon />
                <div>
                    <p className="font-semibold text-gray-700 dark:text-gray-200">Agregar Cliente</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Opcional</p>
                </div>
            </button>
          )}

          <button onClick={onDeliverySelect} className="w-full text-left flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 dark:bg-gray-700/50 dark:hover:bg-gray-700 transition-colors">
            <TruckIconSvg />
            <div>
                <p className="font-semibold text-gray-700 dark:text-gray-200">Entrega</p>
                <p className="text-sm text-primary capitalize font-bold">{deliveryMethod}</p>
            </div>
        </button>
      </div>
      
      {/* Items */}
      <div className="flex-grow p-4 space-y-4 overflow-y-auto custom-scrollbar">
        {orderItems.length === 0 ? (
            <div className="text-center text-gray-400 dark:text-gray-500 flex flex-col items-center justify-center h-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="mt-4 text-lg font-medium">Tu carrito está vacío</p>
                <p className="text-sm text-gray-400">Agrega productos para comenzar una venta.</p>
            </div>
        ) : (
            orderItems.map(item => (
                <div key={item.id} className="flex items-center gap-3 animate-fade-in">
                    <div className="flex-grow">
                        <p className="font-semibold text-gray-800 dark:text-white">{item.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">${item.price.toFixed(2)} c/u</p>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-full">
                        <button onClick={() => onQuantityChange(item.id, item.quantity - 1)} className="h-8 w-8 rounded-full text-lg font-bold flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">-</button>
                        <span className="w-8 text-center font-bold text-primary">{item.quantity}</span>
                        <button onClick={() => onQuantityChange(item.id, item.quantity + 1)} className="h-8 w-8 rounded-full text-lg font-bold flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">+</button>
                    </div>
                    <p className="w-20 text-right font-bold text-gray-800 dark:text-white">${(item.price * item.quantity).toFixed(2)}</p>
                    <button onClick={() => onRemoveItem(item.id)} className="ml-1 flex-shrink-0 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                        <TrashIconSvg />
                    </button>
                </div>
            ))
        )}
      </div>

      {/* Totals & Checkout */}
      {orderItems.length > 0 && (
        <div className="flex-shrink-0 p-5 border-t border-gray-200 dark:border-gray-700 space-y-3 bg-gray-50 dark:bg-gray-900/50 rounded-b-2xl">
            <div className="flex justify-between text-md">
                <span className="text-gray-600 dark:text-gray-300">Subtotal</span>
                <span className="font-semibold text-gray-800 dark:text-white">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-md">
                <span className="text-gray-600 dark:text-gray-300">Envío</span>
                <span className="font-semibold text-gray-800 dark:text-white">${shippingCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-2xl font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-gray-600 mt-2">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
            </div>
            <button 
                onClick={onCheckout}
                disabled={orderItems.length === 0}
                className="w-full bg-primary text-white py-4 rounded-lg font-bold text-lg hover:bg-primary-dark transition-all shadow-lg hover:shadow-xl disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H4a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Proceder al Pago
            </button>
        </div>
      )}
    </div>
  );
};

export default OrderSummary;
