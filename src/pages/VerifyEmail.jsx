import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setVerifying(false);
        Swal.fire({
            icon: 'error',
            title: 'Enlace inválido',
            text: 'No se encontró un token de verificación.',
            confirmButtonText: 'Ir al Login'
        }).then(() => navigate('/login'));
        return;
      }

      try {
        await axios.post('/api/verify-email', { token });
        
        await Swal.fire({
            icon: 'success',
            title: '¡Correo Verificado!',
            text: 'Tu cuenta ha sido activada correctamente.',
            confirmButtonColor: '#3b82f6',
            confirmButtonText: 'Iniciar Sesión'
        });
        
        navigate('/login');

      } catch (error) {
        console.error(error);
        Swal.fire({
            icon: 'error',
            title: 'Error de verificación',
            text: error.response?.data?.error || 'El enlace ha expirado o es inválido.',
            confirmButtonText: 'Ir al Login'
        }).then(() => navigate('/login'));
      } finally {
        setVerifying(false);
      }
    };

    verify();
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        {verifying ? (
            <>
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
                <h2 className="text-xl font-bold text-gray-700 dark:text-gray-200">Verificando tu correo...</h2>
            </>
        ) : (
            <p className="text-gray-500">Redirigiendo...</p>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
