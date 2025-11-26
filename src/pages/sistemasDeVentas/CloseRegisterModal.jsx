import { generateEndOfDayReport } from './reportGenerator';

const CloseRegisterModal = ({ isOpen, onClose, sessionData, onEndSession }) => {

  const handleGenerateReportAndEnd = () => {
    generateEndOfDayReport(sessionData);
    onEndSession();
    onClose();
  };

  if (!isOpen) return null;

  const { openingCash, transactions, expectedInDrawer } = sessionData;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-4">Cierre de Caja</h2>
        <div className="space-y-2 text-lg">
          <div className="flex justify-between"><span className="text-gray-600">Fondo Inicial:</span> <span>${openingCash.toFixed(2)}</span></div>
          <div className="flex justify-between"><span className="text-gray-600">Ventas en Efectivo:</span> <span className="text-green-500">+${transactions.filter(t=>t.type === 'sale' && t.paymentMethod === 'cash').reduce((s,t)=>s+t.amount, 0).toFixed(2)}</span></div>
          <div className="flex justify-between"><span className="text-gray-600">Ingresos:</span> <span className="text-blue-500">+${transactions.filter(t=>t.type === 'pay_in').reduce((s,t)=>s+t.amount, 0).toFixed(2)}</span></div>
          <div className="flex justify-between"><span className="text-gray-600">Retiros:</span> <span className="text-yellow-500">-${transactions.filter(t=>t.type === 'pay_out').reduce((s,t)=>s+t.amount, 0).toFixed(2)}</span></div>
          <hr className="my-2"/>
          <div className="flex justify-between font-bold text-xl"><span className="text-gray-800 dark:text-white">Total Esperado en Caja:</span> <span>${expectedInDrawer.toFixed(2)}</span></div>
        </div>
        <div className="mt-6">
            <label className="block text-sm font-medium mb-1">Monto Contado Real</label>
            <input type="number" className="w-full p-2 rounded-md bg-gray-100 dark:bg-gray-700" placeholder="0.00" />
            {/* Diff logic can be added here */}
        </div>
        <div className="flex justify-end gap-4 mt-6">
            <button onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg">Cancelar</button>
            <button onClick={handleGenerateReportAndEnd} className="px-4 py-2 text-white bg-blue-600 rounded-lg">Generar Reporte PDF y Cerrar</button>
        </div>
      </div>
    </div>
  );
};

export default CloseRegisterModal;
