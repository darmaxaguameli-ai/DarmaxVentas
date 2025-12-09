import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { fetchMyOrders } from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import ClientOrderHeader from '../../components/ClientOrderHeader'; // Importar ClientOrderHeader
import { formatDate } from '@/utils/formatters';

const statusStyles = {
  PENDIENTE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  EN_PROCESO: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  EN_RUTA: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
  ENTREGADO: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  CANCELADO: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

const StatusBadge = ({ status }) => (
  <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
    {status.replace('_', ' ')}
  </span>
);

const OrderItemDetails = ({ item }) => {
  const name = item.product?.name || item.servicePrice?.name || 'Producto desconocido';
  const waterType = item.servicePrice?.waterType?.name;
  return (
    <div className="flex items-center gap-4 py-2">
      <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
        <img src={item.product?.imageUrl || '/img/garrafones/turquesa.png'} alt={name} className="h-10 w-10 object-contain" />
      </div>
      <div>
        <p className="font-semibold text-gray-800 dark:text-gray-200">{name} {waterType && `(${waterType})`}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">Cantidad: {item.quantity} | Precio: ${(item.price).toFixed(2)}</p>
      </div>
    </div>
  );
};

const OrderCard = ({ order }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md transition-shadow hover:shadow-lg">
      <div className="p-4 md:p-6 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-grow">
            <p className="font-bold text-lg text-primary">{order.customId}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatDate(order.createdAt)}
            </p>
          </div>
          <div className="flex flex-col sm:items-end gap-2">
            <StatusBadge status={order.status} />
            <p className="font-bold text-xl text-gray-800 dark:text-white">${order.total.toFixed(2)}</p>
          </div>
          <div className="flex items-center text-gray-500 dark:text-gray-400">
            <span className={`material-symbols-outlined transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
              expand_more
            </span>
          </div>
        </div>
      </div>
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 md:p-6">
          <h4 className="font-semibold mb-2 text-gray-700 dark:text-gray-300">Detalles del Pedido:</h4>
          <div className="space-y-2">
            {order.items.map(item => <OrderItemDetails key={item.id} item={item} />)}
          </div>
        </div>
      )}
    </div>
  );
};

const MisPedidos = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const completedOrders = useMemo(() => orders.filter(order => 
    order.status === 'ENTREGADO' || order.status === 'CANCELADO'
  ), [orders]);

  const pendingOrders = useMemo(() => orders.filter(order => 
    order.status === 'PENDIENTE' || order.status === 'EN_PROCESO' || order.status === 'EN_RUTA'
  ), [orders]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const data = await fetchMyOrders();
        setOrders(data);
      } catch (err) {
        setError(err.message || 'No se pudieron cargar los pedidos.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const renderContent = () => {
    if (loading) {
      return <div className="text-center py-10">Cargando tus pedidos...</div>;
    }
    if (error) {
      return <div className="text-center py-10 text-red-500">{error}</div>;
    }
    if (orders.length === 0) {
      return (
        <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">No has realizado ningún pedido todavía.</h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400">¡Anímate a hacer tu primer pedido!</p>
          <Link to="/pedidos" className="mt-4 inline-block btn-primary">
            Hacer un Pedido
          </Link>
        </div>
      );
    }
    return (
      <div className="space-y-8 w-full">
        {/* Pedidos en Curso */}
        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-dark dark:text-white mb-4">Pedidos en Curso</h2>
          {pendingOrders.length === 0 ? (
            <div className="text-center py-5 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <p className="text-gray-500 dark:text-gray-400">No tienes pedidos en curso.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingOrders.map(order => <OrderCard key={order.id} order={order} />)}
            </div>
          )}
        </section>

        {/* Pedidos Finalizados */}
        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-dark dark:text-white mb-4">Pedidos Finalizados</h2>
          {completedOrders.length === 0 ? (
            <div className="text-center py-5 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <p className="text-gray-500 dark:text-gray-400">No tienes pedidos finalizados.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {completedOrders.map(order => <OrderCard key={order.id} order={order} />)}
            </div>
          )}
        </section>
      </div>
    );
  };

  return (
    <div className="font-display relative flex min-h-screen w-full flex-col bg-light dark:bg-dark text-dark dark:text-white overflow-x-hidden select-none">
      <div className="flex flex-1 justify-center px-4 sm:px-6 lg:px-12 py-8">
        <div className="flex w-full max-w-4xl flex-col items-center gap-10">
          <ClientOrderHeader primaryLink={{ to: '/pedidos', label: 'Hacer Pedido' }} />

          <main className="w-full flex flex-col mt-4">
            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black leading-tight tracking-[-0.03em]">Mis Pedidos</h1>
              <p className="text-text-secondary dark:text-white/70 text-base leading-normal">
                Aquí puedes ver el historial y el estado de todos tus pedidos, {user?.name}.
              </p>
            </div>
            {renderContent()}
          </main>

          <footer className="flex w-full flex-col items-center gap-6 py-10 text-center text-text-secondary dark:text-white/60">
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-8">
              <a href="#" className="text-sm sm:text-base hover:text-primary dark:hover:text-primary">Ayuda y soporte</a>
              <a href="#" className="text-sm sm:text-base hover:text-primary dark:hover:text-primary">Términos de servicio</a>
            </div>
            <p className="text-xs sm:text-sm">
              © {new Date().getFullYear()} Darmax. Todos los derechos reservados.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default MisPedidos;
