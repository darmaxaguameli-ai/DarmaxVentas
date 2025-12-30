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

const ExpenseModal = ({ isOpen, onClose, expenseToEdit, onSave }) => {
    const [selectedDate, setSelectedDate] = useState(new Date()); // Ahora es un objeto Date
    const [currentDescription, setCurrentDescription] = useState('');
    const [currentAmount, setCurrentAmount] = useState('');
    const [tempExpenses, setTempExpenses] = useState([]); // { description, amount }
    const [error, setError] = useState(null);

    // Si estamos editando un gasto, inicializar los campos del modal con ese gasto
    useEffect(() => {
        if (expenseToEdit) {
            setSelectedDate(parseISO(expenseToEdit.date)); // Convertir string ISO a objeto Date
            setTempExpenses([{ description: expenseToEdit.description, amount: expenseToEdit.amount, id: expenseToEdit.id }]);
            setCurrentDescription(expenseToEdit.description); // precargar para editar
            setCurrentAmount(expenseToEdit.amount); // precargar para editar
        } else {
            // Si no estamos editando, resetear todo excepto la fecha, que puede ser la actual
            setSelectedDate(new Date());
            setTempExpenses([]);
            setCurrentDescription('');
            setCurrentAmount('');
        }
        setError(null); // Limpiar errores al abrir/cambiar edición
    }, [expenseToEdit, isOpen]);

    const handleAddTempExpense = () => {
        if (!currentDescription.trim() || !currentAmount || isNaN(parseFloat(currentAmount))) {
            setError("Por favor, introduce una descripción y un monto válido.");
            return;
        }
        setError(null);

        // Si estamos editando y ya hay un gasto temporal, reemplazarlo
        if (expenseToEdit && tempExpenses.length > 0) {
            setTempExpenses([{ description: currentDescription, amount: parseFloat(currentAmount), id: expenseToEdit.id }]);
        } else {
            setTempExpenses(prev => [...prev, { description: currentDescription.trim(), amount: parseFloat(currentAmount) }]);
        }
        
        setCurrentDescription('');
        setCurrentAmount('');
    };

    const handleRemoveTempExpense = (index) => {
        setTempExpenses(prev => prev.filter((_, i) => i !== index));
    };

    const handleSaveAllExpenses = async () => {
        if (!selectedDate) {
            setError("Por favor, selecciona una fecha para los gastos.");
            return;
        }
        if (tempExpenses.length === 0) {
            setError("Por favor, añade al menos un gasto antes de guardar.");
            return;
        }
        setError(null);

        // Convertir la fecha seleccionada del DatePicker a string YYYY-MM-DD
        const formattedDateString = format(selectedDate, 'yyyy-MM-dd');

        if (expenseToEdit) {
            // Si estamos editando, solo hay un gasto en tempExpenses
            const updatedExpense = {
                id: tempExpenses[0].id,
                description: tempExpenses[0].description,
                amount: tempExpenses[0].amount,
                date: formattedDateString, // Usar la fecha formateada
            };
            await onSave(updatedExpense, true); // Guardar el único gasto editado y cerrar
        } else {
            // Si estamos añadiendo nuevos gastos
            // Llamar a onSave para cada gasto temporal
            for (const tempExp of tempExpenses) {
                await onSave({
                    description: tempExp.description,
                    amount: tempExp.amount,
                    date: formattedDateString, // Usar la fecha formateada
                }, false); // No cerrar inmediatamente, cerrar al final
            }
            onClose(); // Cerrar el modal después de guardar todos los nuevos gastos
        }
    };

    if (!isOpen) return null;

    const isEditing = !!expenseToEdit;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg">
                <h2 className="text-2xl font-bold mb-4 text-[#111418] dark:text-white">
                    {isEditing ? "Editar Gasto" : "Agregar Nuevos Gastos"}
                </h2>
                
                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha</label>
                    <DatePicker
                        selected={selectedDate}
                        onChange={(date) => setSelectedDate(date)}
                        dateFormat="dd/MM/yyyy"
                        locale="es"
                        className="mt-1 block w-full input-style"
                        disabled={isEditing}
                        required
                    />
                </div>

                {!isEditing && ( // Solo mostrar la sección de añadir múltiples si no estamos editando
                    <>
                        <hr className="my-4 dark:border-gray-700" />
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descripción</label>
                                <input 
                                    type="text" 
                                    value={currentDescription} 
                                    onChange={(e) => setCurrentDescription(e.target.value)} 
                                    className="mt-1 block w-full input-style"
                                    placeholder="Ej: Gasolina, Suministros"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Monto</label>
                                <input 
                                    type="number" 
                                    step="0.01" 
                                    value={currentAmount} 
                                    onChange={(e) => setCurrentAmount(e.target.value)} 
                                    className="mt-1 block w-full input-style"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end mb-4">
                            <button 
                                type="button" 
                                onClick={handleAddTempExpense} 
                                className="btn-secondary"
                            >
                                Añadir Gasto a la Lista
                            </button>
                        </div>

                        {tempExpenses.length > 0 && (
                            <div className="mb-4 max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {tempExpenses.map((exp, index) => (
                                        <li key={index} className="flex justify-between items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <span>{exp.description} - ${exp.amount.toFixed(2)}</span>
                                            <button 
                                                type="button" 
                                                onClick={() => handleRemoveTempExpense(index)} 
                                                className="text-red-500 hover:text-red-700 text-sm"
                                            >
                                                Eliminar
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </>
                )}
                 {isEditing && tempExpenses.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descripción</label>
                            <input name="description" type="text" value={currentDescription} onChange={(e) => setCurrentDescription(e.target.value)} required className="mt-1 block w-full input-style" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Monto</label>
                            <input name="amount" type="number" step="0.01" value={currentAmount} onChange={(e) => setCurrentAmount(e.target.value)} required className="mt-1 block w-full input-style" />
                        </div>
                    </div>
                )}


                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
                    <button type="button" onClick={handleSaveAllExpenses} className="btn-primary">
                        {isEditing ? "Guardar Cambios" : "Guardar Gastos"}
                    </button>
                </div>
            </div>
        </div>
    );
};


const Gastos = () => {
    const { state, addExpense, updateExpense, deleteExpense } = useGestion();
    const { expenses } = state;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [expenseToEdit, setExpenseToEdit] = useState(null);

    const handleOpenModal = (expense = null) => {
        setExpenseToEdit(expense);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setExpenseToEdit(null);
        setIsModalOpen(false);
    };

    // onSave ahora espera un solo objeto de gasto y un indicador para cerrar el modal
    const handleSaveExpense = async (expenseData, closeAfterSave) => {
        try {
            if (expenseData.id) {
                // Si el gasto tiene un ID, se está editando
                await updateExpense(expenseData.id, expenseData);
                Swal.fire('Éxito', 'Gasto actualizado exitosamente.', 'success'); // Mensaje de éxito
            } else {
                // Si no tiene ID, es un nuevo gasto
                await addExpense(expenseData);
                Swal.fire('Éxito', 'Gasto añadido exitosamente.', 'success'); // Mensaje de éxito
            }
            if (closeAfterSave) {
                handleCloseModal();
            }
        } catch (error) {
            console.error("Error al guardar el gasto:", error); // Mantener console.error para depuración
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
                await deleteExpense(id);
                Swal.fire('Eliminado!', 'El gasto ha sido eliminado.', 'success'); // Mensaje de éxito
            } catch (error) {
                console.error("Error al eliminar el gasto:", error); // Mantener console.error para depuración
                // El mensaje de error ya se maneja en el contexto
            }
        }
    }




    return (
        <div>
            <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold text-[#111418] dark:text-white">Control de Gastos</h1>
                <button onClick={() => handleOpenModal()} className="btn-primary">
                    Agregar Gasto
                </button>
            </div>

            <ExpenseModal 
              isOpen={isModalOpen}
              onClose={handleCloseModal}
              onSave={handleSaveExpense}
              expenseToEdit={expenseToEdit}
            />
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
                <table className="min-w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="th-style">Descripción</th>
                            <th className="th-style">Monto</th>
                            <th className="th-style">Fecha</th>
                            <th className="th-style text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {expenses.map((item) => (
                            <tr key={item.id}>
                                <td className="td-style font-medium">{item.description}</td>
                                <td className="td-style text-red-500 text-right">${item.amount.toFixed(2)}</td>
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

export default Gastos;