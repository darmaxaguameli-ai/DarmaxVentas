import { useMemo, useState, useEffect } from "react";
import { useGestion } from "./context/GestionContext";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import CashFlowChart from "./components/CashFlowChart";
import ExpensePieChart from './components/ExpensePieChart';
import SalesByChannelChart from './components/SalesByChannelChart';
import TopSellingProducts from './components/TopSellingProducts';
import ConsolidatedReports from './components/ConsolidatedReports';

const StatCard = ({ title, value, subtext, type }) => {
    let valueColorClass = "text-gray-900 dark:text-white";
    let badgeDotClass = "bg-primary";

    if (type === "income") {
        valueColorClass = "text-emerald-600 dark:text-emerald-400";
        badgeDotClass = "bg-emerald-500";
    }
    if (type === "expense") {
        valueColorClass = "text-rose-600 dark:text-rose-400";
        badgeDotClass = "bg-rose-500";
    }
    if (type === "netProfit") {
        valueColorClass = value < 0 ? "text-rose-600 dark:text-rose-400" : "text-primary dark:text-blue-400";
        badgeDotClass = value < 0 ? "bg-rose-500" : "bg-primary";
    }

    const formattedValue = new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
    }).format(value);

    return (
        <div className="p-5 sm:p-6 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700/80 transition-all hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600 flex flex-col justify-between">
            <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${badgeDotClass}`}></span>
                <span className="text-[11px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {title}
                </span>
            </div>
            <div className="mt-4">
                <p className={`text-2xl sm:text-3xl font-black tracking-tight tabular-nums ${valueColorClass}`}>
                    {formattedValue}
                </p>
                {subtext && (
                    <div className="mt-2 flex items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700/60 text-gray-500 dark:text-gray-400">
                            {subtext}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

const Resumen = () => {
    const { state } = useGestion();
    const { user, hasPermission } = useAuth();
    const navigate = useNavigate();
    const { income, expenses, inventory, dailySalesRecords, loading } = state;
    const [timePeriod, setTimePeriod] = useState('monthly'); // 'monthly' or 'annual'
    const [viewMode, setViewMode] = useState('local'); // 'local' or 'consolidated'

    // El control de acceso centralizado
    useEffect(() => {
        if (loading) return;
        
        if (!hasPermission('canViewSummary')) {
            console.log("No tienes permiso para ver el resumen. Buscando módulo alternativo...");
            
            if (hasPermission('canAccessInventory')) navigate('/gestion/inventario', { replace: true });
            else if (hasPermission('canAccessRH')) navigate('/gestion/recursos-humanos', { replace: true });
            else if (hasPermission('canAccessFinances')) navigate('/gestion/ingresos', { replace: true });
            else if (hasPermission('canAccessLeads')) navigate('/gestion/prospeccion', { replace: true });
            else if (hasPermission('canAccessQuotes')) navigate('/gestion/cotizador-distribuidores', { replace: true });
            else if (hasPermission('canAccessMarketing')) navigate('/gestion/marketing', { replace: true });
            else if (hasPermission('canAccessLegal')) navigate('/gestion/legal', { replace: true });
            else if (hasPermission('canAccessInstallation')) navigate('/gestion/instalacion', { replace: true });
            else if (hasPermission('canAccessConfig')) navigate('/gestion/configuracion', { replace: true });
            else {
                console.warn("Usuario sin sub-módulos de gestión disponibles. Enviando a selector.");
                navigate('/role-selector', { replace: true });
            }
        }
    }, [hasPermission, navigate, loading]);

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
        <div className="space-y-6 animate-fade-in pb-12">
            {/* Cabecera Principal (Sin avatar al lado del título) */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                        {viewMode === 'consolidated' ? 'Reporte Consolidado (Red)' : 'Resumen Operativo'}
                    </h1>
                    <p className="text-xs text-gray-400 font-bold mt-1">
                        Monitoreo financiero, flujo de efectivo y estado del inventario en tiempo real
                    </p>
                </div>
                
                {/* Controles de Vista y Periodo */}
                <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                    {isAdmin && (
                        <div className="bg-gray-100 dark:bg-gray-800/80 p-1 rounded-2xl flex items-center border border-gray-200/60 dark:border-gray-700/60">
                            <button
                                onClick={() => setViewMode('local')}
                                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                                    viewMode === 'local' 
                                    ? 'bg-white dark:bg-gray-700 shadow-xs text-primary dark:text-white' 
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                }`}
                            >
                                Vista Local
                            </button>
                            <button
                                onClick={() => setViewMode('consolidated')}
                                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                                    viewMode === 'consolidated' 
                                    ? 'bg-white dark:bg-gray-700 shadow-xs text-primary dark:text-white' 
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                }`}
                            >
                                Red Consolidada
                            </button>
                        </div>
                    )}

                    {viewMode !== 'consolidated' && (
                        <div className="bg-gray-100 dark:bg-gray-800/80 p-1 rounded-2xl flex items-center border border-gray-200/60 dark:border-gray-700/60">
                            <button 
                                onClick={() => setTimePeriod('monthly')}
                                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                                    timePeriod === 'monthly' 
                                    ? 'bg-primary text-white shadow-xs' 
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                }`}
                            >
                                Este Mes
                            </button>
                            <button 
                                onClick={() => setTimePeriod('annual')}
                                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                                    timePeriod === 'annual' 
                                    ? 'bg-primary text-white shadow-xs' 
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                }`}
                            >
                                Este Año
                            </button>
                        </div>
                    )}
                </div>
            </div>
            
            {viewMode === 'consolidated' ? (
                <ConsolidatedReports />
            ) : (
                <>
                    {/* Tarjetas de Métricas Principales */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                        <StatCard 
                            title={`Ingresos (${timePeriod === 'monthly' ? 'Mes Actual' : 'Año Actual'})`} 
                            value={totalIncome} 
                            subtext={`${incomeTransactions} transacciones registradas`} 
                            type="income" 
                        />
                        <StatCard 
                            title={`Gastos (${timePeriod === 'monthly' ? 'Mes Actual' : 'Año Actual'})`} 
                            value={totalExpenses} 
                            subtext={`${expenseTransactions} transacciones registradas`} 
                            type="expense" 
                        />
                        <StatCard 
                            title={`Balance Neto (${timePeriod === 'monthly' ? 'Mes Actual' : 'Año Actual'})`} 
                            value={netProfit} 
                            subtext="Margen (Ingresos - Gastos)" 
                            type="netProfit" 
                        />
                    </div>

                    {/* Fila Principal: Gráfico de Flujo de Efectivo + Lista de Inventario Bajo */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Gráfica de Flujo (2 Columnas) */}
                        <div className="lg:col-span-2 h-[450px]">
                            <CashFlowChart income={income} expenses={expenses} />
                        </div>

                        {/* Lista con Scroll de Inventario Bajo (1 Columna, misma altura) */}
                        <div className="lg:col-span-1 h-[450px]">
                            <div className="p-5 sm:p-6 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700/80 flex flex-col h-full">
                                {/* Cabecera de Inventario Bajo (Limpia, sin avatar/icono grande) */}
                                <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700/70">
                                    <div>
                                        <h3 className="text-sm font-black text-gray-900 dark:text-white leading-tight">
                                            Inventario Bajo
                                        </h3>
                                        <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                                            Menos de 50 existencias
                                        </p>
                                    </div>
                                    <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${
                                        lowStockItems.length > 0
                                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                                    }`}>
                                        {lowStockItems.length} {lowStockItems.length === 1 ? 'crítico' : 'críticos'}
                                    </span>
                                </div>

                                {/* Lista Scrollable */}
                                <div className="flex-1 overflow-y-auto space-y-2 py-3 pr-1 [scrollbar-width:thin] scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
                                    {lowStockItems.length > 0 ? (
                                        lowStockItems.map(item => (
                                            <div
                                                key={item.id}
                                                onClick={() => navigate('/gestion/inventario')}
                                                className="p-2.5 rounded-2xl bg-gray-50/80 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-700/60 flex items-center justify-between gap-3 hover:border-amber-300 dark:hover:border-amber-600/50 hover:bg-amber-50/30 dark:hover:bg-amber-950/20 transition-all cursor-pointer group active:scale-[0.99]"
                                                title="Click para ver en inventario"
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs flex-shrink-0 ${
                                                        item.stock <= 10
                                                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                                                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                                    }`}>
                                                        {item.stock}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate group-hover:text-primary transition-colors">
                                                            {item.name}
                                                        </p>
                                                        <p className="text-[10px] text-gray-400">
                                                            {item.stock <= 10 ? '🚨 Nivel muy bajo' : '⚠️ Reabastecer pronto'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex-shrink-0 ${
                                                    item.stock <= 10
                                                        ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                                                }`}>
                                                    {item.stock} pzs
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
                                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 flex items-center justify-center mb-2">
                                                <span className="material-symbols-outlined text-2xl">check_circle</span>
                                            </div>
                                            <p className="text-xs font-bold text-gray-700 dark:text-gray-300">Stock Óptimo</p>
                                            <p className="text-[11px] text-gray-400 mt-0.5">Todos los insumos cuentan con más de 50 piezas disponibles.</p>
                                        </div>
                                    )}
                                </div>

                                {/* Pie de Tarjeta con acceso rápido */}
                                <div className="pt-3 border-t border-gray-100 dark:border-gray-700/70 flex items-center justify-between">
                                    <span className="text-[10px] text-gray-400 font-medium">
                                        Total alertas: {lowStockItems.length}
                                    </span>
                                    <button
                                        onClick={() => navigate('/gestion/inventario')}
                                        className="text-xs font-bold text-primary hover:underline flex items-center gap-1 active:scale-95"
                                    >
                                        Administrar Stock →
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Gráfica de Distribución de Gastos */}
                    <div>
                        <ExpensePieChart expenses={expenses} />
                    </div>

                    {/* Sección de Análisis de Ventas y Productos Estrella */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
};

export default Resumen;
