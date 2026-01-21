import React, { useMemo, useState } from "react";
import { PRODUCTS_BY_PROVIDER, PROVIDERS } from "../catalog/catalogIndex";

const LETTER_BG_URL = "/template/coti_darm.jpg";

function HojaA4({ children }) {
  return (
    <div className="w-full flex justify-center">
      <div
        className="relative bg-white shadow-lg"
        style={{
          width: "210mm",
          minHeight: "297mm",
          backgroundImage: `url(${LETTER_BG_URL})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Zona segura para no tapar header/footer del membrete */}
        <div
          className="absolute inset-0"
          style={{
            paddingTop: "38mm",
            paddingBottom: "28mm",
            paddingLeft: "18mm",
            paddingRight: "18mm",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

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

export default function CotizadorDistribuidores() {
  const [mode, setMode] = useState("cotizacion"); // cotizacion | pedido
  const [providerFilter, setProviderFilter] = useState("ferisa"); // ferisa | china

  const PRODUCTS = PRODUCTS_BY_PROVIDER[providerFilter] ?? [];
  const providerLabel = useMemo(() => {
    return PROVIDERS.find((p) => p.id === providerFilter)?.label ?? providerFilter;
  }, [providerFilter]);

  const [selected, setSelected] = useState([]); // [{productId, qty}]
  const [cliente, setCliente] = useState("");
  const [referencia, setReferencia] = useState("");

  const selectedExpanded = useMemo(() => {
    const byId = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));
    return selected
      .map((s) => {
        const product = byId[s.productId];
        if (!product) return null;
        return { ...s, product };
      })
      .filter(Boolean);
  }, [selected, PRODUCTS]);

  // ✅ Como catálogos están separados, esto siempre genera 1 hoja: la del proveedor seleccionado
  const groupedByProvider = useMemo(() => {
    const items = selectedExpanded.map(({ product, qty }) => {
      const prov = product.proveedores?.[providerFilter];
      return {
        productId: product.id,
        internoNombre: product.internoNombre,
        unidad: product.unidad,
        qty,
        proveedorNombre: prov?.nombre ?? "-",
        clave: prov?.clave ?? prov?.sku ?? "-",
        precio: prov?.precio ?? 0,
      };
    });

    return items.length ? [{ providerId: providerFilter, items }] : [];
  }, [selectedExpanded, providerFilter]);

  const addProduct = (productId) => {
    setSelected((prev) => {
      if (prev.some((x) => x.productId === productId)) return prev;
      return [...prev, { productId, qty: 1 }];
    });
  };

  const removeProduct = (productId) => {
    setSelected((prev) => prev.filter((x) => x.productId !== productId));
  };

  const setQty = (productId, qty) => {
    setSelected((prev) =>
      prev.map((x) =>
        x.productId === productId ? { ...x, qty: Math.max(1, Number(qty || 1)) } : x
      )
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cotizador · {providerLabel}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Cotización muestra precios. Pedido oculta precios (opcional).
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-primary focus:border-primary"
            value={mode}
            onChange={(e) => setMode(e.target.value)}
          >
            <option value="cotizacion">Cotización (con precios)</option>
            <option value="pedido">Pedido (sin precios)</option>
          </select>

          <select
            className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-primary focus:border-primary"
            value={providerFilter}
            onChange={(e) => {
              const next = e.target.value;
              setProviderFilter(next);
              setSelected([]); // ✅ reset directo por acción del usuario (sin effect)
            }}
          >
            {PROVIDERS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Datos generales */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="border rounded-2xl p-4 space-y-3">
          <div className="font-semibold">Datos</div>

          <label className="block">
            <div className="text-sm text-black/70 mb-1">Cliente</div>
            <input
              className="w-full border rounded-lg px-3 py-2"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              placeholder="Ej: SOLUCIONES ESTRATEGICAS MAXDAR"
            />
          </label>

          <label className="block">
            <div className="text-sm text-black/70 mb-1">Referencia / Folio interno</div>
            <input
              className="w-full border rounded-lg px-3 py-2"
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
              placeholder="Ej: Pedido #, proyecto, etc."
            />
          </label>
        </div>

        {/* Selector de productos */}
        <div className="border rounded-2xl p-4">
          <div className="font-semibold mb-3">Catálogo (interno → {providerLabel})</div>
          <div className="space-y-2">
            {PRODUCTS.map((p) => {
              const isSelected = selected.some((x) => x.productId === p.id);
              const prov = p.proveedores?.[providerFilter];
              const clave = prov?.clave ?? prov?.sku ?? "";
              const nombre = prov?.nombre ?? "";
              const precio = prov?.precio ?? 0;

              return (
                <div key={p.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{p.internoNombre}</div>
                    <div className="text-xs text-black/60 truncate">
                      {clave ? `${clave} · ` : ""}
                      {nombre}
                      {" · "}
                      {money(precio)}
                    </div>
                  </div>
                  <button
                    className={`px-3 py-1.5 rounded-lg border ${
                      isSelected ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    disabled={isSelected}
                    onClick={() => addProduct(p.id)}
                  >
                    Agregar
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Seleccionados */}
      <div className="border rounded-2xl p-4">
        <div className="font-semibold mb-3">Seleccionados</div>
        {selectedExpanded.length === 0 ? (
          <div className="text-sm text-black/60">Aún no agregas productos.</div>
        ) : (
          <div className="space-y-2">
            {selectedExpanded.map((s) => (
              <div key={s.productId} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-medium truncate">{s.product.internoNombre}</div>
                  <div className="text-xs text-black/60">{s.product.unidad}</div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    className="w-24 border rounded-lg px-2 py-1"
                    value={s.qty}
                    onChange={(e) => setQty(s.productId, e.target.value)}
                  />
                  <button
                    className="px-3 py-1.5 rounded-lg border"
                    onClick={() => removeProduct(s.productId)}
                  >
                    Quitar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hoja por proveedor seleccionado */}
      <div className="space-y-10">
        {groupedByProvider.length === 0 ? (
          <div className="text-sm text-black/60">Selecciona productos para generar la hoja.</div>
        ) : (
          groupedByProvider.map(({ providerId, items }) => {
            const total = items.reduce((acc, it) => acc + (it.precio || 0) * it.qty, 0);

            return (
              <HojaA4 key={providerId}>
                <div className="h-full grid grid-rows-3 gap-4">
                  <Seccion
                    titulo={`1) Datos generales · ${
                      mode === "cotizacion" ? "Cotización" : "Pedido"
                    } · ${providerLabel}`}
                  >
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-xs text-black/60">Cliente</div>
                        <div className="font-medium">{cliente || "____________________"}</div>
                      </div>
                      <div>
                        <div className="text-xs text-black/60">Referencia</div>
                        <div className="font-medium">{referencia || "____________________"}</div>
                      </div>
                      <div>
                        <div className="text-xs text-black/60">Fecha</div>
                        <div className="font-medium">{new Date().toLocaleDateString()}</div>
                      </div>
                    </div>
                  </Seccion>

                  <Seccion titulo={`2) Productos (nombre ${providerLabel})`}>
                    <div className="space-y-2">
                      {items.map((it) => {
                        const importe = (it.precio || 0) * it.qty;
                        return (
                          <div
                            key={`${providerId}-${it.productId}`}
                            className="grid grid-cols-12 gap-2 border-b border-black/10 pb-1"
                          >
                            <div className="col-span-2">
                              <div className="text-xs text-black/60">Clave/SKU</div>
                              <div className="font-medium">{it.clave}</div>
                            </div>

                            <div className="col-span-5 min-w-0">
                              <div className="text-xs text-black/60">Descripción</div>
                              <div className="font-medium truncate">{it.proveedorNombre}</div>
                              <div className="text-xs text-black/50 truncate">
                                Ref interna: {it.internoNombre}
                              </div>
                            </div>

                            <div className="col-span-1 text-right">
                              <div className="text-xs text-black/60">Cant</div>
                              <div className="font-medium">{it.qty}</div>
                            </div>

                            <div className="col-span-2 text-right">
                              {mode === "cotizacion" ? (
                                <>
                                  <div className="text-xs text-black/60">P/U</div>
                                  <div className="font-medium">{money(it.precio)}</div>
                                </>
                              ) : (
                                <div className="text-xs text-black/60">P/U oculto</div>
                              )}
                            </div>

                            <div className="col-span-2 text-right">
                              {mode === "cotizacion" ? (
                                <>
                                  <div className="text-xs text-black/60">Importe</div>
                                  <div className="font-semibold">{money(importe)}</div>
                                </>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Seccion>

                  <Seccion titulo="3) Totales / Notas">
                    {mode === "cotizacion" ? (
                      <div className="flex items-center justify-between">
                        <div className="text-sm">Total</div>
                        <div className="text-lg font-semibold">{money(total)}</div>
                      </div>
                    ) : (
                      <div className="text-lg font-semibold">Pedido (sin precios)</div>
                    )}

                    <div className="mt-3 text-xs text-black/60">
                      Notas: ________________________________________________________________
                    </div>
                    <div className="mt-2 text-xs text-black/60">
                      Entrega/Condiciones: _________________________________________________
                    </div>
                  </Seccion>
                </div>
              </HojaA4>
            );
          })
        )}
      </div>
    </div>
  );
}
