import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useGestion } from './context/GestionContext';
import Organigrama from './components/Organigrama';
import EmpleadoModal from './components/EmpleadoModal';
import { 
    fetchNominas, generarNomina, pagarNomina,
    fetchContableEmpresas, fetchContableBancos 
} from '../../api/apiClient';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Tarjeta de métricas moderna con diseño glassmorphic
const StatCard = ({ icon, title, value, subtitle, badge, badgeColor, iconColor, iconBg }) => (
    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/80 dark:border-gray-800/80 p-5 rounded-3xl shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
        <div className="flex items-start justify-between">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${iconBg} ${iconColor} shadow-inner`}>
                <span className="material-symbols-outlined text-2xl">{icon}</span>
            </div>
            {badge && (
                <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${badgeColor}`}>
                    {badge}
                </span>
            )}
        </div>
        <div className="mt-4">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {title}
            </p>
            <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight mt-0.5">
                {value}
            </p>
            {subtitle && (
                <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium mt-1">
                    {subtitle}
                </p>
            )}
        </div>
    </div>
);

const RecursosHumanos = () => {
    const { state, addEmpleado } = useGestion();
    const { empleados, loading: loadingContext, error, users, roles, stores } = state;
    const [view, setView] = useState('resumen'); // 'resumen' | 'nominas'
    const [nominas, setNominas] = useState([]);
    const [empresas, setEmpresas] = useState([]);
    const [selectedEmpresa, setSelectedEmpresa] = useState(null);
    const [bancos, setBancos] = useState([]);
    const [loadingNominas, setLoadingNominas] = useState(false);
    const [isEmpleadoModalOpen, setIsEmpleadoModalOpen] = useState(false);

    useEffect(() => {
        fetchContableEmpresas().then(data => {
            setEmpresas(data || []);
            if (data && data.length > 0) setSelectedEmpresa(data[0]);
        }).catch(() => {
            toast.error('Error al cargar empresas contables');
        });
    }, []);

    useEffect(() => {
        if (selectedEmpresa && view === 'nominas') {
            loadNominas();
            fetchContableBancos(selectedEmpresa.id).then(setBancos).catch(() => {});
        }
    }, [selectedEmpresa, view]);

    // Al alternar entre Dashboard y Nóminas, asegurar que el scroll comience arriba
    useEffect(() => {
        const mainContainer = document.querySelector('main');
        if (mainContainer) {
            mainContainer.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        }
    }, [view]);

    const loadNominas = async () => {
        if (!selectedEmpresa) return;
        setLoadingNominas(true);
        try {
            const data = await fetchNominas(selectedEmpresa.id);
            setNominas(data || []);
        } catch (e) {
            toast.error('Error al cargar nóminas');
        } finally {
            setLoadingNominas(false);
        }
    };

    const handleSaveEmpleado = async (empleadoData) => {
        try {
            await addEmpleado(empleadoData);
            setIsEmpleadoModalOpen(false);
        } catch (err) {
            console.error("Error al guardar empleado:", err);
        }
    };

    const handleGenerarNomina = async () => {
        if (!selectedEmpresa) {
            Swal.fire({
                title: 'Empresa no seleccionada',
                text: 'No hay ninguna Empresa Contable registrada en el sistema. Registra una en Contabilidad antes de generar nóminas.',
                icon: 'warning',
                confirmButtonColor: '#3b82f6'
            });
            return;
        }

        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;

        const { value: formValues } = await Swal.fire({
            title: 'Generar Nómina Mensual',
            html: `
                <div class="space-y-4 text-left p-2">
                    <div>
                        <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Periodo (Mes)</label>
                        <select id="swal-mes" class="swal2-input w-full m-0 text-sm font-semibold rounded-xl">
                            <option value="1" ${currentMonth === 1 ? 'selected' : ''}>Enero</option>
                            <option value="2" ${currentMonth === 2 ? 'selected' : ''}>Febrero</option>
                            <option value="3" ${currentMonth === 3 ? 'selected' : ''}>Marzo</option>
                            <option value="4" ${currentMonth === 4 ? 'selected' : ''}>Abril</option>
                            <option value="5" ${currentMonth === 5 ? 'selected' : ''}>Mayo</option>
                            <option value="6" ${currentMonth === 6 ? 'selected' : ''}>Junio</option>
                            <option value="7" ${currentMonth === 7 ? 'selected' : ''}>Julio</option>
                            <option value="8" ${currentMonth === 8 ? 'selected' : ''}>Agosto</option>
                            <option value="9" ${currentMonth === 9 ? 'selected' : ''}>Septiembre</option>
                            <option value="10" ${currentMonth === 10 ? 'selected' : ''}>Octubre</option>
                            <option value="11" ${currentMonth === 11 ? 'selected' : ''}>Noviembre</option>
                            <option value="12" ${currentMonth === 12 ? 'selected' : ''}>Diciembre</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Año Fiscal</label>
                        <input id="swal-anio" type="number" class="swal2-input w-full m-0 text-sm font-semibold rounded-xl" value="${currentYear}">
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Generar para Personal Activo',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#3b82f6',
            preConfirm: () => {
                const mes = parseInt(document.getElementById('swal-mes').value);
                const anio = parseInt(document.getElementById('swal-anio').value);
                if (isNaN(mes) || isNaN(anio)) {
                    Swal.showValidationMessage('Selecciona mes y año válidos');
                    return false;
                }
                return {
                    mes,
                    anio,
                    empresaId: selectedEmpresa.id
                };
            }
        });

        if (formValues) {
            toast.promise(generarNomina(formValues), {
                loading: 'Calculando dispersión de salarios...',
                success: () => {
                    loadNominas();
                    return 'Nómina generada en borrador exitosamente';
                },
                error: 'Error al generar nómina'
            });
        }
    };

    const handlePagarNomina = async (nomina) => {
        if (!bancos || bancos.length === 0) {
            Swal.fire({
                title: 'Sin cuentas bancarias',
                text: 'No hay cuentas bancarias activas para esta empresa contable. Registra una cuenta en Bancos antes de dispersar.',
                icon: 'warning',
                confirmButtonColor: '#3b82f6'
            });
            return;
        }

        const { value: bancoId } = await Swal.fire({
            title: 'Confirmar Dispersión de Nómina',
            text: `Se dispersarán $${Number(nomina.total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} entre los colaboradores activos.`,
            input: 'select',
            inputOptions: bancos.reduce((acc, b) => ({ ...acc, [b.id]: `${b.banco} - ${b.cuenta}` }), {}),
            inputPlaceholder: 'Selecciona la cuenta de salida',
            showCancelButton: true,
            confirmButtonText: 'Confirmar y Pagar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#10b981'
        });

        if (bancoId) {
            try {
                await pagarNomina(nomina.id, bancoId);
                toast.success('Nómina pagada y póliza de egreso registrada');
                loadNominas();
            } catch (e) {
                toast.error('Error al procesar el pago de nómina');
            }
        }
    };

    // Cálculos de métricas
    const totalEmpleados = empleados?.length || 0;
    const empleadosActivos = (empleados || []).filter(e => e.estatus === 'ACTIVO').length;
    const empleadosInactivos = (empleados || []).filter(e => e.estatus === 'INACTIVO').length;
    
    const masaSalarial = useMemo(() => {
        return (empleados || [])
            .filter(e => e.estatus === 'ACTIVO')
            .reduce((acc, curr) => acc + (parseFloat(curr.sueldo) || 0), 0);
    }, [empleados]);

    const contratacionesRecientes = useMemo(() => {
        return [...(empleados || [])]
            .sort((a, b) => new Date(b.fechaContratacion) - new Date(a.fechaContratacion))
            .slice(0, 5);
    }, [empleados]);

    if (loadingContext && view === 'resumen') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
                <p className="font-bold text-sm tracking-wide">Cargando información de Recursos Humanos...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-3xl text-rose-600 dark:text-rose-400">
                <span className="material-symbols-outlined text-4xl mb-2">error</span>
                <p className="font-bold">Error al cargar datos: {error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20">
            {/* Modal de Alta de Empleado */}
            {isEmpleadoModalOpen && (
                <EmpleadoModal
                    onClose={() => setIsEmpleadoModalOpen(false)}
                    onSave={handleSaveEmpleado}
                    empleados={empleados}
                    users={users}
                    roles={roles}
                    allStores={stores}
                />
            )}

            {/* Encabezado sin avatar al lado del título, con badge moderno y selector de vistas */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
                            Capital Humano & Operación
                        </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                        Recursos Humanos
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">
                        Administración de colaboradores, estructura organizacional y dispersión de nóminas.
                    </p>
                </div>

                {/* Controles de vista segmentados y acciones */}
                <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                    <div className="flex items-center bg-gray-100 dark:bg-gray-800/80 p-1 rounded-2xl border border-gray-200/60 dark:border-gray-700/60">
                        <button 
                            type="button"
                            onClick={() => setView('resumen')} 
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                view === 'resumen' 
                                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs' 
                                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            <span className="material-symbols-outlined text-base">dashboard</span>
                            <span>Dashboard</span>
                        </button>
                        <button 
                            type="button"
                            onClick={() => setView('nominas')} 
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                view === 'nominas' 
                                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs' 
                                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            <span className="material-symbols-outlined text-base">payments</span>
                            <span>Nóminas</span>
                        </button>
                    </div>

                    <button 
                        type="button"
                        onClick={() => setIsEmpleadoModalOpen(true)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-xs hover:bg-primary-dark active:scale-95 transition-all"
                    >
                        <span className="material-symbols-outlined text-base">person_add</span>
                        <span>Nuevo Empleado</span>
                    </button>
                </div>
            </div>

            {view === 'resumen' ? (
                <div className="space-y-6">
                    {/* Tarjetas de Métricas Principales */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard 
                            icon="groups" 
                            title="Total de Plantilla" 
                            value={totalEmpleados} 
                            subtitle="Colaboradores registrados"
                            badge="Institucional"
                            badgeColor="bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800"
                            iconColor="text-blue-600 dark:text-blue-400"
                            iconBg="bg-blue-50 dark:bg-blue-900/30"
                        />
                        <StatCard 
                            icon="how_to_reg" 
                            title="Personal Activo" 
                            value={empleadosActivos} 
                            subtitle={totalEmpleados > 0 ? `${Math.round((empleadosActivos / totalEmpleados) * 100)}% de la plantilla` : '0% activo'}
                            badge="Operando"
                            badgeColor="bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800"
                            iconColor="text-emerald-600 dark:text-emerald-400"
                            iconBg="bg-emerald-50 dark:bg-emerald-900/30"
                        />
                        <StatCard 
                            icon="person_off" 
                            title="Bajas / Inactivos" 
                            value={empleadosInactivos} 
                            subtitle="Expedientes cerrados"
                            badge="Historial"
                            badgeColor="bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800"
                            iconColor="text-rose-600 dark:text-rose-400"
                            iconBg="bg-rose-50 dark:bg-rose-900/30"
                        />
                        <StatCard 
                            icon="wallet" 
                            title="Masa Salarial" 
                            value={new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(masaSalarial)} 
                            subtitle="Sueldos activos mensuales"
                            badge="Mensual"
                            badgeColor="bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800"
                            iconColor="text-purple-600 dark:text-purple-400"
                            iconBg="bg-purple-50 dark:bg-purple-900/30"
                        />
                    </div>

                    {/* Tarjetas de Navegación Rápida */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Link 
                            to="/gestion/empleados" 
                            className="group p-5 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/80 dark:border-gray-800/80 rounded-3xl shadow-xs hover:shadow-md hover:border-primary/50 transition-all flex items-center justify-between"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                    <span className="material-symbols-outlined text-2xl">badge</span>
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                                        Expedientes y Personal
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                        Consulta la lista completa, salarios, filtros por estatus y permisos de acceso.
                                    </p>
                                </div>
                            </div>
                            <span className="material-symbols-outlined text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition-all">
                                arrow_forward
                            </span>
                        </Link>

                        <div 
                            onClick={handleGenerarNomina} 
                            className="cursor-pointer group p-5 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/80 dark:border-gray-800/80 rounded-3xl shadow-xs hover:shadow-md hover:border-emerald-500/50 transition-all flex items-center justify-between"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                    <span className="material-symbols-outlined text-2xl">add_card</span>
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-gray-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                                        Generar Nueva Nómina
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                        Calcula y prepara el periodo de pago para los colaboradores activos.
                                    </p>
                                </div>
                            </div>
                            <span className="material-symbols-outlined text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all">
                                arrow_forward
                            </span>
                        </div>
                    </div>

                    {/* Contrataciones Recientes */}
                    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/80 dark:border-gray-800/80 rounded-3xl p-6 shadow-xs">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                                    Contrataciones Recientes
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Últimos colaboradores incorporados al equipo de trabajo.
                                </p>
                            </div>
                            <Link 
                                to="/gestion/empleados" 
                                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                            >
                                <span>Ver todos</span>
                                <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            </Link>
                        </div>

                        {contratacionesRecientes.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 text-xs font-medium">
                                No hay colaboradores registrados en el sistema.
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                {contratacionesRecientes.map(empleado => (
                                    <Link 
                                        key={empleado.id} 
                                        to={`/gestion/recursos-humanos/${empleado.id}`}
                                        className="flex items-center justify-between py-3 hover:bg-gray-50/80 dark:hover:bg-gray-800/50 px-2 rounded-2xl transition-all"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div>
                                                <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                                                    {empleado.nombreCompleto}
                                                </p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                                                        {empleado.puesto || 'Sin puesto'}
                                                    </span>
                                                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-black uppercase ${
                                                        empleado.estatus === 'ACTIVO'
                                                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                            : 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'
                                                    }`}>
                                                        {empleado.estatus}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="text-right hidden sm:block">
                                                <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                                                    {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(empleado.sueldo || 0)}
                                                </p>
                                                <p className="text-[10px] text-gray-400 font-medium">
                                                    Ingreso: {format(new Date(empleado.fechaContratacion), 'dd MMM yyyy', { locale: es })}
                                                </p>
                                            </div>
                                            <span className="material-symbols-outlined text-gray-400 text-lg">chevron_right</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Estructura Organizacional / Organigrama */}
                    <Organigrama empleados={empleados} />
                </div>
            ) : (
                /* Vista de Nóminas */
                <div className="space-y-6">
                    {/* Barra de Filtro de Empresa y Acción de Nómina */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-4 rounded-3xl border border-gray-200/80 dark:border-gray-800/80 shadow-xs">
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                                <span className="material-symbols-outlined text-xl">domain</span>
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                                    Empresa Contable
                                </p>
                                <select 
                                    value={selectedEmpresa?.id || ''} 
                                    onChange={e => setSelectedEmpresa(empresas.find(emp => emp.id === e.target.value))}
                                    className="bg-transparent text-sm font-bold text-gray-900 dark:text-white outline-none cursor-pointer pr-4"
                                >
                                    {empresas.map(emp => (
                                        <option key={emp.id} value={emp.id} className="dark:bg-gray-900">
                                            {emp.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <button 
                            type="button"
                            onClick={handleGenerarNomina} 
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-xs hover:bg-primary-dark active:scale-95 transition-all"
                        >
                            <span className="material-symbols-outlined text-base">add_circle</span>
                            <span>Generar Nómina Mensual</span>
                        </button>
                    </div>

                    {/* Tabla de Nóminas en Desktop / Tarjetas en Móvil */}
                    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-200/80 dark:border-gray-800/80 overflow-hidden shadow-xs">
                        {loadingNominas ? (
                            <div className="p-12 text-center text-gray-400 font-bold text-xs uppercase tracking-widest animate-pulse">
                                Cargando Nóminas...
                            </div>
                        ) : nominas.length === 0 ? (
                            <div className="p-16 text-center text-gray-400">
                                <span className="material-symbols-outlined text-4xl mb-2 text-gray-300 dark:text-gray-600">
                                    receipt_long
                                </span>
                                <p className="text-sm font-bold text-gray-500 dark:text-gray-400">
                                    No hay registros de nómina generados para esta empresa
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    Haz clic en "Generar Nómina Mensual" para calcular el periodo actual.
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Versión Tabla para pantallas medianas/grandes */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-gray-50/70 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 text-[11px] font-black text-gray-400 uppercase tracking-wider">
                                                <th className="px-6 py-4">Folio / Periodo</th>
                                                <th className="px-6 py-4">Colaboradores</th>
                                                <th className="px-6 py-4">Monto Total</th>
                                                <th className="px-6 py-4">Estatus</th>
                                                <th className="px-6 py-4 text-right">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                            {nominas.map(nom => (
                                                <tr key={nom.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <p className="font-bold text-sm text-gray-900 dark:text-white">
                                                            {nom.folio || `NOM-${nom.id.slice(0, 6)}`}
                                                        </p>
                                                        <p className="text-[11px] text-gray-400 font-medium">
                                                            Periodo: {format(new Date(nom.anio, nom.mes - 1), 'MMMM yyyy', { locale: es })}
                                                        </p>
                                                    </td>
                                                    <td className="px-6 py-4 text-xs font-bold text-gray-600 dark:text-gray-300">
                                                        {nom._count?.detalles || 0} Personal
                                                    </td>
                                                    <td className="px-6 py-4 font-black text-primary text-base">
                                                        ${Number(nom.total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                            nom.estatus === 'PAGADA'
                                                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800'
                                                                : 'bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800'
                                                        }`}>
                                                            {nom.estatus === 'PAGADA' ? 'Pagada' : 'Borrador'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        {nom.estatus === 'BORRADOR' ? (
                                                            <button 
                                                                type="button"
                                                                onClick={() => handlePagarNomina(nom)} 
                                                                className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs hover:bg-emerald-700 active:scale-95 transition-all shadow-xs"
                                                            >
                                                                Dispersar Pago
                                                            </button>
                                                        ) : (
                                                            <div className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                                                                <span className="material-symbols-outlined text-base">check_circle</span>
                                                                <span>Dispersado</span>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Versión Tarjetas para Móviles */}
                                <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800 p-2">
                                    {nominas.map(nom => (
                                        <div key={nom.id} className="p-4 space-y-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-bold text-sm text-gray-900 dark:text-white">
                                                        {nom.folio || `NOM-${nom.id.slice(0, 6)}`}
                                                    </p>
                                                    <p className="text-xs text-gray-400 font-medium capitalize">
                                                        {format(new Date(nom.anio, nom.mes - 1), 'MMMM yyyy', { locale: es })}
                                                    </p>
                                                </div>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                                    nom.estatus === 'PAGADA'
                                                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-600 border border-amber-200'
                                                }`}>
                                                    {nom.estatus === 'PAGADA' ? 'Pagada' : 'Borrador'}
                                                </span>
                                            </div>

                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-gray-500 font-medium">Personal: {nom._count?.detalles || 0}</span>
                                                <span className="font-black text-primary text-base">
                                                    ${Number(nom.total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                                </span>
                                            </div>

                                            {nom.estatus === 'BORRADOR' && (
                                                <button 
                                                    type="button"
                                                    onClick={() => handlePagarNomina(nom)} 
                                                    className="w-full py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs active:scale-95 transition-all shadow-xs"
                                                >
                                                    Dispersar Pago
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecursosHumanos;
