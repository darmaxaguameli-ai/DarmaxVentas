import React, { useState, useEffect } from 'react';
import { 
    FaFileInvoice, FaCheckDouble, FaFileArchive, FaSyncAlt, 
    FaCloudDownloadAlt, FaPlus, FaTimesCircle 
} from 'react-icons/fa';
import { 
    fetchFiscalFacturas, createFiscalFacturaPedido, cancelFiscalFactura,
    fetchContableEmpresas, fetchOrders
} from '../../api/apiClient';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const Fiscal = () => {
    const [view, setView] = useState('cfdi');
    const [facturas, setFacturas] = useState([]);
    const [empresas, setEmpresas] = useState([]);
    const [selectedEmpresa, setSelectedEmpresa] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [pedidos, setPedidos] = useState([]);

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        if (selectedEmpresa) loadFacturas();
    }, [selectedEmpresa]);

    const loadInitialData = async () => {
        try {
            const data = await fetchContableEmpresas();
            setEmpresas(data);
            if (data.length > 0) setSelectedEmpresa(data[0]);
        } catch (e) { toast.error('Error al cargar empresas'); }
    };

    const loadFacturas = async () => {
        setLoading(true);
        try {
            const data = await fetchFiscalFacturas(selectedEmpresa.id);
            setFacturas(data);
        } catch (e) { toast.error('Error al cargar facturas'); }
        finally { setLoading(false); }
    };

    const handleOpenInvoiceModal = async () => {
        if (!selectedEmpresa) return toast.error('Selecciona una empresa primero');
        setShowInvoiceModal(true);
        try {
            const data = await fetchOrders();
            // Filtrar solo entregados y no facturados (lógica simple por ahora)
            setPedidos(data.filter(p => p.status === 'ENTREGADO')); 
        } catch (e) { toast.error('Error al cargar pedidos'); }
    };

    const handleCreateInvoice = async (pedido) => {
        const { value: formValues } = await Swal.fire({
            title: 'Configuración CFDI 4.0',
            html: `
                <div class="space-y-4 text-left p-2">
                    <div class="grid grid-cols-2 gap-4">
                        <div><label class="text-[9px] font-black uppercase text-gray-400 block mb-1">RFC Receptor</label><input id="swal-rfc" class="swal2-input w-full m-0" value="${pedido.cliente?.rfc || ''}"></div>
                        <div><label class="text-[9px] font-black uppercase text-gray-400 block mb-1">C.P. Fiscal</label><input id="swal-cp" class="swal2-input w-full m-0" value="${pedido.cliente?.postalCode || ''}"></div>
                    </div>
                    <div><label class="text-[9px] font-black uppercase text-gray-400 block mb-1">Razón Social</label><input id="swal-razon" class="swal2-input w-full m-0 uppercase" value="${pedido.cliente?.name || ''}"></div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="text-[9px] font-black uppercase text-gray-400 block mb-1">Uso de CFDI</label>
                            <select id="swal-uso" class="swal2-input w-full m-0 text-[10px]">
                                <option value="G03">G03 - Gastos en general</option>
                                <option value="G01">G01 - Adquisición de mercancías</option>
                                <option value="S01">S01 - Sin efectos fiscales</option>
                                <option value="CP01">CP01 - Pagos</option>
                            </select>
                        </div>
                        <div>
                            <label class="text-[9px] font-black uppercase text-gray-400 block mb-1">Forma de Pago</label>
                            <select id="swal-forma" class="swal2-input w-full m-0 text-[10px]">
                                <option value="01">01 - Efectivo</option>
                                <option value="03">03 - Transferencia</option>
                                <option value="04">04 - Tarjeta de Crédito</option>
                                <option value="28">28 - Tarjeta de Débito</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label class="text-[9px] font-black uppercase text-gray-400 block mb-1">Régimen Fiscal</label>
                        <select id="swal-regimen" class="swal2-input w-full m-0 text-[10px]">
                            <option value="601">601 - General de Ley Personas Morales</option>
                            <option value="612">612 - Actividad Empresarial y Prof.</option>
                            <option value="626">626 - RESICO</option>
                            <option value="605">605 - Sueldos y Salarios</option>
                        </select>
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Generar Factura',
            preConfirm: () => {
                return {
                    rfc: document.getElementById('swal-rfc').value,
                    razonSocial: document.getElementById('swal-razon').value,
                    codigoPostal: document.getElementById('swal-cp').value,
                    regimenFiscal: document.getElementById('swal-regimen').value,
                    use: document.getElementById('swal-uso').value,
                    payment_form: document.getElementById('swal-forma').value,
                    payment_method: 'PUE',
                    pedidoId: pedido.id,
                    empresaId: selectedEmpresa.id
                };
            }
        });

        if (formValues) {
            toast.promise(createFiscalFacturaPedido(formValues), {
                loading: 'Procesando con el SAT...',
                success: () => {
                    loadFacturas();
                    setShowInvoiceModal(false);
                    return 'CFDI 4.0 Generado';
                },
                error: 'Error en el timbrado'
            });
        }
    };

    const handleCancelInvoice = async (factura) => {
        const { value: motive } = await Swal.fire({
            title: 'Cancelar Factura',
            text: `¿Estás seguro de cancelar el folio ${factura.folio}?`,
            input: 'select',
            inputOptions: {
                '01': '01 - Comprobante emitido con errores con relación',
                '02': '02 - Comprobante emitido con errores sin relación',
                '03': '03 - No se llevó a cabo la operación'
            },
            inputPlaceholder: 'Selecciona el motivo SAT',
            showCancelButton: true,
            confirmButtonColor: '#ef4444'
        });

        if (motive) {
            try {
                await cancelFiscalFactura(factura.id, motive);
                toast.success('Solicitud de cancelación enviada');
                loadFacturas();
            } catch (e) { toast.error('Error al cancelar'); }
        }
    };

    return (
        <div className="animate-fade-in space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-black text-gray-800 dark:text-white flex items-center gap-4 tracking-tighter uppercase italic">
                        <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-600/20 text-white">
                            <FaFileInvoice className="text-2xl" />
                        </div> 
                        MÓDULO FISCAL
                    </h1>
                    <div className="text-[10px] text-gray-500 font-bold mt-2 flex items-center gap-2 uppercase tracking-widest leading-none">
                        <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></div> 
                        Cumplimiento CFDI 4.0, SAT y Repositorio Digital
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {empresas.length > 0 && (
                        <select 
                            value={selectedEmpresa?.id || ''} 
                            onChange={(e) => setSelectedEmpresa(empresas.find(emp => emp.id === e.target.value))}
                            className="bg-white dark:bg-gray-800 p-3 rounded-2xl border border-gray-100 dark:border-gray-700 text-[10px] font-black uppercase outline-none shadow-sm"
                        >
                            {empresas.map(emp => <option key={emp.id} value={emp.id}>{emp.nombre}</option>)}
                        </select>
                    )}
                    <div className="flex gap-2 bg-white dark:bg-gray-800 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-x-auto">
                        {[
                            { id: 'cfdi', label: 'CFDI', icon: <FaFileInvoice /> },
                            { id: 'validacion', label: 'SAT', icon: <FaCheckDouble /> },
                            { id: 'xml', label: 'XML', icon: <FaFileArchive /> }
                        ].map(t => (
                            <button
                                key={t.id}
                                onClick={() => setView(t.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                                    view === t.id ? 'bg-indigo-50 text-indigo-600 border-2 border-indigo-100' : 'text-gray-400 hover:bg-gray-50'
                                }`}
                            >
                                {t.icon} {t.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Contenido Principal */}
            <div className="bg-white dark:bg-gray-800 rounded-[3rem] p-8 md:p-12 shadow-sm border border-gray-100 dark:border-gray-700 min-h-[500px] flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full -mr-32 -mt-32" />
                
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-50 dark:border-gray-700 relative z-10">
                    <h2 className="text-xl font-black text-gray-800 dark:text-white uppercase italic">
                        {view === 'cfdi' ? 'Facturación Electrónica' : view === 'validacion' ? 'Validación Masiva SAT' : 'Descarga y Almacenamiento XML'}
                    </h2>
                    <div className="flex gap-3">
                        <button onClick={loadFacturas} className="p-3 bg-gray-50 dark:bg-gray-700 text-gray-400 rounded-xl hover:text-indigo-600 transition-all"><FaSyncAlt className={loading ? 'animate-spin' : ''} /></button>
                        <button onClick={handleOpenInvoiceModal} className="btn-primary bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20 py-3 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95">
                            {view === 'xml' ? <><FaCloudDownloadAlt /> Descargar del SAT</> : <><FaPlus /> Nueva Factura</>}
                        </button>
                    </div>
                </div>

                <div className="relative z-10 flex-1">
                    {view === 'cfdi' ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-gray-900/50 border-b dark:border-gray-700">
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Folio / Fecha</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">UUID (SAT)</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Total</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Estatus</th>
                                        <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Descargas</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                    {facturas.length === 0 ? (
                                        <tr><td colSpan="5" className="p-20 text-center text-gray-400 font-black uppercase text-[10px] italic tracking-widest opacity-50">No hay facturas emitidas en este periodo</td></tr>
                                    ) : (
                                        facturas.map(f => (
                                            <tr key={f.id} className="group hover:bg-gray-50/50 transition-all">
                                                <td className="px-8 py-5">
                                                    <p className="font-black text-xs text-gray-800 dark:text-white uppercase">{f.serie}{f.folio}</p>
                                                    <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">{format(new Date(f.fecha), 'dd/MM/yyyy HH:mm')}</p>
                                                </td>
                                                <td className="px-8 py-5 font-mono text-[9px] text-indigo-500 font-bold tracking-tight">
                                                    {f.uuid || 'PENDIENTE DE TIMBRADO'}
                                                </td>
                                                <td className="px-8 py-5 font-black text-gray-700 dark:text-white">
                                                    ${f.total.toLocaleString()}
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className={`text-[8px] font-black px-2 py-1 rounded border uppercase ${f.status === 'valid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                                        {f.status === 'valid' ? 'Vigente' : 'Cancelada'}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-all">
                                                        <a href={f.pdfUrl} target="_blank" className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all"><FaFileInvoice size={12}/></a>
                                                        <button onClick={() => handleCancelInvoice(f)} className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition-all"><FaTimesCircle size={12}/></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-300 dark:text-gray-700">
                            <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/10 rounded-full flex items-center justify-center mb-6 border-4 border-white dark:border-gray-800 shadow-inner rotate-12">
                                <FaCheckDouble size={40} className="opacity-20" />
                            </div>
                            <p className="font-black uppercase tracking-[0.4em] text-[10px] mb-2">Motor Fiscal Darmax</p>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest italic text-center max-w-xs">
                                Preparando conexión con Webhooks de Facturapi y Servicios del SAT...
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de Nueva Factura */}
            {showInvoiceModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-[3rem] shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto animate-in zoom-in duration-300">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h2 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tight flex items-center gap-3">
                                    <FaFileInvoice className="text-indigo-600" /> Facturar Pedido
                                </h2>
                                <p className="text-[10px] text-gray-400 font-bold uppercase mt-2 tracking-widest italic">Selecciona un pedido completado para generar el CFDI 4.0</p>
                            </div>
                            <button onClick={() => setShowInvoiceModal(false)} className="text-gray-400 hover:text-red-500"><FaTimesCircle size={24}/></button>
                        </div>

                        <div className="space-y-4">
                            {pedidos.map(p => (
                                <div key={p.id} className="p-5 bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-700 rounded-[2rem] flex justify-between items-center group hover:border-indigo-500 transition-all">
                                    <div>
                                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">#{p.customId}</p>
                                        <h3 className="font-black text-sm text-gray-800 dark:text-white uppercase">{p.cliente.name}</h3>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">{format(new Date(p.createdAt), 'dd MMM yyyy')}</p>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <p className="text-lg font-black text-gray-700 dark:text-white">${p.total.toLocaleString()}</p>
                                        <button 
                                            onClick={() => handleCreateInvoice(p)}
                                            className="px-6 py-3 bg-white dark:bg-gray-800 text-indigo-600 font-black rounded-xl border border-indigo-100 uppercase tracking-widest text-[9px] hover:bg-indigo-600 hover:text-white transition-all shadow-sm shadow-indigo-100/50"
                                        >
                                            Generar CFDI
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {pedidos.length === 0 && (
                                <p className="text-center py-10 text-[10px] font-black text-gray-400 uppercase italic">No hay pedidos pendientes de facturar</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Fiscal;
