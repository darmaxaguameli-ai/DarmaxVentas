import { useState, useEffect, useRef, useMemo } from 'react';
import { fetchUsers, checkUser, fetchPostalCodeData } from '../../api/apiClient';
import Swal from 'sweetalert2';
import { MdSearch, MdPersonAdd, MdPhone, MdBadge, MdLocationOn, MdClose } from 'react-icons/md';

const CustomerModal = ({ isOpen, onClose, onCustomerAdd }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchMethod, setSearchMethod] = useState('phone'); // 'phone' | 'id' | 'name'
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  
  // New Client Form State
  const [newClient, setNewClient] = useState({
    name: '',
    phone: '',
    street: '',
    neighborhood: '',
    municipality: '',
    state: '',
    city: '',
    postalCode: '',
    references: '',
    lat: null,
    lng: null,
    clientCategory: 'PARTICULAR'
  });

  const [isLocating, setIsLocating] = useState(false);

  const inputRef = useRef(null);

  const handleCPChange = async (cp) => {
    setNewClient(prev => ({ ...prev, postalCode: cp }));
    if (cp.length === 5) {
      try {
        const data = await fetchPostalCodeData(cp);
        if (data && data.length > 0) {
          // Assuming data is an array of options or a single object
          const info = data[0];
          setNewClient(prev => ({
            ...prev,
            municipality: info.municipio || '',
            state: info.estado || '',
            city: info.ciudad || '',
            neighborhood: info.asentamiento || prev.neighborhood
          }));
        }
      } catch (err) {
        console.error("Error fetching CP data:", err);
      }
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      Swal.fire('Error', 'La geolocalización no es soportada por tu navegador.', 'error');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setNewClient(prev => ({
          ...prev,
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }));
        setIsLocating(false);
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Ubicación obtenida',
            showConfirmButton: false,
            timer: 2000
        });
      },
      (_error) => {
        console.error("Error getting location:", _error);
        setIsLocating(false);
        Swal.fire('Error', 'No se pudo obtener la ubicación. Asegúrate de dar permisos.', 'error');
      },
      { enableHighAccuracy: true }
    );
  };

  // Load all users for name search if needed
  useEffect(() => {
    if (isOpen && searchMethod === 'name') {
        const loadUsers = async () => {
            setLoading(true);
            try {
                const users = await fetchUsers();
                setAllUsers(users.filter(u => u.role === 'CLIENTE'));
            } catch (err) {
                console.error("Error loading users:", err);
            } finally {
                setLoading(false);
            }
        };
        loadUsers();
    }
  }, [isOpen, searchMethod]);

  const filteredUsers = useMemo(() => {
    if (searchMethod !== 'name' || !searchTerm) return [];
    const term = searchTerm.toLowerCase();
    return allUsers.filter(u => 
        u.name.toLowerCase().includes(term) || 
        (u.phone && u.phone.includes(term))
    ).slice(0, 10); // Limit results
  }, [allUsers, searchTerm, searchMethod]);

  const handleSearch = async () => {
    if (!searchTerm || searchMethod === 'name') return;
    setLoading(true);

    try {
        let identifier = searchTerm.trim();
        let type = searchMethod === 'id' ? 'customId' : 'phone';

        if (type === 'customId' && !identifier.toUpperCase().startsWith('CLI-')) {
            identifier = `CLI-${identifier}`;
        }

        const user = await checkUser(identifier, type);
        onCustomerAdd(user);
        onClose();
    } catch (error) {
         Swal.fire('No encontrado', 'No se encontró ningún cliente con esos datos.', 'info');
    } finally {
        setLoading(false);
    }
  };
  
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setSearchMethod('phone');
      setShowNewClientForm(false);
      setNewClient({ name: '', phone: '', street: '', neighborhood: '', references: '', clientCategory: 'PARTICULAR' });
    } else {
        setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSelectUser = (user) => {
    onCustomerAdd(user);
    onClose();
  };

  const handleCreateQuickClient = () => {
    if (!newClient.name) {
        Swal.fire('Error', 'El nombre es obligatorio.', 'error');
        return;
    }
    // Pass as a "New" customer to NewOrderFlow which handles actual DB creation
    onCustomerAdd({
        ...newClient,
        isNew: true
    });
    onClose();
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') handleSearch();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <div>
                <h3 className="text-xl font-black text-gray-800 dark:text-white uppercase tracking-tight">
                    {showNewClientForm ? 'Nuevo Cliente Rápido' : 'Identificar Cliente'}
                </h3>
                <p className="text-xs text-gray-500 font-bold uppercase">Mostrador / Domicilio</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                <MdClose className="text-2xl text-gray-400" />
            </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
            {!showNewClientForm ? (
                <>
                    {/* Search Method Selector */}
                    <div className="flex p-1 bg-gray-100 dark:bg-gray-900/50 rounded-2xl mb-6">
                        {['phone', 'id', 'name'].map(m => (
                            <button 
                                key={m}
                                className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${searchMethod === m ? 'bg-white dark:bg-gray-700 shadow-sm text-primary' : 'text-gray-400'}`}
                                onClick={() => { setSearchMethod(m); setSearchTerm(''); }}
                            >
                                {m === 'phone' ? 'Tel' : m === 'id' ? 'ID' : 'Nombre'}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-2 mb-6">
                        <div className="relative flex-grow">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
                                {searchMethod === 'phone' ? <MdPhone /> : searchMethod === 'id' ? <MdBadge /> : <MdSearch />}
                            </div>
                            <input 
                                ref={inputRef}
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyPress={handleKeyPress}
                                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-primary focus:bg-white dark:focus:bg-gray-800 outline-none transition-all font-bold text-gray-800 dark:text-white"
                                placeholder={searchMethod === 'phone' ? "55 1234 5678" : searchMethod === 'id' ? "0000" : "Buscar por nombre..."}
                            />
                        </div>
                        {searchMethod !== 'name' && (
                            <button 
                                onClick={handleSearch} 
                                disabled={loading || !searchTerm}
                                className="px-6 rounded-2xl bg-primary text-white font-black uppercase text-xs shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-50"
                            >
                                {loading ? '...' : 'Buscar'}
                            </button>
                        )}
                    </div>

                    {/* Results for Name Search */}
                    {searchMethod === 'name' && searchTerm.length > 1 && (
                        <div className="space-y-2 mb-6">
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map(u => (
                                    <button 
                                        key={u.id}
                                        onClick={() => handleSelectUser(u)}
                                        className="w-full p-4 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-primary/50 hover:bg-primary/5 text-left transition-all flex justify-between items-center group"
                                    >
                                        <div className="min-w-0">
                                            <p className="font-black text-gray-800 dark:text-white uppercase truncate">{u.name}</p>
                                            <p className="text-xs text-gray-500 font-bold">{u.phone || 'Sin teléfono'} • {u.customId}</p>
                                        </div>
                                        <MdPersonAdd className="text-xl text-gray-300 group-hover:text-primary transition-colors" />
                                    </button>
                                ))
                            ) : (
                                <p className="text-center py-4 text-gray-400 text-sm italic">No se encontraron coincidencias.</p>
                            )}
                        </div>
                    )}

                    <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                        <button 
                            onClick={() => setShowNewClientForm(true)}
                            className="w-full py-4 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 font-black uppercase text-xs flex items-center justify-center gap-2 hover:border-primary hover:text-primary transition-all"
                        >
                            <MdPersonAdd className="text-xl" />
                            Registrar Cliente Nuevo / Institución
                        </button>
                    </div>
                </>
            ) : (
                /* QUICK NEW CLIENT FORM */
                <div className="space-y-4 animate-in slide-in-from-right-4 duration-300 pb-4">
                    <div className="grid grid-cols-1 gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black uppercase text-gray-400 ml-2 mb-1 block">Nombre / Institución</label>
                                <input 
                                    type="text" 
                                    value={newClient.name} 
                                    onChange={(e) => setNewClient({...newClient, name: e.target.value})} 
                                    className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-primary outline-none font-bold text-sm"
                                    placeholder="Ej. Hospital Central / Juan Pérez"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-gray-400 ml-2 mb-1 block">Teléfono</label>
                                <input 
                                    type="tel" 
                                    value={newClient.phone} 
                                    onChange={(e) => setNewClient({...newClient, phone: e.target.value})} 
                                    className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-primary outline-none font-bold text-sm"
                                    placeholder="5512345678"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-1">
                                <label className="text-[10px] font-black uppercase text-gray-400 ml-2 mb-1 block">CP</label>
                                <input 
                                    type="text" 
                                    value={newClient.postalCode} 
                                    onChange={(e) => handleCPChange(e.target.value)} 
                                    className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-primary outline-none font-bold text-sm"
                                    placeholder="00000"
                                    maxLength="5"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="text-[10px] font-black uppercase text-gray-400 ml-2 mb-1 block">Tipo de Cliente</label>
                                <select 
                                    value={newClient.clientCategory} 
                                    onChange={(e) => setNewClient({...newClient, clientCategory: e.target.value})}
                                    className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-primary outline-none font-bold uppercase text-xs"
                                >
                                    <option value="PARTICULAR">Particular</option>
                                    <option value="EMPRESA">Empresa</option>
                                    <option value="HOSPITAL">Hospital</option>
                                    <option value="ESCUELA">Escuela</option>
                                    <option value="OTRO">Otro</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black uppercase text-gray-400 ml-2 mb-1 block">Calle y Número</label>
                                <input 
                                    type="text" 
                                    value={newClient.street} 
                                    onChange={(e) => setNewClient({...newClient, street: e.target.value})} 
                                    className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-primary outline-none font-bold text-sm"
                                    placeholder="Av. Principal 123"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-gray-400 ml-2 mb-1 block">Colonia</label>
                                <input 
                                    type="text" 
                                    value={newClient.neighborhood} 
                                    onChange={(e) => setNewClient({...newClient, neighborhood: e.target.value})} 
                                    className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-primary outline-none font-bold text-sm"
                                    placeholder="Col. Centro"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div>
                                <label className="text-[10px] font-black uppercase text-gray-400 ml-2 mb-1 block">Municipio</label>
                                <input 
                                    type="text" 
                                    value={newClient.municipality} 
                                    onChange={(e) => setNewClient({...newClient, municipality: e.target.value})} 
                                    className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-primary outline-none font-bold text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-gray-400 ml-2 mb-1 block">Ciudad</label>
                                <input 
                                    type="text" 
                                    value={newClient.city} 
                                    onChange={(e) => setNewClient({...newClient, city: e.target.value})} 
                                    className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-primary outline-none font-bold text-sm"
                                />
                            </div>
                            <div className="col-span-2 md:col-span-1">
                                <label className="text-[10px] font-black uppercase text-gray-400 ml-2 mb-1 block">Estado</label>
                                <input 
                                    type="text" 
                                    value={newClient.state} 
                                    onChange={(e) => setNewClient({...newClient, state: e.target.value})} 
                                    className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-primary outline-none font-bold text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black uppercase text-gray-400 ml-2 mb-1 block">Referencias</label>
                            <textarea 
                                value={newClient.references} 
                                onChange={(e) => setNewClient({...newClient, references: e.target.value})} 
                                className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-primary outline-none font-bold text-sm resize-none"
                                placeholder="Portón azul, junto a la tienda..."
                                rows="2"
                            />
                        </div>

                        <button 
                            type="button"
                            onClick={handleGetLocation}
                            disabled={isLocating}
                            className={`w-full py-3 rounded-2xl border-2 flex items-center justify-center gap-2 transition-all ${newClient.lat ? 'border-green-500 bg-green-50 text-green-600 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-primary hover:text-primary'}`}
                        >
                            <MdLocationOn className="text-xl" />
                            <span className="text-xs font-black uppercase">
                                {isLocating ? 'Obteniendo ubicación...' : newClient.lat ? 'Ubicación Guardada ✓' : 'Obtener Ubicación Actual'}
                            </span>
                        </button>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button 
                            onClick={() => setShowNewClientForm(false)}
                            className="flex-1 py-4 rounded-2xl bg-gray-100 dark:bg-gray-700 text-gray-500 font-black uppercase text-xs"
                        >
                            Volver
                        </button>
                        <button 
                            onClick={handleCreateQuickClient}
                            className="flex-[2] py-4 rounded-2xl bg-primary text-white font-black uppercase text-xs shadow-lg shadow-primary/20 active:scale-95 transition-all"
                        >
                            Usar este cliente
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default CustomerModal;
