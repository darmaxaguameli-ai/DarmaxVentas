import React, { useState, useEffect, useMemo } from 'react';
import { 
    FaPlus, FaEdit, FaTrash, FaCheck, FaTimes, FaSearch, 
    FaHistory, FaRobot, FaMicrochip, FaMoneyBillWave, 
    FaExclamationTriangle, FaChartLine, FaStore, FaCheckCircle
} from 'react-icons/fa';
import { 
    fetchVendingMachines, createVendingMachine,
    fetchVendingCortes, createVendingCorte,
    fetchStores
} from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const Vending = () => {
    const { user } = useAuth();
    const [machines, setMachines] = useState([]);
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('list'); // 'list' | 'cortes'
    const [selectedMachine, setSelectedId] = useState(null);
    const [cortes, setCortes] = useState([]);
    const [showMachineModal, setShowMachineModal] = useState(false);
    const [showCorteModal, setShowCorteModal] = useState(false);

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const [mRes, sRes] = await Promise.all([
                fetchVendingMachines(),
                fetchStores()
            ]);
            setMachines(mRes);
            setStores(sRes);
        } catch (e) {
            toast.error('Error al cargar datos de vending');
        } finally {
            setLoading(false);
        }
    };

    const loadCortes = async (machineId) => {
        try {
            const data = await fetchVendingCortes(machineId);
            setCortes(data);
        } catch (e) {
            toast.error('Error al cargar cortes');
        }
    };

    const handleViewCortes = (machine) => {
        setSelectedId(machine);
        loadCortes(machine.id);
        setView('cortes');
    };

    const handleAddMachine = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        
        try {
            await createVendingMachine(data);
            toast.success('Máquina registrada');
            setShowMachineModal(false);
            loadInitialData();
        } catch (e) {
            toast.error('Error al registrar máquina');
        }
    };

    const handleAddCorte = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        
        // Cálculos básicos
        const contadorInicial = parseInt(data.contadorInicial);
        const contadorFinal = parseInt(data.contadorFinal);
        const consumosReales = contadorFinal - contadorInicial;
        const efectivoReclectado = parseFloat(data.efectivoReclectado);
        
        // Mock: asumiendo precio por litro/consumo de 15 pesos (podría venir de config)
        const precioUnitario = 15; 
        const montoEsperado = consumosReales * precioUnitario;
        const diferencia = efectivoReclectado - montoEsperado;

        const payload = {
            ...data,
            vendingMachineId: selectedMachine.id,
            contadorInicial,
            contadorFinal,
            consumosReales,
            efectivoReclectado,
            montoEsperado,
            diferencia,
            fecha: new Date().toISOString()
        };

        try {
            await createVendingCorte(payload);
            toast.success('Corte registrado exitosamente');
            setShowCorteModal(false);
            loadCortes(selectedMachine.id);
        } catch (e) {
            toast.error('Error al registrar corte');
        }
    };

    if (loading) return (
        <div className="p-8 text-center flex flex-col items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
            <p className="text-gray-400 font-black text-[10px] uppercase tracking-[0.3em] animate-pulse">Sincronizando Máquinas...</p>
        </div>
    );

    return (
        <div className="animate-fade-in space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-black text-gray-800 dark:text-white flex items-center gap-4 tracking-tighter uppercase italic">
                        <div className="bg-primary p-3 rounded-2xl shadow-lg shadow-primary/20 text-white">
                            <FaRobot className="text-2xl" />
                        </div> 
                        CORTES VENDING
                    </h1>
                    <div className="text-[10px] text-gray-500 font-bold mt-2 flex items-center gap-2 uppercase tracking-widest leading-none">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div> 
                        Control de Recaudación y Mantenimiento de Máquinas
                    </div>
                </div>
                {view === 'list' ? (
                    <button 
                        onClick={() => setShowMachineModal(true)}
                        className="btn-primary flex items-center justify-center gap-3 py-4 px-8 rounded-3xl shadow-2xl shadow-primary/30 font-black uppercase text-xs tracking-widest hover:scale-105 active:scale-95 transition-all w-full md:w-auto"
                    >
                        <FaPlus /> Nueva Máquina
                    </button>
                ) : (
                    <div className="flex gap-3 w-full md:w-auto">
                        <button 
                            onClick={() => setView('list')}
                            className="flex-1 md:flex-none px-6 py-4 bg-white dark:bg-gray-800 text-gray-500 font-black rounded-3xl uppercase tracking-widest text-[10px] border border-gray-200 dark:border-gray-700 shadow-sm"
                        >
                            Volver al Listado
                        </button>
                        <button 
                            onClick={() => setShowCorteModal(true)}
                            className="flex-[2] md:flex-none btn-primary py-4 px-8 rounded-3xl shadow-2xl font-black uppercase text-[10px] tracking-widest"
                        >
                            <FaMoneyBillWave className="inline mr-2" /> Realizar Corte
                        </button>
                    </div>
                )}
            </div>

            {view === 'list' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {machines.map(machine => (
                        <div key={machine.id} className="group bg-white dark:bg-gray-800 p-8 rounded-[3rem] border border-gray-50 dark:border-gray-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all relative overflow-hidden flex flex-col">
                            <div className="flex justify-between items-start mb-6">
                                <div className="p-4 rounded-2xl bg-blue-50 text-blue-500 group-hover:bg-primary group-hover:text-white transition-colors">
                                    <FaMicrochip size={24} />
                                </div>
                                <span className={`text-[8px] font-black px-3 py-1 rounded-lg uppercase tracking-widest ${machine.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                    {machine.status}
                                </span>
                            </div>

                            <h3 className="text-xl font-black text-gray-800 dark:text-white uppercase tracking-tight mb-1">{machine.name}</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2 mb-4">
                                <FaStore className="text-primary" /> {machine.store?.name || 'Sin asignar'}
                            </p>
                            
                            <div className="space-y-2 mb-8 flex-1">
                                <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                                    <span className="material-symbols-outlined text-sm">location_on</span>
                                    {machine.location || 'Ubicación no especificada'}
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase">
                                    <FaHistory /> {machine._count?.cortes || 0} Cortes registrados
                                </div>
                            </div>

                            <button 
                                onClick={() => handleViewCortes(machine)}
                                className="w-full py-4 bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-white font-black rounded-2xl uppercase tracking-widest text-[10px] hover:bg-primary hover:text-white transition-all shadow-sm active:scale-95"
                            >
                                Ver Historial de Cortes
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-[3rem] border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden animate-in slide-in-from-right-4 duration-300">
                    <div className="p-8 border-b dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20 flex flex-wrap justify-between items-center gap-4">
                        <div>
                            <h2 className="text-xl font-black text-gray-800 dark:text-white uppercase tracking-tight italic">{selectedMachine.name}</h2>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 italic">Historial de recaudación</p>
                        </div>
                        <div className="flex gap-6">
                            <div className="text-right">
                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Última Lectura</p>
                                <p className="text-lg font-black text-primary">{cortes[0]?.contadorFinal || 0}</p>
                            </div>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-900/50 border-b dark:border-gray-700">
                                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Fecha / Folio</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Consumos (Lts)</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Recaudado</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Estatus</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                {cortes.length === 0 ? (
                                    <tr><td colSpan="4" className="p-20 text-center text-gray-400 font-black uppercase text-[10px] italic tracking-widest opacity-50">No hay cortes registrados para esta máquina</td></tr>
                                ) : (
                                    cortes.map(corte => (
                                        <tr key={corte.id} className="group hover:bg-gray-50/50 dark:hover:bg-gray-900/20 transition-all">
                                            <td className="px-8 py-6">
                                                <p className="font-black text-gray-800 dark:text-white uppercase text-xs">{format(new Date(corte.fecha), 'dd MMM yyyy', { locale: es })}</p>
                                                <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">#{corte.folio}</p>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="text-[10px] font-black bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-100">{corte.consumosReales}</div>
                                                    <span className="text-[8px] font-bold text-gray-400 uppercase">({corte.contadorInicial} → {corte.contadorFinal})</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 font-black text-emerald-600 text-lg">
                                                ${corte.efectivoReclectado.toFixed(2)}
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                {corte.diferencia < 0 ? (
                                                    <span className="text-[9px] font-black bg-red-50 text-red-600 px-3 py-1 rounded-lg uppercase border border-red-100 flex items-center gap-1 w-fit ml-auto">
                                                        <FaExclamationTriangle size={8} /> Faltante: ${Math.abs(corte.diferencia).toFixed(2)}
                                                    </span>
                                                ) : corte.diferencia > 0 ? (
                                                    <span className="text-[9px] font-black bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg uppercase border border-emerald-100 w-fit ml-auto">
                                                        Sobrante: ${corte.diferencia.toFixed(2)}
                                                    </span>
                                                ) : (
                                                    <span className="text-[9px] font-black bg-gray-50 text-gray-500 px-3 py-1 rounded-lg uppercase border border-gray-100 w-fit ml-auto">Cuadrado</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal Nueva Máquina */}
            {showMachineModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-2xl w-full max-w-md animate-in zoom-in duration-300">
                        <h2 className="text-2xl font-black text-dark dark:text-white uppercase tracking-tight flex items-center gap-3 mb-6 leading-none">
                            <FaRobot className="text-primary" /> Registrar Vending
                        </h2>
                        <form onSubmit={handleAddMachine} className="space-y-4">
                            <div><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block italic">Nombre Identificador *</label><input name="name" required className="w-full input-style font-black uppercase text-sm" placeholder="Ej: VENDING PLAZA NORTE" /></div>
                            <div><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block italic">Sucursal Responsable *</label><select name="storeId" required className="w-full input-style font-black text-[10px] uppercase">{stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                            <div><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block italic">Modelo / Especificación</label><input name="model" className="w-full input-style text-xs font-bold" placeholder="Ej: Atlantis 300 Max" /></div>
                            <div className="flex gap-3 pt-6">
                                <button type="button" onClick={() => setShowMachineModal(false)} className="flex-1 py-4 bg-white dark:bg-gray-800 text-gray-500 font-black rounded-2xl uppercase tracking-widest text-[10px] border border-gray-200 dark:border-gray-700">Cancelar</button>
                                <button type="submit" className="flex-[2] py-4 bg-primary text-white font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-2xl">Confirmar Registro</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Realizar Corte */}
            {showCorteModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-2xl w-full max-w-md animate-in zoom-in duration-300">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-2xl font-black text-dark dark:text-white uppercase tracking-tight flex items-center gap-3 leading-none">Corte de Caja</h2>
                                <p className="text-[10px] text-gray-400 font-bold uppercase mt-2 tracking-widest italic">{selectedMachine.name}</p>
                            </div>
                            <button onClick={() => setShowCorteModal(false)} className="text-gray-400 hover:text-red-500"><FaTimes size={20}/></button>
                        </div>
                        <form onSubmit={handleAddCorte} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block italic">Contador Inicial</label><input type="number" name="contadorInicial" required defaultValue={cortes[0]?.contadorFinal || 0} className="w-full input-style font-black text-center" /></div>
                                <div><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block italic">Contador Actual *</label><input type="number" name="contadorFinal" required className="w-full input-style font-black text-center text-primary" autoFocus /></div>
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block italic text-center">Efectivo Recolectado ($) *</label>
                                <input type="number" step="0.01" name="efectivoReclectado" required className="w-full input-style font-black text-3xl text-center text-emerald-600 bg-emerald-50/30 border-emerald-100" placeholder="0.00" />
                            </div>
                            <div><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block italic">Observaciones / Incidencias</label><textarea name="notas" className="w-full input-style text-xs h-20 resize-none" placeholder="¿Algún problema con el cambio o la máquina?" /></div>
                            <button type="submit" className="w-full py-4 bg-primary text-white font-black rounded-3xl uppercase tracking-widest text-xs shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all">
                                <FaCheckCircle size={18} /> Finalizar Recaudación
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Vending;
