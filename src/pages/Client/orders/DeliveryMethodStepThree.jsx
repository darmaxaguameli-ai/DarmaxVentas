// src/pages/cliente/orders/DeliveryMethodStepThree.jsx
import { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import OrderLayout from "../../../layouts/OrderLayout";
import { useAuth } from "../../../context/AuthContext";
import { useConfig } from "../../../context/ConfigContext";
import { useHaptic } from "../../../hooks/useHaptic";

const DeliveryMethodStepThree = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { servicePrices, loading: configLoading } = useConfig();
  const { selection } = useHaptic();

  const previousState = location.state || {};
  const mode = previousState.mode || "refill";
  const buyFlow = previousState.buyFlow || null;

  // Determine items to check availability for
  const itemsToCheck = useMemo(() => {
    const refillItems = [];
    const fromStepTwo = previousState.fromStepTwo || [];
    fromStepTwo.forEach(wt => {
        wt.assignments?.forEach(a => {
            if (a.quantity > 0) {
                refillItems.push({ ...a, waterTypeId: wt.id });
            }
        });
    });
    return refillItems;
  }, [previousState.fromStepTwo]);

  // Check availability of methods based on prices
  const availableMethods = useMemo(() => {
    if (configLoading || !servicePrices || itemsToCheck.length === 0) {
        return { delivery: true, pickup: true, collection: mode === 'refill' };
    }

    const checkMethod = (methodName) => {
        return itemsToCheck.every(item => {
            const jugName = item.name || item.jugName;
            const sizeMatch = jugName ? jugName.match(/(\d+(?:\.\d+)?)\s*(?:l|litros?|lt)/i) : null;
            const sizeSuffix = sizeMatch ? `${sizeMatch[1]}L` : '20L';
            const serviceNameToSearch = `Recarga ${sizeSuffix}`;

            const hasPrice = servicePrices.some(p => 
                p.name === serviceNameToSearch &&
                p.method === methodName &&
                (!item.waterTypeId || p.waterType?.id === item.waterTypeId)
            );
            return hasPrice;
        });
    };

    return {
        delivery: true, 
        pickup: true,   
        collection: mode === 'refill' && checkMethod('Domicilio') // Solo disponible en flujo de recarga
    };
  }, [itemsToCheck, servicePrices, configLoading, mode]);

  // Initialize deliveryMethod based on availability
  const [deliveryMethod, setDeliveryMethod] = useState("delivery");

  const handleBack = () => {
    let targetBackPath = "/pedidos/rellenar/asignar"; 
    if (mode === "buy" || buyFlow) {
        targetBackPath = "/pedidos/comprar/asignar-agua";
    } else if (previousState.backPath && previousState.backPath !== location.pathname) {
        targetBackPath = previousState.backPath;
    }
    navigate(targetBackPath, { state: { ...previousState, deliveryMethod } });
  };

  const methodNeedsAddress = deliveryMethod === "delivery" || deliveryMethod === "home_collection";
  
  let profileIsComplete = false;
  if (isAuthenticated && user) {
    profileIsComplete = !!user.street;
  } else if (previousState.clientData) {
    profileIsComplete = !!previousState.clientData.street;
  }

  const mustFillClientData = methodNeedsAddress && !profileIsComplete;

  const handleContinue = () => {
    if (!deliveryMethod) return;
    let nextState = { ...previousState, deliveryMethod };

    if (mode === "buy" && buyFlow) {
      const { fromStepOneBuy = [], fillOption = "empty" } = buyFlow;
      const orderItems = fromStepOneBuy
        .filter((p) => p.quantity && p.quantity > 0)
        .map((p) => {
          const lowerName = p.name.toLowerCase();
          const isBottle = lowerName.includes('1l') || lowerName.includes('1 litro') || lowerName.includes('1lt') || lowerName.includes('1.5l');
          let cleanName = p.name.replace(/^Garrafón\s+/i, '').replace(/^Botella\s+/i, '');
          const displayName = isBottle ? `Botella ${cleanName}` : `Garrafón ${cleanName}`;

          return {
            id: p.id,
            name: fillOption === "empty" ? `${displayName} (solo envase)` : `${displayName} (lleno)`,
            quantity: p.quantity,
            imageUrl: p.imageUrl,
            description: `Cantidad: ${p.quantity}`,
          };
        });
      nextState = { ...nextState, mode: "buy", buyFlow, orderItems };
    }

    if (mustFillClientData) {
      if (isAuthenticated) {
        navigate('/profile', { state: { fromOrderFlow: true, orderState: nextState } });
      } else {
        navigate("/pedidos/rellenar/datos-cliente", { state: nextState });
      }
    } else {
      navigate("/pedidos/rellenar/resumen", {
        state: { ...nextState, backPath: location.pathname },
      });
    }
  };

  const isDelivery = deliveryMethod === "delivery";
  const isHomeCollection = deliveryMethod === "home_collection";
  const isPickup = deliveryMethod === "pickup";

  const primaryButtonLabel = mustFillClientData ? "Completa tus datos" : "Ver resumen del pedido";
  
  // Ajuste de números de paso
  const stepNumber = mode === 'buy' ? 3 : 3; // Simplificado a 3 para ambos flujos en este punto

  return (
    <OrderLayout
      title={
        <>
          <span className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center justify-center p-1 -ml-2 text-inherit rounded-full active:bg-black/5 dark:active:bg-white/10 transition-colors"
            >
              <span className="material-symbols-outlined text-3xl">arrow_back</span>
            </button>
            Método de entrega
          </span>
          <span className="hidden md:inline">Elige tu método de entrega</span>
        </>
      }
      subtitle="Decide cómo quieres recibir tus productos."
      step={stepNumber}
      totalSteps={4}
    >
      <p className="mt-2 mb-6 text-sm sm:text-base text-text-secondary dark:text-white/80">
        <span className="font-bold text-dark dark:text-white">Tip:</span> toca una de las tarjetas para elegir tu forma preferida de recibir el agua.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 mt-2 mb-8 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
        {/* Entrega a domicilio */}
        <button
            type="button"
            onClick={() => {
                selection();
                setDeliveryMethod("delivery");
            }}
            aria-pressed={isDelivery}
            className={`group relative overflow-hidden flex flex-col items-center justify-between gap-5 rounded-3xl p-6 sm:p-8 text-center backdrop-blur-2xl transition-all duration-300 border active:scale-[0.98] ${
                isDelivery 
                ? "border-primary ring-2 ring-primary/50 bg-gradient-to-b from-primary/10 via-white/95 to-white/90 dark:from-primary/20 dark:via-gray-800/95 dark:to-gray-800/90 shadow-xl shadow-primary/20 scale-[1.02]" 
                : "border-white/80 dark:border-white/10 bg-white/80 dark:bg-gray-800/80 shadow-md shadow-cyan-500/5 hover:border-primary/40 hover:shadow-xl hover:-translate-y-1"
            }`}
        >
            {isDelivery && (
                <div className="absolute top-3 right-3 animate-in zoom-in-75 duration-200">
                    <span className="material-symbols-outlined text-primary text-2xl font-black">
                        check_circle
                    </span>
                </div>
            )}
            <div className={`flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-3xl transition-transform group-hover:scale-105 duration-300 ${
                isDelivery 
                ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-xl shadow-blue-500/30" 
                : "bg-gradient-to-br from-blue-400/20 to-indigo-500/20 text-blue-600 dark:text-blue-400"
            }`}>
                <span className="material-symbols-outlined text-4xl sm:text-5xl">local_shipping</span>
            </div>
            <div className="flex flex-col gap-1.5">
                <h3 className="text-xl sm:text-2xl font-black text-dark dark:text-white leading-tight">Entrega a domicilio</h3>
                <p className="text-xs sm:text-sm text-text-secondary dark:text-white/70 max-w-xs mx-auto leading-relaxed">Llevamos tus productos directamente hasta la puerta de tu hogar.</p>
            </div>
            <div className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-colors ${
                isDelivery ? "bg-primary text-white" : "bg-gray-100 dark:bg-gray-700/60 text-gray-500 dark:text-gray-300"
            }`}>
                {isDelivery ? "Seleccionado" : "Tocar para seleccionar"}
            </div>
        </button>

        {/* Recolección a domicilio (SOLO RECARGA) */}
        {availableMethods.collection && (
            <button
                type="button"
                onClick={() => {
                    selection();
                    setDeliveryMethod("home_collection");
                }}
                aria-pressed={isHomeCollection}
                className={`group relative overflow-hidden flex flex-col items-center justify-between gap-5 rounded-3xl p-6 sm:p-8 text-center backdrop-blur-2xl transition-all duration-300 border active:scale-[0.98] ${
                    isHomeCollection 
                    ? "border-emerald-500 ring-2 ring-emerald-500/50 bg-gradient-to-b from-emerald-500/10 via-white/95 to-white/90 dark:from-emerald-500/20 dark:via-gray-800/95 dark:to-gray-800/90 shadow-xl shadow-emerald-500/20 scale-[1.02]" 
                    : "border-white/80 dark:border-white/10 bg-white/80 dark:bg-gray-800/80 shadow-md shadow-emerald-500/5 hover:border-emerald-400/60 hover:shadow-xl hover:-translate-y-1"
                }`}
            >
                {isHomeCollection && (
                    <div className="absolute top-3 right-3 animate-in zoom-in-75 duration-200">
                        <span className="material-symbols-outlined text-emerald-500 text-2xl font-black">
                            check_circle
                        </span>
                    </div>
                )}
                <div className={`flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-3xl transition-transform group-hover:scale-105 duration-300 ${
                    isHomeCollection 
                    ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-500/30" 
                    : "bg-gradient-to-br from-emerald-400/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400"
                }`}>
                    <span className="material-symbols-outlined text-4xl sm:text-5xl">recycling</span>
                </div>
                <div className="flex flex-col gap-1.5">
                    <h3 className="text-xl sm:text-2xl font-black text-dark dark:text-white leading-tight">Recolección a domicilio</h3>
                    <p className="text-xs sm:text-sm text-text-secondary dark:text-white/70 max-w-xs mx-auto leading-relaxed">Pasamos a tu casa a recoger tus garrafones vacíos para rellenar.</p>
                </div>
                <div className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-colors ${
                    isHomeCollection ? "bg-emerald-500 text-white" : "bg-gray-100 dark:bg-gray-700/60 text-gray-500 dark:text-gray-300"
                }`}>
                    {isHomeCollection ? "Seleccionado" : "Tocar para seleccionar"}
                </div>
            </button>
        )}
        
        {/* Recoger en mostrador */}
        <button
            type="button"
            onClick={() => {
                selection();
                setDeliveryMethod("pickup");
            }}
            aria-pressed={isPickup}
            className={`group relative overflow-hidden flex flex-col items-center justify-between gap-5 rounded-3xl p-6 sm:p-8 text-center backdrop-blur-2xl transition-all duration-300 border active:scale-[0.98] ${
                isPickup 
                ? "border-primary ring-2 ring-primary/50 bg-gradient-to-b from-primary/10 via-white/95 to-white/90 dark:from-primary/20 dark:via-gray-800/95 dark:to-gray-800/90 shadow-xl shadow-primary/20 scale-[1.02]" 
                : "border-white/80 dark:border-white/10 bg-white/80 dark:bg-gray-800/80 shadow-md shadow-cyan-500/5 hover:border-primary/40 hover:shadow-xl hover:-translate-y-1"
            }`}
        >
            {isPickup && (
                <div className="absolute top-3 right-3 animate-in zoom-in-75 duration-200">
                    <span className="material-symbols-outlined text-primary text-2xl font-black">
                        check_circle
                    </span>
                </div>
            )}
            <div className={`flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-3xl transition-transform group-hover:scale-105 duration-300 ${
                isPickup 
                ? "bg-gradient-to-br from-cyan-500 to-teal-600 text-white shadow-xl shadow-cyan-500/30" 
                : "bg-gradient-to-br from-cyan-400/20 to-teal-500/20 text-cyan-600 dark:text-cyan-400"
            }`}>
                <span className="material-symbols-outlined text-4xl sm:text-5xl">storefront</span>
            </div>
            <div className="flex flex-col gap-1.5">
                <h3 className="text-xl sm:text-2xl font-black text-dark dark:text-white leading-tight">Recoger en mostrador</h3>
                <p className="text-xs sm:text-sm text-text-secondary dark:text-white/70 max-w-xs mx-auto leading-relaxed">Vienes personalmente por tu pedido a nuestra sucursal Darmax.</p>
            </div>
            <div className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-colors ${
                isPickup ? "bg-primary text-white" : "bg-gray-100 dark:bg-gray-700/60 text-gray-500 dark:text-gray-300"
            }`}>
                {isPickup ? "Seleccionado" : "Tocar para seleccionar"}
            </div>
        </button>
      </div>

      <footer className="mt-auto pt-4">
        <div className="flex flex-col-reverse sm:flex-row gap-4 justify-between items-center">
          <button 
            type="button" 
            onClick={handleBack} 
            className="hidden md:flex h-11 sm:h-12 w-full sm:w-auto items-center justify-center rounded-2xl border border-white/80 dark:border-white/10 bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-200 text-sm sm:text-base font-bold px-6 hover:bg-white dark:hover:bg-gray-700 shadow-sm backdrop-blur-xl transition-all duration-200 active:scale-95 cursor-pointer"
          >
            Volver
          </button>
          <div className="flex flex-col gap-1 w-full sm:w-auto">
            <button 
              type="button" 
              onClick={handleContinue} 
              disabled={!deliveryMethod} 
              className="flex h-11 sm:h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary hover:bg-primary-dark px-7 text-sm sm:text-base font-bold text-white shadow-md shadow-primary/25 hover:shadow-lg transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <span>{primaryButtonLabel}</span>
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </button>
          </div>
        </div>
      </footer>
    </OrderLayout>
  );
};

export default DeliveryMethodStepThree;
