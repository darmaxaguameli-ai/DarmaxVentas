import React, { useMemo, useState } from "react";
import { PRODUCTS_BY_PROVIDER, PROVIDERS } from "../catalog/catalogIndex";
import { PDFDownloadLink, PDFViewer } from "@react-pdf/renderer";
import CotizadorDistribuidoresPDF from "../pages/Gestion/components/pdf/CotizadorDistribuidoresPDF";
import Swal from "sweetalert2";
import { createSolicitud, fetchSolicitudByFolio } from "@/api/apiClient";

const todayMX = () => {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = d.getFullYear();
  return `${dd}/${mm}/${yy}`;
};

// Seccion y money se mantienen para su uso general y dentro del PDF
function Seccion({ titulo, children }) {
  return (
    <div className="bg-white/85 border border-black/10 rounded-xl p-4 overflow-hidden">
      <div className="text-sm font-semibold mb-2">{titulo}</div>
      <div className="text-sm">{children}</div>
    </div>
  );
}

function money(n) {
  const num = Number(n || 0);
  return `$${num.toFixed(2)}`;
}

const SectionTitle = ({ children }) => (
    <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-3 border-b border-gray-100 dark:border-gray-700 pb-2">
        {children}
    </h3>
);

const InputGroup = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
        <input
            {...props}
            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
        />
    </div>
);

const ProviderPriceList = ({ products, providerId, onAddToQuote }) => {
    if (!products || products.length === 0) {
        return (
            <div className="text-center py-4">
                <p className="text-gray-400 dark:text-gray-500">No hay productos definidos para este proveedor.</p>
            </div>
        );
    }

    return (
        <div className="overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 max-h-96">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                    <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Producto</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">SKU/Clave</th>
                        <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Precio</th>
                        <th scope="col" className="relative px-4 py-3">
                            <span className="sr-only">Agregar</span>
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {products.map((product) => {
                        const providerDetails = product.proveedores?.[providerId];
                        if (!providerDetails) return null;

                        return (
                            <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                <td className="px-4 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">{product.internoNombre}</div>
                                    <div className="text-xs text-gray-500">{providerDetails.nombre || ''}</div>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{providerDetails.sku || providerDetails.clave}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900 dark:text-white">{money(providerDetails.precio)}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        onClick={() => onAddToQuote(product.id)}
                                        className="text-primary hover:text-primary-dark font-bold text-xs"
                                    >
                                        + AGREGAR
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};


export default function CotizadorDistribuidores() {
  const [mode, setMode] = useState("pedido"); // cotizacion | pedido
  const [providerFilter, setProviderFilter] = useState(PROVIDERS[0]?.id || "jimaja");
  const [searchTerm, setSearchTerm] = useState("");

  const handleProviderChange = (e) => {
    setSavedSolicitud(null);
    setProviderFilter(e.target.value);
    setItemsCotizacion([]); // Limpiar para evitar inconsistencias
  };

  const PRODUCTS = PRODUCTS_BY_PROVIDER[providerFilter] ?? [];

  const filteredProducts = useMemo(() => {
    if (!searchTerm) {
      return PRODUCTS;
    }
    return PRODUCTS.filter(p => {
        const providerDetails = p.proveedores?.[providerFilter];
        const searchTermLower = searchTerm.toLowerCase();

        const internalNameMatch = p.internoNombre.toLowerCase().includes(searchTermLower);
        const providerNameMatch = providerDetails?.nombre?.toLowerCase().includes(searchTermLower);
        const skuMatch = providerDetails?.sku?.toLowerCase().includes(searchTermLower);
        const claveMatch = providerDetails?.clave?.toLowerCase().includes(searchTermLower);

        return internalNameMatch || providerNameMatch || skuMatch || claveMatch;
    });
  }, [PRODUCTS, providerFilter, searchTerm]);

  const providerLabel = useMemo(() => {
    return PROVIDERS.find((p) => p.id === providerFilter)?.label ?? providerFilter;
  }, [providerFilter]);

  // Nuevo estado para los ítems de la cotización
  const [itemsCotizacion, setItemsCotizacion] = useState([]); // [{ id: uniqueId, productId: '...', qty: 1 }]

  const [fecha, setFecha] = useState(todayMX());
  const defaultNotes = "Favor de enviar la facturación al siguiente correo: facturacion@darmaxagua.mx c.c.p. a administracion@darmaxagua.mx";
  const [notes, setNotes] = useState(defaultNotes);

  const [savedSolicitud, setSavedSolicitud] = useState(null); // Almacena la solicitud guardada con folio
  const [isSaving, setIsSaving] = useState(false);
  const [searchFolio, setSearchFolio] = useState("");

  const [billingInfo, setBillingInfo] = useState({
    nombre: "SOLUCIONES ESTRATEGICAS MAXDAR",
    rfc: "SEM240517KF2",
    cp: "57170",
    regimenFiscal: "Régimen Simplificado de Confianza",
  });

  const updateCotizacionItem = (id, field, value) => {
    setSavedSolicitud(null);
    setItemsCotizacion((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };
  
  const handleAddToQuote = (productId) => {
    setSavedSolicitud(null);
    const existingItem = itemsCotizacion.find(item => item.productId === productId);
    if (existingItem) {
        updateCotizacionItem(existingItem.id, 'qty', existingItem.qty + 1);
    } else {
        setItemsCotizacion(prev => [...prev, { id: Date.now(), productId: productId, qty: 1 }]);
    }
  };

  const removeCotizacionItem = (id) => {
    setSavedSolicitud(null);
    setItemsCotizacion((prev) => prev.filter((item) => item.id !== id));
  };

  // Mapear itemsCotizacion a su versión expandida con detalles del producto y proveedor
  const expandedItemsCotizacion = useMemo(() => {
    const byId = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));
    return itemsCotizacion
      .map((item) => {
        const product = byId[item.productId]; // Puede ser undefined si productId está vacío o es inválido

        if (!product || !item.productId) {
          return null; // No debería pasar con el nuevo flujo
        }

        const prov = product.proveedores?.[providerFilter];
        return {
          ...item,
          productDetails: product, // Detalles internos del producto
          proveedorDetails: {
            // Detalles específicos del proveedor
            nombre: prov?.nombre ?? "-",
            clave: prov?.clave ?? prov?.sku ?? "-",
            precio: prov?.precio ?? 0,
          },
        };
      }).filter(Boolean);
  }, [itemsCotizacion, PRODUCTS, providerFilter]);

  // Esta será la lista final de ítems para el PDF
  const finalItemsForPdf = useMemo(() => {
    return expandedItemsCotizacion.map((item) => ({
      productId: item.productId,
      internoNombre: item.productDetails?.internoNombre ?? "-",
      unidad: item.productDetails?.unidad ?? "-",
      qty: item.qty,
      proveedorNombre: item.proveedorDetails.nombre,
      clave: item.proveedorDetails.clave,
      precio: item.proveedorDetails.precio,
    }));
  }, [expandedItemsCotizacion]);

  const handleBillingInfoChange = (field) => (e) => {
    setSavedSolicitud(null);
    setBillingInfo((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleFetchSolicitud = async () => {
    if (!searchFolio) {
      Swal.fire("Error", "Por favor, ingrese un número de folio.", "error");
      return;
    }
    try {
      const solicitud = await fetchSolicitudByFolio(searchFolio);
      setFecha(new Date(solicitud.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' }));
      setBillingInfo(solicitud.billingInfo);
      setNotes(solicitud.notes);
      setProviderFilter(solicitud.providerLabel.toLowerCase()); // Assuming providerLabel is the id
      
      const newItems = solicitud.items.map(item => ({
          id: Date.now() + Math.random(),
          productId: PRODUCTS.find(p => p.internoNombre === item.internoNombre)?.id,
          qty: item.qty,
      }));
      setItemsCotizacion(newItems);

      setSavedSolicitud(solicitud);
      Swal.fire("Cargado", `Solicitud con Folio ${String(solicitud.folio).padStart(4, '0')} cargada.`, "success");
    } catch (error) {
      console.error("Error fetching solicitud by folio:", error);
      Swal.fire("Error", "No se pudo encontrar la solicitud con ese folio.", "error");
    }
  };

  const handleSaveSolicitud = async () => {
    if (!billingInfo.nombre || !billingInfo.rfc) {
      Swal.fire("Error", "El nombre de la empresa y el RFC son obligatorios para guardar la solicitud.", "error");
      return;
    }
    if (finalItemsForPdf.length === 0) {
      Swal.fire("Error", "Debe agregar al menos un producto a la solicitud para guardar.", "error");
      return;
    }

    setIsSaving(true);
    try {
      const solicitudToSave = {
        fecha: new Date(), // Usar fecha del servidor
        billingInfo: billingInfo,
        items: finalItemsForPdf.map(({ internoNombre, unidad, qty, proveedorNombre, clave, precio }) => ({
            internoNombre, unidad, qty, proveedorNombre, clave, precio
        })),
        mode: mode,
        providerLabel: providerLabel,
        notes: notes,
      };
      const response = await createSolicitud(solicitudToSave);
      setSavedSolicitud(response);
      Swal.fire("¡Guardado!", `Solicitud guardada con Folio: ${String(response.folio).padStart(4, '0')}`, "success");
    } catch (error) {
      console.error("Error saving solicitud:", error);
      Swal.fire("Error", "No se pudo guardar la solicitud.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Datos a pasar al PDF
  const pdfData = useMemo(() => ({
    fecha,
    billingInfo,
    items: finalItemsForPdf,
    mode,
    providerLabel,
    notes,
    folio: savedSolicitud?.folio || null, // Folio de la solicitud guardada
  }), [fecha, billingInfo, finalItemsForPdf, mode, providerLabel, notes, savedSolicitud]);

  const doc = <CotizadorDistribuidoresPDF data={pdfData} />;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header Responsivo */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
            <div>
                <h1 className="text-xl sm:text-2xl font-black text-gray-800 dark:text-white">Cotizador para Distribuidores</h1>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    Genera cotizaciones de materiales para proveedores.
                </p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto grid grid-cols-2 sm:flex">
                <button
                    onClick={handleSaveSolicitud}
                    disabled={isSaving}
                    className={`flex items-center justify-center gap-2 px-3 py-2 sm:px-4 rounded-xl font-bold shadow-md transition-all active:scale-95 text-xs sm:text-sm ${
                        savedSolicitud
                        ? "bg-green-100 text-green-700 cursor-default shadow-none border border-green-200"
                        : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                    }`}
                >
                    {isSaving ? (
                        "..."
                    ) : savedSolicitud ? (
                        <>
                            <span className="material-symbols-outlined text-lg sm:text-xl">check</span>
                            <span className="truncate">Folio {String(savedSolicitud.folio).padStart(4, '0')}</span>
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
                    fileName={`Solicitud-Materiales-${billingInfo.nombre || "cliente"}-${savedSolicitud?.folio ? String(savedSolicitud.folio).padStart(4, '0') : "Borrador"}.pdf`}
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
                    {/* Tarjeta: Buscar Folio */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
                        <SectionTitle>Buscar Folio</SectionTitle>
                        <div className="flex items-center gap-3">
                            <InputGroup 
                                label="Número de Folio" 
                                value={searchFolio} 
                                onChange={(e) => setSearchFolio(e.target.value)} 
                                placeholder="Ej. 123"
                                type="number"
                            />
                            <button
                                onClick={handleFetchSolicitud}
                                className="mt-5 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                            >
                                Buscar
                            </button>
                        </div>
                    </div>

                    {/* Solicitud de Productos y Datos Generales */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
                        <SectionTitle>Solicitud de Productos</SectionTitle>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <InputGroup
                                label="Fecha"
                                value={fecha}
                                onChange={(e) => setFecha(e.target.value)}
                            />
                        </div>

                        {/* Datos para Facturación */}
                        <SectionTitle>Datos para Facturación</SectionTitle>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"> {/* gap-3 para reducir el espacio */}
                            <InputGroup
                                label="Empresa"
                                value={billingInfo.nombre}
                                onChange={handleBillingInfoChange("nombre")}
                            />
                            <InputGroup
                                label="RFC"
                                value={billingInfo.rfc}
                                onChange={handleBillingInfoChange("rfc")}
                            />
                            <InputGroup
                                label="C.P."
                                value={billingInfo.cp}
                                onChange={handleBillingInfoChange("cp")}
                            />
                            <InputGroup
                                label="Régimen Fiscal"
                                value={billingInfo.regimenFiscal}
                                onChange={handleBillingInfoChange("regimenFiscal")}
                            />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                        <SectionTitle>Detalle de Productos</SectionTitle>

                        {/* Selector de Proveedor */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Proveedor</label>
                            <select
                                value={providerFilter}
                                onChange={handleProviderChange}
                                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                            >
                                {PROVIDERS.map((p) => (
                                    <option key={p.id} value={p.id}>{p.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Buscador de productos */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Buscar Producto</label>
                            <input
                                type="text"
                                placeholder="Buscar por nombre, clave, SKU..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                            />
                        </div>
                        
                        {/* Lista de Precios del Proveedor */}
                        <div className="mb-6 space-y-3">
                            <h4 className="text-md font-semibold text-gray-800 dark:text-white">Lista de Precios - {providerLabel}</h4>
                            <ProviderPriceList products={filteredProducts} providerId={providerFilter} onAddToQuote={handleAddToQuote} />
                        </div>

                        {/* Productos en la cotización */}
                        <div>
                            <h4 className="text-md font-semibold text-gray-800 dark:text-white mb-3">Productos en la Solicitud</h4>
                            <div className="space-y-4">
                                {expandedItemsCotizacion.length === 0 ? (
                                    <div className="text-center py-4 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                                        <p className="text-gray-400 dark:text-gray-500 text-sm">Agrega productos desde la lista de precios.</p>
                                    </div>
                                ) : (
                                    expandedItemsCotizacion.map((item) => (
                                        <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                                            <div className="flex-1 w-full">
                                                <p className="text-sm font-bold text-gray-900 dark:text-white">{item.productDetails?.internoNombre}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {item.proveedorDetails?.nombre} (Clave: {item.proveedorDetails?.clave})
                                                </p>
                                            </div>
                                            <div className="w-full sm:w-20 flex-shrink-0">
                                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Cant.</label>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-center text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                                                    value={item.qty}
                                                    onChange={(e) => updateCotizacionItem(item.id, "qty", parseInt(e.target.value) || 1)}
                                                />
                                            </div>
                                            {mode === "cotizacion" && item.proveedorDetails.precio > 0 && (
                                                <div className="w-full sm:w-24 flex-shrink-0 text-right">
                                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Importe</label>
                                                    <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                                                        {money(item.qty * item.proveedorDetails.precio)}
                                                    </div>
                                                </div>
                                            )}
                                            <button
                                                className="flex-shrink-0 flex items-center justify-center h-10 w-10 mt-5 rounded-lg border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                onClick={() => removeCotizacionItem(item.id)}
                                                title="Quitar producto"
                                            >
                                                <span className="material-symbols-outlined text-base">delete</span>
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                        <SectionTitle>Notas</SectionTitle>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full h-24 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                            placeholder="Escribe tus notas aquí..."
                        />
                    </div>
                </div>
            </div>

            {/* Vista Previa PDF (Derecha - Sticky en Desktop, oculta en móvil) */}
            <div className="hidden lg:flex flex-col w-1/2 h-full bg-gray-100 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-inner">
                <div className="p-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">visibility</span> Vista Previa
                    </span>
                    <span className="text-[10px] font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-500">Carta</span>
                </div>
                <div className="flex-1 bg-gray-500/10 p-4">
                    {finalItemsForPdf.length === 0 ? (
                        <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">Agrega productos para generar la previsualización del PDF.</div>
                    ) : (
                        <PDFViewer width="100%" height="100%" className="rounded-lg shadow-xl" showToolbar={false}>
                            {doc}
                        </PDFViewer>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
}
