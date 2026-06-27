import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useGestion } from './context/GestionContext';
import { 
    FaUsers, FaUserCheck, FaUserTimes, FaPlus, FaEnvelope, 
    FaFileInvoiceDollar, FaMoneyCheckAlt, FaCalendarAlt, FaCheckCircle 
} from 'react-icons/fa';
import Organigrama from './components/Organigrama';
import { 
    fetchEmpleados, createEmpleado, fetchNominas, generarNomina, pagarNomina,
    fetchContableEmpresas, fetchContableBancos 
} from '../../api/apiClient';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// A reusable stat card component
const StatCard = ({ icon, title, value, bgColorClass }) => (
    <div className={`p-6 rounded-lg shadow-lg flex items-center space-x-4 ${bgColorClass}`}>
        <div className="text-3xl">{icon}</div>
        <div>
            <p className="text-sm font-medium uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
        </div>
    </div>
);

// A card for quick navigation links
const QuickLinkCard = ({ to, icon, title, description, onClick }) => {
    if (onClick) {
        return (
            <div onClick={onClick} className="cursor-pointer block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center space-x-4">
                    <div className="text-2xl text-primary">{icon}</div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white">{title}</h3>
                        <p className="text-gray-500 dark:text-gray-400">{description}</p>
                    </div>
                </div>
            </div>
        );
    }
    return (
        <Link to={to} className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center space-x-4">
                <div className="text-2xl text-primary">{icon}</div>
                <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">{title}</h3>
                    <p className="text-gray-500 dark:text-gray-400">{description}</p>
                </div>
            </div>
        </Link>
    );
};

const RecursosHumanos = () => {
    const { state } = useGestion();
    const { empleados, loading: loadingContext, error } = state;
    const [view, setView] = useState('resumen'); // resumen | nominas
    const [nominas, setNominas] = useState([]);
    const [empresas, setEmpresas] = useState([]);
    const [selectedEmpresa, setSelectedEmpresa] = useState(null);
    const [bancos, setBancos] = useState([]);
    const [loadingNominas, setLoadingNominas] = useState(false);

    useEffect(() => {
        fetchContableEmpresas().then(data => {
            setEmpresas(data);
            if (data.length > 0) setSelectedEmpresa(data[0]);
        });
    }, []);

    useEffect(() => {
        if (selectedEmpresa && view === 'nominas') {
            loadNominas();
            fetchContableBancos(selectedEmpresa.id).then(setBancos);
        }
    }, [selectedEmpresa, view]);

    const loadNominas = async () => {
        setLoadingNominas(true);
        try {
            const data = await fetchNominas(selectedEmpresa.id);
            setNominas(data);
        } catch (e) { toast.error('Error al cargar nóminas'); }
        finally { setLoadingNominas(false); }
    };

    const handleAddEmpleado = async () => {
        const { value: formValues } = await Swal.fire({
            title: 'Nuevo Empleado',
            html: `
                <div class="space-y-4 text-left p-2">
                    <input id="swal-emp-nombre" class="swal2-input w-full m-0 uppercase font-black text-xs" placeholder="Nombre Completo *">
                    <input id="swal-emp-puesto" class="swal2-input w-full m-0 uppercase text-xs" placeholder="Puesto (Ej. Repartidor) *">
                    <input id="swal-emp-sueldo" type="number" step="0.01" class="swal2-input w-full m-0 text-emerald-600 font-black" placeholder="Sueldo Mensual Netos *">
                    <input id="swal-emp-fecha" type="date" class="swal2-input w-full m-0 text-sm font-bold uppercase" title="Fecha de Contratación">
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Dar de Alta',
            preConfirm: () => {
                const nombreCompleto = document.getElementById('swal-emp-nombre').value;
                const puesto = document.getElementById('swal-emp-puesto').value;
                const sueldo = parseFloat(document.getElementById('swal-emp-sueldo').value);
                const fechaContratacion = document.getElementById('swal-emp-fecha').value;

                if (!nombreCompleto || !puesto || isNaN(sueldo) || !fechaContratacion) {
                    return Swal.showValidationMessage('Llena los campos obligatorios');
                }
                
                return {
                    nombreCompleto,
                    puesto,
                    sueldo,
                    fechaContratacion: new Date(fechaContratacion).toISOString(),
                    estatus: 'ACTIVO'
                };
            }
        });

        if (formValues) {
            try {
                await createEmpleado(formValues);
                toast.success('Empleado dado de alta. Refrescando sistema...');
                setTimeout(() => window.location.reload(), 1000); // Forzamos refresh para re-sincronizar el contexto global
            } catch (error) {
                toast.error('Error al registrar empleado');
            }
        }
    };

    const handleGenerarNomina = async () => {
        if (!selectedEmpresa) {
            Swal.fire({
                title: 'Empresa no seleccionada',
                text: 'No hay ninguna Empresa Contable registrada en el sistema. Debes dar de alta una en Contabilidad antes de generar nóminas.',
                icon: 'warning',
                confirmButtonColor: '#0ea5e9'
            });
            return;
        }

        const { value: formValues } = await Swal.fire({
            title: 'Generar Nómina Mensual',
            html: `
                <div class="space-y-4 text-left p-2">
                    <select id="swal-mes" class="swal2-input w-full m-0 text-sm">
                        <option value="1">Enero</option><option value="2">Febrero</option>
                        <option value="3">Marzo</option><option value="4">Abril</option>
                        <option value="5">Mayo</option><option value="6">Junio</option>
                        <option value="7">Julio</option><option value="8">Agosto</option>
                        <option value="9">Septiembre</option><option value="10">Octubre</option>
                        <option value="11">Noviembre</option><option value="12">Diciembre</option>
                    </select>
                    <input id="swal-anio" type="number" class="swal2-input w-full m-0" value="${new Date().getFullYear()}">
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Generar para todos los Activos',
            preConfirm: () => {
                return {
                    mes: parseInt(document.getElementById('swal-mes').value),
                    anio: parseInt(document.getElementById('swal-anio').value),
                    empresaId: selectedEmpresa.id
                };
            }
        });

        if (formValues) {
            toast.promise(generarNomina(formValues), {
                loading: 'Calculando sueldos...',
                success: () => { loadNominas(); return 'Nómina generada en borrador'; },
                error: 'Error al generar nómina'
            });
        }
    };

    const handlePagarNomina = async (nomina) => {
        const { value: bancoId } = await Swal.fire({
            title: 'Confirmar Pago de Nómina',
            text: `Se dispersarán $${nomina.total.toLocaleString()} entre los empleados activos.`,
            input: 'select',
            inputOptions: bancos.reduce((acc, b) => ({ ...acc, [b.id]: `${b.banco} - ${b.cuenta}` }), {}),
            inputPlaceholder: 'Selecciona cuenta bancaria',
            showCancelButton: true,
            confirmButtonColor: '#10b981'
        });

        if (bancoId) {
            try {
                await pagarNomina(nomina.id, bancoId);
                toast.success('Nómina pagada y Póliza de Egreso generada');
                loadNominas();
            } catch (e) { toast.error('Error al procesar pago'); }
        }
    };

    if (loadingContext && view === 'resumen') return <div className="p-6 text-center">Cargando datos de Recursos Humanos...</div>;
    if (error) return <div className="p-6 text-center text-red-500">Error: {error}</div>;

    const totalEmpleados = empleados.length;
    const empleadosActivos = empleados.filter(e => e.estatus === 'ACTIVO').length;
    const empleadosInactivos = empleados.filter(e => e.estatus === 'INACTIVO').length;
    
    const contratacionesRecientes = [...empleados]
        .sort((a, b) => new Date(b.fechaContratacion) - new Date(a.fechaContratacion))
        .slice(0, 5);

    return (
        <div className="space-y-8 pb-20">
            <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-dark dark:text-white uppercase tracking-tight flex items-center gap-3 italic">
                        <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-600/20 text-white">
                            <FaUsers />
                        </div> 
                        RECURSOS HUMANOS
                    </h1>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setView('resumen')} className={`btn-${view === 'resumen' ? 'primary' : 'secondary'} px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all`}>Dashboard</button>
                    <button onClick={() => setView('nominas')} className={`btn-${view === 'nominas' ? 'primary' : 'secondary'} px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all`}>Nóminas</button>
                </div>
            </div>

            {view === 'resumen' ? (
                <div className="space-y-8 animate-in fade-in duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard icon={<FaUsers />} title="Total de Empleados" value={totalEmpleados} bgColorClass="bg-blue-500 text-white" />
                        <StatCard icon={<FaUserCheck />} title="Empleados Activos" value={empleadosActivos} bgColorClass="bg-green-500 text-white" />
                        <StatCard icon={<FaUserTimes />} title="Empleados Inactivos" value={empleadosInactivos} bgColorClass="bg-red-500 text-white" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <QuickLinkCard to="/gestion/empleados" icon={<FaUsers />} title="Lista de Empleados" description="Ver, agregar, editar y eliminar empleados." />
                        <QuickLinkCard onClick={handleGenerarNomina} icon={<FaPlus />} title="Nueva Nómina" description="Iniciar dispersión del periodo actual." />
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 p-8">
                        <h3 className="text-xl font-black uppercase italic mb-6">Contrataciones Recientes</h3>
                        <ul className="space-y-4">
                            {contratacionesRecientes.map(empleado => (
                                <Link key={empleado.id} to={`/gestion/recursos-humanos/${empleado.id}`}>
                                    <li className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-900/40 rounded-2xl border border-transparent hover:border-indigo-500 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center font-black text-indigo-500 shadow-sm">{empleado.nombreCompleto.charAt(0)}</div>
                                            <div>
                                                <p className="font-black text-sm text-gray-800 dark:text-white uppercase tracking-tight">{empleado.nombreCompleto}</p>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase">{empleado.puesto}</p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-500 uppercase italic">
                                            {format(new Date(empleado.fechaContratacion), 'dd MMM yyyy', { locale: es })}
                                        </span>
                                    </li>
                                </Link>
                            ))}
                        </ul>
                    </div>
                    
                    <Organigrama empleados={empleados} />
                </div>
            ) : (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50/50 dark:bg-gray-900/40 p-4 rounded-[2.5rem] border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <FaCalendarAlt className="text-indigo-500" />
                            <select 
                                value={selectedEmpresa?.id || ''} 
                                onChange={e => setSelectedEmpresa(empresas.find(emp => emp.id === e.target.value))}
                                className="bg-transparent text-[10px] font-black uppercase outline-none dark:text-white"
                            >
                                {empresas.map(emp => <option key={emp.id} value={emp.id}>{emp.nombre}</option>)}
                            </select>
                        </div>
                        <button onClick={handleGenerarNomina} className="btn-primary py-3 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 shadow-xl shadow-primary/20"><FaPlus /> Generar Nómina</button>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-[3rem] border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-900/50 border-b dark:border-gray-700">
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Folio / Periodo</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Colaboradores</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Monto Total</th>
                                    <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                {nominas.map(nom => (
                                    <tr key={nom.id} className="group hover:bg-gray-50/50 transition-all">
                                        <td className="px-8 py-5">
                                            <p className="font-black text-xs text-gray-800 dark:text-white uppercase">{nom.folio}</p>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">Periodo: {format(new Date(nom.anio, nom.mes - 1), 'MMMM yyyy', { locale: es })}</p>
                                        </td>
                                        <td className="px-8 py-5 font-bold text-[10px] text-gray-500 uppercase">{nom._count?.detalles || 0} Personal</td>
                                        <td className="px-8 py-5 font-black text-indigo-600 text-lg">${nom.total.toLocaleString()}</td>
                                        <td className="px-8 py-5 text-right">
                                            {nom.estatus === 'BORRADOR' ? (
                                                <button onClick={() => handlePagarNomina(nom)} className="px-5 py-2 bg-emerald-50 text-emerald-600 font-black rounded-lg border border-emerald-100 uppercase text-[9px] hover:bg-emerald-600 hover:text-white transition-all shadow-sm">Dispersar Pago</button>
                                            ) : (
                                                <div className="flex items-center justify-end gap-2 text-emerald-600">
                                                    <FaCheckCircle size={14} />
                                                    <span className="text-[9px] font-black uppercase">Pagada</span>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {nominas.length === 0 && !loadingNominas && <tr><td colSpan="4" className="p-20 text-center text-gray-300 font-black uppercase text-[10px] italic tracking-widest opacity-50">No hay registros de nómina generados</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecursosHumanos;
