import React, { useMemo, useState, useEffect } from "react";
import { PDFDownloadLink, PDFViewer } from "@react-pdf/renderer";
import DarmaxWaterQuotePDF from "./components/pdf/DarmaxWaterQuotePDF";
import SignaturePad from "@/pages/sistemasDeVentas/Repartidor/components/SignaturePad";
import { createCotizacion } from "../../api/apiClient";
import Swal from "sweetalert2";

const todayMX = () => {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = d.getFullYear();
  return `${dd}/${mm}/${yy}`;
};

const SectionTitle = ({ children }) => (
    <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-3 border-b border-gray-100 dark:border-gray-700 pb-2">
        {children}
    </h3>
);

const InputGroup = ({ label, value, onChange, placeholder, type = "text", horizontal = false }) => (
    <div className={`${horizontal ? "flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3" : "flex flex-col gap-1"}`}>
        <label className={`block text-xs font-bold text-gray-700 dark:text-gray-300 ${horizontal ? "sm:min-w-fit sm:mb-0" : ""}`}>{label}</label>
        <input
            type={type}
            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
            value={value}
            onChange={onChange}
            placeholder={placeholder}
        />
    </div>
);

export default function DarmaxQuote() {
  const [form, setForm] = useState({
    fecha: todayMX(),
    diasValidez: "5",
    nombreAsesor: "",
    cliente: { nombre: "", telefono: "", correo: "", cp: "" },
    costos: { 
        modelo: 0, 
        modeloNombre: "", 
        fleteTinacos: 0, 
        viaticos: 0 
    },
    extrasSeleccionados: [], 
    promo: { texto: "", costo: "", imagenUrl: "" },
    firma: "",
  });

  const [extrasDisponibles, setExtrasDisponibles] = useState([]);
  const [loadingExtras, setLoadingExtras] = useState(false);
  const [savedQuote, setSavedQuote] = useState(null); // Almacena la cotización guardada con folio
  const [isSaving, setIsSaving] = useState(false);
  const [signatureMode, setSignatureMode] = useState('pad'); // 'pad' | 'upload'

  // Cargar catálogo completo de extras al montar el componente
  useEffect(() => {
    const fetchAllExtras = async () => {
      setLoadingExtras(true);
      try {
        const response = await fetch('https://darmaxagua.com.mx/api/configurador/extras');
        if (!response.ok) throw new Error('Error al cargar catálogo de extras');
        const data = await response.json();
        setExtrasDisponibles(data);
      } catch (error) {
        console.error("Error fetching extras catalog:", error);
      } finally {
        setLoadingExtras(false);
      }
    };
    fetchAllExtras();
  }, []);

  const data = useMemo(() => {
    const toNum = (v) => {
      const n = Number(String(v).replace(/[^\d.]/g, ""));
      return Number.isFinite(n) ? n : 0;
    };
    
    // Sumar extras al total (ahora usan basePrice directo del catálogo)
    const totalExtras = form.extrasSeleccionados.reduce((acc, ex) => acc + (ex.basePrice || 0), 0);

    return {
      ...form,
      costos: {
        ...form.costos,
        modelo: toNum(form.costos.modelo),
        fleteTinacos: toNum(form.costos.fleteTinacos),
        viaticos: toNum(form.costos.viaticos),
      },
      totalExtras,
      promo: {
        ...form.promo,
        costo: form.promo.costo === "" ? null : toNum(form.promo.costo),
      },
    };
  }, [form]);

  // --- Lógica de Debounce para el PDF ---
  const [debouncedData, setDebouncedData] = useState(data);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedData(data);
    }, 800); 

    return () => clearTimeout(handler);
  }, [data]);

  const pdfData = useMemo(() => ({
      ...debouncedData,
      folio: savedQuote?.folio || null
  }), [debouncedData, savedQuote]);

  const onChange = (path) => (e) => {
    const value = e.target.value;
    setForm((prev) => {
      const copy = structuredClone(prev);
      const parts = path.split(".");
      let ref = copy;
      for (let i = 0; i < parts.length - 1; i++) ref = ref[parts[i]];
      ref[parts.at(-1)] = value;
      return copy;
    });
    // setSavedQuote(null); // Eliminado para mantener el folio visible tras editar
  };

  const handleSignatureSave = (signatureData) => {
      setForm(prev => ({ ...prev, firma: signatureData }));
      // setSavedQuote(null);
  };

  const handleSignatureClear = () => {
      setForm(prev => ({ ...prev, firma: "" }));
      // setSavedQuote(null);
  };

  const handleSaveQuote = async () => {
      if (!form.cliente.nombre) {
          Swal.fire("Error", "El nombre del cliente es obligatorio para guardar.", "error");
          return;
      }

      setIsSaving(true);
      try {
          // Usamos 'data' que ya tiene los números procesados
          const quoteToSave = { ...data };
          const response = await createCotizacion(quoteToSave);
          setSavedQuote(response);
          Swal.fire("¡Guardado!", `Cotización guardada con Folio: ${String(response.folio).padStart(4, '0')}`, "success");
      } catch (error) {
          console.error("Error saving quote:", error);
          Swal.fire("Error", "No se pudo guardar la cotización.", "error");
      } finally {
          setIsSaving(false);
      }
  };

  const doc = <DarmaxWaterQuotePDF data={pdfData} />;

  return (
    <div className="flex flex-col h-full overflow-hidden">
        {/* Header Responsivo */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
            <div>
                <h1 className="text-xl sm:text-2xl font-black text-gray-800 dark:text-white">Cotizador Darmax</h1>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Genera cotizaciones en PDF.</p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto grid grid-cols-2 sm:flex">
                <button
                    onClick={handleSaveQuote}
                    disabled={isSaving}
                    className={`flex items-center justify-center gap-2 px-3 py-2 sm:px-4 rounded-xl font-bold shadow-md transition-all active:scale-95 text-xs sm:text-sm ${
                        savedQuote 
                        ? "bg-green-100 text-green-700 cursor-default shadow-none border border-green-200" 
                        : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                    }`}
                >
                    {isSaving ? (
                        "..."
                    ) : savedQuote ? (
                        <>
                            <span className="material-symbols-outlined text-lg sm:text-xl">check</span>
                            <span className="truncate">Folio {String(savedQuote.folio).padStart(4, '0')}</span>
                        </>
                    ) : (
                        <>
                            <span className="material-symbols-outlined text-lg sm:text-xl">save</span>
                            Guardar
                        </>
                    )}
                </button>

                <PDFDownloadLink
                    document={doc}
                    fileName={`Cotizacion-DarmaxAgua-${form.cliente.nombre || "cliente"}-${savedQuote?.folio ? String(savedQuote.folio).padStart(4, '0') : "Borrador"}.pdf`}
                    className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-3 py-2 sm:px-4 rounded-xl font-bold shadow-lg shadow-primary/30 transition-all active:scale-95 text-xs sm:text-sm text-center"
                >
                    {({ loading }) => (
                        <>
                            <span className="material-symbols-outlined text-lg sm:text-xl">download</span>
                            {loading ? "..." : "PDF"}
                        </>
                    )}
                </PDFDownloadLink>
            </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
            {/* Formulario (Izquierda) */}
            <div className="w-full lg:w-1/2 overflow-y-auto custom-scrollbar pr-1 sm:pr-2 pb-24 lg:pb-20">
                <div className="space-y-4 sm:space-y-6">
                    
                    {/* Tarjeta: Datos Generales */}
                    <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
                        <SectionTitle>Información General</SectionTitle>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <InputGroup label="Fecha" value={form.fecha} onChange={onChange("fecha")} horizontal />
                            <InputGroup label="Días Validez" value={form.diasValidez} onChange={onChange("diasValidez")} type="number" horizontal />
                        </div>
                    </div>

                    {/* Tarjeta: Cliente */}
                    <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
                        <SectionTitle>Datos del Cliente</SectionTitle>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <InputGroup label="Nombre" value={form.cliente.nombre} onChange={onChange("cliente.nombre")} placeholder="Ej. Juan Pérez" horizontal />
                            <InputGroup label="Teléfono" value={form.cliente.telefono} onChange={onChange("cliente.telefono")} placeholder="55 1234 5678" horizontal />
                            <InputGroup label="Correo" value={form.cliente.correo} onChange={onChange("cliente.correo")} placeholder="juan@email.com" horizontal />
                            <InputGroup label="C.P." value={form.cliente.cp} onChange={onChange("cliente.cp")} placeholder="00000" horizontal />
                        </div>
                    </div>

                    {/* Tarjeta: Costos */}
                    <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
                        <SectionTitle>Desglose de Costos (MXN)</SectionTitle>
                        <div className="space-y-4 sm:space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <InputGroup label="Modelo" value={form.costos.modeloNombre} onChange={onChange("costos.modeloNombre")} placeholder="Ej. Darmax 2500" />
                                <InputGroup label="Costo" value={form.costos.modelo} onChange={onChange("costos.modelo")} type="number" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <InputGroup label="Flete" value={form.costos.fleteTinacos} onChange={onChange("costos.fleteTinacos")} type="number" />
                                <InputGroup label="Viáticos" value={form.costos.viaticos} onChange={onChange("costos.viaticos")} type="number" />
                            </div>
                        </div>
                    </div>

                    {/* Tarjeta: Equipamiento Extra */}
                    <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
                        <SectionTitle>Equipamiento Extra</SectionTitle>
                        {loadingExtras ? (
                            <p className="text-xs text-gray-500 animate-pulse">Cargando...</p>
                        ) : extrasDisponibles.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                                {extrasDisponibles.map((extra) => (
                                    <label key={extra.id} className="flex items-center gap-3 p-2 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors group">
                                        <input 
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary flex-shrink-0"
                                            checked={form.extrasSeleccionados.some(ex => ex.id === extra.id)}
                                            onChange={(e) => {
                                                const checked = e.target.checked;
                                                setForm(prev => ({
                                                    ...prev,
                                                    extrasSeleccionados: checked 
                                                        ? [...prev.extrasSeleccionados, extra]
                                                        : prev.extrasSeleccionados.filter(ex => ex.id !== extra.id)
                                                }));
                                            }}
                                        />
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 group-hover:text-primary transition-colors truncate">
                                                {extra.name}
                                            </span>
                                            <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                                +${extra.basePrice}
                                            </span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-gray-400 italic">Sin extras disponibles.</p>
                        )}
                    </div>

                    {/* Tarjeta: Promoción */}
                    <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
                        <SectionTitle>Promoción (Opcional)</SectionTitle>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Descripción</label>
                                <textarea
                                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all resize-none h-20"
                                    value={form.promo.texto}
                                    onChange={onChange("promo.texto")}
                                    placeholder="Ej. 4 garrafones gratis..."
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <InputGroup label="Valor Ref." value={form.promo.costo} onChange={onChange("promo.costo")} type="number" />
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Imagen</label>
                                    
                                    {!form.promo.imagenUrl ? (
                                        <div className="flex items-center justify-center w-full">
                                            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 transition-all">
                                                <div className="flex flex-col items-center justify-center pt-2 pb-3">
                                                    <span className="material-symbols-outlined text-gray-400 text-2xl mb-1">add_photo_alternate</span>
                                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 text-center px-2">Subir imagen</p>
                                                </div>
                                                <input 
                                                    type="file" 
                                                    className="hidden" 
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        const file = e.target.files[0];
                                                        if (file) {
                                                            const reader = new FileReader();
                                                            reader.onloadend = () => {
                                                                setForm(prev => ({
                                                                    ...prev,
                                                                    promo: { ...prev.promo, imagenUrl: reader.result }
                                                                }));
                                                            };
                                                            reader.readAsDataURL(file);
                                                        }
                                                    }}
                                                />
                                            </label>
                                        </div>
                                    ) : (
                                        <div className="relative group w-full h-24 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex items-center justify-center">
                                            <img 
                                                src={form.promo.imagenUrl} 
                                                alt="Promo" 
                                                className="h-full object-contain" 
                                            />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <button 
                                                    onClick={() => setForm(prev => ({ ...prev, promo: { ...prev.promo, imagenUrl: "" } }))}
                                                    className="bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-base">delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tarjeta: Firma */}
                    <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
                        <SectionTitle>Firma del Asesor</SectionTitle>
                        
                        <div className="mb-4 pt-1">
                            <InputGroup 
                                label="Nombre del Asesor" 
                                value={form.nombreAsesor} 
                                onChange={onChange("nombreAsesor")} 
                                placeholder="Nombre para la firma..."
                            />
                        </div>

                        {form.firma ? (
                            <div className="flex flex-col items-center">
                                <div className="bg-white p-3 rounded-xl border border-gray-200 dark:border-gray-700 mb-3 w-full">
                                    <img src={form.firma} alt="Firma" className="h-24 object-contain mx-auto" />
                                </div>
                                <button 
                                    onClick={handleSignatureClear}
                                    className="text-red-500 hover:text-red-700 font-medium text-xs sm:text-sm flex items-center gap-2 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-sm">delete</span>
                                    Borrar Firma
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {/* Selector de Modo de Firma */}
                                <div className="flex justify-center bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-full sm:w-fit mx-auto">
                                    <button
                                        onClick={() => setSignatureMode('pad')}
                                        className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-xs font-bold transition-all text-center ${
                                            signatureMode === 'pad'
                                                ? 'bg-white dark:bg-gray-700 text-primary shadow-sm'
                                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                        }`}
                                    >
                                        Dibujar
                                    </button>
                                    <button
                                        onClick={() => setSignatureMode('upload')}
                                        className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-xs font-bold transition-all text-center ${
                                            signatureMode === 'upload'
                                                ? 'bg-white dark:bg-gray-700 text-primary shadow-sm'
                                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                        }`}
                                    >
                                        Subir
                                    </button>
                                </div>

                                {signatureMode === 'pad' ? (
                                    <SignaturePad onSave={handleSignatureSave} />
                                ) : (
                                    <div className="flex items-center justify-center w-full">
                                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 transition-all group">
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <span className="material-symbols-outlined text-gray-400 group-hover:text-primary text-3xl mb-2 transition-colors">upload_file</span>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium text-center">Subir firma (PNG/JPG)</p>
                                            </div>
                                            <input 
                                                type="file" 
                                                className="hidden" 
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files[0];
                                                    if (file) {
                                                        const reader = new FileReader();
                                                        reader.onloadend = () => {
                                                            setForm(prev => ({ ...prev, firma: reader.result }));
                                                            // setSavedQuote(null);
                                                        };
                                                        reader.readAsDataURL(file);
                                                    }
                                                }}
                                            />
                                        </label>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                </div>
            </div>

            {/* Vista Previa (Derecha - Sticky en Desktop, oculta en móvil) */}
            <div className="hidden lg:flex flex-col w-1/2 h-full bg-gray-100 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-inner">
                <div className="p-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">visibility</span> Vista Previa
                    </span>
                    <span className="text-[10px] font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-500">Carta</span>
                </div>
                <div className="flex-1 bg-gray-500/10 p-4">
                    <PDFViewer width="100%" height="100%" className="rounded-lg shadow-xl" showToolbar={false}>
                        {doc}
                    </PDFViewer>
                </div>
            </div>
        </div>
    </div>
  );
}