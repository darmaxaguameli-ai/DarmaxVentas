import React from 'react';
import { FaBalanceScale, FaFileContract, FaShieldAlt } from 'react-icons/fa';

const Legal = () => {
    return (
        <div className="animate-fade-in space-y-8">
            <div className="flex flex-wrap justify-between items-center gap-6">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-black text-gray-800 dark:text-white flex items-center gap-4 tracking-tighter uppercase italic">
                        <div className="bg-primary p-3 rounded-2xl shadow-lg shadow-primary/20 text-white">
                            <FaBalanceScale className="text-2xl" />
                        </div> 
                        ÁREA LEGAL
                    </h1>
                    <div className="text-xs sm:text-sm text-gray-500 font-bold mt-2 flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div> 
                        Gestión de contratos y documentos legales
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-[3rem] border border-gray-100 dark:border-gray-700 shadow-sm p-10 text-center">
                <div className="max-w-md mx-auto space-y-6">
                    <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-3xl flex items-center justify-center mx-auto text-gray-400">
                        <FaFileContract size={40} />
                    </div>
                    <h2 className="text-xl font-black text-gray-800 dark:text-white uppercase tracking-tight">Próximamente: Plantillas Rellenables</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                        Aquí podrás gestionar contratos y documentos legales utilizando plantillas de imagen dinámicas.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Legal;
