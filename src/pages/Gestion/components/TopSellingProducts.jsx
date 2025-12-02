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
        if (index === 0) return <span className="text-xl text-amber-400">🥇</span>;
        if (index === 1) return <span className="text-xl text-gray-400">🥈</span>;
        if (index === 2) return <span className="text-xl text-amber-600">🥉</span>;
        return <span className="text-sm font-bold text-gray-500 dark:text-gray-400">{index + 1}.</span>;
    };

    return (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg min-h-[300px] h-[450px] flex flex-col">
            <h3 className="text-lg font-semibold text-[#111418] dark:text-white mb-4">Productos Más Vendidos (Unidades)</h3>
            {topProducts.length > 0 ? (
                <ul className="space-y-4 overflow-y-auto pr-2">
                    {topProducts.map((product, index) => (
                        <li key={product.name} className="flex items-center gap-4">
                            <div className="w-6 text-center">{getMedal(index)}</div>
                            <div className="flex-grow">
                                <p className="font-medium text-gray-800 dark:text-gray-200">{product.name}</p>
                            </div>
                            <div className="text-lg font-bold text-primary">
                                {product.quantity.toLocaleString()}
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="flex-grow flex items-center justify-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">No hay datos de ventas para mostrar.</p>
                </div>
            )}
        </div>
    );
};

export default TopSellingProducts;
