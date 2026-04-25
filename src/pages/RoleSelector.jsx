// src/pages/RoleSelector.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../layouts/MainLayout';
import { 
  MdAdminPanelSettings, 
  MdStorefront, 
  MdLocalShipping, 
  MdShoppingBag, 
  MdLogout 
} from 'react-icons/md';

const RoleSelector = () => {
    const { hasModuleAccess, user, logout } = useAuth();
    const navigate = useNavigate();

    // Definición de Opciones Maestras
    const options = [
        {
            id: 'management',
            label: 'Panel de Gestión',
            desc: 'Administración, RRHH y Finanzas',
            icon: <MdAdminPanelSettings size={32} />,
            path: '/gestion',
            module: 'management',
            color: 'bg-blue-600',
            lightColor: 'bg-blue-50 dark:bg-blue-900/20',
            textColor: 'text-blue-600 dark:text-blue-400'
        },
        {
            id: 'pos',
            label: 'Caja y Ventas',
            desc: 'Vender en mostrador y cobrar',
            icon: <MdStorefront size={32} />,
            path: '/ventas/mostrador',
            module: 'pos',
            color: 'bg-emerald-600',
            lightColor: 'bg-emerald-50 dark:bg-blue-900/20',
            textColor: 'text-emerald-600 dark:text-emerald-400'
        },
        {
            id: 'delivery',
            label: 'Reparto',
            desc: 'Ver rutas y entregar pedidos',
            icon: <MdLocalShipping size={32} />,
            path: '/repartidor/dashboard',
            module: 'delivery',
            color: 'bg-amber-600',
            lightColor: 'bg-amber-50 dark:bg-blue-900/20',
            textColor: 'text-amber-600 dark:text-amber-400'
        },
        {
            id: 'orders',
            label: 'Vista Cliente',
            desc: 'Hacer pedidos y ver mis compras',
            icon: <MdShoppingBag size={32} />,
            path: '/pedidos',
            module: 'orders',
            color: 'bg-indigo-600',
            lightColor: 'bg-indigo-50 dark:bg-blue-900/20',
            textColor: 'text-indigo-600 dark:text-indigo-400'
        }
    ];

    // Filtrar opciones según permisos reales del usuario
    const availableOptions = options.filter(opt => hasModuleAccess(opt.module));

    const handleSelect = (path) => {
        navigate(path);
    };

    return (
        <MainLayout>
            <div className="min-h-[85vh] flex flex-col justify-center items-center px-4 py-12 w-full font-display">
                <div className="w-full max-w-2xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-12 animate-fade-in">
                        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                            Hola, <span className="text-primary">{user?.name?.split(' ')[0]}</span>
                        </h1>
                        <p className="mt-3 text-gray-500 dark:text-gray-400 text-lg">
                            ¿En qué modo deseas trabajar hoy?
                        </p>
                    </div>

                    {/* Grid de Opciones */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-slide-up">
                        {availableOptions.map((opt) => (
                            <button
                                key={opt.id}
                                onClick={() => handleSelect(opt.path)}
                                className="group relative flex items-center p-6 bg-white dark:bg-gray-800 border-2 border-transparent hover:border-primary/30 rounded-[2rem] transition-all text-left shadow-sm hover:shadow-xl hover:-translate-y-1 overflow-hidden"
                            >
                                {/* Decoración de fondo al hover */}
                                <div className={`absolute -right-4 -bottom-4 w-24 h-24 ${opt.lightColor} rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity`}></div>

                                <div className={`w-16 h-16 ${opt.lightColor} ${opt.textColor} rounded-2xl flex items-center justify-center mr-5 group-hover:scale-110 transition-transform flex-shrink-0`}>
                                    {opt.icon}
                                </div>
                                
                                <div className="min-w-0 flex-1 relative z-10">
                                    <h3 className="font-black text-gray-900 dark:text-white text-xl leading-tight">
                                        {opt.label}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-snug">
                                        {opt.desc}
                                    </p>
                                </div>

                                <div className="ml-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 text-primary">
                                    <span className="material-symbols-outlined font-black">chevron_right</span>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-12 pt-8 border-t border-gray-100 dark:border-gray-700 flex justify-center animate-fade-in">
                        <button 
                            onClick={logout}
                            className="flex items-center gap-2 px-6 py-3 text-gray-400 hover:text-red-500 font-bold transition-colors rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10"
                        >
                            <MdLogout size={20} />
                            CERRAR SESIÓN
                        </button>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default RoleSelector;
