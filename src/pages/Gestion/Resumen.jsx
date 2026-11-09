import { useMemo, useState, useEffect } from "react";
import { useGestion } from "./context/GestionContext";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import CashFlowChart from "./components/CashFlowChart";
import ExpensePieChart from './components/ExpensePieChart';
import SalesByChannelChart from './components/SalesByChannelChart';
import TopSellingProducts from './components/TopSellingProducts';
import ConsolidatedReports from './components/ConsolidatedReports';

const StatCard = ({ title, value, subtext, type, badgeText, icon }) => {
    let valueColorClass = "text-gray-900 dark:text-white";
    let badgeDotClass = "bg-primary";
    let iconBgClass = "bg-primary/10 text-primary dark:text-blue-400";
    let borderHover = "hover:border-primary/40 dark:hover:border-primary/40";

    if (type === "income") {
        valueColorClass = "text-emerald-600 dark:text-emerald-400";
        badgeDotClass = "bg-emerald-500";
        iconBgClass = "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400";
        borderHover = "hover:border-emerald-300 dark:hover:border-emerald-700/50";
    }
    if (type === "expense") {
        valueColorClass = "text-rose-600 dark:text-rose-400";
        badgeDotClass = "bg-rose-500";
        iconBgClass = "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400";
        borderHover = "hover:border-rose-300 dark:hover:border-rose-700/50";
    }
    if (type === "netProfit") {
        valueColorClass = value < 0 ? "text-rose-600 dark:text-rose-400" : "text-primary dark:text-blue-400";
        badgeDotClass = value < 0 ? "bg-rose-500" : "bg-primary";
        iconBgClass = value < 0 ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600" : "bg-primary/10 text-primary dark:text-blue-400";
        borderHover = "hover:border-primary/40 dark:hover:border-primary/40";
    }

    const formattedValue = new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
    }).format(value);

    return (
        <div className={`p-6 sm:p-7 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-xs border border-gray-100 dark:border-gray-700/80 transition-all duration-200 ease-out hover:shadow-lg hover:shadow-gray-900/5 dark:hover:shadow-black/25 ${borderHover} flex flex-col justify-between group active:scale-[0.99] select-none h-full`}>
            <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2.5">
                    <span className={`w-2 h-2 rounded-full ${badgeDotClass} animate-pulse flex-shrink-0`}></span>
                    <span className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        {title}
                    </span>
                </div>
                {icon && (
                    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center ${iconBgClass} transition-transform group-hover:scale-105 duration-200 flex-shrink-0`}>
                        <span className="material-symbols-outlined text-xl">{icon}</span>
                    </div>
                )}
            </div>
            <div className="mt-4">
                <p className={`text-3xl sm:text-4xl font-black tracking-tight tabular-nums leading-tight ${valueColorClass}`}>
                    {formattedValue}
                </p>
                {subtext && (
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-700/60 text-gray-500 dark:text-gray-400 border border-gray-200/50 dark:border-gray-600/50">
                            {subtext}
                        </span>
                        {badgeText && (
                            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
                                {badgeText}
                            </span>
                        )}
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
    
    // Estado para controlar cuántos elementos de inventario se muestran por defecto
    const [showAllInventory, setShowAllInventory] = useState(false);

    // Validación RBAC: acceso.resumenoperativo
    useEffect(() => {
        if (loading) return;
        
        if (!hasPermission('acceso.resumenoperativo') && !hasPermission('canViewSummary')) {
            console.log("No cuentas con permiso para ver el Resumen Operativo. Redirigiendo a tu sección asignada...");
            
            if (hasPermission('acceso.inventarioglobal') || hasPermission('canAccessInventory')) navigate('/gestion/inventario', { replace: true });
            else if (hasPermission('acceso.cortesvending') || hasPermission('canAccessVending')) navigate('/gestion/vending', { replace: true });
            else if (hasPermission('acceso.cotizadordistribuidor') || hasPermission('canAccessDistributorQuotes')) navigate('/gestion/cotizador-distribuidores', { replace: true });
            else if (hasPermission('acceso.cotizadordarmax') || hasPermission('canAccessQuotes')) navigate('/gestion/cotizador', { replace: true });
            else if (hasPermission('acceso.controlinstalacion') || hasPermission('canAccessInstallation')) navigate('/gestion/instalacion', { replace: true });
            else if (hasPermission('acceso.mapainstalaciones') || hasPermission('canAccessShowcase')) navigate('/gestion/mapa-instalaciones', { replace: true });
            else if (hasPermission('acceso.sistemas') || hasPermission('canAccessSistemas') || hasPermission('proyectosactividades.jefe') || hasPermission('proyectosactividades.colaborador') || hasPermission('acceso.proyectosactividades')) navigate('/gestion/sistemas', { replace: true });
            else if (hasPermission('acceso.permisosyroles') || hasPermission('acceso.rolesypermisos')) navigate('/gestion/roles', { replace: true });
            else if (hasPermission('acceso.plannerdigital') || hasPermission('plannerdigital.jefe') || hasPermission('plannerdigital.colaborador') || hasPermission('canAccessMarketing')) navigate('/gestion/marketing', { replace: true });
            else if (hasPermission('acceso.promociones')) navigate('/gestion/promociones', { replace: true });
            else if (hasPermission('acceso.editorblog')) navigate('/gestion/blog', { replace: true });
            else if (hasPermission('acceso.centrodeguias')) navigate('/gestion/guias', { replace: true });
            else if (hasPermission('acceso.tesoreriaingresos') || hasPermission('canAccessFinances')) navigate('/gestion/ingresos', { replace: true });
            else if (hasPermission('acceso.comprasxcp')) navigate('/gestion/compras', { replace: true });
            else if (hasPermission('acceso.contabilidaderp') || hasPermission('canAccessAccounting')) navigate('/gestion/contabilidad', { replace: true });
            else if (hasPermission('acceso.facturacioncfdi')) navigate('/gestion/fiscal', { replace: true });
            else if (hasPermission('acceso.prospeccionleads') || hasPermission('canAccessLeads')) navigate('/gestion/prospeccion', { replace: true });
            else if (hasPermission('acceso.crmycobranza')) navigate('/gestion/crm', { replace: true });
            else if (hasPermission('acceso.gestiondocumental') || hasPermission('canAccessLegal')) navigate('/gestion/documentos', { replace: true });
            else if (hasPermission('acceso.arealegal')) navigate('/gestion/legal', { replace: true });
            else if (hasPermission('acceso.directorio') || hasPermission('canAccessRH')) navigate('/gestion/usuarios', { replace: true });
            else if (hasPermission('acceso.rrhhynominas')) navigate('/gestion/recursos-humanos', { replace: true });
            else if (hasPermission('acceso.configuracionbase') || hasPermission('canAccessConfig')) navigate('/gestion/configuracion', { replace: true });
            else {
                console.warn("Usuario sin sub-módulos de gestión disponibles. Enviando a selector de entorno.");
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

    // Insumos que se muestran: los primeros 4 por defecto, o todos si el usuario expande
    const displayedLowStockItems = useMemo(() => {
        if (showAllInventory) return lowStockItems;
        return lowStockItems.slice(0, 4);
    }, [lowStockItems, showAllInventory]);

    // Margen operativo calculado
    const profitMargin = useMemo(() => {
        if (!totalIncome || totalIncome <= 0) return '0.0%';
        const margin = (netProfit / totalIncome) * 100;
        return `${margin >= 0 ? '+' : ''}${margin.toFixed(1)}% margen`;
    }, [netProfit, totalIncome]);

    return (
        <div className="space-y-6 sm:space-y-8 animate-fade-in pb-16">
            {/* Cuadro de Cabecera: Título, Subtítulo y Controles */}
            <div className="p-5 sm:p-6 lg:p-7 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-xs border border-gray-100 dark:border-gray-700/80 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 transition-all duration-200">
                <div className="space-y-1.5 min-w-0">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-tight truncate">
                        {viewMode === 'consolidated' ? 'Reporte Consolidado (Red)' : 'Resumen Operativo'}
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                        Monitoreo financiero, flujo de efectivo y estado del inventario en tiempo real
                    </p>
                </div>
                
                {/* Controles de Vista y Periodo */}
                <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                    {isAdmin && (
                        <div className="bg-gray-100/80 dark:bg-gray-900/60 backdrop-blur-md p-1.5 rounded-2xl flex items-center border border-gray-200/50 dark:border-gray-700/50 shadow-2xs">
                            <button
                                onClick={() => setViewMode('local')}
                                className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all active:scale-95 touch-manipulation ${
                                    viewMode === 'local' 
                                    ? 'bg-primary text-white shadow-xs' 
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                }`}
                            >
                                Vista Local
                            </button>
                            <button
                                onClick={() => setViewMode('consolidated')}
                                className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all active:scale-95 touch-manipulation ${
                                    viewMode === 'consolidated' 
                                    ? 'bg-primary text-white shadow-xs' 
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                }`}
                            >
                                Red Consolidada
                            </button>
                        </div>
                    )}

                    {viewMode !== 'consolidated' && (
                        <div className="bg-gray-100/80 dark:bg-gray-900/60 backdrop-blur-md p-1.5 rounded-2xl flex items-center border border-gray-200/50 dark:border-gray-700/50 shadow-2xs">
                            <button 
                                onClick={() => setTimePeriod('monthly')}
                                className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all active:scale-95 touch-manipulation ${
                                    timePeriod === 'monthly' 
                                    ? 'bg-primary text-white shadow-xs' 
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                }`}
                            >
                                Este Mes
                            </button>
                            <button 
                                onClick={() => setTimePeriod('annual')}
                                className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all active:scale-95 touch-manipulation ${
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
                /* BENTO GRID UI PRINCIPAL (12 Columnas Modulares) */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 sm:gap-6">
                    {/* TIER 1: KPIs Ejecutivos Principales */}
                    <div className="lg:col-span-4">
                        <StatCard 
                            title={`Ingresos (${timePeriod === 'monthly' ? 'Mes Actual' : 'Año Actual'})`} 
                            value={totalIncome} 
                            subtext={`${incomeTransactions} transacciones registradas`} 
                            type="income" 
                            icon="trending_up"
                        />
                    </div>
                    <div className="lg:col-span-4">
                        <StatCard 
                            title={`Gastos (${timePeriod === 'monthly' ? 'Mes Actual' : 'Año Actual'})`} 
                            value={totalExpenses} 
                            subtext={`${expenseTransactions} transacciones registradas`} 
                            type="expense" 
                            icon="trending_down"
                        />
                    </div>
                    <div className="md:col-span-2 lg:col-span-4">
                        <StatCard 
                            title={`Balance Neto (${timePeriod === 'monthly' ? 'Mes Actual' : 'Año Actual'})`} 
                            value={netProfit} 
                            subtext="Margen Operativo" 
                            badgeText={profitMargin}
                            type="netProfit" 
                            icon="account_balance_wallet"
                        />
                    </div>

                    {/* TIER 2: Flujo de Caja Hero (8 cols) + Inventario Crítico (4 cols) */}
                    <div className="md:col-span-2 lg:col-span-8 min-h-[440px] lg:h-[460px]">
                        <CashFlowChart income={income} expenses={expenses} />
                    </div>

                    <div className="md:col-span-2 lg:col-span-4 min-h-[440px] lg:h-[460px]">
                        {/* Bento Card: Inventario Crítico Compacto y Expandible */}
                        <div className="p-5 sm:p-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-xs border border-gray-100 dark:border-gray-700/80 flex flex-col h-full hover:border-gray-200 dark:hover:border-gray-600 transition-all duration-200">
                            {/* Cabecera con título holgado y badge con pulso */}
                            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700/70 mb-3">
                                <div>
                                    <h3 className="text-base font-black text-gray-900 dark:text-white tracking-tight leading-tight">
                                        Inventario Crítico
                                    </h3>
                                    <p className="text-xs text-gray-400 font-medium mt-0.5">
                                        Insumos con menos de 50 existencias
                                    </p>
                                </div>
                                <span className={`text-[11px] font-black px-3 py-1 rounded-full flex items-center gap-1.5 ${
                                    lowStockItems.length > 0
                                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                                }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${lowStockItems.length > 0 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                                    {lowStockItems.length} {lowStockItems.length === 1 ? 'crítico' : 'críticos'}
                                </span>
                            </div>

                            {/* Lista con scroll y límite de registros por defecto */}
                            <div className="flex-1 overflow-y-auto space-y-2 py-1 pr-1 [scrollbar-width:thin] scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
                                {displayedLowStockItems.length > 0 ? (
                                    displayedLowStockItems.map(item => (
                                        <div
                                            key={item.id}
                                            onClick={() => navigate('/gestion/inventario')}
                                            className="p-2.5 rounded-2xl bg-gray-50/80 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-700/60 flex items-center justify-between gap-3 hover:border-amber-300 dark:hover:border-amber-600/50 hover:bg-amber-50/30 dark:hover:bg-amber-950/20 transition-all cursor-pointer group active:scale-[0.99] touch-manipulation"
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

                            {/* Controles de expansión y navegación inferior */}
                            <div className="pt-3 border-t border-gray-100 dark:border-gray-700/70 mt-auto space-y-2">
                                {lowStockItems.length > 4 && (
                                    <button
                                        type="button"
                                        onClick={() => setShowAllInventory(!showAllInventory)}
                                        className="w-full py-1.5 px-3 rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-gray-900/50 dark:hover:bg-gray-700/50 text-[11px] font-bold text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary border border-gray-200/50 dark:border-gray-700/50 transition-all flex items-center justify-center gap-1.5 active:scale-98 touch-manipulation"
                                    >
                                        <span>{showAllInventory ? 'Mostrar menos' : `Ver todos (${lowStockItems.length} registros)`}</span>
                                        <span className={`material-symbols-outlined text-sm transition-transform duration-200 ${showAllInventory ? 'rotate-180' : ''}`}>
                                            expand_more
                                        </span>
                                    </button>
                                )}

                                <div className="flex items-center justify-between pt-1">
                                    <span className="text-[10px] text-gray-400 font-medium">
                                        {lowStockItems.length} insumos en alerta
                                    </span>
                                    <button
                                        onClick={() => navigate('/gestion/inventario')}
                                        className="text-xs font-bold text-primary hover:underline flex items-center gap-1 active:scale-95 touch-manipulation"
                                    >
                                        Administrar Stock →
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* TIER 3: Trilogía Analítica Equitativa (3 Columnas de 4) */}
                    <div className="md:col-span-1 lg:col-span-4 min-h-[440px] lg:h-[460px]">
                        <SalesByChannelChart dailySalesRecords={dailySalesRecords} />
                    </div>

                    <div className="md:col-span-1 lg:col-span-4 min-h-[440px] lg:h-[460px]">
                        <ExpensePieChart expenses={expenses} />
                    </div>

                    <div className="md:col-span-2 lg:col-span-4 min-h-[440px] lg:h-[460px]">
                        <TopSellingProducts dailySalesRecords={dailySalesRecords} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Resumen;
