import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

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

const driverIcon = createIcon('#2563eb'); // blue-600
const orderIcon = createIcon('#6b7280'); // gray-500
const selectedOrderIcon = createIcon('#c2410c'); // orange-700


const MapController = ({ position, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
        map.flyTo(position, zoom, {
            animate: true,
            duration: 1.5
        });
    }
  }, [position, zoom, map]);
  return null;
};


const Mapa = ({ driverPosition, orders, selectedOrder }) => {
  const position = selectedOrder 
    ? [selectedOrder.delivery.lat, selectedOrder.delivery.lng] 
    : (driverPosition || [19.4326, -99.1332]);
  
  const zoom = selectedOrder ? 16 : 13;

  return (
    <MapContainer center={position} zoom={zoom} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
      <MapController position={position} zoom={zoom} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {driverPosition && (
        <Marker position={driverPosition} icon={driverIcon}>
          <Popup>Mi ubicación</Popup>
        </Marker>
      )}
      {orders && orders.map(order => (
        <Marker 
            key={order.id} 
            position={[order.delivery.lat, order.delivery.lng]}
            icon={selectedOrder?.id === order.id ? selectedOrderIcon : orderIcon}
        >
            <Popup>
                <p className="font-bold">{order.delivery.name}</p>
                <p>{order.delivery.address}</p>
            </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default Mapa;
