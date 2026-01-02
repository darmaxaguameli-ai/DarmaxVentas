import React, { useEffect, useState } from 'react';
import { fetchConsolidatedReport } from '../../../api/apiClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ConsolidatedReports = () => {
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await fetchConsolidatedReport();
                setReportData(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando reporte consolidado...</div>;
    if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

    // Calculate totals for summary cards
    const grandTotalIncome = reportData.reduce((acc, curr) => acc + curr.totalIncome, 0);
    const grandTotalExpense = reportData.reduce((acc, curr) => acc + curr.totalExpense, 0);
    const grandTotalProfit = grandTotalIncome - grandTotalExpense;

    const formatCurrency = (val) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border-l-4 border-green-500">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Ingresos Totales (Red)</h3>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white mt-2">{formatCurrency(grandTotalIncome)}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border-l-4 border-red-500">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Gastos Totales (Red)</h3>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white mt-2">{formatCurrency(grandTotalExpense)}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border-l-4 border-blue-500">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Utilidad Neta (Red)</h3>
                    <p className={`text-2xl font-bold mt-2 ${grandTotalProfit >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600'}`}>
                        {formatCurrency(grandTotalProfit)}
                    </p>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Table View */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">Desglose por Sucursal</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700 text-xs uppercase text-gray-500 dark:text-gray-300">
                                <tr>
                                    <th className="px-6 py-3 text-left tracking-wider">Sucursal</th>
                                    <th className="px-6 py-3 text-right tracking-wider">Ingresos</th>
                                    <th className="px-6 py-3 text-right tracking-wider">Gastos</th>
                                    <th className="px-6 py-3 text-right tracking-wider">Utilidad</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {reportData.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">
                                            {item.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-green-600 font-medium">
                                            {formatCurrency(item.totalIncome)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-red-500">
                                            {formatCurrency(item.totalExpense)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-gray-800 dark:text-gray-200">
                                            {formatCurrency(item.netProfit)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Chart View */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 min-h-[400px]">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6">Comparativa de Rendimiento</h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={reportData}
                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                                <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} />
                                <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(val) => `$${val/1000}k`} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    formatter={(value) => formatCurrency(value)}
                                />
                                <Legend />
                                <Bar dataKey="totalIncome" name="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="totalExpense" name="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConsolidatedReports;
