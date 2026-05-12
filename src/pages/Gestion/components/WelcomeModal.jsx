import React, { useState, useEffect } from 'react';
import { 
    FaRocket, FaBalanceScale, FaTools, FaUserShield, 
    FaCheckCircle, FaTimes, FaArrowRight 
} from 'react-icons/fa';

const APP_VERSION = '2.1.0'; // Cambia esto para volver a mostrar el modal en futuras actualizaciones

const WelcomeModal = () => {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const lastSeenVersion = localStorage.getItem('darmax_last_version');
        if (lastSeenVersion !== APP_VERSION) {
            // Pequeño delay para que la página cargue suavemente antes de mostrarlo
            const timer = setTimeout(() => setIsOpen(true), 800);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleClose = () => {
        localStorage.setItem('darmax_last_version', APP_VERSION);
        setIsOpen(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-gray-800 rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700 flex flex-col animate-in zoom-in-95 duration-500">
                
                {/* Header con gradiente */}
                <div className="p-8 bg-gradient-to-br from-primary to-blue-700 text-white relative overflow-hidden shrink-0">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20">
                                Update v{APP_VERSION}
                            </span>
                            <span className="text-blue-200 text-xs font-bold italic animate-pulse">¡Nuevas funciones activas!</span>
                        </div>
                        <h2 className="text-3xl font-black uppercase tracking-tighter italic">Evolución Darmax</h2>
                        <p className="text-blue-100 text-sm font-medium mt-1">Hemos optimizado tu panel para una gestión más profesional.</p>
                    </div>
                    {/* Icono de fondo decorativo */}
                    <FaRocket className="absolute -right-4 -bottom-4 text-white/10 text-9xl rotate-12" />
                </div>

                <div className="p-8 sm:p-10 overflow-y-auto custom-scrollbar space-y-8 bg-gray-50/30 dark:bg-transparent">
                    
                    {/* Cambio 1: Sidebar */}
                    <div className="flex gap-5">
                        <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 shadow-inner">
                            <FaRocket size={20} />
                        </div>
                        <div>
                            <h3 className="font-black text-gray-800 dark:text-white uppercase tracking-tight text-sm">Nueva Navegación</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed mt-1">
                                Menú reorganizado en grupos inteligentes: <strong className="text-indigo-500">Darmax Corp</strong>, <strong className="text-indigo-500">Ingeniería</strong> y <strong className="text-indigo-500">Contenido Web</strong>. Todo a un clic.
                            </p>
                        </div>
                    </div>

                    {/* Cambio 2: Ingeniería */}
                    <div className="flex gap-5">
                        <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 shadow-inner">
                            <FaTools size={20} />
                        </div>
                        <div>
                            <h3 className="font-black text-gray-800 dark:text-white uppercase tracking-tight text-sm">Módulo de Ingeniería</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed mt-1">
                                Crea listas maestras de materiales para cada modelo de vending. Los instaladores ahora pueden consultar qué piezas llevan sus equipos antes de salir a campo.
                            </p>
                        </div>
                    </div>

                    {/* Cambio 3: Área Legal */}
                    <div className="flex gap-5">
                        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 shadow-inner">
                            <FaBalanceScale size={20} />
                        </div>
                        <div>
                            <h3 className="font-black text-gray-800 dark:text-white uppercase tracking-tight text-sm">Área Legal y Formatos</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed mt-1">
                                Nuevo apartado dedicado a documentos y contratos. Pronto podrás generar contratos legales dinámicos usando tus nuevas plantillas de imagen.
                            </p>
                        </div>
                    </div>

                    {/* Cambio 4: Roles */}
                    <div className="flex gap-5">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 shadow-inner">
                            <FaUserShield size={20} />
                        </div>
                        <div>
                            <h3 className="font-black text-gray-800 dark:text-white uppercase tracking-tight text-sm">Roles y Personal Corregidos</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed mt-1">
                                La gestión de personal ahora es 100% precisa. Asigna colaboradores a roles específicos directamente desde el módulo de permisos sin errores de guardado.
                            </p>
                        </div>
                    </div>

                </div>

                {/* Footer / Acción */}
                <div className="p-8 bg-gray-50 dark:bg-gray-900/40 border-t dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-emerald-500 font-bold text-[10px] uppercase tracking-widest">
                        <FaCheckCircle /> Sistema Actualizado
                    </div>
                    <button 
                        onClick={handleClose}
                        className="w-full sm:w-auto px-10 py-4 bg-gray-800 text-white font-black rounded-2xl uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 group"
                    >
                        Empezar a trabajar <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WelcomeModal;
