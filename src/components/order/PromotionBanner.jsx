import React, { useState, useEffect } from 'react';
import { fetchPromotions } from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';

const PromotionBanner = () => {
    const { user, isAuthenticated } = useAuth();
    const [promotions, setPromotions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentIndex, setCurrentAt] = useState(0);

    useEffect(() => {
        const loadPromos = async () => {
            try {
                setLoading(true);
                const category = isAuthenticated ? user?.clientCategory : null;
                const data = await fetchPromotions(category);
                
                const now = new Date();
                setPromotions(data.filter(p => 
                    p.isActive && 
                    p.isPublic &&
                    (!p.startDate || new Date(p.startDate) <= now) &&
                    (!p.endDate || new Date(p.endDate) >= now)
                ));
            } catch (err) {
                console.error("Error loading promotions for banner:", err);
            } finally {
                setLoading(false);
            }
        };

        loadPromos();
    }, [isAuthenticated, user?.clientCategory]);

    useEffect(() => {
        if (promotions.length <= 1) return;
        
        const interval = setInterval(() => {
            setCurrentAt(prev => (prev + 1) % promotions.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [promotions.length]);

    if (loading || promotions.length === 0) return null;

    const currentPromo = promotions[currentIndex];

    const getPromoIcon = (type) => {
        switch (type) {
            case 'DISCOUNT_PERCENT': return 'percent';
            case 'DISCOUNT_FIXED': return 'payments';
            case 'GIVEAWAY': return 'redeem';
            case 'COUPON': return 'confirmation_number';
            case 'POINTS_MULTIPLIER': return 'stars';
            default: return 'campaign';
        }
    };

    return (
        <div className="w-full mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/20 via-primary/5 to-transparent border border-primary/20 p-4 sm:p-5 flex items-center gap-4">
                <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/20">
                    <span className="material-symbols-outlined text-2xl sm:text-3xl animate-pulse">
                        {getPromoIcon(currentPromo.type)}
                    </span>
                </div>
                
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Oferta Especial
                        </span>
                        {currentPromo.endDate && (
                            <span className="text-[10px] text-text-secondary dark:text-white/60">
                                Vence: {new Date(currentPromo.endDate).toLocaleDateString()}
                            </span>
                        )}
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-dark dark:text-white mt-1 leading-tight">
                        {currentPromo.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-text-secondary dark:text-white/70 line-clamp-1">
                        {currentPromo.description || '¡Aprovecha esta promoción en tu próximo pedido!'}
                    </p>
                </div>

                {promotions.length > 1 && (
                    <div className="absolute bottom-2 right-4 flex gap-1">
                        {promotions.map((_, idx) => (
                            <div 
                                key={idx} 
                                className={`h-1 rounded-full transition-all ${idx === currentIndex ? 'w-4 bg-primary' : 'w-1 bg-primary/20'}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PromotionBanner;
