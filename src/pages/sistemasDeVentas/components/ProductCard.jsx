import React from 'react';
import { useHaptic } from '../../../hooks/useHaptic';

const ProductCard = ({ product, onProductSelect }) => {
    const hasImage = product.imageUrl && product.imageUrl.length > 0;
    const { triggerSelection } = useHaptic();

    const handleClick = () => {
        triggerSelection();
        onProductSelect(product);
    };

    return (
        <button
          onClick={handleClick}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-lg hover:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-all duration-200 active:scale-95 h-full flex flex-col"
        >
          <div className={`flex flex-col items-center w-full h-full p-2 sm:p-4 ${hasImage ? 'justify-between' : 'justify-center'}`}>
            {hasImage && (
                <div className="w-full aspect-square mb-2 sm:mb-4 flex items-center justify-center bg-gray-50 dark:bg-gray-700/30 rounded-lg p-2">
                    <img 
                    src={product.imageUrl} 
                    alt={product.name} 
                    className="h-full w-full object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-110"
                    />
                </div>
            )}
            <div className="text-center w-full mt-auto">
              <p className={`font-bold text-gray-700 dark:text-gray-200 ${hasImage ? 'text-xs sm:text-sm lg:text-base line-clamp-2' : 'text-sm sm:text-base lg:text-lg'} leading-tight min-h-[2.5em] flex items-center justify-center`}>
                  {product.name}
              </p>
              <div className="mt-1 sm:mt-3 bg-primary/10 dark:bg-primary/20 rounded-full py-1 px-3 inline-block">
                  <p className={`font-black ${hasImage ? 'text-sm sm:text-base lg:text-lg' : 'text-lg sm:text-xl lg:text-2xl'} text-primary`}>
                      ${product.price.toFixed(2)}
                  </p>
              </div>
            </div>
          </div>
        </button>
    );
};

export default ProductCard;
