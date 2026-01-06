import React, { useMemo, useState, useEffect } from "react";
import { PDFDownloadLink, PDFViewer } from "@react-pdf/renderer";
import DarmaxWaterQuotePDF from "./components/pdf/DarmaxWaterQuotePDF";
import SignaturePad from "@/pages/sistemasDeVentas/Repartidor/components/SignaturePad";

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
    <div className={horizontal ? "flex items-center gap-3" : ""}>
        <label className={`block text-xs font-bold text-gray-700 dark:text-gray-300 ${horizontal ? "min-w-fit mb-0" : "mb-1"}`}>{label}</label>
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
    cliente: { nombre: "", telefono: "", correo: "", cp: "" },
    costos: { 
        modelo: 0, 
        modeloNombre: "", // Nuevo campo
        tinaco: 0, 
        tinacoNombre: "", // Nuevo campo
        fleteTinacos: 0, 
        viaticos: 0 
    },
    promo: { texto: "", costo: "", imagenUrl: "" },
    firma: "", // Nuevo campo para la firma
  });

  const data = useMemo(() => {
    const toNum = (v) => {
      const n = Number(String(v).replace(/[^\d.]/g, ""));
      return Number.isFinite(n) ? n : 0;
    };
    return {
      ...form,
      costos: {
        ...form.costos,
        modelo: toNum(form.costos.modelo),
        tinaco: toNum(form.costos.tinaco),
        fleteTinacos: toNum(form.costos.fleteTinacos),
        viaticos: toNum(form.costos.viaticos),
      },
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
    }, 800); // Espera 800ms después de dejar de escribir

    return () => clearTimeout(handler);
  }, [data]);

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
  };

  const handleSignatureSave = (signatureData) => {
      setForm(prev => ({ ...prev, firma: signatureData }));
  };

  const handleSignatureClear = () => {
      setForm(prev => ({ ...prev, firma: "" }));
  };

  const doc = <DarmaxWaterQuotePDF data={debouncedData} />;

  return (
    <div className="flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
            <div>
                <h1 className="text-2xl font-black text-gray-800 dark:text-white">Cotizador Darmax</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Genera cotizaciones profesionales en PDF al instante.</p>
            </div>
            <PDFDownloadLink
                document={doc}
                fileName={`Cotizacion-DarmaxAgua-${form.cliente.nombre || "cliente"}.pdf`}
                className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl font-bold shadow-lg shadow-primary/30 transition-all active:scale-95"
            >
                {({ loading }) => (
                    <>
                        <span className="material-symbols-outlined text-xl">download</span>
                        {loading ? "Generando..." : "Descargar PDF"}
                    </>
                )}
            </PDFDownloadLink>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
            {/* Formulario (Izquierda) */}
            <div className="w-full lg:w-1/2 overflow-y-auto custom-scrollbar pr-2 pb-20">
                <div className="space-y-6">
                    
                    {/* Tarjeta: Datos Generales */}
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
                        <SectionTitle>Información General</SectionTitle>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputGroup label="Fecha" value={form.fecha} onChange={onChange("fecha")} horizontal />
                        </div>
                    </div>

                    {/* Tarjeta: Cliente */}
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
                        <SectionTitle>Datos del Cliente</SectionTitle>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputGroup label="Nombre Completo" value={form.cliente.nombre} onChange={onChange("cliente.nombre")} placeholder="Ej. Juan Pérez" horizontal />
                            <InputGroup label="Teléfono" value={form.cliente.telefono} onChange={onChange("cliente.telefono")} placeholder="Ej. 55 1234 5678" horizontal />
                            <InputGroup label="Correo Electrónico" value={form.cliente.correo} onChange={onChange("cliente.correo")} placeholder="juan@email.com" horizontal />
                            <InputGroup label="Código Postal" value={form.cliente.cp} onChange={onChange("cliente.cp")} placeholder="00000" horizontal />
                        </div>
                    </div>

                    {/* Tarjeta: Costos */}
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
                        <SectionTitle>Desglose de Costos (MXN)</SectionTitle>
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InputGroup label="Nombre del Modelo" value={form.costos.modeloNombre} onChange={onChange("costos.modeloNombre")} placeholder="Ej. Darmax 2500" />
                                <InputGroup label="Costo del Modelo" value={form.costos.modelo} onChange={onChange("costos.modelo")} type="number" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InputGroup label="Tipo de Tinaco" value={form.costos.tinacoNombre} onChange={onChange("costos.tinacoNombre")} placeholder="Ej. Tricapa 1100L" />
                                <InputGroup label="Costo del Tinaco" value={form.costos.tinaco} onChange={onChange("costos.tinaco")} type="number" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InputGroup label="Flete (Tinacos)" value={form.costos.fleteTinacos} onChange={onChange("costos.fleteTinacos")} type="number" />
                                <InputGroup label="Viáticos Instalador (2 días)" value={form.costos.viaticos} onChange={onChange("costos.viaticos")} type="number" />
                            </div>
                        </div>
                    </div>

                    {/* Tarjeta: Promoción */}
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
                        <SectionTitle>Promoción o Regalo (Opcional)</SectionTitle>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Descripción de la promoción</label>
                                <textarea
                                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all resize-none h-24"
                                    value={form.promo.texto}
                                    onChange={onChange("promo.texto")}
                                    placeholder="Ej. Incluye 4 garrafones gratis en tu primera compra..."
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InputGroup label="Valor Referencial (MXN)" value={form.promo.costo} onChange={onChange("promo.costo")} type="number" />
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Imagen de Promoción</label>
                                    
                                    {!form.promo.imagenUrl ? (
                                        <div className="flex items-center justify-center w-full">
                                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 transition-all">
                                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                    <span className="material-symbols-outlined text-gray-400 text-3xl mb-2">add_photo_alternate</span>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">Clic para subir imagen</p>
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
                                                                // Update form directly with Base64 string
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
                                        <div className="relative group w-full h-32 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex items-center justify-center">
                                            <img 
                                                src={form.promo.imagenUrl} 
                                                alt="Promo" 
                                                className="h-full object-contain" 
                                            />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <button 
                                                    onClick={() => setForm(prev => ({ ...prev, promo: { ...prev.promo, imagenUrl: "" } }))}
                                                    className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                                                    title="Eliminar imagen"
                                                >
                                                    <span className="material-symbols-outlined text-lg">delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-4 italic">* El valor de la promoción no se suma al total de la cotización.</p>
                    </div>

                    {/* Tarjeta: Firma */}
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
                        <SectionTitle>Firma del Asesor</SectionTitle>
                        {form.firma ? (
                            <div className="flex flex-col items-center">
                                <div className="bg-white p-4 rounded-xl border border-gray-200 dark:border-gray-700 mb-4 w-full">
                                    <img src={form.firma} alt="Firma del Asesor" className="h-32 object-contain mx-auto" />
                                </div>
                                <button 
                                    onClick={handleSignatureClear}
                                    className="text-red-500 hover:text-red-700 font-medium text-sm flex items-center gap-2 transition-colors"
                                >
                                    <span className="material-symbols-outlined">delete</span>
                                    Borrar Firma y Firmar de Nuevo
                                </button>
                            </div>
                        ) : (
                            <SignaturePad onSave={handleSignatureSave} />
                        )}
                    </div>

                </div>
            </div>

            {/* Vista Previa (Derecha - Sticky en Desktop) */}
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