import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});


const Mapa = ({ driverPosition, orders }) => {
  const position = driverPosition || [19.4326, -99.1332]; // Default to Mexico City

  return (
    <MapContainer center={position} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {driverPosition && (
        <Marker position={driverPosition}>
          <Popup>
            Mi ubicación
          </Popup>
        </Marker>
      )}
      {orders && orders.map(order => (
        // This is a placeholder, you'd need to geocode the address
        <Marker key={order.id} position={[order.delivery.lat, order.delivery.lng]}>
            <Popup>
                <p>Pedido: {order.id}</p>
                <p>Cliente: {order.delivery.name}</p>
            </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default Mapa;
