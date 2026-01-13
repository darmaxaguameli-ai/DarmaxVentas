import React from 'react';
import ProductCard from './components/ProductCard';

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
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 p-1">
      {POS_REFILL_PRODUCTS.map((product) => (
        <ProductCard key={product.id} product={product} onProductSelect={onProductSelect} />
      ))}
    </div>
  );
};

export default PosRefillGrid;