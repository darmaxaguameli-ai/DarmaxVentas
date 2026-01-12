// src/pages/cliente/orders/OrderSummaryStepFour.jsx
import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import OrderLayout from "../../../layouts/OrderLayout";
import { createOrder } from "../../../api/apiClient";
import { useAuth } from "../../../context/AuthContext";
import { useConfig } from "../../../context/ConfigContext";
import { useClient } from "../context/ClientContext"; // Import useClient

const OrderSummaryStepFour = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const previousState = location.state || {};
  const { user, isAuthenticated } = useAuth();
  const { selectedStore } = useClient(); // Get store from context
  
  const { servicePrices: allServicePrices, loading: configLoading, error: configError } = useConfig();

  const [orderItems, setOrderItems] = useState([]);
  const [collectionFee, setCollectionFee] = useState(0);
  const [orderTotal, setOrderTotal] = useState(0);
  const [isCalculating, setIsCalculating] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estados para fidelidad
  const [redeemableItem, setRedeemableItem] = useState(null);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);

  const mode = previousState.mode || "refill";
  const isRefill = mode === "refill";
  const fromStepTwo = previousState.fromStepTwo || [];
  const maxJugs = previousState.maxJugs ?? 0;
  const deliveryMethod = previousState.deliveryMethod || "delivery";

  // Ya no necesitamos 'garrafonesSeleccionados' para la UI
  const tiposAguaAsignados = useMemo(() =>
    fromStepTwo.filter((item) => item.quantity > 0),
    [fromStepTwo]
  );

  // Efecto para calcular items y buscar recompensas
  useEffect(() => {
    if (configLoading || !isRefill) {
      setIsCalculating(false);
      return;
    }
    
    if (!allServicePrices || allServicePrices.length === 0) {
        setIsCalculating(false);
        return;
    }

    // Lógica de búsqueda de precios corregida para considerar la marca del garrafón
    const findBestPrice = (prices, method, waterTypeId, jugName, jugId) => {
        const backendMethod = {
            'pickup': 'Mostrador',
            'delivery': 'Domicilio',
            'home_collection': 'Domicilio'
        }[method] || method;

        // Extraer tamaño del nombre del garrafón (ej. "4L", "1 Litro")
        // Regex busca número seguido opcionalmente de espacio y luego L, l, Litro, litros, etc.
        const sizeMatch = jugName ? jugName.match(/(\d+(?:\.\d+)?)\s*(?:l|litros?|lt)/i) : null;
        const sizeSuffix = sizeMatch ? `${sizeMatch[1]}L` : '20L'; // Default 20L
        
        let serviceNameToSearch = `Recarga ${sizeSuffix}`; 

        const possibleMatches = prices.filter(p => 
            p.name === serviceNameToSearch &&
            p.method === backendMethod &&
            p.waterType?.id === waterTypeId
        );
        
        if (!possibleMatches.length) return null;

        // Prioridad 1: Encontrar un precio que liste explícitamente esta marca de garrafón.
        const brandSpecificMatch = possibleMatches.find(p =>
            p.jugBrands.length > 0 && p.jugBrands.some(brand => brand.id === jugId)
        );

        if (brandSpecificMatch) {
            return brandSpecificMatch;
        }

        // Prioridad 2: Si no hay uno específico, encontrar un precio "genérico" (que no especifica marcas).
        const genericMatch = possibleMatches.find(p => p.jugBrands.length === 0);

        return genericMatch || null;
    };

    const calculatePrices = () => {
      setIsCalculating(true);
      let calculatedTotal = 0;
      const finalOrderItems = [];
      const currentCollectionFee = deliveryMethod === 'home_collection' ? 10 : 0;
      setCollectionFee(currentCollectionFee);

      for (const waterType of tiposAguaAsignados) {
        for (const assignment of waterType.assignments) {
          const priceRecord = findBestPrice(allServicePrices, deliveryMethod, waterType.id, assignment.jugName, assignment.jugId);
          if (priceRecord) {
            calculatedTotal += priceRecord.price * assignment.quantity;
            finalOrderItems.push({
              quantity: assignment.quantity,
              price: priceRecord.price,
              servicePriceId: priceRecord.id,
              jugBrandId: assignment.jugId,
              jugBrandName: assignment.jugName,
              jugBrandImageUrl: assignment.imageUrl,
              waterTypeName: waterType.name, // <-- DATO ENRIQUECIDO
            });
          } else {
             console.warn(`CLIENT-SIDE: No se encontró precio para ${assignment.jugName} con agua ${waterType.name} y método ${deliveryMethod}`);
          }
        }
      }
      
      console.log("DEBUG: Auth Status", { isAuthenticated, userPoints: user?.loyaltyPoints });
      console.log("DEBUG: Final Items", finalOrderItems);

      // Lógica Inteligente de Recompensas: Buscar el item más caro que se pueda pagar con puntos
      if (isAuthenticated && user && user.loyaltyPoints > 0) {
          // Ordenar items por precio descendente para encontrar el mejor valor
          const sortedItems = [...finalOrderItems].sort((a, b) => Number(b.price) - Number(a.price));
          // Encontrar el primero que cueste menos o igual a los puntos
          const bestReward = sortedItems.find(item => Number(item.price) <= Number(user.loyaltyPoints));
          
          console.log("DEBUG: Best Reward Found", bestReward);

          if (bestReward) {
              setRedeemableItem(bestReward);
          } else {
              setRedeemableItem(null);
          }
      }

      setOrderTotal(calculatedTotal + currentCollectionFee);
      setOrderItems(finalOrderItems); 
      setIsCalculating(false);
    };

    calculatePrices();

  }, [tiposAguaAsignados, deliveryMethod, isRefill, allServicePrices, configLoading, isAuthenticated, user]);

    // Recalcular total visual cuando cambia pointsToRedeem
    const displayTotal = Math.max(0, orderTotal - pointsToRedeem);

    const toggleRedemption = () => {
        if (pointsToRedeem > 0) {
            // Cancelar canje
            setPointsToRedeem(0);
        } else if (redeemableItem) {
            // Aplicar canje
            setPointsToRedeem(redeemableItem.price);
        }
    };

    const deliveryLabels = {
      delivery: "Entrega a domicilio",
      home_collection: "Recolección a domicilio",
      pickup: "Recoger en mostrador",
    };
  
    const handleBack = () => {
      const targetBackPath = location.state?.backPath || "/pedidos/rellenar/entrega";
      navigate(targetBackPath, { state: location.state });
    };
  
    const handleConfirm = async () => {
      setIsSubmitting(true);
  
      if (isRefill && displayTotal === 0 && orderItems.length > 0 && pointsToRedeem === 0) { // Permitir total 0 si es por puntos
        alert("El total del pedido no puede ser $0 sin canje de puntos.");
        setIsSubmitting(false);
        return;
      }

      // --- SUCURSAL CONTEXT ---
      // Prioritize storeId from navigation state, then context, then user preference
      const finalStoreId = previousState.storeId || selectedStore?.id || user?.storeId;

      if (!finalStoreId) {
          alert("No se pudo determinar la sucursal para este pedido. Por favor, selecciona una sucursal al inicio.");
          setIsSubmitting(false);
          return;
      }
  
      // Construir el payload base del pedido
      const orderPayload = {
        total: displayTotal, // Enviar el total ya descontado
        deliveryMethod: deliveryMethod,
        paymentStatus: displayTotal === 0 ? "PAGADO" : "NO_PAGADO", // Si es gratis por puntos, ya está pagado
        status: "PENDIENTE",
        items: orderItems,
        storeId: finalStoreId, // ✅ STORE ID ADDED
        pointsUsed: pointsToRedeem // ✅ Puntos a descontar
      };
      
      // Añadir clienteId solo si está disponible
      const clientId = (isAuthenticated && user) ? user.id : previousState.clientData?.id;
      if (clientId) {
        orderPayload.clienteId = clientId;
      }
  
      try {
        const newOrder = await createOrder(orderPayload);
        navigate("/pedidos/confirmado", { state: { orderId: newOrder.customId, orderType: mode } });
      } catch (error) {
        console.error("Error al crear el pedido:", error);
        alert(`Error al crear el pedido: ${error.message || "Intenta de nuevo."}`);
      } finally {
        setIsSubmitting(false);
      }
    };
  
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
              Resumen
            </span>
            <span className="hidden md:inline">{isRefill ? "Revisa tu pedido de recarga" : "Revisa tu compra"}</span>
          </>
        }
        subtitle="Confirma que todo sea correcto antes de finalizar."
        step={4}
        totalSteps={4}
      >
        <div className="w-full max-w-2xl mx-auto flex flex-col gap-4 sm:gap-6">
          <div className="rounded-xl bg-light/60 dark:bg-dark/70 border border-light/60 dark:border-white/15 p-4 flex flex-col gap-2">
            <p className="text-xs sm:text-sm font-semibold text-text-secondary dark:text-white/70 uppercase tracking-[0.08em]">Método de entrega</p>
            <p className="text-base sm:text-lg font-bold text-dark dark:text-white">{deliveryLabels[deliveryMethod] || "Entrega a domicilio"}</p>
          </div>

          {/* Tarjeta de Fidelidad Inteligente */}
          {isAuthenticated && redeemableItem && (
              <div className="rounded-xl bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-700/50 p-4 relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
                      <div>
                          <h3 className="font-bold text-yellow-800 dark:text-yellow-400 flex items-center gap-2">
                              <span className="material-symbols-outlined">stars</span>
                              ¡Recompensa Disponible!
                          </h3>
                          <p className="text-sm text-yellow-900/80 dark:text-yellow-200/80 mt-1">
                              Tienes <strong>{user.loyaltyPoints} puntos</strong>. Úsalos para llevarte: <br/>
                              <span className="font-semibold">1x {redeemableItem.jugBrandName} de {redeemableItem.waterTypeName.replace('Agua ', '')}</span> GRATIS.
                          </p>
                      </div>
                      <button 
                          onClick={toggleRedemption}
                          className={`px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-sm ${
                              pointsToRedeem > 0 
                              ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300' 
                              : 'bg-yellow-400 text-yellow-900 hover:bg-yellow-500'
                          }`}
                      >
                          {pointsToRedeem > 0 ? 'Cancelar Canje' : 'Canjear Puntos'}
                      </button>
                  </div>
              </div>
          )}
  
          <div className="flex flex-col gap-4">
            <h2 className="text-[20px] sm:text-[22px] font-bold text-dark dark:text-white">
              Tu pedido
            </h2>
                        <div className="flex flex-col divide-y divide-light/60 dark:divide-white/10">
                          {isCalculating || configLoading ? (
                            <span className="text-sm text-text-secondary dark:text-white/70 py-4">Calculando precios...</span>
                          ) : orderItems.length > 0 ? (
                            orderItems.map((item, index) => (
                              <div key={`${item.jugBrandId}-${index}`} className="flex items-center justify-between py-3">
                                <div className="flex items-center gap-3">
                                  <img src={item.jugBrandImageUrl} alt={item.jugBrandName} className="h-10 w-10 object-contain" />
                                  <div>
                                    <p className="font-semibold text-dark dark:text-white">{item.jugBrandName}</p>
                                    <p className="text-sm text-text-secondary dark:text-white/70">
                                      {item.quantity} x recarga de {item.waterTypeName.replace('Agua ', '')}
                                    </p>
                                  </div>
                                </div>
                                <span className="font-semibold text-dark dark:text-white">
                                  ${(item.price * item.quantity).toFixed(2)}
                                </span>
                              </div>
                            ))
                          ) : (
                            <span className="text-sm text-red-500 py-4">No hay ítems en tu pedido o no se pudieron calcular los precios.</span>
                          )}
                          {collectionFee > 0 && (
                            <div className="flex items-center justify-between py-3">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 flex items-center justify-center">
                                  <span className="material-symbols-outlined text-text-secondary dark:text-white/70 text-2xl">recycling</span>
                                </div>
                                <div>
                                  <p className="font-semibold text-dark dark:text-white">Costo de recolección</p>
                                  <p className="text-sm text-text-secondary dark:text-white/70">
                                    Servicio a domicilio
                                  </p>
                                </div>
                              </div>
                              <span className="font-semibold text-dark dark:text-white">
                                ${collectionFee.toFixed(2)}
                              </span>
                            </div>
                          )}
                          
                          {/* Línea de Descuento por Puntos */}
                          {pointsToRedeem > 0 && (
                              <div className="flex items-center justify-between py-3 bg-yellow-50/50 dark:bg-yellow-900/10 -mx-2 px-2 rounded-lg border border-yellow-100 dark:border-yellow-800/30">
                                <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 flex items-center justify-center text-yellow-600">
                                    <span className="material-symbols-outlined text-2xl">stars</span>
                                  </div>
                                  <div>
                                    <p className="font-bold text-yellow-800 dark:text-yellow-400">Canje de Puntos</p>
                                    <p className="text-sm text-yellow-700/80 dark:text-yellow-300/70">
                                      1x Producto Gratis
                                    </p>
                                  </div>
                                </div>
                                <span className="font-bold text-green-600 dark:text-green-400">
                                  -${pointsToRedeem.toFixed(2)}
                                </span>
                              </div>
                          )}
                        </div>
          </div>
  
          <div className="border-t border-light/60 dark:border-white/10 pt-4 sm:pt-6 space-y-4">
              <div className="flex items-center justify-between font-bold">
                <p className="text-base sm:text-lg text-dark dark:text-white">Importe total</p>
                <p className="text-2xl sm:text-3xl text-primary">
                  {isCalculating || configLoading ? '...' : `$${displayTotal.toFixed(2)}`}
                </p>
              </div>
          </div>
  
      <footer className="mt-auto pt-4 md:pt-8">
        <div className="flex flex-col-reverse sm:flex-row gap-4 justify-between items-center">
          <button type="button" onClick={handleBack} className="hidden md:flex h-12 sm:h-14 w-full sm:w-auto items-center justify-center rounded-lg border border-slate-300 bg-slate-100 text-dark dark:bg-slate-800 dark:text-white dark:border-slate-600 text-base sm:text-lg font-semibold px-6 sm:px-8 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
            Volver al paso 3
          </button>
          <div className="flex flex-col gap-1 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isCalculating || configLoading || configError || isSubmitting || (isRefill && orderTotal === 0 && orderItems.length > 0)}
              className="flex h-12 sm:h-14 w-full items-center justify-center rounded-xl bg-primary px-8 sm:px-10 text-base sm:text-lg font-semibold text-white shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Confirmando..." : "Confirmar pedido"}
            </button>
          </div>
        </div>
      </footer>
          
        </div>
      </OrderLayout>
    );};

export default OrderSummaryStepFour;
