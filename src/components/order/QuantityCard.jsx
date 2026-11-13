import { useHaptic } from "../../hooks/useHaptic";

const QuantityCard = ({
  name,
  imageUrl,
  quantity,
  featured = false,
  isComingSoon = false,
  onIncrease,
  onDecrease,
  onCardClick,
}) => {
  const { selection } = useHaptic();

  const handleCardClick = () => {
    if (isComingSoon) return;
    selection();
    if (onCardClick) onCardClick();
  };

  const handleDecrease = (e) => {
    e.stopPropagation();
    if (isComingSoon) return;
    selection();
    if (onDecrease) onDecrease();
  };

  const handleIncrease = (e) => {
    e.stopPropagation();
    if (isComingSoon) return;
    selection();
    if (onIncrease) onIncrease();
  };

  const isSelected = quantity > 0;

  return (
    <div
      onClick={handleCardClick}
      className={`group flex flex-col justify-between rounded-3xl border transition-all duration-300 select-none relative overflow-hidden backdrop-blur-2xl
        ${isComingSoon ? "opacity-60 cursor-not-allowed grayscale-[0.5]" : "cursor-pointer active:scale-[0.98]"}
        ${
          isSelected
            ? "border-primary/80 ring-2 ring-primary/50 bg-gradient-to-b from-primary/5 to-white/90 dark:from-primary/15 dark:to-gray-800/90 shadow-xl shadow-primary/15"
            : featured && !isComingSoon
            ? "border-primary/40 bg-white/80 dark:bg-gray-800/80 shadow-md hover:shadow-xl hover:border-primary/60"
            : "border-white/80 dark:border-white/10 bg-white/80 dark:bg-gray-800/80 shadow-md shadow-cyan-500/5 hover:border-primary/40 hover:shadow-xl hover:-translate-y-1"
        }`}
    >
      {/* Badges superiores */}
      {isComingSoon ? (
        <div className="absolute top-3 left-3 z-10">
          <span className="bg-amber-500 text-white text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
            Próximamente
          </span>
        </div>
      ) : isSelected ? (
        <div className="absolute top-3 right-3 z-10 animate-in zoom-in-75 duration-200">
          <span className="bg-primary text-white text-xs font-black px-2.5 py-1 rounded-full shadow-md shadow-primary/30 flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px]">check</span>
            {quantity}
          </span>
        </div>
      ) : null}
      
      {/* Contenedor de Imagen con fondo suave */}
      <div className="p-2 sm:p-3 pb-0">
        <div className="w-full rounded-2xl aspect-[4/3] sm:aspect-[4/3] bg-gradient-to-b from-white/90 to-gray-50/80 dark:from-gray-700/40 dark:to-gray-800/40 flex items-center justify-center p-3 sm:p-4 border border-white/60 dark:border-white/5 overflow-hidden">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={name} 
              className="h-full w-full object-contain filter drop-shadow-md group-hover:scale-105 transition-transform duration-300" 
              loading="lazy"
            />
          ) : (
            <span className="material-symbols-outlined text-4xl sm:text-5xl text-gray-300 dark:text-gray-600">
              water_drop
            </span>
          )}
        </div>
      </div>

      <div className="p-3 sm:p-4 flex flex-col gap-2.5 sm:gap-3 flex-grow justify-between">
        {/* Nombre del producto */}
        <div>
          <p className="text-xs sm:text-base font-bold text-gray-900 dark:text-white leading-tight line-clamp-2">
            {name}
          </p>
        </div>

        {/* Controles de cantidad táctiles (Ergonomía de Kiosko Totem) */}
        <div 
          className="flex items-center justify-between gap-1 sm:gap-2 p-1 rounded-2xl bg-gray-50/80 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-700/50"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Botón Decrementar */}
          <button
            type="button"
            onClick={handleDecrease}
            disabled={quantity === 0 || isComingSoon}
            className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl
                       bg-white dark:bg-gray-800
                       text-gray-600 dark:text-gray-200
                       shadow-xs hover:bg-gray-100 dark:hover:bg-gray-700
                       disabled:opacity-30 disabled:cursor-not-allowed
                       transition-all active:scale-90"
            aria-label="Disminuir"
          >
            <span className="material-symbols-outlined text-xl sm:text-2xl font-bold">
              remove
            </span>
          </button>

          {/* Contador de Cantidad */}
          <span className="text-lg sm:text-2xl font-black text-gray-900 dark:text-white tabular-nums px-1">
            {quantity}
          </span>

          {/* Botón Incrementar */}
          <button
            type="button"
            onClick={handleIncrease}
            disabled={isComingSoon}
            className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl
                       bg-primary text-white
                       shadow-md shadow-primary/25 hover:bg-primary-dark
                       disabled:opacity-30 disabled:cursor-not-allowed
                       transition-all active:scale-90"
            aria-label="Aumentar"
          >
            <span className="material-symbols-outlined text-xl sm:text-2xl font-bold">
              add
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuantityCard;
