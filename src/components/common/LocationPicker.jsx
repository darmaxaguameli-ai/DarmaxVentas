import { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { toast } from 'sonner';
import { geocodeAddress } from '../../api/apiClient';
import { useTheme } from '../../context/ThemeContext'; // Importar contexto de tema

// --- Icon Definitions ---
const createIcon = (color) => {
    return L.divIcon({
        html: `<div class="relative flex items-center justify-center">
                  <div style="background-color: ${color};" class="relative z-10 p-2 rounded-full shadow-xl border-[3px] border-white dark:border-gray-800 transition-transform hover:scale-110">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path fill-rule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
                      </svg>
                  </div>
                  <div style="background-color: ${color};" class="absolute z-0 w-full h-full rounded-full animate-ping opacity-20"></div>
               </div>`,
        className: 'bg-transparent',
        iconSize: [48, 48],
        iconAnchor: [24, 48],
        popupAnchor: [0, -48],
    });
};

const locationIcon = createIcon('#3b82f6'); // Modern Blue (Primary)

// --- Map Controller to handle View Updates ---
const MapController = ({ center, zoom }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, zoom, { duration: 1.5 });
        }
    }, [center, zoom, map]);
    return null;
};

// --- Component to handle click events on map ---
const LocationMarker = ({ position, onLocationChange }) => {
    const map = useMapEvents({
        click(e) {
            onLocationChange(e.latlng.lat, e.latlng.lng);
        },
    });

    const markerRef = useRef(null);
    const eventHandlers = useMemo(
        () => ({
            dragend() {
                const marker = markerRef.current;
                if (marker != null) {
                    const { lat, lng } = marker.getLatLng();
                    onLocationChange(lat, lng);
                }
            },
        }),
        [onLocationChange],
    );

    return position === null ? null : (
        <Marker
            draggable={true}
            eventHandlers={eventHandlers}
            position={position}
            ref={markerRef}
            icon={locationIcon}
        >
            <Popup className="font-sans font-semibold">📍 ¡Aquí entregarán mi pedido!</Popup>
        </Marker>
    );
};

const LocationPicker = ({ lat, lng, onLocationChange, addressToSearch }) => {
    const { theme } = useTheme(); // Hook para detectar tema
    const defaultCenter = [19.4326, -99.1332]; // CDMX default
    
    // Initialize map center: Use provided lat/lng if available, otherwise default
    const initialCenter = (lat && lng && Number.isFinite(lat) && Number.isFinite(lng)) 
        ? [lat, lng] 
        : defaultCenter;
        
    const initialZoom = (lat && lng) ? 16 : 13;

    const [mapCenter, setMapCenter] = useState(initialCenter);
    const [zoom, setZoom] = useState(initialZoom);
    const [isSearching, setIsSearching] = useState(false);
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);

    // Use CartoDB Voyager for base map (clean and modern)
    const tileLayerUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

    // Watch for external updates to lat/lng to recenter map if needed (e.g. from DB load)
    useEffect(() => {
        if (lat && lng && Number.isFinite(lat) && Number.isFinite(lng)) {
            // Only update view if the coordinates are significantly different from current center
            // This prevents jumping if the user is just dragging the marker slightly
            const currentLat = mapCenter[0];
            const currentLng = mapCenter[1];
            const dist = Math.abs(currentLat - lat) + Math.abs(currentLng - lng);
            
            if (dist > 0.0001) { 
                setMapCenter([lat, lng]);
                setZoom(16);
            }
        }
    }, [lat, lng]);

    // Handle address search trigger
    useEffect(() => {
        if (addressToSearch && (!lat || !lng)) {
            handleSearch(addressToSearch);
        }
    }, [addressToSearch]);

    const handleSearch = async (query) => {
        if (!query) return;
        setIsSearching(true);
        try {
            const data = await geocodeAddress(query);
            if (data && data.lat && data.lng) {
                const newLat = parseFloat(data.lat);
                const newLng = parseFloat(data.lng);
                setMapCenter([newLat, newLng]);
                setZoom(16);
                // Update parent immediately so the marker moves and saves without extra click
                onLocationChange(newLat, newLng); 
            }
        } catch (error) {
            console.error("Geocoding error:", error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            toast.error("Tu navegador no soporta geolocalización.");
            return;
        }
        setIsLoadingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setMapCenter([latitude, longitude]);
                setZoom(17);
                onLocationChange(latitude, longitude);
                setIsLoadingLocation(false);
            },
            (error) => {
                console.error("Error getting location:", error);
                toast.error("No pudimos obtener tu ubicación. Verifica tus permisos.");
                setIsLoadingLocation(false);
            }
        );
    };

    return (
        <div className="w-full h-full relative z-0 group">
            <MapContainer 
                center={mapCenter} 
                zoom={zoom} 
                scrollWheelZoom={false} 
                style={{ height: '100%', width: '100%', background: theme === 'dark' ? '#242f3e' : '#f8f9fa' }}
                className="z-0"
            >
                <TileLayer
                    attribution={attribution}
                    url={tileLayerUrl}
                    className={theme === 'dark' ? '!filter !invert-[0.9] !hue-rotate-180 !brightness-95 !saturate-[0.6] !contrast-[1.1]' : ''}
                />
                <MapController center={mapCenter} zoom={zoom} />
                <LocationMarker 
                    position={lat && lng ? [lat, lng] : null} 
                    onLocationChange={onLocationChange} 
                />
            </MapContainer>
            
            {/* Controls Container */}
            <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2 items-end">
                 {/* GPS Button */}
                 <button 
                    type="button"
                    onClick={handleGetCurrentLocation}
                    className="bg-white dark:bg-gray-800 text-gray-700 dark:text-white p-2.5 rounded-xl shadow-lg border border-gray-100 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all active:scale-95"
                    title="Usar mi ubicación actual"
                 >
                    {isLoadingLocation ? (
                        <span className="animate-spin material-symbols-outlined text-xl text-primary">progress_activity</span>
                    ) : (
                        <span className="material-symbols-outlined text-xl text-primary">my_location</span>
                    )}
                 </button>

                 {/* Address Search Button */}
                 <button 
                    type="button"
                    onClick={() => handleSearch(addressToSearch)}
                    disabled={isSearching || !addressToSearch}
                    className="bg-white dark:bg-gray-800 text-gray-700 dark:text-white p-2 px-3 rounded-xl shadow-lg text-xs font-bold flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all border border-gray-100 dark:border-gray-600 active:scale-95"
                 >
                    {isSearching ? (
                        <span className="animate-spin material-symbols-outlined text-sm">progress_activity</span>
                    ) : (
                        <span className="material-symbols-outlined text-sm text-primary">search</span>
                    )}
                    <span className="hidden sm:inline">Ubicar dirección</span>
                 </button>
            </div>

            {/* Instruction Overlay */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-white/80 dark:bg-black/60 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-sm pointer-events-none border border-white/20">
                <p className="text-[10px] sm:text-xs font-bold text-gray-600 dark:text-gray-200 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-primary animate-bounce">touch_app</span>
                    Toca para mover el marcador
                </p>
            </div>
        </div>
    );
};

export default LocationPicker;