import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchEmpleadoById } from '../../../api/apiClient'; // Assuming apiClient is structured this way

const EmpleadoDetalle = () => {
    const { id } = useParams();
    const [empleado, setEmpleado] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('info');

    useEffect(() => {
        const loadEmpleado = async () => {
            try {
                setLoading(true);
                const data = await fetchEmpleadoById(id);
                setEmpleado(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        loadEmpleado();
    }, [id]);

    const renderContent = () => {
        switch (activeTab) {
            case 'info':
                return <InfoGeneral empleado={empleado} />;
            case 'salario':
                return <div>Historial de Salario (próximamente)</div>;
            case 'documentos':
                return <div>Gestión de Documentos (próximamente)</div>;
            default:
                return null;
        }
    };

    if (loading) return <div className="p-6 text-center">Cargando datos del empleado...</div>;
    if (error) return <div className="p-6 text-center text-red-500">Error: {error}</div>;
    if (!empleado) return <div className="p-6 text-center">Empleado no encontrado.</div>;

    const TabButton = ({ tabName, label }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${
                activeTab === tabName
                    ? 'bg-primary text-white border-b-2 border-primary-dark'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
        >
            {label}
        </button>
    );

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-[#111418] dark:text-white">{empleado.nombreCompleto}</h1>
                    <p className="text-gray-500 dark:text-gray-400">{empleado.puesto}</p>
                </div>
                <Link to="/gestion/recursos-humanos" className="btn-secondary">
                    &larr; Volver a la lista
                </Link>
            </div>

             <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                <nav className="flex space-x-4">
                    <TabButton tabName="info" label="Información General" />
                    <TabButton tabName="salario" label="Historial de Salario" />
                    <TabButton tabName="documentos" label="Documentos" />
                </nav>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                {renderContent()}
            </div>
        </div>
    );
};

const InfoGeneral = ({ empleado }) => (
    <div className="space-y-4">
        <h3 className="text-xl font-bold mb-4">Detalles del Empleado</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <InfoItem label="Nombre Completo" value={empleado.nombreCompleto} />
            <InfoItem label="Puesto" value={empleado.puesto} />
            <InfoItem label="Sueldo Actual" value={new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(empleado.sueldo || 0)} />
            <InfoItem label="Jefe Inmediato" value={empleado.manager?.nombreCompleto || 'N/A'} />
            <InfoItem label="Teléfono" value={empleado.telefono || 'N/A'} />
            <InfoItem label="Email Personal" value={empleado.emailPersonal || 'N/A'} />
            <InfoItem label="Estatus" value={empleado.estatus} />
            <InfoItem label="Fecha de Contratación" value={new Date(empleado.fechaContratacion).toLocaleDateString('es-MX')} />
             {empleado.estatus === 'INACTIVO' && (
                <>
                    <InfoItem label="Fecha de Terminación" value={new Date(empleado.fechaTerminacion).toLocaleDateString('es-MX')} />
                    <InfoItem label="Motivo de Terminación" value={empleado.tipoTerminacion} />
                </>
            )}
        </div>
        <hr className="my-6 dark:border-gray-700"/>
        <h3 className="text-xl font-bold mb-4">Dirección</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <InfoItem label="Calle y Número" value={empleado.street || 'N/A'} />
            <InfoItem label="Colonia" value={empleado.neighborhood || 'N/A'} />
            <InfoItem label="Ciudad" value={empleado.city || 'N/A'} />
            <InfoItem label="Código Postal" value={empleado.postalCode || 'N/A'} />
        </div>
    </div>
);

const InfoItem = ({ label, value }) => (
    <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-base text-gray-800 dark:text-gray-200 font-semibold">{value}</p>
    </div>
);


export default EmpleadoDetalle;
