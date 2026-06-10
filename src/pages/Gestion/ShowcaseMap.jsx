import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import apiClient, { 
    fetchShowcaseInstallations,
    createShowcaseInstallation,
    updateShowcaseInstallation,
    deleteShowcaseInstallation,
    fetchLegalDocuments,
    fetchLeads
} from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import { FaMapMarkerAlt, FaDirections, FaSearch, FaPlus, FaEdit, FaTrash, FaFileContract, FaPhone } from 'react-icons/fa';
import Swal from 'sweetalert2';
import { toast } from 'sonner';

// Solución para los iconos de Leaflet que a veces no cargan en React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Componente auxiliar para mover el mapa cuando cambia la selección
const RecenterMap = ({ coords }) => {
    const map = useMap();
    useEffect(() => {
        if (!coords) return;
        
        const [lat, lng] = coords;
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

        map.flyTo(coords, 14, { animate: true, duration: 1.5 });
    }, [coords, map]);
    return null;
};

const ShowcaseMap = () => {
    const { user, hasPermission } = useAuth();
    const [installations, setInstallations] = useState([]);
    const [leads, setLeads] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const didLoad = useRef(false);

    const isAdmin = user?.role === 'ADMIN';
    const canManage = isAdmin || hasPermission('canAccessShowcase');

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [instData, docData, leadData] = await Promise.all([
                fetchShowcaseInstallations(),
                fetchLegalDocuments(),
                fetchLeads()
            ]);
            setInstallations(instData || []);
            setDocuments(docData || []);
            // Filtrar solo leads cerrados o instalados para vinculación sugerida
            setLeads((leadData || []).filter(l => l.status === 'CERRADO' || l.status === 'INSTALADO' || l.tipo === 'CLIENTE_VENTA'));
        } catch (error) {
            console.error('Error al cargar datos:', error);
            toast.error("Error al cargar datos del sistema");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (didLoad.current) return;
        didLoad.current = true;
        loadData();
    }, [loadData]);

    // Efecto para detectar leadId en URL y abrir modal
    useEffect(() => {
        if (!loading && leads.length > 0) {
            const params = new URLSearchParams(window.location.search);
            const leadId = params.get('leadId');
            if (leadId) {
                const lead = leads.find(l => l.id === leadId);
                if (lead) {
                    // Limpiar URL
                    window.history.replaceState({}, document.title, window.location.pathname);
                    handleAddOrEdit();
                    // Esperar a que abra el modal y sincronizar
                    setTimeout(() => {
                        const select = document.getElementById('swal-lead-sync');
                        if (select) {
                            select.value = leadId;
                            // Disparar evento de cambio manualmente
                            const event = new Event('change', { bubbles: true });
                            select.dispatchEvent(event);
                            if (window.syncLeadData) window.syncLeadData(leadId);
                        }
                    }, 500);
                }
            }
        }
    }, [loading, leads]);

    const handleViewDocument = (docId) => {
        if (!docId) return;
        const token = localStorage.getItem('token');
        const url = `${import.meta.env.VITE_API_URL || '/api'}/legal/archivo/${docId}`;
        
        fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => {
            if (!res.ok) throw new Error('Sin permiso para ver este archivo.');
            return res.blob();
        })
        .then(blob => {
            const fileURL = URL.createObjectURL(blob);
            window.open(fileURL, '_blank');
        })
        .catch(err => Swal.fire('Error', err.message, 'error'));
    };

    const handleAddOrEdit = async (inst = null) => {
        if (!canManage) return;

        const docOptions = documents.map(d => `<option value="${d.id}" ${inst?.legalDocumentId === d.id ? 'selected' : ''}>${d.nombre}</option>`).join('');
        const leadOptions = leads.map(l => `<option value="${l.id}" ${inst?.leadId === l.id ? 'selected' : ''}>${l.nombre} (${l.telefono})</option>`).join('');

        const { value: formValues } = await Swal.fire({
            title: inst ? 'Editar Punto de Exhibición' : 'Nuevo Punto de Exhibición',
            html: `
                <div class="flex flex-col gap-4 text-left p-2 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    ${!inst ? `
                    <div class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-800 mb-2">
                        <label class="text-[9px] font-black uppercase text-blue-600 dark:text-blue-400 block mb-1">Auto-completar desde Lead (Cartera)</label>
                        <select id="swal-lead-sync" class="swal2-input w-full m-0 text-sm bg-white dark:bg-gray-900" onchange="window.syncLeadData(this.value)">
                            <option value="">-- Seleccionar Lead --</option>
                            ${leadOptions}
                        </select>
                    </div>
                    ` : ''}

                    <div>
                        <label class="text-[10px] font-black uppercase text-gray-400 block mb-1">Nombre Comercial</label>
                        <input id="swal-name" class="swal2-input w-full m-0 text-sm" placeholder="Ej: Purificadora San Juan" value="${inst?.nombre || ''}">
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label class="text-[10px] font-black uppercase text-gray-400 block mb-1">Teléfono de Contacto</label>
                            <input id="swal-phone" type="tel" class="swal2-input w-full m-0 text-sm" placeholder="5512345678" value="${inst?.telefono || inst?.lead?.telefono || ''}">
                        </div>
                        <div>
                            <label class="text-[10px] font-black uppercase text-gray-400 block mb-1">Tipo de Planta</label>
                            <input id="swal-type" list="plant-types" class="swal2-input w-full m-0 text-sm" placeholder="Ej: Vending Pro..." value="${inst?.tipo || ''}">
                            <datalist id="plant-types">
                                <option value="Vending">
                                <option value="Planta Completa">
                                <option value="Mostrador">
                                <option value="Híbrida">
                            </datalist>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="text-[10px] font-black uppercase text-gray-400 block mb-1">Latitud</label>
                            <input id="swal-lat" type="number" step="any" class="swal2-input w-full m-0 text-sm" placeholder="19.4326" value="${inst?.lat || ''}">
                        </div>
                        <div>
                            <label class="text-[10px] font-black uppercase text-gray-400 block mb-1">Longitud</label>
                            <input id="swal-lng" type="number" step="any" class="swal2-input w-full m-0 text-sm" placeholder="-99.1332" value="${inst?.lng || ''}">
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="text-[10px] font-black uppercase text-gray-400 block mb-1">Ciudad</label>
                            <input id="swal-city" class="swal2-input w-full m-0 text-sm" placeholder="Ciudad" value="${inst?.ciudad || ''}">
                        </div>
                        <div>
                            <label class="text-[10px] font-black uppercase text-gray-400 block mb-1">Estado</label>
                            <input id="swal-state" class="swal2-input w-full m-0 text-sm" placeholder="Estado" value="${inst?.estado || ''}">
                        </div>
                    </div>

                    <div>
                        <label class="text-[10px] font-black uppercase text-gray-400 block mb-1">Dirección Completa</label>
                        <input id="swal-address" class="swal2-input w-full m-0 text-sm" placeholder="Calle, Colonia, etc." value="${inst?.direccion || ''}">
                    </div>

                    <div>
                        <label class="text-[10px] font-black uppercase text-gray-400 block mb-1">Vincular Contrato Legal</label>
                        <select id="swal-doc" class="swal2-input w-full m-0 text-sm">
                            <option value="">-- Sin contrato --</option>
                            ${docOptions}
                        </select>
                    </div>
                </div>
            `,
            didOpen: () => {
                window.syncLeadData = (leadId) => {
                    const lead = leads.find(l => l.id === leadId);
                    if (lead) {
                        document.getElementById('swal-name').value = lead.nombre;
                        document.getElementById('swal-phone').value = lead.telefono || '';
                        document.getElementById('swal-city').value = lead.ciudad || '';
                        document.getElementById('swal-address').value = lead.direccion || '';
                        document.getElementById('swal-type').value = lead.paqueteVendido || '';
                    }
                };
            },
            willClose: () => { delete window.syncLeadData; },
            showCancelButton: true,
            confirmButtonText: 'Guardar Ubicación',
            cancelButtonText: 'Cancelar',
            preConfirm: () => {
                const nombre = document.getElementById('swal-name').value;
                const lat = parseFloat(document.getElementById('swal-lat').value);
                const lng = parseFloat(document.getElementById('swal-lng').value);
                const telefono = document.getElementById('swal-phone').value;
                const ciudad = document.getElementById('swal-city').value;
                const estado = document.getElementById('swal-state').value;
                const tipo = document.getElementById('swal-type').value;
                const direccion = document.getElementById('swal-address').value;
                const legalDocumentId = document.getElementById('swal-doc').value;
                const leadId = document.getElementById('swal-lead-sync')?.value;

                if (!nombre || isNaN(lat) || isNaN(lng)) {
                    Swal.showValidationMessage('Nombre, Latitud y Longitud son obligatorios');
                    return false;
                }

                return { nombre, lat, lng, telefono, ciudad, estado, tipo, direccion, legalDocumentId: legalDocumentId || null, leadId: leadId || null };
            }
        });

        if (formValues) {
            try {
                if (inst) await updateShowcaseInstallation(inst.id, formValues);
                else await createShowcaseInstallation(formValues);
                
                toast.success(inst ? "Punto actualizado" : "Punto creado correctamente");
                didLoad.current = false;
                loadData();
            } catch (error) {
                console.error("Error saving point:", error);
                Swal.fire('Error', 'No se pudo guardar la ubicación', 'error');
            }
        }
    };

    const handleDelete = async (id) => {
        if (!isAdmin) return;

        const result = await Swal.fire({
            title: '¿Eliminar ubicación?',
            text: "Esta acción quitará el punto del mapa de exhibición.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Mantener'
        });

        if (result.isConfirmed) {
            try {
                await deleteShowcaseInstallation(id);
                toast.success("Ubicación eliminada");
                setSelectedId(null);
                didLoad.current = false;
                loadData();
            } catch (error) {
                Swal.fire('Error', 'No se pudo eliminar', 'error');
            }
        }
    };

    // 1. FILTRAR Y SANITIZAR DATOS DE LA API
    const validInstallations = useMemo(() => {
        return installations
            .map(inst => ({
                ...inst,
                latNum: Number(inst.lat),
                lngNum: Number(inst.lng),
                nombreSafe: inst.nombre || 'Sin nombre',
                ciudadSafe: inst.ciudad || 'Sin ciudad',
                telefonoSafe: inst.telefono || inst.lead?.telefono || 'Sin teléfono'
            }))
            .filter(inst =>
                Number.isFinite(inst.latNum) &&
                Number.isFinite(inst.lngNum) &&
                inst.latNum >= -90 && inst.latNum <= 90 &&
                inst.lngNum >= -180 && inst.lngNum <= 180
            );
    }, [installations]);

    // 2. FILTRAR POR BÚSQUEDA
    const filtered = useMemo(() => {
        const q = searchQuery.toLowerCase();
        return validInstallations.filter(inst => 
            inst.nombreSafe.toLowerCase().includes(q) || 
            inst.ciudadSafe.toLowerCase().includes(q)
        );
    }, [validInstallations, searchQuery]);

    // 3. OBTENER COORDENADAS DE SELECCIÓN SEGURAS
    const selectedCoords = useMemo(() => {
        const inst = validInstallations.find(i => i.id === selectedId);
        return inst ? [inst.latNum, inst.lngNum] : null;
    }, [selectedId, validInstallations]);

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] lg:flex-row gap-4 p-2 overflow-hidden bg-gray-50/50 dark:bg-transparent">
            
            {/* PANEL IZQUIERDO: LISTADO */}
            <div className="w-full lg:w-[380px] flex flex-col gap-4 overflow-hidden">
                <div className="bg-white dark:bg-gray-800 p-5 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xs font-black uppercase text-blue-600 tracking-widest flex items-center gap-2">
                            <FaMapMarkerAlt /> Sucursales
                        </h2>
                        {canManage && (
                            <button 
                                onClick={() => handleAddOrEdit()}
                                className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                title="Añadir nueva ubicación"
                            >
                                <FaPlus size={12} />
                            </button>
                        )}
                    </div>
                    <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                        <input 
                            type="text" 
                            placeholder="Buscar sucursal o ciudad..." 
                            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 rounded-xl text-xs font-bold outline-none"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                    {loading ? (
                        <div className="p-10 text-center animate-pulse text-[10px] font-black text-gray-400 uppercase">Cargando...</div>
                    ) : filtered.length === 0 ? (
                        <div className="p-10 text-center text-[10px] font-black text-gray-400 uppercase italic">No se encontraron resultados</div>
                    ) : (
                        filtered.map(inst => (
                            <div 
                                key={inst.id}
                                onClick={() => setSelectedId(inst.id)}
                                className={`p-5 rounded-[2rem] border-2 cursor-pointer transition-all duration-300 relative overflow-hidden ${
                                    selectedId === inst.id 
                                    ? 'border-blue-500 bg-blue-500 text-white shadow-xl shadow-blue-500/20' 
                                    : 'bg-white dark:bg-gray-800 border-transparent hover:border-gray-100 dark:hover:border-gray-700 shadow-sm'
                                }`}
                            >
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase ${selectedId === inst.id ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'}`}>
                                            {inst.tipo || 'PURIFICADORA'}
                                        </span>
                                        {selectedId === inst.id && canManage && (
                                            <div className="flex gap-2 animate-in fade-in zoom-in">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleAddOrEdit(inst); }}
                                                    className="p-1.5 bg-white/20 rounded-lg hover:bg-white/30"
                                                >
                                                    <FaEdit size={10} />
                                                </button>
                                                {isAdmin && (
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(inst.id); }}
                                                        className="p-1.5 bg-white/20 rounded-lg hover:bg-red-500"
                                                    >
                                                        <FaTrash size={10} />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="text-xs font-black uppercase leading-tight">{inst.nombreSafe}</h3>
                                    <p className={`text-[10px] mt-1 font-bold ${selectedId === inst.id ? 'text-white/80' : 'text-gray-400'}`}>{inst.ciudadSafe}, {inst.estado}</p>
                                    <p className={`text-[9px] font-bold ${selectedId === inst.id ? 'text-white/60' : 'text-gray-400'} mt-1 flex items-center gap-1`}>
                                        <FaPhone className="text-[7px]" /> {inst.telefonoSafe}
                                    </p>
                                    
                                    {selectedId === inst.id && (
                                        <div className="mt-4 flex flex-col gap-2">
                                            <a 
                                                href={`https://www.google.com/maps/dir/?api=1&destination=${inst.latNum},${inst.lngNum}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="flex items-center justify-center gap-2 bg-white text-blue-600 text-[10px] font-black uppercase py-2.5 rounded-xl shadow-sm hover:scale-[1.02] transition-transform"
                                            >
                                                <FaDirections /> Cómo llegar
                                            </a>
                                            {inst.legalDocumentId && (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleViewDocument(inst.legalDocumentId); }}
                                                    className="flex items-center justify-center gap-2 bg-white/20 text-white text-[10px] font-black uppercase py-2.5 rounded-xl hover:bg-blue-600/30 transition-all"
                                                >
                                                    <FaFileContract /> Ver Contrato
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* PANEL DERECHO: MAPA LEAFLET */}
            <div className="flex-1 rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white dark:border-gray-800 bg-gray-200 relative z-0">
                <MapContainer 
                    center={[23.6345, -102.5528]} 
                    zoom={5} 
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={false}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {/* Controlador de movimiento */}
                    <RecenterMap coords={selectedCoords} />

                    {filtered.map(inst => (
                        <Marker 
                            key={inst.id} 
                            position={[inst.latNum, inst.lngNum]}
                            eventHandlers={{
                                click: () => setSelectedId(inst.id)
                            }}
                        >
                            <Popup>
                                <div className="text-left p-1 min-w-[150px]">
                                    <p className="text-[10px] font-black uppercase text-blue-600 leading-tight mb-1">{inst.nombreSafe}</p>
                                    <p className="text-[9px] font-bold text-gray-500 uppercase">{inst.ciudadSafe}, {inst.estado}</p>
                                    <p className="text-[8px] font-bold text-gray-400 mt-1 mb-2 flex items-center gap-1">
                                        <FaPhone size={8} /> {inst.telefonoSafe}
                                    </p>
                                    <div className="h-px bg-gray-100 my-2"></div>
                                    <div className="flex flex-col gap-2">
                                        <a 
                                            href={`https://www.google.com/maps/dir/?api=1&destination=${inst.latNum},${inst.lngNum}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center justify-center gap-1 bg-blue-600 !text-white text-[9px] font-black uppercase py-1.5 px-3 rounded-lg shadow-sm hover:bg-blue-700 transition-all"
                                        >
                                            <FaDirections size={10} /> Cómo llegar
                                        </a>
                                        {inst.legalDocumentId && (
                                            <button 
                                                onClick={() => handleViewDocument(inst.legalDocumentId)}
                                                className="flex items-center justify-center gap-1 bg-gray-100 text-gray-600 text-[9px] font-black uppercase py-1.5 px-3 rounded-lg hover:bg-gray-200 transition-all"
                                            >
                                                <FaFileContract size={10} /> Contrato
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>

                {loading && (
                    <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-[1000] flex items-center justify-center">
                        <div className="bg-white p-4 rounded-2xl shadow-xl flex items-center gap-3">
                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-[10px] font-black uppercase text-gray-500">Cargando Mapa...</span>
                        </div>
                    </div>
                )}
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .leaflet-popup-content-wrapper {
                    border-radius: 1.5rem !important;
                    padding: 8px !important;
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1) !important;
                }
                .leaflet-popup-tip-container {
                    display: none !important;
                }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
            `}} />
        </div>
    );
};

export default ShowcaseMap;
