import { useMemo } from "react";
import { useGestion } from "./context/GestionContext";
import CashFlowChart from "./components/CashFlowChart"; // Added this line
import ExpensePieChart from './components/ExpensePieChart';
import SalesByChannelChart from './components/SalesByChannelChart';
import TopSellingProducts from './components/TopSellingProducts';

const StatCard = ({ title, value, subtext, type }) => {
    let valueColorClass = "text-[#111418] dark:text-white";
    if (type === "income") valueColorClass = "text-green-600 dark:text-green-400";
    if (type === "expense") valueColorClass = "text-red-600 dark:text-red-400";
    if (type === "netProfit") valueColorClass = value < 0 ? "text-red-600 dark:red-400" : "text-primary";

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

const Resumen = () => {
    const { state } = useGestion();
    const { income, expenses, inventory, dailySalesRecords } = state;

    const { totalIncome, totalExpenses, netProfit } = useMemo(() => {
        const totalIncome = income.reduce((sum, item) => sum + item.amount, 0);
        const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
        const netProfit = totalIncome - totalExpenses;
        return { totalIncome, totalExpenses, netProfit };
    }, [income, expenses]);
    
    const lowStockItems = useMemo(() => {
        return inventory.filter(item => item.stock < 50);
    }, [inventory]);

    const expenseSuggestions = useMemo(() => {
        const descriptionMonths = new Map();
        expenses.forEach(expense => {
            const description = expense.description.toLowerCase().trim();
            const month = expense.date.substring(0, 7); // YYYY-MM
            if (!descriptionMonths.has(description)) {
                descriptionMonths.set(description, new Set());
            }
            descriptionMonths.get(description).add(month);
        });

        const recurringDescriptions = new Set();
        descriptionMonths.forEach((months, description) => {
            if (months.size > 1) { // It's recurring if it appears in more than 1 month
                recurringDescriptions.add(description);
            }
        });

        const currentMonth = new Date().toISOString().substring(0, 7);
        return expenses
            .filter(expense => {
                const description = expense.description.toLowerCase().trim();
                const month = expense.date.substring(0, 7);
                return month === currentMonth && recurringDescriptions.has(description);
            })
            .map(expense => `Considera optimizar los gastos recurrentes en "${expense.description}".`);
    }, [expenses]);

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                <div className="md:col-span-2 lg:col-span-2 h-80 md:h-[450px]">
                    <CashFlowChart income={income} expenses={expenses} />
                </div>
                <div className="space-y-6">
                     <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
                        <h3 className="text-lg font-semibold text-[#111418] dark:text-white">Inventario Bajo</h3>
                        {lowStockItems.length > 0 ? (
                            <ul className="mt-4 space-y-3">
                                {lowStockItems.map(item => (
                                    <li key={item.id} className="flex justify-between items-center text-sm">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">{item.name}</span>
                                        <span className="font-bold text-red-500">{item.stock} restantes</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">No hay productos con inventario bajo.</p>
                        )}
                    </div>
                    <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
                        <h3 className="text-lg font-semibold text-[#111418] dark:text-white">Sugerencias de Ahorro</h3>
                        {expenseSuggestions.length > 0 ? (
                            <ul className="mt-4 space-y-3">
                                {expenseSuggestions.map((suggestion, index) => (
                                    <li key={index} className="flex items-start gap-3 text-sm">
                                        <span className="material-symbols-outlined text-lg text-amber-500 mt-0.5">lightbulb</span>
                                        <span className="text-gray-700 dark:text-gray-300">{suggestion}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">No hay sugerencias de ahorro por el momento.</p>
                        )}
                    </div>
                </div>
                 <div className="md:col-span-2 lg:col-span-3">
                    <ExpensePieChart expenses={expenses} />
                 </div>
            </div>

            {/* New Section for Sales Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                <div className="md:col-span-2 lg:col-span-2">
                    <SalesByChannelChart dailySalesRecords={dailySalesRecords} />
                </div>
                <div className="md:col-span-1 lg:col-span-1">
                    <TopSellingProducts dailySalesRecords={dailySalesRecords} />
                </div>
            </div>
        </div>
    );
}

export default Resumen;
