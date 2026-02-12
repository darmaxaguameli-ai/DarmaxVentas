// src/pages/PuntoDeVenta/steps/PosStepOne_SelectJugs.jsx
import { useState, useEffect } from "react";
import { toast } from "sonner";
import QuantityCard from "../../../components/order/QuantityCard";
import { useConfig } from "../../../context/ConfigContext";
import { useHaptic } from "../../../hooks/useHaptic";

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

const PosStepOne_SelectJugs = ({ onContinue, onBack, existingSelection }) => {
  const { jugBrands: fetchedJugBrands, loading: configLoading, error: configError } = useConfig();
  const { impact } = useHaptic();
  
  const [selectedJugs, setSelectedJugs] = useState([]);

  useEffect(() => {
    if (!configLoading && !configError && fetchedJugBrands.length > 0) {
      const initialProducts = fetchedJugBrands.map((brand, index) => {
        const existingJug = existingSelection?.find(p => p.id === brand.id);
        const finalImage = brand.imageUrl || getImageUrlForBrand(brand.name);
        
        const lowerName = brand.name.toLowerCase();
        const isBottle = lowerName.includes('1l') || lowerName.includes('1 litro') || lowerName.includes('1lt') || lowerName.includes('1.5l');
        const displayName = isBottle ? `Botella ${brand.name}` : `Garrafón ${brand.name}`;

        return {
          id: brand.id,
          name: displayName,
          quantity: existingJug?.quantity || 0,
          featured: index === 0,
          imageUrl: finalImage,
        };
      });
      setSelectedJugs(initialProducts);
    }
  }, [fetchedJugBrands, configLoading, configError, existingSelection]);

  const totalJugs = selectedJugs.reduce((sum, p) => sum + p.quantity, 0);

  const handleChangeQuantity = (id, delta) => {
    setSelectedJugs((prev) =>
      prev.map((p) => {
        if (p.id === id) {
            return { ...p, quantity: Math.max(0, p.quantity + delta), featured: true };
        }
        return { ...p, featured: false };
      })
    );
    if (delta > 0) {
      impact();
    }
  };

  const handleContinue = () => {
    if (totalJugs === 0) {
      toast.warning("Debes seleccionar al menos 1 producto.");
      return;
    }
    onContinue({
        stepOneData: selectedJugs.filter(p => p.quantity > 0)
    });
  };

  const renderContent = () => {
    if (configLoading) {
      return <div className="text-center py-10">Cargando productos...</div>;
    }

    if (configError) {
      return <div className="text-center py-10 text-red-500">{configError}</div>;
    }
    
    if (selectedJugs.length === 0 && !configLoading) {
        return <div className="text-center py-10">No hay productos disponibles.</div>;
    }

    return (
      <>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm sm:text-base text-gray-500 dark:text-gray-400">
          <span>
            Productos seleccionados:{" "}
            <span className="font-bold text-primary text-lg">
              {totalJugs}
            </span>
          </span>
          <span className="text-sm">
            <span className="font-semibold text-gray-700 dark:text-white">
              Tip:
            </span>{" "}
            toca el producto o el botón <strong>+</strong> para agregar uno.
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 max-w-5xl mx-auto my-6">
          {[...selectedJugs]
            .sort((a, b) => {
                const getCapacity = (name) => {
                    const nameLower = name.toLowerCase();
                    const match = nameLower.match(/(\d+(?:\.\d+)?)\s*(?:l|litros?|lt)/);
                    if (match) return parseFloat(match[1]);
                    if (nameLower.includes('garrafón') || nameLower.includes('garrafon')) return 20; 
                    if (nameLower.includes('botella')) return 1; 
                    return 0; 
                };
                const capA = getCapacity(a.name);
                const capB = getCapacity(b.name);
                if (capA !== capB) return capB - capA;
                return a.name.localeCompare(b.name);
            })
            .map((product) => (
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

        <div className="flex justify-between items-center pt-4 border-t dark:border-gray-700">
          <button
            type="button"
            onClick={onBack}
            className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors"
          >
            &larr; Volver al panel
          </button>
          <button
            type="button"
            onClick={handleContinue}
            className="w-full md:w-auto flex items-center justify-center rounded-xl bg-primary px-8 h-12 text-base font-semibold text-white shadow-sm hover:bg-primary/90 transition-all disabled:opacity-50"
            disabled={totalJugs === 0}
          >
            Continuar
          </button>
        </div>
      </>
    );
  };

  return (
    <div>
        <h3 className="text-xl font-bold mb-1">Selecciona los Productos</h3>
        <p className="text-gray-500 mb-6">Indica los productos y cantidades para este pedido.</p>
        {renderContent()}
    </div>
  );
};

export default PosStepOne_SelectJugs;
