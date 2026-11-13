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
      
      const now = new Date();
      const coupon = promos.find(p => 
        p.isActive && (
          (p.couponCode && p.couponCode.toUpperCase() === couponInput.toUpperCase()) ||
          (p.name && p.name.toUpperCase() === couponInput.toUpperCase())
        ) &&
        (!p.startDate || new Date(p.startDate) <= now) &&
        (!p.endDate || new Date(p.endDate) >= now)
      );

      if (!coupon) {
        toast.error("Cupón o promoción no válida o expirada.");
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
      <div className="w-full max-w-2xl mx-auto flex flex-col gap-5 sm:gap-6">
        
        {/* Banner de Unificación / Status */}
        <div className="bg-gradient-to-r from-primary/10 via-cyan-500/10 to-teal-500/10 border border-primary/20 p-4 rounded-3xl flex items-center gap-3 backdrop-blur-xl">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-primary to-cyan-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-primary/25">
                <span className="material-symbols-outlined text-2xl">shopping_bag</span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-100 leading-tight">
                Revisa tu pedido final. Si tienes un cupón de descuento, puedes aplicarlo abajo.
            </p>
        </div>

        {/* Detalle de Entrega Glass */}
        <div className="rounded-3xl bg-white/70 dark:bg-gray-800/70 border border-white/80 dark:border-white/10 p-5 flex items-center justify-between backdrop-blur-xl shadow-xs">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-xl">
                {deliveryMethod === 'pickup' ? 'storefront' : deliveryMethod === 'home_collection' ? 'recycling' : 'local_shipping'}
              </span>
            </div>
            <div>
              <p className="text-[10px] font-black text-text-secondary dark:text-white/50 uppercase tracking-widest">Método de Entrega</p>
              <p className="text-base font-bold text-dark dark:text-white leading-tight">{deliveryLabels[deliveryMethod] || "Entrega a domicilio"}</p>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            Confirmado
          </span>
        </div>

        {/* Sección de Cupones */}
        <div className="rounded-3xl border border-white/80 dark:border-white/10 p-5 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl shadow-xs">
          <p className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary text-base">confirmation_number</span>
            ¿Tienes un código de descuento?
          </p>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value)}
              placeholder="Escribe tu código..."
              className="flex-1 px-4 py-2.5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm font-bold uppercase focus:ring-2 focus:ring-primary/50 outline-none"
              disabled={!!appliedPromotion}
            />
            {appliedPromotion ? (
              <button 
                onClick={() => { setAppliedPromotion(null); setCouponInput(""); }}
                className="px-5 py-2.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-2xl font-bold text-sm transition-all active:scale-95"
              >
                Quitar
              </button>
            ) : (
              <button 
                onClick={handleApplyCoupon}
                disabled={!couponInput || isValidatingCoupon}
                className="px-6 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-2xl font-bold text-sm shadow-md shadow-primary/25 disabled:opacity-50 transition-all active:scale-95"
              >
                {isValidatingCoupon ? "..." : "Aplicar"}
              </button>
            )}
          </div>
          {appliedPromotion && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-2.5 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              Promoción "{appliedPromotion.name}" aplicada correctamente.
            </p>
          )}
          {autoPromotion && (
            <p className="text-xs text-primary font-bold mt-2.5 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
              Descuento automático: "{autoPromotion.name}" activo.
            </p>
          )}
        </div>

        {/* Sección de Recompensas (Puntos) */}
        {isAuthenticated && redeemableItem && (
            <div className="rounded-3xl bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-orange-500/10 dark:from-amber-950/20 dark:via-yellow-950/20 dark:to-orange-950/20 border border-amber-300/40 dark:border-amber-600/30 p-5 backdrop-blur-xl shadow-xs">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-amber-500/25">
                            <span className="material-symbols-outlined text-2xl">stars</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-amber-900 dark:text-amber-300 text-base">
                                ¡Canje de Puntos de Lealtad!
                            </h3>
                            <p className="text-xs text-amber-800/80 dark:text-amber-200/70 mt-0.5 leading-snug">
                                Tienes <strong>{user.loyaltyPoints} puntos</strong>. Puedes canjear <strong>{redeemableItem.price * 10} pts</strong> por un <strong>{redeemableItem.name}</strong> gratis.
                            </p>
                        </div>
                    </div>
                    <button 
                      onClick={toggleRedemption} 
                      className={`px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm shadow-sm transition-all active:scale-95 shrink-0 ${pointsToRedeem > 0 ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-gradient-to-r from-amber-400 to-yellow-500 text-yellow-950 hover:brightness-105 font-black'}`}
                    >
                        {pointsToRedeem > 0 ? 'Cancelar canje' : 'Canjear ahora'}
                    </button>
                </div>
            </div>
        )}

        {/* Lista de Productos Glass Card */}
        <div className="rounded-3xl bg-white/80 dark:bg-gray-800/80 border border-white/80 dark:border-white/10 p-5 sm:p-6 backdrop-blur-2xl shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700/60 pb-3">
            <h2 className="text-base font-black text-dark dark:text-white uppercase tracking-tight flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">receipt_long</span>
              Tu Detalle de Compra
            </h2>
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
              {orderItems.length} {orderItems.length === 1 ? 'artículo' : 'artículos'}
            </span>
          </div>

          <div className="flex flex-col divide-y divide-gray-100 dark:divide-gray-700/60">
            {orderItems.map((item, index) => (
              <div key={`${index}`} className="flex items-center justify-between py-3.5">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-gray-50 dark:bg-gray-700/50 flex items-center justify-center p-1 border border-white/60 dark:border-white/5">
                    <img src={item.imageUrl || item.jugBrandImageUrl} alt="img" className="h-full w-full object-contain" />
                  </div>
                  <div>
                    <p className="font-bold text-sm sm:text-base text-gray-900 dark:text-white leading-tight">{item.name || item.jugBrandName}</p>
                    <p className="text-xs text-text-secondary dark:text-white/60 mt-0.5">{item.quantity} x {item.description}</p>
                  </div>
                </div>
                <span className="font-black text-base text-gray-900 dark:text-white tabular-nums">
                    {item.price === 0 ? "GRATIS" : `$${(item.price * item.quantity).toFixed(2)}`}
                </span>
              </div>
            ))}
            
            {/* Desglose de Descuentos */}
            <div className="pt-4 flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary font-medium">Subtotal</span>
                    <span className="font-bold text-gray-900 dark:text-white">${subtotal.toFixed(2)}</span>
                </div>
                
                {collectionFee > 0 && (
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-text-secondary uppercase text-xs font-semibold">Costo de recolección</span>
                        <span className="font-bold text-dark dark:text-white">${collectionFee.toFixed(2)}</span>
                    </div>
                )}

                {discountTotal > 0 && (
                    <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                        <span className="uppercase text-xs tracking-wider">Ahorro por Promoción</span>
                        <span>-${discountTotal.toFixed(2)}</span>
                    </div>
                )}

                {pointsToRedeem > 0 && (
                    <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 font-bold text-sm">
                        <span className="uppercase text-xs tracking-wider">Canje de Puntos ({pointsCost} pts)</span>
                        <span>-${pointsToRedeem.toFixed(2)}</span>
                    </div>
                )}
            </div>
          </div>

          {/* Total Final destacado */}
          <div className="border-t-2 border-dashed border-gray-200 dark:border-gray-700 pt-5 mt-2">
            <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase font-black text-gray-500 tracking-wider">Total a Pagar</p>
                  <p className="text-sm text-text-secondary dark:text-white/60 font-medium">IVA incluido</p>
                </div>
                <p className="text-3xl sm:text-4xl font-black text-primary tracking-tight tabular-nums">
                  ${displayTotal.toFixed(2)}
                </p>
            </div>
          </div>
        </div>

        <footer className="mt-4 flex flex-col sm:flex-row gap-4 justify-between pb-10">
            <button 
              type="button" 
              onClick={() => navigate(-1)} 
              className="hidden md:flex h-11 sm:h-12 w-full sm:w-auto items-center justify-center rounded-2xl border border-white/80 dark:border-white/10 bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-200 text-sm sm:text-base font-bold px-6 hover:bg-white dark:hover:bg-gray-700 backdrop-blur-xl shadow-sm transition-all duration-200 active:scale-95 cursor-pointer"
            >
              Regresar
            </button>
            <button
                type="button"
                onClick={handleConfirm}
                disabled={isSubmitting || orderItems.length === 0}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-primary hover:bg-primary-dark px-8 h-11 sm:h-12 text-sm sm:text-base font-bold text-white shadow-md shadow-primary/25 hover:shadow-lg transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
                {isSubmitting && <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>}
                <span>{isSubmitting ? "Finalizando pedido..." : "Confirmar mi Pedido"}</span>
                {!isSubmitting && <span className="material-symbols-outlined text-lg">check_circle</span>}
            </button>
        </footer>
      </div>
    </OrderLayout>
  );
};

export default OrderSummaryStepFour;
