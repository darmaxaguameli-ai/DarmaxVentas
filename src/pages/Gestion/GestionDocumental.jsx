import React, { useState, useEffect, useRef } from 'react';
import { 
    FaFolderOpen, FaFilePdf, FaFileImage, 
    FaPlus, FaSearch, FaFilter, 
    FaCloudUploadAlt, FaUserTie,
    FaBuilding, FaHistory, FaFileAlt
} from 'react-icons/fa';
import { toast } from 'sonner';
import { fetchContableEmpresas, fetchContableDocumentos, uploadContableDocumento } from '../../api/apiClient';

const GestionDocumental = () => {
    const [view, setView] = useState('recientes'); // recientes | contratos | expedientes | fiscal
    const [searchTerm, setSearchTerm] = useState('');
    const [archivos, setArchivos] = useState([]);
    const [empresas, setEmpresas] = useState([]);
    const [selectedEmpresa, setSelectedEmpresa] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchContableEmpresas().then(data => {
            setEmpresas(data);
            if (data.length > 0) setSelectedEmpresa(data[0]);
        }).catch(() => toast.error('Error al cargar empresas'));
    }, []);

    useEffect(() => {
        if (selectedEmpresa) {
            loadDocumentos();
        }
    }, [selectedEmpresa]);

    const loadDocumentos = async () => {
        try {
            const docs = await fetchContableDocumentos(selectedEmpresa.id);
            setArchivos(docs);
        } catch (e) {
            toast.error('Error al cargar documentos');
        }
    };

    const handleUploadClick = () => {
        if (!selectedEmpresa) return toast.error('Selecciona una empresa primero');
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        let uploadsExitosa = 0;

        const uploadPromises = files.map(async (file) => {
            const formData = new FormData();
            formData.append('archivo', file);
            formData.append('empresaId', selectedEmpresa.id);
            formData.append('tipo', file.type.includes('pdf') ? 'FACTURA' : 'EVIDENCIA');

            try {
                await uploadContableDocumento(formData);
                uploadsExitosa++;
            } catch (error) {
                console.error("Upload error", error);
                throw error;
            }
        });

        toast.promise(Promise.all(uploadPromises), {
            loading: `Subiendo ${files.length} archivo(s)...`,
            success: () => {
                loadDocumentos();
                return `${uploadsExitosa} archivos guardados exitosamente`;
            },
            error: 'Ocurrió un error en la subida'
        });
        
        // Limpiar input
        e.target.value = '';
    };

    return (
        <div className="animate-fade-in space-y-8 pb-20">
            {/* Input oculto para subida de archivos */}
            <input 
                type="file" 
                multiple 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".pdf,.jpg,.jpeg,.png,.xml"
            />

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-black text-gray-800 dark:text-white flex items-center gap-4 tracking-tighter uppercase italic">
                        <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-600/20 text-white">
                            <FaFolderOpen className="text-2xl" />
                        </div> 
                        GESTIÓN DOCUMENTAL
                    </h1>
                    <div className="text-[10px] text-gray-500 font-bold mt-2 flex items-center gap-2 uppercase tracking-widest leading-none">
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div> 
                        Repositorio Central de Evidencia, Contratos y Materialidad
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
                            { id: 'recientes', label: 'Recientes', icon: <FaHistory /> },
                            { id: 'contratos', label: 'Contratos', icon: <FaFilePdf /> },
                            { id: 'expedientes', label: 'Expedientes RRHH', icon: <FaUserTie /> },
                            { id: 'fiscal', label: 'Anexos Fiscales', icon: <FaBuilding /> }
                        ].map(t => (
                            <button
                                key={t.id}
                                onClick={() => setView(t.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                                    view === t.id ? 'bg-blue-50 text-blue-600 border-2 border-blue-100' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                            >
                                {t.icon} {t.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Stats / Quick Filters */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 italic">Almacenamiento</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <p className="text-[9px] font-bold text-gray-500 uppercase">Capacidad Usada</p>
                                <p className="text-xs font-black dark:text-white">{(archivos.length * 2.5).toFixed(1)} MB / 5 GB</p>
                            </div>
                            <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full shadow-sm" style={{ width: `${Math.max((archivos.length * 2.5) / 50, 2)}%` }}></div>
                            </div>
                        </div>
                    </div>

                    <div onClick={handleUploadClick} className="bg-blue-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-blue-600/20 relative overflow-hidden group cursor-pointer hover:bg-blue-700 transition-colors">
                        <FaCloudUploadAlt className="absolute -right-4 -bottom-4 text-8xl opacity-10 group-hover:scale-110 transition-transform" />
                        <h3 className="text-lg font-black uppercase italic leading-tight mb-2">Subida Masiva</h3>
                        <p className="text-[9px] font-bold opacity-80 uppercase tracking-widest mb-6">Da clic para cargar tus archivos</p>
                        <button className="w-full py-3 bg-white text-blue-600 font-black rounded-2xl uppercase tracking-widest text-[9px] shadow-lg active:scale-95 transition-all">Seleccionar Archivos</button>
                    </div>
                </div>

                {/* Explorer Area */}
                <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-[3rem] p-8 md:p-12 shadow-sm border border-gray-100 dark:border-gray-700 min-h-[600px] flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full -mr-32 -mt-32" />
                    
                    <div className="flex flex-col md:flex-row items-center justify-between mb-8 pb-4 border-b border-gray-50 dark:border-gray-700 relative z-10 gap-4">
                        <div className="relative flex-1 w-full">
                            <FaSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input 
                                type="text" 
                                placeholder="Buscar en el repositorio..." 
                                className="w-full pl-14 pr-6 py-4 bg-gray-50/50 dark:bg-gray-900 border border-transparent focus:border-blue-500/20 rounded-[1.5rem] text-sm font-bold outline-none transition-all dark:text-white"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                             <button className="p-4 bg-gray-50 dark:bg-gray-700 text-gray-400 rounded-2xl hover:text-blue-500 transition-all"><FaFilter size={14}/></button>
                             <button onClick={handleUploadClick} className="btn-primary py-4 px-8 rounded-3xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 flex-1 md:flex-none">
                                <FaPlus /> Nuevo
                             </button>
                        </div>
                    </div>

                    <div className="relative z-10 flex-1">
                        {archivos.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {archivos.filter(a => a.nombre.toLowerCase().includes(searchTerm.toLowerCase())).map(archivo => (
                                    <a key={archivo.id} href={import.meta.env.VITE_API_URL?.replace('/api', '') + archivo.ruta} target="_blank" rel="noreferrer" className="p-4 border border-gray-100 dark:border-gray-700 rounded-[2rem] flex items-center gap-4 hover:border-blue-500 transition-all group bg-gray-50/50 dark:bg-gray-900/40 cursor-pointer">
                                        <div className="w-12 h-12 rounded-2xl bg-white dark:bg-gray-800 flex items-center justify-center text-blue-500 shadow-sm shrink-0">
                                            {archivo.extension === 'pdf' ? <FaFilePdf size={20} /> : ['jpg','png','jpeg'].includes(archivo.extension) ? <FaFileImage size={20} /> : <FaFileAlt size={20} />}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-black text-xs text-gray-800 dark:text-white uppercase truncate">{archivo.nombre}</p>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">{new Date(archivo.fecha).toLocaleDateString()} • {(archivo.tamano / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center text-gray-300 dark:text-gray-700 py-20 h-full">
                                <FaFolderOpen size={80} className="mb-6 opacity-20" />
                                <p className="font-black uppercase tracking-[0.4em] text-[10px]">El Repositorio está vacío</p>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest italic mt-2">Sube tus primeros comprobantes o contratos</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GestionDocumental;
