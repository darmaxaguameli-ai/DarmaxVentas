import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useGestion } from "./context/GestionContext";
import Swal from 'sweetalert2';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { registerLocale } from 'react-datepicker';
import es from 'date-fns/locale/es';
import { format, parseISO } from 'date-fns';
import { formatDate } from '@/utils/formatters';
import { 
    FaPlus, FaEdit, FaTrash, FaTimes, FaSave, 
    FaCalendarAlt, FaDollarSign, FaFileInvoiceDollar, 
    FaSearch 
} from 'react-icons/fa';
import { toast } from 'sonner';

registerLocale('es', es);

const IncomeModal = ({ isOpen, onClose, incomeToEdit, onSave }) => {
    const [income, setIncome] = useState({ description: '', amount: '', date: new Date(), pedidoId: '' });

    useEffect(() => {
        if (incomeToEdit) {
            setIncome({ 
                ...incomeToEdit, 
                date: parseISO(incomeToEdit.date),
                pedidoId: incomeToEdit.pedidoId || '' 
            });
        } else {
            setIncome({ description: '', amount: '', date: new Date(), pedidoId: '' });
        }
    }, [incomeToEdit, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setIncome(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...income,
            amount: parseFloat(income.amount),
            pedidoId: income.pedidoId || null,
            date: format(income.date, 'yyyy-MM-dd')
        });
        onClose();
    };

    if (!isOpen) return null;

    const isEditing = !!incomeToEdit;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-2xl w-full max-w-md flex flex-col max-h-[90vh] animate-in zoom-in duration-300">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-2xl font-black text-dark dark:text-white uppercase tracking-tight flex items-center gap-3 leading-none">
                            <FaDollarSign className="text-emerald-500" /> {isEditing ? "Editar Ingreso" : "Nuevo Ingreso"}
                        </h2>
                        <p className="text-[10px] text-gray-400 font-bold uppercase mt-2 tracking-widest italic">Registro de entrada de capital</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors p-1">
                        <FaTimes size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto custom-scrollbar pr-2">
                    <div>
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block italic">Concepto / Descripción *</label>
                        <input name="description" type="text" value={income.description} onChange={handleChange} required className="w-full input-style font-bold text-sm" placeholder="Ej: Venta de Insumos" />
                    </div>

                    <div>
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block italic">Folio de Pedido (Opcional)</label>
                        <div className="relative">
                            <FaFileInvoiceDollar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                            <input name="pedidoId" type="text" value={income.pedidoId} onChange={handleChange} placeholder="Ej: ORD-0001" className="w-full pl-11 input-style text-xs font-black uppercase" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block italic">Monto *</label>
                            <div className="relative">
                                <FaDollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" />
                                <input name="amount" type="number" step="0.01" value={income.amount} onChange={handleChange} required className="w-full pl-9 input-style font-black text-emerald-600" placeholder="0.00" />
                            </div>
                        </div>
                        <div>
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block italic">Fecha de Cobro *</label>
                            <div className="relative">
                                <FaCalendarAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 z-10" />
                                <DatePicker
                                    selected={income.date}
                                    onChange={(date) => setIncome(prev => ({ ...prev, date }))}
                                    dateFormat="dd/MM/yyyy"
                                    locale="es"
                                    className="w-full pl-11 input-style text-[10px] font-black uppercase"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t dark:border-gray-700 mt-4">
                        <button type="button" onClick={onClose} className="flex-1 py-4 rounded-2xl font-black uppercase text-[10px] bg-white dark:bg-gray-800 text-gray-500 border border-gray-200 dark:border-gray-700 shadow-sm">Cancelar</button>
                        <button type="submit" className="flex-[2] py-4 rounded-2xl font-black uppercase text-[10px] bg-emerald-600 text-white shadow-2xl shadow-emerald-500/30 flex items-center justify-center gap-3">
                            <FaSave size={16} /> {isEditing ? 'Guardar Cambios' : 'Confirmar Ingreso'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};


const Ingresos = () => {
    const { state, addIncome, updateIncome, deleteIncome } = useGestion();
    const { income, loading } = state;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [incomeToEdit, setIncomeToEdit] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleOpenModal = (income = null) => {
        setIncomeToEdit(income);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIncomeToEdit(null);
        setIsModalOpen(false);
    };

    const handleSaveIncome = async (incomeData) => {
        try {
            if (incomeData.id) {
                await updateIncome(incomeData.id, incomeData);
                toast.success('Ingreso actualizado');
            } else {
                await addIncome(incomeData);
                toast.success('Ingreso registrado');
            }
            handleCloseModal();
        } catch (error) {
            console.error("Error al guardar el ingreso:", error);
        }
    };
    
    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: '¿Eliminar ingreso?',
            text: 'Esta acción no se puede revertir.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            reverseButtons: true
        });

        if (result.isConfirmed) {
            try {
                await deleteIncome(id);
                toast.success('Ingreso eliminado');
            } catch (error) {
                console.error("Error al eliminar el ingreso:", error);
            }
        }
    }

    const filteredIncome = useMemo(() => {
        return (income || []).filter(item => 
            item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.pedidoId && item.pedidoId.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [income, searchTerm]);

    return (
        <div className="animate-fade-in space-y-8 pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-black text-gray-800 dark:text-white flex items-center gap-4 tracking-tighter uppercase italic">
                        <div className="bg-emerald-500 p-3 rounded-2xl shadow-lg shadow-emerald-500/20 text-white">
                            <FaFileInvoiceDollar className="text-2xl" />
                        </div> 
                        INGRESOS
                    </h1>
                    <div className="text-[10px] text-gray-500 font-bold mt-2 flex items-center gap-2 uppercase tracking-widest">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div> 
                        Control de Flujo de Caja y Cobros manuales
                    </div>
                </div>
                <button onClick={() => handleOpenModal()} className="btn-primary flex items-center justify-center gap-3 py-4 px-8 rounded-3xl shadow-2xl shadow-emerald-500/30 font-black uppercase text-xs tracking-widest hover:scale-105 active:scale-95 transition-all w-full md:w-auto bg-emerald-600 hover:bg-emerald-700">
                    <FaPlus /> Registrar Ingreso
                </button>
            </div>

            {/* Quick Stats / Filter */}
            <div className="bg-white dark:bg-gray-800 p-2 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col md:flex-row items-center gap-4">
                <div className="flex-1 w-full relative">
                    <FaSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                        type="text"
                        placeholder="Buscar por descripción o folio..."
                        className="w-full pl-14 pr-6 py-4 bg-gray-50/50 dark:bg-gray-900/50 border-none rounded-[1.5rem] text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="px-6 py-4 hidden md:flex items-center gap-3 border-l dark:border-gray-700 text-emerald-600">
                    <div className="text-right">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Total Registros</p>
                        <p className="text-xl font-black leading-none mt-1">{(filteredIncome || []).length}</p>
                    </div>
                    <FaFileInvoiceDollar className="text-xl" />
                </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-[3rem] border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-900/50 border-b dark:border-gray-700">
                                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Concepto</th>
                                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Vinculación</th>
                                <th className="px-8 py-6 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Monto</th>
                                <th className="px-8 py-6 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Fecha</th>
                                <th className="px-8 py-6 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                            {loading ? (
                                <tr><td colSpan="5" className="p-20 text-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-emerald-500 mx-auto"></div></td></tr>
                            ) : filteredIncome.length === 0 ? (
                                 <tr><td colSpan="5" className="p-20 text-center text-gray-400 font-black uppercase text-[10px] italic tracking-widest opacity-50">No hay movimientos registrados</td></tr>
                            ) : (
                                filteredIncome.map((item) => (
                                    <tr key={item.id} className="group hover:bg-gray-50/50 dark:hover:bg-gray-900/20 transition-all">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                                                    <FaDollarSign />
                                                </div>
                                                <p className="font-black text-gray-800 dark:text-white uppercase tracking-tight text-xs">{item.description}</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            {item.pedidoId ? (
                                                <span className="text-[9px] font-black bg-blue-50 text-blue-600 px-3 py-1 rounded-lg uppercase tracking-widest border border-blue-100 dark:bg-blue-900/20 dark:border-blue-800">
                                                    {item.pedidoId}
                                                </span>
                                            ) : (
                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter italic">Entrada manual</span>
                                            )}
                                        </td>
                                        <td className="px-8 py-6 text-right font-black text-emerald-600 text-lg">
                                            ${(item.amount || 0).toFixed(2)}
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <p className="text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase">{formatDate(item.date, { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleOpenModal(item)} className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"><FaEdit size={14}/></button>
                                                <button onClick={() => handleDelete(item.id)} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"><FaTrash size={14}/></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            <IncomeModal 
              isOpen={isModalOpen}
              onClose={handleCloseModal}
              onSave={handleSaveIncome}
              incomeToEdit={incomeToEdit}
            />
        </div>
    );
}

export default Ingresos;
