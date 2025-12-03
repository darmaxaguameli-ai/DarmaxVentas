// src/pages/cliente/orders/RefillJugStepOne.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import OrderLayout from "../../../layouts/OrderLayout";
import QuantityCard from "../../../components/order/QuantityCard";

// Helper to map brand names to images, as the DB doesn't store them
const brandImageMap = {
  'ciel': '/img/garrafones/ciel.png',
  'epura': '/img/garrafones/epura.png',
  'bonafon': 'https://http2.mlstatic.com/D_NQ_NP_2X_641991-MLA96179176023_102025-T.webp',
  'darmax': '/img/garrafones/turquesa.png',
  'garrafón 10l': 'https://i5.walmartimages.com/asr/477a4697-343e-4479-b790-3e20d7d2c4a8.85794c880e81af65b362fa88a710128c.jpeg?odnHeight=612&odnWidth=612&odnBg=FFFFFF',
};

const getImageUrlForBrand = (name) => {
  const defaultImage = '/img/garrafones/turquesa.png'; // A sensible default
  return brandImageMap[name.toLowerCase()] || defaultImage;
};

const RefillJugStepOne = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchJugBrands = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get('/api/jug-brands');
        const formattedProducts = response.data.map((brand, index) => ({
          id: brand.id,
          name: `Garrafón ${brand.name}`,
          quantity: 0,
          featured: index === 0, // Make the first item featured as an example
          imageUrl: getImageUrlForBrand(brand.name),
        }));
        setProducts(formattedProducts);
      } catch (err) {
        console.error("Error fetching jug brands:", err);
        setError("No se pudieron cargar las marcas de garrafón. Por favor, intenta de nuevo más tarde.");
      } finally {
        setLoading(false);
      }
    };

    fetchJugBrands();
  }, []);

  const totalJugs = products.reduce((sum, p) => sum + p.quantity, 0);

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
    if (totalJugs === 0) {
      // Consider showing a user-friendly alert/modal here instead of console.log
      alert("Debes seleccionar al menos 1 garrafón.");
      return;
    }

    navigate("/pedidos/rellenar/asignar", {
      state: {
        maxJugs: totalJugs,
        fromStepOne: products.filter(p => p.quantity > 0), // Send only selected products
      },
    });
  };

  const handleGoToStart = () => {
    navigate('/pedidos');
  };

  const renderContent = () => {
    if (loading) {
      return <div className="text-center py-10">Cargando marcas de garrafón...</div>;
    }

    if (error) {
      return <div className="text-center py-10 text-red-500">{error}</div>;
    }

    return (
      <>
        {/* Resumen superior, texto más grande y claro */}
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

        {/* Grid de productos – responsivo y centrado para modo horizontal */}
        <div
          className="
            grid 
            grid-cols-1
            sm:grid-cols-3
            lg:grid-cols-4
            gap-4 md:gap-6 
            max-w-5xl mx-auto
          "
        >
          {products.map((product) => (
            <QuantityCard
              key={product.id}
              name={product.name}
              imageUrl={product.imageUrl}
              quantity={product.quantity}
              featured={product.featured}
              onIncrease={() => handleChangeQuantity(product.id, 1)}
              onDecrease={() => handleChangeQuantity(product.id, -1)}
              onCardClick={() => handleChangeQuantity(product.id, 1)}
            />
          ))}
        </div>

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
            className="flex min-w-[200px] items-center justify-center rounded-xl
                       bg-primary px-10 h-14 text-lg font-semibold text-white
                       shadow-sm hover:bg-primary/90
                       focus-visible:outline focus-visible:outline-2 
                       focus-visible:outline-offset-2 focus-visible:outline-primary
                       transition-all active:scale-[0.98]"
            disabled={totalJugs === 0}
          >
            Continuar al paso 2
          </button>
        </div>
      </>
    );
  };

  return (
    <OrderLayout
      title="Selecciona tus garrafones a rellenar"
      subtitle="Indica cuántos garrafones de cada tipo deseas que recojamos para recarga."
      step={1}
      totalSteps={4}
    >
      <div className="flex flex-col gap-6">
        {renderContent()}
      </div>
    </OrderLayout>
  );
};

export default RefillJugStepOne;
