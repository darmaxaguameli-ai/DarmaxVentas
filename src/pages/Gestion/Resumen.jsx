import { useMemo, useState, useEffect } from "react";
import { useGestion } from "./context/GestionContext";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import CashFlowChart from "./components/CashFlowChart";
import ExpensePieChart from './components/ExpensePieChart';
import SalesByChannelChart from './components/SalesByChannelChart';
import TopSellingProducts from './components/TopSellingProducts';
import NotificationCenter from './components/NotificationCenter';
import ConsolidatedReports from './components/ConsolidatedReports';

const StatCard = ({ title, value, subtext, type }) => {
    let valueColorClass = "text-[#111418] dark:text-white";
    if (type === "income") valueColorClass = "text-green-600 dark:text-green-400";
    if (type === "expense") valueColorClass = "text-red-600 dark:text-red-400";
    if (type === "netProfit") valueColorClass = value < 0 ? "text-red-600 dark:red-400" : "text-primary";

    const formattedValue = new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
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
    const { user, hasPermission } = useAuth();
    const navigate = useNavigate();
    const { income, expenses, inventory, dailySalesRecords } = state;
    const [timePeriod, setTimePeriod] = useState('monthly'); // 'monthly' or 'annual'
    const [viewMode, setViewMode] = useState('local'); // 'local' or 'consolidated'

    // El control de acceso ahora se maneja centralmente en AdminProtectedRoute
    // Pero si entra aquí y no tiene permiso de ver el resumen, lo mandamos al primer módulo que sí tenga
    useEffect(() => {
        if (!hasPermission('canViewSummary')) {
            console.log("No tienes permiso para ver el resumen. Redirigiendo...");
            if (hasPermission('canAccessInventory')) navigate('/gestion/inventario', { replace: true });
            else if (hasPermission('canAccessRH')) navigate('/gestion/usuarios', { replace: true });
            else if (hasPermission('canAccessLeads')) navigate('/gestion/prospeccion', { replace: true });
            else if (hasPermission('canAccessQuotes')) navigate('/gestion/cotizador-distribuidores', { replace: true });
            else navigate('/role-selector', { replace: true });
        }
    }, [hasPermission, navigate]);

    const isAdmin = user?.roles?.some(r => r.name === 'ADMIN') || user?.role === 'ADMIN';

    const { totalIncome, totalExpenses, netProfit, incomeTransactions, expenseTransactions } = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const filterByPeriod = (item) => {
            const itemDate = new Date(item.date);
            if (timePeriod === 'monthly') {
                return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear;
            }
            if (timePeriod === 'annual') {
                return itemDate.getFullYear() === currentYear;
            }
            return true;
        };

        const filteredIncome = income.filter(filterByPeriod);
        const filteredExpenses = expenses.filter(filterByPeriod);

        const totalIncome = filteredIncome.reduce((sum, item) => sum + item.amount, 0);
        const totalExpenses = filteredExpenses.reduce((sum, item) => sum + item.amount, 0);
        const netProfit = totalIncome - totalExpenses;

        return {
            totalIncome,
            totalExpenses,
            netProfit,
            incomeTransactions: filteredIncome.length,
            expenseTransactions: filteredExpenses.length
        };
    }, [income, expenses, timePeriod]);
    
    const lowStockItems = useMemo(() => {
        return inventory.filter(item => item.stock < 50);
    }, [inventory]);

    return (
        <div>
            <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold text-dark dark:text-white">
                    {viewMode === 'consolidated' ? 'Reporte Consolidado (Red)' : 'Resumen General'}
                </h1>
                
                {isAdmin && (
                    <div className="bg-gray-100 dark:bg-gray-700 p-1 rounded-lg flex items-center">
                        <button
                            onClick={() => setViewMode('local')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                                viewMode === 'local' 
                                ? 'bg-white dark:bg-gray-600 shadow text-primary dark:text-white' 
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                            }`}
                        >
                            Vista Local
                        </button>
                        <button
                            onClick={() => setViewMode('consolidated')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                                viewMode === 'consolidated' 
                                ? 'bg-white dark:bg-gray-600 shadow text-primary dark:text-white' 
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                            }`}
                        >
                            Vista Consolidada
                        </button>
                    </div>
                )}
            </div>
            
            {viewMode === 'consolidated' ? (
                <ConsolidatedReports />
            ) : (
                <>
                    <div className="flex justify-start md:justify-end mb-4 gap-2">
                        <button 
                            onClick={() => setTimePeriod('monthly')}
                            className={`px-4 py-2 text-sm font-medium rounded-lg ${timePeriod === 'monthly' ? 'bg-primary text-white shadow' : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
                        >
                            Este Mes
                        </button>
                        <button 
                            onClick={() => setTimePeriod('annual')}
                            className={`px-4 py-2 text-sm font-medium rounded-lg ${timePeriod === 'annual' ? 'bg-primary text-white shadow' : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
                        >
                            Este Año
                        </button>
                    </div>

                    {/* Stat Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <StatCard 
                            title={`Ingresos (${timePeriod === 'monthly' ? 'Mes Actual' : 'Año Actual'})`} 
                            value={totalIncome} 
                            subtext={`${incomeTransactions} transacciones`} 
                            type="income" 
                        />
                        <StatCard 
                            title={`Gastos (${timePeriod === 'monthly' ? 'Mes Actual' : 'Año Actual'})`} 
                            value={totalExpenses} 
                            subtext={`${expenseTransactions} transacciones`} 
                            type="expense" 
                        />
                        <StatCard 
                            title={`Balance Neto (${timePeriod === 'monthly' ? 'Mes Actual' : 'Año Actual'})`} 
                            value={netProfit} 
                            subtext="Ingresos - Gastos" 
                            type="netProfit" 
                        />
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
                            <NotificationCenter overlayOnDesktop={true} />
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
                </>
            )}
        </div>
    );
}

export default Resumen;