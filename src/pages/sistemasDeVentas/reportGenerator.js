import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generateEndOfDayReport = (sessionData) => {
  const {
    openingCash,
    transactions,
    expectedInDrawer,
    realCashInDrawer,
    difference,
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
  doc.autoTable({
    startY: 50,
    head: [['Concepto', 'Monto']],
    body: [
      ['Fondo de Caja Inicial', `$${openingCash.toFixed(2)}`],
      ['Ventas en Efectivo', `+ $${transactions.filter(t => t.type === 'sale' && t.paymentMethod === 'cash').reduce((sum, t) => sum + t.amount, 0).toFixed(2)}`],
      ['Ingresos de Dinero', `+ $${transactions.filter(t => t.type === 'pay_in').reduce((sum, t) => sum + t.amount, 0).toFixed(2)}`],
      ['Retiros de Dinero', `- $${transactions.filter(t => t.type === 'pay_out').reduce((sum, t) => sum + t.amount, 0).toFixed(2)}`],
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
    didParseCell: function (data) {
        if (data.row.index > 3 && data.row.index % 2 !== 0) {
            data.cell.styles.fillColor = '#f2f2f2';
        }
        if (data.row.section === 'body' && (data.row.index === 4 || data.row.index === 6)) {
            data.cell.styles.fontStyle = 'bold';
        }
    }
  });

  // Transaction Details
  let finalY = doc.lastAutoTable.finalY || 10;
  doc.text("Detalle de Transacciones", 14, finalY + 15);
  doc.autoTable({
    startY: finalY + 20,
    head: [['Fecha', 'Tipo', 'Descripción/Motivo', 'Monto']],
    body: transactions.map(t => [
        new Date(t.timestamp).toLocaleTimeString('es-MX'),
        t.type,
        t.description,
        `${t.type === 'pay_out' ? '-' : ''}$${t.amount.toFixed(2)}`
    ]),
    theme: 'grid',
  });

  doc.save(`cierre_de_caja_${new Date().toISOString().slice(0,10)}.pdf`);
};
