import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = [
    '#3b82f6', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', 
    '#06b6d4', '#ec4899', '#6366f1', '#14b8a6', '#d946ef'
];

const processExpenseData = (expenses) => {
    if (!expenses || expenses.length === 0) {
        return [];
    }

    const expenseMap = new Map();
    expenses.forEach(expense => {
        const category = expense.description ? expense.description.trim().toLowerCase() : 'otros';
        const currentTotal = expenseMap.get(category) || 0;
        expenseMap.set(category, currentTotal + expense.amount);
    });

    return Array.from(expenseMap, ([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value: parseFloat(value.toFixed(2)),
    })).sort((a, b) => b.value - a.value);
};

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0];
        return (
            <div className="p-3 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-100 dark:border-gray-700/80 rounded-2xl shadow-xl space-y-1">
                <p className="font-bold text-xs text-gray-900 dark:text-white">{`${data.name}`}</p>
                <p className="text-primary font-black text-sm">{`${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(data.value)}`}</p>
                <p className="text-[10px] font-bold text-gray-400">{`${(data.percent * 100).toFixed(1)}% del total`}</p>
            </div>
        );
    }
    return null;
};

const ExpensePieChart = ({ expenses }) => {
    const chartData = useMemo(() => processExpenseData(expenses), [expenses]);

    if (chartData.length === 0) {
        return (
            <div className="p-5 sm:p-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-xs border border-gray-100 dark:border-gray-700/80 h-full flex flex-col items-center justify-center text-center">
                <div className="w-10 h-10 rounded-2xl bg-gray-50 dark:bg-gray-900 text-gray-400 flex items-center justify-center mb-2">
                    <span className="material-symbols-outlined text-xl">pie_chart</span>
                </div>
                <h3 className="text-base font-black text-gray-900 dark:text-white mb-1 tracking-tight">Distribución de Gastos</h3>
                <p className="text-xs text-gray-400">No hay datos de gastos registrados.</p>
            </div>
        );
    }

    return (
        <div className="p-5 sm:p-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-xs border border-gray-100 dark:border-gray-700/80 hover:border-gray-200 dark:hover:border-gray-600 transition-all duration-200 h-full flex flex-col">
            <div className="mb-4">
                <h3 className="text-base font-black text-gray-900 dark:text-white tracking-tight leading-tight">Distribución de Gastos</h3>
                <p className="text-xs text-gray-400 font-medium mt-0.5">Desglose porcentual por categorías</p>
            </div>
            <div className="flex-grow w-full min-h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend 
                            iconType="circle"
                            layout="horizontal"
                            verticalAlign="bottom"
                            align="center"
                            wrapperStyle={{
                                fontSize: '11px',
                                paddingTop: '10px'
                            }}
                            formatter={(value) => <span className="text-gray-600 dark:text-gray-300 font-medium text-[11px]">{value}</span>}
                        />
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={95}
                            paddingAngle={3}
                            dataKey="value"
                            nameKey="name"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ExpensePieChart;
