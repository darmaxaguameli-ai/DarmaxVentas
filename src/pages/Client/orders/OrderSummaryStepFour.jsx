// src/pages/cliente/orders/OrderSummaryStepFour.jsx
import { useState, useMemo, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import OrderLayout from "../../../layouts/OrderLayout";
import { createOrder, fetchPromotions, fetchProducts, fetchMyOrders } from "../../../api/apiClient";
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
  const [pointsToRedeem, setPointsToRedeem] = useState(0); // Valor en pesos a descontar
  const [pointsCost, setPointsCost] = useState(0); // Costo en puntos

  // Estados para Cupones y Catálogo
  const [couponInput, setCouponInput] = useState("");
  const [appliedPromotion, setAppliedPromotion] = useState(null); // Manual (cupón)
  const [autoPromotion, setAutoPromotion] = useState(null); // Automática (sin código)
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [userOrders, setUserOrders] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [products, promos, orders] = await Promise.all([
          fetchProducts(),
          fetchPromotions(user?.clientCategory || "PARTICULAR"),
          isAuthenticated ? fetchMyOrders() : Promise.resolve([])
        ]);
        setCatalogProducts(products);
        setUserOrders(orders || []);

        // Buscar promoción automática (isActive, sin couponCode, y dentro de fecha si aplica)
        const now = new Date();
        const auto = promos.find(p => 
          p.isActive && 
          (!p.couponCode || p.couponCode.trim() === "") && 
          (!p.startDate || new Date(p.startDate) <= now) &&
          (!p.endDate || new Date(p.endDate) >= now)
        );
        
        // Si hay una automática, verificar que el usuario no la haya usado ya
        if (auto && !orders?.some(o => o.promotionId === auto.id)) {
           setAutoPromotion(auto);
        }

      } catch (err) {
        console.error("Error al cargar datos del resumen:", err);
      }
    };
    loadData();
  }, [user?.clientCategory, isAuthenticated]);

  const deliveryMethod = previousState.deliveryMethod || "delivery";
  const fromStepTwo = previousState.fromStepTwo || []; 
  const selectedProducts = previousState.selectedProducts || previousState.fromStepOneBuy || []; 

  // --- Helper: Encontrar precio de servicio (Llenado) ---
  const findBestPrice = (prices, method, waterTypeId, jugName, jugId, dbId) => {
    const backendMethod = {
        'pickup': 'Mostrador',
        'delivery': 'Domicilio',
        'home_collection': 'Domicilio'
    }[method] || method;

    const sizeMatch = jugName ? jugName.match(/(\d+(?:\.\d+)?)\s*(?:l|litros?|lt)/i) : null;
    const sizeSuffix = sizeMatch ? `${sizeMatch[1]}L` : '20L';
    
    const possibleMatches = prices.filter(p => 
        (p.name.toLowerCase().includes('recarga') || p.name.toLowerCase().includes('llenado')) &&
        p.name.toUpperCase().includes(sizeSuffix) &&
        p.method === backendMethod &&
        p.waterType?.id === waterTypeId
    );
    
    if (!possibleMatches.length) {
        possibleMatches.push(...prices.filter(p => 
            (p.name.toLowerCase().includes('recarga') || p.name.toLowerCase().includes('llenado')) &&
            p.method === backendMethod &&
            p.waterType?.id === waterTypeId
        ));
    }

    if (!possibleMatches.length) return null;

    const brandSpecificMatch = possibleMatches.find(p =>
        p.jugBrands.length > 0 && p.jugBrands.some(brand => String(brand.id) === String(dbId) || String(brand.id) === String(jugId))
    );

    return brandSpecificMatch || possibleMatches.find(p => p.jugBrands.length === 0) || possibleMatches[0] || null;
  };

  // --- CÁLCULO UNIFICADO DE PRECIOS ---
  const { orderItems, subtotal, collectionFee, redeemableItem } = useMemo(() => {
    if (configLoading || !allServicePrices) {
        return { orderItems: [], subtotal: 0, collectionFee: 0, redeemableItem: null };
    }

    let calculatedTotal = 0;
    const finalOrderItems = [];
    const currentCollectionFee = (deliveryMethod === 'home_collection') ? 10 : 0;

    fromStepTwo.forEach(waterType => {
        waterType.assignments.forEach(assign => {
            const priceRecord = findBestPrice(allServicePrices, deliveryMethod, waterType.id, assign.jugName, assign.jugId, assign.dbId);
            
            let itemPrice = priceRecord ? priceRecord.price : 0;
            let description = `Llenado ${waterType.name.replace('Agua ', '')}`;
            let productId = null;

            const isNew = assign.isNewPurchase || (typeof assign.id === 'string' && assign.id.startsWith('new-'));
            
            if (isNew) {
                const originalProduct = selectedProducts.find(p => String(p.id) === String(assign.dbId) || String(p.id) === String(assign.jugId));
                if (originalProduct) {
                    itemPrice += originalProduct.price;
                    description = `Envase Nuevo + Llenado ${waterType.name.replace('Agua ', '')}`;
                    productId = originalProduct.id;
                }
            }

            if (itemPrice > 0 || isNew) {
                calculatedTotal += itemPrice * assign.quantity;
                finalOrderItems.push({
                    productId: productId,
                    quantity: assign.quantity,
                    price: itemPrice,
                    servicePriceId: priceRecord?.id,
                    jugBrandId: assign.dbId || assign.jugId,
                    jugBrandName: assign.jugName,
                    jugBrandImageUrl: assign.imageUrl,
                    name: assign.jugName,
                    description: description
                });
            }
        });
    });

    const processedProductIds = fromStepTwo.flatMap(wt => wt.assignments.map(a => String(a.dbId || a.id)));
    const dryProducts = selectedProducts.filter(p => !processedProductIds.includes(String(p.id)));

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

    // 3. PROCESAR REGALOS (De promoción automática o manual)
    const activePromosForItems = [autoPromotion, appliedPromotion].filter(Boolean);
    activePromosForItems.forEach(promo => {
      if (promo.type === "GIVEAWAY" && promo.giveawayProductId) {
        const giftProduct = catalogProducts.find(p => p.id === promo.giveawayProductId);
        if (giftProduct) {
          finalOrderItems.push({
            productId: giftProduct.id,
            quantity: 1,
            price: 0,
            name: giftProduct.name,
            imageUrl: giftProduct.imageUrl,
            description: `🎁 REGALO: ${promo.name}`,
            isGift: true
          });
        }
      }
    });

    // 4. RECOMPENSAS (Ratio 10:1)
    let bestReward = null;
    const POINTS_RATIO = 10; 

    if (isAuthenticated && user && user.loyaltyPoints > 0) {
        // Filtrar regalos (isGift: true) para que no se puedan pagar con puntos (ya son gratis)
        const eligibleItems = finalOrderItems.filter(item => !item.isGift);
        const sortedItems = [...eligibleItems].sort((a, b) => Number(b.price) - Number(a.price));
        bestReward = sortedItems.find(item => (Number(item.price) * POINTS_RATIO) <= Number(user.loyaltyPoints)) || null;
    }

    return { 
        orderItems: finalOrderItems, 
        subtotal: calculatedTotal, 
        collectionFee: currentCollectionFee, 
        redeemableItem: bestReward 
    };
  }, [allServicePrices, configLoading, deliveryMethod, fromStepTwo, selectedProducts, isAuthenticated, user, appliedPromotion, autoPromotion, catalogProducts]);

  // --- Lógica de Cupones ---
  const handleApplyCoupon = async () => {
    if (!couponInput) return;
    setIsValidatingCoupon(true);
    try {
      const promos = await fetchPromotions(user?.clientCategory || "PARTICULAR");
      
      const coupon = promos.find(p => 
        p.isActive && (
          (p.couponCode && p.couponCode.toUpperCase() === couponInput.toUpperCase()) ||
          (p.name && p.name.toUpperCase() === couponInput.toUpperCase())
        )
      );

      if (!coupon) {
        toast.error("Cupón o promoción no válida.");
        setAppliedPromotion(null);
      } else if (userOrders.some(o => o.promotionId === coupon.id)) {
        toast.error("Ya has utilizado esta promoción anteriormente.");
        setAppliedPromotion(null);
      } else if (subtotal < (coupon.minOrderAmount || 0)) {
        toast.error(`Mínimo de compra requerido: $${coupon.minOrderAmount}.`);
        setAppliedPromotion(null);
      } else {
        setAppliedPromotion(coupon);
        toast.success(`¡Promoción "${coupon.name}" aplicada!`);
      }
    } catch (error) {
      toast.error("Error al validar el cupón.");
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  // --- Totales Finales ---
  const orderTotal = subtotal + collectionFee;
  
  const discountTotal = useMemo(() => {
    let total = 0;
    const activePromos = [autoPromotion, appliedPromotion].filter(Boolean);
    
    activePromos.forEach(promo => {
      if (promo.type === "DISCOUNT_PERCENT") {
        total += (subtotal * promo.value) / 100;
      } else if (promo.type === "DISCOUNT_FIXED" || promo.type === "COUPON") {
        total += promo.value;
      }
    });
    return total;
  }, [appliedPromotion, autoPromotion, subtotal]);

  const displayTotal = Math.max(0, orderTotal - discountTotal - pointsToRedeem);

  const toggleRedemption = () => {
    const POINTS_RATIO = 10;
    if (pointsToRedeem > 0) {
      setPointsToRedeem(0);
      setPointsCost(0);
    } else if (redeemableItem) {
      setPointsToRedeem(redeemableItem.price);
      setPointsCost(redeemableItem.price * POINTS_RATIO);
    }
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
      pointsUsed: pointsCost,
      promotionId: appliedPromotion?.id || autoPromotion?.id
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

  const deliveryLabels = {
    delivery: "Entrega a domicilio",
    home_collection: "Recolección a domicilio",
    pickup: "Recoger en mostrador",
  };

  return (
    <OrderLayout
      title="Resumen de tu pedido"
      subtitle="Verifica que todo esté correcto antes de finalizar."
      step={4}
      totalSteps={4}
    >
      <div className="w-full max-w-2xl mx-auto flex flex-col gap-4 sm:gap-6">
        
        {/* Banner de Unificación */}
        <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white shrink-0">
                <span className="material-symbols-outlined">shopping_bag</span>
            </div>
            <p className="text-sm font-bold text-primary leading-tight">
                Revisa tu pedido final. Si tienes un cupón, puedes aplicarlo abajo.
            </p>
        </div>

        {/* Detalle de Entrega */}
        <div className="rounded-xl bg-light/60 dark:bg-dark/70 border border-light/60 dark:border-white/15 p-4 flex flex-col gap-1">
          <p className="text-[10px] font-black text-text-secondary dark:text-white/50 uppercase tracking-widest">Entrega</p>
          <p className="text-base font-bold text-dark dark:text-white">{deliveryLabels[deliveryMethod] || "Entrega a domicilio"}</p>
        </div>

        {/* Sección de Cupones */}
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-4 bg-white dark:bg-dark/40">
          <p className="text-xs font-bold text-gray-500 uppercase mb-2">¿Tienes un código de descuento?</p>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value)}
              placeholder="Escribe tu código..."
              className="flex-1 input-style uppercase"
              disabled={!!appliedPromotion}
            />
            {appliedPromotion ? (
              <button 
                onClick={() => { setAppliedPromotion(null); setCouponInput(""); }}
                className="px-4 py-2 bg-red-100 text-red-600 rounded-lg font-bold text-sm hover:bg-red-200"
              >
                Quitar
              </button>
            ) : (
              <button 
                onClick={handleApplyCoupon}
                disabled={!couponInput || isValidatingCoupon}
                className="px-4 py-2 bg-dark dark:bg-white dark:text-dark text-white rounded-lg font-bold text-sm hover:opacity-90 disabled:opacity-50"
              >
                {isValidatingCoupon ? "..." : "Aplicar"}
              </button>
            )}
          </div>
          {appliedPromotion && (
            <p className="text-[11px] text-emerald-600 font-bold mt-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              Promoción "{appliedPromotion.name}" aplicada correctamente.
            </p>
          )}
          {autoPromotion && (
            <p className="text-[11px] text-primary font-bold mt-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
              Descuento automático: "{autoPromotion.name}" activo.
            </p>
          )}
        </div>

        {/* Sección de Recompensas (Puntos) */}
        {isAuthenticated && redeemableItem && (
            <div className="rounded-xl bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 border border-yellow-200 dark:border-yellow-700/30 p-4">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div>
                        <h3 className="font-bold text-yellow-800 dark:text-yellow-400 flex items-center gap-2">
                            <span className="material-symbols-outlined">stars</span> ¡Canje de Puntos!
                        </h3>
                        <p className="text-[11px] text-yellow-900/80 dark:text-yellow-200/60 mt-1">
                            Tienes <strong>{user.loyaltyPoints} puntos</strong>. <br/>
                            Puedes canjear <strong>{redeemableItem.price * 10} puntos</strong> por un <strong>{redeemableItem.name}</strong> gratis.
                        </p>
                    </div>
                    <button 
                      onClick={toggleRedemption} 
                      className={`px-4 py-2 rounded-lg font-bold text-sm shadow-sm transition-all ${pointsToRedeem > 0 ? 'bg-red-500 text-white' : 'bg-yellow-400 text-yellow-900 hover:bg-yellow-500'}`}
                    >
                        {pointsToRedeem > 0 ? 'Cancelar' : 'Canjear'}
                    </button>
                </div>
            </div>
        )}

        {/* Lista de Productos */}
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
                <span className="font-black text-sm sm:text-base text-dark dark:text-white">
                    {item.price === 0 ? "GRATIS" : `$${(item.price * item.quantity).toFixed(2)}`}
                </span>
              </div>
            ))}
            
            {/* Desglose de Descuentos */}
            <div className="pt-3 flex flex-col gap-2">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">Subtotal</span>
                    <span className="font-bold">${subtotal.toFixed(2)}</span>
                </div>
                
                {collectionFee > 0 && (
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-text-secondary uppercase">Costo de recolección</span>
                        <span className="font-bold text-dark dark:text-white">${collectionFee.toFixed(2)}</span>
                    </div>
                )}

                {discountTotal > 0 && (
                    <div className="flex items-center justify-between text-emerald-600 font-bold text-sm">
                        <span className="uppercase">Ahorro por Promoción</span>
                        <span>-${discountTotal.toFixed(2)}</span>
                    </div>
                )}

                {pointsToRedeem > 0 && (
                    <div className="flex items-center justify-between text-yellow-600 dark:text-yellow-400 font-bold text-sm">
                        <span className="uppercase tracking-tighter">Canje de Puntos ({pointsCost} pts)</span>
                        <span>-${pointsToRedeem.toFixed(2)}</span>
                    </div>
                )}
            </div>
          </div>
        </div>

        {/* Total Final */}
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
