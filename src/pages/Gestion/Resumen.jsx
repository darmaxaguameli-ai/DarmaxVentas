const Resumen = () => {
    return (
        <div>
            <h1 className="text-3xl font-bold mb-4 text-dark dark:text-white">Resumen General</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                    <h2 className="text-[#111418] dark:text-white">Ingresos Totales</h2>
                    <p className="text-2xl text-green-500">$1,250.00</p>
                </div>
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                    <h2 className="text-[#111418] dark:text-white">Gastos Totales</h2>
                    <p className="text-2xl text-red-500">$450.00</p>
                </div>
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                    <h2 className="text-[#111418] dark:text-white">Balance</h2>
                    <p className="text-2xl text-primary">$800.00</p>
                </div>
            </div>
        </div>
    );
}

export default Resumen;
