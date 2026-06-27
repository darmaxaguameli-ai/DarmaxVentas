import React, { useState, useEffect, useMemo } from 'react';
import { 
    FaBuilding, FaCalendarAlt, FaBookOpen, FaTags, 
    FaUsers, FaMoneyCheckAlt, FaFileInvoiceDollar, 
    FaCheckDouble, FaBriefcase, FaFileSignature,
    FaArrowRight, FaChartPie, FaListAlt, FaUniversity,
    FaHandHoldingUsd, FaPiggyBank, FaPlus, FaEdit, FaTrash, FaCheck, FaTimes, FaSearch, FaChevronRight, FaChevronDown, FaTools,
    FaBalanceScale, FaChartLine, FaStore, FaBook, FaIdCard, FaArrowUp, FaArrowDown
} from 'react-icons/fa';
import { 
    fetchContableEmpresas, createContableEmpresa, updateContableEmpresa,
    fetchContableSucursales, createContableSucursal, deleteContableSucursal,
    fetchContableEjercicios, createContableEjercicio, toggleContablePeriodo,
    fetchContableCuentas, createContableCuenta, updateContableCuenta, deleteContableCuenta,
    fetchContableBancos, createContableBanco,
    fetchContableMovimientos, createContableMovimiento,
    fetchContablePolizas, createContablePoliza,
    fetchContableCentrosCosto, createContableCentroCosto,
    fetchContableContratos, createContableContrato,
    fetchContableBalanza, fetchContableEstadoResultados,
    fetchContableTerceros, createContableTercero,
    fetchContableCxC, createContableCxC,
    fetchContableCxP, createContableCxP,
    fetchStores
} from '../../api/apiClient';
import apiClient from '../../api/apiClient';
import Swal from 'sweetalert2';
import { toast } from 'sonner';

const UnderConstructionOverlay = ({ title }) => (
    <div className="absolute inset-0 bg-white/60 dark:bg-gray-900/60 backdrop-blur-[2px] z-50 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500 rounded-[3rem]">
        <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-amber-500/20 rotate-12">
            <FaTools size={32} />
        </div>
        <h3 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tight italic mb-2">
            {title}
        </h3>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest max-w-sm">
            Módulo en desarrollo. Próximamente disponible con sincronización ERP.
        </p>
    </div>
);

const Contabilidad = () => {
    const [activeTab, setActiveTab] = useState('empresas');
    const [empresas, setEmpresas] = useState([]);
    const [selectedEmpresa, setSelectedEmpresa] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadEmpresas();
    }, []);

    const loadEmpresas = async () => {
        try {
            setLoading(true);
            const data = await fetchContableEmpresas();
            setEmpresas(data);
            if (data.length > 0 && !selectedEmpresa) {
                setSelectedEmpresa(data[0]);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleRunCron = async () => {
        try {
            toast.loading('Ejecutando procesos automáticos diarios...', { id: 'cron' });
            const res = await apiClient.post('/cron/diario');
            toast.success(res.data?.message || 'Procesos completados', { id: 'cron' });
        } catch (error) {
            toast.error('Error al ejecutar procesos automáticos', { id: 'cron' });
        }
    };

    const handleAddEmpresa = async () => {
        const { value: formValues } = await Swal.fire({
            title: 'Nueva Empresa Contable',
            html: `
                <div class="space-y-4 text-left p-2">
                    <input id="swal-name" class="swal2-input w-full m-0 dark:bg-gray-800 dark:text-white dark:border-gray-700" placeholder="Nombre Comercial">
                    <input id="swal-rfc" class="swal2-input w-full m-0 dark:bg-gray-800 dark:text-white dark:border-gray-700" placeholder="RFC">
                    <input id="swal-razon" class="swal2-input w-full m-0 dark:bg-gray-800 dark:text-white dark:border-gray-700" placeholder="Razón Social">
                    <input id="swal-regimen" class="swal2-input w-full m-0 dark:bg-gray-800 dark:text-white dark:border-gray-700" placeholder="Régimen Fiscal (Clave)">
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Crear Empresa',
            customClass: {
                popup: 'dark:bg-gray-900 dark:border-gray-800',
                title: 'dark:text-white',
                htmlContainer: 'dark:text-gray-300'
            },
            preConfirm: () => {
                const nombre = document.getElementById('swal-name').value;
                const rfc = document.getElementById('swal-rfc').value;
                const razonSocial = document.getElementById('swal-razon').value;
                const regimenFiscal = document.getElementById('swal-regimen').value;
                if (!nombre || !rfc) {
                    Swal.showValidationMessage('Nombre y RFC son obligatorios');
                    return false;
                }
                return { nombre, rfc, razonSocial, regimenFiscal };
            }
        });

        if (formValues) {
            try {
                await createContableEmpresa(formValues);
                toast.success('Empresa creada');
                loadEmpresas();
            } catch (e) {
                toast.error('Error al crear empresa');
            }
        }
    };

    const tabs = [
        { id: 'empresas', label: 'Empresas y Sucursales', icon: <FaBuilding />, functional: true },
        { id: 'ejercicios', label: 'Ejercicios y Periodos', icon: <FaCalendarAlt />, functional: true },
        { id: 'tesoreria', label: 'Tesorería (Bancos)', icon: <FaUniversity />, functional: true },
        { id: 'terceros', label: 'Terceros (Cli/Prov)', icon: <FaUsers />, functional: true },
        { id: 'cxc', label: 'Cuentas por Cobrar', icon: <FaHandHoldingUsd className="text-emerald-500" />, functional: true },
        { id: 'cxp', label: 'Cuentas por Pagar', icon: <FaPiggyBank className="text-rose-500" />, functional: true },
        { id: 'cuentas', label: 'Catálogo de Cuentas', icon: <FaBookOpen />, functional: true },
        { id: 'centros', label: 'Centros de Costo', icon: <FaTags />, functional: true },
        { id: 'impuestos', label: 'Impuestos', icon: <FaBalanceScale className="text-blue-400" />, functional: true },
        { id: 'polizas', label: 'Pólizas Contables', icon: <FaFileInvoiceDollar />, functional: true },
        { id: 'libro-mayor', label: 'Libro Mayor', icon: <FaBook className="text-indigo-400" />, functional: true },
        { id: 'balanza', label: 'Balanza de Comprobación', icon: <FaListAlt className="text-amber-400" />, functional: true },
        { id: 'resultados', label: 'Estado de Resultados', icon: <FaChartPie className="text-emerald-400" />, functional: true },
        { id: 'conciliacion', label: 'Conciliaciones', icon: <FaCheckDouble />, functional: true },
        { id: 'documentos', label: 'Documentos Soporte', icon: <FaFileSignature />, functional: true },
        { id: 'activos', label: 'Activos Fijos', icon: <FaBriefcase />, functional: true },
        { id: 'flujo', label: 'Flujo de Efectivo', icon: <FaChartLine className="text-emerald-400" />, functional: true },
        { id: 'presupuestos', label: 'Presupuestos', icon: <FaChartPie />, functional: true },
        { id: 'config', label: 'Configuración ERP', icon: <FaTools className="text-gray-400" />, functional: true },
    ];

    const currentTab = tabs.find(t => t.id === activeTab);

    return (
        <div className="animate-fade-in space-y-8 pb-24 relative min-h-[85vh]">
            
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-black text-gray-800 dark:text-white flex items-center gap-4 tracking-tighter uppercase italic">
                        <div className="bg-amber-500 p-3 rounded-2xl shadow-lg shadow-amber-500/20 text-white">
                            <FaFileInvoiceDollar className="text-2xl" />
                        </div> 
                        CONTABILIDAD
                    </h1>
                    <div className="text-[10px] text-gray-500 font-bold mt-2 flex items-center gap-2 uppercase tracking-widest leading-none">
                        <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div> 
                        Sistema de Control Financiero y Fiscal (ERP)
                    </div>
                </div>
                
                {/* Selector de Empresa Global & Acciones */}
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleRunCron}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-black rounded-xl text-[9px] uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-gray-700 transition-all border border-gray-200 dark:border-gray-700 shadow-sm"
                        title="Simular ejecución diaria (CRON) para rentas automáticas"
                    >
                        Ejecutar CRON Diarios
                    </button>
                    {empresas.length > 0 ? (
                        <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-2 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm shrink-0">
                            <FaBuilding className="text-amber-500 ml-2" />
                            <select 
                                value={selectedEmpresa?.id || ''} 
                                onChange={(e) => setSelectedEmpresa(empresas.find(emp => emp.id === e.target.value))}
                                className="bg-transparent text-[10px] font-black uppercase tracking-widest outline-none pr-8 cursor-pointer dark:text-white"
                            >
                                {empresas.map(emp => <option key={emp.id} value={emp.id}>{emp.nombre}</option>)}
                            </select>
                            <button onClick={handleAddEmpresa} className="p-2 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-100 transition-all">
                                <FaPlus size={10} />
                            </button>
                        </div>
                    ) : (
                        <button onClick={handleAddEmpresa} className="px-6 py-2.5 bg-amber-500 text-white font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2">
                            <FaPlus /> Crear Empresa
                        </button>
                    )}
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar de Navegación Contable */}
                <div className="w-full lg:w-72 shrink-0 space-y-4">
                    <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-4 shadow-sm border border-gray-100 dark:border-gray-700 h-fit">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 ml-4 italic">Módulos Contables</p>
                        <nav className="space-y-1">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                        activeTab === tab.id
                                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 shadow-sm border-2 border-amber-100 dark:border-amber-800/50'
                                        : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900/40'
                                    }`}
                                >
                                    <span className={`text-sm ${activeTab === tab.id ? 'text-amber-500' : 'text-gray-300'}`}>
                                        {tab.icon}
                                    </span>
                                    <span className="truncate">{tab.label}</span>
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Área de Contenido Principal */}
                <div className="flex-1 bg-white dark:bg-gray-800 rounded-[3rem] p-8 md:p-12 shadow-sm border border-gray-100 dark:border-gray-700 min-h-[600px] flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full -mr-32 -mt-32" />
                    
                    {!currentTab.functional && <UnderConstructionOverlay title={currentTab.label} />}

                    <div className="flex items-center justify-between mb-10 pb-6 border-b border-gray-100 dark:border-gray-700 relative z-10">
                        <h2 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tight italic">
                            {currentTab.label}
                        </h2>
                    </div>

                    <div className={`flex-1 relative z-10 ${!currentTab.functional ? 'opacity-30 pointer-events-none' : ''}`}>
                        {activeTab === 'empresas' && <ManageEmpresas empresas={empresas} onUpdate={loadEmpresas} />}
                        {activeTab === 'ejercicios' && <ManageEjercicios selectedEmpresa={selectedEmpresa} />}
                        {activeTab === 'cuentas' && <ManageCuentas selectedEmpresa={selectedEmpresa} />}
                        {activeTab === 'tesoreria' && <ManageBancos selectedEmpresa={selectedEmpresa} />}
                        {activeTab === 'polizas' && <ManagePolizas selectedEmpresa={selectedEmpresa} />}
                        {activeTab === 'impuestos' && <ManageImpuestos selectedEmpresa={selectedEmpresa} />}
                        {activeTab === 'terceros' && <ManageTerceros selectedEmpresa={selectedEmpresa} />}
                        {activeTab === 'cxc' && <ManageCxC selectedEmpresa={selectedEmpresa} />}
                        {activeTab === 'cxp' && <ManageCxP selectedEmpresa={selectedEmpresa} />}
                        {activeTab === 'centros' && <ManageCentros selectedEmpresa={selectedEmpresa} />}
                        {activeTab === 'balanza' && <ManageBalanza selectedEmpresa={selectedEmpresa} />}
                        {activeTab === 'libro-mayor' && <ManageLibroMayor selectedEmpresa={selectedEmpresa} />}
                        {activeTab === 'resultados' && <ManageResultados selectedEmpresa={selectedEmpresa} />}
                        {activeTab === 'conciliacion' && <ManageConciliacion selectedEmpresa={selectedEmpresa} />}
                        {activeTab === 'documentos' && <ManageDocumentos selectedEmpresa={selectedEmpresa} />}
                        {activeTab === 'activos' && <ManageActivos selectedEmpresa={selectedEmpresa} />}
                        {activeTab === 'flujo' && <ManageFlujo selectedEmpresa={selectedEmpresa} />}
                        {activeTab === 'presupuestos' && <ManagePresupuestos selectedEmpresa={selectedEmpresa} />}
                        {activeTab === 'config' && <ConfigERP selectedEmpresa={selectedEmpresa} onUpdate={loadEmpresas} />}
                        
                        {!currentTab.functional && (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-300 dark:text-gray-700">
                                <FaListAlt size={80} className="mb-6 opacity-20" />
                                <p className="font-black uppercase tracking-[0.4em] text-[10px]">Cargando Estructura de Datos...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ====================================================================
// SUB-COMPONENTES DE GESTIÓN
// ====================================================================

const ManageEmpresas = ({ empresas, onUpdate }) => {
    const [stores, setStores] = useState([]);
    
    useEffect(() => {
        fetchStores().then(setStores);
    }, []);

    const handleEditEmpresa = async (empresa) => {
        const { value: formValues } = await Swal.fire({
            title: 'Editar Empresa Contable',
            html: `
                <div class="space-y-4 text-left p-2">
                    <div>
                        <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Nombre Comercial</label>
                        <input id="swal-edit-name" class="swal2-input w-full m-0 dark:bg-gray-800 dark:text-white dark:border-gray-700 font-bold" placeholder="Nombre Comercial" value="${empresa.nombre || ''}">
                    </div>
                    <div>
                        <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">RFC</label>
                        <input id="swal-edit-rfc" class="swal2-input w-full m-0 dark:bg-gray-800 dark:text-white dark:border-gray-700 font-bold" placeholder="RFC" value="${empresa.rfc || ''}">
                    </div>
                    <div>
                        <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Razón Social</label>
                        <input id="swal-edit-razon" class="swal2-input w-full m-0 dark:bg-gray-800 dark:text-white dark:border-gray-700 font-bold" placeholder="Razón Social" value="${empresa.razonSocial || ''}">
                    </div>
                    <div>
                        <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Régimen Fiscal (Clave)</label>
                        <input id="swal-edit-regimen" class="swal2-input w-full m-0 dark:bg-gray-800 dark:text-white dark:border-gray-700 font-bold" placeholder="Régimen Fiscal (Clave)" value="${empresa.regimenFiscal || ''}">
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Guardar Cambios',
            customClass: {
                popup: 'dark:bg-gray-900 dark:border-gray-800',
                title: 'dark:text-white',
                htmlContainer: 'dark:text-gray-300'
            },
            preConfirm: () => {
                const nombre = document.getElementById('swal-edit-name').value;
                const rfc = document.getElementById('swal-edit-rfc').value;
                const razonSocial = document.getElementById('swal-edit-razon').value;
                const regimenFiscal = document.getElementById('swal-edit-regimen').value;
                if (!nombre || !rfc) {
                    Swal.showValidationMessage('Nombre y RFC son obligatorios');
                    return false;
                }
                return { nombre, rfc, razonSocial, regimenFiscal };
            }
        });

        if (formValues) {
            try {
                await updateContableEmpresa(empresa.id, formValues);
                toast.success('Empresa actualizada');
                onUpdate();
            } catch (e) {
                toast.error('Error al actualizar empresa');
            }
        }
    };

    const handleAddSucursal = async (empresaId) => {
        const { value: formValues } = await Swal.fire({
            title: 'Vincular Sucursal Operativa',
            html: `
                <div class="space-y-4 text-left p-2">
                    <input id="swal-suc-nombre" class="swal2-input w-full m-0" placeholder="Nombre para Contabilidad">
                    <select id="swal-store-id" class="swal2-input w-full m-0 text-sm">
                        <option value="">-- Selecciona Sucursal Física --</option>
                        ${stores.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
                    </select>
                </div>
            `,
            showCancelButton: true,
            preConfirm: () => {
                const nombre = document.getElementById('swal-suc-nombre').value;
                const storeId = document.getElementById('swal-store-id').value;
                if (!nombre) return Swal.showValidationMessage('Nombre requerido');
                return { nombre, storeId: storeId || null, empresaId };
            }
        });

        if (formValues) {
            try {
                await createContableSucursal(formValues);
                toast.success('Sucursal vinculada');
                onUpdate();
            } catch (e) { toast.error('Error al vincular'); }
        }
    };

    const handleDeleteSucursal = async (sucursalId) => {
        const result = await Swal.fire({
            title: '¿Desvincular Sucursal?',
            text: 'Esta acción eliminará la vinculación de esta sucursal con la empresa contable.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, desvincular',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await deleteContableSucursal(sucursalId);
                toast.success('Sucursal desvinculada');
                onUpdate();
            } catch (e) {
                toast.error('Error al desvincular sucursal');
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {empresas.map(emp => (
                    <div key={emp.id} className="p-6 bg-gray-50 dark:bg-gray-900/40 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm group hover:border-amber-500 transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center shadow-sm text-amber-500">
                                <FaBuilding size={20} />
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => handleEditEmpresa(emp)}
                                    className="text-[9px] font-black bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-lg uppercase tracking-widest border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all flex items-center gap-1.5"
                                >
                                    <FaEdit size={10} /> Editar
                                </button>
                                <button 
                                    onClick={() => handleAddSucursal(emp.id)}
                                    className="text-[9px] font-black bg-amber-50 text-amber-600 px-3 py-1.5 rounded-lg uppercase tracking-widest border border-amber-100 hover:bg-amber-500 hover:text-white transition-all flex items-center gap-1.5"
                                >
                                    + Sucursal
                                </button>
                            </div>
                        </div>
                        <h3 className="font-black text-gray-800 dark:text-white uppercase text-sm mb-1">{emp.nombre}</h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{emp.razonSocial}</p>
                        
                        {/* Listado de Sucursales Vinculadas */}
                        {emp.sucursales?.length > 0 && (
                            <div className="mt-4 space-y-1">
                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2 italic">Sucursales Vinculadas:</p>
                                {emp.sucursales.map(s => (
                                    <div key={s.id} className="flex items-center justify-between gap-2 text-[10px] font-bold text-gray-600 dark:text-gray-300 bg-white/50 dark:bg-gray-800 p-2 rounded-xl border border-black/5 dark:border-white/5">
                                        <div className="flex items-center gap-2">
                                            <FaStore size={10} className="text-amber-500" />
                                            <span>{s.nombre} {s.store && <span className="text-[8px] opacity-50 font-medium">(Física: {s.store.name})</span>}</span>
                                        </div>
                                        <button 
                                            onClick={() => handleDeleteSucursal(s.id)}
                                            className="text-gray-400 hover:text-red-500 transition-colors p-1 flex items-center justify-center rounded hover:bg-red-50 dark:hover:bg-red-950/20"
                                            title="Desvincular sucursal"
                                        >
                                            <FaTimes size={10} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="mt-4 pt-4 border-t border-black/5 grid grid-cols-3 gap-4">
                            <div><p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">RFC</p><p className="text-[11px] font-bold dark:text-white">{emp.rfc}</p></div>
                            <div><p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Régimen</p><p className="text-[11px] font-bold dark:text-white">{emp.regimenFiscal || 'N/A'}</p></div>
                            <div><p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Cuentas</p><p className="text-[11px] font-bold dark:text-white">{emp._count?.cuentas || 0}</p></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ManageBancos = ({ selectedEmpresa }) => {
    const [bancos, setBancos] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (selectedEmpresa) {
            fetchContableBancos(selectedEmpresa.id).then(setBancos);
        }
    }, [selectedEmpresa]);

    const handleAddBanco = async () => {
        if (!selectedEmpresa) return toast.error('Selecciona una empresa');
        
        const { value: formValues } = await Swal.fire({
            title: 'Nueva Cuenta Bancaria',
            html: `
                <div class="space-y-4 text-left p-2">
                    <input id="swal-banco" class="swal2-input w-full m-0" placeholder="Nombre del Banco">
                    <input id="swal-cuenta" class="swal2-input w-full m-0" placeholder="Número de Cuenta">
                    <input id="swal-clabe" class="swal2-input w-full m-0" placeholder="CLABE (opcional)">
                    <input id="swal-saldo" type="number" class="swal2-input w-full m-0" placeholder="Saldo Inicial">
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Guardar Cuenta',
            preConfirm: () => {
                const banco = document.getElementById('swal-banco').value;
                const cuenta = document.getElementById('swal-cuenta').value;
                const clabe = document.getElementById('swal-clabe').value;
                const saldoInicial = parseFloat(document.getElementById('swal-saldo').value) || 0;
                if (!banco || !cuenta) return Swal.showValidationMessage('Banco y cuenta requeridos');
                return { banco, cuenta, clabe, saldoInicial, empresaId: selectedEmpresa.id };
            }
        });

        if (formValues) {
            try {
                await createContableBanco(formValues);
                toast.success('Cuenta bancaria registrada');
                fetchContableBancos(selectedEmpresa.id).then(setBancos);
            } catch (e) { toast.error('Error al registrar banco'); }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <button onClick={handleAddBanco} className="btn-primary py-3 px-6 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
                    <FaPlus /> Añadir Banco
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bancos.map(b => (
                    <div key={b.id} className="p-6 bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <FaUniversity size={40} />
                        </div>
                        <h3 className="font-black text-gray-800 dark:text-white uppercase text-sm">{b.banco}</h3>
                        <p className="text-[10px] text-gray-400 font-bold mt-1">CUENTA: {b.cuenta}</p>
                        <div className="mt-6 pt-4 border-t border-black/5 flex justify-between items-end">
                            <div>
                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Saldo Actual (Libros)</p>
                                <p className="text-xl font-black text-emerald-600">${b.saldoInicial.toLocaleString()}</p>
                            </div>
                            <button className="p-2 bg-gray-50 dark:bg-gray-800 rounded-xl hover:text-primary transition-all">
                                <FaSearch size={12} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ManagePolizas = ({ selectedEmpresa }) => {
    const [polizas, setPolizas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [cuentas, setCuentas] = useState([]);
    const [polizaData, setPolizaData] = useState({ tipo: 'DIARIO', concepto: '', fecha: new Date().toISOString().split('T')[0] });
    const [asientos, setAsientos] = useState([{ id: 1, cuentaId: '', debe: '', haber: '' }, { id: 2, cuentaId: '', debe: '', haber: '' }]);

    useEffect(() => {
        if (selectedEmpresa) {
            fetchContablePolizas(selectedEmpresa.id).then(setPolizas);
            fetchContableCuentas(selectedEmpresa.id).then(setCuentas);
        }
    }, [selectedEmpresa]);

    const handleAddAsiento = () => {
        setAsientos([...asientos, { id: Date.now(), cuentaId: '', debe: '', haber: '' }]);
    };

    const handleRemoveAsiento = (id) => {
        if (asientos.length <= 2) return toast.error('Una póliza debe tener al menos dos asientos');
        setAsientos(asientos.filter(a => a.id !== id));
    };

    const updateAsiento = (id, field, value) => {
        setAsientos(asientos.map(a => a.id === id ? { ...a, [field]: value } : a));
    };

    const handleSavePoliza = async () => {
        if (!polizaData.concepto) return toast.error('Agrega un concepto a la póliza');
        
        let totalDebe = 0;
        let totalHaber = 0;
        const detalles = [];

        for (const a of asientos) {
            if (!a.cuentaId) return toast.error('Todas las filas deben tener una cuenta seleccionada');
            const debe = parseFloat(a.debe) || 0;
            const haber = parseFloat(a.haber) || 0;
            if (debe === 0 && haber === 0) return toast.error('Los asientos deben tener monto en Debe o Haber');
            if (debe > 0 && haber > 0) return toast.error('Una cuenta no puede tener Debe y Haber simultáneamente');
            
            totalDebe += debe;
            totalHaber += haber;
            detalles.push({ cuentaId: a.cuentaId, debe, haber });
        }

        if (Math.abs(totalDebe - totalHaber) > 0.01) {
            return toast.error(`La póliza no cuadra. Diferencia: $${Math.abs(totalDebe - totalHaber).toFixed(2)}`);
        }

        try {
            toast.loading('Registrando póliza...', { id: 'poliza' });
            await createContablePoliza({
                ...polizaData,
                fecha: new Date(polizaData.fecha).toISOString(),
                folio: `${polizaData.tipo.substring(0,3)}-${Date.now().toString().slice(-4)}`,
                empresaId: selectedEmpresa.id,
                estatus: 'POSTEADA',
                detalles
            });
            toast.success('Póliza registrada exitosamente', { id: 'poliza' });
            setShowModal(false);
            setPolizaData({ tipo: 'DIARIO', concepto: '', fecha: new Date().toISOString().split('T')[0] });
            setAsientos([{ id: 1, cuentaId: '', debe: '', haber: '' }, { id: 2, cuentaId: '', debe: '', haber: '' }]);
            fetchContablePolizas(selectedEmpresa.id).then(setPolizas);
        } catch (e) {
            toast.error('Error al guardar póliza', { id: 'poliza' });
        }
    };

    const totalDebeActual = asientos.reduce((sum, a) => sum + (parseFloat(a.debe) || 0), 0);
    const totalHaberActual = asientos.reduce((sum, a) => sum + (parseFloat(a.haber) || 0), 0);
    const diferencia = Math.abs(totalDebeActual - totalHaberActual);

    return (
        <div className="space-y-6">
             <div className="flex justify-end">
                <button onClick={() => setShowModal(true)} className="btn-primary py-3 px-6 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:scale-105 transition-transform shadow-xl shadow-primary/20">
                    <FaPlus /> Nueva Póliza
                </button>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-[2rem] border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-900/50 border-b dark:border-gray-700">
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Fecha / Folio</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tipo / Concepto</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Cargos</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Abonos</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Estatus</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800 text-[11px]">
                            {polizas.length === 0 ? (
                                <tr><td colSpan="5" className="p-10 text-center text-gray-400 font-black uppercase italic tracking-widest opacity-50">No hay pólizas capturadas</td></tr>
                            ) : (
                                polizas.map(p => {
                                    const totalDebe = p.detalles?.reduce((sum, d) => sum + d.debe, 0) || 0;
                                    const totalHaber = p.detalles?.reduce((sum, d) => sum + d.haber, 0) || 0;
                                    return (
                                        <tr key={p.id} className="group hover:bg-gray-50/50 transition-all">
                                            <td className="px-8 py-4 font-bold text-gray-600">
                                                {new Date(p.fecha).toLocaleDateString()}
                                                <div className="text-[9px] font-black text-amber-600 mt-1">{p.folio}</div>
                                            </td>
                                            <td className="px-8 py-4">
                                                <span className="text-[8px] font-black bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded border uppercase">{p.tipo}</span>
                                                <div className="mt-1 font-medium text-gray-800 dark:text-white uppercase">{p.concepto}</div>
                                            </td>
                                            <td className="px-8 py-4 text-right font-black text-rose-600">${totalDebe.toLocaleString()}</td>
                                            <td className="px-8 py-4 text-right font-black text-emerald-600">${totalHaber.toLocaleString()}</td>
                                            <td className="px-8 py-4 text-right">
                                                <span className="text-[8px] font-black text-emerald-600 uppercase bg-emerald-50 px-2 py-1 rounded">{p.estatus}</span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Captura Manual de Póliza */}
            {showModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-[3rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-in zoom-in duration-300">
                        <div className="flex justify-between items-start mb-6">
                            <h2 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tight flex items-center gap-3">
                                <FaFileInvoiceDollar className="text-amber-500" /> Captura de Póliza
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500 transition-colors"><FaTimes size={24}/></button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div>
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Tipo de Póliza</label>
                                <select 
                                    value={polizaData.tipo} 
                                    onChange={e => setPolizaData({...polizaData, tipo: e.target.value})} 
                                    className="w-full input-style text-xs font-bold"
                                >
                                    <option value="DIARIO">DIARIO</option>
                                    <option value="INGRESOS">INGRESOS</option>
                                    <option value="EGRESOS">EGRESOS</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Fecha</label>
                                <input 
                                    type="date" 
                                    value={polizaData.fecha}
                                    onChange={e => setPolizaData({...polizaData, fecha: e.target.value})}
                                    className="w-full input-style text-xs font-bold uppercase"
                                />
                            </div>
                            <div className="md:col-span-3">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Concepto General</label>
                                <input 
                                    type="text" 
                                    placeholder="Motivo de la póliza..."
                                    value={polizaData.concepto}
                                    onChange={e => setPolizaData({...polizaData, concepto: e.target.value.toUpperCase()})}
                                    className="w-full input-style text-sm font-bold uppercase"
                                />
                            </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-900/40 p-4 rounded-[2rem] border border-gray-100 dark:border-gray-700">
                            <div className="grid grid-cols-12 gap-2 mb-2 px-2">
                                <div className="col-span-6 text-[9px] font-black text-gray-400 uppercase tracking-widest">Cuenta Contable</div>
                                <div className="col-span-2 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">Cargos (Debe)</div>
                                <div className="col-span-2 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">Abonos (Haber)</div>
                                <div className="col-span-2"></div>
                            </div>
                            
                            <div className="space-y-2">
                                {asientos.map((asiento, index) => (
                                    <div key={asiento.id} className="grid grid-cols-12 gap-2 items-center">
                                        <div className="col-span-6">
                                            <select 
                                                value={asiento.cuentaId}
                                                onChange={e => updateAsiento(asiento.id, 'cuentaId', e.target.value)}
                                                className="w-full input-style text-[10px] font-bold uppercase py-2"
                                            >
                                                <option value="">-- Seleccionar Cuenta --</option>
                                                {cuentas.map(c => <option key={c.id} value={c.id}>{c.codigo} - {c.nombre}</option>)}
                                            </select>
                                        </div>
                                        <div className="col-span-2">
                                            <input 
                                                type="number" step="0.01" placeholder="0.00"
                                                value={asiento.debe}
                                                onChange={e => updateAsiento(asiento.id, 'debe', e.target.value)}
                                                className="w-full input-style text-xs font-black text-right text-rose-500 py-2"
                                                disabled={asiento.haber > 0}
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <input 
                                                type="number" step="0.01" placeholder="0.00"
                                                value={asiento.haber}
                                                onChange={e => updateAsiento(asiento.id, 'haber', e.target.value)}
                                                className="w-full input-style text-xs font-black text-right text-emerald-500 py-2"
                                                disabled={asiento.debe > 0}
                                            />
                                        </div>
                                        <div className="col-span-2 flex justify-end">
                                            <button onClick={() => handleRemoveAsiento(asiento.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><FaTrash size={12}/></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <button onClick={handleAddAsiento} className="mt-4 text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1 hover:text-amber-600 p-2">
                                <FaPlus /> Agregar Asiento
                            </button>

                            <div className="mt-6 pt-4 border-t border-black/5 dark:border-gray-800 flex justify-end gap-12 px-6">
                                <div className="text-right">
                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Suma Debe</p>
                                    <p className="text-lg font-black text-rose-600">${totalDebeActual.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Suma Haber</p>
                                    <p className="text-lg font-black text-emerald-600">${totalHaberActual.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                                </div>
                            </div>
                            
                            {diferencia > 0.01 && (
                                <p className="text-right text-[10px] font-black text-red-500 uppercase tracking-widest mt-2 px-6 animate-pulse">
                                    Diferencia: ${diferencia.toLocaleString(undefined, {minimumFractionDigits: 2})}
                                </p>
                            )}
                        </div>

                        <div className="flex gap-4 pt-6">
                            <button onClick={() => setShowModal(false)} className="flex-1 py-4 bg-gray-50 dark:bg-gray-900 text-gray-500 font-black rounded-2xl uppercase tracking-widest text-[10px]">Cancelar</button>
                            <button 
                                onClick={handleSavePoliza} 
                                disabled={diferencia > 0.01 || totalDebeActual === 0}
                                className="flex-[2] py-4 bg-amber-500 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-2xl shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-amber-600"
                            >
                                <FaCheckCircle /> Guardar Póliza Cuadrada
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const ManageCuentas = ({ selectedEmpresa }) => {
    const [cuentas, setCuentas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (selectedEmpresa) loadCuentas();
    }, [selectedEmpresa]);

    const loadCuentas = async () => {
        setLoading(true);
        try {
            const data = await fetchContableCuentas(selectedEmpresa.id);
            setCuentas(data);
        } catch (e) { toast.error('Error al cargar catálogo'); }
        finally { setLoading(false); }
    };

    const handleAddCuenta = async (parent = null) => {
        if (!selectedEmpresa) return toast.error('Selecciona una empresa primero');
        
        // Cuentas de nivel 1 disponibles para ser padres (si no se pasó una específica)
        const parentOptions = cuentas
            .filter(c => c.nivel < 3) // Limitar profundidad si se desea
            .map(c => `<option value="${c.id}" ${parent?.id === c.id ? 'selected' : ''}>${c.codigo} - ${c.nombre}</option>`)
            .join('');

        const { value: formValues } = await Swal.fire({
            title: parent ? `Añadir Subcuenta a ${parent.nombre}` : 'Nueva Cuenta de Mayor',
            html: `
                <div class="space-y-4 text-left p-2">
                    <div>
                        <label class="text-[10px] font-black uppercase text-gray-400 block mb-1">Cuenta Padre</label>
                        <select id="swal-padre" class="swal2-input w-full m-0 text-sm dark:bg-gray-800 dark:text-white dark:border-gray-700">
                            <option value="">-- Ninguna (Nivel 1) --</option>
                            ${parentOptions}
                        </select>
                    </div>
                    <div>
                        <label class="text-[10px] font-black uppercase text-gray-400 block mb-1">Código Contable</label>
                        <input id="swal-codigo" class="swal2-input w-full m-0 dark:bg-gray-800 dark:text-white dark:border-gray-700" placeholder="Ej: 100-01-000">
                    </div>
                    <div>
                        <label class="text-[10px] font-black uppercase text-gray-400 block mb-1">Nombre de la Cuenta</label>
                        <input id="swal-nombre" class="swal2-input w-full m-0 dark:bg-gray-800 dark:text-white dark:border-gray-700" placeholder="Ej: Caja Chica">
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="text-[10px] font-black uppercase text-gray-400 block mb-1">Tipo</label>
                            <select id="swal-tipo" class="swal2-input w-full m-0 text-sm dark:bg-gray-800 dark:text-white dark:border-gray-700">
                                <option value="ACTIVO" ${parent?.tipo === 'ACTIVO' ? 'selected' : ''}>ACTIVO</option>
                                <option value="PASIVO" ${parent?.tipo === 'PASIVO' ? 'selected' : ''}>PASIVO</option>
                                <option value="CAPITAL" ${parent?.tipo === 'CAPITAL' ? 'selected' : ''}>CAPITAL</option>
                                <option value="INGRESO" ${parent?.tipo === 'INGRESO' ? 'selected' : ''}>INGRESO</option>
                                <option value="EGRESO" ${parent?.tipo === 'EGRESO' ? 'selected' : ''}>EGRESO</option>
                            </select>
                        </div>
                        <div>
                            <label class="text-[10px] font-black uppercase text-gray-400 block mb-1">Naturaleza</label>
                            <select id="swal-naturaleza" class="swal2-input w-full m-0 text-sm dark:bg-gray-800 dark:text-white dark:border-gray-700">
                                <option value="DEUDORA" ${parent?.naturaleza === 'DEUDORA' ? 'selected' : ''}>DEUDORA</option>
                                <option value="ACREEDORA" ${parent?.naturaleza === 'ACREEDORA' ? 'selected' : ''}>ACREEDORA</option>
                            </select>
                        </div>
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Crear Cuenta',
            customClass: {
                popup: 'dark:bg-gray-900 dark:border-gray-800',
                title: 'dark:text-white',
                htmlContainer: 'dark:text-gray-300'
            },
            preConfirm: () => {
                const codigo = document.getElementById('swal-codigo').value;
                const nombre = document.getElementById('swal-nombre').value;
                const tipo = document.getElementById('swal-tipo').value;
                const naturaleza = document.getElementById('swal-naturaleza').value;
                const cuentaPadreId = document.getElementById('swal-padre').value;
                
                if (!codigo || !nombre) return Swal.showValidationMessage('Código y nombre requeridos');
                
                // Determinar nivel basado en el padre
                let nivel = 1;
                if (cuentaPadreId) {
                    const padreObj = cuentas.find(c => c.id === cuentaPadreId);
                    nivel = (padreObj?.nivel || 1) + 1;
                }

                return { 
                    codigo, 
                    nombre, 
                    tipo, 
                    naturaleza, 
                    empresaId: selectedEmpresa.id,
                    cuentaPadreId: cuentaPadreId || null,
                    nivel
                };
            }
        });

        if (formValues) {
            try {
                await createContableCuenta(formValues);
                toast.success('Cuenta añadida');
                loadCuentas();
            } catch (e) { toast.error('Error al crear cuenta'); }
        }
    };

    const handleEditCuenta = async (cuenta) => {
        if (!selectedEmpresa) return toast.error('Selecciona una empresa primero');
        
        const parentOptions = cuentas
            .filter(c => c.nivel < 3 && c.id !== cuenta.id)
            .map(c => `<option value="${c.id}" ${cuenta.cuentaPadreId === c.id ? 'selected' : ''}>${c.codigo} - ${c.nombre}</option>`)
            .join('');

        const { value: formValues } = await Swal.fire({
            title: `Editar Cuenta: ${cuenta.nombre}`,
            html: `
                <div class="space-y-4 text-left p-2">
                    <div>
                        <label class="text-[10px] font-black uppercase text-gray-400 block mb-1">Cuenta Padre</label>
                        <select id="swal-edit-padre" class="swal2-input w-full m-0 text-sm dark:bg-gray-800 dark:text-white dark:border-gray-700">
                            <option value="">-- Ninguna (Nivel 1) --</option>
                            ${parentOptions}
                        </select>
                    </div>
                    <div>
                        <label class="text-[10px] font-black uppercase text-gray-400 block mb-1">Código Contable</label>
                        <input id="swal-edit-codigo" class="swal2-input w-full m-0 dark:bg-gray-800 dark:text-white dark:border-gray-700 font-bold" placeholder="Ej: 100-01-000" value="${cuenta.codigo || ''}">
                    </div>
                    <div>
                        <label class="text-[10px] font-black uppercase text-gray-400 block mb-1">Nombre de la Cuenta</label>
                        <input id="swal-edit-nombre" class="swal2-input w-full m-0 dark:bg-gray-800 dark:text-white dark:border-gray-700 font-bold" placeholder="Ej: Caja Chica" value="${cuenta.nombre || ''}">
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="text-[10px] font-black uppercase text-gray-400 block mb-1">Tipo</label>
                            <select id="swal-edit-tipo" class="swal2-input w-full m-0 text-sm dark:bg-gray-800 dark:text-white dark:border-gray-700 font-bold">
                                <option value="ACTIVO" ${cuenta.tipo === 'ACTIVO' ? 'selected' : ''}>ACTIVO</option>
                                <option value="PASIVO" ${cuenta.tipo === 'PASIVO' ? 'selected' : ''}>PASIVO</option>
                                <option value="CAPITAL" ${cuenta.tipo === 'CAPITAL' ? 'selected' : ''}>CAPITAL</option>
                                <option value="INGRESO" ${cuenta.tipo === 'INGRESO' ? 'selected' : ''}>INGRESO</option>
                                <option value="EGRESO" ${cuenta.tipo === 'EGRESO' ? 'selected' : ''}>EGRESO</option>
                            </select>
                        </div>
                        <div>
                            <label class="text-[10px] font-black uppercase text-gray-400 block mb-1">Naturaleza</label>
                            <select id="swal-edit-naturaleza" class="swal2-input w-full m-0 text-sm dark:bg-gray-800 dark:text-white dark:border-gray-700 font-bold">
                                <option value="DEUDORA" ${cuenta.naturaleza === 'DEUDORA' ? 'selected' : ''}>DEUDORA</option>
                                <option value="ACREEDORA" ${cuenta.naturaleza === 'ACREEDORA' ? 'selected' : ''}>ACREEDORA</option>
                            </select>
                        </div>
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Guardar Cambios',
            customClass: {
                popup: 'dark:bg-gray-900 dark:border-gray-800',
                title: 'dark:text-white',
                htmlContainer: 'dark:text-gray-300'
            },
            preConfirm: () => {
                const codigo = document.getElementById('swal-edit-codigo').value;
                const nombre = document.getElementById('swal-edit-nombre').value;
                const tipo = document.getElementById('swal-edit-tipo').value;
                const naturaleza = document.getElementById('swal-edit-naturaleza').value;
                const cuentaPadreId = document.getElementById('swal-edit-padre').value;
                
                if (!codigo || !nombre) return Swal.showValidationMessage('Código y nombre requeridos');
                
                let nivel = 1;
                if (cuentaPadreId) {
                    const padreObj = cuentas.find(c => c.id === cuentaPadreId);
                    nivel = (padreObj?.nivel || 1) + 1;
                }

                return { 
                    codigo, 
                    nombre, 
                    tipo, 
                    naturaleza, 
                    cuentaPadreId: cuentaPadreId || null,
                    nivel
                };
            }
        });

        if (formValues) {
            try {
                await updateContableCuenta(cuenta.id, formValues);
                toast.success('Cuenta actualizada');
                loadCuentas();
            } catch (e) { toast.error('Error al actualizar cuenta'); }
        }
    };

    const handleDeleteCuenta = async (id, nombre) => {
        const result = await Swal.fire({
            title: `¿Eliminar ${nombre}?`,
            text: 'Si tiene subcuentas, estas se verán afectadas o el sistema impedirá el borrado.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444'
        });

        if (result.isConfirmed) {
            try {
                await deleteContableCuenta(id);
                toast.success('Cuenta eliminada');
                loadCuentas();
            } catch (e) { toast.error('Error al eliminar: ' + e.message); }
        }
    };

    const sortedCuentas = useMemo(() => {
        return [...cuentas].sort((a, b) => a.codigo.localeCompare(b.codigo));
    }, [cuentas]);

    const filteredCuentas = sortedCuentas.filter(c => 
        c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.codigo.includes(searchTerm)
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="relative flex-1">
                    <FaSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                        type="text"
                        placeholder="Buscar por código o nombre de cuenta..."
                        className="w-full pl-14 pr-6 py-4 bg-gray-50/50 dark:bg-gray-900 border border-transparent focus:border-amber-500/20 rounded-[1.5rem] text-sm font-bold outline-none transition-all dark:text-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button onClick={() => handleAddCuenta()} className="btn-primary py-4 px-8 rounded-3xl shadow-xl shadow-primary/20 font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2">
                    <FaPlus /> Nueva de Mayor
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-900/50 border-b dark:border-gray-700">
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Código</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Nombre</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tipo</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Naturaleza</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                            {loading ? (
                                <tr><td colSpan="5" className="p-10 text-center animate-pulse text-[10px] font-black text-gray-400 uppercase">Cargando catálogo...</td></tr>
                            ) : filteredCuentas.length === 0 ? (
                                <tr><td colSpan="5" className="p-10 text-center text-[10px] font-black text-gray-400 uppercase italic">No hay cuentas registradas</td></tr>
                            ) : (
                                filteredCuentas.map(cuenta => (
                                    <tr key={cuenta.id} className="group hover:bg-gray-50/50 dark:hover:bg-gray-900/20 transition-all">
                                        <td className="px-8 py-4 font-mono text-xs font-black text-amber-600 tracking-tighter">{cuenta.codigo}</td>
                                        <td className="px-8 py-4">
                                            <div className="flex items-center gap-2">
                                                {cuenta.nivel > 1 && (
                                                    <div className="flex shrink-0">
                                                        {[...Array(cuenta.nivel - 1)].map((_, i) => (
                                                            <div key={i} className="w-6 border-l-2 border-gray-100 dark:border-gray-700 h-6 -mt-2"></div>
                                                        ))}
                                                        <FaChevronRight size={8} className="text-gray-300 mt-1" />
                                                    </div>
                                                )}
                                                <span className={`text-xs font-black uppercase tracking-tight ${cuenta.nivel === 1 ? 'text-gray-800 dark:text-white' : 'text-gray-500'}`}>{cuenta.nombre}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-4">
                                            <span className="text-[9px] font-black bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg uppercase tracking-widest border border-blue-100 dark:bg-blue-900/30 dark:border-blue-800">{cuenta.tipo}</span>
                                        </td>
                                        <td className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase">{cuenta.naturaleza}</td>
                                        <td className="px-8 py-4 text-right">
                                            <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-all">
                                                <button onClick={() => handleAddCuenta(cuenta)} title="Añadir Subcuenta" className="p-2.5 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-600 hover:text-white transition-all shadow-sm"><FaPlus size={10}/></button>
                                                <button onClick={() => handleEditCuenta(cuenta)} title="Editar Cuenta" className="p-2.5 bg-gray-50 dark:bg-gray-700 text-gray-400 hover:text-blue-500 rounded-xl transition-all shadow-sm"><FaEdit size={12}/></button>
                                                <button onClick={() => handleDeleteCuenta(cuenta.id, cuenta.nombre)} className="p-2.5 bg-gray-50 dark:bg-gray-700 text-gray-400 hover:text-red-500 rounded-xl transition-all shadow-sm"><FaTrash size={12}/></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const ConfigERP = ({ selectedEmpresa, onUpdate }) => {
    const [cuentas, setCuentas] = useState([]);
    const [config, setConfig] = useState({
        contabilidadAutomatica: false,
        cuentaVentasId: '',
        cuentaBancosId: '',
        cuentaVendingId: '',
        facturapiApiKey: '',
        lugarExpedicion: ''
    });

    useEffect(() => {
        let isMounted = true;
        if (selectedEmpresa) {
            const loadData = async () => {
                try {
                    const data = await fetchContableCuentas(selectedEmpresa.id);
                    if (isMounted) {
                        setCuentas(data);
                        setConfig({
                            contabilidadAutomatica: selectedEmpresa.contabilidadAutomatica,
                            cuentaVentasId: selectedEmpresa.cuentaVentasId || '',
                            cuentaBancosId: selectedEmpresa.cuentaBancosId || '',
                            cuentaVendingId: selectedEmpresa.cuentaVendingId || '',
                            facturapiApiKey: selectedEmpresa.facturapiApiKey || '',
                            lugarExpedicion: selectedEmpresa.lugarExpedicion || ''
                        });
                    }
                } catch (err) {
                    if (isMounted) toast.error('Error al cargar configuración');
                }
            };
            loadData();
        }
        return () => { isMounted = false; };
    }, [selectedEmpresa]);

    const handleSave = async () => {
        try {
            await updateContableEmpresa(selectedEmpresa.id, config);
            toast.success('Configuración ERP actualizada');
            onUpdate();
        } catch (e) { toast.error('Error al guardar configuración'); }
    };

    return (
        <div className="max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-amber-50 dark:bg-amber-900/10 p-6 rounded-3xl border border-amber-100 dark:border-amber-800/50">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-black text-amber-800 dark:text-amber-400 uppercase tracking-widest mb-1">Contabilización Automática</h3>
                        <p className="text-[10px] text-amber-600 dark:text-amber-500 font-bold italic">¿Generar pólizas de ingreso al finalizar ventas y cortes?</p>
                    </div>
                    <button 
                        onClick={() => setConfig({...config, contabilidadAutomatica: !config.contabilidadAutomatica})}
                        className={`w-14 h-8 rounded-full transition-all flex items-center px-1 ${config.contabilidadAutomatica ? 'bg-amber-500 justify-end' : 'bg-gray-200 dark:bg-gray-700 justify-start'}`}
                    >
                        <div className="w-6 h-6 bg-white rounded-full shadow-sm"></div>
                    </button>
                </div>
            </div>

            <div className={`space-y-6 transition-all ${config.contabilidadAutomatica ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Mapeo de Cuentas para Automatización</h4>
                
                <div className="space-y-4">
                    <div>
                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1.5 block">Cuenta de Ventas (Ingresos)</label>
                        <select 
                            value={config.cuentaVentasId}
                            onChange={e => setConfig({...config, cuentaVentasId: e.target.value})}
                            className="w-full input-style text-xs font-bold"
                        >
                            <option value="">Selecciona una cuenta...</option>
                            {cuentas.map(c => <option key={c.id} value={c.id}>{c.codigo} - {c.nombre}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1.5 block">Cuenta de Bancos/Caja (Deudor)</label>
                        <select 
                            value={config.cuentaBancosId}
                            onChange={e => setConfig({...config, cuentaBancosId: e.target.value})}
                            className="w-full input-style text-xs font-bold"
                        >
                            <option value="">Selecciona una cuenta...</option>
                            {cuentas.map(c => <option key={c.id} value={c.id}>{c.codigo} - {c.nombre}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1.5 block">Cuenta de Vending (Ingresos Específicos)</label>
                        <select 
                            value={config.cuentaVendingId}
                            onChange={e => setConfig({...config, cuentaVendingId: e.target.value})}
                            className="w-full input-style text-xs font-bold"
                        >
                            <option value="">Selecciona una cuenta...</option>
                            {cuentas.map(c => <option key={c.id} value={c.id}>{c.codigo} - {c.nombre}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="space-y-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Integración Fiscal (Facturapi)</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1.5 block">API Key (sk_test_... / sk_live_...)</label>
                        <input 
                            type="password"
                            placeholder="Ingresa tu API Key de Facturapi"
                            value={config.facturapiApiKey}
                            onChange={e => setConfig({...config, facturapiApiKey: e.target.value})}
                            className="w-full input-style text-xs font-bold"
                        />
                    </div>
                    <div>
                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1.5 block">Lugar de Expedición (Código Postal)</label>
                        <input 
                            type="text"
                            placeholder="Ej. 77500"
                            maxLength={5}
                            value={config.lugarExpedicion}
                            onChange={e => setConfig({...config, lugarExpedicion: e.target.value.replace(/\D/g, '')})}
                            className="w-full input-style text-xs font-bold"
                        />
                    </div>
                </div>
            </div>

            <button 
                onClick={handleSave}
                className="btn-primary w-full py-4 rounded-3xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20"
            >
                Guardar Configuración
            </button>
        </div>
    );
};

const ManageImpuestos = ({ selectedEmpresa }) => {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { name: 'IVA 16%', rate: '16%', type: 'TRASLADADO', color: 'blue' },
                    { name: 'Retención ISR', rate: '10%', type: 'RETENCION', color: 'rose' },
                    { name: 'IVA Acreditable', rate: '16%', type: 'ACREDITABLE', color: 'emerald' }
                ].map(tax => (
                    <div key={tax.name} className={`p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-[2.5rem] relative overflow-hidden`}>
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="font-black text-gray-800 dark:text-white uppercase text-xs tracking-widest">{tax.name}</h3>
                            <span className="text-[10px] font-black uppercase text-gray-400">{tax.type}</span>
                        </div>
                        <p className={`text-4xl font-black text-amber-500 tracking-tighter`}>{tax.rate}</p>
                    </div>
                ))}
            </div>
            <div className="bg-white dark:bg-gray-800 p-8 rounded-[3rem] border border-gray-100 dark:border-gray-700 text-center">
                <FaBalanceScale size={40} className="mx-auto mb-4 text-gray-200" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Configura aquí tus tasas impositivas y claves SAT</p>
            </div>
        </div>
    );
};

const ManageTerceros = ({ selectedEmpresa }) => {
    const [terceros, setTerceros] = useState({ clientes: [], proveedores: [] });
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (selectedEmpresa) {
            loadTerceros();
        }
    }, [selectedEmpresa]);

    const loadTerceros = async () => {
        setLoading(true);
        try {
            const data = await fetchContableTerceros(selectedEmpresa.id);
            setTerceros(data);
        } catch (e) {
            toast.error('Error al cargar clientes y proveedores');
        } finally {
            setLoading(false);
        }
    };

    const handleAddTercero = async () => {
        if (!selectedEmpresa) return toast.error('Selecciona una empresa primero');
        
        const { value: formValues } = await Swal.fire({
            title: 'Nuevo Tercero (Cliente / Proveedor)',
            html: `
                <div class="space-y-4 text-left p-2">
                    <div>
                        <label class="text-[10px] font-black uppercase text-gray-400 block mb-1">Tipo de Tercero</label>
                        <select id="swal-tipo" class="swal2-input w-full m-0 text-sm font-black uppercase dark:bg-gray-800 dark:text-white dark:border-gray-700">
                            <option value="CLIENTE">Cliente (CxC)</option>
                            <option value="PROVEEDOR">Proveedor (CxP)</option>
                        </select>
                    </div>
                    <div>
                        <label class="text-[10px] font-black uppercase text-gray-400 block mb-1">Nombre o Razón Social</label>
                        <input id="swal-nombre" class="swal2-input w-full m-0 uppercase dark:bg-gray-800 dark:text-white dark:border-gray-700 font-bold" placeholder="Nombre o Razón Social *">
                    </div>
                    <div>
                        <label class="text-[10px] font-black uppercase text-gray-400 block mb-1">RFC</label>
                        <input id="swal-rfc" class="swal2-input w-full m-0 uppercase dark:bg-gray-800 dark:text-white dark:border-gray-700 font-bold" placeholder="RFC (Opcional)">
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Registrar',
            customClass: {
                popup: 'dark:bg-gray-900 dark:border-gray-800',
                title: 'dark:text-white',
                htmlContainer: 'dark:text-gray-300'
            },
            preConfirm: () => {
                const nombre = document.getElementById('swal-nombre').value;
                const rfc = document.getElementById('swal-rfc').value;
                const tipo = document.getElementById('swal-tipo').value;
                
                if (!nombre) return Swal.showValidationMessage('El nombre es obligatorio');
                return { nombre, rfc, tipo, empresaId: selectedEmpresa.id };
            }
        });

        if (formValues) {
            try {
                await createContableTercero(formValues);
                toast.success('Tercero registrado exitosamente');
                loadTerceros();
            } catch (e) {
                toast.error('Error al registrar tercero');
            }
        }
    };

    const filteredClientes = (terceros.clientes || []).filter(c => 
        c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (c.rfc && c.rfc.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const filteredProveedores = (terceros.proveedores || []).filter(p => 
        p.razonSocial.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (p.rfc && p.rfc.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between gap-4">
                 <div className="relative flex-1">
                    <FaSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre o RFC..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 bg-gray-50/50 dark:bg-gray-900 border border-transparent focus:border-amber-500/20 rounded-[1.5rem] text-sm font-bold outline-none transition-all dark:text-white" 
                    />
                </div>
                <button onClick={handleAddTercero} className="btn-primary py-4 px-8 rounded-3xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
                    <FaPlus /> Nuevo Tercero
                </button>
            </div>

            {loading ? (
                <div className="text-center py-10 text-gray-400">
                    <p className="font-black uppercase tracking-widest text-[9px] animate-pulse">Cargando directorio...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Sección Clientes */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 border-b border-black/5 dark:border-white/5 pb-3">
                            <FaUsers className="text-emerald-500 text-lg" />
                            <h3 className="font-black text-gray-800 dark:text-white uppercase text-xs tracking-wider">Clientes ({filteredClientes.length})</h3>
                        </div>
                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {filteredClientes.length === 0 ? (
                                <p className="text-[10px] text-gray-400 font-bold uppercase italic p-4 text-center">No se encontraron clientes.</p>
                            ) : (
                                filteredClientes.map(c => (
                                    <div key={c.id} className="p-4 bg-gray-50/50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800 rounded-2xl flex justify-between items-center">
                                        <div>
                                            <p className="text-xs font-black uppercase text-gray-700 dark:text-gray-200">{c.nombre}</p>
                                            <p className="text-[9px] text-gray-400 font-mono mt-1">RFC: {c.rfc || 'XAXX010101000'}</p>
                                        </div>
                                        <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-1 rounded uppercase">Cliente</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Sección Proveedores */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 border-b border-black/5 dark:border-white/5 pb-3">
                            <FaStore className="text-rose-500 text-lg" />
                            <h3 className="font-black text-gray-800 dark:text-white uppercase text-xs tracking-wider">Proveedores ({filteredProveedores.length})</h3>
                        </div>
                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {filteredProveedores.length === 0 ? (
                                <p className="text-[10px] text-gray-400 font-bold uppercase italic p-4 text-center">No se encontraron proveedores.</p>
                            ) : (
                                filteredProveedores.map(p => (
                                    <div key={p.id} className="p-4 bg-gray-50/50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800 rounded-2xl flex justify-between items-center">
                                        <div>
                                            <p className="text-xs font-black uppercase text-gray-700 dark:text-gray-200">{p.razonSocial}</p>
                                            <p className="text-[9px] text-gray-400 font-mono mt-1">RFC: {p.rfc}</p>
                                        </div>
                                        <span className="text-[8px] font-black text-rose-600 bg-rose-50 dark:bg-rose-950/20 px-2 py-1 rounded uppercase">Proveedor</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const ManageDocumentos = ({ selectedEmpresa }) => {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {['Facturas', 'Contratos', 'Recibos', 'Evidencias'].map(type => (
                    <div key={type} className="p-6 bg-gray-50 dark:bg-gray-900/40 rounded-3xl border border-gray-100 dark:border-gray-700 text-center hover:border-amber-500 transition-all cursor-pointer group">
                        <FaFileSignature className="mx-auto mb-2 text-gray-300 group-hover:text-amber-500" />
                        <p className="text-[10px] font-black uppercase text-gray-500 dark:text-gray-400 tracking-widest">{type}</p>
                    </div>
                ))}
            </div>
            <div className="bg-amber-50/10 border-2 border-dashed border-amber-200 dark:border-amber-900/30 rounded-[3rem] p-12 text-center">
                <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <FaPlus className="text-amber-500" />
                </div>
                <h3 className="text-lg font-black text-gray-800 dark:text-white uppercase italic">Sube documentos para Materialidad</h3>
                <p className="text-xs text-gray-400 font-medium max-w-xs mx-auto mt-2 italic">Vincula archivos PDF, XML o imágenes directamente a tus pólizas contables.</p>
            </div>
        </div>
    );
};

const ManageFlujo = ({ selectedEmpresa }) => {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-8 bg-emerald-500 rounded-[2.5rem] text-white shadow-xl shadow-emerald-500/20">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2">Ingresos Mes</p>
                    <p className="text-3xl font-black tracking-tighter">$45,200.00</p>
                </div>
                <div className="p-8 bg-rose-500 rounded-[2.5rem] text-white shadow-xl shadow-rose-500/20">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2">Egresos Mes</p>
                    <p className="text-3xl font-black tracking-tighter">$12,850.00</p>
                </div>
                <div className="p-8 bg-blue-600 rounded-[2.5rem] text-white shadow-xl shadow-blue-600/20">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2">Saldo Disponible</p>
                    <p className="text-3xl font-black tracking-tighter">$32,350.00</p>
                </div>
            </div>
            <div className="h-64 bg-gray-50 dark:bg-gray-900/50 rounded-[3rem] border border-gray-100 dark:border-gray-700 flex items-center justify-center">
                 <FaChartLine size={40} className="text-gray-200" />
                 <p className="ml-4 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Gráfica de Flujo de Efectivo Diaria</p>
            </div>
        </div>
    );
};

const ManageCentros = ({ selectedEmpresa }) => {
    const [centros, setCentros] = useState([]);
    const [view, setView] = useState('list'); // list | rentas

    useEffect(() => {
        if (selectedEmpresa) {
            fetchContableCentrosCosto(selectedEmpresa.id).then(setCentros);
        }
    }, [selectedEmpresa]);

    const handleAddCentro = async () => {
        const { value: formValues } = await Swal.fire({
            title: 'Nueva Unidad de Negocio',
            html: `
                <div class="space-y-4 text-left p-2">
                    <input id="swal-clave" class="swal2-input w-full m-0 uppercase" placeholder="Clave (VENDING, MOSTRADOR, RENTAS)">
                    <input id="swal-nombre" class="swal2-input w-full m-0" placeholder="Nombre Descriptivo">
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Crear Unidad',
            preConfirm: () => {
                const clave = document.getElementById('swal-clave').value.toUpperCase();
                const nombre = document.getElementById('swal-nombre').value;
                if (!clave || !nombre) return Swal.showValidationMessage('Datos requeridos');
                return { clave, nombre, empresaId: selectedEmpresa.id };
            }
        });

        if (formValues) {
            try {
                await createContableCentroCosto(formValues);
                toast.success('Unidad registrada');
                fetchContableCentrosCosto(selectedEmpresa.id).then(setCentros);
            } catch (e) { toast.error('Error al registrar'); }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/40 p-2 rounded-2xl border border-gray-100 dark:border-gray-700">
                <div className="flex gap-2">
                    <button onClick={() => setView('list')} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${view === 'list' ? 'bg-white dark:bg-gray-800 shadow-sm text-amber-600' : 'text-gray-400'}`}>Unidades de Negocio</button>
                    <button onClick={() => setView('rentas')} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${view === 'rentas' ? 'bg-white dark:bg-gray-800 shadow-sm text-emerald-600' : 'text-gray-400'}`}>Rentas e Inmuebles</button>
                </div>
                <button onClick={handleAddCentro} className="p-2 bg-amber-500 text-white rounded-xl shadow-lg shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all"><FaPlus size={12}/></button>
            </div>

            {view === 'list' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
                    {centros.map(c => (
                        <div key={c.id} className="p-8 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-[3rem] shadow-sm relative overflow-hidden group hover:border-amber-500 transition-all">
                            <div className="flex justify-between items-start mb-6">
                                <span className="text-[9px] font-black bg-gray-50 dark:bg-gray-800 px-3 py-1 rounded-lg border dark:border-gray-700 text-gray-500 uppercase tracking-widest">{c.clave}</span>
                                <FaCheckCircle className="text-emerald-500 opacity-20" />
                            </div>
                            <h3 className="font-black text-gray-800 dark:text-white uppercase text-xs tracking-widest mb-1">{c.nombre}</h3>
                            <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest italic">Activa y Operativa</p>
                            
                            <div className="mt-8 pt-6 border-t border-black/5 dark:border-gray-800 flex justify-between items-end">
                                <div>
                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Utilidad Mes</p>
                                    <p className="text-xl font-black text-amber-500">$0.00</p>
                                </div>
                                <button className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl hover:text-amber-500 transition-all shadow-sm"><FaArrowRight size={10}/></button>
                            </div>
                        </div>
                    ))}
                    {centros.length === 0 && <div className="col-span-full py-20 text-center text-gray-400 font-black uppercase text-[10px] italic tracking-widest opacity-50">No hay unidades de negocio configuradas</div>}
                </div>
            ) : (
                <ManageContratos selectedEmpresa={selectedEmpresa} centros={centros} />
            )}
        </div>
    );
};

const ManageContratos = ({ selectedEmpresa, centros }) => {
    const [contratos, setContratos] = useState([]);

    useEffect(() => {
        if (selectedEmpresa) {
            fetchContableContratos(selectedEmpresa.id).then(setContratos);
        }
    }, [selectedEmpresa]);

    const handleAddContrato = async () => {
        if (centros.length === 0) return toast.error('Crea una unidad de negocio primero (ej: INMOBILIARIA)');
        
        const centroOptions = centros.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
        
        const { value: formValues } = await Swal.fire({
            title: 'Registrar Contrato / Renta',
            html: `
                <div class="space-y-4 text-left p-2">
                    <input id="swal-titulo" class="swal2-input w-full m-0 uppercase font-black text-xs" placeholder="Título (ej: Renta Bodega Industrial)">
                    <div class="grid grid-cols-2 gap-4">
                        <input id="swal-monto" type="number" class="swal2-input w-full m-0" placeholder="Monto Mensual $">
                        <input id="swal-dia" type="number" class="swal2-input w-full m-0" placeholder="Día de Pago (1-31)">
                    </div>
                    <select id="swal-centro" class="swal2-input w-full m-0 text-[10px] font-black uppercase">
                        <option value="">-- Selecciona Unidad de Negocio --</option>
                        ${centroOptions}
                    </select>
                    <input id="swal-tercero" class="swal2-input w-full m-0 uppercase text-xs font-bold" placeholder="Nombre del Inquilino / Beneficiario">
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Registrar Renta',
            preConfirm: () => {
                const titulo = document.getElementById('swal-titulo').value;
                const monto = parseFloat(document.getElementById('swal-monto').value);
                const diaPago = parseInt(document.getElementById('swal-dia').value);
                const centroCostoId = document.getElementById('swal-centro').value;
                const terceroNombre = document.getElementById('swal-tercero').value;

                if (!titulo || !monto || !centroCostoId) return Swal.showValidationMessage('Campos incompletos');
                
                return {
                    titulo,
                    monto,
                    diaPago,
                    centroCostoId,
                    terceroNombre,
                    tipo: 'ARRENDAMIENTO',
                    fechaInicio: new Date(),
                    empresaId: selectedEmpresa.id
                };
            }
        });

        if (formValues) {
            try {
                await createContableContrato(formValues);
                toast.success('Contrato de renta registrado');
                fetchContableContratos(selectedEmpresa.id).then(setContratos);
            } catch (e) { toast.error('Error al registrar'); }
        }
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="flex justify-end">
                <button onClick={handleAddContrato} className="px-6 py-4 bg-emerald-500 text-white font-black rounded-3xl uppercase tracking-widest text-[10px] shadow-xl shadow-emerald-500/20 flex items-center gap-3 hover:scale-[1.02] active:scale-95 transition-all">
                    <FaPlus /> Nuevo Contrato de Renta
                </button>
            </div>
            <div className="grid grid-cols-1 gap-4">
                {contratos.map(c => (
                    <div key={c.id} className="p-8 bg-emerald-50/20 border border-emerald-100 rounded-[3rem] flex flex-wrap justify-between items-center gap-8 group hover:bg-emerald-50/40 transition-all">
                        <div className="flex items-center gap-6">
                            <div className="w-14 h-14 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center text-emerald-500 shadow-sm border border-emerald-100"><FaIdCard size={24} /></div>
                            <div>
                                <h4 className="font-black text-sm text-gray-800 dark:text-white uppercase tracking-tight">{c.titulo}</h4>
                                <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-widest">{c.terceroNombre} | {c.centroCosto?.nombre}</p>
                            </div>
                        </div>
                        <div className="flex gap-12">
                            <div className="text-right">
                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Vencimiento</p>
                                <div className="flex items-center gap-2 justify-end">
                                    <span className="text-[10px] font-black bg-white px-2 py-1 rounded-lg shadow-sm border border-emerald-100">Día {c.diaPago}</span>
                                    <span className="text-[10px] font-black text-emerald-600 uppercase">Cada Mes</span>
                                </div>
                            </div>
                            <div className="text-right border-l border-emerald-200/50 pl-12">
                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Importe Mensual</p>
                                <p className="text-2xl font-black text-emerald-600 tracking-tighter">${c.monto.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                ))}
                {contratos.length === 0 && (
                    <div className="py-20 text-center text-gray-300 dark:text-gray-700">
                        <FaFileSignature size={60} className="mx-auto mb-4 opacity-10" />
                        <p className="font-black uppercase tracking-[0.4em] text-[10px]">No hay rentas o contratos activos</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const ManageBalanza = ({ selectedEmpresa }) => {
    const [balanza, setBalanza] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let isMounted = true;
        if (selectedEmpresa) {
            const loadData = async () => {
                setLoading(true);
                try {
                    const data = await fetchContableBalanza(selectedEmpresa.id);
                    if (isMounted) setBalanza(data);
                } catch (error) {
                    if (isMounted) toast.error('Error al cargar balanza');
                } finally {
                    if (isMounted) setLoading(false);
                }
            };
            loadData();
        }
        return () => { isMounted = false; };
    }, [selectedEmpresa]);

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-black uppercase text-gray-400 italic tracking-widest">Balanza de Comprobación al {new Date().toLocaleDateString()}</h3>
                <button className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-black text-[10px] uppercase shadow-sm">Exportar PDF</button>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-[11px]">
                        <thead className="bg-gray-50 dark:bg-gray-900/50 border-b dark:border-gray-700">
                            <tr>
                                <th className="px-8 py-5 font-black uppercase tracking-widest text-gray-400">Cuenta</th>
                                <th className="px-8 py-5 text-right font-black uppercase tracking-widest text-gray-400">Saldo Inicial</th>
                                <th className="px-8 py-5 text-right font-black uppercase tracking-widest text-gray-400">Cargos</th>
                                <th className="px-8 py-5 text-right font-black uppercase tracking-widest text-gray-400">Abonos</th>
                                <th className="px-8 py-5 text-right font-black uppercase tracking-widest text-gray-400">Saldo Final</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                            {loading ? (
                                <tr className="animate-pulse"><td colSpan="5" className="p-10 text-center font-bold text-gray-300 uppercase italic tracking-widest opacity-50">Sincronizando movimientos...</td></tr>
                            ) : balanza.length === 0 ? (
                                <tr><td colSpan="5" className="p-10 text-center text-gray-400 font-black uppercase italic tracking-widest opacity-50">No hay cuentas registradas</td></tr>
                            ) : (
                                balanza.map(c => (
                                    <tr key={c.id} className="group hover:bg-gray-50/50 dark:hover:bg-gray-900/20 transition-all">
                                        <td className="px-8 py-4">
                                            <p className="font-mono text-xs font-black text-amber-600 tracking-tighter">{c.codigo}</p>
                                            <p className="font-bold text-gray-800 dark:text-white uppercase mt-1">{c.nombre}</p>
                                        </td>
                                        <td className="px-8 py-4 text-right font-medium text-gray-500">${c.saldoInicial?.toLocaleString() || '0'}</td>
                                        <td className="px-8 py-4 text-right font-black text-rose-600">${c.cargos?.toLocaleString() || '0'}</td>
                                        <td className="px-8 py-4 text-right font-black text-emerald-600">${c.abonos?.toLocaleString() || '0'}</td>
                                        <td className="px-8 py-4 text-right font-black text-gray-800 dark:text-white text-sm">${c.saldoFinal?.toLocaleString() || '0'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const ManageLibroMayor = ({ selectedEmpresa }) => {
    return (
        <div className="space-y-6">
            <div className="p-8 bg-indigo-50/20 border border-indigo-100 rounded-[3rem] text-center">
                 <FaBook size={40} className="mx-auto mb-4 text-indigo-400" />
                 <h3 className="font-black text-gray-800 dark:text-white uppercase italic">Libro Mayor</h3>
                 <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2 italic">Desglose de movimientos acumulados por cuenta</p>
            </div>
        </div>
    );
};

const ManageResultados = ({ selectedEmpresa }) => {
    const [resultados, setResultados] = useState({ ingresos: 0, egresos: 0, utilidad: 0 });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let isMounted = true;
        if (selectedEmpresa) {
            const loadData = async () => {
                setLoading(true);
                try {
                    const data = await fetchContableEstadoResultados(selectedEmpresa.id);
                    if (isMounted) setResultados(data);
                } catch (error) {
                    if (isMounted) toast.error('Error al calcular resultados');
                } finally {
                    if (isMounted) setLoading(false);
                }
            };
            loadData();
        }
        return () => { isMounted = false; };
    }, [selectedEmpresa]);

    const esUtilidadPositiva = resultados.utilidad >= 0;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-10 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-[3rem] shadow-sm group hover:border-emerald-500 transition-colors">
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-4">Ingresos Operativos</p>
                    <div className="flex justify-between items-end">
                        <p className="text-4xl sm:text-5xl font-black text-gray-800 dark:text-white tracking-tighter">${resultados.ingresos.toLocaleString()}</p>
                        <FaArrowUp className="text-emerald-500 mb-2 text-xl group-hover:-translate-y-2 transition-transform" />
                    </div>
                </div>
                <div className="p-10 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-[3rem] shadow-sm group hover:border-rose-500 transition-colors">
                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-4">Gastos y Costos</p>
                    <div className="flex justify-between items-end">
                        <p className="text-4xl sm:text-5xl font-black text-gray-800 dark:text-white tracking-tighter">${resultados.egresos.toLocaleString()}</p>
                        <FaArrowDown className="text-rose-500 mb-2 text-xl group-hover:translate-y-2 transition-transform" />
                    </div>
                </div>
            </div>
            
            <div className={`p-12 ${esUtilidadPositiva ? 'bg-emerald-500' : 'bg-rose-500'} rounded-[3.5rem] text-center shadow-2xl relative overflow-hidden transition-colors duration-500`}>
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
                <div className="relative z-10">
                    <p className="font-black uppercase tracking-[0.4em] text-[10px] text-white/80 mb-4">
                        {esUtilidadPositiva ? 'Utilidad Neta del Ejercicio' : 'Pérdida Neta del Ejercicio'}
                    </p>
                    <h2 className="text-6xl sm:text-7xl font-black text-white tracking-tighter drop-shadow-lg">
                        ${Math.abs(resultados.utilidad).toLocaleString()}
                    </h2>
                    {loading && <p className="text-white/50 text-[10px] uppercase font-bold mt-4 animate-pulse">Actualizando cálculos...</p>}
                </div>
            </div>
        </div>
    );
};

const ManageEjercicios = ({ selectedEmpresa }) => {
    const [ejercicios, setEjercicios] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (selectedEmpresa) {
            loadEjercicios();
        }
    }, [selectedEmpresa]);

    const loadEjercicios = async () => {
        setLoading(true);
        try {
            const data = await fetchContableEjercicios(selectedEmpresa.id);
            setEjercicios(data);
        } catch (e) {
            toast.error('Error al cargar ejercicios fiscales');
        } finally {
            setLoading(false);
        }
    };

    const handleAperturar = async () => {
        if (!selectedEmpresa) return toast.error('Selecciona una empresa primero');
        
        const { value: anio } = await Swal.fire({
            title: 'Aperturar Ejercicio Fiscal',
            input: 'number',
            inputLabel: 'Año del ejercicio contable',
            inputValue: new Date().getFullYear(),
            showCancelButton: true,
            customClass: {
                popup: 'dark:bg-gray-900 dark:border-gray-800',
                title: 'dark:text-white',
                htmlContainer: 'dark:text-gray-300'
            },
            inputValidator: (value) => {
                if (!value || isNaN(value)) {
                    return 'Debes ingresar un año válido';
                }
            }
        });

        if (anio) {
            try {
                await createContableEjercicio({ empresaId: selectedEmpresa.id, anio: parseInt(anio) });
                toast.success('Ejercicio fiscal aperturado con éxito');
                loadEjercicios();
            } catch (e) {
                toast.error(e.response?.data?.error || 'Error al aperturar ejercicio fiscal');
            }
        }
    };

    const handleTogglePeriodo = async (periodo) => {
        const nombreMes = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][periodo.mes - 1];
        const accion = periodo.abierto ? 'CERRAR' : 'ABRIR';
        
        const result = await Swal.fire({
            title: `¿${accion} Periodo?`,
            text: `¿Deseas ${accion.toLowerCase()} el periodo contable de ${nombreMes}?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: `Sí, ${accion.toLowerCase()}`,
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await toggleContablePeriodo(periodo.id);
                toast.success(`Periodo actualizado correctamente`);
                loadEjercicios();
            } catch (e) {
                toast.error('Error al actualizar periodo contable');
            }
        }
    };

    const mesesNombres = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
                <h3 className="font-black text-gray-800 dark:text-white uppercase tracking-tight text-sm">Ejercicios Fiscales Aperturados</h3>
                <button 
                    onClick={handleAperturar}
                    className="btn-primary py-3 px-6 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 shadow-xl shadow-primary/20"
                >
                    <FaPlus /> Aperturar Ejercicio
                </button>
            </div>

            {loading ? (
                <div className="text-center py-10 text-gray-400">
                    <p className="font-black uppercase tracking-widest text-[9px] animate-pulse">Cargando ejercicios...</p>
                </div>
            ) : ejercicios.length === 0 ? (
                <div className="p-12 bg-gray-50/50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-700 rounded-[3rem] text-center">
                     <FaCalendarAlt size={50} className="mx-auto mb-6 text-gray-300 dark:text-gray-700" />
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Aún no hay ejercicios fiscales registrados.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {ejercicios.map(ej => (
                        <div key={ej.id} className="p-6 bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
                            <div className="flex justify-between items-center border-b border-black/5 dark:border-white/5 pb-4">
                                <div>
                                    <h4 className="text-xl font-black text-gray-800 dark:text-white">AÑO FISCAL: {ej.anio}</h4>
                                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-1">Estatus del Ejercicio</p>
                                </div>
                                <span className={`text-[10px] font-black px-3 py-1.5 rounded-xl border uppercase tracking-wider ${ej.abierto ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                    {ej.abierto ? 'EJERCICIO ABIERTO' : 'EJERCICIO CERRADO'}
                                </span>
                            </div>

                            {/* Cuadrícula de Periodos (Meses) */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {ej.periodos?.map(p => (
                                    <div 
                                        key={p.id} 
                                        className={`p-4 rounded-2xl border transition-all flex flex-col justify-between items-center gap-3 text-center ${
                                            p.abierto 
                                            ? 'bg-gray-50/50 dark:bg-gray-800/40 border-gray-100 dark:border-gray-800 hover:border-emerald-500' 
                                            : 'bg-rose-50/20 dark:bg-rose-950/10 border-rose-100/50 dark:border-rose-950/30'
                                        }`}
                                    >
                                        <div>
                                            <p className="text-xs font-black uppercase text-gray-700 dark:text-gray-200">{mesesNombres[p.mes - 1]}</p>
                                            <span className={`text-[8px] font-black uppercase tracking-widest block mt-1 ${p.abierto ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {p.abierto ? 'Abierto' : 'Cerrado'}
                                            </span>
                                        </div>
                                        <button 
                                            onClick={() => handleTogglePeriodo(p)}
                                            className={`w-full py-1.5 px-3 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all ${
                                                p.abierto 
                                                ? 'bg-white hover:bg-rose-500 hover:text-white hover:border-rose-500 text-gray-500 border-gray-200' 
                                                : 'bg-rose-500 text-white border-rose-500 hover:bg-emerald-600 hover:border-emerald-600'
                                            }`}
                                        >
                                            {p.abierto ? 'Cerrar' : 'Reabrir'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const ManageCxC = ({ selectedEmpresa }) => {
    const [cxcList, setCxcList] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (selectedEmpresa) {
            loadData();
        }
    }, [selectedEmpresa]);

    const loadData = async () => {
        setLoading(true);
        try {
            const list = await fetchContableCxC();
            setCxcList(list);
            const tercerosData = await fetchContableTerceros(selectedEmpresa.id);
            setClientes(tercerosData.clientes || []);
        } catch (e) {
            toast.error('Error al cargar cuentas por cobrar');
        } finally {
            setLoading(false);
        }
    };

    const handleRegistrarCargo = async () => {
        if (!selectedEmpresa) return toast.error('Selecciona una empresa primero');
        if (clientes.length === 0) {
            return Swal.fire({
                title: 'No hay clientes registrados',
                text: 'Primero debes registrar al menos un Cliente en la pestaña "Terceros (Cli/Prov)" antes de registrar cargos de CxC.',
                icon: 'warning',
                confirmButtonColor: '#0ea5e9'
            });
        }

        const clientOptions = clientes
            .map(c => `<option value="${c.id}">${c.nombre} (RFC: ${c.rfc || 'N/A'})</option>`)
            .join('');

        const { value: formValues } = await Swal.fire({
            title: 'Registrar Factura / Cargo (CxC)',
            html: `
                <div class="space-y-4 text-left p-2">
                    <div>
                        <label class="text-[10px] font-black uppercase text-gray-400 block mb-1">Cliente</label>
                        <select id="swal-cxc-cliente" class="swal2-input w-full m-0 text-sm font-bold dark:bg-gray-800 dark:text-white dark:border-gray-700">
                            ${clientOptions}
                        </select>
                    </div>
                    <div>
                        <label class="text-[10px] font-black uppercase text-gray-400 block mb-1">Importe Total</label>
                        <input id="swal-cxc-total" type="number" step="0.01" class="swal2-input w-full m-0 text-emerald-600 font-black dark:bg-gray-800 dark:border-gray-700" placeholder="0.00">
                    </div>
                    <div>
                        <label class="text-[10px] font-black uppercase text-gray-400 block mb-1">Fecha de Vencimiento</label>
                        <input id="swal-cxc-vencimiento" type="date" class="swal2-input w-full m-0 text-sm font-bold uppercase dark:bg-gray-800 dark:text-white dark:border-gray-700" value="${new Date().toISOString().split('T')[0]}">
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Registrar Cargo',
            customClass: {
                popup: 'dark:bg-gray-900 dark:border-gray-800',
                title: 'dark:text-white',
                htmlContainer: 'dark:text-gray-300'
            },
            preConfirm: () => {
                const clienteId = document.getElementById('swal-cxc-cliente').value;
                const total = parseFloat(document.getElementById('swal-cxc-total').value);
                const vencimiento = document.getElementById('swal-cxc-vencimiento').value;

                if (!clienteId || isNaN(total) || total <= 0 || !vencimiento) {
                    return Swal.showValidationMessage('Todos los campos son obligatorios y el total debe ser mayor a 0');
                }
                return { clienteId, total, vencimiento };
            }
        });

        if (formValues) {
            try {
                await createContableCxC(formValues);
                toast.success('Cargo de CxC registrado con éxito');
                loadData();
            } catch (e) {
                toast.error('Error al registrar cargo de CxC');
            }
        }
    };

    const totalPorCobrar = cxcList.reduce((sum, item) => sum + item.saldo, 0);
    const carteraVencida = cxcList.reduce((sum, item) => {
        const esVencido = new Date(item.vencimiento) < new Date() && item.saldo > 0;
        return esVencido ? sum + item.saldo : sum;
    }, 0);

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h3 className="font-black text-gray-800 dark:text-white uppercase tracking-tight flex items-center gap-2 text-sm">
                    <FaHandHoldingUsd className="text-emerald-500 text-lg" /> Cuentas por Cobrar (CxC)
                </h3>
                <button 
                    onClick={handleRegistrarCargo}
                    className="btn-primary py-3 px-6 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 shadow-xl shadow-primary/20"
                >
                    <FaPlus /> Registrar Factura / Cargo
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-8 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 rounded-[3rem] shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2 text-emerald-600">Total por Cobrar</p>
                    <p className="text-4xl font-black tracking-tighter text-emerald-700 dark:text-emerald-400">${totalPorCobrar.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                </div>
                <div className="p-8 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/50 rounded-[3rem] shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2 text-rose-600">Cartera Vencida</p>
                    <p className="text-4xl font-black tracking-tighter text-rose-700 dark:text-rose-400">${carteraVencida.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                </div>
            </div>

            {/* Listado de Cargos */}
            <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-900/50 border-b dark:border-gray-700">
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Cliente</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">RFC</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Vencimiento</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Total</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Saldo Pendiente</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Estatus</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800 text-[11px]">
                            {loading ? (
                                <tr><td colSpan="6" className="p-10 text-center animate-pulse text-[10px] font-black text-gray-400 uppercase">Cargando cuentas por cobrar...</td></tr>
                            ) : cxcList.length === 0 ? (
                                <tr><td colSpan="6" className="p-10 text-center text-gray-400 font-black uppercase italic tracking-widest opacity-50">No hay cargos de CxC registrados</td></tr>
                            ) : (
                                cxcList.map(item => {
                                    const esVencido = new Date(item.vencimiento) < new Date() && item.saldo > 0;
                                    const esPagado = item.saldo <= 0;
                                    return (
                                        <tr key={item.id} className="group hover:bg-gray-50/50 transition-all">
                                            <td className="px-8 py-4 font-bold text-gray-700 dark:text-gray-200 uppercase">{item.cliente?.nombre}</td>
                                            <td className="px-8 py-4 font-mono text-gray-500 uppercase">{item.cliente?.rfc || 'XAXX010101000'}</td>
                                            <td className="px-8 py-4 font-semibold text-gray-500">{new Date(item.vencimiento).toLocaleDateString()}</td>
                                            <td className="px-8 py-4 text-right font-black text-gray-700 dark:text-gray-200">${item.total.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                            <td className="px-8 py-4 text-right font-black text-amber-600">${item.saldo.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                            <td className="px-8 py-4 text-right">
                                                <span className={`text-[8px] font-black px-2.5 py-1 rounded uppercase ${
                                                    esPagado 
                                                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20' 
                                                    : esVencido 
                                                    ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 animate-pulse' 
                                                    : 'bg-blue-50 text-blue-600 dark:bg-blue-950/20'
                                                }`}>
                                                    {esPagado ? 'PAGADO' : esVencido ? 'VENCIDO' : 'VIGENTE'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const ManageCxP = ({ selectedEmpresa }) => {
    const [cxpList, setCxpList] = useState([]);
    const [proveedores, setProveedores] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (selectedEmpresa) {
            loadData();
        }
    }, [selectedEmpresa]);

    const loadData = async () => {
        setLoading(true);
        try {
            const list = await fetchContableCxP(selectedEmpresa.id);
            setCxpList(list);
            const tercerosData = await fetchContableTerceros(selectedEmpresa.id);
            setProveedores(tercerosData.proveedores || []);
        } catch (e) {
            toast.error('Error al cargar cuentas por pagar');
        } finally {
            setLoading(false);
        }
    };

    const handleRegistrarPasivo = async () => {
        if (!selectedEmpresa) return toast.error('Selecciona una empresa primero');
        if (proveedores.length === 0) {
            return Swal.fire({
                title: 'No hay proveedores registrados',
                text: 'Primero debes registrar al menos un Proveedor en la pestaña "Terceros (Cli/Prov)" antes de registrar pasivos de CxP.',
                icon: 'warning',
                confirmButtonColor: '#0ea5e9'
            });
        }

        const providerOptions = proveedores
            .map(p => `<option value="${p.id}">${p.razonSocial} (RFC: ${p.rfc})</option>`)
            .join('');

        const { value: formValues } = await Swal.fire({
            title: 'Registrar Pasivo / Gasto (CxP)',
            html: `
                <div class="space-y-4 text-left p-2">
                    <div>
                        <label class="text-[10px] font-black uppercase text-gray-400 block mb-1">Proveedor</label>
                        <select id="swal-cxp-proveedor" class="swal2-input w-full m-0 text-sm font-bold dark:bg-gray-800 dark:text-white dark:border-gray-700">
                            ${providerOptions}
                        </select>
                    </div>
                    <div>
                        <label class="text-[10px] font-black uppercase text-gray-400 block mb-1">Importe Total</label>
                        <input id="swal-cxp-total" type="number" step="0.01" class="swal2-input w-full m-0 text-rose-600 font-black dark:bg-gray-800 dark:border-gray-700" placeholder="0.00">
                    </div>
                    <div>
                        <label class="text-[10px] font-black uppercase text-gray-400 block mb-1">Fecha de Vencimiento</label>
                        <input id="swal-cxp-vencimiento" type="date" class="swal2-input w-full m-0 text-sm font-bold uppercase dark:bg-gray-800 dark:text-white dark:border-gray-700" value="${new Date().toISOString().split('T')[0]}">
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Registrar Pasivo',
            customClass: {
                popup: 'dark:bg-gray-900 dark:border-gray-800',
                title: 'dark:text-white',
                htmlContainer: 'dark:text-gray-300'
            },
            preConfirm: () => {
                const proveedorId = document.getElementById('swal-cxp-proveedor').value;
                const total = parseFloat(document.getElementById('swal-cxp-total').value);
                const vencimiento = document.getElementById('swal-cxp-vencimiento').value;

                if (!proveedorId || isNaN(total) || total <= 0 || !vencimiento) {
                    return Swal.showValidationMessage('Todos los campos son obligatorios y el total debe ser mayor a 0');
                }
                return { proveedorId, total, vencimiento };
            }
        });

        if (formValues) {
            try {
                await createContableCxP(formValues);
                toast.success('Pasivo de CxP registrado con éxito');
                loadData();
            } catch (e) {
                toast.error('Error al registrar pasivo de CxP');
            }
        }
    };

    const totalPorPagar = cxpList.reduce((sum, item) => sum + item.saldo, 0);
    const vencimientosProximos = cxpList.reduce((sum, item) => {
        const hoy = new Date();
        const limite = new Date();
        limite.setDate(hoy.getDate() + 7);
        const vencimientoDate = new Date(item.vencimiento);
        
        const esProximo = vencimientoDate <= limite && item.saldo > 0;
        return esProximo ? sum + item.saldo : sum;
    }, 0);

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h3 className="font-black text-gray-800 dark:text-white uppercase tracking-tight flex items-center gap-2 text-sm">
                    <FaPiggyBank className="text-rose-500 text-lg" /> Cuentas por Pagar (CxP)
                </h3>
                <button 
                    onClick={handleRegistrarPasivo}
                    className="btn-primary py-3 px-6 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 shadow-xl shadow-primary/20"
                >
                    <FaPlus /> Registrar Pasivo / Gasto
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-8 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/50 rounded-[3rem] shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2 text-rose-600">Total por Pagar</p>
                    <p className="text-4xl font-black tracking-tighter text-rose-700 dark:text-rose-400">${totalPorPagar.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                </div>
                <div className="p-8 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 rounded-[3rem] shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2 text-amber-600">Vencimientos Próximos</p>
                    <p className="text-4xl font-black tracking-tighter text-amber-700 dark:text-amber-400">${vencimientosProximos.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                </div>
            </div>

            {/* Listado de Pasivos */}
            <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-900/50 border-b dark:border-gray-700">
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Proveedor</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">RFC</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Vencimiento</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Total</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Saldo Pendiente</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Estatus</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800 text-[11px]">
                            {loading ? (
                                <tr><td colSpan="6" className="p-10 text-center animate-pulse text-[10px] font-black text-gray-400 uppercase">Cargando cuentas por pagar...</td></tr>
                            ) : cxpList.length === 0 ? (
                                <tr><td colSpan="6" className="p-10 text-center text-gray-400 font-black uppercase italic tracking-widest opacity-50">No hay pasivos de CxP registrados</td></tr>
                            ) : (
                                cxpList.map(item => {
                                    const hoy = new Date();
                                    const vencimientoDate = new Date(item.vencimiento);
                                    const esVencido = vencimientoDate < hoy && item.saldo > 0;
                                    const esPagado = item.saldo <= 0;
                                    return (
                                        <tr key={item.id} className="group hover:bg-gray-50/50 transition-all">
                                            <td className="px-8 py-4 font-bold text-gray-700 dark:text-gray-200 uppercase">{item.proveedor?.razonSocial}</td>
                                            <td className="px-8 py-4 font-mono text-gray-500 uppercase">{item.proveedor?.rfc}</td>
                                            <td className="px-8 py-4 font-semibold text-gray-500">{vencimientoDate.toLocaleDateString()}</td>
                                            <td className="px-8 py-4 text-right font-black text-gray-700 dark:text-gray-200">${item.total.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                            <td className="px-8 py-4 text-right font-black text-rose-600">${item.saldo.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                            <td className="px-8 py-4 text-right">
                                                <span className={`text-[8px] font-black px-2.5 py-1 rounded uppercase ${
                                                    esPagado 
                                                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20' 
                                                    : esVencido 
                                                    ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 animate-pulse' 
                                                    : 'bg-amber-50 text-amber-600 dark:bg-amber-950/20'
                                                }`}>
                                                    {esPagado ? 'PAGADO' : esVencido ? 'VENCIDO' : 'PENDIENTE'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const ManageConciliacion = ({ selectedEmpresa }) => {
    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="p-12 bg-gray-50/50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-700 rounded-[3rem] text-center shadow-sm">
                 <FaCheckDouble size={50} className="mx-auto mb-6 text-indigo-400/50" />
                 <h3 className="font-black text-gray-800 dark:text-white uppercase italic text-xl">Conciliación Bancaria</h3>
                 <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2 italic max-w-sm mx-auto">
                     Importa tu estado de cuenta bancario para realizar el cruce contable automatizado.
                 </p>
                 <button className="mt-8 px-8 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-[10px] font-black uppercase shadow-sm hover:border-amber-500 hover:text-amber-600 transition-all">
                     Importar Extracto (CSV)
                 </button>
            </div>
        </div>
    );
};

const ManageActivos = ({ selectedEmpresa }) => {
    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-end">
                <button className="btn-primary py-3 px-6 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 shadow-xl shadow-primary/20">
                    <FaPlus /> Alta de Activo
                </button>
            </div>
            <div className="p-12 bg-gray-50/50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-700 rounded-[3rem] text-center shadow-sm">
                 <FaBriefcase size={50} className="mx-auto mb-6 text-gray-300 dark:text-gray-700" />
                 <h3 className="font-black text-gray-800 dark:text-white uppercase italic text-xl">Padrón de Activos Fijos</h3>
                 <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2 italic">
                     Gestión de depreciaciones fiscales y valor en libros.
                 </p>
            </div>
        </div>
    );
};

const ManagePresupuestos = ({ selectedEmpresa }) => {
    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-end">
                <button className="btn-primary py-3 px-6 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 shadow-xl shadow-primary/20">
                    <FaPlus /> Crear Presupuesto
                </button>
            </div>
            <div className="p-12 bg-gray-50/50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-700 rounded-[3rem] text-center shadow-sm">
                 <FaChartPie size={50} className="mx-auto mb-6 text-gray-300 dark:text-gray-700" />
                 <h3 className="font-black text-gray-800 dark:text-white uppercase italic text-xl">Control Presupuestal</h3>
                 <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2 italic">
                     Asignación de techos financieros por Unidad de Negocio o Centro de Costo.
                 </p>
            </div>
        </div>
    );
};

export default Contabilidad;
