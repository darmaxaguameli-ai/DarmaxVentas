import React from "react";
import { BACKGROUND_PRESETS } from "./GestionBackgroundSelector";

/**
 * GestionWaterBackground
 * Renderiza el fondo activo en Gestión con aplicación instantánea ("de golpe")
 * tanto para colores estáticos pasteles como para fotos y gradientes.
 */
const GestionWaterBackground = ({ activePreset = "solid-light-ice" }) => {
  const isCustomColor = activePreset?.startsWith("color:");
  const customHexColor = isCustomColor ? activePreset.replace(/^color:/, "") : null;

  const isCustomUrl = activePreset?.startsWith("custom:") || activePreset?.startsWith("http");
  const customImgUrl = isCustomUrl ? activePreset.replace(/^custom:/, "") : null;

  const currentPreset = !isCustomColor && !isCustomUrl
    ? BACKGROUND_PRESETS.find((p) => p.id === activePreset) || BACKGROUND_PRESETS[0]
    : null;

  const isColorPreset = currentPreset?.type === "color";
  const activeColor = isCustomColor ? customHexColor : (isColorPreset ? currentPreset.color : null);

  return (
    <div
      className="fixed inset-0 pointer-events-none select-none z-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* 1. Fondo base neutro */}
      <div className="absolute inset-0 bg-slate-100 dark:bg-[#060c16]" />

      {/* 2. Capa de Color Estático / Sólido: APLICACIÓN INMEDIATA ("DE GOLPE") */}
      {activeColor ? (
        <div
          className="absolute inset-0 z-10"
          style={{ backgroundColor: activeColor }}
        >
          {/* Sutil viñeta para realzar el vidrio sin opacar el color */}
          <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/5 to-black/15 dark:via-black/15 dark:to-black/35" />

          {/* Destellos sutiles de luz ambiental para que los bordes de vidrio reboten luz */}
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-white/20 dark:bg-white/10 blur-[90px]" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-black/10 dark:bg-black/25 blur-[90px]" />
        </div>
      ) : (
        <>
          {/* 3. Capas de Fotos HD cuando NO hay un color sólido seleccionado */}
          {BACKGROUND_PRESETS.filter((p) => p.type === "photo").map((preset) => {
            const isCurrent = !isCustomUrl && currentPreset?.id === preset.id;
            return (
              <div
                key={preset.id}
                className={`absolute inset-0 transition-opacity duration-300 ease-in-out ${
                  isCurrent ? "opacity-100 z-10" : "opacity-0 pointer-events-none z-0"
                }`}
              >
                <img
                  src={preset.url}
                  alt={preset.name}
                  className="w-full h-full object-cover object-center filter saturate-[1.1] transform-gpu scale-100"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-white/40 dark:hidden bg-gradient-to-b from-white/60 via-white/20 to-slate-900/25" />
                <div className="hidden dark:block absolute inset-0 bg-black/60 bg-gradient-to-b from-black/60 via-[#071322]/70 to-[#040810]/85" />
              </div>
            );
          })}

          {/* 4. Capa de Imagen Personalizada (Custom URL) */}
          {isCustomUrl && customImgUrl && (
            <div className="absolute inset-0 z-10 opacity-100">
              <img
                src={customImgUrl}
                alt="Fondo Personalizado"
                className="w-full h-full object-cover object-center filter saturate-[1.05] transform-gpu"
                loading="eager"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
              <div className="absolute inset-0 bg-white/45 dark:hidden bg-gradient-to-b from-white/60 via-white/20 to-slate-900/30" />
              <div className="hidden dark:block absolute inset-0 bg-black/65 bg-gradient-to-b from-black/60 via-[#071322]/70 to-[#040810]/85" />
            </div>
          )}

          {/* 5. Mesh Acuático Líquido (Cuando se selecciona 'mesh-water') - Estático y Ultra-optimizado */}
          {currentPreset?.id === "mesh-water" && (
            <div className="absolute inset-0 z-10 opacity-100">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-sky-50/60 to-blue-50/40 dark:from-[#050c16] dark:via-[#081525] dark:to-[#040810]" />
              <div className="absolute -top-28 -left-28 sm:-top-36 sm:-left-36 w-80 sm:w-[560px] lg:w-[680px] h-80 sm:h-[560px] lg:h-[680px] rounded-full bg-cyan-400/15 dark:bg-cyan-500/10 blur-[80px] sm:blur-[120px]" />
              <div className="absolute -bottom-36 -right-28 sm:-bottom-44 sm:-right-36 w-96 sm:w-[600px] lg:w-[740px] h-96 sm:h-[600px] lg:h-[740px] rounded-full bg-blue-500/15 dark:bg-primary/15 blur-[90px] sm:blur-[130px]" />
            </div>
          )}

          {/* Luces ambientales en esquinas */}
          <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-primary/10 dark:bg-primary/15 blur-[100px] pointer-events-none" />
          <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-emerald-400/10 dark:bg-emerald-500/10 blur-[90px] pointer-events-none" />
        </>
      )}
    </div>
  );
};

export default React.memo(GestionWaterBackground);
