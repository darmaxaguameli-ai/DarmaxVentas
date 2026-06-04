import React, { useState, useEffect } from 'react';
import { FaBalanceScale, FaFileContract, FaPlus, FaEdit, FaTrash, FaEye, FaDownload } from 'react-icons/fa';
import { fetchLegalDocuments, createLegalDocument, updateLegalDocument, deleteLegalDocument } from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';

const Legal = () => {
    const { user } = useAuth();
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const isAdmin = user?.roles?.some(r => r.name === 'ADMIN') || user?.role === 'ADMIN';

    const loadDocuments = async () => {
        setLoading(true);
        try {
            const data = await fetchLegalDocuments();
            setDocuments(data);
        } catch (error) {
            console.error('Error loading documents:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDocuments();
    }, []);

    const handleAddOrEdit = async (doc = null) => {
        const { value: formValues } = await Swal.fire({
            title: doc ? 'Editar Contrato' : 'Nuevo Contrato',
            html: `
                <div class="space-y-4 text-left p-2">
                    <div>
                        <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre del Contrato</label>
                        <input id="swal-input1" class="swal2-input w-full m-0" placeholder="Ej: Contrato de Arrendamiento" value="${doc?.nombre || ''}">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Descripción / Notas</label>
                        <textarea id="swal-input2" class="swal2-textarea w-full m-0 h-24" placeholder="Detalles del documento...">${doc?.descripcion || ''}</textarea>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Archivo del Contrato (PDF/Word)</label>
                        <input type="file" id="swal-input3" class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all mt-2" accept=".pdf,.doc,.docx">
                        ${doc ? `<p class="text-[10px] text-gray-400 mt-2">Archivo actual: <span class="text-primary truncate">${doc.archivoUrl}</span></p>` : ''}
                    </div>
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: doc ? 'Actualizar' : 'Subir y Guardar',
            cancelButtonText: 'Cancelar',
            showLoaderOnConfirm: true,
            preConfirm: async () => {
                const nombre = document.getElementById('swal-input1').value;
                const descripcion = document.getElementById('swal-input2').value;
                const archivoInput = document.getElementById('swal-input3');
                const file = archivoInput.files[0];

                if (!nombre) {
                    Swal.showValidationMessage('El nombre es obligatorio');
                    return false;
                }

                if (!doc && !file) {
                    Swal.showValidationMessage('Debes seleccionar un archivo para el nuevo contrato');
                    return false;
                }

                try {
                    let archivoUrl = doc?.archivoUrl;

                    // Si hay un nuevo archivo, subirlo primero
                    if (file) {
                        const formData = new FormData();
                        formData.append('archivo', file);
                        const uploadRes = await uploadLegalDocument(formData);
                        archivoUrl = uploadRes.url;
                    }

                    return { nombre, descripcion, archivoUrl };
                } catch (error) {
                    Swal.showValidationMessage(`Error al subir: ${error.message}`);
                }
            }
        });

        if (formValues) {
            try {
                if (doc) {
                    await updateLegalDocument(doc.id, formValues);
                    Swal.fire('¡Actualizado!', 'El contrato ha sido actualizado.', 'success');
                } else {
                    await createLegalDocument(formValues);
                    Swal.fire('¡Guardado!', 'El contrato se ha subido correctamente.', 'success');
                }
                loadDocuments();
            } catch (error) {
                Swal.fire('Error', 'No se pudo guardar la información en la base de datos.', 'error');
            }
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "Esta acción no se puede deshacer.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, borrar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await deleteLegalDocument(id);
                Swal.fire('Borrado', 'El documento ha sido eliminado.', 'success');
                loadDocuments();
            } catch (error) {
                Swal.fire('Error', error.message || 'No se pudo eliminar el documento.', 'error');
            }
        }
    };

    return (
        <div className="animate-fade-in space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-wrap justify-between items-center gap-6">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-black text-gray-800 dark:text-white flex items-center gap-4 tracking-tighter uppercase italic">
                        <div className="bg-primary p-3 rounded-2xl shadow-lg shadow-primary/20 text-white">
                            <FaBalanceScale className="text-2xl" />
                        </div> 
                        ÁREA LEGAL
                    </h1>
                    <div className="text-xs sm:text-sm text-gray-500 font-bold mt-2 flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div> 
                        Gestión de contratos y documentos legales
                    </div>
                </div>
                <button 
                    onClick={() => handleAddOrEdit()}
                    className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-primary/30 flex items-center gap-2 active:scale-95 transition-all"
                >
                    <FaPlus /> Nuevo Contrato
                </button>
            </div>

            {/* List Section */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 border border-gray-100 dark:border-gray-700 animate-pulse h-48"></div>
                    ))}
                </div>
            ) : documents.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-[3rem] border border-gray-100 dark:border-gray-700 shadow-sm p-10 text-center">
                    <div className="max-w-md mx-auto space-y-6">
                        <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-3xl flex items-center justify-center mx-auto text-gray-400">
                            <FaFileContract size={40} />
                        </div>
                        <h2 className="text-xl font-black text-gray-800 dark:text-white uppercase tracking-tight">No hay contratos registrados</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                            Comienza añadiendo el primer documento legal o contrato del sistema.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {documents.map((doc) => (
                        <div key={doc.id} className="group bg-white dark:bg-gray-800 rounded-[2rem] border border-gray-100 dark:border-gray-700 p-6 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden">
                            {/* Accent line */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-primary transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                            
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-2xl text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                                    <FaFileContract size={20} />
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => handleAddOrEdit(doc)}
                                        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all"
                                        title="Editar"
                                    >
                                        <FaEdit size={14} />
                                    </button>
                                    {isAdmin && (
                                        <button 
                                            onClick={() => handleDelete(doc.id)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                                            title="Borrar"
                                        >
                                            <FaTrash size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <h3 className="text-lg font-black text-gray-800 dark:text-white uppercase tracking-tight line-clamp-1 mb-2">
                                {doc.nombre}
                            </h3>
                            
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-6 min-h-[32px]">
                                {doc.descripcion || 'Sin descripción adicional.'}
                            </p>

                            <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-gray-700">
                                <span className="text-[10px] font-bold text-gray-400 uppercase">
                                    {new Date(doc.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                                <button 
                                    onClick={() => {
                                        // Obtener el token para la descarga protegida
                                        const token = localStorage.getItem('token');
                                        const url = `${import.meta.env.VITE_API_URL || '/api'}/legal/archivo/${doc.id}`;
                                        
                                        // Abrir en nueva pestaña enviando el token (usando el proxy del servidor)
                                        fetch(url, {
                                            headers: { 'Authorization': `Bearer ${token}` }
                                        })
                                        .then(res => {
                                            if (!res.ok) throw new Error('No tienes permiso para ver este archivo.');
                                            return res.blob();
                                        })
                                        .then(blob => {
                                            const fileURL = URL.createObjectURL(blob);
                                            window.open(fileURL, '_blank');
                                        })
                                        .catch(err => Swal.fire('Error', err.message, 'error'));
                                    }}
                                    className="flex items-center gap-2 text-[10px] font-black uppercase text-primary hover:bg-primary hover:text-white px-3 py-1.5 rounded-lg border border-primary/20 transition-all"
                                >
                                    <FaEye /> Ver Archivo
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Legal;
