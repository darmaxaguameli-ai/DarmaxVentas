import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Paleta de colores para el gráfico
const COLORS = [
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', 
    '#FF4560', '#775DD0', '#546E7A', '#26a69a', '#D10CE8'
];

// Función para agrupar gastos por descripción y sumar sus montos
const processExpenseData = (expenses) => {
    if (!expenses || expenses.length === 0) {
        return [];
    }

    const expenseMap = new Map();
    expenses.forEach(expense => {
        // Usamos la descripción como categoría. Se normaliza para agrupar mejor.
        const category = expense.description.trim().toLowerCase();
        const currentTotal = expenseMap.get(category) || 0;
        expenseMap.set(category, currentTotal + expense.amount);
    });

    // Convertir el mapa a un array para Recharts y ordenar de mayor a menor
    const chartData = Array.from(expenseMap, ([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1), // Capitalizar para mostrar
        value: parseFloat(value.toFixed(2)),
    })).sort((a, b) => b.value - a.value);

    return chartData;
};

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0];
        return (
            <div className="p-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                <p className="font-semibold text-gray-900 dark:text-white">{`${data.name}`}</p>
                <p className="text-primary font-medium">{`${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(data.value)}`}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{`(${(data.percent * 100).toFixed(2)}%)`}</p>
            </div>
        );
    }
    return null;
};

const ExpensePieChart = ({ expenses }) => {
    const chartData = useMemo(() => processExpenseData(expenses), [expenses]);

    if (chartData.length === 0) {
        return (
            <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg h-full flex flex-col items-center justify-center">
                <h3 className="text-lg font-semibold text-[#111418] dark:text-white mb-4">Distribución de Gastos</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">No hay datos de gastos para mostrar.</p>
            </div>
        );
    }

    return (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg min-h-[300px] h-[450px] flex flex-col">
            <h3 className="text-lg font-semibold text-[#111418] dark:text-white mb-4">Distribución de Gastos</h3>
            <div className="flex-grow w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend 
                            iconType="circle"
                            layout="vertical" 
                            verticalAlign="middle" 
                            align="right"
                            wrapperStyle={{
                                fontSize: '12px',
                                color: '#6b7280',
                                overflowY: 'auto',
                                maxHeight: '300px'
                            }}
                            formatter={(value) => <span className="dark:text-gray-300 text-gray-600">{value}</span>}
                        />
                        <Pie
                            data={chartData}
                            cx="40%" // Centrar el gráfico un poco a la izquierda para dar espacio a la leyenda
                            cy="50%"
                            innerRadius={60}
                            outerRadius={110}
                            fill="#8884d8"
                            paddingAngle={2}
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
