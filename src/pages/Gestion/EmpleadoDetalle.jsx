import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchEmpleadoById, uploadDocumento } from '@/api/apiClient'; // Import uploadDocumento
import Swal from 'sweetalert2';
import { useGestion } from './context/GestionContext';
import EmpleadoModal from './components/EmpleadoModal';
import { formatDate, formatCurrency } from '@/utils/formatters';

// Enum for document types, mirroring prisma schema
const TipoDocumento = {
  INE: 'INE',
  CONTRATO: 'CONTRATO',
  COMPROBANTE_DOMICILIO: 'COMPROBANTE_DOMICILIO',
  OTRO: 'OTRO',
};

const GestionDocumentos = ({ empleado, reloadEmpleado }) => {
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState(TipoDocumento.OTRO);
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !nombre || !tipo) {
      Swal.fire('Campos incompletos', 'Por favor, completa el nombre, tipo y selecciona un archivo.', 'warning');
      return;
    }

    const formData = new FormData();
    formData.append('nombre', nombre);
    formData.append('tipo', tipo);
    formData.append('file', file);

    setIsUploading(true);
    try {
      await uploadDocumento(empleado.id, formData);
      Swal.fire('Éxito', 'Documento subido correctamente.', 'success');
      // Reset form and reload employee data
      setNombre('');
      setTipo(TipoDocumento.OTRO);
      setFile(null);
      e.target.reset(); // Reset file input
      await reloadEmpleado();
    } catch (error) {
      Swal.fire('Error', `Error al subir el documento: ${error.message}`, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-bold mb-4">Subir Nuevo Documento</h3>
        <form onSubmit={handleSubmit} className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg border dark:border-gray-700 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-style">Nombre del Documento</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Contrato 2024"
                required
                className="input-style"
              />
            </div>
            <div>
              <label className="label-style">Tipo de Documento</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                required
                className="input-style"
              >
                {Object.values(TipoDocumento).map(tipo => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label-style">Archivo</label>
            <input
              type="file"
              onChange={handleFileChange}
              required
              className="block w-full text-sm text-gray-900 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-l-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
            />
          </div>
          <div className="text-right">
            <button type="submit" className="btn-primary" disabled={isUploading}>
              {isUploading ? 'Subiendo...' : 'Subir Documento'}
            </button>
          </div>
        </form>
      </div>

      <div>
        <h3 className="text-xl font-bold mb-4">Documentos Existentes</h3>
        {empleado.documentos && empleado.documentos.length > 0 ? (
          <ul className="divide-y dark:divide-gray-700">
            {empleado.documentos.map(doc => (
              <li key={doc.id} className="py-3 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-200">{doc.nombre}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{doc.tipo}</p>
                </div>
                <a 
                  href={doc.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn-secondary text-sm"
                >
                  Ver Documento
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">No hay documentos registrados para este empleado.</p>
        )}
      </div>
    </div>
  );
};


const HistorialSalario = ({ empleado }) => {
    const historial = empleado?.historialSueldos || [];

    return (
        <div className="space-y-4">
            <h3 className="text-xl font-bold mb-4">Historial de Salarios</h3>
            {historial.length > 0 ? (
                <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Sueldo</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha de Inicio</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha de Fin</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Motivo del Cambio</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {historial.map(record => (
                                <tr key={record.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(record.sueldo)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{formatDate(record.fechaInicio)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{record.fechaFin ? formatDate(record.fechaFin) : 'Actual'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{record.motivo || 'N/A'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="text-gray-500 dark:text-gray-400">No hay historial de salarios registrado para este empleado.</p>
            )}
        </div>
    );
};


const EmpleadoDetalle = () => {
    const { id } = useParams();
    const [empleado, setEmpleado] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('info');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { state: gestionState, updateEmpleado } = useGestion();
    const { empleados: allEmpleados } = gestionState;

    const handleOpenModal = () => setIsModalOpen(true);
    const handleCloseModal = () => setIsModalOpen(false);

    const handleSaveEmpleado = async (empleadoData) => {
        await updateEmpleado(id, empleadoData);
        await loadEmpleado(); // Recargar datos del empleado después de guardar
    };


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

    useEffect(() => {
        loadEmpleado();
    }, [id]);

    const renderContent = () => {
        switch (activeTab) {
            case 'info':
                return <InfoGeneral empleado={empleado} />;
            case 'salario':
                return <HistorialSalario empleado={empleado} />;
            case 'documentos':
                return <GestionDocumentos empleado={empleado} reloadEmpleado={loadEmpleado} />;
            default:
                return null;
        }
    };

    if (loading && !empleado) return <div className="p-6 text-center">Cargando datos del empleado...</div>;
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
            <div className="flex flex-wrap justify-between items-center mb-6 gap-2">
                <div>
                    <h1 className="text-3xl font-bold text-[#111418] dark:text-white">{empleado.nombreCompleto}</h1>
                    <p className="text-gray-500 dark:text-gray-400">{empleado.puesto}</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleOpenModal} className="btn-primary">
                        Editar Empleado
                    </button>
                    <Link to="/gestion/recursos-humanos" className="btn-secondary">
                        &larr; Volver a la lista
                    </Link>
                </div>
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

            {isModalOpen && (
                <EmpleadoModal
                    onClose={handleCloseModal}
                    onSave={handleSaveEmpleado}
                    empleadoToEdit={empleado}
                    empleados={allEmpleados}
                />
            )}
        </div>
    );
};

const InfoGeneral = ({ empleado }) => (
    <div className="space-y-4">
        <h3 className="text-xl font-bold mb-4">Detalles del Empleado</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <InfoItem label="Nombre Completo" value={empleado.nombreCompleto} />
            <InfoItem label="Puesto" value={empleado.puesto} />
            <InfoItem label="Sueldo Actual" value={formatCurrency(empleado.sueldo || 0)} />
            <InfoItem label="Jefe Inmediato" value={empleado.manager?.nombreCompleto || 'N/A'} />
            <InfoItem label="Teléfono" value={empleado.telefono || 'N/A'} />
            <InfoItem label="Email Personal" value={empleado.emailPersonal || 'N/A'} />
            <InfoItem label="Estatus" value={empleado.estatus} />
            <InfoItem label="Fecha de Contratación" value={formatDate(empleado.fechaContratacion)} />
             {empleado.estatus === 'INACTIVO' && (
                <>
                    <InfoItem label="Fecha de Terminación" value={formatDate(empleado.fechaTerminacion)} />
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
