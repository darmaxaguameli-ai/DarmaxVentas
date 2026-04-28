import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { PDFViewer } from "@react-pdf/renderer";
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
        <div className="flex flex-col h-screen bg-gray-800">
            {/* Header simple para el cliente */}
            <div className="bg-white dark:bg-gray-900 p-4 shadow-md flex justify-between items-center z-10">
                <div className="flex items-center gap-3">
                    <img src="/logo_nav.ico" alt="Darmax" className="w-8 h-8" />
                    <div>
                        <h1 className="text-sm font-black text-gray-800 dark:text-white uppercase leading-none">Cotización Darmax</h1>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Folio #{String(quote.folio).padStart(4, '0')}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Validez: {quote.diasValidez} días</p>
                </div>
            </div>

            {/* Visualizador de PDF que ocupa el resto de la pantalla */}
            <div className="flex-1 bg-gray-700">
                <PDFViewer width="100%" height="100%" style={{ border: "none" }} showToolbar={true}>
                    <DarmaxWaterQuotePDF data={pdfData} />
                </PDFViewer>
            </div>
        </div>
    );
}
