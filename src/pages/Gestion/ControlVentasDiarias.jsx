import { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { useGestion } from './context/GestionContext';

const getDayName = (dateString) => {
    const date = new Date(dateString + 'T12:00:00'); // Add T12:00:00 to avoid timezone issues
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('es-MX', { weekday: 'long' });
};

// Componente para el modal de edición de registros de ventas diarias
const DailySalesRecordEditModal = ({ isOpen, onClose, recordToEdit, onSave }) => {
    const [formData, setFormData] = useState({});

    useEffect(() => {
        if (recordToEdit) {
            // Inicializar el formulario con los datos del registro a editar
            // Asegurarse de que la fecha esté en formato 'YYYY-MM-DD'
            setFormData({
                ...recordToEdit,
                date: recordToEdit.date.slice(0, 10), 
            });
        }
    }, [recordToEdit]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        // Convertir a número si el campo es numérico, de lo contrario, mantener como string
        const isNumeric = [
            'mostradorColor', 'mostradorBon', 'mostradorEpura', 'mostradorCiel', 'mostradorElectro', 'mostrador10Lts', 'mostradorVtaG', 'mostradorTotal',
            'pedidosColor', 'pedidosBon', 'pedidosEpura', 'pedidosCiel', 'pedidosElectro', 'pedidos10Lts', 'pedidosVtaG', 'pedidosTotal',
            'negociosColor', 'negociosBon', 'negociosEpura', 'negociosCiel', 'negociosElectro', 'negocios10Lts', 'negociosVtaG', 'negociosTotal',
            'totalTipoGarrafonColor', 'totalTipoGarrafonBon', 'totalTipoGarrafonEpura', 'totalTipoGarrafonCiel', 'totalTipoGarrafonElectro', 'totalTipoGarrafon10Lts', 'totalTipoGarrafonVtaG',
            'totalGarrafones', 'totalImporte'
        ].includes(name);

        setFormData(prev => ({
            ...prev,
            [name]: isNumeric ? parseFloat(value) || 0 : value, // Usar parseFloat para montos y 0 como default
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData); // Llama a la función onSave del componente padre con los datos actualizados
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-4 text-[#111418] dark:text-white">Editar Registro de Ventas Diarias</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha</label>
                        <input 
                            type="date" 
                            name="date" 
                            value={formData.date || ''} 
                            onChange={handleChange} 
                            required 
                            className="input-style" 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Día de la Semana</label>
                        <input 
                            type="text" 
                            name="dayOfWeek" 
                            value={formData.dayOfWeek || ''} 
                            readOnly 
                            className="input-style bg-gray-100 dark:bg-gray-700" 
                        />
                    </div>

                    {/* MOSTRADOR */}
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mt-6">MOSTRADOR</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                        <div><label className="label-style">Color</label><input type="number" name="mostradorColor" value={formData.mostradorColor || ''} onChange={handleChange} className="input-style" /></div>
                        <div><label className="label-style">Bonafon</label><input type="number" name="mostradorBon" value={formData.mostradorBon || ''} onChange={handleChange} className="input-style" /></div>
                        <div><label className="label-style">Epura</label><input type="number" name="mostradorEpura" value={formData.mostradorEpura || ''} onChange={handleChange} className="input-style" /></div>
                        <div><label className="label-style">Ciel</label><input type="number" name="mostradorCiel" value={formData.mostradorCiel || ''} onChange={handleChange} className="input-style" /></div>
                        <div><label className="label-style">Electro</label><input type="number" name="mostradorElectro" value={formData.mostradorElectro || ''} onChange={handleChange} className="input-style" /></div>
                        <div><label className="label-style">10Lts</label><input type="number" name="mostrador10Lts" value={formData.mostrador10Lts || ''} onChange={handleChange} className="input-style" /></div>
                        <div><label className="label-style">Vta. G.</label><input type="number" name="mostradorVtaG" value={formData.mostradorVtaG || ''} onChange={handleChange} className="input-style" /></div>
                        <div><label className="label-style">Total ($)</label><input type="number" name="mostradorTotal" step="0.01" value={formData.mostradorTotal || ''} onChange={handleChange} className="input-style" /></div>
                    </div>

                    {/* PEDIDOS */}
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mt-6">PEDIDOS</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                        <div><label className="label-style">Color</label><input type="number" name="pedidosColor" value={formData.pedidosColor || ''} onChange={handleChange} className="input-style" /></div>
                        <div><label className="label-style">Bonafon</label><input type="number" name="pedidosBon" value={formData.pedidosBon || ''} onChange={handleChange} className="input-style" /></div>
                        <div><label className="label-style">Epura</label><input type="number" name="pedidosEpura" value={formData.pedidosEpura || ''} onChange={handleChange} className="input-style" /></div>
                        <div><label className="label-style">Ciel</label><input type="number" name="pedidosCiel" value={formData.pedidosCiel || ''} onChange={handleChange} className="input-style" /></div>
                        <div><label className="label-style">Electro</label><input type="number" name="pedidosElectro" value={formData.pedidosElectro || ''} onChange={handleChange} className="input-style" /></div>
                        <div><label className="label-style">10Lts</label><input type="number" name="pedidos10Lts" value={formData.pedidos10Lts || ''} onChange={handleChange} className="input-style" /></div>
                        <div><label className="label-style">Vta. G.</label><input type="number" name="pedidosVtaG" value={formData.pedidosVtaG || ''} onChange={handleChange} className="input-style" /></div>
                        <div><label className="label-style">Total ($)</label><input type="number" name="pedidosTotal" step="0.01" value={formData.pedidosTotal || ''} onChange={handleChange} className="input-style" /></div>
                    </div>

                    {/* NEGOCIOS */}
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mt-6">NEGOCIOS</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                        <div><label className="label-style">Color</label><input type="number" name="negociosColor" value={formData.negociosColor || ''} onChange={handleChange} className="input-style" /></div>
                        <div><label className="label-style">Bonafon</label><input type="number" name="negociosBon" value={formData.negociosBon || ''} onChange={handleChange} className="input-style" /></div>
                        <div><label className="label-style">Epura</label><input type="number" name="negociosEpura" value={formData.negociosEpura || ''} onChange={handleChange} className="input-style" /></div>
                        <div><label className="label-style">Ciel</label><input type="number" name="negociosCiel" value={formData.negociosCiel || ''} onChange={handleChange} className="input-style" /></div>
                        <div><label className="label-style">Electro</label><input type="number" name="negociosElectro" value={formData.negociosElectro || ''} onChange={handleChange} className="input-style" /></div>
                        <div><label className="label-style">10Lts</label><input type="number" name="negocios10Lts" value={formData.negocios10Lts || ''} onChange={handleChange} className="input-style" /></div>
                        <div><label className="label-style">Vta. G.</label><input type="number" name="negociosVtaG" value={formData.negociosVtaG || ''} onChange={handleChange} className="input-style" /></div>
                        <div><label className="label-style">Total ($)</label><input type="number" name="negociosTotal" step="0.01" value={formData.negociosTotal || ''} onChange={handleChange} className="input-style" /></div>
                    </div>

                    {/* TOTAL POR TIPO DE GARRAFÓN */}
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mt-6">TOTAL POR TIPO DE GARRAFÓN</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                        <div><label className="label-style">Color</label><input type="number" name="totalTipoGarrafonColor" value={formData.totalTipoGarrafonColor || ''} readOnly className="input-style bg-gray-100 dark:bg-gray-700" /></div>
                        <div><label className="label-style">Bonafon</label><input type="number" name="totalTipoGarrafonBon" value={formData.totalTipoGarrafonBon || ''} readOnly className="input-style bg-gray-100 dark:bg-gray-700" /></div>
                        <div><label className="label-style">Epura</label><input type="number" name="totalTipoGarrafonEpura" value={formData.totalTipoGarrafonEpura || ''} readOnly className="input-style bg-gray-100 dark:bg-gray-700" /></div>
                        <div><label className="label-style">Ciel</label><input type="number" name="totalTipoGarrafonCiel" value={formData.totalTipoGarrafonCiel || ''} readOnly className="input-style bg-gray-100 dark:bg-gray-700" /></div>
                        <div><label className="label-style">Electro</label><input type="number" name="totalTipoGarrafonElectro" value={formData.totalTipoGarrafonElectro || ''} readOnly className="input-style bg-gray-100 dark:bg-gray-700" /></div>
                        <div><label className="label-style">10Lts</label><input type="number" name="totalTipoGarrafon10Lts" value={formData.totalTipoGarrafon10Lts || ''} readOnly className="input-style bg-gray-100 dark:bg-gray-700" /></div>
                        <div><label className="label-style">Vta. G.</label><input type="number" name="totalTipoGarrafonVtaG" value={formData.totalTipoGarrafonVtaG || ''} readOnly className="input-style bg-gray-100 dark:bg-gray-700" /></div>
                    </div>

                    {/* TOTALES FINALES */}
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mt-6">TOTALES GENERALES</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><label className="label-style">Total Garrafones</label><input type="number" name="totalGarrafones" value={formData.totalGarrafones || ''} readOnly className="input-style bg-gray-100 dark:bg-gray-700" /></div>
                        <div><label className="label-style">Total Importe ($)</label><input type="number" name="totalImporte" step="0.01" value={formData.totalImporte || ''} readOnly className="input-style bg-gray-100 dark:bg-gray-700" /></div>
                    </div>

                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
                        <button type="submit" className="btn-primary">Guardar Cambios</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const ControlVentasDiarias = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewData, setPreviewData] = useState([]); // This will now store DailySalesRecord objects
    const [error, setError] = useState(null);
    const { addDailySalesRecord, addDailySalesRecordsBulk, updateDailySalesRecord, deleteDailySalesRecord, state, fetchManagementData } = useGestion();
    const [activeTab, setActiveTab] = useState('import'); // 'import' or 'manual'
    const [openMonth, setOpenMonth] = useState(null); // State for the accordion
    const [importYear, setImportYear] = useState(new Date().getFullYear()); // New state for import year
    
    // Estados para la edición
    const [dailySalesRecordToEdit, setDailySalesRecordToEdit] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Filter and sort for display
    const dailySalesRecords = useMemo(() => {
        return state.dailySalesRecords
            .sort((a, b) => new Date(b.date) - new Date(a.date)); // Ordenar por fecha descendente
    }, [state.dailySalesRecords]);

    const initialManualFormState = {
        date: new Date().toISOString().slice(0, 10),
        dayOfWeek: getDayName(new Date().toISOString().slice(0, 10)),

        // MOSTRADOR
        mostradorColor: '', mostradorBon: '', mostradorEpura: '', mostradorCiel: '', mostradorElectro: '', mostrador10Lts: '', mostradorVtaG: '', mostradorTotal: '',

        // PEDIDOS
        pedidosColor: '', pedidosBon: '', pedidosEpura: '', pedidosCiel: '', pedidosElectro: '', pedidos10Lts: '', pedidosVtaG: '', pedidosTotal: '',

        // NEGOCIOS
        negociosColor: '', negociosBon: '', negociosEpura: '', negociosCiel: '', negociosElectro: '', negocios10Lts: '', negociosVtaG: '', negociosTotal: '',

        // TOTAL TIPO GARRAFON
        totalTipoGarrafonColor: 0, totalTipoGarrafonBon: 0, totalTipoGarrafonEpura: 0, totalTipoGarrafonCiel: 0, totalTipoGarrafonElectro: 0, totalTipoGarrafon10Lts: 0, totalTipoGarrafonVtaG: 0,
        
        totalGarrafones: 0, // From Col AH
        totalImporte: 0,    // From Col AI
    };
    const [manualForm, setManualForm] = useState(initialManualFormState);

    // Funciones para el modal de edición
    const handleOpenEditModal = (record) => {
        setDailySalesRecordToEdit(record);
        setIsEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setDailySalesRecordToEdit(null);
        setIsEditModalOpen(false);
    };

    const handleUpdateRecord = async (updatedRecord) => {
        try {
            await updateDailySalesRecord(updatedRecord.id, updatedRecord);
            // El mensaje de éxito ya se maneja en el contexto
            handleCloseEditModal();
        } catch (err) {
            // El mensaje de error ya se maneja en el contexto
            console.error("Error al actualizar el registro:", err);
        }
    };

    const handleDeleteRecord = async (recordId) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: '¡No podrás revertir esto! También se eliminará el ingreso asociado.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await deleteDailySalesRecord(recordId);
                // El mensaje de éxito ya se maneja en el contexto
            } catch (err) {
                // El mensaje de error ya se maneja en el contexto
                console.error("Error al eliminar el registro:", err);
            }
        }
    };

    // Effect for automatic calculations
    useEffect(() => {
        const {
            mostradorColor, mostradorBon, mostradorEpura, mostradorCiel, mostradorElectro, mostrador10Lts, mostradorVtaG, mostradorTotal,
            pedidosColor, pedidosBon, pedidosEpura, pedidosCiel, pedidosElectro, pedidos10Lts, pedidosVtaG, pedidosTotal,
            negociosColor, negociosBon, negociosEpura, negociosCiel, negociosElectro, negocios10Lts, negociosVtaG, negociosTotal,
        } = manualForm;

        // Helper to safely parse numbers, treating empty strings as 0
        const parseNum = (val) => (val === '' || val === null || isNaN(val)) ? 0 : parseFloat(val);

        const newTotalTipoGarrafonColor = parseNum(mostradorColor) + parseNum(pedidosColor) + parseNum(negociosColor);
        const newTotalTipoGarrafonBon = parseNum(mostradorBon) + parseNum(pedidosBon) + parseNum(negociosBon);
        const newTotalTipoGarrafonEpura = parseNum(mostradorEpura) + parseNum(pedidosEpura) + parseNum(negociosEpura);
        const newTotalTipoGarrafonCiel = parseNum(mostradorCiel) + parseNum(pedidosCiel) + parseNum(negociosCiel);
        const newTotalTipoGarrafonElectro = parseNum(mostradorElectro) + parseNum(pedidosElectro) + parseNum(negociosElectro);
        const newTotalTipoGarrafon10Lts = parseNum(mostrador10Lts) + parseNum(pedidos10Lts) + parseNum(negocios10Lts);
        const newTotalTipoGarrafonVtaG = parseNum(mostradorVtaG) + parseNum(pedidosVtaG) + parseNum(negociosVtaG);
        
        const newTotalGarrafones = newTotalTipoGarrafonColor + newTotalTipoGarrafonBon + newTotalTipoGarrafonEpura +
                                   newTotalTipoGarrafonCiel + newTotalTipoGarrafonElectro + newTotalTipoGarrafon10Lts +
                                   newTotalTipoGarrafonVtaG;

        const newTotalImporte = parseNum(mostradorTotal) + parseNum(pedidosTotal) + parseNum(negociosTotal);

        // Update state only if values have genuinely changed to prevent infinite re-renders
        if (
            newTotalTipoGarrafonColor !== manualForm.totalTipoGarrafonColor ||
            newTotalTipoGarrafonBon !== manualForm.totalTipoGarrafonBon ||
            newTotalTipoGarrafonEpura !== manualForm.totalTipoGarrafonEpura ||
            newTotalTipoGarrafonCiel !== manualForm.totalTipoGarrafonCiel ||
            newTotalTipoGarrafonElectro !== manualForm.totalTipoGarrafonElectro ||
            newTotalTipoGarrafon10Lts !== manualForm.totalTipoGarrafon10Lts ||
            newTotalTipoGarrafonVtaG !== manualForm.totalTipoGarrafonVtaG ||
            newTotalGarrafones !== manualForm.totalGarrafones ||
            newTotalImporte !== manualForm.totalImporte
        ) {
            setManualForm(prev => ({
                ...prev,
                totalTipoGarrafonColor: newTotalTipoGarrafonColor,
                totalTipoGarrafonBon: newTotalTipoGarrafonBon,
                totalTipoGarrafonEpura: newTotalTipoGarrafonEpura,
                totalTipoGarrafonCiel: newTotalTipoGarrafonCiel,
                totalTipoGarrafonElectro: newTotalTipoGarrafonElectro,
                totalTipoGarrafon10Lts: newTotalTipoGarrafon10Lts,
                totalTipoGarrafonVtaG: newTotalTipoGarrafonVtaG,
                totalGarrafones: newTotalGarrafones,
                totalImporte: newTotalImporte
            }));
        }
    }, [
        manualForm.mostradorColor, manualForm.mostradorBon, manualForm.mostradorEpura, manualForm.mostradorCiel, manualForm.mostradorElectro, manualForm.mostrador10Lts, manualForm.mostradorVtaG, manualForm.mostradorTotal,
        manualForm.pedidosColor, manualForm.pedidosBon, manualForm.pedidosEpura, manualForm.pedidosCiel, manualForm.pedidosElectro, manualForm.pedidos10Lts, manualForm.pedidosVtaG, manualForm.pedidosTotal,
        manualForm.negociosColor, manualForm.negociosBon, manualForm.negociosEpura, manualForm.negociosCiel, manualForm.negociosElectro, manualForm.negocios10Lts, manualForm.negociosVtaG, manualForm.negociosTotal,
        // The calculated totals are also included here to ensure the effect re-runs if any of them are manually changed (e.g. from an initial state reset),
        // but the 'if' condition inside the effect prevents actual infinite loops from calculations.
        manualForm.totalTipoGarrafonColor, manualForm.totalTipoGarrafonBon, manualForm.totalTipoGarrafonEpura, manualForm.totalTipoGarrafonCiel, manualForm.totalTipoGarrafonElectro, manualForm.totalTipoGarrafon10Lts, manualForm.totalTipoGarrafonVtaG,
        manualForm.totalGarrafones, manualForm.totalImporte
    ]);


    const handleManualChange = (e) => {
        const { name, value } = e.target;
        // Keep empty string for empty input, otherwise parse as float for numeric fields
        const isNumericField = !['date', 'dayOfWeek'].includes(name);
        const parsedValue = isNumericField && value.trim() !== '' ? parseFloat(value) : value;
        
        if (name === 'date') {
            setManualForm(prev => ({ 
                ...prev, 
                date: value,
                dayOfWeek: getDayName(value)
            }));
        } else {
            setManualForm(prev => ({ ...prev, [name]: parsedValue }));
        }
    };

    const handleManualSubmit = async (e) => {
        e.preventDefault();

        // Use the calculated totalGarrafones and totalImporte for validation
        if (manualForm.totalGarrafones === 0 && manualForm.totalImporte === 0) {
            Swal.fire('Atención', 'Debes introducir al menos un monto o total de garrafones.', 'warning');
            return;
        }

        const newDailySalesRecord = {
            date: manualForm.date,
            dayOfWeek: manualForm.dayOfWeek,
            
            // --- CORRECT PARSING: parseInt for counts, parseFloat for totals ---
            mostradorColor: parseInt(manualForm.mostradorColor, 10) || 0,
            mostradorBon: parseInt(manualForm.mostradorBon, 10) || 0,
            mostradorEpura: parseInt(manualForm.mostradorEpura, 10) || 0,
            mostradorCiel: parseInt(manualForm.mostradorCiel, 10) || 0,
            mostradorElectro: parseInt(manualForm.mostradorElectro, 10) || 0,
            mostrador10Lts: parseInt(manualForm.mostrador10Lts, 10) || 0,
            mostradorVtaG: parseInt(manualForm.mostradorVtaG, 10) || 0,
            mostradorTotal: parseFloat(manualForm.mostradorTotal) || 0,

            pedidosColor: parseInt(manualForm.pedidosColor, 10) || 0,
            pedidosBon: parseInt(manualForm.pedidosBon, 10) || 0,
            pedidosEpura: parseInt(manualForm.pedidosEpura, 10) || 0,
            pedidosCiel: parseInt(manualForm.pedidosCiel, 10) || 0,
            pedidosElectro: parseInt(manualForm.pedidosElectro, 10) || 0,
            pedidos10Lts: parseInt(manualForm.pedidos10Lts, 10) || 0,
            pedidosVtaG: parseInt(manualForm.pedidosVtaG, 10) || 0,
            pedidosTotal: parseFloat(manualForm.pedidosTotal) || 0,

            negociosColor: parseInt(manualForm.negociosColor, 10) || 0,
            negociosBon: parseInt(manualForm.negociosBon, 10) || 0,
            negociosEpura: parseInt(manualForm.negociosEpura, 10) || 0,
            negociosCiel: parseInt(manualForm.negociosCiel, 10) || 0,
            negociosElectro: parseInt(manualForm.negociosElectro, 10) || 0,
            negocios10Lts: parseInt(manualForm.negocios10Lts, 10) || 0,
            negociosVtaG: parseInt(manualForm.negociosVtaG, 10) || 0,
            negociosTotal: parseFloat(manualForm.negociosTotal) || 0,

            totalTipoGarrafonColor: parseInt(manualForm.totalTipoGarrafonColor, 10) || 0,
            totalTipoGarrafonBon: parseInt(manualForm.totalTipoGarrafonBon, 10) || 0,
            totalTipoGarrafonEpura: parseInt(manualForm.totalTipoGarrafonEpura, 10) || 0,
            totalTipoGarrafonCiel: parseInt(manualForm.totalTipoGarrafonCiel, 10) || 0,
            totalTipoGarrafonElectro: parseInt(manualForm.totalTipoGarrafonElectro, 10) || 0,
            totalTipoGarrafon10Lts: parseInt(manualForm.totalTipoGarrafon10Lts, 10) || 0,
            totalTipoGarrafonVtaG: parseInt(manualForm.totalTipoGarrafonVtaG, 10) || 0,
            
            totalGarrafones: parseInt(manualForm.totalGarrafones, 10) || 0,
            totalImporte: parseFloat(manualForm.totalImporte) || 0,
        };

        try {
            await addDailySalesRecord(newDailySalesRecord);
            // Mensaje de éxito ya se maneja en el contexto
            setManualForm(initialManualFormState); // Reset form
        } catch (error) {
            // Mensaje de error ya se maneja en el contexto
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setError(null);
        }
    };

    const handleProcessFile = async () => {
        if (!selectedFile) {
            Swal.fire('Atención', 'Por favor, selecciona un archivo de Excel primero.', 'warning');
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => { // Async porque Swal.fire es async
            try {
                const data = e.target.result;
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames.includes('Hoja1') ? 'Hoja1' : workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                const processedDailyRecords = [];
                json.forEach((row, index) => {
                    // Ignorar encabezados y filas de totales
                    if (index < 3 || !row[0] || String(row[0]).toLowerCase().includes('total')) {
                        return;
                    }

                    const dateValue = row[0];
                    
                    // --- CORRECT PARSING: parseInt for counts, parseFloat for totals ---

                    // MOSTRADOR
                    const mostradorColor = parseInt(row[2], 10) || 0;
                    const mostradorBon = parseInt(row[3], 10) || 0;
                    const mostradorEpura = parseInt(row[4], 10) || 0;
                    const mostradorCiel = parseInt(row[5], 10) || 0;
                    const mostradorElectro = parseInt(row[6], 10) || 0;
                    const mostrador10Lts = parseInt(row[7], 10) || 0;
                    const mostradorVtaG = parseInt(row[8], 10) || 0;
                    const mostradorTotal = parseFloat(row[9]) || 0;

                    // PEDIDOS
                    const pedidosColor = parseInt(row[10], 10) || 0;
                    const pedidosBon = parseInt(row[11], 10) || 0;
                    const pedidosEpura = parseInt(row[12], 10) || 0;
                    const pedidosCiel = parseInt(row[13], 10) || 0;
                    const pedidosElectro = parseInt(row[14], 10) || 0;
                    const pedidos10Lts = parseInt(row[15], 10) || 0;
                    const pedidosVtaG = parseInt(row[16], 10) || 0;
                    const pedidosTotal = parseFloat(row[17]) || 0;

                    // NEGOCIOS
                    const negociosColor = parseInt(row[18], 10) || 0;
                    const negociosBon = parseInt(row[19], 10) || 0;
                    const negociosEpura = parseInt(row[20], 10) || 0;
                    const negociosCiel = parseInt(row[21], 10) || 0;
                    const negociosElectro = parseInt(row[22], 10) || 0;
                    const negocios10Lts = parseInt(row[23], 10) || 0;
                    const negociosVtaG = parseInt(row[24], 10) || 0;
                    const negociosTotal = parseFloat(row[25]) || 0;

                    // TOTAL TIPO GARRAFON
                    const totalTipoGarrafonColor = parseInt(row[26], 10) || 0;
                    const totalTipoGarrafonBon = parseInt(row[27], 10) || 0;
                    const totalTipoGarrafonEpura = parseInt(row[28], 10) || 0;
                    const totalTipoGarrafonCiel = parseInt(row[29], 10) || 0;
                    const totalTipoGarrafonElectro = parseInt(row[30], 10) || 0;
                    const totalTipoGarrafon10Lts = parseInt(row[31], 10) || 0;
                    const totalTipoGarrafonVtaG = parseInt(row[32], 10) || 0;

                    const totalGarrafones = parseInt(row[33], 10) || 0; // Columna AH
                    const totalImporte = parseFloat(row[34]) || 0;    // Columna AI

                    // Validate that the row has relevant numeric data
                    if (isNaN(dateValue) && typeof dateValue !== 'string') return;
                    if (totalImporte === 0 && totalGarrafones === 0) return;
                    
                    // Convertir fecha de Excel
                    let date;
                    if (typeof dateValue === 'number') {
                        // Correctly convert Excel serial number to JS Date.
                        date = new Date((dateValue - 25569) * 86400 * 1000); 
                    } else if (typeof dateValue === 'string') {
                        // For string dates like "28-Nov" or "15/03", we attempt to parse and explicitly set the year.
                        let potentialDate = new Date(`${dateValue} ${importYear}T12:00:00`);
                        
                        if (isNaN(potentialDate.getTime())) {
                            const parts = dateValue.match(/(\d{1,2})[\/\-](\d{1,2})/);
                            if (parts) {
                                potentialDate = new Date(importYear, parseInt(parts[2], 10) - 1, parseInt(parts[1], 10), 12, 0, 0);
                            }
                        }
                        
                        if (potentialDate && !isNaN(potentialDate.getTime())) {
                            date = potentialDate;
                        }
                    }
                    
                    if (!date || isNaN(date.getTime())) {
                        console.warn(`Fecha inválida en la fila ${index + 1} (${dateValue}). Se omitirá este registro.`);
                        return;
                    }
                    
                    const formattedDate = date.toISOString().slice(0, 10);
                    const dayOfWeek = getDayName(formattedDate); // Get full day name

                    processedDailyRecords.push({
                        date: formattedDate,
                        dayOfWeek: dayOfWeek,
                        mostradorColor, mostradorBon, mostradorEpura, mostradorCiel, mostradorElectro, mostrador10Lts, mostradorVtaG, mostradorTotal,
                        pedidosColor, pedidosBon, pedidosEpura, pedidosCiel, pedidosElectro, pedidos10Lts, pedidosVtaG, pedidosTotal,
                        negociosColor, negociosBon, negociosEpura, negociosCiel, negociosElectro, negocios10Lts, negociosVtaG, negociosTotal,
                        totalTipoGarrafonColor, totalTipoGarrafonBon, totalTipoGarrafonEpura, totalTipoGarrafonCiel, totalTipoGarrafonElectro, totalTipoGarrafon10Lts, totalTipoGarrafonVtaG,
                        totalGarrafones,
                        totalImporte,
                    });
                });

                // --- VALIDACIÓN DE DUPLICADOS ---
                const dateCounts = new Map();
                processedDailyRecords.forEach(record => {
                    dateCounts.set(record.date, (dateCounts.get(record.date) || 0) + 1);
                });

                const duplicates = Array.from(dateCounts.entries())
                                      .filter(([date, count]) => count > 1)
                                      .map(([date]) => date);

                if (duplicates.length > 0) {
                    Swal.fire('Error', `El archivo de Excel contiene fechas duplicadas. Por favor, corrige las siguientes fechas y vuelve a intentarlo: ${duplicates.join(', ')}`, 'error');
                    setPreviewData([]); // Limpiar previsualización
                    return; // Detener el proceso
                }
                // --- FIN DE VALIDACIÓN ---

                if(processedDailyRecords.length === 0) {
                    Swal.fire('Atención', "No se encontraron datos de ventas diarias válidos en el archivo. Verifica el formato.", 'warning');
                    setPreviewData([]);
                } else {
                    setPreviewData(processedDailyRecords);
                    setError(null);
                }

            } catch (err) {
                console.error("Error al procesar el archivo:", err);
                Swal.fire('Error', "Ocurrió un error al leer o procesar el archivo de Excel. Asegúrate de que el formato sea correcto.", 'error');
                setPreviewData([]);
            }
        };

        reader.onerror = (err) => {
            console.error("Error del lector de archivos:", err);
            Swal.fire('Error', "No se pudo leer el archivo.", 'error');
        };

        reader.readAsArrayBuffer(selectedFile);
    };

    const handleImportData = async () => {
        if (previewData.length === 0) {
            Swal.fire('Atención', "No hay datos para importar.", 'warning');
            return;
        }

        try {
            await addDailySalesRecordsBulk(previewData);
            // Mensaje de éxito ya se maneja en el contexto
            setPreviewData([]);
            setSelectedFile(null);
            setError(null);
        } catch (error) {
            // Mensaje de error ya se maneja en el contexto
        }
    };

    const getTabClassName = (tabName) => {
        const base = "px-4 py-2 text-sm font-medium rounded-t-lg transition-colors";
        const active = "bg-white dark:bg-gray-800 text-primary border-b-2 border-primary";
        const inactive = "text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-white";
        return `${base} ${activeTab === tabName ? active : inactive}`;
    };

    // Grouping logic for the accordion
    const groupedRecords = useMemo(() => {
        const groups = {};
        dailySalesRecords.forEach(record => {
            const month = record.date.substring(0, 7); // "YYYY-MM"
            if (!groups[month]) {
                groups[month] = {
                    records: [],
                    totalImporte: 0
                };
            }
            groups[month].records.push(record);
            groups[month].totalImporte += record.totalImporte;
        });
        // Sort months in descending order (latest month first)
        return Object.entries(groups).sort(([monthA], [monthB]) => monthB.localeCompare(monthA));
    }, [dailySalesRecords]);

    const toggleMonth = (month) => {
        setOpenMonth(prevOpenMonth => (prevOpenMonth === month ? null : month));
    };

    // Función auxiliar para formatear la fecha sin la hora, adaptada para la visualización en la tabla
    const formatDisplayDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        // Usar 'es-MX' para formato de fecha en español de México (DD/MM/YYYY)
        return date.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-[#111418] dark:text-white mb-6">Control de Ventas Diarias</h1>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex flex-wrap border-b border-gray-200 dark:border-gray-700 mb-6"> {/* Añadido flex-wrap */}
                    <button onClick={() => setActiveTab('import')} className={getTabClassName('import')}>
                        Importar desde Excel
                    </button>
                    <button onClick={() => setActiveTab('manual')} className={getTabClassName('manual')}>
                        Agregar Registro Manual
                    </button>
                </div>

                {activeTab === 'import' && (
                    <div className="max-w-xl mx-auto animate-fade-in">
                        <h2 className="text-xl font-semibold mb-4">Paso 1: Cargar Archivo</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            Selecciona el archivo de Excel (.xlsx, .xls) que contiene los registros de ventas diarias.
                            La estructura del archivo debe ser la previamente acordada.
                        </p>

                        <div className="mb-4">
                            <label htmlFor="import-year" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Año de los registros (si no está en el archivo)</label>
                            <input 
                                type="number" 
                                id="import-year"
                                value={importYear}
                                onChange={(e) => setImportYear(parseInt(e.target.value) || new Date().getFullYear())}
                                className="input-style w-full"
                                placeholder="Ej: 2023"
                                min="1900" // Sensible minimum year
                                max="2100" // Sensible maximum year
                            />
                        </div>
                        
                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                            <input 
                                type="file" 
                                id="excel-upload"
                                className="hidden"
                                accept=".xlsx, .xls"
                                onChange={handleFileChange}
                            />
                            <label 
                                htmlFor="excel-upload" 
                                className="cursor-pointer font-semibold text-primary hover:text-primary/80 transition-colors"
                            >
                                {selectedFile ? `Archivo seleccionado: ${selectedFile.name}` : "Haz clic aquí para seleccionar un archivo"}
                            </label>
                            {selectedFile && (
                                <p className="text-sm text-gray-500 mt-2">
                                    Tamaño: {(selectedFile.size / 1024).toFixed(2)} KB
                                </p>
                            )}
                        </div>

                        {error && <p className="text-red-500 mt-4 text-center">{error}</p>}

                        <div className="mt-6 text-center">
                            <button 
                                onClick={handleProcessFile}
                                disabled={!selectedFile}
                                className="btn-primary disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                Procesar Archivo
                            </button>
                        </div>

                        {previewData.length > 0 && (
                            <div className="animate-fade-in">
                                <hr className="dark:border-gray-700 my-8"/>
                                <h2 className="text-xl font-semibold my-4 text-center">Paso 2: Previsualizar y Confirmar</h2>
                                <p className="text-center text-gray-600 dark:text-gray-400 mb-4">Se encontraron {previewData.length} registros de ventas diarias. Revisa los datos antes de importarlos.</p>
                                
                                <div className="rounded-lg shadow overflow-x-auto max-h-96">
                                    <table className="min-w-full text-xs">
                                        <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                                            <tr>
                                                <th className="th-style">Fecha</th>
                                                <th className="th-style">Día</th>
                                                {/* MOSTRADOR */}
                                                <th className="th-style" colSpan="8">MOSTRADOR</th>
                                                {/* PEDIDOS */}
                                                <th className="th-style" colSpan="8">PEDIDOS</th>
                                                {/* NEGOCIOS */}
                                                <th className="th-style" colSpan="8">NEGOCIOS</th>
                                                {/* TOTAL TIPO GARRAFON */}
                                                <th className="th-style" colSpan="7">TOTAL TIPO GARRAFÓN</th>
                                                <th className="th-style">TOTAL GARR.</th>
                                                <th className="th-style">TOTAL IMPORTE</th>
                                            </tr>
                                            <tr>
                                                <th className="th-style"></th>
                                                <th className="th-style"></th>
                                                {/* MOSTRADOR */}
                                                <th className="th-style">Color</th><th>Bonafon</th><th>Epura</th><th>Ciel</th><th>Electro</th><th>10Lts</th><th>Vta. G.</th><th>Total</th>
                                                {/* PEDIDOS */}
                                                <th className="th-style">Color</th><th>Bonafon</th><th>Epura</th><th>Ciel</th><th>Electro</th><th>10Lts</th><th>Vta. G.</th><th>Total</th>
                                                {/* NEGOCIOS */}
                                                <th className="th-style">Color</th><th>Bonafon</th><th>Epura</th><th>Ciel</th><th>Electro</th><th>10Lts</th><th>Vta. G.</th><th>Total</th>
                                                {/* TOTAL TIPO GARRAFON */}
                                                <th className="th-style">Color</th><th>Bonafon</th><th>Epura</th><th>Ciel</th><th>Electro</th><th>10Lts</th><th>Vta. G.</th>
                                                <th className="th-style"></th>
                                                <th className="th-style"></th>
                                            </tr>
                                        </thead>
                                                                                 <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                                                                    {previewData.map((item, idx) => (
                                                                                        <tr key={idx}>
                                                                                            <td className="td-style">{formatDisplayDate(item.date)}</td>
                                                                                            <td className="td-style">{item.dayOfWeek}</td>
                                                                                            <td className="td-style">{item.mostradorColor}</td>
                                                                                            <td className="td-style">{item.mostradorBon}</td>
                                                                                            <td className="td-style">{item.mostradorEpura}</td>
                                                                                            <td className="td-style">{item.mostradorCiel}</td>
                                                                                            <td className="td-style">{item.mostradorElectro}</td>
                                                                                            <td className="td-style">{item.mostrador10Lts}</td>
                                                                                            <td className="td-style">{item.mostradorVtaG}</td>
                                                                                            <td className="td-style font-bold">${item.mostradorTotal.toFixed(2)}</td>
                                                                                            <td className="td-style">{item.pedidosColor}</td>
                                                                                            <td className="td-style">{item.pedidosBon}</td>
                                                                                            <td className="td-style">{item.pedidosEpura}</td>
                                                                                            <td className="td-style">{item.pedidosCiel}</td>
                                                                                            <td className="td-style">{item.pedidosElectro}</td>
                                                                                            <td className="td-style">{item.pedidos10Lts}</td>
                                                                                            <td className="td-style">{item.pedidosVtaG}</td>
                                                                                            <td className="td-style font-bold">${item.pedidosTotal.toFixed(2)}</td>
                                                                                            <td className="td-style">{item.negociosColor}</td>
                                                                                            <td className="td-style">{item.negociosBon}</td>
                                                                                            <td className="td-style">{item.negociosEpura}</td>
                                                                                            <td className="td-style">{item.negociosCiel}</td>
                                                                                            <td className="td-style">{item.negociosElectro}</td>
                                                                                            <td className="td-style">{item.negocios10Lts}</td>
                                                                                            <td className="td-style">{item.negociosVtaG}</td>
                                                                                            <td className="td-style font-bold">${item.negociosTotal.toFixed(2)}</td>
                                                                                            <td className="td-style">{item.totalTipoGarrafonColor}</td>
                                                                                            <td className="td-style">{item.totalTipoGarrafonBon}</td>
                                                                                            <td className="td-style">{item.totalTipoGarrafonEpura}</td>
                                                                                            <td className="td-style">{item.totalTipoGarrafonCiel}</td>
                                                                                            <td className="td-style">{item.totalTipoGarrafonElectro}</td>
                                                                                            <td className="td-style">{item.totalTipoGarrafon10Lts}</td>
                                                                                            <td className="td-style">{item.totalTipoGarrafonVtaG}</td>
                                                                                            <td className="td-style font-bold">{item.totalGarrafones}</td>
                                                                                            <td className="td-style font-bold">${item.totalImporte.toFixed(2)}</td>
                                                                                        </tr>
                                                                                    ))}                                        </tbody>
                                    </table>
                                </div>

                                <div className="mt-6 text-center">
                                    <button
                                        onClick={handleImportData}
                                        className="btn-primary bg-green-600 hover:bg-green-700"
                                    >
                                        Confirmar e Importar {previewData.length} Registros
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'manual' && (
                    <div className="animate-fade-in max-w-full mx-auto"> {/* Cambiado a max-w-full para más espacio */}
                        <h2 className="text-xl font-semibold mb-4">Agregar Registro Manual de Ventas Diarias</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            Introduce todos los detalles del registro de ventas diarias.
                        </p>
                        <form onSubmit={handleManualSubmit} className="space-y-6"> {/* Aumentado el espacio vertical */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4"> {/* Fecha y Día en una sola fila para MD+ */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha</label>
                                    <input 
                                        type="date" 
                                        name="date" 
                                        value={manualForm.date} 
                                        onChange={handleManualChange} 
                                        required 
                                        className="input-style" 
                                    />
                                </div>
                                <div className="col-span-2"> {/* Día de la Semana ocupa más espacio en MD+ */}
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Día de la Semana</label>
                                    <input 
                                        type="text" 
                                        name="dayOfWeek" 
                                        value={manualForm.dayOfWeek} 
                                        onChange={handleManualChange} 
                                        placeholder="Ej. Lun, Mar" 
                                        readOnly 
                                        className="input-style bg-gray-100 dark:bg-gray-700" 
                                    />
                                </div>
                            </div>

                            {/* MOSTRADOR */}
                            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mt-6 border-b pb-2">MOSTRADOR</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-x-4 gap-y-3">
                                <div><label className="label-style">Color</label><input type="number" name="mostradorColor" value={manualForm.mostradorColor} onChange={handleManualChange} className="input-style" /></div>
                                <div><label className="label-style">Bonafon</label><input type="number" name="mostradorBon" value={manualForm.mostradorBon} onChange={handleManualChange} className="input-style" /></div>
                                <div><label className="label-style">Epura</label><input type="number" name="mostradorEpura" value={manualForm.mostradorEpura} onChange={handleManualChange} className="input-style" /></div>
                                <div><label className="label-style">Ciel</label><input type="number" name="mostradorCiel" value={manualForm.mostradorCiel} onChange={handleManualChange} className="input-style" /></div>
                                <div><label className="label-style">Electro</label><input type="number" name="mostradorElectro" value={manualForm.mostradorElectro} onChange={handleManualChange} className="input-style" /></div>
                                <div><label className="label-style">10Lts</label><input type="number" name="mostrador10Lts" value={manualForm.mostrador10Lts} onChange={handleManualChange} className="input-style" /></div>
                                <div><label className="label-style">Vta. G.</label><input type="number" name="mostradorVtaG" value={manualForm.mostradorVtaG} onChange={handleManualChange} className="input-style" /></div>
                                <div><label className="label-style font-bold">Total ($)</label><input type="number" name="mostradorTotal" step="0.01" value={manualForm.mostradorTotal} onChange={handleManualChange} className="input-style" /></div>
                            </div>

                            {/* PEDIDOS */}
                            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mt-6 border-b pb-2">PEDIDOS</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-x-4 gap-y-3">
                                <div><label className="label-style">Color</label><input type="number" name="pedidosColor" value={manualForm.pedidosColor} onChange={handleManualChange} className="input-style" /></div>
                                <div><label className="label-style">Bonafon</label><input type="number" name="pedidosBon" value={manualForm.pedidosBon} onChange={handleManualChange} className="input-style" /></div>
                                <div><label className="label-style">Epura</label><input type="number" name="pedidosEpura" value={manualForm.pedidosEpura} onChange={handleManualChange} className="input-style" /></div>
                                <div><label className="label-style">Ciel</label><input type="number" name="pedidosCiel" value={manualForm.pedidosCiel} onChange={handleManualChange} className="input-style" /></div>
                                <div><label className="label-style">Electro</label><input type="number" name="pedidosElectro" value={manualForm.pedidosElectro} onChange={handleManualChange} className="input-style" /></div>
                                <div><label className="label-style">10Lts</label><input type="number" name="pedidos10Lts" value={manualForm.pedidos10Lts} onChange={handleManualChange} className="input-style" /></div>
                                <div><label className="label-style">Vta. G.</label><input type="number" name="pedidosVtaG" value={manualForm.pedidosVtaG} onChange={handleManualChange} className="input-style" /></div>
                                <div><label className="label-style font-bold">Total ($)</label><input type="number" name="pedidosTotal" step="0.01" value={manualForm.pedidosTotal} onChange={handleManualChange} className="input-style" /></div>
                            </div>

                            {/* NEGOCIOS */}
                            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mt-6 border-b pb-2">NEGOCIOS</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-x-4 gap-y-3">
                                <div><label className="label-style">Color</label><input type="number" name="negociosColor" value={manualForm.negociosColor} onChange={handleManualChange} className="input-style" /></div>
                                <div><label className="label-style">Bonafon</label><input type="number" name="negociosBon" value={manualForm.negociosBon} onChange={handleManualChange} className="input-style" /></div>
                                <div><label className="label-style">Epura</label><input type="number" name="negociosEpura" value={manualForm.negociosEpura} onChange={handleManualChange} className="input-style" /></div>
                                <div><label className="label-style">Ciel</label><input type="number" name="negociosCiel" value={manualForm.negociosCiel} onChange={handleManualChange} className="input-style" /></div>
                                <div><label className="label-style">Electro</label><input type="number" name="negociosElectro" value={manualForm.negociosElectro} onChange={handleManualChange} className="input-style" /></div>
                                <div><label className="label-style">10Lts</label><input type="number" name="negocios10Lts" value={manualForm.negocios10Lts} onChange={handleManualChange} className="input-style" /></div>
                                <div><label className="label-style">Vta. G.</label><input type="number" name="negociosVtaG" value={manualForm.negociosVtaG} onChange={handleManualChange} className="input-style" /></div>
                                <div><label className="label-style font-bold">Total ($)</label><input type="number" name="negociosTotal" step="0.01" value={manualForm.negociosTotal} onChange={handleManualChange} className="input-style" /></div>
                            </div>

                            {/* TOTAL POR TIPO DE GARRAFÓN */}
                            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mt-6 border-b pb-2">TOTAL POR TIPO DE GARRAFÓN (Cantidad de Garrafones)</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-x-4 gap-y-3">
                                <div><label className="label-style">Color</label><input type="number" name="totalTipoGarrafonColor" value={manualForm.totalTipoGarrafonColor} readOnly className="input-style bg-gray-100 dark:bg-gray-700" /></div>
                                <div><label className="label-style">Bonafon</label><input type="number" name="totalTipoGarrafonBon" value={manualForm.totalTipoGarrafonBon} readOnly className="input-style bg-gray-100 dark:bg-gray-700" /></div>
                                <div><label className="label-style">Epura</label><input type="number" name="totalTipoGarrafonEpura" value={manualForm.totalTipoGarrafonEpura} readOnly className="input-style bg-gray-100 dark:bg-gray-700" /></div>
                                <div><label className="label-style">Ciel</label><input type="number" name="totalTipoGarrafonCiel" value={manualForm.totalTipoGarrafonCiel} readOnly className="input-style bg-gray-100 dark:bg-gray-700" /></div>
                                <div><label className="label-style">Electro</label><input type="number" name="totalTipoGarrafonElectro" value={manualForm.totalTipoGarrafonElectro} readOnly className="input-style bg-gray-100 dark:bg-gray-700" /></div>
                                <div><label className="label-style">10Lts</label><input type="number" name="totalTipoGarrafon10Lts" value={manualForm.totalTipoGarrafon10Lts} readOnly className="input-style bg-gray-100 dark:bg-gray-700" /></div>
                                <div><label className="label-style">Vta. G.</label><input type="number" name="totalTipoGarrafonVtaG" value={manualForm.totalTipoGarrafonVtaG} readOnly className="input-style bg-gray-100 dark:bg-gray-700" /></div>
                            </div>

                            {/* TOTALES FINALES */}
                            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mt-6 border-b pb-2">TOTALES GENERALES</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                                <div><label className="label-style">Total Garrafones</label><input type="number" name="totalGarrafones" value={manualForm.totalGarrafones} readOnly className="input-style bg-gray-100 dark:bg-gray-700" /></div>
                                <div><label className="label-style">Total Importe ($)</label><input type="number" name="totalImporte" step="0.01" value={manualForm.totalImporte} readOnly className="input-style bg-gray-100 dark:bg-gray-700" /></div>
                            </div>

                            <div className="text-center mt-6">
                                <button type="submit" className="btn-primary">Guardar Registros</button>
                            </div>
                        </form>
                    </div>
                )}
            </div>

            {/* Tabla de ingresos históricos importados/agregados - now an accordion */}
            <div className="mt-8">
                <h2 className="text-xl font-bold mb-4 text-[#111418] dark:text-white">Registros de Ventas Diarias</h2>
                <div className="space-y-2">
                    {groupedRecords.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center text-gray-500 dark:text-gray-400">
                            <p>No hay registros de ventas diarias aún.</p>
                        </div>
                    ) : (
                        groupedRecords.map(([month, { records, totalImporte }]) => (
                            <div key={month} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                                <button
                                    onClick={() => toggleMonth(month)}
                                    className="w-full flex justify-between items-center p-4 text-left font-semibold text-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <span>{new Date(month + '-02T12:00:00').toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}</span>
                                    <div className='flex items-center gap-4'>
                                      <span className='text-base font-bold text-primary'>
                                        Total: ${totalImporte.toFixed(2)}
                                      </span>
                                      <span className={`material-symbols-outlined transform transition-transform ${openMonth === month ? 'rotate-180' : ''}`}>
                                        expand_more
                                      </span>
                                    </div>
                                </button>
                                {openMonth === month && (
                                    <div className="p-4 bg-gray-50 dark:bg-gray-900/50 overflow-x-auto">
                                        <table className="min-w-full text-xs">
                                            <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0">
                                                <tr>
                                                    <th className="th-style">Fecha</th>
                                                    <th className="th-style">Día</th>
                                                    {/* MOSTRADOR */}
                                                    <th className="th-style" colSpan="8">MOSTRADOR</th>
                                                    {/* PEDIDOS */}
                                                    <th className="th-style" colSpan="8">PEDIDOS</th>
                                                    {/* NEGOCIOS */}
                                                    <th className="th-style" colSpan="8">NEGOCIOS</th>
                                                    {/* TOTAL TIPO GARRAFON */}
                                                    <th className="th-style" colSpan="7">TOTAL TIPO GARRAFÓN</th>
                                                    <th className="th-style">TOTAL GARR.</th>
                                                    <th className="th-style">TOTAL IMPORTE</th>
                                                </tr>
                                                <tr>
                                                    <th className="th-style"></th>
                                                    <th className="th-style"></th>
                                                    {/* MOSTRADOR */}
                                                    <th className="th-style">Color</th><th>Bonafon</th><th>Epura</th><th>Ciel</th><th>Electro</th><th>10Lts</th><th>Vta. G.</th><th>Total</th>
                                                    {/* PEDIDOS */}
                                                    <th className="th-style">Color</th><th>Bonafon</th><th>Epura</th><th>Ciel</th><th>Electro</th><th>10Lts</th><th>Vta. G.</th><th>Total</th>
                                                    {/* NEGOCIOS */}
                                                    <th className="th-style">Color</th><th>Bonafon</th><th>Epura</th><th>Ciel</th><th>Electro</th><th>10Lts</th><th>Vta. G.</th><th>Total</th>
                                                    {/* TOTAL TIPO GARRAFON */}
                                                    <th className="th-style">Color</th><th>Bonafon</th><th>Epura</th><th>Ciel</th><th>Electro</th><th>10Lts</th><th>Vta. G.</th>
                                                    <th className="th-style"></th>
                                                    <th className="th-style"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                                {records.map((item) => ( // Use records from the grouped data
                                                    <tr key={item.id}>
                                                        <td className="td-style">{formatDisplayDate(item.date)}</td>
                                                        <td className="td-style">{item.dayOfWeek}</td>
                                                        <td className="td-style">{item.mostradorColor}</td>
                                                        <td className="td="td-style>{item.mostradorBon}</td>
                                                        <td className="td-style">{item.mostradorEpura}</td>
                                                        <td className="td-style">{item.mostradorCiel}</td>
                                                        <td className="td-style">{item.mostradorElectro}</td>
                                                        <td className="td-style">{item.mostrador10Lts}</td>
                                                        <td className="td-style">{item.mostradorVtaG}</td>
                                                        <td className="td-style font-bold">${item.mostradorTotal.toFixed(2)}</td>
                                                        <td className="td-style">{item.pedidosColor}</td>
                                                        <td className="td-style">{item.pedidosBon}</td>
                                                        <td className="td-style">{item.pedidosEpura}</td>
                                                        <td className="td-style">{item.pedidosCiel}</td>
                                                        <td className="td-style">{item.pedidosElectro}</td>
                                                        <td className="td-style">{item.pedidos10Lts}</td>
                                                        <td className="td-style">{item.pedidosVtaG}</td>
                                                        <td className="td-style font-bold">${item.pedidosTotal.toFixed(2)}</td>
                                                        <td className="td-style">{item.negociosColor}</td>
                                                        <td className="td-style">{item.negociosBon}</td>
                                                        <td className="td-style">{item.negociosEpura}</td>
                                                        <td className="td-style">{item.negociosCiel}</td>
                                                        <td className="td-style">{item.negociosElectro}</td>
                                                        <td className="td-style">{item.negocios10Lts}</td>
                                                        <td className="td-style">{item.negociosVtaG}</td>
                                                        <td className="td-style font-bold">${item.negociosTotal.toFixed(2)}</td>
                                                        <td className="td-style">{item.totalTipoGarrafonColor}</td>
                                                        <td className="td-style">{item.totalTipoGarrafonBon}</td>
                                                        <td className="td-style">{item.totalTipoGarrafonEpura}</td>
                                                        <td className="td-style">{item.totalTipoGarrafonCiel}</td>
                                                        <td className="td-style">{item.totalTipoGarrafonElectro}</td>
                                                        <td className="td-style">{item.totalTipoGarrafon10Lts}</td>
                                                        <td className="td-style">{item.totalTipoGarrafonVtaG}</td>
                                                        <td className="td-style font-bold">{item.totalGarrafones}</td>
                                                        <td className="td-style font-bold">${item.totalImporte.toFixed(2)}</td>
                                                        <td className="td-style text-right space-x-2">
                                                            <button 
                                                                onClick={() => handleOpenEditModal(item)} 
                                                                className="text-primary hover:text-primary/90 font-medium"
                                                            >
                                                                Editar
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDeleteRecord(item.id)} 
                                                                className="text-red-500 hover:text-red-700 font-medium"
                                                            >
                                                                Eliminar
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
            
            <DailySalesRecordEditModal 
                isOpen={isEditModalOpen}
                onClose={handleCloseEditModal}
                recordToEdit={dailySalesRecordToEdit}
                onSave={handleUpdateRecord}
            />
        </div>
    );
};

export default ControlVentasDiarias;