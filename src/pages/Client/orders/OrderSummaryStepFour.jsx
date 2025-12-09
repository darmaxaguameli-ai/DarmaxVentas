// src/pages/cliente/orders/OrderSummaryStepFour.jsx
import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import OrderLayout from "../../../layouts/OrderLayout";
import { createOrder } from "../../../api/apiClient";
import { useAuth } from "../../../context/AuthContext";
import { useConfig } from "../../../context/ConfigContext";

const OrderSummaryStepFour = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const previousState = location.state || {};
  const { user, isAuthenticated } = useAuth();
  
  const { servicePrices: allServicePrices, loading: configLoading, error: configError } = useConfig();

  // Guardará los items formateados para el ticket: { name, quantity, price, servicePriceId }
  const [orderItems, setOrderItems] = useState([]);
  const [orderTotal, setOrderTotal] = useState(0);
  const [isCalculating, setIsCalculating] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  useEffect(() => {
    if (configLoading || !isRefill) {
      setIsCalculating(false);
      return;
    }
    
    if (!allServicePrices || allServicePrices.length === 0) {
        setIsCalculating(false);
        return;
    }

    // Lógica de búsqueda de precios corregida para diferenciar por tamaño
    const findBestPrice = (prices, method, waterTypeId, jugName) => {
        const backendMethod = {
            'pickup': 'Mostrador',
            'delivery': 'Domicilio',
            'home_collection': 'Domicilio'
        }[method] || method;

        let serviceNameToSearch = 'Recarga 20L'; // Asumir 20L por defecto
        if (jugName && (jugName.includes('10L') || jugName.includes('10 Litros'))) {
            serviceNameToSearch = 'Recarga 10L';
        }

        const possibleMatches = prices.filter(p => 
            p.name === serviceNameToSearch &&
            p.method === backendMethod &&
            p.waterType?.id === waterTypeId
        );
        
        // Dado que la lógica de negocio no parece requerir especificidad de marca, 
        // devolvemos la primera coincidencia que ahora es específica por tamaño.
        return possibleMatches[0] || null;
    };

    const calculatePrices = () => {
      setIsCalculating(true);
      let calculatedTotal = 0;
      const finalOrderItemsForState = [];
      const finalOrderItemsForBackend = [];

      // Iterar sobre los tipos de agua para agrupar en el ticket
      for (const waterType of tiposAguaAsignados) {
        let quantityForWaterType = 0;
        let priceForWaterType = 0;
        
        // Calcular el precio para cada asignación individual
        for (const assignment of waterType.assignments) {
          const priceRecord = findBestPrice(allServicePrices, deliveryMethod, waterType.id, assignment.jugName);
          if (priceRecord) {
            calculatedTotal += priceRecord.price * assignment.quantity;
            quantityForWaterType += assignment.quantity;
            priceForWaterType = priceRecord.price; // Asumimos que el precio es el mismo para un tipo de agua
            
            // Llenar los items para el backend con todo el detalle
            finalOrderItemsForBackend.push({
              quantity: assignment.quantity,
              price: priceRecord.price,
              servicePriceId: priceRecord.id,
              jugBrandId: assignment.jugId,
              jugBrandName: assignment.jugName,
              jugBrandImageUrl: assignment.imageUrl,
            });
          } else {
             console.warn(
                `CLIENT-SIDE: No se encontró precio para el garrafón ${assignment.jugName} con agua ${waterType.name} y método ${deliveryMethod}`
              );
          }
        }
        
        // Agrupar para mostrar en el ticket de la UI
        if(quantityForWaterType > 0) {
            finalOrderItemsForState.push({
                name: `Recarga ${waterType.name.replace('Agua ', '')}`,
                quantity: quantityForWaterType,
                price: priceForWaterType,
                servicePriceId: waterType.id, // Usar un ID único para la key del map
            });
        }
      }
      
      setOrderTotal(calculatedTotal);
      // El estado 'orderItems' ahora contiene los datos para el backend
      setOrderItems(finalOrderItemsForBackend); 
      // Podríamos usar 'finalOrderItemsForState' si quisiéramos, pero la info ya está en 'tiposAguaAsignados'
      // Para mantenerlo simple, construiremos el ticket desde 'tiposAguaAsignados' y los precios encontrados.
      setIsCalculating(false);
    };

    calculatePrices();

  }, [tiposAguaAsignados, deliveryMethod, isRefill, allServicePrices, configLoading]);

  // Re-calculamos los items para el ticket de forma segura
  const ticketItems = useMemo(() => {
    if (isCalculating || !allServicePrices) return [];

    return tiposAguaAsignados.map(wt => {
        const firstAssignment = wt.assignments[0];
        if (!firstAssignment) return null;

        const priceRecord = allServicePrices.find(p => 
            p.waterType?.id === wt.id && 
            (p.name.includes('20L') || p.name.includes('10L') || p.name === 'Recarga') &&
            p.method === {'pickup': 'Mostrador', 'delivery': 'Domicilio', 'home_collection': 'Domicilio'}[deliveryMethod]
        );
        
        return {
            name: `Recarga ${wt.name.replace('Agua ', '')}`,
            quantity: wt.quantity,
            price: priceRecord?.price || 0,
            id: wt.id
        }
    }).filter(Boolean);
  }, [isCalculating, allServicePrices, tiposAguaAsignados, deliveryMethod]);

  const deliveryLabels = {
    delivery: "Entrega a domicilio",
    home_collection: "Recolección a domicilio",
    pickup: "Recoger en mostrador",
  };

  const deliveryDescription = {
    delivery: "Un repartidor llevará tus garrafones a la dirección que nos indiques.",
    home_collection: "Pasamos a tu domicilio por los garrafones vacíos y luego te los entregamos llenos.",
    pickup: "Podrás pasar al mostrador de nuestra sucursal Darmax a recoger tu pedido.",
  };

  const handleBack = () => {
    const backPath = previousState.backPath || "/pedidos/rellenar/entrega";
    navigate(backPath, { state: previousState });
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    let clientId = null;

    if (isAuthenticated && user) {
      clientId = user.id;
    } else if (previousState.clientData) {
      clientId = previousState.clientData.id;
    }

    if (!clientId) {
      alert("No se pudo identificar al cliente para crear el pedido.");
      setIsSubmitting(false);
      return;
    }

    if (isRefill && orderTotal === 0 && tiposAguaAsignados.length > 0) {
      alert("El total del pedido no puede ser $0 para una recarga. Verifica la configuración de precios.");
      setIsSubmitting(false);
      return;
    }

    // El backend espera una lista de items, que ya tenemos en `orderItems`
    const orderPayload = {
      clienteId: clientId,
      total: orderTotal,
      deliveryMethod: deliveryMethod,
      paymentStatus: "NO_PAGADO",
      status: "PENDIENTE",
      items: orderItems,
    };

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
      title={isRefill ? "Revisa tu pedido de recarga" : "Revisa tu compra"}
      subtitle="Confirma que todo sea correcto antes de finalizar."
      step={4}
      totalSteps={4}
    >
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mt-4">
        {/* Columna Izquierda: AHORA SOLO MUESTRA EL DETALLE DE LA RECARGA */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          {isRefill && tiposAguaAsignados.length > 0 && (
            <div className="rounded-2xl border border-light/60 dark:border-white/10 bg-white/95 dark:bg-dark/60 shadow-md backdrop-blur-xl">
              <h2 className="px-6 pt-5 pb-3 text-[20px] sm:text-[22px] font-bold text-dark dark:text-white border-b border-light/60 dark:border-white/10">
                Detalle de la recarga
              </h2>
              <div className="flex flex-col divide-y divide-light/60 dark:divide-white/10">
                {tiposAguaAsignados.map((waterType) => (
                  <div key={waterType.id} className="px-6 py-4">
                    <p className="text-base sm:text-lg font-bold text-dark dark:text-white">
                      {waterType.name}
                    </p>
                    <div className="pl-4 mt-2 space-y-2">
                      {waterType.assignments.map(assign => (
                        <div key={assign.jugId} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <img src={assign.imageUrl} alt={assign.jugName} className="h-8 w-8 object-contain" />
                                <span className="text-text-secondary dark:text-white/70">{assign.jugName}</span>
                            </div>
                            <span className="font-semibold text-dark dark:text-white">x {assign.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Columna Derecha: RESUMEN DE PEDIDO TIPO TICKET */}
        <div className="lg:col-span-2">
          <div className="sticky top-10 rounded-2xl border-light/60 dark:border-white/10 bg-white/95 dark:bg-dark/60 shadow-md backdrop-blur-xl p-6 flex flex-col gap-6">
            <h3 className="text-lg sm:text-xl font-bold text-dark dark:text-white">Resumen del pedido</h3>
            
            {/* Ticket */}
            <div className="space-y-3 border-b border-light/60 dark:border-white/10 pb-4">
              {isCalculating || configLoading ? (
                  <span className="text-sm text-text-secondary dark:text-white/70">Calculando precios...</span>
              ) : ticketItems.length > 0 ? (
                  ticketItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-text-secondary dark:text-white/80">{item.quantity} x {item.name}</span>
                        <span className="font-medium text-dark dark:text-white">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))
              ) : (
                <span className="text-sm text-red-500">No se pudieron calcular los precios.</span>
              )}
            </div>

            {/* Total */}
            <div className="flex items-center justify-between font-bold">
              <p className="text-base sm:text-lg text-dark dark:text-white">Importe total</p>
              <p className="text-2xl sm:text-3xl text-primary">
                {isCalculating || configLoading ? '...' : `$${orderTotal.toFixed(2)}`}
              </p>
            </div>

            {/* Método de entrega */}
            <div className="mt-2 rounded-xl bg-light/60 dark:bg-dark/70 border border-light/60 dark:border-white/15 p-4 flex flex-col gap-2">
              <p className="text-xs sm:text-sm font-semibold text-text-secondary dark:text-white/70 uppercase tracking-[0.08em]">Método de entrega</p>
              <p className="text-base sm:text-lg font-bold text-dark dark:text-white">{deliveryLabels[deliveryMethod] || "Entrega a domicilio"}</p>
            </div>
            
            {/* Botones */}
            <div className="flex flex-col gap-3 mt-2">
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isCalculating || configLoading || configError || isSubmitting || (isRefill && orderTotal === 0 && tiposAguaAsignados.length > 0)}
                className="w-full rounded-xl bg-primary py-3.5 px-4 text-lg font-semibold text-white hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-dark disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Confirmando..." : "Confirmar pedido"}
              </button>
              <button type="button" onClick={handleBack} className="w-full rounded-xl py-3.5 px-4 text-lg font-semibold text-primary hover:bg-primary/10 transition-colors">
                Volver al paso anterior
              </button>
            </div>
            
          </div>
        </div>
      </div>
    </OrderLayout>
  );
};

export default OrderSummaryStepFour;
