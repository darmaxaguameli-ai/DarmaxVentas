import { useEffect, useMemo, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { geocodeAddress } from '../../../../api/apiClient'; // Import API helper

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
  const [temporaryCoords, setTemporaryCoords] = useState(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const mapRef = useRef(null);

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

  return (
    <MapContainer center={mapCenter} zoom={mapZoom} scrollWheelZoom={true} style={{ height: '100%', width: '100%', zIndex: 0 }} ref={mapRef}>
      <MapController position={mapCenter} zoom={mapZoom} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Logical Route Line */}
      <Polyline 
        positions={routePath} 
        pathOptions={{ 
            color: '#6366f1', // Indigo-500
            weight: 4, 
            opacity: 0.6, 
            dashArray: '10, 10', // Dashed line to indicate "suggested path"
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
                    draggable={!!onOrderLocationUpdate} // Allow correction even if already set
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
                    draggable={!!onOrderLocationUpdate} // Allow correction for temp coords
                    eventHandlers={{
                        dragend: handleDragEnd
                    }}
                >
                    <Popup>
                        <p className="font-bold text-amber-600">Ubicación Aproximada</p>
                        <p className="font-bold">{selectedOrder.cliente.name}</p>
                        <p>{selectedOrder.cliente.street}</p>
                        <p className="text-xs italic mt-1 mb-1">(Basado en la dirección)</p>
                        <p className="text-xs text-blue-600 font-bold cursor-pointer">¡Arrastra para fijar la ubicación exacta!</p>
                    </Popup>
                </Marker>
              );
          }
          // Case C: Geocoding failed -> Manual Set Mode (Fallback)
          else if (!isGeocoding) {
              return (
                <Marker 
                    key={`manual-selected-${selectedOrder.id}`} 
                    position={mapCenter} // Default to current view center (Driver or Default)
                    icon={tempOrderIcon}
                    zIndexOffset={1000}
                    draggable={!!onOrderLocationUpdate}
                    eventHandlers={{
                        dragend: handleDragEnd
                    }}
                >
                    <Popup>
                        <div className="text-center">
                            <p className="font-bold text-red-600 mb-1">❓ Ubicación No Encontrada</p>
                            <p className="font-semibold">{selectedOrder.cliente.name}</p>
                            <p className="text-xs text-gray-600 italic mb-2">No pudimos localizar "{selectedOrder.cliente.street}" automáticamente.</p>
                            <div className="bg-blue-50 text-blue-700 p-2 rounded text-xs font-bold border border-blue-100">
                                <span className="block text-lg mb-1">👇</span>
                                ¡Arrastra este marcador a la casa del cliente para guardar su ubicación!
                            </div>
                        </div>
                    </Popup>
                </Marker>
              );
          }
          return null;
      })()}

      {/* Order Markers */}
      {ordersWithCoords.map(order => {
          // Avoid duplicating the selected order if it's already rendered above
          if (selectedOrder && order.id === selectedOrder.id) return null;

          const coords = getOrderCoords(order);
          // Redundant check handled by filter, but safe for rendering
          if (!coords) return null;

          return (
            <Marker 
                key={order.id} 
                position={coords}
                icon={orderIcon}
                opacity={0.6}
            >
                <Popup>
                    <p className="font-bold">{order.cliente.name}</p>
                    <p>{order.cliente.street}</p>
                </Popup>
            </Marker>
          );
      })}
    </MapContainer>
  );
};

export default Mapa;