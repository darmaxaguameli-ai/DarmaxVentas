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

    expenses?.forEach(item => {
        const itemDate = new Date(item.date);
        if (itemDate >= interval.start && itemDate <= interval.end) {
            const key = getGroupKey(itemDate);
            if (dataPoints[key]) {
                dataPoints[key].gastos += item.amount;
            }
        }
    });
    
    income?.forEach(item => {
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
        return `px-3 py-1.5 text-xs font-bold rounded-xl transition-all active:scale-95 touch-manipulation ${
            timeframe === buttonTimeframe
                ? 'bg-primary text-white shadow-xs'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
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
        <div className="p-5 sm:p-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-xs border border-gray-100 dark:border-gray-700/80 hover:border-gray-200 dark:hover:border-gray-600 transition-all duration-200 h-full flex flex-col">
            <div className="flex justify-between items-center mb-5 flex-wrap gap-3">
                <div>
                    <h3 className="text-base font-black text-gray-900 dark:text-white tracking-tight leading-tight">Flujo de Caja</h3>
                    <p className="text-xs text-gray-400 font-medium mt-0.5">Dinámica comparativa de ingresos vs gastos</p>
                </div>
                <div className="flex items-center gap-1.5 bg-gray-50/80 dark:bg-gray-900/40 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-2xs">
                    <button onClick={() => handleNavigate('prev')} className="h-7 w-7 flex items-center justify-center rounded-xl hover:bg-gray-200/60 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 active:scale-95 transition-all touch-manipulation" aria-label="Anterior">
                        <span className="material-symbols-outlined text-base">chevron_left</span>
                    </button>
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300 px-2 min-w-[110px] text-center select-none">{displayInterval}</span>
                    <button onClick={() => handleNavigate('next')} className="h-7 w-7 flex items-center justify-center rounded-xl hover:bg-gray-200/60 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 active:scale-95 transition-all touch-manipulation" aria-label="Siguiente">
                        <span className="material-symbols-outlined text-base">chevron_right</span>
                    </button>
                </div>
                <div className="flex items-center gap-1 bg-gray-50/80 dark:bg-gray-900/40 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-2xs">
                    {timeframes.map(t => (
                        <button key={t} onClick={() => setTimeframe(t)} className={getButtonClassName(t)}>
                            {t}
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex-grow w-full min-h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
                        <XAxis dataKey="name" tick={{ fill: '#9ca3af' }} fontSize={11} />
                        <YAxis tick={{ fill: '#9ca3af' }} fontSize={11} tickFormatter={(value) => `$${value.toLocaleString()}`} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                backdropFilter: 'blur(12px)',
                                border: '1px solid rgba(229, 231, 235, 0.8)',
                                borderRadius: '1rem',
                                color: '#111827',
                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                                fontSize: '12px',
                                fontWeight: '600'
                            }}
                            formatter={(value, name) => [value.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }), name]}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                        <Line type="monotone" dataKey="ingresos" name="Ingresos" stroke="#10b981" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: '#10b981' }} />
                        <Line type="monotone" dataKey="gastos" name="Gastos" stroke="#f43f5e" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: '#f43f5e' }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default CashFlowChart;
