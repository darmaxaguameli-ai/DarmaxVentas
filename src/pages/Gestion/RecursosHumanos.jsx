import React from 'react';
import { Link } from 'react-router-dom';
import { useGestion } from './context/GestionContext';
import { FaUsers, FaUserCheck, FaUserTimes, FaFileAlt, FaMoneyBillWave, FaPlus } from 'react-icons/fa';

// A reusable stat card component
const StatCard = ({ icon, title, value, bgColorClass }) => (
    <div className={`p-6 rounded-lg shadow-lg flex items-center space-x-4 ${bgColorClass}`}>
        <div className="text-3xl">{icon}</div>
        <div>
            <p className="text-sm font-medium uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
        </div>
    </div>
);

// A card for quick navigation links
const QuickLinkCard = ({ to, icon, title, description }) => (
    <Link to={to} className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
        <div className="flex items-center space-x-4">
            <div className="text-2xl text-primary">{icon}</div>
            <div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">{title}</h3>
                <p className="text-gray-500 dark:text-gray-400">{description}</p>
            </div>
        </div>
    </Link>
);


const RecursosHumanos = () => {
    const { state } = useGestion();
    const { empleados, loading, error } = state;

    if (loading) return <div className="p-6 text-center">Cargando datos de Recursos Humanos...</div>;
    if (error) return <div className="p-6 text-center text-red-500">Error: {error}</div>;

    const totalEmpleados = empleados.length;
    const empleadosActivos = empleados.filter(e => e.estatus === 'ACTIVO').length;
    const empleadosInactivos = empleados.filter(e => e.estatus === 'INACTIVO').length;
    
    // Get the 5 most recently hired employees
    const contratacionesRecientes = [...empleados]
        .sort((a, b) => new Date(b.fechaContratacion) - new Date(a.fechaContratacion))
        .slice(0, 5);

    return (
        <div className="space-y-8">
            <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold text-[#111418] dark:text-white">
                    Módulo de Recursos Humanos
                </h1>
                <Link to="/gestion/empleados" className="btn-primary flex items-center gap-2">
                    <FaUsers />
                    <span>Gestionar Empleados</span>
                </Link>
            </div>

            {/* Stat Cards Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard 
                    icon={<FaUsers />}
                    title="Total de Empleados"
                    value={totalEmpleados}
                    bgColorClass="bg-blue-500 text-white"
                />
                <StatCard 
                    icon={<FaUserCheck />}
                    title="Empleados Activos"
                    value={empleadosActivos}
                    bgColorClass="bg-green-500 text-white"
                />
                <StatCard 
                    icon={<FaUserTimes />}
                    title="Empleados Inactivos"
                    value={empleadosInactivos}
                    bgColorClass="bg-red-500 text-white"
                />
            </div>
            
            {/* Quick Links Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <QuickLinkCard 
                    to="/gestion/empleados"
                    icon={<FaUsers />}
                    title="Lista de Empleados"
                    description="Ver, agregar, editar y eliminar empleados."
                />
                                                                <QuickLinkCard
                                                                    to="/gestion/empleados" // Points to the same page to add a new one
                                                                    icon={<FaPlus />}
                                                                    title="Agregar Nuevo Empleado"
                                                                    description="Ir directamente a la gestión para añadir un nuevo miembro."
                                                                />            </div>

            {/* Recent Hires Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-xl font-bold mb-4">Contrataciones Recientes</h3>
                {contratacionesRecientes.length > 0 ? (
                    <ul className="space-y-3">
                        {contratacionesRecientes.map(empleado => (
                            <Link key={empleado.id} to={`/gestion/recursos-humanos/${empleado.id}`}>
                                <li className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                                    <div>
                                        <p className="font-semibold text-gray-800 dark:text-gray-200">{empleado.nombreCompleto}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{empleado.puesto}</p>
                                    </div>
                                    <span className="text-sm text-gray-600 dark:text-gray-300">
                                        {new Date(empleado.fechaContratacion).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </span>
                                </li>
                            </Link>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-500 dark:text-gray-400">No hay contrataciones recientes.</p>
                )}
            </div>
        </div>
    );
};

export default RecursosHumanos;