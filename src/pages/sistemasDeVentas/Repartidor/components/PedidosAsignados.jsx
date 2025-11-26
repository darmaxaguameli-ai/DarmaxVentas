const PedidosAsignados = ({ orders, onSelectOrder, selectedOrderId }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md h-full overflow-y-auto">
      <h3 className="text-xl font-bold p-4 border-b border-gray-200 dark:border-gray-700">Pedidos Asignados</h3>
      {orders.length === 0 ? (
        <p className="p-4 text-center text-gray-500">No hay pedidos asignados.</p>
      ) : (
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {orders.map(order => (
            <li 
              key={order.id} 
              onClick={() => onSelectOrder(order)}
              className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${selectedOrderId === order.id ? 'bg-blue-50 dark:bg-blue-900/50' : ''}`}
            >
              <div className="flex justify-between">
                  <p className="font-semibold">{order.delivery.name}</p>
                  <p className="text-sm text-primary font-bold">${order.total.toFixed(2)}</p>
              </div>
              <p className="text-sm text-gray-500">{order.delivery.address}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PedidosAsignados;
