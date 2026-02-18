import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner'; // Importar toast
import ClientOrderHeader from '../../components/ClientOrderHeader';
import { useAuth } from '../../context/AuthContext';
import apiClient, { fetchPostalCodeData as apiFetchPostalCode } from '../../api/apiClient'; // Renombrado para evitar conflicto
import LocationPicker from '../../components/common/LocationPicker';

const ClientProfile = () => {
  const { user, isAuthenticated, loading: authLoading, updateUser: updateAuthUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const lastFetchedCp = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    sexo: '',
    email: '',
    phone: '',
    street: '',
    neighborhood: '',
    municipality: '', // New UI field
    state: '',        // New UI field
    city: '',         // Combined field for DB
    postalCode: '',
    references: '',
    clientCategory: 'PARTICULAR',
    lat: null,        // New Geolocation field
    lng: null,        // New Geolocation field
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [postalCodeApiLoading, setPostalCodeApiLoading] = useState(false);
  const [postalCodeApiError, setPostalCodeApiError] = useState('');
  const [colonias, setColonias] = useState([]);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user.role !== 'CLIENTE')) {
      navigate('/login');
      return;
    }

    if (user && user.id) {
      const fetchUserProfile = async () => {
        try {
          const response = await apiClient.get(`/users/${user.id}`);
          const userData = response.data;
          
          // Split city if it exists in DB (format: "Municipality, State")
          // Logic: If municipality/state exist in DB, use them. If not, try to parse from 'city'.
          let defaultMuni = userData.municipality || "";
          let defaultState = userData.state || "";
          
          if (!defaultMuni && !defaultState && userData.city) {
             let cityParts = userData.city.split(', ');
             defaultMuni = cityParts[0] || "";
             defaultState = cityParts[1] || "";
          }
          
          setFormData({
            name: userData.name || '',
            sexo: userData.sexo || '',
            email: userData.email || '',
            phone: userData.phone || '',
            street: userData.street || '',
            neighborhood: userData.neighborhood || '',
            municipality: defaultMuni,
            state: defaultState,
            city: userData.city || '', // Keep city for legacy/display if needed
            postalCode: userData.postalCode || '',
            references: userData.references || '',
            clientCategory: userData.clientCategory || 'PARTICULAR',
            lat: userData.lat ? parseFloat(userData.lat) : null,
            lng: userData.lng ? parseFloat(userData.lng) : null,
            // Loyalty Data
            loyaltyPoints: userData.loyaltyPoints || 0,
            loyaltyTransactions: userData.loyaltyTransactions || []
          });
          
          // Prevent API fetch on initial load if CP exists
          if (userData.postalCode) {
              lastFetchedCp.current = userData.postalCode;
          }

        } catch (err) {
          console.error('Error fetching user profile:', err);
          setError('No se pudo cargar el perfil del usuario.');
        } finally {
          setLoading(false);
        }
      };
      fetchUserProfile();
    }
  }, [user, isAuthenticated, authLoading, navigate]);

  // DIPOMEX API Integration
  useEffect(() => {
    if (formData.postalCode && formData.postalCode.length === 5) {
      // Skip if we just loaded this CP from DB or already fetched it
      if (lastFetchedCp.current === formData.postalCode) {
          return;
      }

      setPostalCodeApiLoading(true);
      setPostalCodeApiError('');
      setColonias([]);
      
      // Update ref to prevent re-fetching same code
      lastFetchedCp.current = formData.postalCode;

      const loadPostalData = async () => {
        try {
            const data = await apiFetchPostalCode(formData.postalCode); // Usar la función de la API
            
            if (!data.error && data.codigo_postal) {
                const { municipio, estado, colonias: coloniasData } = data.codigo_postal;
                
                setFormData(prev => ({
                    ...prev,
                    municipality: municipio,
                    state: estado,
                    city: `${municipio}, ${estado}`,
                    // Si solo hay una colonia, coloniasData[0] es el nombre (string)
                    neighborhood: coloniasData.length === 1 ? coloniasData[0] : prev.neighborhood, 
                }));
                
                setColonias(coloniasData);
                setSuccessMessage('Dirección encontrada. Selecciona tu colonia.');
            } else {
                setPostalCodeApiError('Código postal no encontrado.');
            }

        } catch (error) {
            console.error("Error fetching postal code:", error);
            setPostalCodeApiError('Error al consultar el código postal.');
        } finally {
            setPostalCodeApiLoading(false);
        }
      };

      loadPostalData();

    } else if (formData.postalCode.length > 0 && formData.postalCode.length < 5) {
      setColonias([]);
    }
  }, [formData.postalCode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLocationChange = (lat, lng) => {
      setFormData(prev => ({ ...prev, lat, lng }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const dataToUpdate = { ...formData };
      // Remove loyalty data from update payload as it's read-only here
      delete dataToUpdate.loyaltyPoints;
      delete dataToUpdate.loyaltyTransactions;

      Object.keys(dataToUpdate).forEach(key => {
        if (dataToUpdate[key] === '') dataToUpdate[key] = null;
      });

      const response = await apiClient.put(`/users/${user.id}`, dataToUpdate);
      
      // Mensaje de éxito visual
      toast.success('¡Perfil actualizado con éxito!');
      setSuccessMessage('¡Perfil actualizado con éxito!');
      
      updateAuthUser(response.data);

      // Pequeño retraso para que el usuario vea el éxito
      setTimeout(() => {
        if (location.state?.fromOrderFlow) {
          navigate('/pedidos/rellenar/resumen', { state: location.state.orderState });
        } else {
          navigate('/pedidos');
        }
      }, 1500);

    } catch (err) {
      console.error('Error updating user profile:', err);
      const errorMsg = err.response?.data?.error || 'Error al actualizar el perfil.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const fullAddressSearch = [
      formData.street, 
      formData.neighborhood, 
      formData.municipality, 
      formData.state, 
      formData.postalCode,
      "Mexico"
  ].filter(Boolean).join(', ');

  const renderContent = () => {
    if (authLoading || loading) {
      return <div className="text-center py-10 text-dark dark:text-white">Cargando perfil...</div>;
    }
    return (
      <main className="w-full max-w-4xl mx-auto p-4 sm:p-10 bg-white dark:bg-gray-800 rounded-2xl shadow-xl mt-2 sm:mt-6">
        <h1 className="text-xl sm:text-3xl font-black text-center text-dark dark:text-white mb-4 sm:mb-6">
          Tu Perfil de Cliente
        </h1>
        {successMessage && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 text-sm">{successMessage}</div>}
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-sm">{error}</div>}
        {postalCodeApiError && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-sm">{postalCodeApiError}</div>}
        
        {/* Loyalty Points Section */}
        <section className="mb-6 sm:mb-8 p-4 sm:p-6 bg-gradient-to-r from-primary/10 to-transparent rounded-xl border border-primary/20">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-primary flex items-center gap-2">
                    <span className="material-symbols-outlined text-2xl">loyalty</span> Puntos
                </h2>
                <div className="text-right">
                    <p className="text-xs sm:text-sm text-text-secondary dark:text-white/70">Saldo actual</p>
                    <p className="text-2xl sm:text-3xl font-black text-dark dark:text-white">{formData.loyaltyPoints} pts</p>
                </div>
            </div>
            {formData.loyaltyTransactions && formData.loyaltyTransactions.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                    {formData.loyaltyTransactions.map(tx => (
                        <div key={tx.id} className="flex justify-between items-center text-xs sm:text-sm p-2 bg-white/50 dark:bg-black/20 rounded">
                            <span className="text-text-secondary dark:text-white/80">{tx.description}</span>
                            <span className={`font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                {tx.amount > 0 ? '+' : ''}{tx.amount}
                            </span>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-xs sm:text-sm text-text-secondary dark:text-white/60 italic">Aún no tienes movimientos de puntos.</p>
            )}
        </section>

        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-primary flex items-center gap-2 border-b pb-2 dark:border-gray-700">
                <span className="material-symbols-outlined">category</span> Tipo de Cliente
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                    <label className="label-style mb-1 block">¿Cómo te categorizas?</label>
                    <select name="clientCategory" value={formData.clientCategory} onChange={handleChange} className="input-style">
                        <option value="PARTICULAR">Particular (Hogar)</option>
                        <option value="EMPRESA">Empresa / Oficina</option>
                        <option value="HOSPITAL">Hospital / Clínica</option>
                        <option value="ESCUELA">Escuela / Universidad</option>
                        <option value="OTRO">Otro</option>
                    </select>
                </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-bold text-primary flex items-center gap-2 border-b pb-2 dark:border-gray-700">
                <span className="material-symbols-outlined">person</span> Datos Personales
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div><label className="label-style mb-1 block">Nombre Completo</label><input type="text" name="name" value={formData.name} readOnly className="input-style bg-gray-50 dark:bg-gray-700/50 cursor-not-allowed"/></div>
                <div><label className="label-style mb-1 block">Correo Electrónico</label><input type="email" name="email" value={formData.email} readOnly className="input-style bg-gray-50 dark:bg-gray-700/50 cursor-not-allowed"/></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                    <label className="label-style mb-1 block">Teléfono de Contacto</label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="Ej. 5512345678" className="input-style"/>
                </div>
                <div>
                    <label className="label-style mb-1 block">Sexo</label>
                    <select name="sexo" value={formData.sexo} onChange={handleChange} className="input-style">
                        <option value="">Selecciona...</option>
                        <option value="HOMBRE">Hombre</option>
                        <option value="MUJER">Mujer</option>
                        <option value="OTRO">Prefiero no decirlo</option>
                    </select>
                </div>
            </div>
          </section>
          
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-primary flex items-center gap-2 border-b pb-2 dark:border-gray-700">
                <span className="material-symbols-outlined">home</span> Dirección de Entrega
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                <div className="md:col-span-1">
                    <label className="label-style mb-1 block">Código Postal</label>
                    <input type="text" name="postalCode" value={formData.postalCode} onChange={handleChange} placeholder="Ej. 01234" className="input-style" maxLength="5"/>
                    {postalCodeApiLoading && <p className="text-[10px] text-primary mt-1 animate-pulse font-bold uppercase">Buscando...</p>}
                </div>
                <div className="md:col-span-2">
                    <label className="label-style mb-1 block">Calle y Número</label>
                    <input type="text" name="street" value={formData.street} onChange={handleChange} placeholder="Ej. Av. Siempre Viva 742" className="input-style"/>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div>
                    <label className="label-style mb-1 block">Colonia/Barrio</label>
                    {colonias.length > 0 ? (
                        <select 
                            name="neighborhood" 
                            value={formData.neighborhood} 
                            onChange={handleChange} 
                            className="input-style"
                        >
                            <option value="">-- Selecciona --</option>
                            {colonias.map((colName, index) => (
                                <option key={`${index}-${colName}`} value={colName}>
                                    {colName}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <input 
                            type="text" 
                            name="neighborhood" 
                            value={formData.neighborhood} 
                            onChange={handleChange} 
                            placeholder="Ej. Centro" 
                            className="input-style"
                        />
                    )}
                </div>
                <div>
                    <label className="label-style mb-1 block">Municipio/Alcaldía</label>
                    <input type="text" name="municipality" value={formData.municipality} readOnly className="input-style bg-gray-50 dark:bg-gray-700/50" />
                </div>
                <div>
                    <label className="label-style mb-1 block">Estado</label>
                    <input type="text" name="state" value={formData.state} readOnly className="input-style bg-gray-50 dark:bg-gray-700/50" />
                </div>
            </div>

            {/* Location Picker Map */}
            <div className="mt-6 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
                <label className="label-style mb-3 block flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">pin_drop</span>
                        Ubicación Exacta <span className="text-primary">*</span>
                    </span>
                    <span className="text-xs font-normal text-gray-500 bg-white dark:bg-gray-800 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                        Arrastra el marcador rojo
                    </span>
                </label>
                <div className="h-[350px] sm:h-[400px] w-full rounded-xl overflow-hidden shadow-inner border border-gray-300 dark:border-gray-600">
                    <LocationPicker 
                        lat={formData.lat} 
                        lng={formData.lng} 
                        onLocationChange={handleLocationChange} 
                        addressToSearch={fullAddressSearch}
                    />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                    Si no aparece tu ubicación automáticamente, usa el botón <strong>"Ubicar dirección"</strong> dentro del mapa o muévelo manualmente.
                </p>
            </div>
          </section>
          
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-primary flex items-center gap-2 border-b pb-2 dark:border-gray-700">
                <span className="material-symbols-outlined">notes</span> Referencias
            </h2>
            <div><textarea name="references" value={formData.references} onChange={handleChange} rows="3" placeholder="Ej. Portón café, junto a la ferretería..." className="input-style resize-y"></textarea></div>
          </section>
          
          <div className="flex justify-end pt-4">
            <button type="submit" className="btn-primary w-full sm:w-auto px-12 py-3 sm:py-4 text-base sm:text-lg shadow-lg hover:scale-[1.02] transition-transform" disabled={loading || postalCodeApiLoading}>
                {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </main>
    );
  };

  return (
    <div className="font-display relative flex min-h-screen w-full flex-col bg-light dark:bg-dark text-dark dark:text-white overflow-x-hidden select-none pb-[72px] sm:pb-0">
      <div className="flex flex-1 justify-center px-4 sm:px-6 lg:px-12 py-8">
        <div className="flex h-full w-full max-w-4xl flex-col items-center justify-between">
          <ClientOrderHeader primaryLink={{ to: '/pedidos', label: 'Hacer Pedido' }} />
          {renderContent()}
          <footer className="flex w-full flex-col items-center gap-6 py-10 text-center text-text-secondary dark:text-white/60">
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-8">
              <a href="#" className="text-sm sm:text-base hover:text-primary dark:hover:text-primary">Ayuda y soporte</a>
              <a href="#" className="text-sm sm:text-base hover:text-primary dark:hover:text-primary">Términos de servicio</a>
            </div>
            <p className="text-xs sm:text-sm">© {new Date().getFullYear()} Darmax. Todos los derechos reservados.</p>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default ClientProfile;
