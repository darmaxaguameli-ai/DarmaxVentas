import { MdClose } from 'react-icons/md';

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
    isMobileView = false
}) => {
  return (
    <div className={`bg-white dark:bg-gray-800 flex flex-col h-full ${isMobileView ? '' : 'rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700'}`}>
      {/* Header */}
      {!isMobileView && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-black text-gray-800 dark:text-white uppercase tracking-tight">Carrito</h2>
        </div>
      )}

      {/* Customer & Delivery */}
      <div className="p-4 grid grid-cols-2 gap-3 sm:gap-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          {customer ? (
              <div className={`p-3 rounded-2xl relative group border transition-all ${customer.isNew ? 'bg-orange-50 border-orange-100 dark:bg-orange-900/20 dark:border-orange-800/50' : 'bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800/50'}`}>
                <p className={`text-[10px] font-black uppercase tracking-widest ${customer.isNew ? 'text-orange-600 dark:text-orange-400' : 'text-blue-600 dark:text-blue-400'}`}>
                    {customer.isNew ? 'Nuevo / Temporal' : 'Cliente'}
                </p>
                <div className="pr-5 min-w-0 mt-1">
                    <p className="font-black text-xs sm:text-sm text-gray-800 dark:text-white uppercase truncate">{customer.name || 'Cliente'}</p>
                    <p className="text-[10px] sm:text-xs text-gray-500 font-bold truncate">{customer.phone || 'Sin tel'}</p>
                </div>
                <button onClick={onRemoveCustomer} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                  <MdClose className="h-4 w-4" />
                </button>
              </div>
          ) : (
            <button onClick={onCustomerSelect} className="w-full text-left flex items-center gap-2 sm:gap-3 p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 dark:bg-gray-700/50 dark:hover:bg-gray-700 transition-all border border-transparent hover:border-primary/20">
                <div className="bg-primary/10 p-2 rounded-xl text-primary">
                    <UserPlusIcon />
                </div>
                <div className="min-w-0">
                    <p className="font-black text-xs uppercase text-gray-700 dark:text-gray-200 truncate tracking-tight">Cliente</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Identificar</p>
                </div>
            </button>
          )}

          <button onClick={onDeliverySelect} className={`w-full text-left flex items-center gap-2 sm:gap-3 p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 dark:bg-gray-700/50 dark:hover:bg-gray-700 transition-all border ${deliveryMethod === 'domicilio' ? 'border-orange-200 dark:border-orange-800/50' : 'border-transparent'} hover:border-primary/20 relative`}>
            <div className={`p-2 rounded-xl ${deliveryMethod === 'domicilio' ? 'bg-orange-100 text-orange-600' : 'bg-primary/10 text-primary'}`}>
                <TruckIconSvg />
            </div>
            <div className="min-w-0">
                <p className="font-black text-xs uppercase text-gray-700 dark:text-gray-200 truncate tracking-tight">Entrega</p>
                <p className={`text-[10px] uppercase font-black truncate tracking-tighter ${deliveryMethod === 'domicilio' ? 'text-orange-600' : 'text-primary'}`}>{deliveryMethod}</p>
            </div>
        </button>
      </div>
      
      {/* Items */}
      <div className="flex-grow p-4 space-y-4 overflow-y-auto custom-scrollbar">
        {orderItems.length === 0 ? (
            <div className="text-center text-gray-400 dark:text-gray-500 flex flex-col items-center justify-center h-full">
                <span className="material-symbols-outlined text-6xl opacity-20">shopping_cart</span>
                <p className="mt-4 text-sm font-black uppercase tracking-widest">Vacío</p>
            </div>
        ) : (
            orderItems.map(item => (
                <div key={item.id} className="flex items-center gap-3 animate-fade-in bg-gray-50 dark:bg-gray-900/30 p-3 rounded-2xl border border-transparent hover:border-gray-100 dark:hover:border-gray-700 transition-all">
                    <div className="flex-grow min-w-0">
                        <p className="font-black text-xs sm:text-sm text-gray-800 dark:text-white uppercase truncate">{item.name}</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold">${item.price.toFixed(2)} c/u</p>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-2 bg-white dark:bg-gray-800 p-1 rounded-xl shadow-sm">
                        <button onClick={() => onQuantityChange(item.id, item.quantity - 1)} className="h-7 w-7 rounded-lg text-lg font-bold flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">-</button>
                        <span className="w-6 text-center font-black text-primary text-sm">{item.quantity}</span>
                        <button onClick={() => onQuantityChange(item.id, item.quantity + 1)} className="h-7 w-7 rounded-lg text-lg font-bold flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">+</button>
                    </div>
                    <button onClick={() => onRemoveItem(item.id)} className="ml-1 flex-shrink-0 text-gray-300 hover:text-red-500 transition-colors">
                        <TrashIconSvg />
                    </button>
                </div>
            ))
        )}
      </div>

      {/* Totals & Checkout */}
      {orderItems.length > 0 && (
        <div className="flex-shrink-0 p-5 border-t border-gray-200 dark:border-gray-700 space-y-3 bg-gray-50 dark:bg-gray-900/50">
            <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-800 dark:text-white">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                <span className="text-gray-500">Envío / Recolección</span>
                <span className="text-gray-800 dark:text-white">${shippingCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-2xl font-black text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-gray-700 mt-2">
                <span className="uppercase text-xs tracking-[0.2em]">Total</span>
                <span className="text-primary">${total.toFixed(2)}</span>
            </div>
            <button 
                onClick={onCheckout}
                disabled={orderItems.length === 0}
                className="w-full bg-primary text-white py-4 rounded-2xl font-black uppercase text-sm hover:bg-primary-dark transition-all shadow-lg shadow-primary/25 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
            >
                <span className="material-symbols-outlined">
                    {deliveryMethod === 'domicilio' ? 'calendar_today' : 'payments'}
                </span>
                {deliveryMethod === 'domicilio' ? 'Agendar Pedido' : 'Finalizar y Cobrar'}
            </button>
        </div>
      )}
    </div>
  );
};

export default OrderSummary;