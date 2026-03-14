import { useState, useEffect } from "react";
import { useGestion } from "./context/GestionContext";
import { useAuth } from "../../context/AuthContext";
import apiClient, { fetchPostalCodeData as apiFetchPostalCode } from "@/api/apiClient";
import Swal from 'sweetalert2';
import { FaUserPlus, FaSearch, FaFilter, FaMapMarkerAlt, FaEnvelope, FaPhone, FaStar, FaStore, FaEdit, FaTrash, FaTimes } from 'react-icons/fa';

// Componente para gestionar Clientes (Simplificado)
const ManageClients = ({ selectedStoreFilter }) => {
  const { state, addClient, updateClient, deleteClient } = useGestion();
  const { users, stores } = state;
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  
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
    storeId: ""
  };

  const [formData, setFormData] = useState(initialClientState);

  // Filtrar solo usuarios con rol CLIENTE
  const clients = users.filter(u => u.role === 'CLIENTE');

  const filteredClients = clients.filter(client => {
    const matchesSearch = (client.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          client.phone?.includes(searchTerm) ||
                          client.customId?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStore = !selectedStoreFilter || client.storeId === selectedStoreFilter;
    
    return matchesSearch && matchesStore;
  });

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
        storeId: client.storeId || ""
      });
    } else {
      setEditingClient(null);
      setFormData(initialClientState);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      Swal.fire('Error', 'No se pudo guardar el cliente', 'error');
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
                <FaMapMarkerAlt className="text-gray-400 shrink-0" /> {client.street}, {client.neighborhood}
              </div>
              {client.store && (
                <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase">
                  <FaStore /> {client.store.name}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-gray-50 dark:border-gray-700 pt-3">
              <button onClick={() => handleOpenModal(client)} className="p-2 text-gray-400 hover:text-primary transition-colors">
                <FaEdit />
              </button>
              <button onClick={() => handleDelete(client.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                <FaTrash />
              </button>
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

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-black rounded-xl uppercase text-xs tracking-widest">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-primary text-white font-black rounded-xl uppercase text-xs tracking-widest">Guardar</button>
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
