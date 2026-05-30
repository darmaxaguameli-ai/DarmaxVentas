// src/pages/cliente/orders/OrderSummaryStepFour.jsx
import { useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import OrderLayout from "../../../layouts/OrderLayout";
import { createOrder } from "../../../api/apiClient";
import { useAuth } from "../../../context/AuthContext";
import { useConfig } from "../../../context/ConfigContext";
import { useClient } from "../context/ClientContext"; 

const OrderSummaryStepFour = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const previousState = location.state || {};
  const { user, isAuthenticated } = useAuth();
  const { selectedStore } = useClient(); 
  const { servicePrices: allServicePrices, loading: configLoading } = useConfig();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);

  const deliveryMethod = previousState.deliveryMethod || "delivery";
  const fromStepTwo = previousState.fromStepTwo || []; // Esto trae las "olas" (Agua Premium, Alcalina...)
  const selectedProducts = previousState.selectedProducts || []; // Productos de la tienda

  // --- Helper: Encontrar precio de servicio (Llenado) ---
  const findBestPrice = (prices, method, waterTypeId, jugName, jugId) => {
    const backendMethod = {
        'pickup': 'Mostrador',
        'delivery': 'Domicilio',
        'home_collection': 'Domicilio'
    }[method] || method;

    const sizeMatch = jugName ? jugName.match(/(\d+(?:\.\d+)?)\s*(?:l|litros?|lt)/i) : null;
    const sizeSuffix = sizeMatch ? `${sizeMatch[1]}L` : '20L';
    let serviceNameToSearch = `Recarga ${sizeSuffix}`; 

    const possibleMatches = prices.filter(p => 
        p.name === serviceNameToSearch &&
        p.method === backendMethod &&
        p.waterType?.id === waterTypeId
    );
    
    if (!possibleMatches.length) return null;

    const brandSpecificMatch = possibleMatches.find(p =>
        p.jugBrands.length > 0 && p.jugBrands.some(brand => brand.id === jugId)
    );

    return brandSpecificMatch || possibleMatches.find(p => p.jugBrands.length === 0) || null;
  };

  // --- CÁLCULO UNIFICADO DE PRECIOS ---
  const { orderItems, subtotal, collectionFee, redeemableItem } = useMemo(() => {
    if (configLoading || !allServicePrices || allServicePrices.length === 0) {
        return { orderItems: [], subtotal: 0, collectionFee: 0, redeemableItem: null };
    }

    let calculatedTotal = 0;
    const finalOrderItems = [];
    const currentCollectionFee = (deliveryMethod === 'home_collection') ? 10 : 0;

    // 1. PROCESAR GARRAFONES QUE PASARON POR LAS OLAS (Recargas y Compras Llenas)
    fromStepTwo.forEach(waterType => {
        waterType.assignments.forEach(assign => {
            const priceRecord = findBestPrice(allServicePrices, deliveryMethod, waterType.id, assign.jugName, assign.jugId);
            
            if (priceRecord) {
                let itemPrice = priceRecord.price;
                let description = `Llenado ${waterType.name.replace('Agua ', '')}`;
                let productId = null;

                // Si tiene el flag isNewPurchase (o id empieza con 'new-'), sumar el precio del envase
                const isNew = assign.isNewPurchase || (typeof assign.id === 'string' && assign.id.startsWith('new-'));
                
                if (isNew) {
                    const originalProduct = selectedProducts.find(p => p.id === assign.dbId || p.id === assign.jugId);
                    if (originalProduct) {
                        itemPrice += originalProduct.price;
                        description = `Envase Nuevo + Llenado ${waterType.name.replace('Agua ', '')}`;
                        productId = originalProduct.id;
                    }
                }

                calculatedTotal += itemPrice * assign.quantity;
                finalOrderItems.push({
                    productId: productId,
                    quantity: assign.quantity,
                    price: itemPrice,
                    servicePriceId: priceRecord.id,
                    jugBrandId: assign.isNewPurchase ? null : assign.jugId, // Si es nuevo, el jugBrandId no es crítico para recarga
                    jugBrandName: assign.jugName,
                    jugBrandImageUrl: assign.imageUrl,
                    name: assign.jugName,
                    description: description
                });
            }
        });
    });

    // 2. PROCESAR PRODUCTOS QUE NO SON GARRAFONES LLENOS (Termos, botellas, garrafones vacíos)
    // Filtramos los que ya procesamos arriba
    const processedProductIds = fromStepTwo.flatMap(wt => wt.assignments.map(a => a.dbId || a.id));
    const dryProducts = selectedProducts.filter(p => !processedProductIds.includes(p.id));

    dryProducts.forEach(product => {
        calculatedTotal += product.price * product.quantity;
        finalOrderItems.push({
            productId: product.id,
            quantity: product.quantity,
            price: product.price,
            name: product.name,
            imageUrl: product.imageUrl,
            description: product.category === 'Garrafones' ? 'Solo envase (vacío)' : 'Compra de artículo'
        });
    });

    // 3. RECOMPENSAS
    let bestReward = null;
    if (isAuthenticated && user && user.loyaltyPoints > 0) {
        const sortedItems = [...finalOrderItems].sort((a, b) => Number(b.price) - Number(a.price));
        bestReward = sortedItems.find(item => Number(item.price) <= Number(user.loyaltyPoints)) || null;
    }

    return { 
        orderItems: finalOrderItems, 
        subtotal: calculatedTotal, 
        collectionFee: currentCollectionFee, 
        redeemableItem: bestReward 
    };
  }, [allServicePrices, configLoading, deliveryMethod, fromStepTwo, selectedProducts, isAuthenticated, user?.loyaltyPoints]);

  const orderTotal = subtotal + collectionFee;
  const displayTotal = Math.max(0, orderTotal - pointsToRedeem);

  const toggleRedemption = () => {
    if (pointsToRedeem > 0) setPointsToRedeem(0);
    else if (redeemableItem) setPointsToRedeem(redeemableItem.price);
  };

  const deliveryLabels = {
    delivery: "Entrega a domicilio",
    home_collection: "Recolección a domicilio",
    pickup: "Recoger en mostrador",
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    const finalStoreId = previousState.storeId || selectedStore?.id || user?.storeId;
    if (!finalStoreId) {
        toast.error("No se pudo determinar la sucursal.");
        setIsSubmitting(false);
        return;
    }

    const orderPayload = {
      total: displayTotal,
      deliveryMethod,
      paymentStatus: displayTotal === 0 ? "PAGADO" : "NO_PAGADO",
      status: "PENDIENTE",
      items: orderItems,
      storeId: finalStoreId,
      pointsUsed: pointsToRedeem
    };
    
    const clientId = (isAuthenticated && user) ? user.id : previousState.clientData?.id;
    if (clientId) orderPayload.clienteId = clientId;

    try {
      const newOrder = await createOrder(orderPayload);
      navigate("/pedidos/confirmado", { state: { orderId: newOrder.customId, orderType: previousState.mode } });
    } catch (error) {
      toast.error(`Error: ${error.message || "Intenta de nuevo."}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <OrderLayout
      title="Revisa tu pedido final"
      subtitle="Todo listo para unificar tu entrega."
      step={4}
      totalSteps={4}
    >
      <div className="w-full max-w-2xl mx-auto flex flex-col gap-4 sm:gap-6">
        <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white shrink-0 shadow-lg shadow-primary/20">
                <span className="material-symbols-outlined">auto_awesome</span>
            </div>
            <p className="text-sm font-bold text-primary leading-tight">
                ¡Genial! Hemos unificado tus productos y recargas en una sola entrega para tu comodidad.
            </p>
        </div>

        <div className="rounded-xl bg-light/60 dark:bg-dark/70 border border-light/60 dark:border-white/15 p-4 flex flex-col gap-1">
          <p className="text-[10px] font-black text-text-secondary dark:text-white/50 uppercase tracking-widest">Método de entrega</p>
          <p className="text-base font-bold text-dark dark:text-white">{deliveryLabels[deliveryMethod] || "Entrega a domicilio"}</p>
        </div>

        {isAuthenticated && redeemableItem && (
            <div className="rounded-xl bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-700/50 p-4">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div>
                        <h3 className="font-bold text-yellow-800 dark:text-yellow-400 flex items-center gap-2">
                            <span className="material-symbols-outlined">stars</span> ¡Recompensa!
                        </h3>
                        <p className="text-xs text-yellow-900/80 dark:text-yellow-200/80 mt-1">
                            Tienes <strong>{user.loyaltyPoints} puntos</strong>. Puedes llevarte uno de tus productos GRATIS.
                        </p>
                    </div>
                    <button onClick={toggleRedemption} className={`px-4 py-2 rounded-lg font-bold text-sm shadow-sm transition-all ${pointsToRedeem > 0 ? 'bg-red-500 text-white' : 'bg-yellow-400 text-yellow-900 hover:bg-yellow-500'}`}>
                        {pointsToRedeem > 0 ? 'Cancelar' : 'Canjear'}
                    </button>
                </div>
            </div>
        )}

        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-black text-dark dark:text-white uppercase tracking-tight">Tu Detalle</h2>
          <div className="flex flex-col divide-y divide-light/60 dark:divide-white/10">
            {orderItems.map((item, index) => (
              <div key={`${index}`} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden border dark:border-white/5">
                    <img src={item.imageUrl || item.jugBrandImageUrl} alt="img" className="h-full w-full object-contain" />
                  </div>
                  <div>
                    <p className="font-bold text-sm sm:text-base leading-none">{item.name || item.jugBrandName}</p>
                    <p className="text-[11px] text-text-secondary dark:text-white/60 mt-1.5">{item.quantity} x {item.description}</p>
                  </div>
                </div>
                <span className="font-black text-sm sm:text-base text-dark dark:text-white">${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            
            {collectionFee > 0 && (
                <div className="flex items-center justify-between py-3">
                    <span className="text-sm font-bold text-text-secondary uppercase">Costo de recolección</span>
                    <span className="font-black text-sm text-dark dark:text-white">${collectionFee.toFixed(2)}</span>
                </div>
            )}

            {pointsToRedeem > 0 && (
                <div className="flex items-center justify-between py-3 text-emerald-600 font-black">
                    <span className="text-sm uppercase tracking-tighter">Descuento Fidelidad</span>
                    <span>-${pointsToRedeem.toFixed(2)}</span>
                </div>
            )}
          </div>
        </div>

        <div className="border-t-2 border-dashed border-light dark:border-white/10 pt-6">
            <div className="flex items-center justify-between font-black">
                <p className="text-xl uppercase tracking-tighter">Total Final</p>
                <p className="text-4xl text-primary tracking-tighter">${displayTotal.toFixed(2)}</p>
            </div>
        </div>

        <footer className="mt-8 flex flex-col sm:flex-row gap-4 justify-between pb-10">
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary w-full sm:w-auto h-14">Regresar</button>
            <button
                type="button"
                onClick={handleConfirm}
                disabled={isSubmitting || orderItems.length === 0}
                className="btn-primary w-full sm:w-auto h-14 px-12 text-lg font-black shadow-xl shadow-primary/20"
            >
                {isSubmitting ? "Finalizando..." : "Confirmar mi Pedido"}
            </button>
        </footer>
      </div>
    </OrderLayout>
  );
};

export default OrderSummaryStepFour;
