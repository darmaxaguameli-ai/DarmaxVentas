import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // Importar useLocation
import ClientOrderHeader from '../../components/ClientOrderHeader';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/apiClient';

const ClientProfile = () => {
  const { user, isAuthenticated, loading: authLoading, updateUser: updateAuthUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); // Usar useLocation para acceder al estado

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    street: '',
    neighborhood: '',
    city: '',
    postalCode: '',
    references: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [postalCodeApiLoading, setPostalCodeApiLoading] = useState(false);
  const [postalCodeApiError, setPostalCodeApiError] = useState('');


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
          setFormData({
            name: userData.name || '',
            email: userData.email || '',
            phone: userData.phone || '',
            street: userData.street || '',
            neighborhood: userData.neighborhood || '',
            city: userData.city || '',
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
  // ... (resto del useEffect y funciones se mantienen, solo cambiando axios por apiClient)
    useEffect(() => {
    if (formData.postalCode && formData.postalCode.length === 5) {
      setPostalCodeApiLoading(true);
      setPostalCodeApiError('');
      console.log(`Fetching address data for postal code: ${formData.postalCode}`);
      setTimeout(() => {
        if (formData.postalCode === '01000') {
          setFormData(prev => ({ ...prev, neighborhood: 'San Ángel', city: 'Ciudad de México', street: '' }));
          setSuccessMessage('Datos de dirección pre-llenados por código postal.');
        } else if (formData.postalCode === '99999') {
          setPostalCodeApiError('Código postal no encontrado o inválido.');
        } else {
          setFormData(prev => ({ ...prev, neighborhood: '', city: '', street: '' }));
        }
        setPostalCodeApiLoading(false);
      }, 1000);
    } else if (formData.postalCode.length > 0 && formData.postalCode.length < 5) {
      setPostalCodeApiError('El código postal debe tener 5 dígitos.');
    } else {
      setPostalCodeApiError('');
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

      // Lógica de redirección condicional
      if (location.state?.fromOrderFlow) {
        // Si venimos del flujo de pedidos, redirigir al resumen
        navigate('/pedidos/rellenar/resumen', { state: location.state.orderState });
      } else {
        // Comportamiento normal: redirigir a la página principal de pedidos
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
    if (error && !successMessage) { // Show general error only if no success message is present
      return <div className="text-center py-10 text-red-500">{error}</div>;
    }
    return (
      <main className="w-full max-w-2xl mx-auto p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl">
        <h1 className="text-2xl sm:text-3xl font-bold text-center text-dark dark:text-white mb-6 sm:mb-8">
          Completa tu Perfil
        </h1>
        {successMessage && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">{successMessage}</div>}
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">{error}</div>}
        {postalCodeApiError && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">{postalCodeApiError}</div>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-dark dark:text-white mb-1">Nombre</label><input type="text" name="name" value={formData.name} readOnly className="input-style bg-gray-100 dark:bg-gray-700 cursor-not-allowed"/></div>
            <div><label className="block text-sm font-medium text-dark dark:text-white mb-1">Email</label><input type="email" name="email" value={formData.email} readOnly className="input-style bg-gray-100 dark:bg-gray-700 cursor-not-allowed"/></div>
          </div>
          <div><label className="block text-sm font-medium text-dark dark:text-white mb-1">Teléfono</label><input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="Ej. 5512345678" className="input-style"/></div>
          <h2 className="text-xl font-semibold text-dark dark:text-white mt-6 mb-4">Dirección</h2>
          <div><label className="block text-sm font-medium text-dark dark:text-white mb-1">Código Postal</label><input type="text" name="postalCode" value={formData.postalCode} onChange={handleChange} placeholder="Ej. 01234" className="input-style" maxLength="5"/>{postalCodeApiLoading && <p className="text-sm text-primary mt-1">Buscando código postal...</p>}</div>
          <div><label className="block text-sm font-medium text-dark dark:text-white mb-1">Calle y Número</label><input type="text" name="street" value={formData.street} onChange={handleChange} placeholder="Ej. Av. Siempre Viva 742" className="input-style"/></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-dark dark:text-white mb-1">Colonia/Barrio</label><input type="text" name="neighborhood" value={formData.neighborhood} onChange={handleChange} placeholder="Ej. Centro" className="input-style"/></div>
            <div><label className="block text-sm font-medium text-dark dark:text-white mb-1">Ciudad</label><input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="Ej. Ciudad de México" className="input-style"/></div>
          </div>
          <div><label className="block text-sm font-medium text-dark dark:text-white mb-1">Referencias Adicionales</label><textarea name="references" value={formData.references} onChange={handleChange} rows="3" placeholder="Ej. Casa con portón rojo, a un lado de la tienda." className="input-style resize-y"></textarea></div>
          <div className="flex justify-end"><button type="submit" className="btn-primary" disabled={loading || postalCodeApiLoading}>{loading ? 'Guardando...' : 'Guardar Cambios'}</button></div>
        </form>
      </main>
    );
  };
    return (
    <div className="font-display relative flex min-h-screen w-full flex-col bg-light dark:bg-dark text-dark dark:text-white overflow-x-hidden select-none">
      <div className="flex flex-1 justify-center px-4 sm:px-6 lg:px-12 py-8">
        <div className="flex w-full max-w-4xl flex-col items-center gap-6 sm:gap-10">
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
