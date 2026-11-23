import React, { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useGestion } from "./context/GestionContext";
import { useAuth } from "../../context/AuthContext";
import apiClient, { fetchPostalCodeData as apiFetchPostalCode } from "@/api/apiClient";
import Swal from 'sweetalert2';
import { toast } from 'sonner';
import { 
  FaUserPlus, FaSearch, FaFilter, FaMapMarkerAlt, FaEnvelope, 
  FaPhone, FaStar, FaStore, FaEdit, FaTrash, FaTimes, FaPlus, 
  FaCalendarAlt, FaDownload, FaFileCode, FaFileCsv, FaDatabase,
  FaThLarge, FaThList, FaWhatsapp, FaChevronDown, FaCheck,
  FaExclamationTriangle, FaCrosshairs, FaBuilding, FaUser,
  FaClock, FaUsers, FaExternalLinkAlt, FaCheckCircle
} from 'react-icons/fa';

// Cabecera táctil estilo Bottom Sheet para dispositivos móviles
const MobileSheetHeader = ({ isExpanded, onToggleExpand, onClose, canExpand = true }) => {
  const touchStartY = useRef(0);
  const handleTouchStart = (e) => { touchStartY.current = e.touches[0].clientY; };
  const handleTouchEnd = (e) => {
    const diffY = e.changedTouches[0].clientY - touchStartY.current;
    if (diffY > 60) {
      if (isExpanded && canExpand) onToggleExpand();
      else onClose();
    } else if (diffY < -60 && !isExpanded && canExpand) {
      onToggleExpand();
    }
  };

  return (
    <div 
      className="w-full pt-3 pb-2 flex flex-col items-center justify-center sm:hidden select-none touch-manipulation cursor-grab active:cursor-grabbing flex-shrink-0 bg-transparent"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <button 
        type="button"
        onClick={() => { if (!canExpand) onClose(); else onToggleExpand(); }}
        className="group flex flex-col items-center justify-center px-8 py-1 active:scale-95 focus:outline-none touch-manipulation"
      >
        <div 
          className={`h-1.5 rounded-full transition-all duration-300 ease-out ${
            isExpanded 
              ? 'bg-primary dark:bg-blue-400 w-16 shadow-xs' 
              : 'bg-gray-300 dark:bg-gray-600 w-12'
          }`} 
        />
        <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-wider">
          {canExpand ? (isExpanded ? 'Desliza para bajar' : 'Toca para abrir más') : 'Desliza para bajar'}
        </span>
      </button>
    </div>
  );
};

// Componente Principal de Gestión de Clientes
const ManageClients = ({ selectedStoreFilter, setStoreFilter }) => {
  const { state, addClient, updateClient, deleteClient } = useGestion();
  const { clients = [], stores = [], jugBrands = [] } = state;
  
  // Filtros y vistas
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("TODAS"); // "TODAS" | "PARTICULAR" | "EMPRESA" | "HOSPITAL" | "ESCUELA"
  const [concurrenceFilter, setConcurrenceFilter] = useState("TODOS"); // "TODOS" | "ON_TIME" | "LATE" | "NO_PURCHASE"
  const [sortOption, setSortOption] = useState("NAME_ASC"); // "NAME_ASC" | "NAME_DESC" | "RECENT_PURCHASE" | "MORE_URGENT"
  const [viewMode, setViewMode] = useState("CARDS"); // "CARDS" | "TABLE"

  // Modales y estados
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalExpanded, setIsModalExpanded] = useState(false);
  const [modalActiveTab, setModalActiveTab] = useState("GENERAL"); // "GENERAL" | "UBICACION" | "PREFERENCIAS"
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportScope, setExportScope] = useState("all");
  const [editingClient, setEditingClient] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const initialClientState = {
    name: "",
    email: "",
    phone: "",
    street: "",
    neighborhood: "",
    municipality: "",
    state: "",
    postalCode: "",
    references: "",
    clientCategory: "PARTICULAR",
    storeId: "",
    purchaseFrequencyDays: "",
    clientPreferences: [],
    lastPurchaseDate: "",
    lat: "",
    lng: ""
  };

  const [formData, setFormData] = useState(initialClientState);

  // Helper para el estatus de concurrencia
  const getConcurrenceStatus = (client) => {
    if (!client.lastPurchaseDate) {
      return { 
        text: "Sin compras registradas", 
        color: "text-gray-400 dark:text-gray-500", 
        badge: "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700", 
        days: null, 
        status: 'NO_PURCHASE' 
      };
    }
    const freq = client.purchaseFrequencyDays;
    if (freq === undefined || freq === null || freq === "" || freq === 0) {
      return { 
        text: "Frecuencia no definida", 
        color: "text-gray-400 dark:text-gray-500", 
        badge: "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700", 
        days: null, 
        status: 'UNSET' 
      };
    }
    const lastDate = new Date(client.lastPurchaseDate);
    const diffTime = Math.abs(new Date() - lastDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > freq) {
      return { 
        text: `Retrasado (${diffDays}d vs ${freq}d esp.)`, 
        color: "text-rose-600 dark:text-rose-400 font-black", 
        badge: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800", 
        isLate: true, 
        days: diffDays, 
        status: 'LATE' 
      };
    }
    return { 
      text: `Al día (hace ${diffDays}d, esp. cada ${freq}d)`, 
      color: "text-emerald-600 dark:text-emerald-400 font-bold", 
      badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800", 
      isLate: false, 
      days: diffDays, 
      status: 'ON_TIME' 
    };
  };

  // Helper para el badge visual de categorías
  const getCategoryBadge = (category) => {
    switch (category) {
      case 'EMPRESA':
        return { label: 'Empresa', badge: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800' };
      case 'HOSPITAL':
        return { label: 'Hospital', badge: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800' };
      case 'ESCUELA':
        return { label: 'Escuela', badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800' };
      case 'PARTICULAR':
      default:
        return { label: 'Particular', badge: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border border-sky-200 dark:border-sky-800' };
    }
  };

  // Resumen legible de garrafones habituales
  const getPreferredJugsText = (client) => {
    const prefs = client.clientPreferences;
    if (!prefs || !Array.isArray(prefs) || prefs.length === 0) return null;
    return prefs.map(p => {
      const brand = jugBrands.find(b => b.id === p.jugBrandId);
      return brand ? `${p.quantity}x ${brand.name}` : null;
    }).filter(Boolean).join(", ");
  };

  // Métricas para Bento Cards superiores
  const stats = useMemo(() => {
    const total = clients.length;
    let onTime = 0;
    let late = 0;
    let withGPS = 0;
    let companies = 0;

    clients.forEach(c => {
      const st = getConcurrenceStatus(c).status;
      if (st === 'ON_TIME') onTime++;
      if (st === 'LATE') late++;
      if (c.lat && c.lng) withGPS++;
      if (c.clientCategory === 'EMPRESA') companies++;
    });

    return { total, onTime, late, withGPS, companies };
  }, [clients]);

  // Filtrado y ordenamiento dinámico
  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const q = searchTerm.trim().toLowerCase();
      const matchesSearch = !q || (
        client.name?.toLowerCase().includes(q) || 
        client.phone?.includes(q) ||
        client.customId?.toLowerCase().includes(q) ||
        client.street?.toLowerCase().includes(q) ||
        client.neighborhood?.toLowerCase().includes(q)
      );
      
      const matchesStore = !selectedStoreFilter || client.storeId === selectedStoreFilter;
      const matchesCategory = categoryFilter === "TODAS" || client.clientCategory === categoryFilter;
      
      let matchesConcurrence = true;
      if (concurrenceFilter !== "TODOS") {
        const cStatus = getConcurrenceStatus(client).status;
        matchesConcurrence = cStatus === concurrenceFilter;
      }

      return matchesSearch && matchesStore && matchesCategory && matchesConcurrence;
    }).sort((a, b) => {
      if (sortOption === "NAME_ASC") return (a.name || "").localeCompare(b.name || "");
      if (sortOption === "NAME_DESC") return (b.name || "").localeCompare(a.name || "");
      if (sortOption === "RECENT_PURCHASE") {
        const dateA = a.lastPurchaseDate ? new Date(a.lastPurchaseDate).getTime() : 0;
        const dateB = b.lastPurchaseDate ? new Date(b.lastPurchaseDate).getTime() : 0;
        return dateB - dateA;
      }
      if (sortOption === "MORE_URGENT") {
        const stA = getConcurrenceStatus(a);
        const stB = getConcurrenceStatus(b);
        const daysA = stA.days || 0;
        const daysB = stB.days || 0;
        return daysB - daysA;
      }
      return 0;
    });
  }, [clients, searchTerm, selectedStoreFilter, categoryFilter, concurrenceFilter, sortOption]);

  // Registro de compra rápida
  const handleQuickPurchase = async (client) => {
    const result = await Swal.fire({
      title: 'Registrar Compra',
      html: `¿Confirmar que <strong>${client.name}</strong> realizó una compra de garrafones hoy?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, registrar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0ea5e9',
    });

    if (result.isConfirmed) {
      try {
        await updateClient(client.id, {
          name: client.name,
          email: client.email,
          phone: client.phone,
          street: client.street,
          neighborhood: client.neighborhood,
          municipality: client.municipality,
          state: client.state,
          postalCode: client.postalCode,
          references: client.references,
          clientCategory: client.clientCategory,
          storeId: client.storeId,
          purchaseFrequencyDays: client.purchaseFrequencyDays === "" ? null : client.purchaseFrequencyDays,
          clientPreferences: client.clientPreferences || [],
          lat: client.lat,
          lng: client.lng,
          lastPurchaseDate: new Date().toISOString()
        });
        toast.success(`Compra registrada para ${client.name}`);
      } catch (err) {
        Swal.fire('Error', 'No se pudo registrar la compra', 'error');
      }
    }
  };

  // Abrir Modal de Cliente
  const handleOpenModal = (client = null) => {
    setModalActiveTab("GENERAL");
    setIsModalExpanded(false);
    if (client) {
      setEditingClient(client);
      setFormData({
        name: client.name || "",
        email: client.email || "",
        phone: client.phone || "",
        street: client.street || "",
        neighborhood: client.neighborhood || "",
        municipality: client.municipality || "",
        state: client.state || "",
        postalCode: client.postalCode || "",
        references: client.references || "",
        clientCategory: client.clientCategory || "PARTICULAR",
        storeId: client.storeId || "",
        purchaseFrequencyDays: client.purchaseFrequencyDays !== undefined && client.purchaseFrequencyDays !== null ? client.purchaseFrequencyDays : "",
        clientPreferences: Array.isArray(client.clientPreferences) ? client.clientPreferences : [],
        lastPurchaseDate: client.lastPurchaseDate ? new Date(client.lastPurchaseDate).toISOString().split('T')[0] : "",
        lat: client.lat !== undefined && client.lat !== null ? client.lat : "",
        lng: client.lng !== undefined && client.lng !== null ? client.lng : ""
      });
    } else {
      setEditingClient(null);
      setFormData(initialClientState);
    }
    setIsModalOpen(true);
  };

  // Auto-completado de Código Postal con la API
  const handleCPChange = async (cp) => {
    setFormData(prev => ({ ...prev, postalCode: cp }));
    if (cp && cp.length === 5) {
      try {
        const data = await apiFetchPostalCode(cp);
        if (data && data.length > 0) {
          const info = data[0];
          setFormData(prev => ({
            ...prev,
            municipality: info.municipio || prev.municipality,
            state: info.estado || prev.state,
            neighborhood: info.asentamiento || prev.neighborhood
          }));
          toast.success(`Ubicación detectada: ${info.asentamiento || info.municipio}, ${info.estado}`);
        }
      } catch (err) {
        console.warn("No se encontró información para el C.P.", err);
      }
    }
  };

  // Obtener ubicación GPS con el navegador
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      Swal.fire('Error', 'La geolocalización no es soportada por tu navegador.', 'error');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData(prev => ({
          ...prev,
          lat: parseFloat(pos.coords.latitude.toFixed(6)),
          lng: parseFloat(pos.coords.longitude.toFixed(6))
        }));
        setIsLocating(false);
        toast.success("Coordenadas GPS obtenidas con éxito");
      },
      () => {
        setIsLocating(false);
        Swal.fire('Error GPS', 'No se pudo obtener la ubicación actual. Verifica los permisos de tu dispositivo.', 'error');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (editingClient) {
        await updateClient(editingClient.id, formData);
        toast.success('Cliente actualizado con éxito');
      } else {
        await addClient(formData);
        toast.success('Cliente registrado con éxito');
      }
      setIsModalOpen(false);
    } catch (error) {
      Swal.fire('Error', error.message || 'No se pudo guardar el cliente', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (client) => {
    const result = await Swal.fire({
      title: '¿Eliminar cliente?',
      text: `Se eliminará a ${client.name} de la base de datos comercial.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444'
    });

    if (result.isConfirmed) {
      try {
        await deleteClient(client.id);
        toast.success('Cliente eliminado');
      } catch (err) {
        Swal.fire('Error', 'No se pudo eliminar el cliente', 'error');
      }
    }
  };

  // Exportaciones JSON y CSV (preservando formato completo)
  const handleExportJSON = () => {
    const targetClients = exportScope === 'filtered' ? filteredClients : clients;
    if (targetClients.length === 0) {
      Swal.fire('Atención', 'No hay clientes para exportar con el filtro seleccionado.', 'warning');
      return;
    }

    const structuredClients = targetClients.map(c => {
      let prefs = c.clientPreferences;
      if (typeof prefs === 'string') {
        try { prefs = JSON.parse(prefs); } catch (e) { prefs = []; }
      }
      if (!Array.isArray(prefs)) prefs = [];

      return {
        id: c.id,
        customId: c.customId,
        name: c.name,
        phone: c.phone || null,
        email: c.email || null,
        sexo: c.sexo || null,
        clientCategory: c.clientCategory || 'PARTICULAR',
        address: {
          street: c.street || null,
          neighborhood: c.neighborhood || null,
          municipality: c.municipality || null,
          city: c.city || null,
          state: c.state || null,
          postalCode: c.postalCode || null,
          references: c.references || null,
          coordinates: { lat: c.lat || null, lng: c.lng || null }
        },
        store: c.store ? { id: c.store.id, name: c.store.name } : null,
        storeId: c.storeId || null,
        commercial: {
          purchaseFrequencyDays: c.purchaseFrequencyDays || null,
          lastPurchaseDate: c.lastPurchaseDate || null,
          preferredJugsSummary: getPreferredJugsText(c) || null,
          preferences: prefs,
          loyaltyPoints: c.loyaltyPoints || 0
        },
        timestamps: { createdAt: c.createdAt || null, updatedAt: c.updatedAt || null }
      };
    });

    const flatImportData = targetClients.map(c => ({
      id: c.id,
      customId: c.customId,
      name: c.name,
      phone: c.phone || null,
      email: c.email || null,
      sexo: c.sexo || null,
      street: c.street || null,
      neighborhood: c.neighborhood || null,
      municipality: c.municipality || null,
      city: c.city || null,
      state: c.state || null,
      postalCode: c.postalCode || null,
      references: c.references || null,
      lat: c.lat || null,
      lng: c.lng || null,
      clientCategory: c.clientCategory || 'PARTICULAR',
      storeId: c.storeId || null,
      purchaseFrequencyDays: c.purchaseFrequencyDays || null,
      lastPurchaseDate: c.lastPurchaseDate || null,
      preferredJugs: c.preferredJugs || null,
      clientPreferences: c.clientPreferences || [],
      loyaltyPoints: c.loyaltyPoints || 0,
      createdAt: c.createdAt || null,
      updatedAt: c.updatedAt || null
    }));

    const jsonPayload = {
      metadata: {
        exportDate: new Date().toISOString(),
        totalClients: targetClients.length,
        filterScope: exportScope,
        source: 'DarmaxVentas - Gestión de Clientes',
        notes: 'Respaldo preparado para separación en multischema o base de datos independiente.'
      },
      clients: structuredClients,
      prismaDirectImport: flatImportData
    };

    const dateStr = new Date().toISOString().split('T')[0];
    const blob = new Blob([JSON.stringify(jsonPayload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `respaldo_clientes_darmax_${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setIsExportModalOpen(false);
    toast.success(`Se exportaron ${targetClients.length} clientes en JSON`);
  };

  const handleExportCSV = () => {
    const targetClients = exportScope === 'filtered' ? filteredClients : clients;
    if (targetClients.length === 0) {
      Swal.fire('Atención', 'No hay clientes para exportar con el filtro seleccionado.', 'warning');
      return;
    }

    const escapeCSV = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const headers = [
      'ID_Original', 'Codigo_Cliente', 'Nombre', 'Telefono', 'Email', 
      'Categoria', 'Sexo', 'Calle_Numero', 'Colonia', 'Municipio', 
      'Ciudad', 'Estado', 'Codigo_Postal', 'Referencias', 'Latitud', 
      'Longitud', 'ID_Sucursal', 'Nombre_Sucursal', 'Frecuencia_Dias', 
      'Ultima_Compra', 'Preferencias_Garrafones', 'Puntos_Lealtad', 'Fecha_Creacion'
    ];

    const rows = targetClients.map(c => [
      escapeCSV(c.id),
      escapeCSV(c.customId),
      escapeCSV(c.name),
      escapeCSV(c.phone),
      escapeCSV(c.email),
      escapeCSV(c.clientCategory || 'PARTICULAR'),
      escapeCSV(c.sexo),
      escapeCSV(c.street),
      escapeCSV(c.neighborhood),
      escapeCSV(c.municipality),
      escapeCSV(c.city),
      escapeCSV(c.state),
      escapeCSV(c.postalCode),
      escapeCSV(c.references),
      escapeCSV(c.lat),
      escapeCSV(c.lng),
      escapeCSV(c.storeId),
      escapeCSV(c.store?.name),
      escapeCSV(c.purchaseFrequencyDays),
      escapeCSV(c.lastPurchaseDate ? new Date(c.lastPurchaseDate).toISOString().split('T')[0] : ''),
      escapeCSV(getPreferredJugsText(c) || ''),
      escapeCSV(c.loyaltyPoints || 0),
      escapeCSV(c.createdAt ? new Date(c.createdAt).toISOString() : '')
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    link.href = url;
    link.download = `respaldo_clientes_darmax_${dateStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setIsExportModalOpen(false);
    toast.success(`Se exportaron ${targetClients.length} clientes en CSV (Excel)`);
  };

  return (
    <div className="space-y-6">
      {/* 1. Bento Grid: Métricas Comerciales Rápidas (Estilo Sistemas & Marketing) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Clientes */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl p-4 rounded-3xl border border-gray-100 dark:border-gray-700/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Total Clientes</span>
            <span className="p-2 bg-primary/10 text-primary rounded-xl text-xs">
              <FaUsers />
            </span>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black text-gray-900 dark:text-white leading-none">{stats.total}</p>
            <span className="text-[10px] font-bold text-gray-400 mt-1 block">Directorio registrado</span>
          </div>
        </div>

        {/* Al Día */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl p-4 rounded-3xl border border-gray-100 dark:border-gray-700/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Al Día</span>
            <span className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs">
              <FaCheckCircle />
            </span>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 leading-none">{stats.onTime}</p>
            <span className="text-[10px] font-bold text-gray-400 mt-1 block">Frecuencia al corriente</span>
          </div>
        </div>

        {/* Retrasados */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl p-4 rounded-3xl border border-gray-100 dark:border-gray-700/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">Con Retraso</span>
            <span className="p-2 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl text-xs">
              <FaExclamationTriangle />
            </span>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400 leading-none">{stats.late}</p>
            <span className="text-[10px] font-bold text-gray-400 mt-1 block">Requieren seguimiento</span>
          </div>
        </div>

        {/* Empresas */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl p-4 rounded-3xl border border-gray-100 dark:border-gray-700/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Empresas</span>
            <span className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs">
              <FaBuilding />
            </span>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 leading-none">{stats.companies}</p>
            <span className="text-[10px] font-bold text-gray-400 mt-1 block">Cuentas corporativas</span>
          </div>
        </div>

        {/* Con GPS */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl p-4 rounded-3xl border border-gray-100 dark:border-gray-700/80 shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-sky-600 dark:text-sky-400">Con GPS</span>
            <span className="p-2 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 rounded-xl text-xs">
              <FaCrosshairs />
            </span>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black text-sky-600 dark:text-sky-400 leading-none">{stats.withGPS}</p>
            <span className="text-[10px] font-bold text-gray-400 mt-1 block">Listos para entrega</span>
          </div>
        </div>
      </div>

      {/* 2. Barra de Control Unificada: Búsqueda, Filtros y Acciones */}
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl p-4 rounded-3xl border border-gray-100 dark:border-gray-700/80 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Campo de Búsqueda inteligente */}
          <div className="relative flex-1 min-w-0">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
            <input 
              type="text" 
              placeholder="Buscar por nombre, teléfono, código o calle..." 
              className="w-full pl-9 pr-9 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold text-gray-800 dark:text-white outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-gray-400 placeholder:font-normal"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-full text-xs"
                title="Limpiar búsqueda"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filtros desplegables y modo de vista */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filtro por Sucursal */}
            <div 
              onClick={(e) => {
                const sel = e.currentTarget.querySelector('select');
                if (sel && e.target !== sel) {
                  try { sel.showPicker?.(); } catch (err) {}
                  sel.focus();
                }
              }}
              className="relative flex items-center gap-2 bg-gray-50 dark:bg-gray-900 px-3 py-2 rounded-2xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:border-gray-300 dark:hover:border-gray-600 transition-colors flex-1 sm:flex-initial min-w-[140px]"
            >
              <FaStore className="text-gray-400 text-xs pointer-events-none flex-shrink-0" />
              <select
                value={selectedStoreFilter}
                onChange={(e) => setStoreFilter(e.target.value)}
                aria-label="Filtrar por sucursal"
                className="bg-transparent text-xs font-bold text-gray-700 dark:text-gray-200 outline-none cursor-pointer w-full appearance-none pr-5 z-10"
              >
                <option value="" className="dark:bg-gray-800">Todas las sucursales</option>
                {stores.map(store => (
                  <option key={store.id} value={store.id} className="dark:bg-gray-800">{store.name}</option>
                ))}
              </select>
              <FaChevronDown className="text-gray-400 text-[9px] pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 z-0" />
            </div>

            {/* Ordenamiento */}
            <div 
              onClick={(e) => {
                const sel = e.currentTarget.querySelector('select');
                if (sel && e.target !== sel) {
                  try { sel.showPicker?.(); } catch (err) {}
                  sel.focus();
                }
              }}
              className="relative flex items-center gap-2 bg-gray-50 dark:bg-gray-900 px-3 py-2 rounded-2xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:border-gray-300 dark:hover:border-gray-600 transition-colors flex-1 sm:flex-initial min-w-[150px]"
            >
              <FaClock className="text-gray-400 text-xs pointer-events-none flex-shrink-0" />
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                aria-label="Ordenar clientes"
                className="bg-transparent text-xs font-bold text-gray-700 dark:text-gray-200 outline-none cursor-pointer w-full appearance-none pr-5 z-10"
              >
                <option value="NAME_ASC" className="dark:bg-gray-800">Nombre (A - Z)</option>
                <option value="NAME_DESC" className="dark:bg-gray-800">Nombre (Z - A)</option>
                <option value="RECENT_PURCHASE" className="dark:bg-gray-800">Última compra reciente</option>
                <option value="MORE_URGENT" className="dark:bg-gray-800">Mayor retraso primero</option>
              </select>
              <FaChevronDown className="text-gray-400 text-[9px] pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 z-0" />
            </div>

            {/* Selector de Vista: Tarjetas vs Tabla */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-900 p-1 rounded-2xl border border-gray-200/80 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setViewMode("CARDS")}
                className={`p-2 rounded-xl text-xs font-bold transition-all ${
                  viewMode === "CARDS"
                    ? "bg-white dark:bg-gray-800 text-primary shadow-xs"
                    : "text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
                title="Vista en tarjetas"
              >
                <FaThLarge />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("TABLE")}
                className={`p-2 rounded-xl text-xs font-bold transition-all ${
                  viewMode === "TABLE"
                    ? "bg-white dark:bg-gray-800 text-primary shadow-xs"
                    : "text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
                title="Vista en lista detallada"
              >
                <FaThList />
              </button>
            </div>

            {/* Botón de Exportar / Respaldar */}
            <button 
              type="button"
              onClick={() => setIsExportModalOpen(true)} 
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-2xs active:scale-95 touch-manipulation min-h-[38px]"
              title="Respaldar o exportar a Excel/JSON"
            >
              <FaDownload size={11} /> 
              <span className="hidden sm:inline">Respaldar</span>
            </button>

            {/* Botón Nuevo Cliente */}
            <button 
              type="button"
              onClick={() => handleOpenModal()} 
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 rounded-2xl text-xs font-black bg-primary hover:bg-primary-dark active:bg-primary-dark text-white shadow-md shadow-primary/25 transition-all active:scale-95 whitespace-nowrap touch-manipulation min-h-[38px]"
            >
              <FaUserPlus size={12} /> 
              <span>Nuevo Cliente</span>
            </button>
          </div>
        </div>

        {/* Filtros rápidos tipo chips: Categoría y Concurrencia */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100 dark:border-gray-700/60">
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-[10px] font-black uppercase text-gray-400 mr-1 tracking-wider">Tipo:</span>
            {["TODAS", "PARTICULAR", "EMPRESA", "HOSPITAL", "ESCUELA"].map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
                  categoryFilter === cat
                    ? "bg-primary text-white shadow-xs"
                    : "bg-gray-50 dark:bg-gray-900/60 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-200/60 dark:border-gray-700/60"
                }`}
              >
                {cat === "TODAS" ? "Todas" : cat.charAt(0) + cat.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-400">
              {filteredClients.length} de {clients.length} cliente{clients.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Contenedor de Clientes: Vista Tarjetas o Vista Tabla */}
      {filteredClients.length === 0 ? (
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-12 text-center border border-dashed border-gray-200 dark:border-gray-700/80 shadow-xs space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 text-2xl">
            <FaUsers />
          </div>
          <h3 className="text-base font-black text-gray-800 dark:text-white">No se encontraron clientes</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            {searchTerm || categoryFilter !== "TODAS" || selectedStoreFilter
              ? "Prueba ajustando los filtros de búsqueda o sucursal seleccionada."
              : "Comienza registrando tu primer cliente particular o empresa en el sistema."}
          </p>
          {(searchTerm || categoryFilter !== "TODAS" || selectedStoreFilter) && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setCategoryFilter("TODAS");
                setStoreFilter("");
              }}
              className="text-xs font-bold text-primary hover:underline pt-2"
            >
              Restablecer todos los filtros
            </button>
          )}
        </div>
      ) : viewMode === "CARDS" ? (
        /* VISTA TARJETAS (Bento Cards Rediseñadas) */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredClients.map(client => {
            const concurrence = getConcurrenceStatus(client);
            const categoryBadge = getCategoryBadge(client.clientCategory);
            const prefsText = getPreferredJugsText(client);
            const cleanPhone = client.phone ? client.phone.replace(/[^0-9]/g, '') : '';

            return (
              <div 
                key={client.id} 
                className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl p-5 rounded-3xl border border-gray-100 dark:border-gray-700/80 shadow-xs hover:shadow-md hover:border-primary/40 dark:hover:border-primary/40 transition-all group flex flex-col justify-between"
              >
                <div>
                  {/* Cabecera de la tarjeta (sin avatar) */}
                  <div className="flex justify-between items-start gap-2 mb-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span className="text-[10px] font-mono font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/80 px-1.5 py-0.5 rounded-md">
                          #{client.customId}
                        </span>
                        {client.store && (
                          <span className="text-[10px] font-bold text-primary truncate max-w-[130px] bg-primary/5 dark:bg-primary/10 px-1.5 py-0.5 rounded-md">
                            {client.store.name}
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ml-auto sm:ml-0 ${categoryBadge.badge}`}>
                          {categoryBadge.label}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-sm sm:text-base text-gray-900 dark:text-white leading-snug break-words" title={client.name}>
                        {client.name}
                      </h3>
                    </div>
                  </div>

                  {/* Datos de contacto y ubicación */}
                  <div className="space-y-2 py-2 text-xs border-y border-dashed border-gray-100 dark:border-gray-700/60 my-2">
                    {client.phone && (
                      <div className="flex items-center justify-between text-gray-600 dark:text-gray-300 gap-2">
                        <a 
                          href={`tel:${client.phone}`}
                          className="flex items-center gap-2 truncate hover:text-primary transition-colors py-0.5 touch-manipulation active:opacity-75"
                          title="Llamar al cliente"
                        >
                          <FaPhone className="text-gray-400 text-xs shrink-0" />
                          <span className="font-bold tracking-tight">{client.phone}</span>
                        </a>
                        {cleanPhone.length >= 10 && (
                          <a 
                            href={`https://wa.me/52${cleanPhone.slice(-10)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-xl transition-all font-bold text-[11px] active:scale-95 touch-manipulation shrink-0"
                            title="Enviar WhatsApp"
                          >
                            <FaWhatsapp size={13} />
                            <span className="text-[10px] font-black">WhatsApp</span>
                          </a>
                        )}
                      </div>
                    )}

                    {client.email && (
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 truncate">
                        <FaEnvelope className="text-gray-400 text-xs shrink-0" />
                        <span className="truncate">{client.email}</span>
                      </div>
                    )}

                    {/* Dirección y Google Maps */}
                    <div className="flex items-start gap-2 text-gray-500 dark:text-gray-400 pt-0.5">
                      <FaMapMarkerAlt className="text-gray-400 text-xs shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        {client.lat && client.lng ? (
                          <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${client.lat},${client.lng}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-primary hover:underline font-bold inline-flex items-center gap-1 leading-tight text-xs active:opacity-80"
                            title="Ver ubicación en Google Maps"
                          >
                            <span className="line-clamp-2">{client.street || 'Ubicación GPS registrada'}</span>
                            <FaExternalLinkAlt size={9} className="shrink-0 ml-0.5" />
                          </a>
                        ) : (
                          <span className="line-clamp-2 block leading-tight text-xs">{client.street || 'Sin dirección registrada'}</span>
                        )}
                        {client.neighborhood && (
                          <span className="text-[10px] text-gray-400 block truncate mt-0.5">Col. {client.neighborhood}</span>
                        )}
                      </div>
                    </div>

                    {/* Preferencias de garrafón habitual */}
                    {prefsText && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 pt-1">
                        <FaStar className="text-amber-400 text-xs shrink-0" />
                        <span className="text-[11px] truncate">
                          Habitual: <strong className="text-gray-800 dark:text-white font-bold">{prefsText}</strong>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Estado de Concurrencia y Frecuencia */}
                  <div className="pt-1 pb-2">
                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-wider text-gray-400 mb-1">
                      <span>Concurrencia</span>
                      <span>Última Compra</span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${concurrence.badge}`}>
                        {concurrence.text}
                      </span>
                      <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 shrink-0">
                        {client.lastPurchaseDate 
                          ? new Date(client.lastPurchaseDate).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' }) 
                          : 'Nunca'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pie de acciones de la tarjeta */}
                <div className="flex justify-between items-center gap-2 pt-3 border-t border-gray-100 dark:border-gray-700/80 mt-2">
                  <button 
                    type="button"
                    onClick={() => handleQuickPurchase(client)} 
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 text-xs font-black rounded-xl transition-all border border-sky-200/80 dark:border-sky-800/60 uppercase tracking-wider active:scale-95 shadow-2xs touch-manipulation min-h-[38px]"
                    title="Registrar una recarga o compra hoy"
                  >
                    <FaPlus className="text-[10px]" /> 
                    <span>Registrar Compra</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button 
                      type="button"
                      onClick={() => handleOpenModal(client)} 
                      className="p-2 text-gray-400 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700/60 rounded-xl transition-colors active:scale-90 touch-manipulation min-w-[38px] min-h-[38px] flex items-center justify-center"
                      title="Editar cliente"
                    >
                      <FaEdit size={14} />
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleDelete(client)} 
                      className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors active:scale-90 touch-manipulation min-w-[38px] min-h-[38px] flex items-center justify-center"
                      title="Eliminar cliente"
                    >
                      <FaTrash size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* VISTA LISTA / TABLA DETALLADA REDISEÑADA */
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl border border-gray-100 dark:border-gray-700/80 shadow-xs overflow-hidden">
          
          {/* 1. Vista de Lista Compacta para Móviles (md:hidden) */}
          <div className="divide-y divide-gray-100 dark:divide-gray-700/70 md:hidden">
            {filteredClients.map(client => {
              const concurrence = getConcurrenceStatus(client);
              const categoryBadge = getCategoryBadge(client.clientCategory);
              const prefsText = getPreferredJugsText(client);
              const cleanPhone = client.phone ? client.phone.replace(/[^0-9]/g, '') : '';

              return (
                <div key={client.id} className="p-4 hover:bg-gray-50/60 dark:hover:bg-gray-900/40 transition-colors space-y-2.5">
                  {/* Fila 1: Nombre, Código y Categoría */}
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                        <span className="text-[10px] font-mono font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/80 px-1.5 py-0.5 rounded-md">
                          #{client.customId}
                        </span>
                        {client.store && (
                          <span className="text-[10px] font-bold text-primary truncate max-w-[130px] bg-primary/5 dark:bg-primary/10 px-1.5 py-0.5 rounded-md">
                            {client.store.name}
                          </span>
                        )}
                      </div>
                      <h4 className="font-extrabold text-sm text-gray-900 dark:text-white leading-snug break-words">
                        {client.name}
                      </h4>
                    </div>
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider shrink-0 ${categoryBadge.badge}`}>
                      {categoryBadge.label}
                    </span>
                  </div>

                  {/* Fila 2: Teléfono con WhatsApp y Dirección */}
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 gap-2 flex-wrap">
                    {client.phone && (
                      <div className="flex items-center gap-2">
                        <a href={`tel:${client.phone}`} className="font-bold text-gray-700 dark:text-gray-300 hover:text-primary flex items-center gap-1">
                          <FaPhone className="text-gray-400 text-[10px]" />
                          <span>{client.phone}</span>
                        </a>
                        {cleanPhone.length >= 10 && (
                          <a 
                            href={`https://wa.me/52${cleanPhone.slice(-10)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors"
                            title="WhatsApp"
                          >
                            <FaWhatsapp size={13} />
                          </a>
                        )}
                      </div>
                    )}
                    
                    {client.street && (
                      <div className="flex items-center gap-1 text-[11px] truncate max-w-[200px]">
                        <FaMapMarkerAlt className="text-gray-400 text-[10px] shrink-0" />
                        {client.lat && client.lng ? (
                          <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${client.lat},${client.lng}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline truncate"
                          >
                            {client.street}
                          </a>
                        ) : (
                          <span className="truncate">{client.street}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Fila 3: Concurrencia y Pedido Habitual */}
                  <div className="flex items-center justify-between gap-2 text-[11px] pt-0.5">
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black ${concurrence.badge}`}>
                      {concurrence.text}
                    </span>
                    {prefsText && (
                      <span className="text-[10px] text-gray-400 truncate max-w-[160px]">
                        Hab: <strong className="text-gray-700 dark:text-gray-200">{prefsText}</strong>
                      </span>
                    )}
                  </div>

                  {/* Fila 4: Acciones */}
                  <div className="flex items-center justify-between pt-2 border-t border-dashed border-gray-100 dark:border-gray-800">
                    <button
                      type="button"
                      onClick={() => handleQuickPurchase(client)}
                      className="px-3 py-1.5 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 hover:bg-sky-100 rounded-xl text-xs font-black uppercase tracking-wider transition-colors active:scale-95"
                    >
                      + Registrar Compra
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenModal(client)}
                        className="p-2 text-gray-400 hover:text-primary rounded-xl transition-colors active:scale-90"
                        title="Editar cliente"
                      >
                        <FaEdit size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(client)}
                        className="p-2 text-gray-400 hover:text-rose-500 rounded-xl transition-colors active:scale-90"
                        title="Eliminar cliente"
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 2. Vista Tabla Estructurada para Tablets y Escritorio (md:block) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-gray-50/80 dark:bg-gray-900/60 border-b border-gray-100 dark:border-gray-700 text-gray-400 font-black uppercase text-[10px] tracking-wider select-none sticky top-0 backdrop-blur-md">
                <tr>
                  <th className="py-3.5 px-4 font-black">Cliente / Código</th>
                  <th className="py-3.5 px-3 font-black">Categoría</th>
                  <th className="py-3.5 px-3 font-black">Contacto</th>
                  <th className="py-3.5 px-3 font-black">Ubicación / Sucursal</th>
                  <th className="py-3.5 px-3 font-black">Pedido Habitual</th>
                  <th className="py-3.5 px-3 font-black">Concurrencia</th>
                  <th className="py-3.5 px-4 text-right font-black">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/80">
                {filteredClients.map(client => {
                  const concurrence = getConcurrenceStatus(client);
                  const categoryBadge = getCategoryBadge(client.clientCategory);
                  const prefsText = getPreferredJugsText(client);
                  const cleanPhone = client.phone ? client.phone.replace(/[^0-9]/g, '') : '';

                  return (
                    <tr key={client.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-900/40 transition-colors group">
                      {/* Cliente */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="min-w-[160px] max-w-[240px]">
                          <p className="font-extrabold text-sm text-gray-900 dark:text-white leading-tight truncate" title={client.name}>
                            {client.name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] font-mono font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/80 px-1.5 py-0.2 rounded-md">
                              #{client.customId}
                            </span>
                            {client.store && (
                              <span className="text-[10px] font-bold text-primary truncate max-w-[120px]">
                                {client.store.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Categoría */}
                      <td className="py-3.5 px-3 align-middle whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider inline-block ${categoryBadge.badge}`}>
                          {categoryBadge.label}
                        </span>
                      </td>

                      {/* Contacto */}
                      <td className="py-3.5 px-3 align-middle">
                        <div className="min-w-[130px]">
                          {client.phone ? (
                            <div className="flex items-center gap-1.5">
                              <a href={`tel:${client.phone}`} className="font-bold text-gray-700 dark:text-gray-200 hover:text-primary transition-colors">
                                {client.phone}
                              </a>
                              {cleanPhone.length >= 10 && (
                                <a 
                                  href={`https://wa.me/52${cleanPhone.slice(-10)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors"
                                  title="WhatsApp"
                                >
                                  <FaWhatsapp size={13} />
                                </a>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 italic text-[11px]">Sin teléfono</span>
                          )}
                          {client.email && (
                            <p className="text-[10px] text-gray-400 truncate max-w-[150px] mt-0.5" title={client.email}>
                              {client.email}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Ubicación */}
                      <td className="py-3.5 px-3 align-middle">
                        <div className="min-w-[150px] max-w-[200px]">
                          {client.lat && client.lng ? (
                            <a 
                              href={`https://www.google.com/maps/search/?api=1&query=${client.lat},${client.lng}`} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-primary hover:underline font-bold inline-flex items-center gap-1 truncate block leading-tight"
                              title="Abrir en Google Maps"
                            >
                              <span className="truncate">{client.street || 'Ubicación GPS'}</span>
                              <FaExternalLinkAlt size={8} className="shrink-0" />
                            </a>
                          ) : (
                            <p className="truncate text-gray-600 dark:text-gray-300 leading-tight" title={client.street}>
                              {client.street || 'Sin calle'}
                            </p>
                          )}
                          {client.neighborhood && (
                            <span className="text-[10px] text-gray-400 block truncate mt-0.5">
                              Col. {client.neighborhood}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Pedido Habitual */}
                      <td className="py-3.5 px-3 align-middle">
                        <div className="min-w-[120px] max-w-[160px]">
                          {prefsText ? (
                            <span className="text-gray-700 dark:text-gray-300 font-bold truncate block" title={prefsText}>
                              {prefsText}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic text-[11px]">No configurado</span>
                          )}
                        </div>
                      </td>

                      {/* Concurrencia */}
                      <td className="py-3.5 px-3 align-middle whitespace-nowrap">
                        <div className="space-y-0.5">
                          <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black inline-block ${concurrence.badge}`}>
                            {concurrence.text}
                          </span>
                          <p className="text-[9px] font-bold text-gray-400">
                            {client.lastPurchaseDate 
                              ? `Última: ${new Date(client.lastPurchaseDate).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })}` 
                              : 'Sin compras'}
                          </p>
                        </div>
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-4 text-right align-middle whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleQuickPurchase(client)}
                            className="px-2.5 py-1.5 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 border border-sky-200/80 dark:border-sky-800/60"
                            title="Registrar compra rápida"
                          >
                            + Compra
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleOpenModal(client)} 
                            className="p-1.5 text-gray-400 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700/60 rounded-xl transition-colors active:scale-90"
                            title="Editar cliente"
                          >
                            <FaEdit size={13} />
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleDelete(client)} 
                            className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors active:scale-90"
                            title="Eliminar cliente"
                          >
                            <FaTrash size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Modal para Crear / Editar Cliente (Portal + MobileSheetHeader) */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div 
            className={`bg-white dark:bg-gray-800 rounded-t-[2.5rem] sm:rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700 flex flex-col transition-all duration-300 ${
              isModalExpanded ? 'h-[95vh]' : 'max-h-[90vh]'
            }`}
          >
            {/* Header móvil deslizante */}
            <MobileSheetHeader 
              isExpanded={isModalExpanded} 
              onToggleExpand={() => setIsModalExpanded(!isModalExpanded)} 
              onClose={() => setIsModalOpen(false)} 
            />

            {/* Cabecera del Modal */}
            <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-lg font-black">
                  <FaUserPlus />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">
                    {editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
                  </h2>
                  <p className="text-[11px] text-gray-400 font-medium">
                    {editingClient ? `Actualizando datos de #${editingClient.customId}` : 'Completa la ficha técnica comercial'}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)} 
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Cerrar ventana"
              >
                <FaTimes size={16} />
              </button>
            </div>

            {/* Pestañas internas del Formulario */}
            <div className="flex border-b border-gray-100 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-900/20 px-4 pt-2 gap-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => setModalActiveTab("GENERAL")}
                className={`py-2 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                  modalActiveTab === "GENERAL"
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                }`}
              >
                1. Datos Generales
              </button>
              <button
                type="button"
                onClick={() => setModalActiveTab("UBICACION")}
                className={`py-2 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                  modalActiveTab === "UBICACION"
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                }`}
              >
                2. Ubicación & GPS
              </button>
              <button
                type="button"
                onClick={() => setModalActiveTab("PREFERENCIAS")}
                className={`py-2 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                  modalActiveTab === "PREFERENCIAS"
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                }`}
              >
                3. Garrafones & Frecuencia
              </button>
            </div>

            {/* Cuerpo del Formulario */}
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
              {modalActiveTab === "GENERAL" && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                      Nombre Completo o Razón Social *
                    </label>
                    <input 
                      name="name" 
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required 
                      placeholder="Ej. Juan Pérez o Purificadora La Esperanza"
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 font-bold text-xs text-gray-800 dark:text-white outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                        Teléfono Móvil
                      </label>
                      <input 
                        name="phone" 
                        value={formData.phone} 
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        placeholder="10 dígitos para WhatsApp"
                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 font-bold text-xs text-gray-800 dark:text-white outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                        Correo Electrónico (Opcional)
                      </label>
                      <input 
                        type="email"
                        name="email" 
                        value={formData.email} 
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="cliente@ejemplo.com"
                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 font-bold text-xs text-gray-800 dark:text-white outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                        Categoría de Cliente
                      </label>
                      <select 
                        name="clientCategory" 
                        value={formData.clientCategory} 
                        onChange={(e) => setFormData({...formData, clientCategory: e.target.value})} 
                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 font-bold text-xs text-gray-800 dark:text-white outline-none focus:border-primary/40 transition-all"
                      >
                        <option value="PARTICULAR">Particular (Hogar)</option>
                        <option value="EMPRESA">Empresa / Negocio</option>
                        <option value="HOSPITAL">Hospital / Clínica</option>
                        <option value="ESCUELA">Escuela / Colegio</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                        Sucursal Asignada
                      </label>
                      <select 
                        name="storeId" 
                        value={formData.storeId} 
                        onChange={(e) => setFormData({...formData, storeId: e.target.value})} 
                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 font-bold text-xs text-gray-800 dark:text-white outline-none focus:border-primary/40 transition-all"
                      >
                        <option value="">Global / Todas</option>
                        {stores.map(store => (
                          <option key={store.id} value={store.id}>{store.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {modalActiveTab === "UBICACION" && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                      Calle, Número Exterior e Interior
                    </label>
                    <input 
                      name="street" 
                      value={formData.street} 
                      onChange={(e) => setFormData({...formData, street: e.target.value})}
                      placeholder="Ej. Av. Hidalgo #123 Int. 4"
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 font-bold text-xs text-gray-800 dark:text-white outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                        Código Postal (Autodetectar)
                      </label>
                      <input 
                        name="postalCode" 
                        value={formData.postalCode} 
                        onChange={(e) => handleCPChange(e.target.value)}
                        placeholder="Ej. 72000"
                        maxLength={5}
                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 font-bold text-xs text-gray-800 dark:text-white outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                        Colonia / Asentamiento
                      </label>
                      <input 
                        name="neighborhood" 
                        value={formData.neighborhood} 
                        onChange={(e) => setFormData({...formData, neighborhood: e.target.value})} 
                        placeholder="Ej. Centro"
                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 font-bold text-xs text-gray-800 dark:text-white outline-none focus:border-primary/40 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                        Municipio / Alcaldía
                      </label>
                      <input 
                        name="municipality" 
                        value={formData.municipality} 
                        onChange={(e) => setFormData({...formData, municipality: e.target.value})} 
                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 font-bold text-xs text-gray-800 dark:text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                        Estado
                      </label>
                      <input 
                        name="state" 
                        value={formData.state} 
                        onChange={(e) => setFormData({...formData, state: e.target.value})} 
                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 font-bold text-xs text-gray-800 dark:text-white outline-none"
                      />
                    </div>
                  </div>

                  {/* Coordenadas GPS con detector rápido */}
                  <div className="p-3.5 rounded-2xl bg-gray-50/80 dark:bg-gray-900/60 border border-gray-200/80 dark:border-gray-700/80 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                        <FaCrosshairs className="text-primary" /> Coordenadas GPS
                      </span>
                      <button
                        type="button"
                        onClick={handleGetLocation}
                        disabled={isLocating}
                        className="text-[10px] font-black uppercase text-primary hover:underline flex items-center gap-1 disabled:opacity-50"
                      >
                        {isLocating ? "Detectando GPS..." : "📍 Usar mi ubicación actual"}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <input 
                          type="number"
                          step="any"
                          name="lat" 
                          value={formData.lat} 
                          onChange={(e) => setFormData({...formData, lat: e.target.value === '' ? '' : parseFloat(e.target.value)})} 
                          className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 font-bold text-xs outline-none" 
                          placeholder="Latitud (ej. 19.04)"
                        />
                      </div>
                      <div>
                        <input 
                          type="number"
                          step="any"
                          name="lng" 
                          value={formData.lng} 
                          onChange={(e) => setFormData({...formData, lng: e.target.value === '' ? '' : parseFloat(e.target.value)})} 
                          className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 font-bold text-xs outline-none" 
                          placeholder="Longitud (ej. -98.20)"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {modalActiveTab === "PREFERENCIAS" && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                        Frecuencia Habitual (Días)
                      </label>
                      <input 
                        type="number"
                        name="purchaseFrequencyDays"
                        value={formData.purchaseFrequencyDays}
                        onChange={(e) => setFormData({...formData, purchaseFrequencyDays: e.target.value === '' ? '' : parseInt(e.target.value)})}
                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 font-bold text-xs text-gray-800 dark:text-white outline-none"
                        placeholder="Ej. cada 7 días"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                        Fecha Última Compra
                      </label>
                      <input 
                        type="date"
                        name="lastPurchaseDate"
                        value={formData.lastPurchaseDate}
                        onChange={(e) => setFormData({...formData, lastPurchaseDate: e.target.value})}
                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 font-bold text-xs text-gray-800 dark:text-white outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                      Garrafones Habituales por Pedido
                    </label>
                    {jugBrands.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto p-2 border border-gray-100 dark:border-gray-700 rounded-2xl custom-scrollbar bg-gray-50/50 dark:bg-gray-900/50">
                        {jugBrands.map(brand => {
                          const currentPref = formData.clientPreferences?.find(p => p.jugBrandId === brand.id);
                          const currentQty = currentPref ? currentPref.quantity : 0;
                          
                          return (
                            <div key={brand.id} className="flex justify-between items-center p-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200/80 dark:border-gray-700 shadow-2xs">
                              <span className="text-xs font-bold text-gray-700 dark:text-gray-200 truncate pr-2" title={brand.name}>
                                {brand.name}
                              </span>
                              <div className="flex items-center gap-2">
                                <button 
                                  type="button"
                                  onClick={() => {
                                    const updated = [...(formData.clientPreferences || [])];
                                    const idx = updated.findIndex(p => p.jugBrandId === brand.id);
                                    if (idx !== -1) {
                                      if (updated[idx].quantity > 1) {
                                        updated[idx].quantity -= 1;
                                      } else {
                                        updated.splice(idx, 1);
                                      }
                                    }
                                    setFormData({...formData, clientPreferences: updated});
                                  }}
                                  className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-700 text-xs font-black text-gray-600 dark:text-gray-300 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-95 transition-all"
                                >
                                  -
                                </button>
                                <span className="text-xs font-black text-gray-900 dark:text-white w-4 text-center">
                                  {currentQty}
                                </span>
                                <button 
                                  type="button"
                                  onClick={() => {
                                    const updated = [...(formData.clientPreferences || [])];
                                    const idx = updated.findIndex(p => p.jugBrandId === brand.id);
                                    if (idx !== -1) {
                                      updated[idx].quantity += 1;
                                    } else {
                                      updated.push({ jugBrandId: brand.id, quantity: 1 });
                                    }
                                    setFormData({...formData, clientPreferences: updated});
                                  }}
                                  className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-700 text-xs font-black text-gray-600 dark:text-gray-300 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-95 transition-all"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">No hay marcas de garrafón configuradas en el catálogo.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Botones de acción */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold rounded-2xl text-xs uppercase tracking-wider hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-primary hover:bg-primary-dark text-white font-black rounded-2xl text-xs uppercase tracking-wider shadow-md shadow-primary/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  {isSubmitting ? "Guardando..." : (editingClient ? "Guardar Cambios" : "Crear Cliente")}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* 5. Modal de Exportación y Respaldo de Clientes */}
      {isExportModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-t-[2.5rem] sm:rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
            {/* Header móvil */}
            <MobileSheetHeader 
              isExpanded={false} 
              onToggleExpand={() => {}} 
              onClose={() => setIsExportModalOpen(false)} 
              canExpand={false} 
            />

            <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gradient-to-r from-emerald-500/10 to-teal-500/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-lg">
                  <FaDatabase />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-gray-800 dark:text-white uppercase tracking-tight">
                    Respaldar Clientes
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Exporta datos para Excel, respaldo o migración
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsExportModalOpen(false)} 
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <FaTimes size={16} />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-5">
              {/* Selector de Alcance */}
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                  Selecciona los registros a exportar
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setExportScope("all")}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      exportScope === "all"
                        ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-black text-gray-800 dark:text-white">Todos</span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                        {clients.length}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-tight">Directorio completo</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExportScope("filtered")}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      exportScope === "filtered"
                        ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-black text-gray-800 dark:text-white">Filtrados</span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                        {filteredClients.length}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-tight">Por búsqueda o filtros</p>
                  </button>
                </div>
              </div>

              {/* Botones de Descarga */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="w-full flex items-center justify-between p-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black transition-all shadow-md hover:shadow-lg active:scale-[0.99] group"
                >
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-lg">
                      <FaFileCsv />
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wider font-black">Descargar Excel (CSV)</div>
                      <div className="text-[11px] font-normal text-emerald-100">
                        Compatible con Microsoft Excel, Google Sheets y UTF-8
                      </div>
                    </div>
                  </div>
                  <FaDownload className="text-emerald-100 group-hover:translate-y-0.5 transition-transform" />
                </button>

                <button
                  type="button"
                  onClick={handleExportJSON}
                  className="w-full flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-2xl font-black transition-all active:scale-[0.99] group"
                >
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-lg text-primary">
                      <FaFileCode />
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wider font-black">Descargar JSON Completo</div>
                      <div className="text-[11px] font-normal text-gray-400">
                        Ideal para copias de seguridad de BD o migración multischema
                      </div>
                    </div>
                  </div>
                  <FaDownload className="text-gray-400 group-hover:translate-y-0.5 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

const Usuarios = () => {
  const { state } = useGestion();
  const { stores = [] } = state;
  const [storeFilter, setStoreFilter] = useState("");

  return (
    <div className="animate-fade-in space-y-5 pb-16">
      {/* Bento Card Header de Gestión de Clientes */}
      <div className="p-5 sm:p-6 lg:p-7 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-xs border border-gray-100 dark:border-gray-700/80 mb-5 sm:mb-6 transition-all">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 dark:text-white">
              Gestión de Clientes
            </h1>
            <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
              Directorio comercial de clientes particulares, empresas y programación de pedidos
            </p>
          </div>
        </div>
      </div>

      <ManageClients selectedStoreFilter={storeFilter} setStoreFilter={setStoreFilter} />
    </div>
  );
};

export default Usuarios;
