import { useState, useEffect } from "react";
import { useGestion } from "./context/GestionContext";
import { useAuth } from "../../context/AuthContext";
import apiClient, { fetchPostalCodeData as apiFetchPostalCode } from "@/api/apiClient";
import Swal from 'sweetalert2';
import { FaUserPlus, FaSearch, FaFilter, FaMapMarkerAlt, FaEnvelope, FaPhone, FaStar, FaStore, FaEdit, FaTrash, FaTimes, FaPlus, FaCalendarAlt } from 'react-icons/fa';

// Componente para gestionar Clientes (Simplificado)
const ManageClients = ({ selectedStoreFilter }) => {
  const { state, addClient, updateClient, deleteClient } = useGestion();
  const { users, stores, jugBrands = [] } = state;
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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

  // Filtrar solo usuarios que son realmente CLIENTES (usando el nuevo IdentityType)
  const clients = users.filter(u => u.type === 'CLIENTE' || u.customId?.startsWith('CLI-'));

  const filteredClients = clients.filter(client => {
    const matchesSearch = (client.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          client.phone?.includes(searchTerm) ||
                          client.customId?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStore = !selectedStoreFilter || client.storeId === selectedStoreFilter;
    
    return matchesSearch && matchesStore;
  });

  const getConcurrenceStatus = (client) => {
    if (!client.lastPurchaseDate) return { text: "Sin compras registradas", color: "text-gray-400 dark:text-gray-500", days: null };
    const freq = client.purchaseFrequencyDays;
    if (freq === undefined || freq === null || freq === "" || freq === 0) {
      return { text: "Frecuencia no definida", color: "text-gray-400 dark:text-gray-500", days: null };
    }
    const lastDate = new Date(client.lastPurchaseDate);
    const diffTime = Math.abs(new Date() - lastDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > freq) {
      return { text: `Retrasado (${diffDays} días vs ${freq} esp.)`, color: "text-red-500 font-black", isLate: true, days: diffDays };
    }
    return { text: `Al día (hace ${diffDays} días, esp. cada ${freq})`, color: "text-green-600 dark:text-green-400 font-bold", isLate: false, days: diffDays };
  };

  const getPreferredJugsText = (client) => {
    const prefs = client.clientPreferences;
    if (!prefs || !Array.isArray(prefs) || prefs.length === 0) return null;
    return prefs.map(p => {
      const brand = jugBrands.find(b => b.id === p.jugBrandId);
      return brand ? `${p.quantity}x ${brand.name}` : null;
    }).filter(Boolean).join(", ");
  };

  const handleQuickPurchase = async (client) => {
    const result = await Swal.fire({
      title: 'Registrar Compra',
      text: `¿Confirmar que ${client.name} realizó una compra de garrafones hoy?`,
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
        Swal.fire('Registrada', 'Compra registrada con éxito', 'success');
      } catch (err) {
        Swal.fire('Error', 'No se pudo registrar la compra', 'error');
      }
    }
  };

  const handleOpenModal = (client = null) => {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (editingClient) {
        await updateClient(editingClient.id, formData);
        Swal.fire('Actualizado', 'Cliente actualizado con éxito', 'success');
      } else {
        await addClient(formData);
        Swal.fire('Creado', 'Cliente registrado con éxito', 'success');
      }
      setIsModalOpen(false);
    } catch (error) {
      Swal.fire('Error', error.message || 'No se pudo guardar el cliente', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: '¿Eliminar cliente?',
      text: "Esta acción no se puede deshacer.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      await deleteClient(id);
      Swal.fire('Eliminado', 'Cliente eliminado', 'success');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar cliente por nombre, teléfono o ID..." 
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2">
          <FaUserPlus /> Nuevo Cliente
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map(client => (
          <div key={client.id} className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-black">
                  {client.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 dark:text-white leading-tight">{client.name}</h3>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">#{client.customId}</span>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                client.clientCategory === 'EMPRESA' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
              }`}>
                {client.clientCategory}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <FaPhone className="text-gray-400" /> {client.phone || 'Sin teléfono'}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <FaEnvelope className="text-gray-400" /> {client.email || 'Sin correo'}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 truncate">
                <FaMapMarkerAlt className="text-gray-400 shrink-0" />
                {client.lat && client.lng ? (
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${client.lat},${client.lng}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-primary hover:underline font-bold"
                    title="Ver ubicación en Google Maps"
                  >
                    {client.street}, {client.neighborhood}
                  </a>
                ) : (
                  <span>{client.street || 'Sin calle'}, {client.neighborhood || 'sin col.'}</span>
                )}
              </div>
              {client.store && (
                <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase">
                  <FaStore /> {client.store.name}
                </div>
              )}
              {getPreferredJugsText(client) && (
                <div className="flex items-center gap-2 text-xs text-gray-500 pt-0.5">
                  <FaStar className="text-amber-400 text-xs flex-shrink-0" />
                  <span className="truncate" title={getPreferredJugsText(client)}>
                    Pref: <strong className="text-gray-700 dark:text-gray-300 font-bold">{getPreferredJugsText(client)}</strong>
                  </span>
                </div>
              )}
              
              {/* Sección de Concurrencia */}
              <div className="pt-2 mt-2 border-t border-dashed border-gray-100 dark:border-gray-700 flex flex-col gap-1">
                <div className="flex justify-between items-center text-[9px] text-gray-400 font-black uppercase tracking-wider">
                  <span>Concurrencia</span>
                  <span>Última Compra</span>
                </div>
                <div className="flex justify-between items-start gap-2">
                  <span className={`text-[11px] ${getConcurrenceStatus(client).color}`}>
                    {getConcurrenceStatus(client).text}
                  </span>
                  <span className="text-[11px] font-bold text-gray-600 dark:text-gray-400 text-right flex-shrink-0">
                    {client.lastPurchaseDate ? new Date(client.lastPurchaseDate).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Nunca'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center gap-2 border-t border-gray-50 dark:border-gray-700 pt-3">
              <button 
                onClick={() => handleQuickPurchase(client)} 
                className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-600 dark:text-sky-400 text-xs font-black rounded-xl transition-all border border-sky-100 dark:border-sky-900/40 uppercase tracking-wider"
              >
                <FaPlus className="text-[9px]" /> Compra
              </button>
              <div className="flex gap-1">
                <button onClick={() => handleOpenModal(client)} className="p-2 text-gray-400 hover:text-primary transition-colors" title="Editar cliente">
                  <FaEdit />
                </button>
                <button onClick={() => handleDelete(client.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors" title="Eliminar cliente">
                  <FaTrash />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal para Clientes */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-lg shadow-xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-black text-gray-800 dark:text-white uppercase tracking-tight">
                {editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                <FaTimes size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-full">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Nombre Completo</label>
                  <input 
                    name="name" 
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required 
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-2.5 font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Teléfono</label>
                  <input 
                    name="phone" 
                    value={formData.phone} 
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-2.5 font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Correo (Opcional)</label>
                  <input 
                    name="email" 
                    value={formData.email} 
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-2.5 font-bold"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-50 dark:border-gray-700">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Calle y Número</label>
                <input 
                  name="street" 
                  value={formData.street} 
                  onChange={(e) => setFormData({...formData, street: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-2.5 font-bold mb-3"
                />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Colonia</label>
                    <input name="neighborhood" value={formData.neighborhood} onChange={(e) => setFormData({...formData, neighborhood: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-2.5 font-bold" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Código Postal</label>
                    <input name="postalCode" value={formData.postalCode} onChange={(e) => setFormData({...formData, postalCode: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-2.5 font-bold" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Latitud</label>
                    <input 
                      type="number"
                      step="any"
                      name="lat" 
                      value={formData.lat} 
                      onChange={(e) => setFormData({...formData, lat: e.target.value === '' ? '' : parseFloat(e.target.value)})} 
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-2.5 font-bold" 
                      placeholder="Ej. 19.4326"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Longitud</label>
                    <input 
                      type="number"
                      step="any"
                      name="lng" 
                      value={formData.lng} 
                      onChange={(e) => setFormData({...formData, lng: e.target.value === '' ? '' : parseFloat(e.target.value)})} 
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-2.5 font-bold" 
                      placeholder="Ej. -99.1332"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Categoría</label>
                  <select name="clientCategory" value={formData.clientCategory} onChange={(e) => setFormData({...formData, clientCategory: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-2.5 font-bold">
                    <option value="PARTICULAR">PARTICULAR</option>
                    <option value="EMPRESA">EMPRESA</option>
                    <option value="HOSPITAL">HOSPITAL</option>
                    <option value="ESCUELA">ESCUELA</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Sucursal Asignada</label>
                  <select name="storeId" value={formData.storeId} onChange={(e) => setFormData({...formData, storeId: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-2.5 font-bold">
                    <option value="">Ninguna (Global)</option>
                    {stores.map(store => (
                      <option key={store.id} value={store.id}>{store.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-50 dark:border-gray-700 space-y-4">
                <h4 className="text-xs font-black text-gray-800 dark:text-white uppercase tracking-wider">Concurrencia y Preferencias</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                      Frecuencia Compra (Días)
                    </label>
                    <input 
                      type="number"
                      name="purchaseFrequencyDays"
                      value={formData.purchaseFrequencyDays}
                      onChange={(e) => setFormData({...formData, purchaseFrequencyDays: e.target.value === '' ? '' : parseInt(e.target.value)})}
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-2.5 font-bold"
                      placeholder="Sin definir"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                      Última Compra (Informativo)
                    </label>
                    <input 
                      type="date"
                      name="lastPurchaseDate"
                      value={formData.lastPurchaseDate}
                      onChange={(e) => setFormData({...formData, lastPurchaseDate: e.target.value})}
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-2.5 font-bold text-gray-500"
                    />
                  </div>
                </div>

                {/* Preferencias de múltiples garrafones con cantidades */}
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                    Pedido Habitual (Preferencias de Garrafones)
                  </label>
                  {jugBrands.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto p-2 border border-gray-100 dark:border-gray-700 rounded-2xl custom-scrollbar bg-gray-50/50 dark:bg-gray-900/50">
                      {jugBrands.map(brand => {
                        const currentPref = formData.clientPreferences?.find(p => p.jugBrandId === brand.id);
                        const currentQty = currentPref ? currentPref.quantity : 0;
                        
                        return (
                          <div key={brand.id} className="flex justify-between items-center p-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate pr-2" title={brand.name}>
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
                                className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-gray-700 text-xs font-black text-gray-600 dark:text-gray-400 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                              >
                                -
                              </button>
                              <span className="text-xs font-black text-gray-800 dark:text-white w-4 text-center">{currentQty}</span>
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
                                className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-gray-700 text-xs font-black text-gray-600 dark:text-gray-400 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">No hay marcas de garrafón configuradas.</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-black rounded-xl uppercase text-xs tracking-widest disabled:opacity-50 transition-opacity"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-primary text-white font-black rounded-xl uppercase text-xs tracking-widest flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Guardando...
                    </>
                  ) : (
                    "Guardar"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const Usuarios = () => {
  const { state } = useGestion();
  const { stores } = state;
  const [storeFilter, setStoreFilter] = useState("");

  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-800 dark:text-white flex items-center gap-3 uppercase tracking-tighter">
            <span className="p-2 bg-primary/10 text-primary rounded-xl">
              <FaStar />
            </span>
            Gestión de Clientes
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Administra tu base de datos de clientes particulares y empresas.</p>
        </div>

        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-1.5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <FaFilter className="ml-2 text-gray-400 text-sm" />
          <select 
            value={storeFilter} 
            onChange={(e) => setStoreFilter(e.target.value)}
            className="bg-transparent text-xs font-bold text-gray-600 dark:text-gray-300 outline-none border-none pr-8 cursor-pointer"
          >
            <option value="">Todas las sucursales</option>
            {stores.map(store => (
              <option key={store.id} value={store.id}>{store.name}</option>
            ))}
          </select>
        </div>
      </div>

      <ManageClients selectedStoreFilter={storeFilter} />
    </div>
  );
};

export default Usuarios;
