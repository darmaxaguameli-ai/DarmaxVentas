import { useState, useEffect } from "react";
import { useGestion } from "./context/GestionContext";
import { useAuth } from "../../context/AuthContext";
import apiClient, { fetchPostalCodeData as apiFetchPostalCode } from "../../api/apiClient";
import Swal from 'sweetalert2';

// ====================================================================
// Reusable Password Input Component
// ====================================================================
const PasswordInput = (props) => {
    const [showPassword, setShowPassword] = useState(false);
  
    return (
      <div className="relative flex w-full items-center">
        <input
          type={showPassword ? "text" : "password"}
          {...props}
          className="input-style pr-10"
        />
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute right-3 text-gray-500 dark:text-gray-400"
          aria-label="Toggle password visibility"
        >
          <span className="material-symbols-outlined">
            {showPassword ? "visibility_off" : "visibility"}
          </span>
        </button>
      </div>
    );
};

// ====================================================================
// Modal for Client Management
// ====================================================================
const ClientUserModal = ({ onClose, userToEdit, onSave }) => {
  const { state } = useGestion();
  const { stores } = state;
  const initialUserState = { 
      name: "", email: "", password: "", phone: "", sexo: "",
      street: "", neighborhood: "", municipality: "", state: "", city: "", postalCode: "", references: "",
      role: "CLIENTE", storeId: "" 
  };
  
  const [user, setUser] = useState(() => {
      if (userToEdit) {
          let defaultMuni = userToEdit.municipality || "";
          let defaultState = userToEdit.state || "";
          if (!defaultMuni && !defaultState && userToEdit.city) {
             const parts = userToEdit.city.split(', ');
             defaultMuni = parts[0] || "";
             defaultState = parts[1] || "";
          }
          return { ...userToEdit, password: "", municipality: defaultMuni, state: defaultState };
      }
      return initialUserState;
  });

  const [colonias, setColonias] = useState([]);
  const [postalLoading, setPostalLoading] = useState(false);

  // DIPOMEX Logic
  useEffect(() => {
    if (user.postalCode && user.postalCode.length === 5) {
      setPostalLoading(true);
      setColonias([]);
      
      const fetchPostal = async () => {
        try {
            const data = await apiFetchPostalCode(user.postalCode);
            if (!data.error && data.codigo_postal) {
                const { municipio, estado, colonias: cols } = data.codigo_postal;
                setUser(prev => ({
                    ...prev,
                    municipality: municipio,
                    state: estado,
                    city: `${municipio}, ${estado}`,
                    neighborhood: cols.length === 1 ? cols[0] : prev.neighborhood
                }));
                setColonias(cols);
            }
        } catch (e) {
            console.error("Error fetching CP", e);
        } finally {
            setPostalLoading(false);
        }
      };
      fetchPostal();
    } else if (user.postalCode?.length < 5) {
        setColonias([]);
    }
  }, [user.postalCode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const userData = { ...user, role: "CLIENTE" };
    if (isEditing && !userData.password) delete userData.password;
    
    Object.keys(userData).forEach(key => { if (userData[key] === '') userData[key] = null; });
    
    userData.city = `${userData.municipality || ''}, ${userData.state || ''}`;
    
    onSave(userData);
    onClose();
  };

  const isEditing = !!userToEdit;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6 text-[#111418] dark:text-white">{isEditing ? "Editar Cliente" : "Agregar Nuevo Cliente"}</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Datos Personales */}
          <div className="space-y-4">
              <h3 className="text-sm font-bold text-primary border-b pb-1">Datos Personales</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="label-style">Nombre Completo</label><input name="name" type="text" value={user.name || ""} onChange={handleChange} required className="input-style" /></div>
                <div><label className="label-style">Sucursal Preferida</label>
                    <select name="storeId" value={user.storeId || ""} onChange={handleChange} className="input-style">
                    <option value="">Ninguna / Global</option>
                    {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="label-style">Email</label><input name="email" type="email" value={user.email || ""} onChange={handleChange} className="input-style" /></div>
                <div className="grid grid-cols-2 gap-4">
                    <div><label className="label-style">Teléfono</label><input name="phone" type="tel" value={user.phone || ""} onChange={handleChange} className="input-style" /></div>
                    <div>
                        <label className="label-style">Sexo</label>
                        <select name="sexo" value={user.sexo || ""} onChange={handleChange} className="input-style">
                            <option value="">Selecciona...</option>
                            <option value="HOMBRE">Hombre</option>
                            <option value="MUJER">Mujer</option>
                            <option value="OTRO">Prefiero no decirlo</option>
                        </select>
                    </div>
                </div>
              </div>
              {!isEditing && (<div><label className="label-style">Contraseña</label><PasswordInput name="password" value={user.password || ''} onChange={handleChange} required className="input-style" /></div>)}
          </div>

          {/* Dirección */}
          <div className="space-y-4">
              <h3 className="text-sm font-bold text-primary border-b pb-1">Dirección de Entrega</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1">
                      <label className="label-style">Código Postal</label>
                      <input name="postalCode" type="text" value={user.postalCode || ""} onChange={handleChange} maxLength="5" className="input-style" placeholder="00000" />
                      {postalLoading && <span className="text-xs text-primary animate-pulse">Buscando...</span>}
                  </div>
                  <div className="md:col-span-2">
                      <label className="label-style">Calle y Número</label>
                      <input name="street" type="text" value={user.street || ""} onChange={handleChange} className="input-style" />
                  </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                      <label className="label-style">Colonia</label>
                      {colonias.length > 0 ? (
                          <select name="neighborhood" value={user.neighborhood || ""} onChange={handleChange} className="input-style">
                              <option value="">Selecciona...</option>
                              {colonias.map((col, idx) => <option key={`${idx}-${col}`} value={col}>{col}</option>)}
                          </select>
                      ) : (
                          <input name="neighborhood" type="text" value={user.neighborhood || ""} onChange={handleChange} className="input-style" />
                      )}
                  </div>
                  <div><label className="label-style">Municipio</label><input name="municipality" type="text" value={user.municipality || ""} readOnly className="input-style bg-gray-100 dark:bg-gray-700" /></div>
                  <div><label className="label-style">Estado</label><input name="state" type="text" value={user.state || ""} readOnly className="input-style bg-gray-100 dark:bg-gray-700" /></div>
              </div>
              
              <div>
                  <label className="label-style">Referencias</label>
                  <textarea name="references" value={user.references || ""} onChange={handleChange} rows="2" className="input-style resize-none" />
              </div>
          </div>

          <div className="flex justify-end gap-4 pt-4"><button type="button" onClick={onClose} className="btn-secondary">Cancelar</button><button type="submit" className="btn-primary">Guardar</button></div>
        </form>
      </div>
    </div>
  );
};
// ... The rest of the file (StaffUserModal, ManageClients, etc.) should follow
const StaffUserModal = ({ onClose, userToEdit, onSave }) => {
    const { state } = useGestion();
    const { stores } = state;
    const { user: currentUser } = useAuth();
    const defaultStoreId = userToEdit?.storeId || (currentUser.role !== 'ADMIN' ? currentUser.storeId : "") || "";

    const initialUserState = { 
        name: "", email: "", password: "", phone: "", sexo: "", role: "VENDEDOR", 
        street: "", neighborhood: "", city: "", postalCode: "", storeId: defaultStoreId,
        municipality: "", state: ""
    };
    
    const [user, setUser] = useState(() => {
        if (userToEdit) {
            let defaultMuni = userToEdit.municipality || "";
            let defaultState = userToEdit.state || "";
            if (!defaultMuni && !defaultState && userToEdit.city) {
                const parts = userToEdit.city.split(', ');
                defaultMuni = parts[0] || "";
                defaultState = parts[1] || "";
            }
            return { ...userToEdit, password: "", municipality: defaultMuni, state: defaultState };
        }
        return initialUserState;
    });

    const [colonias, setColonias] = useState([]);
    const [postalLoading, setPostalLoading] = useState(false);

    useEffect(() => {
        if (user.postalCode && user.postalCode.length === 5) {
            setPostalLoading(true);
            setColonias([]);
            const fetchPostal = async () => {
                try {
                    const data = await apiFetchPostalCode(user.postalCode);
                    if (!data.error && data.codigo_postal) {
                        const { municipio, estado, colonias: cols } = data.codigo_postal;
                        setUser(prev => ({
                            ...prev,
                            municipality: municipio,
                            state: estado,
                            city: `${municipio}, ${estado}`,
                            neighborhood: cols.length === 1 ? cols[0] : prev.neighborhood,
                        }));
                        setColonias(cols);
                    }
                } catch (e) {
                    console.error("Error fetching CP", e);
                } finally {
                    setPostalLoading(false);
                }
            };
            fetchPostal();
        } else if (user.postalCode?.length < 5) {
            setColonias([]);
        }
    }, [user.postalCode]);
  
    const handleChange = (e) => {
      const { name, value } = e.target;
      setUser((prev) => ({ ...prev, [name]: value }));
    };
  
    const handleSubmit = (e) => {
      e.preventDefault();
      const userData = { ...user };
      if (isEditing && !userData.password) delete userData.password;
      
      if (currentUser.role !== 'ADMIN' && !userData.storeId) {
          userData.storeId = currentUser.storeId;
      }
      Object.keys(userData).forEach(key => { if (userData[key] === '') userData[key] = null; });
      userData.city = `${userData.municipality || ''}, ${userData.state || ''}`;
      onSave(userData);
      onClose();
    };
  
    const isEditing = !!userToEdit;
    const staffRoles = ["ADMIN", "VENDEDOR", "REPARTIDOR"];
    const canAssignStore = currentUser.role === 'ADMIN';
  
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <h2 className="text-2xl font-bold mb-6 text-[#111418] dark:text-white">{isEditing ? "Editar Personal" : "Agregar Nuevo Personal"}</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-primary border-b pb-1">Cuenta y Rol</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="label-style">Nombre Completo</label><input name="name" type="text" value={user.name || ""} onChange={handleChange} required className="input-style" /></div>
                    <div><label className="label-style">Email (para login)</label><input name="email" type="email" value={user.email || ""} onChange={handleChange} required className="input-style" /></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="label-style">Rol</label>
                        <select name="role" value={user.role} onChange={handleChange} className="input-style">
                        {staffRoles.map(role => <option key={role} value={role}>{role}</option>)}
                        </select>
                    </div>
                    {canAssignStore ? (
                        <div>
                        <label className="label-style">Asignar a Sucursal</label>
                        <select name="storeId" value={user.storeId || ""} onChange={handleChange} required={user.role !== 'ADMIN'} className="input-style">
                            <option value="">{user.role === 'ADMIN' ? 'Todas (Global)' : 'Selecciona...'}</option>
                            {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        </div>
                    ) : ( <input type="hidden" name="storeId" value={user.storeId || ""} /> )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div><label className="label-style">Teléfono</label><input name="phone" type="tel" value={user.phone || ""} onChange={handleChange} className="input-style" /></div>
                    <div>
                        <label className="label-style">Sexo</label>
                        <select name="sexo" value={user.sexo || ""} onChange={handleChange} className="input-style">
                            <option value="">Selecciona...</option>
                            <option value="HOMBRE">Hombre</option>
                            <option value="MUJER">Mujer</option>
                            <option value="OTRO">Prefiero no decirlo</option>
                        </select>
                    </div>
                    <div>
                    <label className="label-style">{isEditing ? "Nueva Contraseña (opcional)" : "Contraseña"}</label>
                    <PasswordInput name="password" value={user.password || ''} onChange={handleChange} required={!isEditing} className="input-style" />
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-sm font-bold text-primary border-b pb-1">Dirección (Opcional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1">
                      <label className="label-style">Código Postal</label>
                      <input name="postalCode" type="text" value={user.postalCode || ""} onChange={handleChange} maxLength="5" className="input-style" placeholder="00000" />
                      {postalLoading && <span className="text-xs text-primary animate-pulse">Buscando...</span>}
                  </div>
                  <div className="md:col-span-2">
                      <label className="label-style">Calle y Número</label>
                      <input name="street" type="text" value={user.street || ""} onChange={handleChange} className="input-style" />
                  </div>
                </div>
              
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="label-style">Colonia</label>
                        {colonias.length > 0 ? (
                            <select name="neighborhood" value={user.neighborhood || ""} onChange={handleChange} className="input-style">
                                <option value="">Selecciona...</option>
                                {colonias.map((col, idx) => <option key={`${idx}-${col}`} value={col}>{col}</option>)}
                            </select>
                        ) : (
                            <input name="neighborhood" type="text" value={user.neighborhood || ""} onChange={handleChange} className="input-style" />
                        )}
                    </div>
                    <div><label className="label-style">Municipio</label><input name="municipality" type="text" value={user.municipality || ""} readOnly className="input-style bg-gray-100 dark:bg-gray-700" /></div>
                    <div><label className="label-style">Estado</label><input name="state" type="text" value={user.state || ""} readOnly className="input-style bg-gray-100 dark:bg-gray-700" /></div>
                </div>
            </div>

            <div className="flex justify-end gap-4 pt-4"><button type="button" onClick={onClose} className="btn-secondary">Cancelar</button><button type="submit" className="btn-primary">Guardar</button></div>
          </form>
        </div>
      </div>
    );
};

// ... ManageClients and Usuarios components follow ...
const ManageClients = ({ selectedStoreFilter }) => {
  const { state, addUser, updateUser, deleteUser } = useGestion();
  const { users, loading, error, stores } = state;
  const { user: currentUser } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);

  const clientUsers = users.filter(user => {
      const isClient = user.role === 'CLIENTE';
      if (!isClient) return false;
      
      if (currentUser.role === 'ADMIN') {
          if (selectedStoreFilter && selectedStoreFilter !== 'all') {
              return user.storeId === selectedStoreFilter;
          }
          return true;
      }
      
      return user.storeId === currentUser.storeId || !user.storeId;
  });

  const handleOpenModal = (user = null) => { setUserToEdit(user); setIsModalOpen(true); };
  const handleCloseModal = () => { setUserToEdit(null); setIsModalOpen(false); };
  const handleSaveUser = (user) => { 
      // Ensure empty strings are null to prevent DB errors (like unique constraint on empty string)
      const cleanUser = { ...user };
      Object.keys(cleanUser).forEach(key => {
          if (cleanUser[key] === "") cleanUser[key] = null;
      });
      
      user.id ? updateUser(user.id, cleanUser) : addUser(cleanUser); 
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({ title: '¿Estás seguro?', text: '¡No podrás revertir esto!', icon: 'warning', showCancelButton: true, confirmButtonColor: '#3085d6', cancelButtonColor: '#d33', confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar' });
    if (result.isConfirmed) deleteUser(id);
  };

  const showOrderHistory = async (client) => {
    try {
        Swal.fire({ title: 'Cargando historial...', didOpen: () => Swal.showLoading() });
        
        // Fetch specific user orders directly
        const response = await apiClient.get('/pedidos'); 
        const allOrders = response.data;
        
        // Filter and sort client orders
        const clientOrders = allOrders
            .filter(o => o.clienteId === client.id)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5); // Last 5 orders

        if (clientOrders.length === 0) {
            Swal.fire('Historial vacío', 'Este cliente no tiene pedidos registrados.', 'info');
            return;
        }

        const htmlContent = `
            <div class="text-left text-sm max-h-[60vh] overflow-y-auto pr-2">
                ${clientOrders.map(order => `
                    <div class="mb-3 border-b border-gray-200 dark:border-gray-700 pb-3 last:border-0">
                        <div class="flex justify-between items-center mb-1">
                            <span class="font-bold text-gray-800 dark:text-gray-200">${new Date(order.createdAt).toLocaleDateString()}</span>
                            <span class="px-2 py-0.5 rounded text-xs font-semibold ${
                                order.status === 'ENTREGADO' ? 'bg-green-100 text-green-800' : 
                                order.status === 'CANCELADO' ? 'bg-red-100 text-red-800' : 
                                'bg-blue-100 text-blue-800'
                            }">${order.status}</span>
                        </div>
                        <div class="text-gray-600 dark:text-gray-400 font-medium">Total: $${order.total.toFixed(2)}</div>
                        <div class="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            ${order.items.map(i => `${i.quantity}x ${i.jugBrandName || 'Producto'}`).join(', ')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        Swal.fire({
            title: `Últimos pedidos de ${client.name}`,
            html: htmlContent,
            width: 500,
            showCloseButton: true,
            confirmButtonText: 'Cerrar',
            confirmButtonColor: '#3085d6'
        });

    } catch (error) {
        console.error("Error loading history:", error);
        Swal.fire('Error', 'No se pudo cargar el historial.', 'error');
    }
  };

  const getStoreName = (storeId) => {
      if (!storeId) return <span className="text-gray-400 italic">General</span>;
      const store = stores.find(s => s.id === storeId);
      return store ? <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full dark:bg-blue-900 dark:text-blue-300">{store.name}</span> : 'Desconocida';
  };

  return (
    <div className="animate-fade-in">
        <div className="flex justify-end mb-4"><button onClick={() => handleOpenModal()} className="btn-primary">Agregar Cliente</button></div>
         {isModalOpen && <ClientUserModal onClose={handleCloseModal} onSave={handleSaveUser} userToEdit={userToEdit} />}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
            <table className="min-w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="th-style">ID</th>
                  <th className="th-style">Nombre</th>
                  <th className="th-style">Email</th>
                  <th className="th-style">Teléfono</th>
                  <th className="th-style">Sucursal</th>
                  <th className="th-style text-center">Puntos</th>
                  <th className="th-style text-right">Acciones</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                <tr><td colSpan="7" className="p-6 text-center text-gray-500">Cargando clientes...</td></tr>
                ) : error ? (
                <tr><td colSpan="7" className="p-6 text-center text-red-500">Error: {error}</td></tr>
                ) : clientUsers.length === 0 ? (
                <tr><td colSpan="7" className="p-6 text-center text-gray-500">No hay clientes registrados que coincidan con el filtro.</td></tr>
                ) : (
                clientUsers.map((user) => (
                    <tr key={user.id}>
                    <td className="td-style font-mono text-xs">{user.customId}</td>
                    <td className="td-style font-medium">{user.name}</td>
                    <td className="td-style">{user.email || "N/A"}</td>
                    <td className="td-style">{user.phone || "N/A"}</td>
                    <td className="td-style">{getStoreName(user.storeId)}</td>
                    <td className="td-style text-center font-bold text-primary">{user.loyaltyPoints || 0}</td>
                    <td className="td-style text-right">
                        <div className="flex flex-col sm:flex-row gap-2 justify-end items-center">
                            <button 
                                onClick={() => showOrderHistory(user)} 
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium p-1 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors" 
                                title="Ver Historial"
                            >
                                <span className="material-symbols-outlined text-xl align-middle">history</span>
                            </button>
                            <button onClick={() => handleOpenModal(user)} className="text-primary hover:text-primary/90 font-medium">Editar</button>
                            <button onClick={() => handleDelete(user.id)} className="text-red-500 hover:text-red-700 font-medium">Eliminar</button>
                        </div>
                    </td>
                    </tr>
                )))}
            </tbody>
            </table>
        </div>
    </div>
  )
};

const ManageStaff = ({ selectedStoreFilter }) => {
    const { state, addUser, updateUser, deleteUser } = useGestion();
    const { users, loading, error, stores } = state;
    const { user: currentUser } = useAuth(); 
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState(null);

    const staffUsers = users.filter(user => {
        const isStaff = user.role !== 'CLIENTE';
        if (!isStaff) return false;
        
        if (currentUser.role === 'ADMIN') {
            if (selectedStoreFilter && selectedStoreFilter !== 'all') {
                return user.storeId === selectedStoreFilter;
            }
            return true;
        }
        
        return user.storeId === currentUser.storeId;
    });

    const handleOpenModal = (user = null) => { setUserToEdit(user); setIsModalOpen(true); };
    const handleCloseModal = () => { setUserToEdit(null); setIsModalOpen(false); };
    const handleSaveUser = (user) => { user.id ? updateUser(user.id, user) : addUser(user); };
    const handleDelete = async (id) => {
        const result = await Swal.fire({ title: '¿Estás seguro?', text: '¡No podrás revertir esto!', icon: 'warning', showCancelButton: true, confirmButtonColor: '#3085d6', cancelButtonColor: '#d33', confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar' });
        if (result.isConfirmed) deleteUser(id);
    };

    const RoleBadge = ({ role }) => {
        const roleStyles = {
            ADMIN: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
            VENDEDOR: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
            REPARTIDOR: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
        };
        return <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${roleStyles[role] || ""}`}>{role}</span>;
    };

    const getStoreName = (storeId) => {
        if (!storeId) return <span className="text-purple-600 font-semibold text-xs">GLOBAL</span>;
        const store = stores.find(s => s.id === storeId);
        return store ? store.name : 'Desconocida';
    };

    return (
        <div className="animate-fade-in">
            <div className="flex justify-end mb-4"><button onClick={() => handleOpenModal()} className="btn-primary">Agregar Personal</button></div>
            {isModalOpen && <StaffUserModal onClose={handleCloseModal} onSave={handleSaveUser} userToEdit={userToEdit} />}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
                <table className="min-w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="th-style">ID</th>
                            <th className="th-style">Nombre</th>
                            <th className="th-style">Email</th>
                            <th className="th-style">Rol</th>
                            <th className="th-style">Sucursal</th> 
                            <th className="th-style text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {loading ? (
                            <tr><td colSpan="6" className="p-6 text-center text-gray-500">Cargando personal...</td></tr>
                        ) : error ? (
                            <tr><td colSpan="6" className="p-6 text-center text-red-500">Error: {error}</td></tr>
                        ) : staffUsers.length === 0 ? (
                            <tr><td colSpan="6" className="p-6 text-center text-gray-500">No se encontró personal con los filtros actuales.</td></tr>
                        ) : (
                            staffUsers.map((user) => (
                                <tr key={user.id}>
                                    <td className="td-style font-mono text-xs">{user.customId}</td>
                                    <td className="td-style font-medium">{user.name}</td>
                                    <td className="td-style">{user.email || "N/A"}</td>
                                    <td className="td-style"><RoleBadge role={user.role} /></td>
                                    <td className="td-style text-sm">{getStoreName(user.storeId)}</td>
                                    <td className="td-style text-right">
                                    <div className="flex flex-col sm:flex-row gap-2 justify-end">
                                        <button onClick={() => handleOpenModal(user)} className="text-primary hover:text-primary/90 font-medium">Editar</button>
                                        <button onClick={() => handleDelete(user.id)} className="text-red-500 hover:text-red-700 font-medium">Eliminar</button>
                                    </div>
                                </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const Usuarios = () => {
  const [activeTab, setActiveTab] = useState('staff');
  const [storeFilter, setStoreFilter] = useState('all');
  const { state } = useGestion();
  const { stores } = state;
  const { user } = useAuth();

  const getTabClassName = (tabName) => {
    return `px-4 py-2 font-medium rounded-t-lg transition-colors text-sm sm:text-base ${
        activeTab === tabName
            ? 'bg-white dark:bg-gray-800 text-primary border-b-2 border-primary'
            : 'bg-transparent text-gray-500 hover:text-primary dark:hover:text-gray-300'
    }`;
  };
  
  return (
    <div>
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-[#111418] dark:text-white">Gestión de Usuarios</h1>
        
        {user?.role === 'ADMIN' && (
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Filtrar por:</span>
                <select 
                    value={storeFilter} 
                    onChange={(e) => setStoreFilter(e.target.value)}
                    className="input-style py-1 px-3 text-sm"
                >
                    <option value="all">Todas las Sucursales</option>
                    {stores.map(store => (
                        <option key={store.id} value={store.id}>{store.name}</option>
                    ))}
                </select>
            </div>
        )}
      </div>
      
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex gap-4">
            <button onClick={() => setActiveTab('staff')} className={getTabClassName('staff')}>Personal</button>
            <button onClick={() => setActiveTab('clients')} className={getTabClassName('clients')}>Clientes</button>
        </nav>
      </div>
      <div>
        {activeTab === 'staff' && <ManageStaff selectedStoreFilter={storeFilter} />}
        {activeTab === 'clients' && <ManageClients selectedStoreFilter={storeFilter} />}
      </div>
    </div>
  );
};

export default Usuarios;