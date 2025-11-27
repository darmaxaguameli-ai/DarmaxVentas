import { useMemo } from "react";
import { useGestion } from "./context/GestionContext";

const StatCard = ({ title, value, subtext, type }) => {
    let valueColorClass = "text-[#111418] dark:text-white";
    if (type === "income") valueColorClass = "text-green-600 dark:text-green-400";
    if (type === "expense") valueColorClass = "text-red-600 dark:text-red-400";
    if (type === "netProfit") valueColorClass = value < 0 ? "text-red-600 dark:text-red-400" : "text-primary";

    const formattedValue = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(value);

    return (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg transition-all hover:shadow-xl hover:-translate-y-1">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 tracking-wide">{title}</h3>
            <p className={`mt-2 text-4xl font-bold ${valueColorClass}`}>{formattedValue}</p>
            {subtext && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtext}</p>}
        </div>
    );
};

const ChartPlaceholder = ({ title, description }) => (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
        <h3 className="text-lg font-semibold text-[#111418] dark:text-white">{title}</h3>
        <div className="mt-4 flex items-center justify-center h-64 bg-gray-100 dark:bg-gray-700 rounded-md">
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center px-4">{description}</p>
        </div>
    </div>
);

const Resumen = () => {
    const { state } = useGestion();
    const { income, expenses, inventory } = state;

    const { totalIncome, totalExpenses, netProfit } = useMemo(() => {
        const totalIncome = income.reduce((sum, item) => sum + item.amount, 0);
        const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
        const netProfit = totalIncome - totalExpenses;
        return { totalIncome, totalExpenses, netProfit };
    }, [income, expenses]);
    
    const lowStockItems = useMemo(() => {
        return inventory.filter(item => item.quantity < 50);
    }, [inventory]);

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-dark dark:text-white">Resumen General</h1>
            
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title="Ingresos Totales" value={totalIncome} subtext={`${income.length} transacciones`} type="income" />
                <StatCard title="Gastos Totales" value={totalExpenses} subtext={`${expenses.length} transacciones`} type="expense" />
                <StatCard title="Balance Neto" value={netProfit} subtext="Ingresos - Gastos" type="netProfit" />
            </div>

            {/* Charts and Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                <div className="lg:col-span-2">
                    <ChartPlaceholder 
                        title="Flujo de Caja (Últimos 30 días)" 
                        description="Aquí iría un gráfico de líneas (ej. con Recharts) mostrando ingresos y gastos."
                    />
                </div>
                <div>
                     <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
                        <h3 className="text-lg font-semibold text-[#111418] dark:text-white">Inventario Bajo</h3>
                        {lowStockItems.length > 0 ? (
                            <ul className="mt-4 space-y-3">
                                {lowStockItems.map(item => (
                                    <li key={item.id} className="flex justify-between items-center text-sm">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">{item.name}</span>
                                        <span className="font-bold text-red-500">{item.quantity} restantes</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">No hay productos con inventario bajo.</p>
                        )}
                    </div>
                </div>
                 <div className="lg:col-span-3">
                     <ChartPlaceholder 
                        title="Distribución de Gastos por Categoría" 
                        description="Aquí iría un gráfico de pastel (ej. con Recharts) mostrando el porcentaje de cada categoría de gasto."
                    />
                 </div>
            </div>
        </div>
    );
}

export default Resumen;
