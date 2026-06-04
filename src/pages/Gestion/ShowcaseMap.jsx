import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
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

// Íconos estáticos definidos una sola vez fuera del componente
const DEFAULT_ICON = new L.divIcon({
    html: `<div style="background-color: #0ea5e9; width: 24px; height: 24px;" class="rounded-full shadow-lg border-2 border-white flex items-center justify-center">
              <div class="w-2 h-2 bg-white rounded-full"></div>
           </div>`,
    className: 'bg-transparent',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
});

const SELECTED_ICON = new L.divIcon({
    html: `<div style="background-color: #f97316; width: 32px; height: 32px;" class="rounded-full shadow-xl border-2 border-white flex items-center justify-center animate-bounce">
              <div class="w-3 h-3 bg-white rounded-full"></div>
           </div>`,
    className: 'bg-transparent',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
});

const ShowcaseMap = () => {
    const { user } = useAuth();
    const { theme } = useTheme();
    const mapRef = useRef(null); // REFERENCIA DIRECTA AL MAPA
    
    const [installations, setInstallations] = useState([]);
    const [leads, setLeads] = useState([]);
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const isAdmin = user?.role === 'ADMIN';
    const canManage = isAdmin || user?.roles?.some(r => r.canAccessShowcase);

    const loadData = useCallback(async () => {
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
            console.error('Error al cargar datos:', error);
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

    // Función de selección segura que usa la referencia del mapa
    const handleSelect = (inst) => {
        if (selectedId === inst.id) {
            setSelectedId(null);
            if (mapRef.current) mapRef.current.setView([19.4326, -99.1332], 5);
        } else {
            setSelectedId(inst.id);
            const lat = Number(inst.lat);
            const lng = Number(inst.lng);
            // Movemos el mapa mediante la instancia directa, NO mediante estado de React
            if (mapRef.current && !isNaN(lat) && !isNaN(lng)) {
                mapRef.current.setView([lat, lng], 14, { animate: true });
            }
        }
    };

    const handleAddOrEdit = async (inst = null) => {
        if (!canManage) return;
        const { value: formValues } = await Swal.fire({
            title: inst ? 'Editar Punto' : 'Nuevo Punto',
            html: `
                <div class="space-y-3">
                    <input id="swal-name" class="swal2-input w-full m-0" placeholder="Nombre de la sucursal" value="${inst?.nombre || ''}">
                    <div class="grid grid-cols-2 gap-2">
                        <input id="swal-lat" type="number" step="any" class="swal2-input w-full m-0" placeholder="Latitud" value="${inst?.lat || ''}">
                        <input id="swal-lng" type="number" step="any" class="swal2-input w-full m-0" placeholder="Longitud" value="${inst?.lng || ''}">
                    </div>
                </div>
            `,
            preConfirm: () => {
                const nombre = document.getElementById('swal-name').value;
                const lat = parseFloat(document.getElementById('swal-lat').value);
                const lng = parseFloat(document.getElementById('swal-lng').value);
                if (!nombre || isNaN(lat) || isNaN(lng)) return Swal.showValidationMessage('Datos inválidos');
                return { nombre, lat, lng, tipo: inst?.tipo || 'Vending', ciudad: inst?.ciudad || '', estado: inst?.estado || '' };
            }
        });
        if (formValues) {
            try {
                if (inst) await updateShowcaseInstallation(inst.id, formValues);
                else await createShowcaseInstallation(formValues);
                loadData();
                Swal.fire('Guardado', '', 'success');
            } catch (e) { Swal.fire('Error', 'No se pudo guardar', 'error'); }
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] lg:flex-row gap-4 p-2 overflow-hidden">
            {/* Sidebar persistente */}
            <div className="w-full lg:w-80 flex flex-col gap-3 overflow-hidden">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h2 className="text-sm font-black uppercase text-gray-400 mb-3 tracking-widest">Sucursales</h2>
                    <input 
                        type="text" placeholder="Filtrar ciudad..." 
                        className="w-full p-2 bg-gray-50 dark:bg-gray-900 rounded-xl text-xs outline-none border border-transparent focus:border-primary/30"
                        value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    />
                    {canManage && (
                        <button onClick={() => handleAddOrEdit()} className="w-full mt-3 bg-primary text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all">
                            + Añadir Ubicación
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {filteredInstallations.map(inst => (
                        <div 
                            key={inst.id}
                            onClick={() => handleSelect(inst)}
                            className={`p-4 rounded-2xl border cursor-pointer transition-all duration-300 ${selectedId === inst.id ? 'border-primary bg-primary/5 shadow-md' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'}`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <h3 className="text-xs font-black uppercase truncate">{inst.nombre}</h3>
                                <span className="text-[8px] bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded font-bold">{inst.tipo}</span>
                            </div>
                            <p className="text-[10px] text-gray-500 uppercase">{inst.ciudad}, {inst.estado}</p>
                            
                            {selectedId === inst.id && (
                                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 animate-in fade-in">
                                    <div className="flex gap-2">
                                        <button onClick={(e) => { e.stopPropagation(); handleAddOrEdit(inst); }} className="flex-1 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase">Editar</button>
                                        {isAdmin && <button onClick={(e) => { e.stopPropagation(); deleteShowcaseInstallation(inst.id).then(loadData); }} className="p-1.5 bg-red-50 text-red-500 rounded-lg"><FaTrash size={10}/></button>}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Contenedor del Mapa - Fijo y sin re-renderizado de instancia */}
            <div className="flex-1 rounded-[2rem] overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 relative z-0">
                <MapContainer 
                    center={[19.4326, -99.1332]} 
                    zoom={5} 
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={false}
                    whenCreated={(mapInstance) => { mapRef.current = mapInstance; }} // Capturamos la instancia real
                >
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
                                <div className="text-[10px] p-1">
                                    <p className="font-black uppercase text-primary">{inst.nombre}</p>
                                    <p className="text-gray-500 font-bold">{inst.tipo}</p>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
                
                {/* Leyenda flotante */}
                <div className="absolute bottom-6 right-6 z-[400] bg-white/80 dark:bg-gray-900/80 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-white/20">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-sky-500"></div>
                        <span className="text-[8px] font-black text-gray-500 uppercase">Instalación Activa</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShowcaseMap;
