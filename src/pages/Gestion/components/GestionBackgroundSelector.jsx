import { useState, useEffect, useRef, useMemo } from "react";
import { triggerHaptic } from "../../../utils/haptics";

export const BACKGROUND_PRESETS = [
  // 🎨 COLORES SÓLIDOS & TONOS PASTELES SUAVES (ALTO CONFORT VISUAL Y GLASSMORPHISM)
  {
    id: "solid-light-ice",
    name: "Claro Hielo / Neutro",
    badge: "Neutro Favorito",
    category: "Colores Sólidos",
    description: "Fondo claro neutro, pulcro, suave y minimalista que no cansa la vista",
    type: "color",
    color: "#E2E8F0",
    tagColor: "text-slate-800 bg-slate-200/90 dark:bg-slate-800 dark:text-slate-200",
  },
  {
    id: "solid-cream-yellow",
    name: "Amarillo Cremita",
    badge: "Pastel Cálido",
    category: "Colores Sólidos",
    description: "Tono pastel crema y vainilla cálido, suave y de gran confort visual",
    type: "color",
    color: "#FDF2B8",
    tagColor: "text-amber-900 bg-amber-200/90 dark:bg-amber-950/70 dark:text-amber-300",
  },
  {
    id: "solid-sky-pastel",
    name: "Azul Cielo Pastel",
    badge: "Pastel Agua",
    category: "Colores Sólidos",
    description: "Azul bruma muy suave y cristalino, fresco y armónico",
    type: "color",
    color: "#E0F2FE",
    tagColor: "text-sky-800 bg-sky-200/90 dark:bg-sky-950/70 dark:text-sky-300",
  },
  {
    id: "solid-sage-pastel",
    name: "Verde Salvia Pastel",
    badge: "Pastel Botánico",
    category: "Colores Sólidos",
    description: "Tono salvia menta muy suave, orgánico y reconfortante",
    type: "color",
    color: "#DCFCE7",
    tagColor: "text-emerald-800 bg-emerald-200/90 dark:bg-emerald-950/70 dark:text-emerald-300",
  },
  {
    id: "solid-lavender-pastel",
    name: "Lavanda / Lila Pastel",
    badge: "Pastel Sereno",
    category: "Colores Sólidos",
    description: "Lila pastel tenue que da un toque moderno, relajante y limpio",
    type: "color",
    color: "#EDE9FE",
    tagColor: "text-purple-800 bg-purple-200/90 dark:bg-purple-950/70 dark:text-purple-300",
  },
  {
    id: "solid-peach-pastel",
    name: "Durazno Pastel",
    badge: "Pastel Cálido",
    category: "Colores Sólidos",
    description: "Tono durazno suave y luminoso con gran sensación acogedora",
    type: "color",
    color: "#FFEDD5",
    tagColor: "text-orange-800 bg-orange-200/90 dark:bg-orange-950/70 dark:text-orange-300",
  },
  {
    id: "solid-sand-neutral",
    name: "Arena / Lino Neutro",
    badge: "Neutro Cálido",
    category: "Colores Sólidos",
    description: "Blanco lino cálido mate para una lectura limpia sin reflejos",
    type: "color",
    color: "#F5F5F4",
    tagColor: "text-stone-800 bg-stone-200/90 dark:bg-stone-800 dark:text-stone-300",
  },
  {
    id: "solid-darmax-blue",
    name: "Azul Darmax Clásico",
    badge: "Marca Sólida",
    category: "Colores Sólidos",
    description: "Azul institucional limpio y vibrante para presencia corporativa",
    type: "color",
    color: "#137FEC",
    tagColor: "text-blue-700 bg-blue-100 dark:bg-blue-950/70 dark:text-blue-300",
  },
  {
    id: "solid-slate-dark",
    name: "Pizarra / Carbón",
    badge: "Sólido Oscuro",
    category: "Colores Sólidos",
    description: "Gris carbón neutro y sobrio estilo terminal oscura macOS",
    type: "color",
    color: "#1E293B",
    tagColor: "text-gray-700 bg-gray-100 dark:bg-gray-800 dark:text-gray-300",
  },

  // 🌿 FONDOS FOTOGRÁFICOS DE OFICINA & PLANTAS
  {
    id: "office-plants",
    name: "Oficina con Plantas",
    badge: "Biofílico",
    category: "Oficinas & Plantas",
    description: "Luz natural, madera cálida y plantas de interior que dan vida al cristal",
    type: "photo",
    url: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=2000&q=80",
    thumb: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=400&q=70",
    tagColor: "text-emerald-700 bg-emerald-100 dark:bg-emerald-950/70 dark:text-emerald-300",
  },
  {
    id: "lounge-plants",
    name: "Lounge & Plantas",
    badge: "Cálido",
    category: "Oficinas & Plantas",
    description: "Ambiente tipo cafetería boutique con plantas colgantes y acabados de madera",
    type: "photo",
    url: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=2000&q=80",
    thumb: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=400&q=70",
    tagColor: "text-green-700 bg-green-100 dark:bg-green-950/70 dark:text-green-300",
  },
  {
    id: "boardroom",
    name: "Sala Ejecutiva",
    badge: "Corporativo",
    category: "Oficinas & Plantas",
    description: "Mesa de juntas moderna, ventanales panorámicos y vegetación",
    type: "photo",
    url: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=2000&q=80",
    thumb: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=400&q=70",
    tagColor: "text-blue-700 bg-blue-100 dark:bg-blue-950/70 dark:text-blue-300",
  },

  // 🏙️ ARQUITECTURA
  {
    id: "nordic-loft",
    name: "Loft Arquitectónico",
    badge: "Espacio Abierto",
    category: "Arquitectura",
    description: "Ventanales amplios, techos altos y diseño moderno contemporáneo",
    type: "photo",
    url: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=2000&q=80",
    thumb: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=400&q=70",
    tagColor: "text-amber-700 bg-amber-100 dark:bg-amber-950/70 dark:text-amber-300",
  },
  {
    id: "minimal-boutique",
    name: "Boutique Minimalista",
    badge: "Luz y Pureza",
    category: "Arquitectura",
    description: "Diseño limpio, detalles botánicos sutiles y arquitectura serena",
    type: "photo",
    url: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=2000&q=80",
    thumb: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=400&q=70",
    tagColor: "text-cyan-700 bg-cyan-100 dark:bg-cyan-950/70 dark:text-cyan-300",
  },

  // 🌊 AGUA & NATURALEZA
  {
    id: "pure-water",
    name: "Agua Cristalina & Sol",
    badge: "Agua Pura",
    category: "Agua & Naturaleza",
    description: "Reflejos de luz solar y agua cristalina en tonos turquesa y azul cielo",
    type: "photo",
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=80",
    thumb: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=70",
    tagColor: "text-teal-700 bg-teal-100 dark:bg-teal-950/70 dark:text-teal-300",
  },

  // 🌌 OSCURO & TECH
  {
    id: "dark-night",
    name: "Noche Ejecutiva",
    badge: "Dark Mode",
    category: "Oscuro & Tech",
    description: "Iluminación cálida tenue, rascacielos y ambiente nocturno sofisticado",
    type: "photo",
    url: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=2000&q=80",
    thumb: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=400&q=70",
    tagColor: "text-purple-700 bg-purple-100 dark:bg-purple-950/70 dark:text-purple-300",
  },

  // 🌀 GRADIENTES
  {
    id: "mesh-water",
    name: "Mesh Acuático Líquido",
    badge: "Darmax Puro",
    category: "Gradientes",
    description: "Orbes de luz líquida y cáusticas vectoriales 100% dinámicas en código",
    type: "gradient",
    thumb: null,
    tagColor: "text-primary bg-blue-100 dark:bg-blue-950/70 dark:text-blue-300",
  },
];

const CATEGORIES = [
  "Todos",
  "Colores Sólidos",
  "Oficinas & Plantas",
  "Arquitectura",
  "Agua & Naturaleza",
  "Oscuro & Tech",
  "Gradientes",
];

const GestionBackgroundSelector = ({ activePreset, onSelectPreset }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Colores Sólidos");
  const [customColor, setCustomColor] = useState("#137FEC");
  const [customUrlInput, setCustomUrlInput] = useState("");
  const [showTools, setShowTools] = useState(false);
  const modalRef = useRef(null);

  // Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleSelect = (presetId) => {
    triggerHaptic(12);
    onSelectPreset(presetId);
    localStorage.setItem("darmax_gestion_bg", presetId);
    window.dispatchEvent(new CustomEvent("darmax_bg_change", { detail: presetId }));
  };

  const handleCustomColorApply = (hex) => {
    triggerHaptic(12);
    setCustomColor(hex);
    const colorId = `color:${hex}`;
    onSelectPreset(colorId);
    localStorage.setItem("darmax_gestion_bg", colorId);
    window.dispatchEvent(new CustomEvent("darmax_bg_change", { detail: colorId }));
  };

  const handleApplyCustomUrl = (e) => {
    e.preventDefault();
    if (!customUrlInput.trim()) return;
    triggerHaptic(15);
    onSelectPreset(`custom:${customUrlInput.trim()}`);
    setCustomUrlInput("");
  };

  const filteredPresets = useMemo(() => {
    if (selectedCategory === "Todos") return BACKGROUND_PRESETS;
    return BACKGROUND_PRESETS.filter((p) => p.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <>
      {/* Botón flotante para abrir selector de fondo */}
      <button
        type="button"
        onClick={() => {
          triggerHaptic(10);
          setIsOpen((prev) => !prev);
        }}
        aria-label="Cambiar fondo de pantalla"
        className="flex items-center gap-1.5 h-10 sm:h-11 px-3 sm:px-3.5 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all text-gray-700 dark:text-gray-200 hover:text-primary dark:hover:text-primary cursor-pointer select-none"
        title="Cambiar fondo de pantalla de Gestión"
      >
        <span className="material-symbols-outlined text-lg text-emerald-600 dark:text-emerald-400">
          palette
        </span>
        <span className="hidden sm:inline text-xs font-semibold">Fondo</span>
      </button>

      {/* Modal flotante de selección de fondos */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Caja de contenido Glassmorphic */}
          <div
            ref={modalRef}
            className="relative w-full max-w-2xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-3xl rounded-3xl p-5 sm:p-6 shadow-2xl border border-white/80 dark:border-white/10 z-10 flex flex-col max-h-[88vh]"
          >
            {/* Header del Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-primary dark:text-blue-400 flex items-center justify-center shadow-xs">
                  <span className="material-symbols-outlined text-2xl">palette</span>
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight text-gray-900 dark:text-white">
                    Fondos & Colores Glassmorphism
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Elige colores estáticos, oficinas con plantas o gradientes ({BACKGROUND_PRESETS.length} opciones)
                  </p>
                </div>
              </div>

              {/* Botón cerrar */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-white bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all cursor-pointer"
                aria-label="Cerrar selector"
              >
                <span className="material-symbols-outlined text-base font-bold">close</span>
              </button>
            </div>

            {/* Categorías / Filtros rápidos */}
            <div className="flex items-center gap-1.5 py-3 overflow-x-auto [scrollbar-width:none] flex-shrink-0 border-b border-gray-100 dark:border-gray-800/60">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    triggerHaptic(8);
                    setSelectedCategory(cat);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer active:scale-95 ${
                    selectedCategory === cat
                      ? "bg-primary text-white shadow-xs shadow-primary/20"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Grid de presets con scroll */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 overflow-y-auto p-1 my-3 flex-1 [scrollbar-width:thin]">
              {filteredPresets.map((preset) => {
                const isSelected = activePreset === preset.id;
                return (
                  <div
                    key={preset.id}
                    onClick={() => handleSelect(preset.id)}
                    className={`relative p-3 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between group active:scale-[0.98] ${
                      isSelected
                        ? "bg-primary/5 dark:bg-primary/10 border-primary ring-2 ring-primary/30 shadow-md shadow-primary/10"
                        : "bg-white/70 dark:bg-gray-800/60 border-gray-200/80 dark:border-gray-700/80 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md"
                    }`}
                  >
                    {/* Preview visual */}
                    <div className="relative w-full h-28 rounded-xl overflow-hidden mb-2.5 bg-slate-100 dark:bg-slate-800 shadow-inner flex items-center justify-center">
                      {preset.type === "color" ? (
                        /* Previsualización de color estático con tarjeta de cristal simulada */
                        <div
                          className="w-full h-full flex items-center justify-center p-3 relative"
                          style={{ backgroundColor: preset.color }}
                        >
                          {/* Mini panel de cristal de muestra */}
                          <div className="w-full h-14 rounded-xl bg-white/75 dark:bg-gray-900/80 backdrop-blur-md border border-white/50 dark:border-white/20 shadow-md flex items-center justify-between px-3">
                            <span className="text-[11px] font-bold text-gray-800 dark:text-white">
                              Efecto Cristal
                            </span>
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-black/10 dark:bg-white/10 text-gray-700 dark:text-gray-200">
                              {preset.color}
                            </span>
                          </div>
                        </div>
                      ) : preset.type === "photo" && preset.thumb ? (
                        <img
                          src={preset.thumb}
                          alt={preset.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-cyan-400 via-primary to-blue-700 relative overflow-hidden flex items-center justify-center">
                          <div className="w-20 h-20 rounded-full bg-cyan-200/40 blur-xl absolute -top-4 -left-4 animate-pulse" />
                          <div className="w-24 h-24 rounded-full bg-blue-300/30 blur-xl absolute -bottom-4 -right-4" />
                          <span className="material-symbols-outlined text-white/80 text-3xl">water_drop</span>
                        </div>
                      )}

                      {/* Badge sobre la imagen/color */}
                      <span
                        className={`absolute top-2 left-2 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full backdrop-blur-md shadow-xs ${preset.tagColor}`}
                      >
                        {preset.badge}
                      </span>

                      {/* Checkmark si está activo */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shadow-md animate-in zoom-in-50 duration-150">
                          <span className="material-symbols-outlined text-sm font-black">check</span>
                        </div>
                      )}
                    </div>

                    {/* Texto descriptivo */}
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {preset.name}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] font-extrabold text-primary uppercase tracking-wider">
                            Activo
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">
                        {preset.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer con Selector de Color Libre y URL personalizada */}
            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex-shrink-0 space-y-2.5">
              {showTools ? (
                <div className="space-y-3 bg-gray-50 dark:bg-gray-800/60 p-3 rounded-2xl border border-gray-200/80 dark:border-gray-700/60">
                  {/* Selector de Color Hexadecimal Libre */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={customColor}
                        onChange={(e) => handleCustomColorApply(e.target.value)}
                        className="w-9 h-9 rounded-xl border-0 cursor-pointer p-0 bg-transparent"
                        title="Selecciona cualquier color libre"
                      />
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
                        Elige tu color libre ({customColor})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCustomColorApply(customColor)}
                      className="px-3 py-1.5 text-xs font-bold rounded-xl bg-primary text-white cursor-pointer"
                    >
                      Aplicar Color
                    </button>
                  </div>

                  {/* Input de URL de imagen */}
                  <form onSubmit={handleApplyCustomUrl} className="flex gap-2">
                    <input
                      type="url"
                      value={customUrlInput}
                      onChange={(e) => setCustomUrlInput(e.target.value)}
                      placeholder="Pega la URL de una foto propia (https://...)"
                      className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900 cursor-pointer"
                    >
                      Usar URL
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowTools(false)}
                      className="px-2.5 py-1.5 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 cursor-pointer"
                    >
                      Cerrar
                    </button>
                  </form>
                </div>
              ) : (
                <div className="flex items-center justify-between text-[11px] text-gray-400 dark:text-gray-500">
                  <button
                    type="button"
                    onClick={() => setShowTools(true)}
                    className="flex items-center gap-1.5 text-primary hover:underline font-semibold cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">colorize</span>
                    ¿Quieres otro color o tu propia foto? Clic aquí
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  >
                    Listo
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GestionBackgroundSelector;
