// src/pages/ForceChangePassword.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../layouts/MainLayout';
import Button from '../components/common/Button';
import { MdLock, MdVisibility, MdVisibilityOff, MdSecurity } from 'react-icons/md';
import apiClient from '../api/apiClient';
import Swal from 'sweetalert2';

const ForceChangePassword = () => {
    const { user, updateUser, logout } = useAuth();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (password.length < 6) {
            Swal.fire('Error', 'La contraseña debe tener al menos 6 caracteres.', 'error');
            return;
        }
        if (password !== confirmPassword) {
            Swal.fire('Error', 'Las contraseñas no coinciden.', 'error');
            return;
        }

        setLoading(true);
        try {
            const response = await apiClient.put(`/users/${user.id}`, {
                password: password,
                mustChangePassword: false
            });
            
            // El backend ahora devuelve { user, token }
            const { user: updatedUser, token: newToken } = response.data;
            
            updateUser(updatedUser, newToken);
            
            await Swal.fire({
                icon: 'success',
                title: '¡Contraseña Actualizada!',
                text: 'Tu acceso ahora es seguro. Bienvenido al sistema.',
                confirmButtonColor: '#3b82f6'
            });
            
            navigate('/login-success'); // Reiniciar el flujo de éxito para ir al dashboard correcto
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'No se pudo actualizar la contraseña. Intenta de nuevo.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <MainLayout>
            <div className="min-h-[85vh] flex flex-col justify-center items-center px-4 py-12 w-full font-display bg-gray-50 dark:bg-dark">
                <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-700 p-10 animate-in zoom-in-95 duration-300">
                    
                    <div className="text-center mb-10">
                        <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-3xl flex items-center justify-center mx-auto mb-6 text-amber-600 animate-bounce-slow">
                            <MdSecurity size={40} />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
                            Actualiza tu <br/><span className="text-primary">Contraseña Inicial</span>
                        </h1>
                        <p className="mt-4 text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                            Por seguridad, es obligatorio cambiar la contraseña temporal otorgada por administración antes de continuar.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div className="relative">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">Nueva Contraseña</label>
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
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">Confirmar Contraseña</label>
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
                                {loading ? 'Actualizando...' : 'Guardar y Continuar'}
                            </Button>
                        </div>
                    </form>

                    <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 text-center">
                        <button 
                            onClick={logout}
                            className="text-xs font-bold text-gray-400 hover:text-red-500 uppercase tracking-widest transition-colors"
                        >
                            Cancelar y Cerrar Sesión
                        </button>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default ForceChangePassword;
