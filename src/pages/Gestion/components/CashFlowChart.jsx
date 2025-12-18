import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { 
    format, 
    startOfWeek, endOfWeek, 
    startOfMonth, endOfMonth, 
    startOfYear, endOfYear, 
    eachDayOfInterval, eachHourOfInterval, eachMonthOfInterval,
    addDays, subDays,
    addWeeks, subWeeks,
    addMonths, subMonths,
    addYears, subYears,
} from 'date-fns';
import { es } from 'date-fns/locale';

// This function now takes a referenceDate to calculate intervals
const processData = (income, expenses, timeframe, referenceDate) => {
    let interval;
    let formatLabel;
    let dataPoints = {};

    switch (timeframe) {
        case 'Día':
            interval = { start: new Date(referenceDate).setHours(0,0,0,0), end: new Date(referenceDate).setHours(23,59,59,999) };
            formatLabel = (date) => format(date, 'HH:00');
            eachHourOfInterval({start: interval.start, end: interval.end}).forEach(hour => {
                const label = formatLabel(hour);
                dataPoints[label] = { name: label, ingresos: 0, gastos: 0 };
            });
            break;
        case 'Semana':
            interval = { start: startOfWeek(referenceDate, { weekStartsOn: 1 }), end: endOfWeek(referenceDate, { weekStartsOn: 1 }) };
            formatLabel = (date) => format(date, 'EEE', { locale: es });
            eachDayOfInterval(interval).forEach(day => {
                const label = formatLabel(day);
                dataPoints[label] = { name: label, ingresos: 0, gastos: 0 };
            });
            break;
        case 'Año':
            interval = { start: startOfYear(referenceDate), end: endOfYear(referenceDate) };
            formatLabel = (date) => format(date, 'MMM', { locale: es });
            eachMonthOfInterval(interval).forEach(month => {
                const label = formatLabel(month);
                dataPoints[label] = { name: label, ingresos: 0, gastos: 0 };
            });
            break;
        case 'Mes':
        default:
            interval = { start: startOfMonth(referenceDate), end: endOfMonth(referenceDate) };
            formatLabel = (date) => format(date, 'dd');
            eachDayOfInterval(interval).forEach(day => {
                const label = formatLabel(day);
                dataPoints[label] = { name: label, ingresos: 0, gastos: 0 };
            });
            break;
    }
    
    const getGroupKey = (date) => {
        const d = new Date(date);
        if (timeframe === 'Día') return format(d, 'HH:00');
        if (timeframe === 'Semana') return format(d, 'EEE', { locale: es });
        if (timeframe === 'Mes') return format(d, 'dd');
        if (timeframe === 'Año') return format(d, 'MMM', { locale: es });
        return '';
    };

    [...income, ...expenses].forEach(item => {
        const itemDate = new Date(item.date);
        if (itemDate >= interval.start && itemDate <= interval.end) {
            const key = getGroupKey(itemDate);
            if (dataPoints[key]) {
                if (item.description.toLowerCase().includes('gasto')) { // Differentiating based on item type if not explicit
                     dataPoints[key].gastos += item.amount;
                } else {
                     dataPoints[key].ingresos += item.amount;
                }
            }
        }
    });

    // A better approach assuming 'expenses' array from context
     expenses.forEach(item => {
        const itemDate = new Date(item.date);
        if (itemDate >= interval.start && itemDate <= interval.end) {
            const key = getGroupKey(itemDate);
            if (dataPoints[key]) {
                dataPoints[key].gastos += item.amount;
            }
        }
    });
     income.forEach(item => {
        const itemDate = new Date(item.date);
        if (itemDate >= interval.start && itemDate <= interval.end) {
            const key = getGroupKey(itemDate);
            if (dataPoints[key]) {
                dataPoints[key].ingresos += item.amount;
            }
        }
    });


    return Object.values(dataPoints);
};


const CashFlowChart = ({ income, expenses }) => {
    const [timeframe, setTimeframe] = useState('Mes');
    const [referenceDate, setReferenceDate] = useState(new Date());
    const timeframes = ['Día', 'Semana', 'Mes', 'Año'];

    const chartData = useMemo(() => processData(income, expenses, timeframe, referenceDate), [income, expenses, timeframe, referenceDate]);

    const handleNavigate = (direction) => {
        const newDate = {
            'Día': direction === 'prev' ? subDays(referenceDate, 1) : addDays(referenceDate, 1),
            'Semana': direction === 'prev' ? subWeeks(referenceDate, 1) : addWeeks(referenceDate, 1),
            'Mes': direction === 'prev' ? subMonths(referenceDate, 1) : addMonths(referenceDate, 1),
            'Año': direction === 'prev' ? subYears(referenceDate, 1) : addYears(referenceDate, 1),
        }[timeframe];
        setReferenceDate(newDate);
    };

    const getButtonClassName = (buttonTimeframe) => {
        return `px-3 py-1 text-sm font-medium rounded-md transition-colors ${
            timeframe === buttonTimeframe
                ? 'bg-primary text-white shadow'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-primary/80 hover:text-white'
        }`;
    };

    const displayInterval = useMemo(() => {
        switch (timeframe) {
            case 'Día': return format(referenceDate, 'd MMMM, yyyy', { locale: es });
            case 'Semana': 
                const start = startOfWeek(referenceDate, { weekStartsOn: 1 });
                const end = endOfWeek(referenceDate, { weekStartsOn: 1 });
                return `${format(start, 'd MMM')} - ${format(end, 'd MMM, yyyy')}`;
            case 'Año': return format(referenceDate, 'yyyy');
            case 'Mes':
            default: return format(referenceDate, 'MMMM yyyy', { locale: es });
        }
    }, [timeframe, referenceDate]);

    return (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg h-full flex flex-col">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                <h3 className="text-lg font-semibold text-[#111418] dark:text-white">Flujo de Caja</h3>
                <div className="flex items-center gap-2">
                    <button onClick={() => handleNavigate('prev')} className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">
                        <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    <span className="flex-1 text-center text-sm font-semibold text-gray-600 dark:text-gray-300">{displayInterval}</span>
                    <button onClick={() => handleNavigate('next')} className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">
                        <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                </div>
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
                        <Line type="monotone" dataKey="ingresos" name="Ingresos" stroke="#16a34a" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="gastos" name="Gastos" stroke="#dc2626" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default CashFlowChart;