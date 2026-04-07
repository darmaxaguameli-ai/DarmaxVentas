import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import apiClient from '../api/apiClient';
import MainLayout from "../layouts/MainLayout";
import Button from "../components/common/Button";
import { MdLock, MdVisibility, MdVisibilityOff, MdSecurity } from 'react-icons/md';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      await apiClient.post('/reset-password', { token, newPassword: password });
      
      await Swal.fire({
        icon: 'success',
        title: '¡Contraseña Restablecida!',
        text: 'Tu seguridad es nuestra prioridad. Ya puedes iniciar sesión con tu nueva clave.',
        confirmButtonColor: '#3b82f6'
      });
      navigate('/login');

    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Token Inválido',
        text: error.response?.data?.error || 'El enlace ha expirado o ya ha sido utilizado.',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!token) return null;

  return (
    <MainLayout>
      <div className="min-h-[85vh] flex flex-col justify-center items-center px-4 py-12 w-full font-display bg-gray-50 dark:bg-dark">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-700 p-10 animate-in zoom-in-95 duration-300">
          
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6 text-primary">
                <MdSecurity size={40} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                Nueva Contraseña
            </h1>
            <p className="mt-3 text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                Establece una contraseña segura para recuperar el acceso a tu cuenta.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                <div className="relative">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5 ml-1 italic">Contraseña Nueva</label>
                    <div className="relative flex items-center bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                        <div className="pl-4 text-gray-400"><MdLock size={20} /></div>
                        <input
                            type={showPassword ? "text" : "password"}
                            className="w-full py-4 px-4 bg-transparent outline-none text-gray-800 dark:text-white font-bold"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="p-4 text-gray-400 hover:text-primary transition-colors"
                        >
                            {showPassword ? <MdVisibilityOff size={20}/> : <MdVisibility size={20}/>}
                        </button>
                    </div>
                </div>

                <div className="relative">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5 ml-1 italic">Confirmar Contraseña</label>
                    <div className="relative flex items-center bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                        <div className="pl-4 text-gray-400"><MdLock size={20} /></div>
                        <input
                            type={showPassword ? "text" : "password"}
                            className="w-full py-4 px-4 bg-transparent outline-none text-gray-800 dark:text-white font-bold"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>
                </div>
            </div>

            <div className="pt-4">
                <Button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 text-lg shadow-xl shadow-primary/20"
                >
                    {loading ? 'Procesando...' : 'Cambiar Contraseña'}
                </Button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 text-center">
              <Link to="/login" className="text-xs font-bold text-gray-400 hover:text-primary uppercase tracking-widest transition-colors">
                Cancelar y volver
              </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ResetPassword;
