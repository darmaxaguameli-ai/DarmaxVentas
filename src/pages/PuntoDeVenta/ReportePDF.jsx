// src/pages/PuntoDeVenta/ReportePDF.jsx
import React from 'react';

const ReportePDF = React.forwardRef(({ jornada }, ref) => {
  if (!jornada) return null;

  const totalVentas = jornada.pedidos.reduce((sum, p) => sum + p.total, 0);
  const cajaFinal = jornada.dineroInicial + totalVentas;

  // Calculo de sellos restantes
  const sellosConsumidos = jornada.pedidos.reduce((totalConsumidos, pedido) => {
    if (pedido.itemsDetalle && pedido.itemsDetalle.length > 0) {
      pedido.itemsDetalle.forEach(waterType => {
        waterType.assignments.forEach(assignment => {
          if (!pedido.cobrarRecoleccion) { // Si no se cobró recolección, se asume que se entregó un garrafón nuevo
              totalConsumidos += assignment.quantity;
          }
        });
      });
    }
    return totalConsumidos;
  }, 0);
  const sellosRestantes = jornada.sellosIniciales - sellosConsumidos;

  // Garrafones vendidos por tipo
  const garrafonesVendidosPorTipo = jornada.pedidos.reduce((counts, pedido) => {
    if (pedido.itemsDetalle && pedido.itemsDetalle.length > 0) {
      pedido.itemsDetalle.forEach(waterType => {
        waterType.assignments.forEach(assignment => {
          const key = `${assignment.jugName} (${waterType.name.replace('Agua ', '')})`;
          counts[key] = (counts[key] || 0) + assignment.quantity;
        });
      });
    }
    return counts;
  }, {});


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
              <p className="text-sm text-gray-600">Sellos Restantes</p>
              <p className="text-xl font-bold">{sellosRestantes}</p>
            </div>
             <div className="p-4 bg-gray-100 rounded-lg">
              <p className="text-sm text-gray-600">Pedidos Realizados</p>
              <p className="text-xl font-bold">{jornada.pedidos.length}</p>
            </div>
          </div>
        </section>

        {Object.keys(garrafonesVendidosPorTipo).length > 0 && (
            <section className="mb-8">
                <h3 className="text-2xl font-semibold text-gray-700 mb-4">Resumen de Garrafones Vendidos</h3>
                <table className="w-full text-left table-auto">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="p-2">Tipo de Garrafón</th>
                            <th className="p-2 text-right">Cantidad</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(garrafonesVendidosPorTipo).map(([jugType, count]) => (
                            <tr key={jugType} className="border-b">
                                <td className="p-2">{jugType}</td>
                                <td className="p-2 text-right font-bold">{count}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>
        )}

        <section>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Detalle de Pedidos</h2>
          <table className="w-full text-left table-auto">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-3">Hora</th>
                <th className="p-3">Tipo</th>
                <th className="p-3">Cliente</th>
                <th className="p-3">Productos</th>
                <th className="p-3 text-right">Total Pedido</th>
              </tr>
            </thead>
            <tbody>
              {jornada.pedidos.map(pedido => (
                <tr key={pedido.id} className="border-b">
                  <td className="p-3 align-top">{new Date(pedido.fecha).toLocaleTimeString()}</td>
                  <td className="p-3 capitalize align-top">{pedido.tipo}</td>
                  <td className="p-3 align-top">{pedido.cliente?.nombre || 'Mostrador'}</td>
                  <td className="p-3 align-top">
                    {pedido.itemsDetalle?.map(wt => (
                        wt.assignments.map(a => (
                            <div key={`${wt.id}-${a.jugId}`} className="flex justify-between text-sm">
                                <span>{a.jugName} ({wt.name.replace('Agua ', '')}) x {a.quantity}</span>
                                <span>${a.unitPrice?.toFixed(2) || 'N/A'}</span>
                            </div>
                        ))
                    ))}
                    {pedido.cobrarRecoleccion && <div className="text-sm italic">Recolección: $10.00</div>}
                  </td>
                  <td className="p-3 text-right font-bold align-top">${pedido.total.toFixed(2)}</td>
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
