import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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
            <div className="p-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                <p className="font-semibold text-gray-900 dark:text-white">{label}</p>
                <p className="text-primary font-medium">
                    {`${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(payload[0].value)}`}
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
            <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg h-full flex flex-col items-center justify-center">
                <h3 className="text-lg font-semibold text-[#111418] dark:text-white mb-4">Ventas por Canal</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">No hay datos de ventas por canal para mostrar.</p>
            </div>
        );
    }

    return (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg min-h-[300px] h-[450px] flex flex-col">
            <h3 className="text-lg font-semibold text-[#111418] dark:text-white mb-4">Ventas por Canal</h3>
            <div className="flex-grow w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                        <XAxis type="number" tick={{ fill: '#6b7280' }} fontSize={12} tickFormatter={(value) => `$${value.toLocaleString()}`} />
                        <YAxis type="category" dataKey="name" tick={{ fill: '#6b7280' }} fontSize={12} width={80} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(156, 163, 175, 0.1)' }} />
                        <Bar dataKey="Ventas" fill="#3b82f6" barSize={30} radius={[0, 4, 4, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default SalesByChannelChart;
