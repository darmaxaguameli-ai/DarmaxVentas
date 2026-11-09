import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const processChannelData = (records) => {
    if (!records || records.length === 0) {
        return [];
    }

    const totals = records.reduce((acc, record) => {
        acc.mostrador += record.mostradorTotal || 0;
        acc.pedidos += record.pedidosTotal || 0;
        acc.negocios += record.negociosTotal || 0;
        return acc;
    }, { mostrador: 0, pedidos: 0, negocios: 0 });

    return [
        { name: 'Mostrador', Ventas: parseFloat(totals.mostrador.toFixed(2)) },
        { name: 'Pedidos', Ventas: parseFloat(totals.pedidos.toFixed(2)) },
        { name: 'Negocios', Ventas: parseFloat(totals.negocios.toFixed(2)) },
    ].sort((a, b) => b.Ventas - a.Ventas);
};

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="p-3 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-100 dark:border-gray-700/80 rounded-2xl shadow-xl space-y-1">
                <p className="font-bold text-xs text-gray-900 dark:text-white">{label}</p>
                <p className="text-primary font-black text-sm">
                    {`${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(payload[0].value)}`}
                </p>
            </div>
        );
    }
    return null;
};

const SalesByChannelChart = ({ dailySalesRecords }) => {
    const chartData = useMemo(() => processChannelData(dailySalesRecords), [dailySalesRecords]);

    if (chartData.every(channel => channel.Ventas === 0)) {
        return (
            <div className="p-5 sm:p-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-xs border border-gray-100 dark:border-gray-700/80 h-full flex flex-col items-center justify-center text-center">
                <div className="w-10 h-10 rounded-2xl bg-gray-50 dark:bg-gray-900 text-gray-400 flex items-center justify-center mb-2">
                    <span className="material-symbols-outlined text-xl">bar_chart</span>
                </div>
                <h3 className="text-base font-black text-gray-900 dark:text-white mb-1 tracking-tight">Ventas por Canal</h3>
                <p className="text-xs text-gray-400">No hay datos de ventas registrados.</p>
            </div>
        );
    }

    return (
        <div className="p-5 sm:p-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-xs border border-gray-100 dark:border-gray-700/80 hover:border-gray-200 dark:hover:border-gray-600 transition-all duration-200 h-full flex flex-col">
            <div className="mb-4">
                <h3 className="text-base font-black text-gray-900 dark:text-white tracking-tight leading-tight">Ventas por Canal</h3>
                <p className="text-xs text-gray-400 font-medium mt-0.5">Mostrador vs Reparto vs Negocios</p>
            </div>
            <div className="flex-grow w-full min-h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.12} horizontal={false} />
                        <XAxis type="number" tick={{ fill: '#9ca3af' }} fontSize={11} tickFormatter={(value) => `$${value.toLocaleString()}`} />
                        <YAxis type="category" dataKey="name" tick={{ fill: '#6b7280' }} fontSize={11} width={75} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(19, 127, 236, 0.06)' }} />
                        <Bar dataKey="Ventas" fill="#137FEC" barSize={26} radius={[0, 8, 8, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default SalesByChannelChart;
