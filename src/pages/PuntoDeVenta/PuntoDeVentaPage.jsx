// src/pages/PuntoDeVenta/PuntoDeVentaPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import CrearPedidoFlow from './CrearPedidoFlow'; 
import ReportePDF from './ReportePDF';

// Constante para la clave del localStorage
const JORNADA_STORAGE_KEY = 'jornadaVentas';

// Componente para la pantalla de "Iniciar Jornada"
const IniciarJornada = ({ onJornadaIniciada }) => {
  const [dineroInicial, setDineroInicial] = useState('');
  const [sellosIniciales, setSellosIniciales] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (dineroInicial === '' || sellosIniciales === '') {
      alert('Por favor, completa todos los campos.');
      return;
    }

    const jornadaData = {
      id: `jornada-${Date.now()}`,
      dineroInicial: parseFloat(dineroInicial),
      sellosIniciales: parseInt(sellosIniciales, 10),
      pedidos: [],
      fechaInicio: new Date().toISOString(),
    };

    onJornadaIniciada(jornadaData);
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg dark:bg-gray-800">
        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white">Iniciar Jornada</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="dinero-inicial" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Dinero inicial en caja
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                name="dinero-inicial"
                id="dinero-inicial"
                value={dineroInicial}
                onChange={(e) => setDineroInicial(e.target.value)}
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 pl-7 pr-12 py-3 focus:border-primary focus:ring-primary"
                placeholder="0.00"
                required
              />
            </div>
          </div>
          <div>
            <label htmlFor="sellos-iniciales" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Cantidad de sellos
            </label>
            <div className="mt-1">
              <input
                type="number"
                name="sellos-iniciales"
                id="sellos-iniciales"
                value={sellosIniciales}
                onChange={(e) => setSellosIniciales(e.target.value)}
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-4 py-3 focus:border-primary focus:ring-primary"
                placeholder="0"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Iniciar Jornada
          </button>
        </form>
      </div>
    </div>
  );
};

// Componente para el Panel Principal de Ventas
const PanelPrincipal = ({ jornadaData, onTerminarJornada, onNuevoPedido }) => {
  const totalVentas = jornadaData.pedidos.reduce((sum, p) => sum + p.total, 0);
  const cajaActual = jornadaData.dineroInicial + totalVentas;

  // Calculo de sellos restantes
  const sellosConsumidos = jornadaData.pedidos.reduce((totalConsumidos, pedido) => {
    if (pedido.itemsDetalle && pedido.itemsDetalle.length > 0) {
      // Por cada 'waterType' en itemsDetalle
      pedido.itemsDetalle.forEach(waterType => {
        // Sumar la cantidad de todos los asignados para este waterType
        waterType.assignments.forEach(assignment => {
          // Un sello se consume si NO se cobró recolección (asumiendo que significa que se entregó un garrafón nuevo)
          // O si es una venta de garrafón lleno (no recarga)
          // La lógica actual de `cobrarRecoleccion` es para "ir por ellos", así que si está marcado como true, NO consume sello (se trajo uno vacío)
          // Si es false, SÍ consume sello (se entregó uno nuevo o no se recogió vacío)
          if (!pedido.cobrarRecoleccion) { // Si no se cobró recolección, se asume que se entregó un garrafón nuevo
              totalConsumidos += assignment.quantity;
          }
        });
      });
    }
    return totalConsumidos;
  }, 0);
  const sellosRestantes = jornadaData.sellosIniciales - sellosConsumidos;


  // Garrafones vendidos por tipo
  const garrafonesVendidosPorTipo = jornadaData.pedidos.reduce((counts, pedido) => {
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
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Panel Principal</h2>
        <div className="flex gap-4">
            <button
                onClick={() => onNuevoPedido('mostrador')}
                className="flex items-center gap-2 bg-blue-500 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-blue-600 transition-colors"
            >
                <span className="material-symbols-outlined">storefront</span>
                Mostrador
            </button>
            <button
                onClick={() => onNuevoPedido('domicilio')}
                className="flex items-center gap-2 bg-green-500 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-green-600 transition-colors"
            >
                <span className="material-symbols-outlined">local_shipping</span>
                Domicilio
            </button>
        </div>
      </div>

      {/* Resumen de la Jornada */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Dinero en Caja</h3>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">${cajaActual.toFixed(2)}</p>
        </div>
        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total de Ventas</h3>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">${totalVentas.toFixed(2)}</p>
        </div>
        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Sellos Restantes</h3>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{sellosRestantes}</p>
        </div>
        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Pedidos Registrados</h3>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{jornadaData.pedidos.length}</p>
        </div>
      </div>

      {/* Resumen de Garrafones Vendidos por Tipo */}
      {Object.keys(garrafonesVendidosPorTipo).length > 0 && (
        <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Garrafones Vendidos</h3>
          <ul className="space-y-2">
            {Object.entries(garrafonesVendidosPorTipo).map(([jugType, count]) => (
              <li key={jugType} className="flex justify-between items-center text-gray-700 dark:text-gray-300">
                <span>{jugType}</span>
                <span className="font-bold">{count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Lista de Pedidos */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Últimos Pedidos</h3>
        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg min-h-[150px]">
            {jornadaData.pedidos.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center pt-10">Aún no se han registrado pedidos.</p>
            ) : (
                <ul className="space-y-3">
                    {jornadaData.pedidos.slice(0, 5).map(p => (
                        <li key={p.id} className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm flex justify-between items-center">
                            <div>
                                <p className="font-bold capitalize">{p.tipo} - {p.cliente?.nombre || 'Cliente mostrador'}</p>
                                <p className="text-sm text-gray-500">{new Date(p.fecha).toLocaleTimeString()}</p>
                            </div>
                            <p className="font-bold text-lg text-primary">${p.total.toFixed(2)}</p>
                        </li>
                    ))}
                    {jornadaData.pedidos.length > 5 && <p className="text-center text-sm mt-3">... y {jornadaData.pedidos.length - 5} más.</p>}
                </ul>
            )}
        </div>
      </div>

       <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
        <button
          onClick={onTerminarJornada}
          className="w-full sm:w-auto flex items-center gap-2 justify-center py-3 px-6 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
            <span className="material-symbols-outlined">receipt_long</span>
            Terminar y Generar Reporte
        </button>
      </div>
    </div>
  );
};


const PuntoDeVentaPage = () => {
  const [jornada, setJornada] = useState(null);
  const [loading, setLoading] = useState(true);
  const [vista, setVista] = useState({ tipo: 'panel', pedido: null }); // panel | creando_pedido
  const reporteRef = useRef();

  useEffect(() => {
    try {
      const jornadaGuardada = localStorage.getItem(JORNADA_STORAGE_KEY);
      if (jornadaGuardada) {
        setJornada(JSON.parse(jornadaGuardada));
      }
    } catch (error) {
      console.error("Error al leer la jornada desde localStorage:", error);
      localStorage.removeItem(JORNADA_STORAGE_KEY);
    } finally {
        setLoading(false);
    }
  }, []);

  const handleIniciarJornada = (jornadaData) => {
    try {
      localStorage.setItem(JORNADA_STORAGE_KEY, JSON.stringify(jornadaData));
      setJornada(jornadaData);
    } catch (error) {
      console.error("Error al guardar la jornada en localStorage:", error);
      alert("No se pudo iniciar la jornada. Revisa la consola para más detalles.");
    }
  };

  const handleTerminarJornada = () => {
    if (!jornada || !reporteRef.current) return;

    if (window.confirm("¿Estás seguro de que quieres terminar la jornada? Se generará el reporte y se borrarán los datos actuales.")) {
        html2canvas(reporteRef.current).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

            const date = new Date(jornada.fechaInicio);
            const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
            pdf.save(`reporte-jornada-${dateStr}.pdf`);

            // Limpiar estado y localStorage
            localStorage.removeItem(JORNADA_STORAGE_KEY);
            setJornada(null);
        });
    }
  };

  const handleNuevoPedido = (tipoPedido) => {
    setVista({ tipo: 'creando_pedido', pedido: tipoPedido });
  };

  const handleCancelarPedido = () => {
    setVista({ tipo: 'panel', pedido: null });
  };

  const handleGuardarPedido = (pedidoData) => {
    const nuevoPedido = { ...pedidoData, id: `pedido-${Date.now()}` };
    
    setJornada(jornadaActual => {
        const nuevaJornada = {
            ...jornadaActual,
            pedidos: [nuevoPedido, ...jornadaActual.pedidos],
        };
        try {
            localStorage.setItem(JORNADA_STORAGE_KEY, JSON.stringify(nuevaJornada));
        } catch (error) {
            console.error("Error al guardar el pedido en localStorage:", error);
            alert("No se pudo guardar el pedido.");
            return jornadaActual;
        }
        return nuevaJornada;
    });

    setVista({ tipo: 'panel', pedido: null });
  };

  if (loading) {
    return <div className="p-8 text-center"><p>Cargando sistema de ventas...</p></div>
  }

  const renderContent = () => {
    if (!jornada) {
        return <IniciarJornada onJornadaIniciada={handleIniciarJornada} />;
    }

    switch (vista.tipo) {
        case 'creando_pedido':
            return <CrearPedidoFlow tipoPedido={vista.pedido} onPedidoCancelado={handleCancelarPedido} onPedidoGuardado={handleGuardarPedido} />;
        case 'panel':
        default:
            return <PanelPrincipal jornadaData={jornada} onTerminarJornada={handleTerminarJornada} onNuevoPedido={handleNuevoPedido} />;
    }
  }

  return (
    <div className="p-4 md:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <header className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Punto de Venta</h1>
          <p className="text-gray-500 dark:text-gray-400">Sistema de registro de ventas diarias.</p>
        </div>
        <img src="/img/logos/darmax-logo.png" alt="Darmax Logo" className="h-16 w-auto" />
      </header>
      
      <main>
        {renderContent()}
      </main>

      {/* El componente de reporte se renderiza aquí, pero estará oculto */}
      <div style={{ position: 'fixed', left: '-2000px', top: 0 }}>
        <ReportePDF ref={reporteRef} jornada={jornada} />
      </div>
    </div>
  );
};

export default PuntoDeVentaPage;
