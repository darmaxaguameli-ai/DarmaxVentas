// src/pages/Client/orders/BuyJugsStepOne.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import OrderLayout from "../../../layouts/OrderLayout";
import QuantityCard from "../../../components/order/QuantityCard";

const BuyJugsStepOne = () => {
  const navigate = useNavigate();

  const [products, setProducts] = useState([
    {
      id: "darmax20",
      name: "Garrafón Darmax 20L",
      quantity: 0,
      featured: true,
      imageUrl: "/img/garrafones/turquesa.png",
    },
    {
      id: "darmax10",
      name: "Garrafón Darmax 10L",
      quantity: 0,
      imageUrl:
        "https://i5.walmartimages.com/asr/477a4697-343e-4479-b790-3e20d7d2c4a8.85794c880e81af65b362fa88a710128c.jpeg?odnHeight=612&odnWidth=612&odnBg=FFFFFF",
    },
  ]);

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
        fromStepOneBuy: products,
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

        {/* Grid de productos */}
        <div
          className="
            grid 
            grid-cols-1
            sm:grid-cols-2
            lg:grid-cols-3
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
          >
            Continuar al paso 2
          </button>
        </div>
      </div>
    </OrderLayout>
  );
};

export default BuyJugsStepOne;
