import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ClientOrderHeader from '../../components/ClientOrderHeader';
import { useAuth } from '../../context/AuthContext';
import apiClient, { fetchPostalCodeData as apiFetchPostalCode } from '../../api/apiClient'; // Renombrado para evitar conflicto

const ClientProfile = () => {
  const { user, isAuthenticated, loading: authLoading, updateUser: updateAuthUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    street: '',
    neighborhood: '',
    municipality: '', // New UI field
    state: '',        // New UI field
    city: '',         // Combined field for DB
    postalCode: '',
    references: '',
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
            email: userData.email || '',
            phone: userData.phone || '',
            street: userData.street || '',
            neighborhood: userData.neighborhood || '',
            municipality: defaultMuni,
            state: defaultState,
            city: userData.city || '', // Keep city for legacy/display if needed
            postalCode: userData.postalCode || '',
            references: userData.references || '',
          });
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
      setPostalCodeApiLoading(true);
      setPostalCodeApiError('');
      setColonias([]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const dataToUpdate = { ...formData };
      Object.keys(dataToUpdate).forEach(key => {
        if (dataToUpdate[key] === '') dataToUpdate[key] = null;
      });

      const response = await apiClient.put(`/users/${user.id}`, dataToUpdate);
      setSuccessMessage('¡Perfil actualizado con éxito!');
      updateAuthUser(response.data);

      if (location.state?.fromOrderFlow) {
        navigate('/pedidos/rellenar/resumen', { state: location.state.orderState });
      } else {
        navigate('/pedidos');
      }
    } catch (err) {
      console.error('Error updating user profile:', err);
      setError(err.response?.data?.error || 'Error al actualizar el perfil.');
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (authLoading || loading) {
      return <div className="text-center py-10 text-dark dark:text-white">Cargando perfil...</div>;
    }
    return (
      <main className="w-full max-w-4xl mx-auto p-6 sm:p-10 bg-white dark:bg-gray-800 rounded-2xl shadow-xl mt-10">
        <h1 className="text-2xl sm:text-3xl font-black text-center text-dark dark:text-white mb-8">
          Tu Perfil de Cliente
        </h1>
        {successMessage && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-6">{successMessage}</div>}
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">{error}</div>}
        {postalCodeApiError && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">{postalCodeApiError}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-primary flex items-center gap-2 border-b pb-2 dark:border-gray-700">
                <span className="material-symbols-outlined">person</span> Datos Personales
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><label className="label-style mb-1 block">Nombre Completo</label><input type="text" name="name" value={formData.name} readOnly className="input-style bg-gray-50 dark:bg-gray-700/50 cursor-not-allowed"/></div>
                <div><label className="label-style mb-1 block">Correo Electrónico</label><input type="email" name="email" value={formData.email} readOnly className="input-style bg-gray-50 dark:bg-gray-700/50 cursor-not-allowed"/></div>
            </div>
            <div><label className="label-style mb-1 block">Teléfono de Contacto</label><input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="Ej. 5512345678" className="input-style"/></div>
          </section>
          
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-primary flex items-center gap-2 border-b pb-2 dark:border-gray-700">
                <span className="material-symbols-outlined">home</span> Dirección de Entrega
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          </section>
          
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-primary flex items-center gap-2 border-b pb-2 dark:border-gray-700">
                <span className="material-symbols-outlined">notes</span> Referencias
            </h2>
            <div><textarea name="references" value={formData.references} onChange={handleChange} rows="3" placeholder="Ej. Portón café, junto a la ferretería..." className="input-style resize-y"></textarea></div>
          </section>
          
          <div className="flex justify-end pt-4">
            <button type="submit" className="btn-primary w-full sm:w-auto px-12 py-4 text-lg shadow-lg hover:scale-[1.02] transition-transform" disabled={loading || postalCodeApiLoading}>
                {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </main>
    );
  };

  return (
    <div className="font-display relative flex min-h-screen w-full flex-col bg-light dark:bg-dark text-dark dark:text-white overflow-x-hidden select-none">
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
