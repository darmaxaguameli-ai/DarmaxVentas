import { useEffect, useMemo, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { geocodeAddress } from '../../../../api/apiClient'; // Import API helper
import { useTheme } from '../../../../context/ThemeContext'; // Importar ThemeContext

// --- Icon Definitions ---
const createIcon = (bgColor, iconColor = 'white') => {
    return L.divIcon({
        html: `<div style="background-color: ${bgColor};" class="p-1.5 rounded-full shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="${iconColor}">
                    <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 20l-4.95-5.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
                  </svg>
               </div>`,
        className: 'bg-transparent',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
    });
};
const driverIcon = createIcon('#2563eb');
const orderIcon = createIcon('#6b7280');
const selectedOrderIcon = createIcon('#c2410c');
const tempOrderIcon = createIcon('#f59e0b'); // Orange/Amber for approximate location

// --- Helper for safe coordinate parsing ---
const parseCoord = (val) => {
    const num = parseFloat(val);
    return Number.isFinite(num) ? num : null;
};

// --- Helper to get valid coordinates from order (Prioritizes delivery specific, then client default) ---
const getOrderCoords = (order) => {
    if (!order) return null;
    
    // 1. Try order specific delivery coordinates
    const dLat = parseCoord(order.deliveryLat);
    const dLng = parseCoord(order.deliveryLng);
    if (dLat !== null && dLng !== null) return [dLat, dLng];

    // 2. Try client default coordinates
    const cLat = parseCoord(order.cliente?.lat);
    const cLng = parseCoord(order.cliente?.lng);
    if (cLat !== null && cLng !== null) return [cLat, cLng];

    return null;
};

// --- Map Controller Component ---
const MapController = ({ position, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    const lat = parseCoord(position?.[0]);
    const lng = parseCoord(position?.[1]);
    const z = parseCoord(zoom);

    if (lat !== null && lng !== null && z !== null && z >= 0) {
        try {
            const currentCenter = map.getCenter();
            const currentZoom = map.getZoom();
            
            // Calculate simple distance to avoid micro-movements
            const dist = Math.abs(currentCenter.lat - lat) + Math.abs(currentCenter.lng - lng);
            const zoomDiff = Math.abs(currentZoom - z);

            // Only move if significantly different
            if (dist > 0.00001 || zoomDiff > 0.1) {
                // Using setView instead of flyTo to avoid 'Invalid LatLng' animation errors with NaNs
                map.setView([lat, lng], z);
            }
        } catch (error) {
            console.error("Leaflet map update error:", error);
        }
    }
  }, [position, zoom, map]);
  
  return null;
};

// --- Main Map Component ---
const Mapa = ({ driverPosition, orders, selectedOrder, onOrderLocationUpdate }) => {
  const { theme } = useTheme(); // Hook para detectar tema
  const [temporaryCoords, setTemporaryCoords] = useState(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const mapRef = useRef(null);

  // Define Tile Layers based on Theme (Same as Client)
  const tileLayerUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
  const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

  // Auto-geocode selected order if missing coordinates
  useEffect(() => {
      setTemporaryCoords(null);
      if (selectedOrder && !getOrderCoords(selectedOrder)) {
          const cliente = selectedOrder.cliente;
          if (cliente) {
            setIsGeocoding(true);
            
            // Helper to fetch coords via our backend proxy
            const fetchCoords = async (query) => {
                try {
                    // console.log("Geocoding attempt:", query);
                    const data = await geocodeAddress(query); // Call our API client
                    
                    if (data && data.lat !== null && data.lng !== null) {
                        const lat = parseFloat(data.lat);
                        const lon = parseFloat(data.lng);
                        if (Number.isFinite(lat) && Number.isFinite(lon)) {
                            return [lat, lon];
                        }
                    }
                } catch (err) {
                    console.error("Geocoding error for query:", query, err);
                }
                return null;
            };

            const runGeocodingStrategy = async () => {
                // Strategy 1: Full Address
                const parts1 = [
                    cliente.street,
                    cliente.neighborhood,
                    cliente.city,
                    cliente.postalCode,
                    cliente.state,
                    "Mexico" 
                ].filter(Boolean);
                
                let coords = await fetchCoords(parts1.join(', '));
                if (coords) {
                    setTemporaryCoords(coords);
                    setIsGeocoding(false);
                    return;
                }

                // Strategy 2: Street + City + State (Remove complex details like "m6 l7")
                const simpleStreet = cliente.street ? cliente.street.split(/[,#]/)[0].trim() : ''; 
                const parts2 = [
                    simpleStreet,
                    cliente.city,
                    cliente.state,
                    "Mexico"
                ].filter(Boolean);

                if (parts2.length > 0) {
                     coords = await fetchCoords(parts2.join(', '));
                     if (coords) {
                        setTemporaryCoords(coords);
                        setIsGeocoding(false);
                        return;
                     }
                }

                // Strategy 3: Postal Code + City (Fallback to neighborhood center)
                const parts3 = [
                    cliente.postalCode,
                    cliente.city,
                    "Mexico"
                ].filter(Boolean);
                
                 if (parts3.length > 0) {
                     coords = await fetchCoords(parts3.join(', '));
                     if (coords) {
                        setTemporaryCoords(coords);
                        setIsGeocoding(false);
                        return;
                     }
                }
                
                console.warn("All geocoding strategies failed for client:", cliente.name);
                setIsGeocoding(false);
            };

            runGeocodingStrategy();
          }
      }
  }, [selectedOrder?.id]); // Only re-run if selected order ID changes

  // 1. Define a rock-solid default position.
  const defaultCenter = [19.4326, -99.1332];

  // 2. Determine the center of the map.
  const mapCenter = useMemo(() => {
    // Priority 1: Selected Order (Explicit)
    const selectedCoords = getOrderCoords(selectedOrder);
    if (selectedCoords) {
        return selectedCoords;
    }

    // Priority 1.5: Temporary Geocoded Coords
    if (temporaryCoords) {
        return temporaryCoords;
    }
    
    // Priority 2: Driver Position
    if (driverPosition && Array.isArray(driverPosition)) {
        const lat = parseCoord(driverPosition[0]);
        const lng = parseCoord(driverPosition[1]);
        if (lat !== null && lng !== null) {
            return [lat, lng];
        }
    }
    
    // Priority 3: Default
    return defaultCenter;
  }, [selectedOrder, driverPosition, temporaryCoords]);

  // 3. Determine zoom level.
  const mapZoom = useMemo(() => {
      if (getOrderCoords(selectedOrder) || temporaryCoords) {
          return 16;
      }
      return 13;
  }, [selectedOrder, temporaryCoords]);

  // 4. Filter orders to ensure they have valid coordinates before rendering markers.
  const ordersWithCoords = useMemo(() => 
    orders.filter(order => getOrderCoords(order) !== null),
    [orders]
  );

    // 5. Calculate a logical route path (Nearest Neighbor) for visualization
    const routePath = useMemo(() => {
      if (!driverPosition || !Array.isArray(driverPosition)) return [];
      const dLat = parseCoord(driverPosition[0]);
      const dLng = parseCoord(driverPosition[1]);
      if (dLat === null || dLng === null) return [];
  
      // Start with driver position
      const startPoint = [dLat, dLng];
      const path = [startPoint];
      
      // Get all order coordinates
      let pendingPoints = ordersWithCoords
          .map(o => getOrderCoords(o))
          .filter(p => p !== null);
  
      let currentPoint = startPoint;
  
      // Greedy "Nearest Neighbor" sort
      while (pendingPoints.length > 0) {
          let nearestIndex = -1;
          let minDistance = Infinity;
  
          pendingPoints.forEach((point, index) => {
              // Simple Euclidean distance squared is enough for sorting
              const d = Math.pow(point[0] - currentPoint[0], 2) + Math.pow(point[1] - currentPoint[1], 2);
              if (d < minDistance) {
                  minDistance = d;
                  nearestIndex = index;
              }
          });
  
          if (nearestIndex !== -1) {
              currentPoint = pendingPoints[nearestIndex];
              path.push(currentPoint);
              pendingPoints.splice(nearestIndex, 1);
          } else {
              break; 
          }
      }
      return path;
    }, [driverPosition, ordersWithCoords]);
  
    const handleDragEnd = (event) => {
        if (onOrderLocationUpdate && selectedOrder) {
            const marker = event.target;
            const newPos = marker.getLatLng();
            if (newPos) {
               onOrderLocationUpdate(selectedOrder.id, newPos.lat, newPos.lng);
            }
        }
    };
  
    const handleOpenGoogleMapsRoute = () => {
          if (!driverPosition || ordersWithCoords.length === 0) return;

          

          const startLat = driverPosition[0];

          const startLng = driverPosition[1];

          

          const waypoints = routePath.slice(1, 10); // Skip start (driver), take next 9

          if (waypoints.length === 0) return;

    

          const destination = waypoints.pop(); // Last point is destination

          const intermediate = waypoints.map(p => `${p[0]},${p[1]}`).join('|');

    

          let url = `https://www.google.com/maps/dir/?api=1&origin=${startLat},${startLng}&destination=${destination[0]},${destination[1]}`;

          if (intermediate) {

              url += `&waypoints=${intermediate}`;

          }

          

          window.open(url, '_blank');

      };

    

      const handleNavigateSingle = () => {
          const coords = getOrderCoords(selectedOrder) || temporaryCoords;
          if (!coords) return;
          const [lat, lng] = coords;
          // Abrir directamente modo navegación en Google Maps
          window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
      };

      return (
        <div className="w-full h-full relative">
            <MapContainer center={mapCenter} zoom={mapZoom} scrollWheelZoom={true} style={{ height: '100%', width: '100%', zIndex: 0, background: theme === 'dark' ? '#242f3e' : '#f8f9fa' }} ref={mapRef}>
            <MapController position={mapCenter} zoom={mapZoom} />
            <TileLayer
                attribution={attribution}
                url={tileLayerUrl}
                className={theme === 'dark' ? '!filter !invert-[0.9] !hue-rotate-180 !brightness-95 !saturate-[0.6] !contrast-[1.1]' : ''}
            />
            
            {/* Logical Route Line */}
            <Polyline 
                positions={routePath} 
                pathOptions={{ 
                    color: theme === 'dark' ? '#818cf8' : '#6366f1', // Indigo
                    weight: 4, 
                    opacity: 0.6, 
                    dashArray: '10, 10',
                    lineCap: 'round'
                }} 
            />
            
            {/* Driver Marker */}
            {(() => {
                const dLat = parseCoord(driverPosition?.[0]);
                const dLng = parseCoord(driverPosition?.[1]);
                if (dLat !== null && dLng !== null) {
                    return (
                        <Marker position={[dLat, dLng]} icon={driverIcon}>
                        <Popup>Mi ubicación</Popup>
                        </Marker>
                    );
                }
                return null;
            })()}

            {/* Selected Order Marker (High Priority) */}
            {selectedOrder && (() => {
                const coords = getOrderCoords(selectedOrder);
                
                // Case A: Valid DB coords
                if (coords) {
                    return (
                        <Marker 
                            key={`selected-${selectedOrder.id}`} 
                            position={coords}
                            icon={selectedOrderIcon}
                            zIndexOffset={1000}
                            draggable={!!onOrderLocationUpdate}
                            eventHandlers={{
                                dragend: handleDragEnd
                            }}
                        >
                            <Popup>
                                <p className="font-bold">{selectedOrder.cliente.name}</p>
                                <p>{selectedOrder.cliente.street}</p>
                                <p className="text-xs text-blue-600 mt-1 cursor-pointer">Arrastra para corregir ubicación</p>
                            </Popup>
                        </Marker>
                    );
                } 
                // Case B: Temporary Geocoded coords
                else if (temporaryCoords) {
                    return (
                        <Marker 
                            key={`temp-selected-${selectedOrder.id}`} 
                            position={temporaryCoords}
                            icon={tempOrderIcon}
                            zIndexOffset={1000}
                            opacity={0.8}
                            draggable={!!onOrderLocationUpdate}
                            eventHandlers={{
                                dragend: handleDragEnd
                            }}
                        >
                            <Popup>
                                <p className="font-bold text-amber-600">Ubicación Aproximada</p>
                                <p>{selectedOrder.cliente.street}</p>
                                <p className="text-xs text-blue-600 font-bold cursor-pointer">¡Arrastra para fijar!</p>
                            </Popup>
                        </Marker>
                    );
                }
                // Case C: Fallback Manual
                else if (!isGeocoding) {
                    return (
                        <Marker 
                            key={`manual-selected-${selectedOrder.id}`} 
                            position={mapCenter}
                            icon={tempOrderIcon}
                            zIndexOffset={1000}
                            draggable={!!onOrderLocationUpdate}
                            eventHandlers={{
                                dragend: handleDragEnd
                            }}
                        >
                            <Popup>
                                <div className="text-center">
                                    <p className="font-bold text-red-600">📍 Fijar Ubicación</p>
                                    <p className="text-xs">Arrastra este marcador a la casa del cliente</p>
                                </div>
                            </Popup>
                        </Marker>
                    );
                }
                return null;
            })()}

            {/* Order Markers */}
            {ordersWithCoords.map(order => {
                if (selectedOrder && order.id === selectedOrder.id) return null;
                const coords = getOrderCoords(order);
                if (!coords) return null;
                return (
                    <Marker key={order.id} position={coords} icon={orderIcon} opacity={0.6}>
                        <Popup><p className="font-bold">{order.cliente.name}</p></Popup>
                    </Marker>
                );
            })}
            </MapContainer>

            {/* --- FLOATING ACTION BUTTONS (FAB) --- */}
            <div className="absolute bottom-4 left-0 right-0 px-4 z-[400] flex flex-col items-center gap-2 pointer-events-none">
                {/* Label - Only show if order selected */}
                {selectedOrder && (
                    <div className="animate-in fade-in slide-in-from-bottom-2">
                        <p className="bg-white/95 dark:bg-gray-800/95 px-3 py-1 rounded-full text-[10px] font-black text-primary shadow-sm border border-primary/20 backdrop-blur-sm uppercase tracking-wider">
                            Destino: {selectedOrder.cliente.name}
                        </p>
                    </div>
                )}

                <div className="flex items-center justify-center gap-2 w-full pointer-events-auto">
                    {/* 1. Selected Order Actions */}
                    {selectedOrder && (
                        <button
                            onClick={handleNavigateSingle}
                            className="flex items-center justify-center gap-2 px-5 h-12 bg-blue-600 text-white rounded-2xl shadow-xl hover:bg-blue-700 active:scale-95 transition-all font-black uppercase tracking-tight text-xs border-2 border-white dark:border-gray-800"
                            title="Navegar con Google Maps"
                        >
                            <span className="material-symbols-outlined text-xl">directions</span>
                            <span>Navegar</span>
                        </button>
                    )}

                    {/* 2. Full Route Button */}
                    {ordersWithCoords.length > 0 && driverPosition && (
                        <button
                            onClick={handleOpenGoogleMapsRoute}
                            className={`flex items-center justify-center gap-2 px-5 h-12 rounded-2xl shadow-xl active:scale-95 transition-all font-black uppercase tracking-tight text-xs border-2 border-white dark:border-gray-800 ${
                                selectedOrder 
                                ? 'bg-indigo-600 text-white' 
                                : 'bg-indigo-600 text-white w-auto min-w-[180px]'
                            }`}
                        >
                            <span className="material-symbols-outlined text-xl">alt_route</span>
                            <span>{selectedOrder ? 'Ruta Día' : 'Trazar ruta del día'}</span>
                        </button>
                    )}
                </div>
            </div>

    

            {/* Info Label */}

            {isGeocoding && (

                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] bg-white/90 dark:bg-gray-800/90 px-4 py-2 rounded-full shadow-lg border border-primary/20 animate-pulse">

                    <p className="text-xs font-bold text-primary flex items-center gap-2">

                        <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>

                        Buscando ubicación...

                    </p>

                </div>

            )}

        </div>

      );

    };

export default Mapa;