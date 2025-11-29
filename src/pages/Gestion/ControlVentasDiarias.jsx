import { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { useGestion } from './context/GestionContext';

const getDayName = (dateString) => {
    const date = new Date(dateString + 'T12:00:00'); // Add T12:00:00 to avoid timezone issues
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('es-MX', { weekday: 'long' });
};

const ControlVentasDiarias = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewData, setPreviewData] = useState([]); // This will now store DailySalesRecord objects
    const [error, setError] = useState(null);
    const { addIncome, addDailySalesRecord, state } = useGestion();
    const [activeTab, setActiveTab] = useState('import'); // 'import' or 'manual'
    const [openMonth, setOpenMonth] = useState(null); // State for the accordion
    const [importYear, setImportYear] = useState(new Date().getFullYear()); // New state for import year

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

    const handleManualSubmit = (e) => {
        e.preventDefault();

        const newDailySalesRecord = {
            date: manualForm.date,
            dayOfWeek: manualForm.dayOfWeek,

            // MOSTRADOR
            mostradorColor: parseFloat(manualForm.mostradorColor) || 0,
            mostradorBon: parseFloat(manualForm.mostradorBon) || 0,
            mostradorEpura: parseFloat(manualForm.mostradorEpura) || 0,
            mostradorCiel: parseFloat(manualForm.mostradorCiel) || 0,
            mostradorElectro: parseFloat(manualForm.mostradorElectro) || 0,
            mostrador10Lts: parseFloat(manualForm.mostrador10Lts) || 0,
            mostradorVtaG: parseFloat(manualForm.mostradorVtaG) || 0,
            mostradorTotal: parseFloat(manualForm.mostradorTotal) || 0,

            // PEDIDOS
            pedidosColor: parseFloat(manualForm.pedidosColor) || 0,
            pedidosBon: parseFloat(manualForm.pedidosBon) || 0,
            pedidosEpura: parseFloat(manualForm.pedidosEpura) || 0,
            pedidosCiel: parseFloat(manualForm.pedidosCiel) || 0,
            pedidosElectro: parseFloat(manualForm.pedidosElectro) || 0,
            pedidos10Lts: parseFloat(manualForm.pedidos10Lts) || 0,
            pedidosVtaG: parseFloat(manualForm.pedidosVtaG) || 0,
            pedidosTotal: parseFloat(manualForm.pedidosTotal) || 0,

            // NEGOCIOS
            negociosColor: parseFloat(manualForm.negociosColor) || 0,
            negociosBon: parseFloat(manualForm.negociosBon) || 0,
            negociosEpura: parseFloat(manualForm.negociosEpura) || 0,
            negociosCiel: parseFloat(manualForm.negociosCiel) || 0,
            negociosElectro: parseFloat(manualForm.negociosElectro) || 0,
            negocios10Lts: parseFloat(manualForm.negocios10Lts) || 0,
            negociosVtaG: parseFloat(manualForm.negociosVtaG) || 0,
            negociosTotal: parseFloat(manualForm.negociosTotal) || 0,

            // TOTAL TIPO GARRAFON (Now from calculated state)
            totalTipoGarrafonColor: manualForm.totalTipoGarrafonColor,
            totalTipoGarrafonBon: manualForm.totalTipoGarrafonBon,
            totalTipoGarrafonEpura: manualForm.totalTipoGarrafonEpura,
            totalTipoGarrafonCiel: manualForm.totalTipoGarrafonCiel,
            totalTipoGarrafonElectro: manualForm.totalTipoGarrafonElectro,
            totalTipoGarrafon10Lts: manualForm.totalTipoGarrafon10Lts,
            totalTipoGarrafonVtaG: manualForm.totalTipoGarrafonVtaG,
            
            totalGarrafones: manualForm.totalGarrafones,
            totalImporte: manualForm.totalImporte,
        };

        // Validate at least one amount or garrafon total is provided
        // Use the calculated totalGarrafones and totalImporte for validation
        if (newDailySalesRecord.totalGarrafones === 0 && newDailySalesRecord.totalImporte === 0) {
            alert("Debes introducir al menos un monto o total de garrafones.");
            return;
        }

        // Add the detailed record
        const addedDailySalesRecord = addDailySalesRecord(newDailySalesRecord);
        
        // Create a corresponding Income record
        addIncome({
            description: `Venta Diaria Detallada (${newDailySalesRecord.date})`,
            amount: newDailySalesRecord.totalImporte,
            date: newDailySalesRecord.date,
            dailySalesRecordId: addedDailySalesRecord.id, // Link to the new detailed record
        });

        alert("Registro manual de ventas diarias añadido exitosamente.");
        setManualForm(initialManualFormState); // Reset form
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setError(null);
        }
    };

    const handleProcessFile = () => {
        if (!selectedFile) {
            setError("Por favor, selecciona un archivo de Excel primero.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
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
                    
                    // MOSTRADOR
                    const mostradorColor = parseFloat(row[2]) || 0;
                    const mostradorBon = parseFloat(row[3]) || 0;
                    const mostradorEpura = parseFloat(row[4]) || 0;
                    const mostradorCiel = parseFloat(row[5]) || 0;
                    const mostradorElectro = parseFloat(row[6]) || 0;
                    const mostrador10Lts = parseFloat(row[7]) || 0;
                    const mostradorVtaG = parseFloat(row[8]) || 0;
                    const mostradorTotal = parseFloat(row[9]) || 0;

                    // PEDIDOS
                    const pedidosColor = parseFloat(row[10]) || 0;
                    const pedidosBon = parseFloat(row[11]) || 0;
                    const pedidosEpura = parseFloat(row[12]) || 0;
                    const pedidosCiel = parseFloat(row[13]) || 0;
                    const pedidosElectro = parseFloat(row[14]) || 0;
                    const pedidos10Lts = parseFloat(row[15]) || 0;
                    const pedidosVtaG = parseFloat(row[16]) || 0;
                    const pedidosTotal = parseFloat(row[17]) || 0;

                    // NEGOCIOS
                    const negociosColor = parseFloat(row[18]) || 0;
                    const negociosBon = parseFloat(row[19]) || 0;
                    const negociosEpura = parseFloat(row[20]) || 0;
                    const negociosCiel = parseFloat(row[21]) || 0;
                    const negociosElectro = parseFloat(row[22]) || 0;
                    const negocios10Lts = parseFloat(row[23]) || 0;
                    const negociosVtaG = parseFloat(row[24]) || 0;
                    const negociosTotal = parseFloat(row[25]) || 0;

                    // TOTAL TIPO GARRAFON
                    const totalTipoGarrafonColor = parseFloat(row[26]) || 0;
                    const totalTipoGarrafonBon = parseFloat(row[27]) || 0;
                    const totalTipoGarrafonEpura = parseFloat(row[28]) || 0;
                    const totalTipoGarrafonCiel = parseFloat(row[29]) || 0;
                    const totalTipoGarrafonElectro = parseFloat(row[30]) || 0;
                    const totalTipoGarrafon10Lts = parseFloat(row[31]) || 0;
                    const totalTipoGarrafonVtaG = parseFloat(row[32]) || 0;

                    const totalGarrafones = parseFloat(row[33]) || 0; // Columna AH
                    const totalImporte = parseFloat(row[34]) || 0;    // Columna AI

                    // Validate that the row has relevant numeric data
                    if (isNaN(dateValue) && typeof dateValue !== 'string') return;
                    if (totalImporte === 0 && totalGarrafones === 0) return;
                    
                    // Convertir fecha de Excel
                    let date;
                    if (typeof dateValue === 'number') {
                        // Correctly convert Excel serial number to JS Date.
                        // Excel serials start from 1899-12-30. 25569 is the number of days from 1899-12-30 to 1970-01-01.
                        // 86400 * 1000 is milliseconds in a day.
                        date = new Date((dateValue - 25569) * 86400 * 1000); 
                    } else if (typeof dateValue === 'string') {
                        // For string dates like "28-Nov" or "15/03", we attempt to parse and explicitly set the year.
                        // Adding T12:00:00 to avoid timezone issues during parsing.
                        let potentialDate = new Date(`${dateValue} ${importYear}T12:00:00`);
                        
                        // Fallback for formats like DD/MM or DD-MM if direct parsing fails
                        if (isNaN(potentialDate.getTime())) {
                            const parts = dateValue.match(/(\d{1,2})[\/\-](\d{1,2})/);
                            if (parts) {
                                // parts[1] is day, parts[2] is month. Month is 0-indexed for Date constructor.
                                potentialDate = new Date(importYear, parseInt(parts[2]) - 1, parseInt(parts[1]), 12, 0, 0); // 12:00:00 to avoid timezone issues
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

                if(processedDailyRecords.length === 0) {
                    setError("No se encontraron datos de ventas diarias válidos en el archivo. Verifica el formato.");
                    setPreviewData([]);
                } else {
                    setPreviewData(processedDailyRecords);
                    setError(null);
                }

            } catch (err) {
                console.error("Error al procesar el archivo:", err);
                setError("Ocurrió un error al leer o procesar el archivo de Excel. Asegúrate de que el formato sea correcto.");
                setPreviewData([]);
            }
        };

        reader.onerror = (err) => {
            console.error("Error del lector de archivos:", err);
            setError("No se pudo leer el archivo.");
        };

        reader.readAsArrayBuffer(selectedFile);
    };

    const handleImportData = () => {
        if (previewData.length === 0) {
            setError("No hay datos para importar.");
            return;
        }
        previewData.forEach(record => {
            // Add the DailySalesRecord
            const addedRecord = addDailySalesRecord(record);

            // Create a corresponding Income record
            addIncome({
                description: `Venta Diaria Detallada (${record.date})`,
                amount: record.totalImporte,
                date: record.date,
                dailySalesRecordId: addedRecord.id, // Link to the new detailed record
            });
        });
        alert(`${previewData.length} registros de ventas diarias han sido importados exitosamente.`);
        setPreviewData([]);
        setSelectedFile(null);
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

    return (
        <div>
            <h1 className="text-3xl font-bold text-[#111418] dark:text-white mb-6">Control de Ventas Diarias</h1>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
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
                                                    <td className="td-style">{item.date}</td>
                                                    <td className="td-style">{getDayName(item.date)}</td>
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
                                            ))}
                                        </tbody>
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
                    <div className="animate-fade-in max-w-xl mx-auto">
                        <h2 className="text-xl font-semibold mb-4">Agregar Registro Manual de Ventas Diarias</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            Introduce todos los detalles del registro de ventas diarias.
                        </p>
                        <form onSubmit={handleManualSubmit} className="space-y-4">
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
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Día de la Semana</label>
                                <input 
                                    type="text" 
                                    name="dayOfWeek" 
                                    value={manualForm.dayOfWeek} 
                                    onChange={handleManualChange} 
                                    placeholder="Ej. Lun, Mar" 
                                    readOnly // Se añadió readOnly aquí
                                    className="input-style" 
                                />
                            </div>

                            {/* MOSTRADOR */}
                            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mt-6">MOSTRADOR</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="label-style">Color</label><input type="number" name="mostradorColor" value={manualForm.mostradorColor} onChange={handleManualChange} className="input-style" /></div>
                                <div><label className="label-style">Bonafon</label><input type="number" name="mostradorBon" value={manualForm.mostradorBon} onChange={handleManualChange} className="input-style" /></div>
                                <div><label className="label-style">Epura</label><input type="number" name="mostradorEpura" value={manualForm.mostradorEpura} onChange={handleManualChange} className="input-style" /></div>
                                <div><label className="label-style">Ciel</label><input type="number" name="mostradorCiel" value={manualForm.mostradorCiel} onChange={handleManualChange} className="input-style" /></div>
                                <div><label className="label-style">Electro</label><input type="number" name="mostradorElectro" value={manualForm.mostradorElectro} onChange={handleManualChange} className="input-style" /></div>
                                <div><label className="label-style">10Lts</label><input type="number" name="mostrador10Lts" value={manualForm.mostrador10Lts} onChange={handleManualChange} className="input-style" /></div>
                                <div><label className="label-style">Vta. G.</label><input type="number" name="mostradorVtaG" value={manualForm.mostradorVtaG} onChange={handleManualChange} className="input-style" /></div>
                                <div><label className="label-style">Total ($)</label><input type="number" name="mostradorTotal" step="0.01" value={manualForm.mostradorTotal} onChange={handleManualChange} className="input-style" /></div>
                            </div>

                            {/* PEDIDOS */}
                            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mt-6">PEDIDOS</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="label-style">Color</label><input type="number" name="pedidosColor" value={manualForm.pedidosColor} onChange={handleManualChange} className="input-style" /></div>
                                <div><label className="label-style">Bonafon</label><input type="number" name="pedidosBon" value={manualForm.pedidosBon} onChange={handleManualChange} className="input-style" /></div>
                                <div><label className="label-style">Epura</label><input type="number" name="pedidosEpura" value={manualForm.pedidosEpura} onChange={handleManualChange} className="input-style" /></div>
                                <div><label className="label-style">Ciel</label><input type="number" name="pedidosCiel" value={manualForm.pedidosCiel} onChange={handleManualChange} className="input-style" /></div>
                                <div><label className="label-style">Electro</label><input type="number" name="pedidosElectro" value={manualForm.pedidosElectro} onChange={handleManualChange} className="input-style" /></div>
                                <div><label className="label-style">10Lts</label><input type="number" name="pedidos10Lts" value={manualForm.pedidos10Lts} onChange={handleManualChange} className="input-style" /></div>
                                <div><label className="label-style">Vta. G.</label><input type="number" name="pedidosVtaG" value={manualForm.pedidosVtaG} onChange={handleManualChange} className="input-style" /></div>
                                <div><label className="label-style">Total ($)</label><input type="number" name="pedidosTotal" step="0.01" value={manualForm.pedidosTotal} onChange={handleManualChange} className="input-style" /></div>
                            </div>

                            {/* NEGOCIOS */}
                            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mt-6">NEGOCIOS</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="label-style">Color</label><input type="number" name="negociosColor" value={manualForm.negociosColor} onChange={handleManualChange} className="input-style" /></div>
                                <div><label className="label-style">Bonafon</label><input type="number" name="negociosBon" value={manualForm.negociosBon} onChange={handleManualChange} className="input-style" /></div>
                                <div><label className="label-style">Epura</label><input type="number" name="negociosEpura" value={manualForm.negociosEpura} onChange={handleManualChange} className="input-style" /></div>
                                <div><label className="label-style">Ciel</label><input type="number" name="negociosCiel" value={manualForm.negociosCiel} onChange={handleManualChange} className="input-style" /></div>
                                <div><label className="label-style">Electro</label><input type="number" name="negociosElectro" value={manualForm.negociosElectro} onChange={handleManualChange} className="input-style" /></div>
                                <div><label className="label-style">10Lts</label><input type="number" name="negocios10Lts" value={manualForm.negocios10Lts} onChange={handleManualChange} className="input-style" /></div>
                                <div><label className="label-style">Vta. G.</label><input type="number" name="negociosVtaG" value={manualForm.negociosVtaG} onChange={handleManualChange} className="input-style" /></div>
                                <div><label className="label-style">Total ($)</label><input type="number" name="negociosTotal" step="0.01" value={manualForm.negociosTotal} onChange={handleManualChange} className="input-style" /></div>
                            </div>

                            {/* TOTAL POR TIPO DE GARRAFÓN */}
                            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mt-6">TOTAL POR TIPO DE GARRAFÓN</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="label-style">Color</label><input type="number" name="totalTipoGarrafonColor" value={manualForm.totalTipoGarrafonColor} readOnly className="input-style bg-gray-100 dark:bg-gray-700" /></div>
                                <div><label className="label-style">Bonafon</label><input type="number" name="totalTipoGarrafonBon" value={manualForm.totalTipoGarrafonBon} readOnly className="input-style bg-gray-100 dark:bg-gray-700" /></div>
                                <div><label className="label-style">Epura</label><input type="number" name="totalTipoGarrafonEpura" value={manualForm.totalTipoGarrafonEpura} readOnly className="input-style bg-gray-100 dark:bg-gray-700" /></div>
                                <div><label className="label-style">Ciel</label><input type="number" name="totalTipoGarrafonCiel" value={manualForm.totalTipoGarrafonCiel} readOnly className="input-style bg-gray-100 dark:bg-gray-700" /></div>
                                <div><label className="label-style">Electro</label><input type="number" name="totalTipoGarrafonElectro" value={manualForm.totalTipoGarrafonElectro} readOnly className="input-style bg-gray-100 dark:bg-gray-700" /></div>
                                <div><label className="label-style">10Lts</label><input type="number" name="totalTipoGarrafon10Lts" value={manualForm.totalTipoGarrafon10Lts} readOnly className="input-style bg-gray-100 dark:bg-gray-700" /></div>
                                <div><label className="label-style">Vta. G.</label><input type="number" name="totalTipoGarrafonVtaG" value={manualForm.totalTipoGarrafonVtaG} readOnly className="input-style bg-gray-100 dark:bg-gray-700" /></div>
                            </div>

                            {/* TOTALES FINALES */}
                            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mt-6">TOTALES GENERALES</h3>
                            <div className="grid grid-cols-2 gap-4">
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
                                                        <td className="td-style">{item.date}</td>
                                                        <td className="td-style">{getDayName(item.date)}</td>
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
        </div>
    );
};

export default ControlVentasDiarias;