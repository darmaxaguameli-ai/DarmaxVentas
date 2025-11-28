const PedidosAsignados = ({ orders, onSelectOrder, selectedOrderId }) => {
  if (orders.length === 0) {
    return (
        <div className="p-6 text-center text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
            <h3 className="mt-2 text-lg font-medium">No hay pedidos pendientes</h3>
            <p className="text-sm text-gray-400">Todos los pedidos han sido completados.</p>
        </div>
    );
  }

  return (
    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
      {orders.map((order, index) => (
        <li 
          key={order.id} 
          onClick={() => onSelectOrder(order)}
          className={`p-4 cursor-pointer transition-colors relative ${selectedOrderId === order.id ? 'bg-primary/10' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
        >
          {selectedOrderId === order.id && (
            <div className="absolute left-0 top-0 h-full w-1.5 bg-primary rounded-r-full"></div>
          )}
          <div className="flex justify-between items-center mb-1">
              <p className="font-bold text-gray-800 dark:text-gray-100 truncate pr-2">{order.delivery.name}</p>
              <p className="text-sm text-primary font-bold flex-shrink-0">${order.total.toFixed(2)}</p>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{order.delivery.address}</p>
          <div className="text-xs mt-2 inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full font-semibold">
            Pedido #{index + 1}
          </div>
        </li>
      ))}
    </ul>
  );
};

export default PedidosAsignados;
