import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateEndOfDayReport = (sessionData) => {
  const {
    openingCash,
    transactions,
    expectedInDrawer,
    realCashInDrawer,
    difference,
    initialTags,
    damagedTags,
    finalTags
  } = sessionData;

  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.text("Reporte de Cierre de Caja", 14, 22);
  doc.setFontSize(12);
  doc.text(`Fecha: ${new Date().toLocaleString('es-MX')}`, 14, 30);

  // Summary
  doc.setFontSize(14);
  doc.text("Resumen de la Sesión", 14, 45);
  autoTable(doc, {
    startY: 50,
    head: [['Concepto', 'Monto']],
    body: [
      ['Fondo de Caja Inicial', `$${openingCash.toFixed(2)}`],
      ['Ventas en Efectivo', `+ $${transactions.filter(t => t.tipo === 'VENTA').reduce((sum, t) => sum + t.amount, 0).toFixed(2)}`],
      ['Ingresos de Dinero', `+ $${transactions.filter(t => t.tipo === 'INGRESO').reduce((sum, t) => sum + t.amount, 0).toFixed(2)}`],
      ['Retiros / Gastos', `- $${transactions.filter(t => t.tipo === 'RETIRO').reduce((sum, t) => sum + t.amount, 0).toFixed(2)}`],
      { content: 'Total Esperado en Caja', styles: { fontStyle: 'bold' } },
      { content: `$${expectedInDrawer.toFixed(2)}`, styles: { fontStyle: 'bold', halign: 'right' } },
      ['Monto Real en Caja', `$${realCashInDrawer.toFixed(2)}`],
      { content: 'Diferencia', styles: { fontStyle: 'bold' } },
      { 
        content: `${difference >= 0 ? '+' : '-'} $${Math.abs(difference).toFixed(2)}`,
        styles: { 
          fontStyle: 'bold', 
          halign: 'right',
          textColor: difference === 0 ? [0, 0, 0] : (difference > 0 ? [0, 0, 255] : [255, 0, 0])
        } 
      },
    ],
    theme: 'striped',
  });

  // Tag Inventory Section
  let finalY = doc.lastAutoTable.finalY || 10;
  doc.setFontSize(14);
  doc.text("Inventario de Etiquetas", 14, finalY + 15);
  autoTable(doc, {
    startY: finalY + 20,
    head: [['Concepto', 'Cantidad']],
    body: [
        ['Etiquetas Iniciales', initialTags || 0],
        ['Etiquetas Dañadas / Perdidas', damagedTags || 0],
        { content: 'Etiquetas Restantes (Esperadas)', styles: { fontStyle: 'bold' } },
        { content: finalTags || 0, styles: { fontStyle: 'bold' } },
    ],
    theme: 'striped',
    styles: { halign: 'left' },
    columnStyles: { 1: { halign: 'right' } }
  });

  // Transaction Details
  finalY = doc.lastAutoTable.finalY || 10;
  doc.setFontSize(14);
  doc.text("Detalle de Transacciones", 14, finalY + 15);
  autoTable(doc, {
    startY: finalY + 20,
    head: [['Hora', 'Tipo', 'Descripción/Motivo', 'Monto']],
    body: transactions.map(t => [
        new Date(t.createdAt).toLocaleTimeString('es-MX'),
        t.tipo,
        t.description,
        `${t.tipo === 'RETIRO' ? '-' : ''}$${t.amount.toFixed(2)}`
    ]),
    theme: 'grid',
  });

  doc.save(`cierre_de_caja_${new Date().toISOString().slice(0,10)}.pdf`);
};
