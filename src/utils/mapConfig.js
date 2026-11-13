/**
 * Configuración de Mapas Carto / OpenStreetMap
 * Soporta la API key definida en el .env como CATONMAPS o VITE_CATONMAPS
 */

export const getCartoTileUrl = (style = 'voyager') => {
  const rawKey = import.meta.env.CATONMAPS || import.meta.env.VITE_CATONMAPS || '';
  const apiKey = typeof rawKey === 'string' ? rawKey.replace(/\s+/g, '').trim() : '';

  if (apiKey) {
    return `https://basemaps.cartocdn.com/rastertiles/${style}/{z}/{x}/{y}{r}.png?key=${apiKey}`;
  }
  return `https://{s}.basemaps.cartocdn.com/rastertiles/${style}/{z}/{x}/{y}{r}.png`;
};

export const CARTO_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

export const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

export const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/**
 * Parámetros de optimización para Leaflet TileLayer:
 * Reducen drásticamente el consumo de teselas (API requests a Carto):
 * - updateWhenIdle: no pide teselas mientras el usuario arrastra el mapa, solo al soltarlo.
 * - updateWhenZooming: no pide teselas intermedias durante la animación del zoom.
 * - keepBuffer: conserva en memoria las teselas descargadas de bordes cercanos.
 * - maxNativeZoom: limita la petición máxima de teselas al nivel nativo de Carto (18).
 * - minZoom: previene alejamientos globales excesivos que descargan el mapa mundial.
 */
export const TILE_LAYER_OPTS = {
  updateWhenIdle: true,
  updateWhenZooming: false,
  keepBuffer: 4,
  maxNativeZoom: 18,
  minZoom: 10,
};
