import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import axios from 'axios';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      Swal.fire({
        icon: 'error',
        title: 'Enlace inválido',
        text: 'El enlace de recuperación no es válido o ha expirado.',
        confirmButtonColor: '#3b82f6'
      }).then(() => {
        navigate('/login');
      });
    }
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      Swal.fire('Error', 'Las contraseñas no coinciden.', 'error');
      return;
    }
    if (password.length < 6) {
        Swal.fire('Error', 'La contraseña debe tener al menos 6 caracteres.', 'error');
        return;
    }

    setLoading(true);
    try {
      await axios.post('/api/reset-password', { token, newPassword: password });
      
      await Swal.fire({
        icon: 'success',
        title: '¡Contraseña Restablecida!',
        text: 'Ahora puedes iniciar sesión con tu nueva contraseña.',
        confirmButtonColor: '#3b82f6'
      });
      navigate('/login');

    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.error || 'El token ha expirado o es inválido.',
        confirmButtonColor: '#3b82f6'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!token) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-gray-900 dark:text-white">Nueva Contraseña</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
            Ingresa tu nueva contraseña a continuación.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              Nueva Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              Confirmar Contraseña
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl shadow-lg shadow-primary/30 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                Actualizando...
              </>
            ) : (
              'Cambiar Contraseña'
            )}
          </button>
          
          <div className="text-center mt-4">
              <Link to="/login" className="text-sm font-bold text-gray-500 hover:text-primary transition-colors">
                Cancelar
              </Link>
            </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
