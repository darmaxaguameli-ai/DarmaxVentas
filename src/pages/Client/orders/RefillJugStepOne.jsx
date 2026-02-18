// src/pages/cliente/orders/RefillJugStepOne.jsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import OrderLayout from "../../../layouts/OrderLayout";
import QuantityCard from "../../../components/order/QuantityCard";
import { useConfig } from "../../../context/ConfigContext";
import { useHaptic } from "../../../hooks/useHaptic";
import { fetchUserPreferences, saveUserPreferences } from "../../../api/apiClient";
import { useAuth } from "../../../context/AuthContext";

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
  const { isAuthenticated } = useAuth();
  const { impact } = useHaptic();
  
  const [selectedJugs, setSelectedJugs] = useState([]);
  const [preferences, setPreferences] = useState(null);
  const [loadingPrefs, setLoadingPrefs] = useState(false);
  const [saveAsDefault, setSaveAsDefault] = useState(false);

  // Load Preferences
  useEffect(() => {
    if (isAuthenticated) {
      const loadPrefs = async () => {
        try {
          setLoadingPrefs(true);
          const prefs = await fetchUserPreferences();
          if (prefs && prefs.length > 0) {
            setPreferences(prefs);
          }
        } catch (err) {
          console.error("Error loading preferences:", err);
        } finally {
          setLoadingPrefs(false);
        }
      };
      loadPrefs();
    }
  }, [isAuthenticated]);

  const initializeJugs = useCallback((brands, initialSelections = null, prefs = null) => {
    return brands.map((brand, index) => {
      // 1. Prioritize current flow state (if user went back)
      const existingInState = initialSelections?.find(p => p.id === brand.id);
      
      // 2. If no state, use preferences if available
      const pref = prefs?.find(p => p.jugBrandId === brand.id);
      const initialQty = existingInState ? existingInState.quantity : (pref ? pref.quantity : 0);

      const finalImage = brand.imageUrl || getImageUrlForBrand(brand.name);
      const lowerName = brand.name.toLowerCase();
      const isBottle = lowerName.includes('1l') || lowerName.includes('1 litro') || lowerName.includes('1lt') || lowerName.includes('1.5l');
      const displayName = isBottle ? `Botella ${brand.name}` : `Garrafón ${brand.name}`;

      return {
        id: brand.id,
        name: displayName,
        quantity: initialQty,
        featured: index === 0,
        imageUrl: finalImage,
      };
    });
  }, []);

  useEffect(() => {
    if (!configLoading && !configError && fetchedJugBrands.length > 0) {
      const initial = initializeJugs(fetchedJugBrands, location.state?.fromStepOne, preferences);
      setSelectedJugs(initial);
    }
  }, [fetchedJugBrands, configLoading, configError, location.state, preferences, initializeJugs]);

  const totalJugs = selectedJugs.reduce((sum, p) => sum + p.quantity, 0);

  const applyPreferences = () => {
    if (!preferences) return;
    impact('medium');
    const updated = selectedJugs.map(jug => {
      const pref = preferences.find(p => p.jugBrandId === jug.id);
      return { ...jug, quantity: pref ? pref.quantity : 0 };
    });
    setSelectedJugs(updated);
    toast.success("Se aplicó tu pedido habitual.");
  };

  const handleChangeQuantity = (id, delta) => {
    setSelectedJugs((prev) =>
      prev.map((p) => {
        if (p.id === id) {
            return { 
                ...p, 
                quantity: Math.max(0, p.quantity + delta),
                featured: true 
            };
        }
        return { ...p, featured: false };
      })
    );
    if (delta > 0) {
      impact();
    }
  };

  const handleContinue = async () => {
    if (totalJugs === 0) {
      toast.warning("Debes seleccionar al menos 1 garrafón.");
      return;
    }

    // Save preferences if requested
    if (isAuthenticated && saveAsDefault) {
      try {
        const prefsToSave = selectedJugs
          .filter(j => j.quantity > 0)
          .map(j => ({ jugBrandId: j.id, quantity: j.quantity }));
        
        await saveUserPreferences(prefsToSave);
      } catch (err) {
        console.error("Failed to save preferences:", err);
      }
    }

    const { fromStepOne, fromStepTwo, ...restOfState } = location.state || {};

    navigate("/pedidos/rellenar/asignar", {
      state: {
        ...restOfState,
        maxJugs: totalJugs,
        fromStepOne: selectedJugs.filter(p => p.quantity > 0),
        backPath: location.pathname,
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm sm:text-base text-text-secondary dark:text-white/80">
              Garrafones seleccionados:{" "}
              <span className="font-bold text-primary text-lg">
                {totalJugs}
              </span>
            </span>
            <span className="text-xs text-gray-500">
              <span className="font-semibold text-dark dark:text-white">Tip:</span> toca el garrafón para agregar uno.
            </span>
          </div>

          {preferences && (
            <button 
              onClick={applyPreferences}
              className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-bold hover:bg-primary/20 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-lg">history</span>
              Cargar mi pedido habitual
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4 max-w-5xl mx-auto">
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

        <div className="flex flex-col gap-6 pt-4">
          {isAuthenticated && totalJugs > 0 && (
            <label className="flex items-center gap-3 cursor-pointer group self-center sm:self-end">
              <div className="relative flex items-center justify-center">
                <input 
                  type="checkbox" 
                  checked={saveAsDefault}
                  onChange={(e) => setSaveAsDefault(e.target.checked)}
                  className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-slate-300 bg-white checked:border-primary checked:bg-primary transition-all"
                />
                <span className="material-symbols-outlined absolute text-white opacity-0 peer-checked:opacity-100 text-sm font-bold">check</span>
              </div>
              <span className="text-sm font-medium text-text-secondary dark:text-white/70 group-hover:text-primary transition-colors">
                Guardar estos garrafones como mi pedido habitual
              </span>
            </label>
          )}

          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={handleGoToStart}
              className="hidden md:block text-sm font-medium text-text-secondary dark:text-white/70 hover:text-primary dark:hover:text-primary transition-colors"
            >
              &larr; Volver al inicio
            </button>
            <button
              type="button"
              onClick={handleContinue}
              className="w-full md:w-auto flex items-center justify-center rounded-xl bg-primary text-white px-10 h-14 text-lg font-black shadow-xl shadow-primary/30 hover:bg-primary-dark transition-all active:scale-[0.98] disabled:opacity-50 disabled:scale-100"
              disabled={totalJugs === 0}
            >
              Continuar al paso 2
            </button>
          </div>
        </div>
      </>
    );
  };

  return (
    <OrderLayout
      title={
        <>
          <span className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={handleGoToStart}
              className="inline-flex items-center justify-center p-1 -ml-2 text-inherit rounded-full active:bg-black/5 dark:active:bg-white/10 transition-colors"
            >
              <span className="material-symbols-outlined text-3xl">arrow_back</span>
            </button>
            Selecciona tus garrafones
          </span>
          <span className="hidden md:inline">Selecciona tus garrafones a rellenar</span>
        </>
      }
      subtitle="Indica cuántos garrafones de cada tipo deseas que recojamos para recarga."
      step={1}
      totalSteps={4}
    >
      <div className="flex flex-col gap-4 sm:gap-6">
        {renderContent()}
      </div>
    </OrderLayout>
  );
};

export default RefillJugStepOne;
