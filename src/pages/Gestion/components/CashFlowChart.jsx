import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, eachDayOfInterval, eachMonthOfInterval, getDay, getMonth } from 'date-fns';
import { es } from 'date-fns/locale';

const processData = (income, expenses, timeframe) => {
    const now = new Date();
    let interval;
    let formatLabel;

    switch (timeframe) {
        case 'Día':
            interval = { start: new Date(), end: new Date() };
            formatLabel = (date) => format(date, 'HH:00');
            break;
        case 'Semana':
            interval = { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
            formatLabel = (date) => format(date, 'EEE', { locale: es });
            break;
        case 'Año':
            interval = { start: startOfYear(now), end: endOfYear(now) };
            formatLabel = (date) => format(date, 'MMM', { locale: es });
            break;
        case 'Mes':
        default:
            interval = { start: startOfMonth(now), end: endOfMonth(now) };
            formatLabel = (date) => format(date, 'dd');
            break;
    }

    let dataPoints = {};

    if (timeframe === 'Año') {
        const months = eachMonthOfInterval(interval);
        months.forEach(month => {
            const label = formatLabel(month);
            dataPoints[label] = { name: label, ingresos: 0, gastos: 0 };
        });
    } else {
        const days = eachDayOfInterval(interval);
        days.forEach(day => {
            const label = formatLabel(day);
            dataPoints[label] = { name: label, ingresos: 0, gastos: 0 };
        });
    }
    
    const getGroupKey = (date) => {
        const d = new Date(date);
        if (timeframe === 'Día') return format(d, 'HH:00');
        if (timeframe === 'Semana') return format(d, 'EEE', { locale: es });
        if (timeframe === 'Mes') return format(d, 'dd');
        if (timeframe === 'Año') return format(d, 'MMM', { locale: es });
        return '';
    };

    income.forEach(item => {
        const itemDate = new Date(item.date);
        if (itemDate >= interval.start && itemDate <= interval.end) {
            const key = getGroupKey(itemDate);
            if (dataPoints[key]) {
                dataPoints[key].ingresos += item.amount;
            }
        }
    });

    expenses.forEach(item => {
        const itemDate = new Date(item.date);
        if (itemDate >= interval.start && itemDate <= interval.end) {
            const key = getGroupKey(itemDate);
            if (dataPoints[key]) {
                dataPoints[key].gastos += item.amount;
            }
        }
    });

    return Object.values(dataPoints);
};


const CashFlowChart = ({ income, expenses }) => {
    const [timeframe, setTimeframe] = useState('Mes');
    const timeframes = ['Día', 'Semana', 'Mes', 'Año'];

    const chartData = useMemo(() => processData(income, expenses, timeframe), [income, expenses, timeframe]);

    const getButtonClassName = (buttonTimeframe) => {
        return `px-3 py-1 text-sm font-medium rounded-md transition-colors ${
            timeframe === buttonTimeframe
                ? 'bg-primary text-white shadow'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-primary/80 hover:text-white'
        }`;
    };

    return (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-[#111418] dark:text-white">Flujo de Caja</h3>
                <div className="flex items-center gap-2">
                    {timeframes.map(t => (
                        <button key={t} onClick={() => setTimeframe(t)} className={getButtonClassName(t)}>
                            {t}
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex-grow w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                        <XAxis dataKey="name" tick={{ fill: '#6b7280' }} fontSize={12} />
                        <YAxis tick={{ fill: '#6b7280' }} fontSize={12} tickFormatter={(value) => `$${value.toLocaleString()}`} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                backdropFilter: 'blur(4px)',
                                border: '1px solid #e5e7eb',
                                borderRadius: '0.5rem',
                                color: '#1f2937'
                            }}
                            formatter={(value, name) => [value.toLocaleString('en-US', { style: 'currency', currency: 'USD' }), name]}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="ingresos" stroke="#16a34a" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Ingresos" />
                        <Line type="monotone" dataKey="gastos" stroke="#dc2626" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Gastos" />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default CashFlowChart;
