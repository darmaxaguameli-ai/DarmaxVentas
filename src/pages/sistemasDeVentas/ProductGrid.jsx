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
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
      {products.map(product => (
        <button 
          key={product.id}
          onClick={() => onProductSelect(product)}
          className="aspect-square flex flex-col items-center justify-center p-2 rounded-xl bg-white dark:bg-gray-800 shadow-md hover:shadow-lg hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <span className="text-center font-semibold text-sm sm:text-base text-[#111418] dark:text-white">{product.name}</span>
          <span className="text-primary font-bold mt-1">${product.price.toFixed(2)}</span>
        </button>
      ))}
    </div>
  );
};

export default ProductGrid;
