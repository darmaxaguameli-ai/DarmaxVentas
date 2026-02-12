// src/pages/PuntoDeVenta/ReportePDF.jsx
import React from 'react';

const ReportePDF = React.forwardRef(({ jornada }, ref) => {
  if (!jornada) return null;

  const totalVentas = jornada.pedidos.reduce((sum, p) => sum + p.total, 0);
  const cajaFinal = jornada.dineroInicial + totalVentas;

  return (
    <div ref={ref} className="p-10 bg-white" style={{ width: '800px' }}>
      <header className="flex justify-between items-center mb-10 pb-4 border-b">
        <div>
          <h1 className="text-4xl font-bold text-gray-800">Reporte de Jornada</h1>
          <p className="text-gray-500">Fecha: {new Date(jornada.fechaInicio).toLocaleDateString()}</p>
        </div>
        <img src="/img/logos/darmax-logo.png" alt="Logo" className="h-16" />
      </header>

      <main>
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Resumen General</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-gray-100 rounded-lg">
              <p className="text-sm text-gray-600">Dinero Inicial</p>
              <p className="text-xl font-bold">${jornada.dineroInicial.toFixed(2)}</p>
            </div>
            <div className="p-4 bg-gray-100 rounded-lg">
              <p className="text-sm text-gray-600">Total de Ventas</p>
              <p className="text-xl font-bold">${totalVentas.toFixed(2)}</p>
            </div>
            <div className="p-4 bg-blue-100 rounded-lg">
              <p className="text-sm text-blue-800">Total en Caja</p>
              <p className="text-xl font-bold text-blue-900">${cajaFinal.toFixed(2)}</p>
            </div>
             <div className="p-4 bg-gray-100 rounded-lg">
              <p className="text-sm text-gray-600">Sellos Iniciales</p>
              <p className="text-xl font-bold">{jornada.sellosIniciales}</p>
            </div>
             <div className="p-4 bg-gray-100 rounded-lg">
              <p className="text-sm text-gray-600">Pedidos Realizados</p>
              <p className="text-xl font-bold">{jornada.pedidos.length}</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Detalle de Pedidos</h2>
          <table className="w-full text-left table-auto">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-3">Hora</th>
                <th className="p-3">Tipo</th>
                <th className="p-3">Cliente</th>
                <th className="p-3">Items</th>
                <th className="p-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {jornada.pedidos.map(pedido => (
                <tr key={pedido.id} className="border-b">
                  <td className="p-3">{new Date(pedido.fecha).toLocaleTimeString()}</td>
                  <td className="p-3 capitalize">{pedido.tipo}</td>
                  <td className="p-3">{pedido.cliente?.nombre || 'Mostrador'}</td>
                  <td className="p-3">
                    {pedido.stepOneData.reduce((sum, item) => sum + item.quantity, 0)}
                  </td>
                  <td className="p-3 text-right font-bold">${pedido.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
});

export default ReportePDF;
