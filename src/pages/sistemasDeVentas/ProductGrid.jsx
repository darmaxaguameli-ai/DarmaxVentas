import React from 'react';
import ProductCard from './components/ProductCard';

const products = [
  { id: 'p1', name: 'Premium 1L', price: 12 },
  { id: 'p2', name: 'Premium 5L', price: 22 },
  { id: 'p3', name: 'Premium 10L', price: 32 },
  { id: 'p4', name: 'Premium 20L', price: 42 },
  { id: 'a1', name: 'Alcalina 1L', price: 15 },
  { id: 'a2', name: 'Alcalina 5L', price: 28 },
  { id: 'a3', name: 'Alcalina 10L', price: 38 },
  { id: 'a4', name: 'Alcalina 20L', price: 48 },
];

const ProductGrid = ({ onProductSelect }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 p-1">
      {products.map(product => (
        <ProductCard key={product.id} product={product} onProductSelect={onProductSelect} />
      ))}
    </div>
  );
};

export default ProductGrid;
