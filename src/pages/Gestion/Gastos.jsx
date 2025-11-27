import { useState, useEffect } from "react";
import { useGestion } from "./context/GestionContext";

const ExpenseModal = ({ isOpen, onClose, expenseToEdit, onSave }) => {
    const [expense, setExpense] = useState({ description: '', amount: '', date: new Date().toISOString().slice(0, 10), category: '' });

    useEffect(() => {
        if (expenseToEdit) {
            setExpense(expenseToEdit);
        } else {
            setExpense({ description: '', amount: '', date: new Date().toISOString().slice(0, 10), category: '' });
        }
    }, [expenseToEdit, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setExpense(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...expense,
            amount: parseFloat(expense.amount),
        });
        onClose();
    };

    if (!isOpen) return null;

    const isEditing = !!expenseToEdit;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4 text-[#111418] dark:text-white">
                    {isEditing ? "Editar Gasto" : "Agregar Nuevo Gasto"}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descripción</label>
                        <input name="description" type="text" value={expense.description} onChange={handleChange} required className="mt-1 block w-full input-style" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Categoría</label>
                        <input name="category" type="text" value={expense.category} onChange={handleChange} placeholder="Ej. Insumos, Marketing" required className="mt-1 block w-full input-style" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Monto</label>
                            <input name="amount" type="number" step="0.01" value={expense.amount} onChange={handleChange} required className="mt-1 block w-full input-style" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha</label>
                            <input name="date" type="date" value={expense.date} onChange={handleChange} required className="mt-1 block w-full input-style" />
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

    const handleSaveExpense = (expense) => {
        if (expense.id) {
            updateExpense(expense);
        } else {
            addExpense(expense);
        }
    };
    
    const handleDelete = (id) => {
        if(window.confirm('¿Estás seguro de que quieres eliminar este gasto?')) {
            deleteExpense(id);
        }
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
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
                            <th className="th-style">Categoría</th>
                            <th className="th-style">Monto</th>
                            <th className="th-style">Fecha</th>
                            <th className="th-style text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {expenses.map((item) => (
                            <tr key={item.id}>
                                <td className="td-style font-medium">{item.description}</td>
                                <td className="td-style">{item.category}</td>
                                <td className="td-style text-red-500 text-right">${item.amount.toFixed(2)}</td>
                                <td className="td-style">{item.date}</td>
                                <td className="td-style text-right space-x-4">
                                    <button onClick={() => handleOpenModal(item)} className="text-primary hover:text-primary/90 font-medium">Editar</button>
                                    <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700 font-medium">Eliminar</button>
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