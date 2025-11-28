import React from 'react';

const ProductCard = ({ product, onProductSelect }) => {
    const hasImage = product.imageUrl && product.imageUrl.length > 0;

    return (
        <button
          onClick={() => onProductSelect(product)}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-all duration-300 ease-in-out transform hover:-translate-y-1"
        >
          <div className={`flex flex-col items-center h-full p-4 ${hasImage ? 'justify-between' : 'justify-center'}`}>
            {hasImage && (
                <img 
                  src={product.imageUrl} 
                  alt={product.name} 
                  className="h-24 w-24 object-contain mb-3"
                />
            )}
            <div className="text-center">
              <p className={`font-semibold text-gray-700 dark:text-gray-200 ${hasImage ? 'text-sm' : 'text-base'} leading-tight`}>{product.name}</p>
              <p className={`font-bold ${hasImage ? 'text-lg' : 'text-xl'} text-primary mt-2`}>${product.price.toFixed(2)}</p>
            </div>
          </div>
        </button>
    );
};

export default ProductCard;
