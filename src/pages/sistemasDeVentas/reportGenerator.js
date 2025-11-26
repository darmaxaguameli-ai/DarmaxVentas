import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generateEndOfDayReport = (sessionData) => {
  const {
    openingCash,
    transactions,
    expectedInDrawer,
  } = sessionData;

  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.text("Reporte de Cierre de Caja", 14, 22);
  doc.setFontSize(12);
  doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 30);

  // Summary
  doc.setFontSize(14);
  doc.text("Resumen de la Sesión", 14, 45);
  doc.autoTable({
    startY: 50,
    head: [['Concepto', 'Monto']],
    body: [
      ['Fondo de Caja Inicial', `$${openingCash.toFixed(2)}`],
      ['Ventas en Efectivo', `$${transactions.filter(t => t.type === 'sale' && t.paymentMethod === 'cash').reduce((sum, t) => sum + t.amount, 0).toFixed(2)}`],
      ['Ingresos de Dinero', `$${transactions.filter(t => t.type === 'pay_in').reduce((sum, t) => sum + t.amount, 0).toFixed(2)}`],
      ['Retiros de Dinero', `-$${transactions.filter(t => t.type === 'pay_out').reduce((sum, t) => sum + t.amount, 0).toFixed(2)}`],
      ['Total Esperado en Caja', `$${expectedInDrawer.toFixed(2)}`],
    ],
    theme: 'striped',
  });

  // Transaction Details
  let finalY = doc.lastAutoTable.finalY || 10;
  doc.text("Detalle de Transacciones", 14, finalY + 15);
  doc.autoTable({
    startY: finalY + 20,
    head: [['Tipo', 'Descripción/Motivo', 'Monto']],
    body: transactions.map(t => [
        t.type,
        t.description,
        `${t.type === 'pay_out' ? '-' : ''}$${t.amount.toFixed(2)}`
    ]),
    theme: 'grid',
  });

  doc.save(`cierre_de_caja_${new Date().toISOString().slice(0,10)}.pdf`);
};
