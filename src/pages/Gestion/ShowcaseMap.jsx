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
    fetchLegalDocuments
} from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Swal from 'sweetalert2';
import { FaMapMarkerAlt, FaPlus, FaEdit, FaTrash, FaSearch, FaFileContract, FaUserTie } from 'react-icons/fa';

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
        try {
            if (center && Array.isArray(center) && center.length === 2) {
                const lat = Number(center[0]);
                const lng = Number(center[1]);
                if (!isNaN(lat) && !isNaN(lng)) {
                    map.setView([lat, lng], zoom || map.getZoom());
                }
            }
        } catch (e) {
            console.error("Error al mover el mapa:", e);
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
            setInstallations(instData || []);
            setLeads((leadData || []).filter(l => l.status === 'CERRADO' || l.status === 'INSTALADO'));
            setContracts(contractData || []);
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
        return (installations || []).filter(inst => {
            const lat = Number(inst.lat);
            const lng = Number(inst.lng);
            if (isNaN(lat) || isNaN(lng)) return false;

            const query = searchQuery.toLowerCase();
            return (
                inst.nombre.toLowerCase().includes(query) ||
                inst.ciudad.toLowerCase().includes(query) ||
                inst.estado.toLowerCase().includes(query) ||
                inst.tipo.toLowerCase().includes(query)
            );
        });
    }, [installations, searchQuery]);

    useEffect(() => {
        if (selectedId && !filteredInstallations.some(i => i.id === selectedId)) {
            setSelectedId(null);
        }
    }, [filteredInstallations, selectedId]);

    const handleAddOrEdit = async (inst = null) => {
        if (!canManage) return;

        const { value: formValues } = await Swal.fire({
            title: inst ? 'Editar Punto' : 'Nueva Instalación',
            width: '600px',
            html: `
                <div class="space-y-4 text-left p-2 custom-scrollbar max-h-[70vh] overflow-y-auto">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-[10px] font-black text-gray-400 uppercase mb-1">Nombre</label>
                            <input id="swal-name" class="swal2-input w-full m-0 text-sm" value="${inst?.nombre || ''}">
                        </div>
                        <div>
                            <label class="block text-[10px] font-black text-gray-400 uppercase mb-1">Tipo</label>
                            <select id="swal-type" class="swal2-input w-full m-0 text-sm">
                                <option value="Vending Touch" ${inst?.tipo === 'Vending Touch' ? 'selected' : ''}>Vending Touch</option>
                                <option value="Planta de Ósmosis" ${inst?.tipo === 'Planta de Ósmosis' ? 'selected' : ''}>Planta de Ósmosis</option>
                                <option value="Dúo Emprendedor" ${inst?.tipo === 'Dúo Emprendedor' ? 'selected' : ''}>Dúo Emprendedor</option>
                                <option value="Vending Tradicional" ${inst?.tipo === 'Vending Tradicional' ? 'selected' : ''}>Vending Tradicional</option>
                                <option value="Equipo Industrial" ${inst?.tipo === 'Equipo Industrial' ? 'selected' : ''}>Equipo Industrial</option>
                            </select>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-[10px] font-black text-gray-400 uppercase mb-1">Ciudad</label>
                            <input id="swal-city" class="swal2-input w-full m-0 text-sm" value="${inst?.ciudad || ''}">
                        </div>
                        <div>
                            <label class="block text-[10px] font-black text-gray-400 uppercase mb-1">Estado</label>
                            <input id="swal-state" class="swal2-input w-full m-0 text-sm" value="${inst?.estado || ''}">
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-[10px] font-black text-gray-400 uppercase mb-1">Latitud</label>
                            <input id="swal-lat" type="number" step="any" class="swal2-input w-full m-0 text-sm" value="${inst?.lat || ''}">
                        </div>
                        <div>
                            <label class="block text-[10px] font-black text-gray-400 uppercase mb-1">Longitud</label>
                            <input id="swal-lng" type="number" step="any" class="swal2-input w-full m-0 text-sm" value="${inst?.lng || ''}">
                        </div>
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-gray-400 uppercase mb-1">Descripción</label>
                        <textarea id="swal-desc" class="swal2-textarea w-full m-0 h-20 text-sm">${inst?.descripcion || ''}</textarea>
                    </div>
                    <div class="border-t pt-4">
                        <h4 class="text-xs font-black text-primary uppercase mb-3">Vinculación</h4>
                        <div class="space-y-3">
                            <select id="swal-lead" class="swal2-input w-full m-0 text-sm">
                                <option value="">-- Vincular Lead --</option>
                                ${leads.map(l => `<option value="${l.id}" ${inst?.leadId === l.id ? 'selected' : ''}>${l.nombre}</option>`).join('')}
                            </select>
                            <select id="swal-contract" class="swal2-input w-full m-0 text-sm">
                                <option value="">-- Vincular Contrato --</option>
                                ${contracts.map(c => `<option value="${c.id}" ${inst?.legalDocumentId === c.id ? 'selected' : ''}>${c.nombre}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Guardar',
            preConfirm: () => {
                const nombre = document.getElementById('swal-name').value;
                const lat = parseFloat(document.getElementById('swal-lat').value);
                const lng = parseFloat(document.getElementById('swal-lng').value);
                if (!nombre || isNaN(lat) || isNaN(lng)) {
                    Swal.showValidationMessage('Nombre y coordenadas válidas son obligatorios');
                    return false;
                }
                return {
                    nombre,
                    tipo: document.getElementById('swal-type').value,
                    ciudad: document.getElementById('swal-city').value,
                    estado: document.getElementById('swal-state').value,
                    lat,
                    lng,
                    descripcion: document.getElementById('swal-desc').value,
                    leadId: document.getElementById('swal-lead').value || null,
                    legalDocumentId: document.getElementById('swal-contract').value || null,
                };
            }
        });

        if (formValues) {
            try {
                if (inst) await updateShowcaseInstallation(inst.id, formValues);
                else await createShowcaseInstallation(formValues);
                Swal.fire('Guardado', 'Datos actualizados.', 'success');
                loadData();
            } catch (error) {
                Swal.fire('Error', 'No se pudo guardar.', 'error');
            }
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({ title: '¿Eliminar?', icon: 'warning', showCancelButton: true });
        if (result.isConfirmed) {
            try {
                await deleteShowcaseInstallation(id);
                loadData();
            } catch (error) {
                Swal.fire('Error', 'No se pudo eliminar.', 'error');
            }
        }
    };

    const selectedInst = useMemo(() => installations.find(i => i.id === selectedId), [installations, selectedId]);

    return (
        <div className="flex flex-col h-[calc(100vh-120px)] lg:flex-row gap-6 animate-fade-in">
            <div className="w-full lg:w-96 flex flex-col gap-4 overflow-hidden">
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                    <h2 className="text-xl font-black text-gray-800 dark:text-white uppercase tracking-tighter mb-4 flex items-center gap-2">
                        <FaMapMarkerAlt className="text-primary" /> EXHIBICIÓN
                    </h2>
                    <div className="relative mb-4">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                            type="text" placeholder="Buscar..." 
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 rounded-xl text-sm outline-none"
                            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    {canManage && (
                        <button onClick={() => handleAddOrEdit()} className="w-full bg-primary text-white py-3 rounded-2xl font-black text-xs uppercase shadow-lg active:scale-95 transition-all">
                            <FaPlus className="inline mr-2" /> Añadir Punto
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                    {filteredInstallations.map(inst => (
                        <div 
                            key={inst.id}
                            onClick={() => setSelectedId(inst.id)}
                            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                                selectedId === inst.id ? 'bg-primary/5 border-primary ring-1' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'
                            }`}
                        >
                            <h3 className="font-black text-gray-800 dark:text-white text-sm uppercase truncate">{inst.nombre}</h3>
                            <p className="text-[10px] text-primary font-bold uppercase">{inst.tipo}</p>
                            {selectedId === inst.id && (
                                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 animate-in fade-in">
                                    <p className="text-xs text-gray-600 dark:text-gray-300 italic mb-4">"{inst.descripcion || 'Sin descripción.'}"</p>
                                    <div className="space-y-2">
                                        {inst.lead && <div className="text-[10px] text-emerald-600 font-bold bg-emerald-50 p-2 rounded-lg"><FaUserTie className="inline mr-2"/> Venta: {inst.lead.nombre}</div>}
                                        {inst.legalDocument && (
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const token = localStorage.getItem('token');
                                                    fetch(`${import.meta.env.VITE_API_URL || '/api'}/legal/archivo/${inst.legalDocument.id}`, { headers: { 'Authorization': `Bearer ${token}` } })
                                                    .then(res => res.blob()).then(blob => window.open(URL.createObjectURL(blob), '_blank'));
                                                }}
                                                className="w-full text-left text-[10px] text-blue-600 font-bold bg-blue-50 p-2 rounded-lg"
                                            >
                                                <FaFileContract className="inline mr-2"/> Ver Contrato
                                            </button>
                                        )}
                                    </div>
                                    {canManage && (
                                        <div className="flex gap-2 mt-4">
                                            <button onClick={(e) => { e.stopPropagation(); handleAddOrEdit(inst); }} className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl text-[10px] font-black uppercase">Editar</button>
                                            {isAdmin && <button onClick={(e) => { e.stopPropagation(); handleDelete(inst.id); }} className="p-2 bg-red-50 text-red-500 rounded-xl"><FaTrash size={12}/></button>}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex-1 h-full min-h-[400px] bg-white dark:bg-gray-800 rounded-[2.5rem] overflow-hidden shadow-xl border border-gray-100 dark:border-gray-700 relative">
                <MapContainer center={[19.4326, -99.1332]} zoom={5} className="w-full h-full z-0">
                    <MapController center={selectedInst ? [Number(selectedInst.lat), Number(selectedInst.lng)] : null} zoom={selectedInst ? 12 : null} />
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution='&copy; CARTO' className={theme === 'dark' ? '!filter !invert-[0.9] !hue-rotate-180' : ''} />
                    {filteredInstallations.map(inst => (
                        <Marker 
                            key={inst.id} position={[Number(inst.lat), Number(inst.lng)]} 
                            icon={selectedId === inst.id ? selectedIcon : defaultIcon}
                            eventHandlers={{ click: () => setSelectedId(inst.id) }}
                        >
                            <Popup>
                                <div className="p-1">
                                    <h4 className="font-black text-gray-800 uppercase text-xs">{inst.nombre}</h4>
                                    <p className="text-[10px] text-primary font-bold uppercase">{inst.tipo}</p>
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
