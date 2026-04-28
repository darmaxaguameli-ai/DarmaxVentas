import React, { useMemo, useState, useEffect } from "react";
import { PDFDownloadLink, PDFViewer, pdf } from "@react-pdf/renderer";
import DarmaxWaterQuotePDF from "./components/pdf/DarmaxWaterQuotePDF";
import SignaturePad from "@/pages/sistemasDeVentas/Repartidor/components/SignaturePad";
import { createCotizacion, updateCotizacion, fetchCotizacionByFolio, fetchCotizacionesByCliente, fetchCotizaciones, deleteCotizacion } from "../../api/apiClient";
import Swal from "sweetalert2";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "@/date-picker.css"; // Estilos personalizados para el DatePicker

const todayMX = () => {
  return new Date();
};

function money(n) {
    const num = Number(n || 0);
    return `$${num.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

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
            onFocus={(e) => (type === "number" || value === 0 || value === "0") && e.target.select()}
        />
    </div>
);

const ResultsModal = ({ results, isLoading, title, onClose, onSelect, onDelete }) => {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-[9999] p-0 sm:p-4">
      <div className="bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
            <h2 className="text-lg font-black text-gray-800 dark:text-white uppercase tracking-tight">{title || "Cotizaciones Encontradas"}</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                <span className="material-symbols-outlined text-gray-400">close</span>
            </button>
        </div>
        
        <div className="overflow-y-auto flex-1 p-4 custom-scrollbar">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-sm text-gray-500 font-bold">Cargando cotizaciones...</p>
                </div>
            ) : results.length === 0 ? (
                <div className="text-center py-12">
                    <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">search_off</span>
                    <p className="text-sm text-gray-500 font-bold">No se encontraron cotizaciones.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                        <thead className="bg-gray-50 dark:bg-gray-800/50">
                            <tr>
                                <th className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Folio</th>
                                <th className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Cliente</th>
                                <th className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Fecha</th>
                                <th className="px-4 py-3 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {results.map((quote) => (
                                <tr key={quote.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <span className="text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                                            #{String(quote.folio).padStart(4, '0')}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="text-sm font-bold text-gray-800 dark:text-gray-100">{quote.nombreCliente}</div>
                                        <div className="text-[10px] text-gray-400 truncate max-w-[150px]">Asesor: {quote.nombreAsesor || 'N/A'}</div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">
                                            {new Date(quote.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-right space-x-2">
                                        <button 
                                            onClick={() => onSelect(quote)} 
                                            className="p-1.5 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg hover:bg-blue-100 transition-colors"
                                            title="Cargar"
                                        >
                                            <span className="material-symbols-outlined text-sm">open_in_new</span>
                                        </button>
                                        <button 
                                            onClick={() => onDelete(quote.id)} 
                                            className="p-1.5 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-lg hover:bg-red-100 transition-colors"
                                            title="Borrar"
                                        >
                                            <span className="material-symbols-outlined text-sm">delete</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
        
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800">
            <button
                onClick={onClose}
                className="w-full bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 py-3 rounded-xl font-bold border border-gray-200 dark:border-gray-700 active:scale-95 transition-all text-sm"
            >
                Cerrar
            </button>
        </div>
      </div>
    </div>
  );
};

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
  const [searchResults, setSearchResults] = useState([]);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [loadingResults, setLoadingResults] = useState(false);
  const [modalTitle, setModalTitle] = useState("");

  // Cargar catálogo completo de extras al montar el componente
  useEffect(() => {
    const fetchAllExtras = async () => {
      setLoadingExtras(true);
      try {
        const response = await fetch('https://darmaxagua.com.mx/api/configurador/extras');
        if (!response.ok) throw new Error('Error al cargar catálogo de extras');
        const data = await response.json();
        
        // Eliminar duplicados por ID
        const uniqueExtras = data.reduce((acc, current) => {
          const x = acc.find(item => item.id === current.id);
          if (!x) {
            return acc.concat([current]);
          } else {
            return acc;
          }
        }, []);

        setExtrasDisponibles(uniqueExtras);
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
    }, 350); 

    return () => clearTimeout(handler);
  }, [data]);

  const pdfData = useMemo(() => ({
      ...debouncedData,
      folio: savedQuote?.folio || null
  }), [debouncedData, savedQuote]);

  const onChange = (path) => (e) => {
    setSavedQuote(null);
    let value = e.target.value;

    if (path === "cliente.telefono") {
        value = formatPhoneNumber(value);
    }

    // Si el valor empieza con 0 y tiene mÃ¡s de un dÃ­gito, y no es un decimal (0.), quitar el 0 inicial
    if (value.length > 1 && value.startsWith("0") && !value.startsWith("0.")) {
        value = value.replace(/^0+/, '');
        if (value === "") value = "0";
    }

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
      setSavedQuote(null);
  };

  const handleSignatureClear = () => {
      setForm(prev => ({ ...prev, firma: "" }));
      setSavedQuote(null);
  };

  const handleNewQuote = () => {
    setSavedQuote(null);
    setForm({
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
    Swal.fire("Limpiado", "Puedes crear una nueva cotización.", "info");
  };

  const handleOpenFolioList = async () => {
      setModalTitle("Todas las Cotizaciones");
      setShowResultsModal(true);
      setLoadingResults(true);
      try {
          const data = await fetchCotizaciones();
          setSearchResults(data);
      } catch (error) {
          Swal.fire("Error", "No se pudieron cargar las cotizaciones.", "error");
      } finally {
          setLoadingResults(false);
      }
  };

  const handleDeleteQuote = async (id) => {
      const result = await Swal.fire({
          title: '¿Estás seguro?',
          text: "¡No podrás revertir esto!",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Sí, ¡bórralo!',
          cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
          try {
              await deleteCotizacion(id);
              Swal.fire('¡Borrado!', 'La cotización ha sido borrada.', 'success');
              setSearchResults(prev => prev.filter(q => q.id !== id));
          } catch (error) {
              Swal.fire('Error', 'No se pudo borrar la cotización.', 'error');
          }
      }
  };

  const handleSelectQuote = (quote) => {
    setForm({
      fecha: new Date(quote.fecha),
      diasValidez: String(quote.diasValidez),
      nombreAsesor: quote.nombreAsesor || "",
      cliente: {
        nombre: quote.nombreCliente || "",
        telefono: quote.telefono || "",
        correo: quote.correo || "",
        cp: quote.cp || "",
      },
      costos: {
        modelo: quote.modeloPrecio || 0,
        modeloNombre: quote.modeloNombre || "",
        fleteTinacos: quote.fleteTinacos || 0,
        viaticos: quote.viaticos || 0,
      },
      extrasSeleccionados: quote.extras || [],
      promo: {
        texto: quote.promoTexto || "",
        costo: quote.promoCosto || "",
        imagenUrl: quote.promoImagen || "",
      },
      firma: quote.firma || "",
    });
    setSavedQuote(quote);
    setShowResultsModal(false);
    Swal.fire("Cargado", `Cotización con Folio ${String(quote.folio).padStart(4, '0')} cargada.`, "success");
  };

  const handleSendWhatsApp = async (quoteData) => {
    const telefono = quoteData.cliente.telefono.replace(/\s/g, "");
    if (!telefono || telefono.length < 10) {
        Swal.fire("Error", "El cliente no tiene un número de teléfono válido.", "error");
        return;
    }

    const folioStr = quoteData.folio ? `#${String(quoteData.folio).padStart(4, '0')}` : "(Borrador)";
    const total = quoteData.costos.modelo + quoteData.costos.fleteTinacos + quoteData.costos.viaticos + quoteData.totalExtras;
    
    // Generar el link público si tenemos el ID (la cotización debe estar guardada)
    const publicLink = quoteData.id ? `${window.location.origin}/cotizacion/ver/${quoteData.id}` : null;
    
    let mensaje = `¡Hola *${quoteData.cliente.nombre}*! 👋\nTe envío la cotización de *Darmax Agua* con Folio *${folioStr}* por un total de *${money(total)}*.\n\n`;
    if (publicLink) {
        mensaje += `📄 *Puedes verla aquí:* ${publicLink}\n\n`;
    }
    mensaje += `Quedamos a tus órdenes. ✨`;

    Swal.fire({
        title: 'Preparando envío...',
        text: 'Generando PDF y conectando con WhatsApp',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    try {
        const blob = await pdf(<DarmaxWaterQuotePDF data={quoteData} />).toBlob();
        const cleanName = quoteData.cliente.nombre.replace(/[^a-zA-Z0-9]/g, "_");
        const fileName = `Cotizacion_Darmax_${cleanName}_${quoteData.folio || 'Borrador'}.pdf`;
        const file = new File([blob], fileName, { type: "application/pdf" });

        Swal.close();

        // Intentar compartir el archivo directamente (mejor para móviles)
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    files: [file],
                    title: `Cotización Darmax ${folioStr}`,
                    text: mensaje,
                });
                return;
            } catch (shareError) {
                console.error("Error en navigator.share:", shareError);
            }
        }

        // Fallback para Desktop o si navigator.share falla
        // Descargar el archivo primero
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        const encodedMessage = encodeURIComponent(mensaje);
        const whatsappUrl = `https://wa.me/52${telefono}?text=${encodedMessage}`;
        
        Swal.fire({
            title: 'PDF Descargado',
            html: `
                <div class="text-left text-sm space-y-2">
                    <p>1. Hemos descargado el PDF en tu equipo.</p>
                    <p>2. El link de visualización rápida ya va en el mensaje.</p>
                    <p>3. En computadoras, debes adjuntar el archivo manualmente si el cliente prefiere el PDF directo.</p>
                </div>
            `,
            icon: 'info',
            confirmButtonText: 'Ir a WhatsApp',
            showCancelButton: true,
            cancelButtonText: 'Cerrar'
        }).then((result) => {
            if (result.isConfirmed) {
                window.open(whatsappUrl, "_blank");
            }
        });

    } catch (error) {
        console.error("Error al preparar WhatsApp:", error);
        Swal.fire("Error", "No se pudo generar el PDF para enviar.", "error");
    }
  };

  const handleSaveQuote = async () => {
      if (!form.cliente.nombre) {
          Swal.fire("Error", "El nombre del cliente es obligatorio para guardar.", "error");
          return;
      }

      const quoteToSave = { ...data, diasValidez: form.diasValidez };

      if (savedQuote?.id) {
          const result = await Swal.fire({
              title: '¿Qué deseas hacer?',
              text: `La cotización con Folio ${String(savedQuote.folio).padStart(4, '0')} ya existe.`,
              icon: 'question',
              showCancelButton: true,
              showDenyButton: true,
              confirmButtonText: 'Actualizar Existente',
              denyButtonText: 'Generar Nueva',
              cancelButtonText: 'Cancelar',
              confirmButtonColor: '#3085d6',
              denyButtonColor: '#28a745',
          });

          if (result.isConfirmed) {
              // Actualizar
              setIsSaving(true);
              try {
                  const response = await updateCotizacion(savedQuote.id, quoteToSave);
                  const updatedData = { ...quoteToSave, folio: response.folio };
                  setSavedQuote(response);
                  
                  const sendResult = await Swal.fire({
                      title: "¡Actualizado!",
                      text: `Cotización actualizada. ¿Deseas enviarla por WhatsApp?`,
                      icon: "success",
                      showCancelButton: true,
                      confirmButtonText: "Sí, enviar",
                      cancelButtonText: "No por ahora"
                  });

                  if (sendResult.isConfirmed) handleSendWhatsApp(updatedData);

              } catch (error) {
                  console.error("Error updating quote:", error);
                  Swal.fire("Error", "No se pudo actualizar la cotización.", "error");
              } finally {
                  setIsSaving(false);
              }
              return;
          } else if (result.isDenied) {
              // Generar nueva (continuar al flujo normal de creación)
          } else {
              return; // Cancelado
          }
      }

      // Flujo de creación de nueva cotización
      setIsSaving(true);
      try {
          const response = await createCotizacion(quoteToSave);
          const savedData = { ...quoteToSave, folio: response.folio };
          setSavedQuote(response);
          
          const sendResult = await Swal.fire({
              title: "¡Guardado!",
              text: `Cotización guardada con Folio: ${String(response.folio).padStart(4, '0')}. ¿Deseas enviarla por WhatsApp?`,
              icon: "success",
              showCancelButton: true,
              confirmButtonText: "Sí, enviar",
              cancelButtonText: "No por ahora"
          });

          if (sendResult.isConfirmed) handleSendWhatsApp(savedData);

      } catch (error) {
          console.error("Error saving quote:", error);
          const serverError = error.response?.data?.error || "No se pudo guardar la cotización.";
          const serverDetails = error.response?.data?.details || "";
          
          Swal.fire({
              title: "Error al Guardar",
              html: `<p>${serverError}</p>${serverDetails ? `<p className="text-xs text-gray-400 mt-2">${serverDetails}</p>` : ""}`,
              icon: "error"
          });
      } finally {
          setIsSaving(false);
      }
  };

  const doc = <DarmaxWaterQuotePDF data={pdfData} />;

  // Function to format the phone number as XX XXXX XXXX
  const formatPhoneNumber = (value) => {
    if (!value) return value;
    const phoneNumber = value.replace(/[^\d]/g, ""); // Remove all non-digit characters
    const phoneNumberLength = phoneNumber.length;

    if (phoneNumberLength < 3) return phoneNumber; // 1-2 digits
    if (phoneNumberLength < 7) { // 3-6 digits
      return `${phoneNumber.slice(0, 2)} ${phoneNumber.slice(2)}`;
    } // 7-10 digits
    return `${phoneNumber.slice(0, 2)} ${phoneNumber.slice(2, 6)} ${phoneNumber.slice(6, 10)}`;
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
        {showResultsModal && (
          <ResultsModal 
            results={searchResults}
            isLoading={loadingResults}
            title={modalTitle}
            onClose={() => setShowResultsModal(false)}
            onSelect={handleSelectQuote}
            onDelete={handleDeleteQuote}
          />
        )}
        {/* Header Responsivo */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
            <div>
                <h1 className="text-xl sm:text-2xl font-black text-gray-800 dark:text-white">Cotizador Darmax</h1>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Genera cotizaciones en PDF.</p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto grid grid-cols-2 sm:flex">
                <button
                    onClick={handleNewQuote}
                    className="flex items-center justify-center gap-2 px-3 py-2 sm:px-4 rounded-xl font-bold shadow-md transition-all active:scale-95 text-xs sm:text-sm bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                >
                    <span className="material-symbols-outlined text-lg sm:text-xl">add_circle</span>
                    Nuevo
                </button>
                <button
                    onClick={handleOpenFolioList}
                    className="flex items-center justify-center gap-2 px-3 py-2 sm:px-4 rounded-xl font-bold shadow-md transition-all active:scale-95 text-xs sm:text-sm bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                >
                    <span className="material-symbols-outlined text-lg sm:text-xl">list_alt</span>
                    Ver Folios
                </button>
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

                <button
                    onClick={() => handleSendWhatsApp(pdfData)}
                    className="flex items-center justify-center gap-2 px-3 py-2 sm:px-4 rounded-xl font-bold shadow-md transition-all active:scale-95 text-xs sm:text-sm bg-[#25D366] text-white hover:bg-[#128C7E]"
                    title="Enviar por WhatsApp"
                >
                    <span className="material-symbols-outlined text-lg sm:text-xl">send</span>
                    WhatsApp
                </button>
                <PDFDownloadLink
                    document={doc}
                    fileName={`Cotizacion-DarmaxAgua-${form.cliente.nombre || "cliente"}-${savedQuote?.folio ? String(savedQuote.folio).padStart(4, '0') : "Borrador"}.pdf`}
                    className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark active:bg-primary-dark text-white active:text-white px-3 py-2 sm:px-4 rounded-xl font-bold shadow-lg shadow-primary/30 transition-all active:scale-95 text-xs sm:text-sm text-center select-none touch-none"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                    {({ loading }) => (
                        <div className="flex items-center gap-2 text-white">
                            <span className="material-symbols-outlined text-lg sm:text-xl">download</span>
                            <span className="font-bold">{loading ? "..." : "PDF"}</span>
                        </div>
                    )}
                </PDFDownloadLink>
            </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
            {/* Formulario (Izquierda) */}
            <div className="w-full lg:w-1/2 overflow-y-auto custom-scrollbar pr-1 sm:pr-2 pb-24 lg:pb-20">
                <div className="space-y-4 sm:space-y-6">
                    
                    {/* Tarjeta: Datos Generales */}
                    <div className="bg-white dark:bg-gray-900 p-3 sm:p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
                        <SectionTitle>Información General</SectionTitle>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 sm:min-w-fit sm:mb-0">Fecha</label>
                                <DatePicker
                                    selected={form.fecha}
                                    onChange={(date) => onChange("fecha")({ target: { value: date } })}
                                    dateFormat="dd/MM/yyyy"
                                    className="w-full" // The custom CSS will handle the styling
                                />
                            </div>
                            <InputGroup label="Días Validez" value={form.diasValidez} onChange={onChange("diasValidez")} type="number" horizontal />
                        </div>
                    </div>

                    {/* Tarjeta: Cliente */}
                    <div className="bg-white dark:bg-gray-900 p-3 sm:p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
                        <SectionTitle>Datos del Cliente</SectionTitle>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <InputGroup label="Nombre" value={form.cliente.nombre} onChange={onChange("cliente.nombre")} placeholder="Ej. Juan Pérez" horizontal />
                            <InputGroup label="Teléfono" value={form.cliente.telefono} onChange={onChange("cliente.telefono")} placeholder="55 1234 5678" horizontal />
                            <InputGroup label="Correo" value={form.cliente.correo} onChange={onChange("cliente.correo")} placeholder="juan@email.com" horizontal />
                            <InputGroup label="C.P." value={form.cliente.cp} onChange={onChange("cliente.cp")} placeholder="00000" horizontal />
                        </div>
                    </div>

                    {/* Tarjeta: Costos */}
                    <div className="bg-white dark:bg-gray-900 p-3 sm:p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
                        <SectionTitle>Desglose de Costos (MXN)</SectionTitle>
                        <div className="space-y-4 sm:space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <InputGroup label="Modelo" value={form.costos.modeloNombre} onChange={onChange("costos.modeloNombre")} placeholder="Ej. Darmax 2500" />
                                <InputGroup label="Costo" value={form.costos.modelo} onChange={onChange("costos.modelo")} type="number" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <InputGroup label="Flete de Tinaco" value={form.costos.fleteTinacos} onChange={onChange("costos.fleteTinacos")} type="number" />
                                <InputGroup label="Viatico del instalador" value={form.costos.viaticos} onChange={onChange("costos.viaticos")} type="number" />
                            </div>
                        </div>
                    </div>

                    {/* Tarjeta: Equipamiento Extra */}
                    <div className="bg-white dark:bg-gray-900 p-3 sm:p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
                        <SectionTitle>Equipamiento Extra</SectionTitle>
                        {loadingExtras ? (
                            <p className="text-xs text-gray-500 animate-pulse">Cargando...</p>
                        ) : extrasDisponibles.length > 0 ? (
                            <div className="space-y-4">
                                {[
                                    { 
                                        id: "alcalina", 
                                        title: "Sistema de Agua Alcalina", 
                                        items: extrasDisponibles.filter(ex => ex.code === "agua-alcalina") 
                                    },
                                    { 
                                        id: "tinacos", 
                                        title: "Tinacos (Almacenamiento)", 
                                        items: extrasDisponibles.filter(ex => ex.isTinaco) 
                                    },
                                    { 
                                        id: "otros", 
                                        title: "Otros Componentes", 
                                        items: extrasDisponibles.filter(ex => !ex.isTinaco && ex.code !== "agua-alcalina") 
                                    }
                                ].map((group) => (
                                    group.items.length > 0 && (
                                        <div key={group.id} className="space-y-2">
                                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                                                {group.title}
                                            </h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                                                {group.items.map((extra) => (
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
                                        </div>
                                    )
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-gray-400 italic">Sin extras disponibles.</p>
                        )}
                    </div>

                    {/* Tarjeta: Promoción */}
                    <div className="bg-white dark:bg-gray-900 p-3 sm:p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
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
                    <div className="bg-white dark:bg-gray-900 p-3 sm:p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
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
