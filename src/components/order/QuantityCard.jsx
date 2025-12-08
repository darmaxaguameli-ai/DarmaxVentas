const QuantityCard = ({
  name,
  imageUrl,
  quantity,
  featured = false,
  onIncrease,
  onDecrease,
  onCardClick,
}) => {
  const handleCardClick = () => {
    if (onCardClick) onCardClick();
  };

  const handleDecrease = (e) => {
    e.stopPropagation();
    if (onDecrease) onDecrease();
  };

  const handleIncrease = (e) => {
    e.stopPropagation();
    if (onIncrease) onIncrease();
  };

  return (
    <div
      onClick={handleCardClick}
      className={`flex flex-col gap-4 rounded-2xl border bg-white dark:bg-dark shadow-sm transition-all
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

      <div className="px-4 pb-4 pt-1 flex flex-col gap-4 flex-grow">
        {/* Nombre del producto, más grande */}
        <div className="flex-grow">
          <p className="text-lg sm:text-xl font-semibold text-dark dark:text-white leading-snug">
            {name}
          </p>
        </div>

        {/* Controles de cantidad, botones grandes */}
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleDecrease}
            className="flex h-11 w-11 items-center justify-center rounded-full
                       bg-slate-100 dark:bg-slate-800
                       text-text-secondary dark:text-gray-200
                       hover:bg-slate-200 dark:hover:bg-slate-700
                       transition-colors"
          >
            <span className="material-symbols-outlined text-2xl">
              remove
            </span>
          </button>

          <span className="text-2xl font-black text-dark dark:text-white">
            {quantity}
          </span>

          <button
            type="button"
            onClick={handleIncrease}
            className="flex h-11 w-11 items-center justify-center rounded-full
                       bg-slate-100 dark:bg-slate-800
                       text-text-secondary dark:text-gray-200
                       hover:bg-slate-200 dark:hover:bg-slate-700
                       transition-colors"
          >
            <span className="material-symbols-outlined text-2xl">
              add
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuantityCard;
