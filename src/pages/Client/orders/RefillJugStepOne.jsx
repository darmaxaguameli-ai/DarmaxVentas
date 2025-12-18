// src/pages/cliente/orders/RefillJugStepOne.jsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import OrderLayout from "../../../layouts/OrderLayout";
import QuantityCard from "../../../components/order/QuantityCard";
import { useConfig } from "../../../context/ConfigContext";

const brandImageMap = {
  'ciel': '/img/garrafones/ciel.png',
  'epura': '/img/garrafones/epura.png',
  'bonafon': 'https://http2.mlstatic.com/D_NQ_NP_2X_641991-MLA96179176023_102025-T.webp',
  'darmax': '/img/garrafones/turquesa.png',
  'garrafón 10l': 'https://i5.walmartimages.com/asr/477a4697-343e-4479-b790-3e20d7d2c4a8.85794c880e81af65b362fa88a710128c.jpeg?odnHeight=612&odnWidth=612&odnBg=FFFFFF',
};

const getImageUrlForBrand = (name) => {
  const defaultImage = '/img/garrafones/turquesa.png';
  return brandImageMap[name.toLowerCase()] || defaultImage;
};

const RefillJugStepOne = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { jugBrands: fetchedJugBrands, loading: configLoading, error: configError } = useConfig();
  
  const [selectedJugs, setSelectedJugs] = useState([]);

  useEffect(() => {
    if (!configLoading && !configError && fetchedJugBrands.length > 0) {
      // Revisa si hay un estado previo con selecciones
      const previousSelection = location.state?.fromStepOne;

      const initialProducts = fetchedJugBrands.map((brand, index) => {
        const existingJug = previousSelection?.find(p => p.id === brand.id);
        return {
          id: brand.id,
          name: `Garrafón ${brand.name}`,
          quantity: existingJug?.quantity || 0,
          featured: index === 0,
          imageUrl: getImageUrlForBrand(brand.name),
        };
      });
      setSelectedJugs(initialProducts);
    }
  }, [fetchedJugBrands, configLoading, configError, location.state]);

  const totalJugs = selectedJugs.reduce((sum, p) => sum + p.quantity, 0);

  const handleChangeQuantity = (id, delta) => {
    setSelectedJugs((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, quantity: Math.max(0, p.quantity + delta) }
          : p
      )
    );
  };

  const handleContinue = () => {
    if (totalJugs === 0) {
      alert("Debes seleccionar al menos 1 garrafón.");
      return;
    }

    // Al continuar, nos aseguramos de limpiar los datos de los pasos siguientes
    // para evitar inconsistencias si el usuario ha navegado hacia atrás.
    const { 
      fromStepOne, 
      fromStepTwo, 
      ...restOfState 
    } = location.state || {};

    navigate("/pedidos/rellenar/asignar", {
      state: {
        ...restOfState,
        maxJugs: totalJugs,
        fromStepOne: selectedJugs.filter(p => p.quantity > 0),
        backPath: location.pathname, // Añadir la ruta actual para el regreso
      },
    });
  };

  const handleGoToStart = () => {
    navigate('/pedidos');
  };

  const renderContent = () => {
    if (configLoading) {
      return <div className="text-center py-10">Cargando marcas de garrafón...</div>;
    }

    if (configError) {
      return <div className="text-center py-10 text-red-500">{configError}</div>;
    }
    
    if (selectedJugs.length === 0 && !configLoading) {
        return <div className="text-center py-10">No hay marcas de garrafón disponibles.</div>;
    }

    return (
      <>
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-6 lg:grid-cols-4 max-w-5xl mx-auto">
          {selectedJugs.map((product) => (
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
            className="flex items-center justify-center rounded-xl bg-primary px-10 h-14 text-lg font-semibold text-white shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-all active:scale-[0.98]"
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
