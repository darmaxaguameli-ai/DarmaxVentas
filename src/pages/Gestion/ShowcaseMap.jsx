import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { 
    fetchShowcaseInstallations, 
    createShowcaseInstallation, 
    updateShowcaseInstallation, 
    deleteShowcaseInstallation,
    fetchLeads,
    fetchLegalDocuments,
    geocodeAddress
} from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Swal from 'sweetalert2';
import { FaMapMarkerAlt, FaPlus, FaEdit, FaTrash, FaExternalLinkAlt, FaSearch, FaFileContract, FaUserTie } from 'react-icons/fa';

// --- Icon Definitions ---
const createIcon = (bgColor) => {
    return L.divIcon({
        html: `<div style="background-color: ${bgColor};" class="p-2 rounded-full shadow-lg border-2 border-white">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="white">
                    <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 20l-4.95-5.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
                  </svg>
               </div>`,
        className: 'bg-transparent',
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36],
    });
};

const defaultIcon = createIcon('#0ea5e9'); // Blue
const selectedIcon = createIcon('#f97316'); // Orange

// --- Map Controller ---
const MapController = ({ center, zoom }) => {
    const map = useMap();
    useEffect(() => {
        // Validar que el centro sea un array de dos números válidos antes de mover el mapa
        if (center && Array.isArray(center) && center.length === 2) {
            const [lat, lng] = center;
            if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
                map.setView(center, zoom || map.getZoom());
            }
        }
    }, [center, zoom, map]);
    return null;
};

const ShowcaseMap = () => {
    const { user } = useAuth();
    const { theme } = useTheme();
    const [installations, setInstallations] = useState([]);
    const [leads, setLeads] = useState([]);
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const isAdmin = user?.role === 'ADMIN';
    const canManage = isAdmin || user?.roles?.some(r => r.canAccessShowcase);

    const loadData = async () => {
        setLoading(true);
        try {
            const [instData, leadData, contractData] = await Promise.all([
                fetchShowcaseInstallations(),
                canManage ? fetchLeads() : Promise.resolve([]),
                canManage ? fetchLegalDocuments() : Promise.resolve([])
            ]);
            console.log("Cargando instalaciones:", instData); // Debug para ver qué llega del servidor
            setInstallations(instData);
            setLeads(leadData.filter(l => l.status === 'CERRADO' || l.status === 'INSTALADO'));
            setContracts(contractData);
        } catch (error) {
            console.error('Error loading showcase data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const filteredInstallations = useMemo(() => {
        return installations.filter(inst => 
            inst.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
            inst.ciudad.toLowerCase().includes(searchQuery.toLowerCase()) ||
            inst.estado.toLowerCase().includes(searchQuery.toLowerCase()) ||
            inst.tipo.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [installations, searchQuery]);

    const handleAddOrEdit = async (inst = null) => {
        if (!canManage) return;

        // Si es edición, buscar el lead y contrato actual
        const { value: formValues } = await Swal.fire({
            title: inst ? 'Editar Punto de Instalación' : 'Nueva Instalación en Mapa',
            width: '600px',
            html: `
                <div class="space-y-4 text-left p-2 custom-scrollbar max-h-[70vh] overflow-y-auto">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-[10px] font-black text-gray-400 uppercase mb-1">Nombre del Lugar</label>
                            <input id="swal-name" class="swal2-input w-full m-0 text-sm" placeholder="Ej: Purificadora Oasis" value="${inst?.nombre || ''}">
                        </div>
                        <div>
                            <label class="block text-[10px] font-black text-gray-400 uppercase mb-1">Tipo de Equipo</label>
                            <select id="swal-type" class="swal2-input w-full m-0 text-sm">
                                <option value="Planta de Ósmosis" ${inst?.tipo === 'Planta de Ósmosis' ? 'selected' : ''}>Planta de Ósmosis</option>
                                <option value="Vending Touch" ${inst?.tipo === 'Vending Touch' ? 'selected' : ''}>Vending Touch</option>
                                <option value="Dúo Emprendedor" ${inst?.tipo === 'Dúo Emprendedor' ? 'selected' : ''}>Dúo Emprendedor</option>
                                <option value="Vending Tradicional" ${inst?.tipo === 'Vending Tradicional' ? 'selected' : ''}>Vending Tradicional</option>
                                <option value="Equipo Industrial" ${inst?.tipo === 'Equipo Industrial' ? 'selected' : ''}>Equipo Industrial</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label class="block text-[10px] font-black text-gray-400 uppercase mb-1">Dirección (Calle y Número)</label>
                        <input id="swal-address" class="swal2-input w-full m-0 text-sm" placeholder="Av. Principal 123" value="${inst?.direccion || ''}">
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-[10px] font-black text-gray-400 uppercase mb-1">Ciudad</label>
                            <input id="swal-city" class="swal2-input w-full m-0 text-sm" placeholder="Puebla" value="${inst?.ciudad || ''}">
                        </div>
                        <div>
                            <label class="block text-[10px] font-black text-gray-400 uppercase mb-1">Estado</label>
                            <input id="swal-state" class="swal2-input w-full m-0 text-sm" placeholder="Puebla" value="${inst?.estado || ''}">
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-[10px] font-black text-gray-400 uppercase mb-1">Latitud</label>
                            <input id="swal-lat" type="number" step="any" class="swal2-input w-full m-0 text-sm" placeholder="19.4326" value="${inst?.lat || ''}">
                        </div>
                        <div>
                            <label class="block text-[10px] font-black text-gray-400 uppercase mb-1">Longitud</label>
                            <input id="swal-lng" type="number" step="any" class="swal2-input w-full m-0 text-sm" placeholder="-99.1332" value="${inst?.lng || ''}">
                        </div>
                    </div>

                    <div>
                        <label class="block text-[10px] font-black text-gray-400 uppercase mb-1">Descripción / Notas Públicas</label>
                        <textarea id="swal-desc" class="swal2-textarea w-full m-0 h-20 text-sm" placeholder="Ej: Instalación con 3 despachadores...">${inst?.descripcion || ''}</textarea>
                    </div>

                    <div class="border-t border-gray-100 pt-4 mt-4">
                        <h4 class="text-xs font-black text-primary uppercase mb-3">Vinculación Interna</h4>
                        <div class="space-y-3">
                            <div>
                                <label class="block text-[10px] font-black text-gray-400 uppercase mb-1">Enlazar con Lead (Venta)</label>
                                <select id="swal-lead" class="swal2-input w-full m-0 text-sm">
                                    <option value="">-- Ninguno --</option>
                                    ${leads.map(l => `<option value="${l.id}" ${inst?.leadId === l.id ? 'selected' : ''}>${l.nombre} (${l.paqueteVendido})</option>`).join('')}
                                </select>
                            </div>
                            <div>
                                <label class="block text-[10px] font-black text-gray-400 uppercase mb-1">Enlazar con Contrato Legal</label>
                                <select id="swal-contract" class="swal2-input w-full m-0 text-sm">
                                    <option value="">-- Ninguno --</option>
                                    ${contracts.map(c => `<option value="${c.id}" ${inst?.legalDocumentId === c.id ? 'selected' : ''}>${c.nombre}</option>`).join('')}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Guardar Punto',
            preConfirm: () => {
                const data = {
                    nombre: document.getElementById('swal-name').value,
                    tipo: document.getElementById('swal-type').value,
                    direccion: document.getElementById('swal-address').value,
                    ciudad: document.getElementById('swal-city').value,
                    estado: document.getElementById('swal-state').value,
                    lat: document.getElementById('swal-lat').value,
                    lng: document.getElementById('swal-lng').value,
                    descripcion: document.getElementById('swal-desc').value,
                    leadId: document.getElementById('swal-lead').value || null,
                    legalDocumentId: document.getElementById('swal-contract').value || null,
                };

                if (!data.nombre || !data.lat || !data.lng) {
                    Swal.showValidationMessage('Nombre y coordenadas son obligatorios');
                    return false;
                }
                return data;
            }
        });

        if (formValues) {
            try {
                if (inst) {
                    await updateShowcaseInstallation(inst.id, formValues);
                    Swal.fire('Actualizado', 'El punto ha sido actualizado.', 'success');
                } else {
                    await createShowcaseInstallation(formValues);
                    Swal.fire('Guardado', 'Nueva instalación añadida al mapa.', 'success');
                }
                loadData();
            } catch (error) {
                Swal.fire('Error', 'No se pudo guardar la instalación.', 'error');
            }
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: '¿Eliminar de exhibición?',
            text: "El punto dejará de ser visible en el mapa de clientes.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar'
        });

        if (result.isConfirmed) {
            try {
                await deleteShowcaseInstallation(id);
                loadData();
                Swal.fire('Eliminado', 'Punto removido con éxito.', 'success');
            } catch (error) {
                Swal.fire('Error', 'No se pudo eliminar.', 'error');
            }
        }
    };

    const selectedInst = useMemo(() => installations.find(i => i.id === selectedId), [installations, selectedId]);

    return (
        <div className="flex flex-col h-[calc(100vh-120px)] lg:flex-row gap-6 animate-fade-in">
            {/* Sidebar: List and Details */}
            <div className="w-full lg:w-96 flex flex-col gap-4 overflow-hidden">
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                    <h2 className="text-xl font-black text-gray-800 dark:text-white uppercase tracking-tighter mb-4 flex items-center gap-2">
                        <FaMapMarkerAlt className="text-primary" /> EXHIBICIÓN MÉXICO
                    </h2>
                    
                    <div className="relative mb-4">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Buscar ciudad o equipo..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {canManage && (
                        <button 
                            onClick={() => handleAddOrEdit()}
                            className="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all active:scale-95 mb-2"
                        >
                            <FaPlus /> Añadir Punto
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                    {filteredInstallations.length === 0 ? (
                        <div className="text-center py-10 text-gray-400 italic text-sm">No hay resultados</div>
                    ) : (
                        filteredInstallations.map(inst => (
                            <div 
                                key={inst.id}
                                onClick={() => setSelectedId(inst.id)}
                                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                                    selectedId === inst.id 
                                    ? 'bg-primary/5 border-primary ring-1 ring-primary/20' 
                                    : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-primary/50'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-black text-gray-800 dark:text-white text-sm uppercase truncate">{inst.nombre}</h3>
                                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 uppercase">{inst.estado}</span>
                                </div>
                                <p className="text-[10px] text-primary font-bold uppercase mb-2">{inst.tipo}</p>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2">{inst.ciudad}, {inst.estado}</p>
                                
                                {selectedId === inst.id && (
                                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 animate-in fade-in duration-300">
                                        <p className="text-xs text-gray-600 dark:text-gray-300 mb-4 italic">"{inst.descripcion || 'Sin descripción.'}"</p>
                                        
                                        <div className="space-y-2">
                                            {inst.lead && (
                                                <div className="flex items-center gap-2 text-[10px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-lg">
                                                    <FaUserTie /> Venta: {inst.lead.nombre}
                                                </div>
                                            )}
                                            {inst.legalDocument && (
                                                <a 
                                                    href={inst.legalDocument.archivoUrl} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 text-[10px] text-blue-600 font-bold bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg hover:underline"
                                                >
                                                    <FaFileContract /> Ver Contrato Asociado
                                                </a>
                                            )}
                                        </div>

                                        {canManage && (
                                            <div className="flex gap-2 mt-4">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleAddOrEdit(inst); }}
                                                    className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl text-[10px] font-black uppercase hover:bg-gray-200 transition-colors"
                                                >
                                                    Editar
                                                </button>
                                                {isAdmin && (
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(inst.id); }}
                                                        className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors"
                                                    >
                                                        <FaTrash size={12} />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Map Section */}
            <div className="flex-1 h-full min-h-[400px] bg-white dark:bg-gray-800 rounded-[2.5rem] overflow-hidden shadow-xl border border-gray-100 dark:border-gray-700 relative">
                <MapContainer 
                    center={[19.4326, -99.1332]} 
                    zoom={5} 
                    className="w-full h-full z-0"
                >
                    <MapController center={selectedInst ? [selectedInst.lat, selectedInst.lng] : null} zoom={selectedInst ? 12 : null} />
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                        attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                        className={theme === 'dark' ? '!filter !invert-[0.9] !hue-rotate-180 !brightness-95 !saturate-[0.6] !contrast-[1.1]' : ''}
                    />
                    
                    {filteredInstallations.map(inst => (
                        <Marker 
                            key={inst.id} 
                            position={[inst.lat, inst.lng]} 
                            icon={selectedId === inst.id ? selectedIcon : defaultIcon}
                            eventHandlers={{
                                click: () => setSelectedId(inst.id)
                            }}
                        >
                            <Popup className="custom-popup">
                                <div className="p-1">
                                    <h4 className="font-black text-gray-800 uppercase text-xs mb-0.5">{inst.nombre}</h4>
                                    <p className="text-[10px] text-primary font-bold uppercase mb-1">{inst.tipo}</p>
                                    <p className="text-[10px] text-gray-500">{inst.ciudad}, {inst.estado}</p>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>

                {/* Floating Map Legend */}
                <div className="absolute bottom-6 right-6 z-[400] bg-white/90 dark:bg-gray-900/90 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-white/20">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Instalaciones Darmax</h4>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-sky-500 shadow-sm"></div>
                            <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300">Equipo Funcionando</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-orange-500 shadow-sm animate-pulse"></div>
                            <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300">Selección Actual</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShowcaseMap;
