import React, { useMemo } from 'react';

const processTopProductsData = (records) => {
    if (!records || records.length === 0) {
        return [];
    }

    const productTotals = records.reduce((acc, record) => {
        acc['Garrafón de Color'] += record.totalTipoGarrafonColor || 0;
        acc['Bonafont'] += record.totalTipoGarrafonBon || 0;
        acc['Epura'] += record.totalTipoGarrafonEpura || 0;
        acc['Ciel'] += record.totalTipoGarrafonCiel || 0;
        acc['Electropura'] += record.totalTipoGarrafonElectro || 0;
        acc['Garrafón 10L'] += record.totalTipoGarrafon10Lts || 0;
        acc['Venta de Garrafón Vacío'] += record.totalTipoGarrafonVtaG || 0;
        return acc;
    }, {
        'Garrafón de Color': 0,
        'Bonafont': 0,
        'Epura': 0,
        'Ciel': 0,
        'Electropura': 0,
        'Garrafón 10L': 0,
        'Venta de Garrafón Vacío': 0,
    });

    return Object.entries(productTotals)
        .map(([name, quantity]) => ({ name, quantity }))
        .filter(p => p.quantity > 0)
        .sort((a, b) => b.quantity - a.quantity);
};

const TopSellingProducts = ({ dailySalesRecords }) => {
    const topProducts = useMemo(() => processTopProductsData(dailySalesRecords), [dailySalesRecords]);

    const getMedal = (index) => {
        if (index === 0) return <span className="text-lg">🥇</span>;
        if (index === 1) return <span className="text-lg">🥈</span>;
        if (index === 2) return <span className="text-lg">🥉</span>;
        return <span className="text-xs font-black text-gray-400 dark:text-gray-500">#{index + 1}</span>;
    };

    return (
        <div className="p-5 sm:p-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-xs border border-gray-100 dark:border-gray-700/80 hover:border-gray-200 dark:hover:border-gray-600 transition-all duration-200 h-full flex flex-col">
            <div className="mb-3.5 pb-2 border-b border-gray-100 dark:border-gray-700/70">
                <h3 className="text-sm font-black text-gray-900 dark:text-white">Productos Más Vendidos</h3>
                <p className="text-[10px] text-gray-400 font-bold mt-0.5">Ranking por volumen de unidades</p>
            </div>
            {topProducts.length > 0 ? (
                <ul className="flex-1 overflow-y-auto space-y-2 pr-1 [scrollbar-width:thin]">
                    {topProducts.map((product, index) => (
                        <li 
                            key={product.name} 
                            className="flex items-center gap-3 p-2.5 rounded-2xl bg-gray-50/80 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-700/60 transition-all hover:bg-gray-100/60 dark:hover:bg-gray-800/60"
                        >
                            <div className="w-7 flex items-center justify-center flex-shrink-0">{getMedal(index)}</div>
                            <div className="flex-grow min-w-0">
                                <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">{product.name}</p>
                            </div>
                            <div className="text-xs font-black text-primary dark:text-blue-400 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200/50 dark:border-blue-800/50 tabular-nums">
                                {product.quantity.toLocaleString()} u.
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="flex-grow flex flex-col items-center justify-center text-center p-4">
                    <span className="material-symbols-outlined text-gray-400 text-2xl mb-1">inventory_2</span>
                    <p className="text-xs text-gray-400">No hay datos de ventas registrados.</p>
                </div>
            )}
        </div>
    );
};

export default TopSellingProducts;
