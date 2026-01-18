import { useHaptic } from "../../hooks/useHaptic";

const QuantityCard = ({
  name,
  imageUrl,
  quantity,
  featured = false,
  onIncrease,
  onDecrease,
  onCardClick,
}) => {
  const { triggerSelection } = useHaptic();

  const handleCardClick = () => {
    triggerSelection();
    if (onCardClick) onCardClick();
  };

  const handleDecrease = (e) => {
    e.stopPropagation();
    triggerSelection();
    if (onDecrease) onDecrease();
  };

  const handleIncrease = (e) => {
    e.stopPropagation();
    triggerSelection();
    if (onIncrease) onIncrease();
  };

  return (
    <div
      onClick={handleCardClick}
      className={`flex flex-col gap-2 sm:gap-4 rounded-2xl border bg-white dark:bg-dark shadow-sm transition-all
                  cursor-pointer select-none
        ${
          featured
            ? "border-primary dark:border-primary/70 shadow-md"
            : "border-slate-200 dark:border-slate-800 hover:border-primary/40"
        }`}
    >
      {/* Imagen grande y clara */}
      <div
        className="w-full rounded-t-2xl aspect-[4/3] sm:aspect-[3/2] bg-white
                   bg-center bg-no-repeat bg-contain"
        style={{ backgroundImage: `url("${imageUrl}")` }}
        aria-label={name}
      />

      <div className="px-3 pb-3 pt-1 sm:px-4 sm:pb-4 flex flex-col gap-2 sm:gap-4 flex-grow">
        {/* Nombre del producto */}
        <div className="flex-grow">
          <p className="text-sm sm:text-lg font-semibold text-dark dark:text-white leading-tight sm:leading-snug">
            {name}
          </p>
        </div>

        {/* Controles de cantidad */}
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          <button
            type="button"
            onClick={handleDecrease}
            className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full
                       bg-slate-100 dark:bg-slate-800
                       text-text-secondary dark:text-gray-200
                       hover:bg-slate-200 dark:hover:bg-slate-700
                       transition-colors"
          >
            <span className="material-symbols-outlined text-xl sm:text-2xl">
              remove
            </span>
          </button>

          <span className="text-xl sm:text-2xl font-black text-dark dark:text-white">
            {quantity}
          </span>

          <button
            type="button"
            onClick={handleIncrease}
            className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full
                       bg-slate-100 dark:bg-slate-800
                       text-text-secondary dark:text-gray-200
                       hover:bg-slate-200 dark:hover:bg-slate-700
                       transition-colors"
          >
            <span className="material-symbols-outlined text-xl sm:text-2xl">
              add
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuantityCard;
