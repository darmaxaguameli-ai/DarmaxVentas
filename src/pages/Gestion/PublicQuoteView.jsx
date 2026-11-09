import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { PDFViewer, PDFDownloadLink } from "@react-pdf/renderer";
import DarmaxWaterQuotePDF from "./components/pdf/DarmaxWaterQuotePDF";
import { fetchPublicCotizacion } from "../../api/apiClient";

export default function PublicQuoteView() {
    const { id } = useParams();
    const [quote, setQuote] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadQuote = async () => {
            try {
                const data = await fetchPublicCotizacion(id);
                setQuote(data);
            } catch (err) {
                console.error("Error loading public quote:", err);
                setError("La cotización no existe o el enlace ha expirado.");
            } finally {
                setLoading(false);
            }
        };
        loadQuote();
    }, [id]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500 font-bold">Cargando cotización...</p>
            </div>
        );
    }

    if (error || !quote) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
                <span className="material-symbols-outlined text-6xl text-red-400 mb-4">error</span>
                <h1 className="text-xl font-black text-gray-800 dark:text-white mb-2">¡Ups!</h1>
                <p className="text-gray-500 text-center max-w-md">{error}</p>
            </div>
        );
    }

    // Adaptar los datos del backend al formato que espera el PDF
    const pdfData = {
        ...quote,
        cliente: {
            nombre: quote.nombreCliente,
            telefono: quote.telefono,
            correo: quote.correo,
            cp: quote.cp
        },
        costos: {
            modelo: quote.modeloPrecio,
            modeloNombre: quote.modeloNombre,
            fleteTinacos: quote.fleteTinacos,
            viaticos: quote.viaticos
        },
        extrasSeleccionados: quote.extras || [],
        promo: {
            texto: quote.promoTexto,
            costo: quote.promoCosto,
            imagenUrl: quote.promoImagen
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-950 p-3 sm:p-5 gap-3 sm:gap-4 overflow-hidden antialiased">
            {/* Cuadro de Cabecera: Título, Subtítulo y Acción de Descarga */}
            <div className="p-4 sm:p-5 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl shadow-xs border border-gray-200/80 dark:border-gray-800/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 flex-shrink-0 transition-all duration-200">
                <div className="space-y-1 min-w-0">
                    <h1 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white tracking-tight leading-tight truncate">
                        Cotización Darmax
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">
                        Folio #{String(quote.folio).padStart(4, '0')} • Validez de {quote.diasValidez} días
                    </p>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                    <PDFDownloadLink
                        document={<DarmaxWaterQuotePDF data={pdfData} />}
                        fileName={`Cotizacion-Darmax-${String(quote.folio).padStart(4, '0')}.pdf`}
                        className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark active:bg-primary-dark text-white px-4 py-2.5 rounded-2xl font-bold shadow-md shadow-primary/25 transition-all active:scale-95 text-xs sm:text-sm text-center select-none w-full sm:w-auto"
                    >
                        {({ loading }) => (
                            <div className="flex items-center gap-2 text-white">
                                <span className="material-symbols-outlined text-lg">download</span>
                                <span>{loading ? "Cargando..." : "Descargar PDF"}</span>
                            </div>
                        )}
                    </PDFDownloadLink>
                </div>
            </div>

            {/* Visualizador de PDF dentro de un cuadro redondeado Bento */}
            <div className="flex-1 min-h-0 bg-white dark:bg-gray-900 rounded-3xl shadow-xs border border-gray-200/80 dark:border-gray-800/80 overflow-hidden">
                <PDFViewer width="100%" height="100%" style={{ border: "none" }} showToolbar={true}>
                    <DarmaxWaterQuotePDF data={pdfData} />
                </PDFViewer>
            </div>
        </div>
    );
}
