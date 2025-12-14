import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

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

// --- Map Controller Component ---
const MapController = ({ position, zoom }) => {
  const map = useMap();
  useEffect(() => {
    // Only fly to a new position if it's a valid array of numbers
    if (Array.isArray(position) && typeof position[0] === 'number' && typeof position[1] === 'number') {
        map.flyTo(position, zoom, { animate: true, duration: 1.5 });
    }
  }, [position, zoom, map]);
  return null;
};

// --- Main Map Component ---
const Mapa = ({ driverPosition, orders, selectedOrder }) => {
  // 1. Define a rock-solid default position.
  const defaultCenter = [19.4326, -99.1332];

  // 2. Determine the center of the map. Only use selectedOrder if its coordinates are valid numbers.
  const mapCenter = useMemo(() => {
    if (selectedOrder && selectedOrder.cliente && typeof selectedOrder.cliente.lat === 'number' && typeof selectedOrder.cliente.lng === 'number') {
      return [selectedOrder.cliente.lat, selectedOrder.cliente.lng];
    }
    if (driverPosition && typeof driverPosition[0] === 'number' && typeof driverPosition[1] === 'number') {
      return driverPosition;
    }
    return defaultCenter;
  }, [selectedOrder, driverPosition]);

  // 3. Determine zoom level.
  const mapZoom = (selectedOrder && selectedOrder.cliente && typeof selectedOrder.cliente.lat === 'number') ? 16 : 13;

  // 4. Filter orders to ensure they have valid coordinates before rendering markers.
  const ordersWithCoords = useMemo(() => 
    orders.filter(order => order.cliente && typeof order.cliente.lat === 'number' && typeof order.cliente.lng === 'number'),
    [orders]
  );

  return (
    <MapContainer center={mapCenter} zoom={mapZoom} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
      <MapController position={mapCenter} zoom={mapZoom} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Driver Marker - only if position is valid */}
      {driverPosition && typeof driverPosition[0] === 'number' && (
        <Marker position={driverPosition} icon={driverIcon}>
          <Popup>Mi ubicación</Popup>
        </Marker>
      )}

      {/* Order Markers - already filtered */}
      {ordersWithCoords.map(order => (
        <Marker 
            key={order.id} 
            position={[order.cliente.lat, order.cliente.lng]}
            icon={selectedOrder?.id === order.id ? selectedOrderIcon : orderIcon}
            opacity={selectedOrder?.id === order.id ? 1.0 : 0.6}
        >
            <Popup>
                <p className="font-bold">{order.cliente.name}</p>
                <p>{order.cliente.street}</p>
            </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default Mapa;
