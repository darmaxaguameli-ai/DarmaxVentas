import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchNearestStore, fetchStores } from '../../../api/apiClient';

const ClientContext = createContext();

export const useClient = () => {
    const context = useContext(ClientContext);
    if (!context) {
        throw new Error('useClient must be used within a ClientProvider');
    }
    return context;
};

export const ClientProvider = ({ children }) => {
    const [selectedStore, setSelectedStore] = useState(null);
    const [nearestStore, setNearestStore] = useState(null);
    const [allStores, setAllStores] = useState([]);
    const [locationError, setLocationError] = useState(null);
    const [loadingLocation, setLoadingLocation] = useState(true);

    // 1. Fetch all stores (for manual selection)
    useEffect(() => {
        const loadStores = async () => {
            try {
                const stores = await fetchStores();
                setAllStores(stores);
            } catch (err) {
                console.error("Error loading stores:", err);
            }
        };
        loadStores();
    }, []);

    // 2. Detect Location & Nearest Store
    useEffect(() => {
        if (!navigator.geolocation) {
            setLocationError("La geolocalización no es soportada por este navegador.");
            setLoadingLocation(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const nearest = await fetchNearestStore(latitude, longitude);
                    if (nearest) {
                        setNearestStore(nearest);
                        // Automatically select the nearest one initially
                        if (!selectedStore) {
                            setSelectedStore(nearest);
                        }
                    }
                } catch (err) {
                    console.error("Error finding nearest store:", err);
                } finally {
                    setLoadingLocation(false);
                }
            },
            (error) => {
                console.warn("Ubicación denegada o error:", error.message);
                setLocationError("No se pudo obtener la ubicación.");
                setLoadingLocation(false);
                
                // If location fails, fallback to first available store or stay null
                if (allStores.length > 0 && !selectedStore) {
                    setSelectedStore(allStores[0]); 
                }
            }
        );
    }, [allStores.length]); // Depend on allStores so fallback works if location fails late

    const selectStore = (storeId) => {
        const store = allStores.find(s => s.id === storeId);
        if (store) {
            setSelectedStore(store);
        }
    };

    const value = {
        selectedStore,
        nearestStore,
        allStores,
        loadingLocation,
        locationError,
        selectStore
    };

    return (
        <ClientContext.Provider value={value}>
            {children}
        </ClientContext.Provider>
    );
};
