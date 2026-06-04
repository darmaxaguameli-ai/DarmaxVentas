import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { 
    fetchShowcaseInstallations, 
    createShowcaseInstallation, 
    updateShowcaseInstallation, 
    deleteShowcaseInstallation,
    fetchLeads,
    fetchLegalDocuments
} from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Swal from 'sweetalert2';
import { FaMapMarkerAlt, FaPlus, FaEdit, FaTrash, FaSearch, FaFileContract, FaUserTie } from 'react-icons/fa';

// Íconos estáticos para evitar recrearlos en cada render
const createIcon = (color) => new L.divIcon({
    html: `<div style="background-color: ${color}; width: 30px; height: 30px;" class="rounded-full shadow-lg border-2 border-white flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="white">
                <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 20l-4.95-5.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
              </svg>
           </div>`,
    className: 'bg-transparent',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
});

const DEFAULT_ICON = createIcon('#0ea5e9');
const SELECTED_ICON = createIcon('#f97316');

// Componente para controlar la cámara sin causar bucles
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
        map.setView(center, zoom, { animate: true });
    }
  }, [center, zoom, map]);
  return null;
}

const ShowcaseMap = () => {
    const { user } = useAuth();
    const { theme } = useTheme();
    const [installations, setInstallations] = useState([]);
    const [leads, setLeads] = useState([]);
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Estado estable para el mapa
    const [mapView, setMapView] = useState({ center: [19.4326, -99.1332], zoom: 5 });

    const isAdmin = user?.role === 'ADMIN';
    const canManage = isAdmin || user?.roles?.some(r => r.canAccessShowcase);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [instData, leadData, contractData] = await Promise.all([
                fetchShowcaseInstallations(),
                canManage ? fetchLeads() : Promise.resolve([]),
                canManage ? fetchLegalDocuments() : Promise.resolve([])
            ]);
            setInstallations(instData || []);
            setLeads((leadData || []).filter(l => l.status === 'CERRADO' || l.status === 'INSTALADO'));
            setContracts(contractData || []);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    }, [canManage]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const filteredInstallations = useMemo(() => {
        return installations.filter(inst => {
            const lat = Number(inst.lat);
            const lng = Number(inst.lng);
            if (isNaN(lat) || isNaN(lng)) return false;
            
            const q = searchQuery.toLowerCase();
            return inst.nombre.toLowerCase().includes(q) || inst.ciudad.toLowerCase().includes(q);
        });
    }, [installations, searchQuery]);

    const handleSelect = (inst) => {
        if (selectedId === inst.id) {
            setSelectedId(null);
            setMapView({ center: [19.4326, -99.1332], zoom: 5 });
        } else {
            setSelectedId(inst.id);
            setMapView({ center: [Number(inst.lat), Number(inst.lng)], zoom: 13 });
        }
    };

    const handleAddOrEdit = async (inst = null) => {
        if (!canManage) return;
        const { value: formValues } = await Swal.fire({
            title: inst ? 'Editar' : 'Nuevo',
            html: `
                <input id="swal-name" class="swal2-input" placeholder="Nombre" value="${inst?.nombre || ''}">
                <input id="swal-lat" type="number" step="any" class="swal2-input" placeholder="Latitud" value="${inst?.lat || ''}">
                <input id="swal-lng" type="number" step="any" class="swal2-input" placeholder="Longitud" value="${inst?.lng || ''}">
            `,
            preConfirm: () => {
                const nombre = document.getElementById('swal-name').value;
                const lat = parseFloat(document.getElementById('swal-lat').value);
                const lng = parseFloat(document.getElementById('swal-lng').value);
                if (!nombre || isNaN(lat) || isNaN(lng)) return Swal.showValidationMessage('Datos incompletos');
                return { nombre, lat, lng, tipo: inst?.tipo || 'Vending', ciudad: inst?.ciudad || '', estado: inst?.estado || '' };
            }
        });
        if (formValues) {
            try {
                if (inst) await updateShowcaseInstallation(inst.id, formValues);
                else await createShowcaseInstallation(formValues);
                loadData();
                Swal.fire('Éxito', 'Guardado', 'success');
            } catch (e) { Swal.fire('Error', 'No se pudo guardar', 'error'); }
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] lg:flex-row gap-4 overflow-hidden p-2">
            {/* Lista Lateral */}
            <div className="w-full lg:w-80 flex flex-col gap-3 overflow-hidden">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <input 
                        type="text" placeholder="Buscar..." 
                        className="w-full p-2 bg-gray-50 dark:bg-gray-900 rounded-lg text-xs"
                        value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    />
                    {canManage && (
                        <button onClick={() => handleAddOrEdit()} className="w-full mt-2 bg-primary text-white py-2 rounded-xl text-[10px] font-bold uppercase">
                            + Añadir Punto
                        </button>
                    )}
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {filteredInstallations.map(inst => (
                        <div 
                            key={inst.id}
                            onClick={() => handleSelect(inst)}
                            className={`p-3 rounded-xl border cursor-pointer transition-all ${selectedId === inst.id ? 'border-primary bg-primary/5' : 'bg-white dark:bg-gray-800'}`}
                        >
                            <h3 className="text-xs font-black uppercase truncate">{inst.nombre}</h3>
                            <p className="text-[9px] text-gray-500 uppercase">{inst.tipo} • {inst.ciudad}</p>
                            {selectedId === inst.id && (
                                <div className="mt-2 pt-2 border-t flex gap-2">
                                    <button onClick={(e) => { e.stopPropagation(); handleAddOrEdit(inst); }} className="text-[9px] text-blue-500 font-bold uppercase">Editar</button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Mapa LIGERO */}
            <div className="flex-1 rounded-3xl overflow-hidden shadow-lg border bg-gray-100 relative z-0">
                <MapContainer 
                    center={[19.4326, -99.1332]} 
                    zoom={5} 
                    style={{ height: '100%', width: '100%' }}
                >
                    <ChangeView center={mapView.center} zoom={mapView.zoom} />
                    <TileLayer 
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                        attribution="&copy; CARTO"
                    />
                    {filteredInstallations.map(inst => (
                        <Marker 
                            key={inst.id} 
                            position={[Number(inst.lat), Number(inst.lng)]}
                            icon={selectedId === inst.id ? SELECTED_ICON : DEFAULT_ICON}
                            eventHandlers={{ click: () => handleSelect(inst) }}
                        >
                            <Popup>
                                <div className="text-[10px]">
                                    <p className="font-bold uppercase">{inst.nombre}</p>
                                    <p>{inst.tipo}</p>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>
        </div>
    );
};

export default ShowcaseMap;
