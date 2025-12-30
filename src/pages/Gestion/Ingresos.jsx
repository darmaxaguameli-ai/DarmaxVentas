import { useState, useEffect } from "react";
import { useGestion } from "./context/GestionContext";
import Swal from 'sweetalert2'; // Importar SweetAlert2
import DatePicker from 'react-datepicker'; // Importar DatePicker
import 'react-datepicker/dist/react-datepicker.css'; // Importar estilos de DatePicker
import { registerLocale } from 'react-datepicker';
import es from 'date-fns/locale/es'; // Importar el locale español
import { format, parseISO } from 'date-fns'; // Importar format y parseISO de date-fns para manejo de fechas
import { formatDate } from '@/utils/formatters';

registerLocale('es', es); // Registrar el locale español

const IncomeModal = ({ isOpen, onClose, incomeToEdit, onSave }) => {
    const [income, setIncome] = useState({ description: '', amount: '', date: new Date(), pedidoId: '' }); // date es ahora un Date object

    useEffect(() => {
        if (incomeToEdit) {
            setIncome({ 
                ...incomeToEdit, 
                date: parseISO(incomeToEdit.date), // Convertir string ISO a Date object
                pedidoId: incomeToEdit.pedidoId || '' 
            });
        } else {
            setIncome({ description: '', amount: '', date: new Date(), pedidoId: '' }); // date es ahora un Date object
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
            date: format(income.date, 'yyyy-MM-dd') // Formatear Date object a string YYYY-MM-DD para el backend
        });
        onClose();
    };

    if (!isOpen) return null;

    const isEditing = !!incomeToEdit;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4 text-[#111418] dark:text-white">
                    {isEditing ? "Editar Ingreso" : "Agregar Nuevo Ingreso"}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descripción</label>
                        <input name="description" type="text" value={income.description} onChange={handleChange} required className="mt-1 block w-full input-style" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ID del Pedido (Opcional)</label>
                        <input name="pedidoId" type="text" value={income.pedidoId} onChange={handleChange} placeholder="Ej. ORD-0001" className="mt-1 block w-full input-style" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Monto</label>
                            <input name="amount" type="number" step="0.01" value={income.amount} onChange={handleChange} required className="mt-1 block w-full input-style" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha</label>
                            <DatePicker
                                selected={income.date}
                                onChange={(date) => setIncome(prev => ({ ...prev, date }))}
                                dateFormat="dd/MM/yyyy"
                                locale="es"
                                className="mt-1 block w-full input-style"
                                required
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
                        <button type="submit" className="btn-primary">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const Ingresos = () => {
    const { state, addIncome, updateIncome, deleteIncome } = useGestion();
    const { income } = state;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [incomeToEdit, setIncomeToEdit] = useState(null);

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
                Swal.fire('Éxito', 'Ingreso actualizado exitosamente.', 'success');
            } else {
                await addIncome(incomeData);
                Swal.fire('Éxito', 'Ingreso añadido exitosamente.', 'success');
            }
            handleCloseModal(); // Siempre cerrar después de guardar
        } catch (error) {
            console.error("Error al guardar el ingreso:", error);
            // El mensaje de error ya se maneja en el contexto
        }
    };
    
    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: '¡No podrás revertir esto!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await deleteIncome(id);
                Swal.fire('Eliminado!', 'El ingreso ha sido eliminado.', 'success');
            } catch (error) {
                console.error("Error al eliminar el ingreso:", error);
                // El mensaje de error ya se maneja en el contexto
            }
        }
    }




    return (
        <div>
            <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold text-[#111418] dark:text-white">Control de Ingresos</h1>
                <button onClick={() => handleOpenModal()} className="btn-primary">
                    Agregar Ingreso
                </button>
            </div>

            <IncomeModal 
              isOpen={isModalOpen}
              onClose={handleCloseModal}
              onSave={handleSaveIncome}
              incomeToEdit={incomeToEdit}
            />
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
                <table className="min-w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="th-style">Descripción</th>
                            <th className="th-style">Pedido Asociado</th>
                            <th className="th-style">Monto</th>
                            <th className="th-style">Fecha</th>
                            <th className="th-style text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {income.map((item) => (
                            <tr key={item.id}>
                                <td className="td-style font-medium">{item.description}</td>
                                <td className="td-style">{item.pedidoId || 'N/A'}</td>
                                <td className="td-style text-green-500 text-right">${item.amount.toFixed(2)}</td>
                                <td className="td-style">{formatDate(item.date, { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                                <td className="td-style text-right">
                                    <div className="flex flex-col sm:flex-row gap-2 justify-end">
                                        <button onClick={() => handleOpenModal(item)} className="text-primary hover:text-primary/90 font-medium">Editar</button>
                                        <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700 font-medium">Eliminar</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Ingresos;