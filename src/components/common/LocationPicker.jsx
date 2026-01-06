import { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { geocodeAddress } from '../../api/apiClient';

// --- Icon Definitions ---
const createIcon = (color) => {
    return L.divIcon({
        html: `<div style="background-color: ${color};" class="p-1.5 rounded-full shadow-lg border-2 border-white">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 20l-4.95-5.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
                  </svg>
               </div>`,
        className: 'bg-transparent',
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40],
    });
};

const locationIcon = createIcon('#ef4444'); // Red for selected location

// --- Map Controller to handle View Updates ---
const MapController = ({ center, zoom }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, zoom);
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
            <Popup>¡Aquí es mi entrega!</Popup>
        </Marker>
    );
};

const LocationPicker = ({ lat, lng, onLocationChange, addressToSearch }) => {
    const defaultCenter = [19.4326, -99.1332]; // CDMX default
    
    // Initialize map center: Use provided lat/lng if available, otherwise default
    const initialCenter = (lat && lng && Number.isFinite(lat) && Number.isFinite(lng)) 
        ? [lat, lng] 
        : defaultCenter;
        
    const initialZoom = (lat && lng) ? 16 : 13;

    const [mapCenter, setMapCenter] = useState(initialCenter);
    const [zoom, setZoom] = useState(initialZoom);
    const [isSearching, setIsSearching] = useState(false);

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

    return (
        <div className="w-full h-[300px] sm:h-[400px] rounded-xl overflow-hidden shadow-md border border-gray-200 dark:border-gray-700 relative z-0">
            <MapContainer 
                center={mapCenter} 
                zoom={zoom} 
                scrollWheelZoom={false} 
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapController center={mapCenter} zoom={zoom} />
                <LocationMarker 
                    position={lat && lng ? [lat, lng] : null} 
                    onLocationChange={onLocationChange} 
                />
            </MapContainer>
            
            {/* Search Overlay Button (Optional manual trigger) */}
            <div className="absolute top-2 right-2 z-[1000]">
                 <button 
                    type="button"
                    onClick={() => handleSearch(addressToSearch)}
                    disabled={isSearching || !addressToSearch}
                    className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 p-2 rounded-lg shadow-md text-xs font-bold flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-600"
                 >
                    {isSearching ? (
                        <span className="animate-spin material-symbols-outlined text-sm">progress_activity</span>
                    ) : (
                        <span className="material-symbols-outlined text-sm text-primary">location_searching</span>
                    )}
                    Ubicar dirección del formulario
                 </button>
            </div>

            {/* Instruction Overlay */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-white/90 dark:bg-black/80 px-4 py-2 rounded-full shadow-lg pointer-events-none">
                <p className="text-xs font-bold text-gray-800 dark:text-white flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm text-red-500">touch_app</span>
                    Toca o arrastra para fijar tu ubicación
                </p>
            </div>
        </div>
    );
};

export default LocationPicker;