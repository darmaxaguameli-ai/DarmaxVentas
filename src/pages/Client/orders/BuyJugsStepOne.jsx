// src/pages/Client/orders/BuyJugsStepOne.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import OrderLayout from "../../../layouts/OrderLayout";
import QuantityCard from "../../../components/order/QuantityCard";
import { fetchProducts } from "../../../api/apiClient";
import { useAuth } from "../../../context/AuthContext"; // Import useAuth

const BuyJugsStepOne = () => {
  const navigate = useNavigate();
  const { token, loading: authLoading } = useAuth(); // Get token and auth loading state

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Wait for auth to finish loading to ensure token is available if user is logged in
    if (authLoading) return;

    const loadProducts = async () => {
      try {
        setLoading(true);
        const allProducts = await fetchProducts();
        
        // Filter products with category 'Garrafones' (case insensitive)
        const jugProducts = allProducts.filter(p => 
          p.category && p.category.toLowerCase().includes('garrafone')
        ).map(p => ({
          id: p.id,
          name: p.name,
          quantity: 0,
          price: p.price,
          featured: p.name.toLowerCase().includes('20l'),
          imageUrl: p.imageUrl || "/img/garrafones/turquesa.png",
        }));

        setProducts(jugProducts);
      } catch (err) {
        console.error("Error loading products:", err);
        setError("No se pudieron cargar los productos.");
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [authLoading, token]); // Re-run when auth loading finishes or token changes

  const totalJugs = products.reduce((sum, p) => sum + p.quantity, 0);

  const handleChangeQuantity = (id, delta) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, quantity: Math.max(0, (p.quantity || 0) + delta) }
          : p
      )
    );
  };

  const handleContinue = () => {
    if (totalJugs === 0) {
      console.log("Debes seleccionar al menos 1 garrafón para comprar.");
      return;
    }

    navigate("/pedidos/comprar/opcion-llenado", {
      state: {
        mode: "buy",
        fromStepOneBuy: products.filter(p => p.quantity > 0), // Only pass selected products
        totalJugsBuy: totalJugs,
      },
    });
  };

  const handleGoToStart = () => {
    navigate('/pedidos');
  };

  return (
    <OrderLayout
      title="Selecciona tus garrafones a comprar"
      subtitle="Elige cuántos garrafones de 20L y 10L deseas comprar."
      step={1}
      totalSteps={4}
    >
      <div className="flex flex-col gap-6">
        {/* Resumen superior */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm sm:text-base text-text-secondary dark:text-white/80">
          <span>
            Garrafones seleccionados:{" "}
            <span className="font-bold text-primary text-lg">
              {totalJugs}
            </span>
          </span>
          <span className="text-sm">
            <span className="font-semibold text-dark dark:text-white">
              Tip:
            </span>{" "}
            toca el garrafón o el botón <strong>+</strong> para agregar uno.
          </span>
        </div>

        {/* Loading / Error States */}
        {loading && <div className="text-center py-10">Cargando productos...</div>}
        {error && <div className="text-center py-10 text-red-500">{error}</div>}
        
        {/* Grid de productos */}
        {!loading && !error && products.length === 0 && (
            <div className="text-center py-10 text-gray-500">No hay garrafones disponibles para la venta.</div>
        )}

        {/* Grid de productos */}
        {!loading && !error && products.length > 0 && (
          <div
            className="
              grid 
              grid-cols-2
              gap-3 md:gap-6 
              max-w-3xl mx-auto
            "
          >
            {products.map((product) => (
              <QuantityCard
                key={product.id}
                name={product.name}
                imageUrl={product.imageUrl}
                quantity={product.quantity}
                featured={product.featured}
                price={product.price} // Pass price if supported by QuantityCard
                onIncrease={() => handleChangeQuantity(product.id, 1)}
                onDecrease={() => handleChangeQuantity(product.id, -1)}
                onCardClick={() => handleChangeQuantity(product.id, 1)}
              />
            ))}
          </div>
        )}

        {/* Botones de navegación */}
        <div className="flex justify-between items-center pt-4">
          <button
            type="button"
            onClick={handleGoToStart}
            className="text-sm font-medium text-text-secondary dark:text-white/70 hover:text-primary dark:hover:text-primary transition-colors"
          >
            &larr; Volver al inicio
          </button>
          <button
            type="button"
            onClick={handleContinue}
            disabled={totalJugs === 0} // Disable if 0
            className={`flex items-center justify-center rounded-xl
                       bg-primary px-8 h-12 text-base font-semibold text-white
                       shadow-sm hover:bg-primary/90
                       focus-visible:outline focus-visible:outline-2 
                       focus-visible:outline-offset-2 focus-visible:outline-primary
                       transition-all active:scale-[0.98]
                       ${totalJugs === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Continuar al paso 2
          </button>        </div>
      </div>
    </OrderLayout>
  );
};

export default BuyJugsStepOne;
