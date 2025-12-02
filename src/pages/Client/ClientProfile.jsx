import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Added Link
// Removed MainLayout import
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const ClientProfile = () => {
  const { user, isAuthenticated, loading: authLoading, updateUser: updateAuthUser, logout } = useAuth(); // Added logout
  const navigate = useNavigate();

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
  const [postalCodeApiLoading, setPostalCodeApiLoading] = useState(false); // New state for API loading
  const [postalCodeApiError, setPostalCodeApiError] = useState(''); // New state for API error

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user.role !== 'CLIENTE')) {
      // Redirect if not authenticated or not a client
      navigate('/login');
      return;
    }

    if (user && user.id) {
      const fetchUserProfile = async () => {
        try {
          const response = await axios.get(`/api/users/${user.id}`);
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
          setLoading(false);
        } catch (err) {
          console.error('Error fetching user profile:', err);
          setError('No se pudo cargar el perfil del usuario.');
          setLoading(false);
        }
      };
      fetchUserProfile();
    }
  }, [user, isAuthenticated, authLoading, navigate]);

  // Effect for Postal Code API integration (placeholder)
  useEffect(() => {
    if (formData.postalCode && formData.postalCode.length === 5) { // Assuming 5-digit postal codes
      setPostalCodeApiLoading(true);
      setPostalCodeApiError('');
      // --- Placeholder for actual API call ---
      console.log(`Fetching address data for postal code: ${formData.postalCode}`);
      // Simulate API call
      setTimeout(() => {
        if (formData.postalCode === '01000') { // Example success
          setFormData(prev => ({
            ...prev,
            neighborhood: 'San Ángel',
            city: 'Ciudad de México',
            street: '', // Clear street as it's specific to the address
          }));
          setSuccessMessage('Datos de dirección pre-llenados por código postal.');
        } else if (formData.postalCode === '99999') { // Example error
          setPostalCodeApiError('Código postal no encontrado o inválido.');
        } else {
          // Clear if no specific match
          setFormData(prev => ({
            ...prev,
            neighborhood: '',
            city: '',
            street: '',
          }));
        }
        setPostalCodeApiLoading(false);
      }, 1000);
      // --- End Placeholder ---
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
      // Ensure empty strings are sent as null for optional fields
      Object.keys(dataToUpdate).forEach(key => {
        if (dataToUpdate[key] === '') {
          dataToUpdate[key] = null;
        }
      });

      const response = await axios.put(`/api/users/${user.id}`, dataToUpdate);
      setSuccessMessage('¡Perfil actualizado con éxito!');
      updateAuthUser(response.data);
      setLoading(false);
      navigate('/pedidos'); // Redirect to order selection page
    } catch (err) {
      console.error('Error updating user profile:', err);
      setError(err.response?.data?.error || 'Error al actualizar el perfil.');
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="font-display relative flex min-h-screen w-full flex-col bg-light dark:bg-dark text-dark dark:text-white overflow-x-hidden">
        <div className="flex flex-1 justify-center px-4 sm:px-6 lg:px-12 py-8">
          <div className="text-center text-dark dark:text-white">Cargando perfil...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="font-display relative flex min-h-screen w-full flex-col bg-light dark:bg-dark text-dark dark:text-white overflow-x-hidden">
        <div className="flex flex-1 justify-center px-4 sm:px-6 lg:px-12 py-8">
          <div className="text-center text-red-500">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="font-display relative flex min-h-screen w-full flex-col bg-light dark:bg-dark text-dark dark:text-white overflow-x-hidden">
      {/* Contenedor principal */}
      <div className="flex flex-1 justify-center px-4 sm:px-6 lg:px-12 py-8">
        <div className="flex w-full max-w-4xl flex-col items-center gap-10">
          {/* Header - Copied from OrderSelection.jsx */}
          <header
            className="flex w-full items-center justify-between 
                       rounded-2xl border border-light/60 dark:border-white/10
                       bg-white/90 dark:bg-dark/60 shadow-md backdrop-blur-xl 
                       px-6 py-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <span className="material-symbols-outlined text-2xl">
                  person
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-xs font-semibold text-text-secondary dark:text-white/60">
                  Mi Cuenta
                </span>
                <h2 className="text-lg sm:text-xl font-bold tracking-[-0.02em]">
                  {user?.name || 'Perfil de Cliente'}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Link
                to="/pedidos"
                className="hidden sm:block text-sm sm:text-base font-medium text-text-secondary dark:text-white/70 hover:text-primary dark:hover:text-primary transition-colors"
              >
                Hacer Pedido
              </Link>

              <button
                onClick={() => {
                  logout(); // Call the logout function
                  navigate('/logout-success', { state: { name: user?.name } }); // Pass user's name
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full
                           bg-light dark:bg-primary/20 text-text-secondary dark:text-white"
                aria-label="Cerrar Sesión"
              >
                <span className="material-symbols-outlined text-2xl">
                  logout
                </span>
              </button>
            </div>
          </header>

          {/* Main content for profile form */}
          <main className="w-full max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl">
            <h1 className="text-3xl font-bold text-center text-dark dark:text-white mb-8">
              Completa tu Perfil
            </h1>

            {successMessage && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
                <span className="block sm:inline">{successMessage}</span>
              </div>
            )}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}
            {postalCodeApiError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                <span className="block sm:inline">{postalCodeApiError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nombre y Email (Read-only) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark dark:text-white mb-1">Nombre</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    readOnly
                    className="input-style bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark dark:text-white mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    readOnly
                    className="input-style bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Teléfono */}
              <div>
                <label className="block text-sm font-medium text-dark dark:text-white mb-1">Teléfono</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Ej. 5512345678"
                  className="input-style"
                />
              </div>

              {/* Dirección */}
              <h2 className="text-xl font-semibold text-dark dark:text-white mt-6 mb-4">Dirección</h2>
              {/* Código Postal (moved to top) */}
              <div>
                <label className="block text-sm font-medium text-dark dark:text-white mb-1">Código Postal</label>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  placeholder="Ej. 01234"
                  className="input-style"
                  maxLength="5"
                />
                {postalCodeApiLoading && <p className="text-sm text-primary mt-1">Buscando código postal...</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-dark dark:text-white mb-1">Calle y Número</label>
                <input
                  type="text"
                  name="street"
                  value={formData.street}
                  onChange={handleChange}
                  placeholder="Ej. Av. Siempre Viva 742"
                  className="input-style"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark dark:text-white mb-1">Colonia/Barrio</label>
                  <input
                    type="text"
                    name="neighborhood"
                    value={formData.neighborhood}
                    onChange={handleChange}
                    placeholder="Ej. Centro"
                    className="input-style"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark dark:text-white mb-1">Ciudad</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Ej. Ciudad de México"
                    className="input-style"
                  />
                </div>
              </div>
              

              {/* Referencias */}
              <div>
                <label className="block text-sm font-medium text-dark dark:text-white mb-1">Referencias Adicionales</label>
                <textarea
                  name="references"
                  value={formData.references}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Ej. Casa con portón rojo, a un lado de la tienda."
                  className="input-style resize-y"
                ></textarea>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading || postalCodeApiLoading}
                >
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </main>

          {/* Footer - Copied from OrderSelection.jsx */}
          <footer className="flex w-full flex-col items-center gap-6 py-10 text-center text-text-secondary dark:text-white/60">
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-8">
              <a
                href="#"
                className="text-sm sm:text-base hover:text-primary dark:hover:text-primary"
              >
                Ayuda y soporte
              </a>
              <a
                href="#"
                className="text-sm sm:text-base hover:text-primary dark:hover:text-primary"
              >
                Términos de servicio
              </a>
            </div>
            <p className="text-xs sm:text-sm">
              © {new Date().getFullYear()} Darmax. Todos los derechos reservados.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default ClientProfile;
