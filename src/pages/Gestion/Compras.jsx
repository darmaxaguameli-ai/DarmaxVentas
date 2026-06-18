import React, { useState, useEffect } from 'react';
import { 
    fetchSolicitudesCompra, createSolicitudCompra,
    fetchOrdenesCompra, createOrdenCompra,
    createRecepcionCompra,
    fetchCxP, pagarCxP,
    fetchContableBancos, fetchContableEmpresas
} from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
    FaShoppingCart, FaFileAlt, FaTruckLoading, FaHistory,
    FaPlus, FaSearch, FaCheckCircle, FaTimesCircle, FaExclamationCircle,
    FaMoneyBillWave, FaUniversity, FaCreditCard, FaTimes
} from 'react-icons/fa';

const Compras = () => {
    const { user } = useAuth();
    const [view, setView] = useState('solicitudes'); // solicitudes | ordenes | recepciones | cxp
    const [ordenes, setOrdenes] = useState([]);
    const [cxpList, setCxpList] = useState([]);
    const [empresas, setEmpresas] = useState([]);
    const [selectedEmpresa, setSelectedEmpresa] = useState(null);
    const [bancos, setBancos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showRecepcionModal, setShowRecepcionModal] = useState(false);
    const [showPagoModal, setShowPagoModal] = useState(false);
    const [selectedOrden, setSelectedOrden] = useState(null);
    const [selectedCxP, setSelectedCxP] = useState(null);

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        if (view === 'recepciones' || view === 'ordenes') loadOrdenes();
        if (view === 'cxp') loadCxP();
    }, [view, selectedEmpresa]);

    const loadInitialData = async () => {
        try {
            const data = await fetchContableEmpresas();
            setEmpresas(data);
            if (data.length > 0) setSelectedEmpresa(data[0]);
        } catch (e) { toast.error('Error al cargar empresas'); }
    };

    const loadOrdenes = async () => {
        if (!selectedEmpresa) return;
        setLoading(true);
        try {
            const data = await fetchOrdenesCompra(selectedEmpresa.id); 
            setOrdenes(data);
        } catch (e) { toast.error('Error al cargar órdenes'); }
        finally { setLoading(false); }
    };

    const loadCxP = async () => {
        if (!selectedEmpresa) return;
        setLoading(true);
        try {
            const [cxpData, bancosData] = await Promise.all([
                fetchCxP(selectedEmpresa.id, 'PENDIENTE'),
                fetchContableBancos(selectedEmpresa.id)
            ]);
            setCxpList(cxpData);
            setBancos(bancosData);
        } catch (e) { toast.error('Error al cargar CxP'); }
        finally { setLoading(false); }
    };

    const handleOpenRecepcion = (oc) => {
        setSelectedOrden(oc);
        setShowRecepcionModal(true);
    };

    const handleConfirmRecepcion = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const itemsRecibidos = selectedOrden.items.map(item => ({
            productId: item.productId,
            quantity: formData.get(`qty-${item.productId}`) || item.cantidad
        }));

        try {
            await createRecepcionCompra({
                ordenId: selectedOrden.id,
                items: itemsRecibidos,
                recibidoPor: user.name,
                notas: formData.get('notas')
            });
            toast.success('Entrada registrada e Inventario actualizado');
            setShowRecepcionModal(false);
            loadOrdenes();
        } catch (e) { toast.error('Error al registrar recepción'); }
    };

    const handleConfirmPago = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const importe = parseFloat(formData.get('importe'));

        try {
            await pagarCxP(selectedCxP.id, {
                importe,
                cuentaBancariaId: formData.get('cuentaBancariaId'),
                referencia: formData.get('referencia'),
                concepto: formData.get('concepto')
            });
            toast.success('Pago registrado y Póliza de Egreso generada');
            setShowPagoModal(false);
            loadCxP();
        } catch (e) { toast.error('Error al procesar pago: ' + e.message); }
    };

    const handleAddFlow = async () => {
        if (view === 'solicitudes') {
            const { value: formValues } = await Swal.fire({
                title: 'Nueva Requisición',
                html: `
                    <div class="space-y-4 text-left p-2">
                        <select id="swal-prioridad" class="swal2-input w-full m-0 text-sm">
                            <option value="NORMAL">Prioridad NORMAL</option>
                            <option value="ALTA">Prioridad ALTA</option>
                            <option value="URGENTE">Prioridad URGENTE</option>
                        </select>
                        <textarea id="swal-justificacion" class="w-full input-style text-xs h-20 resize-none mt-4 p-4 border rounded-xl" placeholder="Justificación de la compra..."></textarea>
                        <textarea id="swal-items" class="w-full input-style text-xs h-20 resize-none mt-4 p-4 border rounded-xl" placeholder="Productos (Ej: 500 Tapas garrafón, 2 Filtros)..."></textarea>
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: 'Registrar',
                preConfirm: () => {
                    return {
                        prioridad: document.getElementById('swal-prioridad').value,
                        justificacion: document.getElementById('swal-justificacion').value,
                        items: [{ producto: document.getElementById('swal-items').value, cantidad: 1 }], // Basic text for now
                        solicitante: user?.name || 'Usuario',
                        empresaId: selectedEmpresa.id
                    };
                }
            });

            if (formValues) {
                try {
                    await createSolicitudCompra(formValues);
                    toast.success('Solicitud de compra registrada');
                    loadOrdenes();
                } catch (e) { toast.error('Error al registrar solicitud'); }
            }
        } else if (view === 'ordenes') {
            const { value: formValues } = await Swal.fire({
                title: 'Nueva Orden de Compra',
                html: `
                    <div class="space-y-4 text-left p-2">
                        <input id="swal-proveedor" class="swal2-input w-full m-0 text-sm" placeholder="ID Proveedor (Ej: cmk...)">
                        <input id="swal-total" type="number" class="swal2-input w-full m-0 text-sm mt-4" placeholder="Total a Pagar $">
                        <textarea id="swal-items-oc" class="w-full input-style text-xs h-20 resize-none mt-4 p-4 border rounded-xl" placeholder="Detalle (Ej: 500 Tapas a $1.20)"></textarea>
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: 'Registrar Orden',
                preConfirm: () => {
                    const proveedorId = document.getElementById('swal-proveedor').value;
                    const total = parseFloat(document.getElementById('swal-total').value);
                    if(!proveedorId || isNaN(total)) return Swal.showValidationMessage('Proveedor y Total requeridos');
                    return {
                        proveedorId,
                        total,
                        items: [{ producto: document.getElementById('swal-items-oc').value, cantidad: 1 }],
                        empresaId: selectedEmpresa.id
                    };
                }
            });

            if (formValues) {
                try {
                    await createOrdenCompra(formValues);
                    toast.success('Orden de Compra generada');
                    loadOrdenes();
                } catch (e) { toast.error('Error al generar OC'); }
            }
        }
    };

    return (
        <div className="animate-fade-in space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-black text-gray-800 dark:text-white flex items-center gap-4 tracking-tighter uppercase italic">
                        <div className="bg-rose-500 p-3 rounded-2xl shadow-lg shadow-rose-500/20 text-white">
                            <FaShoppingCart className="text-2xl" />
                        </div> 
                        COMPRAS Y CXP
                    </h1>
                    <div className="text-[10px] text-gray-500 font-bold mt-2 flex items-center gap-2 uppercase tracking-widest leading-none">
                        <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></div> 
                        Ciclo de Suministro, Órdenes y Cuentas por Pagar
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
                    <div className="flex gap-2 bg-white dark:bg-gray-800 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-x-auto w-full md:w-auto">
                        {[
                            { id: 'solicitudes', label: 'Solicitudes', icon: <FaFileAlt /> },
                            { id: 'ordenes', label: 'Órdenes', icon: <FaShoppingCart /> },
                            { id: 'recepciones', label: 'Recepciones', icon: <FaTruckLoading /> },
                            { id: 'cxp', label: 'CxP', icon: <FaMoneyBillWave /> }
                        ].map(t => (
                            <button
                                key={t.id}
                                onClick={() => setView(t.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                                    view === t.id ? 'bg-rose-50 text-rose-600 border-2 border-rose-100' : 'text-gray-400 hover:bg-gray-50'
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
                <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full -mr-32 -mt-32" />
                
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-50 dark:border-gray-700 relative z-10">
                    <h2 className="text-xl font-black text-gray-800 dark:text-white uppercase italic">
                        {view === 'solicitudes' ? 'Solicitudes de Requisición' : view === 'ordenes' ? 'Órdenes de Compra' : view === 'recepciones' ? 'Entradas de Almacén' : 'Cuentas por Pagar a Proveedores'}
                    </h2>
                    {(view === 'solicitudes' || view === 'ordenes') && (
                        <button onClick={handleAddFlow} className="btn-primary bg-rose-500 hover:bg-rose-600 shadow-rose-500/20 py-3 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95">
                            <FaPlus /> {view === 'solicitudes' ? 'Nueva Requisición' : 'Nueva Orden'}
                        </button>
                    )}
                </div>

                <div className="relative z-10 flex-1">
                    {view === 'recepciones' && (
                        <div className="space-y-6">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic mb-4">Órdenes pendientes de recibir:</p>
                            <div className="grid grid-cols-1 gap-4">
                                {ordenes.filter(o => o.status !== 'RECIBIDA_TOTAL').map(oc => (
                                    <div key={oc.id} className="p-6 bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-700 rounded-3xl flex flex-wrap justify-between items-center gap-6 hover:border-rose-500 transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center text-rose-500 shadow-sm group-hover:bg-rose-500 group-hover:text-white transition-colors">
                                                <FaShoppingCart />
                                            </div>
                                            <div>
                                                <h3 className="font-black text-sm text-gray-800 dark:text-white uppercase">{oc.folio}</h3>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{oc.proveedor.razonSocial}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => handleOpenRecepcion(oc)} className="px-6 py-3 bg-white dark:bg-gray-800 text-rose-600 font-black rounded-xl border border-rose-100 uppercase tracking-widest text-[9px] hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-95">Registrar Entrada</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {view === 'cxp' && (
                        <div className="space-y-6">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-gray-50 dark:bg-gray-900/50 border-b dark:border-gray-700">
                                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Proveedor / OC</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Vencimiento</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Saldo Pendiente</th>
                                            <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                        {cxpList.map(item => (
                                            <tr key={item.id} className="group hover:bg-gray-50/50 transition-all">
                                                <td className="px-8 py-5">
                                                    <p className="font-black text-xs text-gray-800 dark:text-white uppercase">{item.proveedor.razonSocial}</p>
                                                    <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">OC: {item.ordenCompra?.folio || 'N/A'}</p>
                                                </td>
                                                <td className="px-8 py-5 font-bold text-[10px] text-gray-600 uppercase">
                                                    {format(new Date(item.vencimiento), 'dd MMM yyyy')}
                                                </td>
                                                <td className="px-8 py-5 font-black text-rose-600 text-lg">${item.saldo.toLocaleString()}</td>
                                                <td className="px-8 py-5 text-right">
                                                    <button 
                                                        onClick={() => { setSelectedCxP(item); setShowPagoModal(true); }}
                                                        className="px-6 py-2.5 bg-emerald-50 text-emerald-600 font-black rounded-xl border border-emerald-100 uppercase tracking-widest text-[9px] hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                                    >
                                                        Aplicar Pago
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {cxpList.length === 0 && <tr><td colSpan="4" className="p-20 text-center text-gray-400 font-black uppercase text-[10px] italic tracking-widest opacity-50">No hay deudas pendientes</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {(view === 'solicitudes' || view === 'ordenes') && (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-300 dark:text-gray-700">
                            <div className="w-24 h-24 bg-rose-50 dark:bg-rose-900/10 rounded-full flex items-center justify-center mb-6 border-4 border-white dark:border-gray-800 shadow-inner">
                                <FaShoppingCart size={40} className="opacity-20" />
                            </div>
                            <p className="font-black uppercase tracking-[0.4em] text-[10px] mb-2">Módulo de Compras V2</p>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest italic animate-pulse text-center">Cargando flujos operativos...</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Recepción */}
            {showRecepcionModal && selectedOrden && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-[3rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in duration-300">
                        <div className="flex justify-between items-start mb-8">
                            <h2 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tight flex items-center gap-3"><FaTruckLoading className="text-rose-500" /> Registrar Entrada</h2>
                            <button onClick={() => setShowRecepcionModal(false)} className="text-gray-400 hover:text-red-500"><FaTimesCircle size={24}/></button>
                        </div>
                        <form onSubmit={handleConfirmRecepcion} className="space-y-6">
                            <div className="bg-gray-50 dark:bg-gray-900/40 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700 space-y-4">
                                {selectedOrden.items.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between gap-4 py-3 border-b border-black/5 last:border-0">
                                        <div><p className="font-black text-xs text-gray-700 dark:text-gray-300 uppercase">{item.producto}</p><p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Ordenado: {item.cantidad}</p></div>
                                        <div className="w-32"><input type="number" name={`qty-${item.productId}`} defaultValue={item.cantidad} required className="w-full input-style text-center font-black text-rose-600" /></div>
                                    </div>
                                ))}
                            </div>
                            <textarea name="notas" className="w-full input-style text-xs h-24 resize-none" placeholder="Observaciones de la entrega..." />
                            <button type="submit" className="w-full py-4 bg-rose-500 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-2xl">Confirmar Entrada y Sumar a Inventario</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Pago CxP */}
            {showPagoModal && selectedCxP && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-[3rem] shadow-2xl w-full max-w-md animate-in zoom-in duration-300">
                        <div className="flex justify-between items-start mb-6">
                            <h2 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tight flex items-center gap-3"><FaMoneyBillWave className="text-emerald-500" /> Aplicar Pago</h2>
                            <button onClick={() => setShowPagoModal(false)} className="text-gray-400 hover:text-red-500"><FaTimes size={20}/></button>
                        </div>
                        <form onSubmit={handleConfirmPago} className="space-y-5">
                            <div>
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block italic">Proveedor</label>
                                <p className="font-black text-sm uppercase dark:text-white">{selectedCxP.proveedor.razonSocial}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block italic">Importe a Pagar ($)</label>
                                    <input type="number" step="0.01" name="importe" defaultValue={selectedCxP.saldo} max={selectedCxP.saldo} required className="w-full input-style font-black text-emerald-600" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block italic">Referencia / Folio</label>
                                    <input name="referencia" className="w-full input-style text-xs font-bold" placeholder="Ej: Transf. 882" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block italic">Cuenta de Origen</label>
                                <select name="cuentaBancariaId" required className="w-full input-style text-[10px] font-black uppercase">
                                    <option value="">Selecciona Banco...</option>
                                    {bancos.map(b => <option key={b.id} value={b.id}>{b.banco} - {b.cuenta}</option>)}
                                </select>
                            </div>
                            <button type="submit" className="w-full py-4 bg-emerald-500 text-white font-black rounded-3xl uppercase tracking-widest text-[10px] shadow-2xl shadow-emerald-500/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all">
                                <FaCheckCircle /> Confirmar Pago y Generar Egreso
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Compras;
