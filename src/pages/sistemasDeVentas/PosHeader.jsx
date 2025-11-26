const PosHeader = ({ onPayIn, onPayOut, onCloseRegister }) => {
  return (
    <div className="flex justify-between items-center mb-4 p-4 bg-white dark:bg-gray-800 rounded-xl shadow">
      <div>
        <h1 className="text-2xl font-bold text-[#111418] dark:text-white">Punto de Venta</h1>
      </div>
      <div className="flex items-center gap-4">
        <button onClick={onPayIn} className="px-4 py-2 text-sm font-semibold bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200">Añadir Dinero</button>
        <button onClick={onPayOut} className="px-4 py-2 text-sm font-semibold bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200">Retirar Dinero</button>
        <button onClick={onCloseRegister} className="px-4 py-2 text-sm font-semibold bg-red-100 text-red-700 rounded-lg hover:bg-red-200">Cerrar Caja</button>
      </div>
    </div>
  );
};

export default PosHeader;
