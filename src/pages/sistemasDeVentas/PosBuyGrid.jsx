import React from 'react';

const POS_BUY_PRODUCTS = [
    {
      id: "buy_darmax_20L",
      name: "Comprar Garrafón Darmax 20L",
      price: 150, // Example price
      imageUrl: "/img/garrafones/turquesa.png",
    },
    {
      id: "buy_darmax_10L",
      name: "Comprar Garrafón Darmax 10L",
      price: 100,
      imageUrl: "https://i5.walmartimages.com/asr/477a4697-343e-4479-b790-3e20d7d2c4a8.85794c880e81af65b362fa88a710128c.jpeg?odnHeight=612&odnWidth=612&odnBg=FFFFFF",
    },
];

const PosBuyGrid = ({ onProductSelect }) => {
  return (
    <div
      className="
        grid 
        grid-cols-3
        sm:grid-cols-4
        md:grid-cols-5
        gap-4
      "
    >
      {POS_BUY_PRODUCTS.map((product) => (
        <button 
          key={product.id}
          onClick={() => onProductSelect(product)}
          className="aspect-square flex flex-col items-center justify-center p-2 rounded-xl bg-white dark:bg-gray-800 shadow-md hover:shadow-lg hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <img src={product.imageUrl} alt={product.name} className="h-16 w-16 object-contain mb-2"/>
          <span className="text-center font-semibold text-sm sm:text-base text-[#111418] dark:text-white">{product.name}</span>
          <span className="text-primary font-bold mt-1">${product.price.toFixed(2)}</span>
        </button>
      ))}
    </div>
  );
};

export default PosBuyGrid;