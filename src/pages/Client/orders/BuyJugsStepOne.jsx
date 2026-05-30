// src/pages/Client/orders/BuyJugsStepOne.jsx
import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import OrderLayout from "../../../layouts/OrderLayout";
import QuantityCard from "../../../components/order/QuantityCard";
import PromotionBanner from "../../../components/order/PromotionBanner";
import { fetchProducts } from "../../../api/apiClient";
import { useAuth } from "../../../context/AuthContext"; 
import { toast } from "sonner";

const BuyJugsStepOne = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, loading: authLoading } = useAuth(); 

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState("");

  useEffect(() => {
    if (authLoading) return;

    const loadProducts = async () => {
      try {
        setLoading(true);
        const allProducts = await fetchProducts();
        
        // Recuperar selección previa
        const prevState = location.state?.selectedProducts || [];

        const mapped = allProducts.map(p => ({
            id: p.id,
            name: p.name,
            quantity: prevState.find(item => item.id === p.id)?.quantity || 0,
            price: p.price,
            category: p.categoryRel?.name || p.category || 'Otros',
            featured: p.name.toLowerCase().includes('20l'),
            imageUrl: p.imageUrl || null,
            isComingSoon: p.status === 'COMING_SOON'
        }));

        setProducts(mapped);

        if (mapped.length > 0) {
            const sortedCats = Array.from(new Set(mapped.map(p => p.category))).sort((a, b) => {
                if (a === 'Garrafones') return -1;
                if (b === 'Garrafones') return 1;
                return a.localeCompare(b);
            });
            setActiveCategory(sortedCats[0]);
        }
      } catch (err) {
        console.error("Error loading products:", err);
        setError("No se pudieron cargar los productos.");
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [authLoading, token, location.state]);

  const categories = useMemo(() => {
      return Array.from(new Set(products.map(p => p.category))).sort((a, b) => {
          if (a === 'Garrafones') return -1;
          if (b === 'Garrafones') return 1;
          return a.localeCompare(b);
      });
  }, [products]);

  const filteredProducts = useMemo(() => {
      return products.filter(p => p.category === activeCategory);
  }, [products, activeCategory]);

  const totalItems = products.reduce((sum, p) => sum + p.quantity, 0);
  const refillCount = location.state?.selectedRefills?.reduce((sum, r) => sum + r.quantity, 0) || 0;

  const handleChangeQuantity = (id, delta) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, quantity: Math.max(0, p.quantity + delta) }
          : p
      )
    );
  };

  const handleContinue = () => {
    if (totalItems === 0 && refillCount === 0) {
      toast.warning("Selecciona al menos un producto o añade una recarga.");
      return;
    }

    const selectedProducts = products.filter(p => p.quantity > 0);
    const combinedItems = [
        ...selectedProducts,
        ...(location.state?.selectedRefills || [])
    ];

    const jugsToFill = selectedProducts.filter(p => p.category === 'Garrafones');

    const nextState = {
        ...location.state,
        selectedProducts,
        combinedItems,
        totalItems,
        totalJugs: jugsToFill.reduce((sum, p) => sum + p.quantity, 0) + refillCount
    };

    if (jugsToFill.length > 0) {
        navigate("/pedidos/comprar/opcion-llenado", { state: nextState });
    } else if (refillCount > 0) {
        // Transformar para el flujo de asignar
        const fromStepOne = location.state.selectedRefills.map(r => ({
            id: r.dbId || r.id.replace('refill-', ''),
            name: r.name,
            quantity: r.quantity,
            imageUrl: r.imageUrl
        }));
        navigate("/pedidos/comprar/asignar-agua", { state: { ...nextState, fromStepOne, mode: 'buy' } });
    } else {
        navigate("/pedidos/rellenar/entrega", { state: { ...nextState, mode: 'buy' } });
    }
  };

  const handleGoToRefill = () => {
      const selectedProducts = products.filter(p => p.quantity > 0);
      navigate("/pedidos/rellenar", {
          state: {
              ...location.state,
              selectedProducts,
              mode: 'buy'
          }
      });
  };

  return (
    <OrderLayout
      title="Tienda de Productos"
      subtitle="Elige tus garrafones, termos o botellas favoritos."
      step={1}
      totalSteps={4}
    >
      <div className="flex flex-col gap-6">
        <PromotionBanner />

        {/* Unión de pedidos indicator */}
        {refillCount > 0 && (
            <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl flex items-center justify-between animate-in fade-in zoom-in duration-300">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                    <span className="material-symbols-outlined">recycling</span>
                    <span className="text-xs sm:text-sm font-bold">Llevas {refillCount} garrafones para rellenar</span>
                </div>
                <button onClick={handleGoToRefill} className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 hover:underline">Ajustar recargas</button>
            </div>
        )}

        {/* Categorías */}
        {!loading && categories.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${
                            activeCategory === cat 
                            ? 'bg-primary text-white border-primary shadow-md' 
                            : 'bg-white dark:bg-dark text-text-secondary border-gray-200 dark:border-white/10 hover:border-primary/40'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm sm:text-base text-text-secondary dark:text-white/80">
          <span>
            Productos elegidos: <span className="font-bold text-primary text-lg">{totalItems}</span>
          </span>
          <button 
            onClick={handleGoToRefill}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-dark border border-gray-200 dark:border-white/10 text-text-secondary dark:text-white/70 rounded-full text-sm font-bold hover:border-primary/40 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-lg">recycling</span>
            ¿Añadir Recargas?
          </button>
        </div>

        {loading && <div className="text-center py-10 animate-pulse text-primary font-bold">Cargando catálogo...</div>}
        
        {!loading && !error && filteredProducts.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-6 max-w-4xl mx-auto">
            {filteredProducts.map((product) => (
              <QuantityCard
                key={product.id}
                name={product.name}
                imageUrl={product.imageUrl}
                quantity={product.quantity}
                featured={product.featured}
                isComingSoon={product.isComingSoon}
                price={product.price}
                onIncrease={() => handleChangeQuantity(product.id, 1)}
                onDecrease={() => handleChangeQuantity(product.id, -1)}
                onCardClick={() => handleChangeQuantity(product.id, 1)}
              />
            ))}
          </div>
        )}

        <div className="flex justify-between items-center pt-4 border-t dark:border-white/10">
          <button
            type="button"
            onClick={() => navigate('/pedidos')}
            className="text-sm font-medium text-text-secondary dark:text-white/70 hover:text-primary transition-colors"
          >
            &larr; Volver al inicio
          </button>
          <button
            type="button"
            onClick={handleContinue}
            disabled={totalItems === 0 && refillCount === 0}
            className={`flex items-center justify-center rounded-xl
                       bg-primary px-8 h-12 text-base font-semibold text-white
                       shadow-sm hover:bg-primary/90
                       transition-all active:scale-[0.98]
                       ${totalItems === 0 && refillCount === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Continuar al paso 2
          </button>
        </div>
      </div>
    </OrderLayout>
  );
};

export default BuyJugsStepOne;
