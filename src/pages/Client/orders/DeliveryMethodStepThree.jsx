// src/pages/cliente/orders/DeliveryMethodStepThree.jsx
import { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import OrderLayout from "../../../layouts/OrderLayout";
import { useAuth } from "../../../context/AuthContext";
import { useConfig } from "../../../context/ConfigContext";

const DeliveryMethodStepThree = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { servicePrices, loading: configLoading } = useConfig();

  const previousState = location.state || {};
  const mode = previousState.mode || "refill";
  const buyFlow = previousState.buyFlow || null;

  // Determine items to check availability for
  const itemsToCheck = useMemo(() => {
    if (mode === "buy" && buyFlow) {
        return buyFlow.fromStepOneBuy?.filter(p => p.quantity > 0) || [];
    }
    // Refill mode: flatten the structure (waterTypes -> assignments)
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
  }, [mode, buyFlow, previousState.fromStepTwo]);

  // Check availability of methods based on prices
  const availableMethods = useMemo(() => {
    if (configLoading || !servicePrices || itemsToCheck.length === 0) return { delivery: true, pickup: true };

    const checkMethod = (methodName) => {
        return itemsToCheck.every(item => {
            // Logic similar to OrderSummaryStepFour
            const jugName = item.name || item.jugName;
            const sizeMatch = jugName ? jugName.match(/(\d+(?:\.\d+)?)\s*(?:l|litros?|lt)/i) : null;
            const sizeSuffix = sizeMatch ? `${sizeMatch[1]}L` : '20L';
            const serviceNameToSearch = `Recarga ${sizeSuffix}`; // Assuming same service name logic for buy/refill for now, or adapt if Buy has differnet names

            const hasPrice = servicePrices.some(p => 
                p.name === serviceNameToSearch &&
                p.method === methodName &&
                (!item.waterTypeId || p.waterType?.id === item.waterTypeId)
            );
            return hasPrice;
        });
    };

    return {
        delivery: checkMethod('Domicilio'),
        pickup: checkMethod('Mostrador')
    };
  }, [itemsToCheck, servicePrices, configLoading]);

  // Initialize deliveryMethod based on availability
  const [deliveryMethod, setDeliveryMethod] = useState(() => {
      // Default to delivery if available, else pickup, else null
      // We can't know availableMethods inside useState initializer accurately if config is loading
      // So we handle this with an effect or just default 'delivery' and let user switch if disabled?
      // Better to default 'delivery' but handle valid selection later.
      return "delivery";
  });

  // Effect to ensure selected method is valid
  useState(() => {
      if (!configLoading && availableMethods) {
          if (!availableMethods.delivery && deliveryMethod === 'delivery') {
              setDeliveryMethod('pickup');
          }
      }
  }, [availableMethods, configLoading]);

  const handleBack = () => {
    // Determine the correct back path based on the flow mode
    let targetBackPath = "/pedidos/rellenar/asignar"; // Default for refill

    if (mode === "buy" || buyFlow) {
        targetBackPath = "/pedidos/comprar/asignar-agua";
    } else if (previousState.backPath && previousState.backPath !== location.pathname) {
        // Fallback to whatever was passed as backPath if not explicitly caught above
        // BUT prevent loop if backPath points to current page (which happens when returning from Step 4)
        targetBackPath = previousState.backPath;
    }

    navigate(targetBackPath, { state: { ...previousState, deliveryMethod } });
  };

  // Lógica de validación mejorada
  const methodNeedsAddress = deliveryMethod === "delivery" || deliveryMethod === "home_collection";
  
  let profileIsComplete = false;
  if (isAuthenticated && user) {
    // Un perfil de usuario logueado está completo si tiene calle
    profileIsComplete = !!user.street;
  } else if (previousState.clientData) {
    // Un perfil de invitado está completo si ya ha pasado por el formulario
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
          // Determinar si es botella o garrafón para el flujo de compra
          const lowerName = p.name.toLowerCase();
          const isBottle = lowerName.includes('1l') || lowerName.includes('1 litro') || lowerName.includes('1lt') || lowerName.includes('1.5l');
          
          // Limpiar nombre si ya trae prefijo para no duplicar (opcional, pero seguro)
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

    // Redirección inteligente
    if (mustFillClientData) {
      if (isAuthenticated) {
        // Usuario logueado con perfil incompleto -> va a su perfil
        navigate('/profile', { 
          state: { 
            fromOrderFlow: true, // Bandera para indicar que venimos de un pedido
            orderState: nextState // Guardamos el estado del pedido
          } 
        });
      } else {
        // Usuario invitado sin datos -> va al formulario de invitado
        navigate("/pedidos/rellenar/datos-cliente", { state: nextState });
      }
    } else {
      // Perfil completo o no se necesita dirección -> va al resumen
      navigate("/pedidos/rellenar/resumen", {
        state: {
          ...nextState,
          backPath: location.pathname, // Añadir la ruta actual para el regreso
        },
      });
    }
  };

  const isDelivery = deliveryMethod === "delivery";
  const isHomeCollection = deliveryMethod === "home_collection";
  const isPickup = deliveryMethod === "pickup";

  const primaryButtonLabel = mustFillClientData
    ? "Completa tus datos"
    : "Ver resumen del pedido";

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
      subtitle="Decide cómo quieres que manejemos tus garrafones."
      step={3}
      totalSteps={4}
    >
      <p className="mt-2 mb-4 text-sm sm:text-base text-text-secondary dark:text-white/80">
        <span className="font-semibold text-dark dark:text-white">Tip:</span>{" "}
        toca una de las opciones para seleccionar cómo quieres recibir o
        entregar tus garrafones.
      </p>

      <div className="grid grid-cols-1 gap-6 mt-2 mb-6 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
        {availableMethods.delivery && (
            <>
                <button
                type="button"
                onClick={() => setDeliveryMethod("delivery")}
                aria-pressed={isDelivery}
                className={`flex flex-col items-center justify-center gap-4 rounded-2xl px-6 py-8 text-center shadow-md backdrop-blur-xl transition-all border ${isDelivery ? "border-primary bg-white/95 dark:bg-dark/70 dark:border-primary scale-[1.02]" : "border-light/60 dark:border-white/10 bg-white/90 dark:bg-dark/60 hover:border-primary/40"}`}
                >
                <div className={`flex h-20 w-20 items-center justify-center rounded-full ${isDelivery ? "bg-primary/10 text-primary" : "bg-light dark:bg-dark text-text-secondary dark:text-white/70"}`}>
                    <span className="material-symbols-outlined text-4xl sm:text-5xl">local_shipping</span>
                </div>
                <div className="flex flex-col gap-2">
                    <h3 className="text-xl sm:text-2xl font-bold text-dark dark:text-white">Entrega a domicilio</h3>
                    <p className="text-sm sm:text-base text-text-secondary dark:text-white/70 max-w-xs mx-auto">Llevamos tus garrafones llenos directamente a tu casa.</p>
                </div>
                </button>
                <button
                type="button"
                onClick={() => setDeliveryMethod("home_collection")}
                aria-pressed={isHomeCollection}
                className={`flex flex-col items-center justify-center gap-4 rounded-2xl px-6 py-8 text-center shadow-md backdrop-blur-xl transition-all border ${isHomeCollection ? "border-primary bg-white/95 dark:bg-dark/70 dark:border-primary scale-[1.02]" : "border-light/60 dark:border-white/10 bg-white/90 dark:bg-dark/60 hover:border-primary/40"}`}
                >
                <div className={`flex h-20 w-20 items-center justify-center rounded-full ${isHomeCollection ? "bg-primary/10 text-primary" : "bg-light dark:bg-dark text-text-secondary dark:text-white/70"}`}>
                    <span className="material-symbols-outlined text-4xl sm:text-5xl">recycling</span>
                </div>
                <div className="flex flex-col gap-2">
                    <h3 className="text-xl sm:text-2xl font-bold text-dark dark:text-white">Recolección a domicilio</h3>
                    <p className="text-sm sm:text-base text-text-secondary dark:text-white/70 max-w-xs mx-auto">Pasamos a tu casa a recoger tus garrafones vacíos para recarga.</p>
                </div>
                </button>
            </>
        )}
        
        {availableMethods.pickup && (
            <button
            type="button"
            onClick={() => setDeliveryMethod("pickup")}
            aria-pressed={isPickup}
            className={`flex flex-col items-center justify-center gap-4 rounded-2xl px-6 py-8 text-center shadow-md backdrop-blur-xl transition-all border ${isPickup ? "border-primary bg-white/95 dark:bg-dark/70 dark:border-primary scale-[1.02]" : "border-light/60 dark:border-white/10 bg-white/90 dark:bg-dark/60 hover:border-primary/40"}`}
            >
            <div className={`flex h-20 w-20 items-center justify-center rounded-full ${isPickup ? "bg-primary/10 text-primary" : "bg-light dark:bg-dark text-text-secondary dark:text-white/70"}`}>
                <span className="material-symbols-outlined text-4xl sm:text-5xl">storefront</span>
            </div>
            <div className="flex flex-col gap-2">
                <h3 className="text-xl sm:text-2xl font-bold text-dark dark:text-white">Recoger en mostrador</h3>
                <p className="text-sm sm:text-base text-text-secondary dark:text-white/70 max-w-xs mx-auto">Entrega tus garrafones en el mostrador de nuestra sucursal Darmax.</p>
            </div>
            </button>
        )}

        {!availableMethods.delivery && !availableMethods.pickup && (
            <div className="col-span-full text-center py-10 text-gray-500">
                No hay métodos de entrega disponibles para los productos seleccionados.
            </div>
        )}
      </div>
      <footer className="mt-auto pt-2">
        <div className="flex flex-col-reverse sm:flex-row gap-4 justify-between items-center">
          <button type="button" onClick={handleBack} className="hidden md:flex h-12 sm:h-14 w-full sm:w-auto items-center justify-center rounded-lg border border-slate-300 bg-slate-100 text-dark dark:bg-slate-800 dark:text-white dark:border-slate-600 text-base sm:text-lg font-semibold px-6 sm:px-8 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
            Volver al paso 2
          </button>
          <div className="flex flex-col gap-1 w-full sm:w-auto">
            <button type="button" onClick={handleContinue} disabled={!deliveryMethod} className="flex h-12 sm:h-14 w-full items-center justify-center rounded-xl bg-primary px-8 sm:px-10 text-base sm:text-lg font-semibold text-white shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-all disabled:opacity-60 disabled:cursor-not-allowed">
              {primaryButtonLabel}
            </button>
            {mustFillClientData && (
              <p className="text-xs sm:text-sm text-text-secondary dark:text-white/70 text-center sm:text-right">
                Necesitamos algunos datos de tu domicilio para continuar.
              </p>
            )}
          </div>
        </div>
      </footer>
    </OrderLayout>
  );
};

export default DeliveryMethodStepThree;
