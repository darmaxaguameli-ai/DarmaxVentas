import React from 'react';
import ProductCard from './components/ProductCard';

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
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 p-1">
      {POS_BUY_PRODUCTS.map((product) => (
        <ProductCard key={product.id} product={product} onProductSelect={onProductSelect} />
      ))}
    </div>
  );
};

export default PosBuyGrid;