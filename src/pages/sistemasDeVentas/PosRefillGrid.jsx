import React from 'react';

const POS_REFILL_PRODUCTS = [
    {
      id: "refill_ciel",
      name: "Recarga Ciel",
      price: 20, // Example price
      imageUrl: "/img/garrafones/ciel.png",
    },
    {
      id: "refill_epura",
      name: "Recarga Epura",
      price: 20,
      imageUrl: "/img/garrafones/epura.png",
    },
    {
      id: "refill_bonafon",
      name: "Recarga Bonafon",
      price: 20,
      imageUrl: "https://http2.mlstatic.com/D_NQ_NP_2X_641991-MLA96179176023_102025-T.webp",
    },
    {
      id: "refill_darmax",
      name: "Recarga Darmax",
      price: 18,
      imageUrl: "/img/garrafones/turquesa.png",
    },
];

const PosRefillGrid = ({ onProductSelect }) => {
    // This component is simpler, it just calls the onProductSelect prop
    // The main VentaMostrador will handle the state of the order
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
      {POS_REFILL_PRODUCTS.map((product) => (
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

export default PosRefillGrid;