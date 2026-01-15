import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useTheme } from '../../../context/ThemeContext';

// --- Icons ---
const createIcon = (bgColor, iconColor = 'white', iconPath) => {
    return L.divIcon({
        html: `<div style="background-color: ${bgColor};" class="p-1.5 rounded-full shadow-lg border-2 border-white dark:border-gray-800">
                  <span class="material-symbols-outlined text-white text-base" style="font-size: 20px; line-height: 20px;">${iconPath}</span>
               </div>`,
        className: 'bg-transparent',
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36],
    });
};

const driverIcon = createIcon('#2563eb', 'white', 'local_shipping');
const destinationIcon = createIcon('#c2410c', 'white', 'home_pin');

// --- Helper for safe coordinate parsing ---
const parseCoord = (val) => {
    const num = parseFloat(val);
    return Number.isFinite(num) ? num : null;
};

// --- Map Controller ---
const MapController = ({ driverPosition, destinationPosition }) => {
  const map = useMap();
  
  useEffect(() => {
    if (!map) return;

    const points = [];
    if (driverPosition) points.push(driverPosition);
    if (destinationPosition) points.push(destinationPosition);

    if (points.length > 0) {
        const bounds = L.latLngBounds(points);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  }, [driverPosition, destinationPosition, map]);
  
  return null;
};

const TrackingMap = ({ driverPosition, order }) => {
  const { theme } = useTheme();

  // Parse destination coordinates (Order Delivery or Client Default)
  const destinationPosition = useMemo(() => {
      if (!order) return null;
      const lat = parseCoord(order.deliveryLat || order.cliente?.lat);
      const lng = parseCoord(order.deliveryLng || order.cliente?.lng);
      if (lat !== null && lng !== null) return [lat, lng];
      return null;
  }, [order]);

  // Parse driver coordinates
  const driverPos = useMemo(() => {
      if (!driverPosition || !Array.isArray(driverPosition)) return null;
      const lat = parseCoord(driverPosition[0]);
      const lng = parseCoord(driverPosition[1]);
      if (lat !== null && lng !== null) return [lat, lng];
      return null;
  }, [driverPosition]);

  const tileLayerUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

  if (!destinationPosition) return (
      <div className="h-full w-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 text-sm">
          Mapa no disponible
      </div>
  );

  return (
    <div className="w-full h-48 sm:h-64 rounded-xl overflow-hidden shadow-inner border border-gray-200 dark:border-gray-700 relative z-0">
        <MapContainer 
            center={destinationPosition} 
            zoom={15} 
            scrollWheelZoom={false} 
            dragging={false} // Static view mainly
            zoomControl={false}
            style={{ height: '100%', width: '100%', background: theme === 'dark' ? '#242f3e' : '#f8f9fa' }}
        >
            <MapController driverPosition={driverPos} destinationPosition={destinationPosition} />
            <TileLayer
                url={tileLayerUrl}
                className={theme === 'dark' ? '!filter !invert-[0.9] !hue-rotate-180 !brightness-95 !saturate-[0.6] !contrast-[1.1]' : ''}
            />

            {/* Route Line */}
            {driverPos && (
                <Polyline 
                    positions={[driverPos, destinationPosition]} 
                    pathOptions={{ 
                        color: theme === 'dark' ? '#818cf8' : '#6366f1', 
                        weight: 3, 
                        dashArray: '5, 10', 
                        opacity: 0.7 
                    }} 
                />
            )}

            {/* Markers */}
            <Marker position={destinationPosition} icon={destinationIcon}>
                <Popup>Tu ubicación</Popup>
            </Marker>

            {driverPos && (
                <Marker position={driverPos} icon={driverIcon}>
                    <Popup>Repartidor</Popup>
                </Marker>
            )}
        </MapContainer>
        
        {/* Overlay Label if Driver is Active */}
        {driverPos && (
            <div className="absolute top-2 right-2 bg-white/90 dark:bg-gray-900/90 px-2 py-1 rounded-md text-xs font-bold text-primary shadow-sm border border-primary/20 z-[400]">
                En camino
            </div>
        )}
    </div>
  );
};

export default TrackingMap;