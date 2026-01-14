import { useState } from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import axios from 'axios';
import MainLayout from "../layouts/MainLayout";
import Button from "../components/common/Button";
import { MdEmail, MdArrowBack, MdMarkEmailRead } from 'react-icons/md';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/forgot-password', { email });
      setSent(true);
      Swal.fire({
        icon: 'success',
        title: 'Correo enviado',
        text: 'Si el correo existe, recibirás un enlace para restablecer tu contraseña.',
        confirmButtonColor: '#3b82f6'
      });
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Hubo un problema al procesar tu solicitud. Intenta de nuevo.',
        confirmButtonColor: '#3b82f6'
      });
    } finally {
      setLoading(false);
    }
  };

  const InputField = ({ label, type, value, onChange, placeholder, icon, required = true }) => (
    <div className="mb-6 text-left">
      <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5 ml-1">
        {label}
      </label>
      <div className="relative flex items-center bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-300 dark:border-gray-600 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
        {icon && <div className="pl-4 text-gray-400 dark:text-gray-500 text-xl">{icon}</div>}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className="w-full py-3.5 px-4 bg-transparent outline-none text-gray-800 dark:text-white placeholder:text-gray-400 text-base"
        />
      </div>
    </div>
  );

  return (
    <MainLayout>
      <div className="min-h-[80vh] flex flex-col justify-center items-center px-4 py-8 w-full font-display">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-700 p-8 sm:p-10 transition-all overflow-hidden">
          
          <div className="mb-8">
            <Link to="/login" className="inline-flex items-center text-gray-400 hover:text-primary transition-colors text-sm font-bold gap-1">
                <MdArrowBack /> VOLVER AL LOGIN
            </Link>
          </div>

          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary animate-fade-in">
                <span className="material-symbols-outlined text-4xl">lock_reset</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                ¿Olvidaste tu acceso?
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm sm:text-base">
                Ingresa tu correo para recuperar tu contraseña
            </p>
          </div>

          {sent ? (
            <div className="text-center animate-fade-in py-4">
              <div className="w-20 h-20 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 dark:text-green-400 border-2 border-green-100 dark:border-green-800">
                <MdMarkEmailRead className="text-4xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-3">¡Correo Enviado!</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-8 leading-relaxed">
                Hemos enviado las instrucciones a tu correo. Por favor revisa tu bandeja de entrada y tu carpeta de spam.
              </p>
              <Link 
                to="/login"
                className="inline-block w-full py-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white font-bold rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Regresar al Inicio
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="animate-slide-up">
              <InputField 
                label="Correo Electrónico"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                icon={<MdEmail />}
              />

              <Button
                type="submit"
                disabled={loading}
                className="w-full py-4 text-lg shadow-lg shadow-primary/25 mt-2"
              >
                {loading ? 'Enviando...' : 'Enviar Instrucciones'}
              </Button>

              <p className="mt-8 text-center text-xs text-gray-400 px-4 leading-relaxed uppercase tracking-widest font-medium">
                Verifica que el correo sea el mismo con el que te registraste
              </p>
            </form>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default ForgotPassword;
