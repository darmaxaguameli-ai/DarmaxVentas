import React, { useState } from 'react';
import { Geolocation } from '@capacitor/geolocation';

const RequestLocationButton = () => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);

  const getCurrentLocation = async () => {
    try {
      // 1. Verificar si ya tenemos permiso
      let permStatus = await Geolocation.checkPermissions();

      // 2. Si no, solicitarlo
      if (permStatus.location !== 'granted') {
        const requestPerms = await Geolocation.requestPermissions();
        // Si el usuario deniega el permiso después de solicitarlo
        if (requestPerms.location !== 'granted') {
           setError('El permiso de ubicación fue denegado.');
           return;
        }
      }
      
      // 3. Si el permiso está concedido, obtener la ubicación
      const coordinates = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true, // Opcional, para mayor precisión
      });

      setLocation({
        lat: coordinates.coords.latitude,
        lng: coordinates.coords.longitude,
      });
      setError(null); // Limpiar errores previos

    } catch (e) {
      setError(`Error al obtener la ubicación: ${e.message}`);
      console.error(e);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', border: '1px solid #ccc', borderRadius: '8px', margin: '10px' }}>
      <h3>Probar Permiso de Ubicación</h3>
      <button onClick={getCurrentLocation}>
        Obtener Ubicación
      </button>
      {location && (
        <div style={{ marginTop: '10px' }}>
          <h4>Ubicación Actual:</h4>
          <p>Latitud: {location.lat}</p>
          <p>Longitud: {location.lng}</p>
        </div>
      )}
      {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
    </div>
  );
};

export default RequestLocationButton;
