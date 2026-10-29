import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from './context/NotificationContext';
import apiClient, { createNotification } from '../../api/apiClient';
import Swal from 'sweetalert2';
import { toast } from 'sonner';
import { 
    FaPlus, FaEdit, FaTrash, FaStar, FaRegStar, FaCalendarAlt, 
    FaComments, FaCheckCircle, FaRocket, FaUserCheck, FaFilter, 
    FaClock, FaTasks, FaAward, FaSearch, FaUserAstronaut, 
    FaLightbulb, FaExchangeAlt, FaRegSmileBeam,
    FaStream, FaChartBar, FaThList, FaThLarge, FaInfoCircle,
    FaFolderPlus, FaFolderOpen, FaLayerGroup, FaUserTie,
    FaUsers, FaEye, FaTimes
} from 'react-icons/fa';
import { 
    format, parseISO, differenceInDays, isAfter, isBefore, 
    addDays 
} from 'date-fns';
import { es } from 'date-fns/locale';

// Estados del flujo de trabajo en lenguaje cotidiano y claro
const WORK_COLUMNS = [
    { 
        id: 'POR_HACER', 
        title: '💡 Por Empezar', 
        subtitle: 'Actividades programadas',
        badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' 
    },
    { 
        id: 'EN_PROCESO', 
        title: '⚡ En Marcha', 
        subtitle: 'En desarrollo activo',
        badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' 
    },
    { 
        id: 'EN_REVISION', 
        title: '🧪 En Pruebas', 
        subtitle: 'Revisión y validación',
        badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' 
    },
    { 
        id: 'TERMINADO', 
        title: '🚀 Concluido', 
        subtitle: 'Entregado con éxito',
        badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' 
    }
];

// Datos demo iniciales de Proyectos
const INITIAL_DEMO_PROJECTS = [
    {
        id: 'proj-1',
        nombre: 'Terminales de Cobro y Pagos Digitales',
        descripcion: 'Conexión con terminales de tarjeta y validación de transferencias en tiempo real.',
        fechaInicio: format(new Date(), 'yyyy-MM-dd'),
        fechaFin: format(addDays(new Date(), 20), 'yyyy-MM-dd'),
        estado: 'ACTIVO'
    },
    {
        id: 'proj-2',
        nombre: 'Control y Monitoreo de Repartidores',
        descripcion: 'Seguimiento de rutas de entrega y optimización de tiempos en pedidos.',
        fechaInicio: format(addDays(new Date(), -5), 'yyyy-MM-dd'),
        fechaFin: format(addDays(new Date(), 25), 'yyyy-MM-dd'),
        estado: 'ACTIVO'
    }
];

// Datos demo iniciales de Actividades
const INITIAL_DEMO_TASKS = [
    {
        id: 'task-1',
        proyectoId: 'proj-1',
        proyectoNombre: 'Terminales de Cobro y Pagos Digitales',
        titulo: 'Módulo de Cobro con Tarjeta en Mostrador',
        descripcion: 'Conectar el lector de tarjetas con el sistema de ventas para imprimir el voucher directo.',
        prioridad: 'ALTA',
        estado: 'EN_PROCESO',
        fechaInicio: format(new Date(), 'yyyy-MM-dd'),
        fechaFin: format(addDays(new Date(), 8), 'yyyy-MM-dd'),
        progreso: 60,
        responsableId: 'dev-1',
        responsableNombre: 'Carlos Programador',
        notas: [
            {
                id: 'n-1',
                autor: 'Carlos Programador',
                autorId: 'dev-1',
                tipo: 'BLOQUEO',
                mensaje: 'Esta semana me salieron urgencias de soporte técnico con las impresoras de tickets y no alcancé a cerrar el módulo. Ya lo retomé.',
                fecha: new Date(Date.now() - 86400000 * 2).toISOString()
            }
        ],
        evaluaciones: [
            {
                id: 'ev-1',
                jefeNombre: 'Líder de Sistemas',
                estrellas: 5,
                felicitacion: '¡Excelente trabajo en la integración del lector! Quedó muy rápido y confiable.',
                puntosMejora: 'Podemos agregar una pequeña guía visual para el personal de mostrador.',
                fecha: new Date(Date.now() - 86400000).toISOString()
            }
        ]
    },
    {
        id: 'task-3',
        proyectoId: 'proj-2',
        proyectoNombre: 'Control y Monitoreo de Repartidores',
        titulo: 'Mapa de Rutas y Ubicación en Tiempo Real',
        descripcion: 'Visualización de choferes en el mapa de reparto para calcular tiempos de llegada.',
        prioridad: 'MEDIA',
        estado: 'POR_HACER',
        fechaInicio: format(addDays(new Date(), 2), 'yyyy-MM-dd'),
        fechaFin: format(addDays(new Date(), 16), 'yyyy-MM-dd'),
        progreso: 10,
        responsableNombre: 'Carlos Programador',
        responsableId: 'dev-1',
        notas: [],
        evaluaciones: []
    }
];

const LOCAL_STORAGE_TASKS = 'darmax_sistemas_tasks_v2';
const LOCAL_STORAGE_PROJECTS = 'darmax_sistemas_projects_v2';

const Sistemas = () => {
    const { user: authUser, hasPermission } = useAuth();
    const { addNotification } = useNotification();

    // Detección estricta de Jefe vs Colaborador
    const isRealJefe = authUser?.role === 'ADMIN' || 
                        hasPermission('canManageSistemas') ||
                        authUser?.roles?.some(r => r.name?.toUpperCase() === 'ADMIN' || r.canManageSistemas === true);

    // Si es Colaborador queda bloqueado en Colaborador; si es Jefe puede probar vista previa
    const [viewAsRole, setViewAsRole] = useState(isRealJefe ? 'JEFE' : 'COLABORADOR');
    const isJefe = isRealJefe && viewAsRole === 'JEFE';

    // Estados principales
    const [projects, setProjects] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [teamUsers, setTeamUsers] = useState([]);

    // Filtros y vistas
    const [viewMode, setViewMode] = useState('TABLERO'); // 'TABLERO' | 'GANTT' | 'NOTAS'
    const [selectedProjectId, setSelectedProjectId] = useState('TODOS');
    const [filterCollaborator, setFilterCollaborator] = useState('TODOS');
    const [searchQuery, setSearchQuery] = useState('');

    // Modales
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
    const [isPraiseModalOpen, setIsPraiseModalOpen] = useState(false);
    const [isDateModalOpen, setIsDateModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const [selectedTask, setSelectedTask] = useState(null);
    const [selectedProject, setSelectedProject] = useState(null);
    const [detailTask, setDetailTask] = useState(null);
    const [detailSubTab, setDetailSubTab] = useState('NOTAS'); // 'NOTAS' | 'RECONOCIMIENTOS'
    const [mobileActiveColumn, setMobileActiveColumn] = useState('POR_HACER');

    // Formularios
    const [projectForm, setProjectForm] = useState({
        nombre: '',
        descripcion: '',
        fechaInicio: format(new Date(), 'yyyy-MM-dd'),
        fechaFin: format(addDays(new Date(), 30), 'yyyy-MM-dd')
    });

    const [taskForm, setTaskForm] = useState({
        proyectoId: '',
        proyectoNombre: '',
        titulo: '',
        descripcion: '',
        prioridad: 'MEDIA',
        estado: 'POR_HACER',
        fechaInicio: format(new Date(), 'yyyy-MM-dd'),
        fechaFin: format(addDays(new Date(), 14), 'yyyy-MM-dd'),
        progreso: 0,
        responsableId: '',
        responsableNombre: '',
        responsables: []
    });

    const [noteForm, setNoteForm] = useState({
        mensaje: '',
        tipo: 'BLOQUEO'
    });

    const [praiseForm, setPraiseForm] = useState({
        estrellas: 5,
        felicitacion: '',
        puntosMejora: ''
    });

    const [dateForm, setDateForm] = useState({
        fechaInicio: '',
        fechaFin: '',
        motivo: ''
    });

    // Cargar datos
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // Cargar usuarios para asignar (filtrando colaboradores inactivos)
            try {
                const [uRes, empRes] = await Promise.allSettled([
                    apiClient.get('/users'),
                    apiClient.get('/hr/empleados')
                ]);

                const usersList = (uRes.status === 'fulfilled' && Array.isArray(uRes.value?.data)) ? uRes.value.data : [];
                const empList = (empRes.status === 'fulfilled' && Array.isArray(empRes.value?.data)) ? empRes.value.data : [];

                const inactiveUserIds = new Set();
                const inactiveNames = new Set();
                const inactiveEmails = new Set();

                empList.forEach(emp => {
                    if (emp.estatus === 'INACTIVO') {
                        if (emp.userId) inactiveUserIds.add(emp.userId);
                        if (emp.nombreCompleto) inactiveNames.add(emp.nombreCompleto.trim().toLowerCase());
                        if (emp.emailPersonal) inactiveEmails.add(emp.emailPersonal.trim().toLowerCase());
                    }
                });

                const activeColaboradores = usersList.filter(u => {
                    const isColaborador = u.type === 'COLABORADOR' || (u.role && u.role !== 'CLIENTE');
                    if (!isColaborador) return false;

                    // Si está marcado como inactivo directamente
                    if (u.status === 'INACTIVO' || u.status === 'INACTIVE' || u.estatus === 'INACTIVO' || u.isActive === false) return false;
                    // Si su ficha de empleado está inactiva
                    if (u.empleado?.estatus === 'INACTIVO') return false;
                    // Si coincide con baja en RH por id, email o nombre
                    if (u.id && inactiveUserIds.has(u.id)) return false;
                    if (u.email && inactiveEmails.has(u.email.trim().toLowerCase())) return false;
                    if (u.name && inactiveNames.has(u.name.trim().toLowerCase())) return false;

                    return true;
                });

                setTeamUsers(activeColaboradores);
            } catch (e) {
                console.log('Modo sin usuarios de API');
            }

            // Cargar proyectos
            try {
                const pRes = await apiClient.get('/sistemas/projects');
                if (Array.isArray(pRes.data) && pRes.data.length > 0) {
                    setProjects(pRes.data);
                } else {
                    const localP = localStorage.getItem(LOCAL_STORAGE_PROJECTS);
                    setProjects(localP ? JSON.parse(localP) : INITIAL_DEMO_PROJECTS);
                }
            } catch {
                const localP = localStorage.getItem(LOCAL_STORAGE_PROJECTS);
                setProjects(localP ? JSON.parse(localP) : INITIAL_DEMO_PROJECTS);
            }

            // Cargar tareas
            try {
                const tRes = await apiClient.get('/sistemas/tasks');
                if (Array.isArray(tRes.data) && tRes.data.length > 0) {
                    const cleanTasks = tRes.data.filter(t => !t.responsableNombre?.toLowerCase().includes('ana'));
                    setTasks(cleanTasks);
                    localStorage.setItem(LOCAL_STORAGE_TASKS, JSON.stringify(cleanTasks));
                } else {
                    const localT = localStorage.getItem(LOCAL_STORAGE_TASKS);
                    const rawList = localT ? JSON.parse(localT) : INITIAL_DEMO_TASKS;
                    const cleanTasks = (Array.isArray(rawList) ? rawList : []).filter(t => !t.responsableNombre?.toLowerCase().includes('ana') && t.id !== 'task-2');
                    setTasks(cleanTasks);
                    localStorage.setItem(LOCAL_STORAGE_TASKS, JSON.stringify(cleanTasks));
                }
            } catch {
                const localT = localStorage.getItem(LOCAL_STORAGE_TASKS);
                const rawList = localT ? JSON.parse(localT) : INITIAL_DEMO_TASKS;
                const cleanTasks = (Array.isArray(rawList) ? rawList : []).filter(t => !t.responsableNombre?.toLowerCase().includes('ana') && t.id !== 'task-2');
                setTasks(cleanTasks);
                localStorage.setItem(LOCAL_STORAGE_TASKS, JSON.stringify(cleanTasks));
            }
        } finally {
            setLoading(false);
        }
    };

    const persistProjects = async (newList) => {
        setProjects(newList);
        localStorage.setItem(LOCAL_STORAGE_PROJECTS, JSON.stringify(newList));
        try {
            await apiClient.post('/sistemas/projects/sync', { projects: newList });
        } catch {}
    };

    const persistTasks = async (newList) => {
        setTasks(newList);
        localStorage.setItem(LOCAL_STORAGE_TASKS, JSON.stringify(newList));
        try {
            await apiClient.post('/sistemas/tasks/sync', { tasks: newList });
        } catch {}
    };

    const emitNotification = async ({ title, message, type, icon, userId }) => {
        const notifData = {
            title,
            message,
            type: type || 'info',
            icon: icon || '🚀',
            link: '/gestion/sistemas',
            userId: userId || authUser?.id
        };
        addNotification(notifData);
        try {
            await createNotification(notifData);
        } catch {}
    };

    // ==========================================
    // PROYECTOS: CREAR / EDITAR / ELIMINAR (JEFE)
    // ==========================================
    const handleOpenCreateProject = () => {
        setSelectedProject(null);
        setProjectForm({
            nombre: '',
            descripcion: '',
            fechaInicio: format(new Date(), 'yyyy-MM-dd'),
            fechaFin: format(addDays(new Date(), 30), 'yyyy-MM-dd')
        });
        setIsProjectModalOpen(true);
    };

    const handleOpenEditProject = (project) => {
        setSelectedProject(project);
        setProjectForm({
            nombre: project.nombre || '',
            descripcion: project.descripcion || '',
            fechaInicio: project.fechaInicio ? (project.fechaInicio.includes('T') ? project.fechaInicio.split('T')[0] : project.fechaInicio) : format(new Date(), 'yyyy-MM-dd'),
            fechaFin: project.fechaFin ? (project.fechaFin.includes('T') ? project.fechaFin.split('T')[0] : project.fechaFin) : format(addDays(new Date(), 30), 'yyyy-MM-dd')
        });
        setIsProjectModalOpen(true);
    };

    const handleSaveProject = async (e) => {
        e.preventDefault();
        if (!projectForm.nombre.trim()) {
            toast.error('Indica el nombre del proyecto');
            return;
        }

        if (selectedProject) {
            const updatedProject = {
                ...selectedProject,
                nombre: projectForm.nombre.trim(),
                descripcion: projectForm.descripcion.trim(),
                fechaInicio: projectForm.fechaInicio,
                fechaFin: projectForm.fechaFin
            };

            const updatedProjects = projects.map(p => p.id === selectedProject.id ? updatedProject : p);
            persistProjects(updatedProjects);

            // Si cambió el nombre del proyecto, sincronizamos el proyectoNombre en las actividades asociadas
            if (selectedProject.nombre !== updatedProject.nombre) {
                const updatedTasks = tasks.map(t => {
                    if (t.proyectoId === selectedProject.id) {
                        return { ...t, proyectoNombre: updatedProject.nombre };
                    }
                    return t;
                });
                persistTasks(updatedTasks);
            }

            setIsProjectModalOpen(false);
            setSelectedProject(null);
            toast.success(`Proyecto "${updatedProject.nombre}" actualizado correctamente`);
        } else {
            const newProj = {
                id: 'proj-' + Date.now(),
                ...projectForm,
                nombre: projectForm.nombre.trim(),
                descripcion: projectForm.descripcion.trim(),
                estado: 'ACTIVO'
            };

            const updated = [newProj, ...projects];
            persistProjects(updated);
            setIsProjectModalOpen(false);
            toast.success(`Proyecto "${newProj.nombre}" registrado`);
        }
    };

    const handleDeleteProject = async (project) => {
        const projectTasks = tasks.filter(t => t.proyectoId === project.id);
        const res = await Swal.fire({
            title: `¿Eliminar "${project.nombre}"?`,
            text: projectTasks.length > 0 
                ? `Este proyecto tiene ${projectTasks.length} actividades asociadas. Se retirarán del tablero junto con el proyecto.`
                : 'Esta acción retirará el proyecto por completo.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar proyecto',
            cancelButtonText: 'Conservar',
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280'
        });

        if (res.isConfirmed) {
            const updatedProjects = projects.filter(p => p.id !== project.id);
            const updatedTasks = tasks.filter(t => t.proyectoId !== project.id);

            persistProjects(updatedProjects);
            persistTasks(updatedTasks);

            if (selectedProjectId === project.id) {
                setSelectedProjectId('TODOS');
            }

            toast.success(`Proyecto "${project.nombre}" eliminado`);
        }
    };

    // ==========================================
    // ACTIVIDADES: CREAR / EDITAR (JEFE)
    // ==========================================
    const handleToggleCollaborator = (user) => {
        const exists = taskForm.responsables?.some(r => r.id === user.id);
        if (exists) {
            setTaskForm(prev => ({
                ...prev,
                responsables: prev.responsables.filter(r => r.id !== user.id)
            }));
        } else {
            setTaskForm(prev => ({
                ...prev,
                responsables: [...(prev.responsables || []), { id: user.id, name: user.name, email: user.email }]
            }));
        }
    };

    const handleOpenCreateTask = () => {
        setSelectedTask(null);
        const defaultProjId = projects.length > 0 ? projects[0].id : '';
        const defaultProj = projects.find(p => p.id === defaultProjId);

        // Preasignar al usuario actual si es colaborador activo
        const initialResp = (authUser?.id && teamUsers.some(u => u.id === authUser.id))
            ? [{ id: authUser.id, name: authUser.name, email: authUser.email }]
            : [];

        setTaskForm({
            proyectoId: defaultProjId,
            proyectoNombre: defaultProj ? defaultProj.nombre : 'General',
            titulo: '',
            descripcion: '',
            prioridad: 'MEDIA',
            estado: 'POR_HACER',
            fechaInicio: format(new Date(), 'yyyy-MM-dd'),
            fechaFin: format(addDays(new Date(), 14), 'yyyy-MM-dd'),
            progreso: 0,
            responsableId: '',
            responsableNombre: '',
            responsables: initialResp
        });
        setIsTaskModalOpen(true);
    };

    const handleOpenEditTask = (task) => {
        setSelectedTask(task);
        const proj = projects.find(p => p.id === task.proyectoId);

        let currentResp = [];
        if (Array.isArray(task.responsables) && task.responsables.length > 0) {
            currentResp = [...task.responsables];
        } else if (task.responsableId) {
            currentResp = [{ id: task.responsableId, name: task.responsableNombre || 'Colaborador', email: '' }];
        }

        setTaskForm({
            proyectoId: task.proyectoId || (projects.length > 0 ? projects[0].id : ''),
            proyectoNombre: task.proyectoNombre || (proj ? proj.nombre : 'General'),
            titulo: task.titulo || '',
            descripcion: task.descripcion || '',
            prioridad: task.prioridad || 'MEDIA',
            estado: task.estado || 'POR_HACER',
            fechaInicio: task.fechaInicio ? (task.fechaInicio.includes('T') ? task.fechaInicio.split('T')[0] : task.fechaInicio) : format(new Date(), 'yyyy-MM-dd'),
            fechaFin: task.fechaFin ? (task.fechaFin.includes('T') ? task.fechaFin.split('T')[0] : task.fechaFin) : format(addDays(new Date(), 14), 'yyyy-MM-dd'),
            progreso: task.progreso || 0,
            responsableId: task.responsableId || '',
            responsableNombre: task.responsableNombre || '',
            responsables: currentResp
        });
        setIsTaskModalOpen(true);
    };

    const handleSaveTask = async (e) => {
        e.preventDefault();
        if (!taskForm.titulo.trim()) {
            toast.error('Falta el nombre de la actividad');
            return;
        }

        if (!taskForm.responsables || taskForm.responsables.length === 0) {
            toast.error('Por favor asigna al menos a un colaborador responsable');
            return;
        }

        const proj = projects.find(p => p.id === taskForm.proyectoId);
        const nombresUnidos = taskForm.responsables.map(r => r.name).join(', ');
        const primerId = taskForm.responsables[0]?.id || '';

        const fullTaskData = {
            ...taskForm,
            titulo: taskForm.titulo.trim(),
            descripcion: taskForm.descripcion.trim(),
            proyectoNombre: proj ? proj.nombre : (taskForm.proyectoNombre || 'General'),
            responsables: taskForm.responsables,
            responsableId: primerId,
            responsableNombre: nombresUnidos
        };

        let updated;
        if (selectedTask) {
            updated = tasks.map(t => t.id === selectedTask.id ? { ...t, ...fullTaskData } : t);
            toast.success('Actividad actualizada');
        } else {
            const newTask = {
                id: 'task-' + Date.now(),
                ...fullTaskData,
                notas: [],
                evaluaciones: []
            };
            updated = [newTask, ...tasks];
            toast.success('Nueva actividad agregada al proyecto');

            // Notificar a todos los colaboradores asignados (excepto quien lo crea)
            for (const resp of newTask.responsables) {
                if (resp.id && resp.id !== authUser?.id) {
                    await emitNotification({
                        title: '🚀 Nueva actividad asignada',
                        message: `${authUser?.name || 'El encargado'} te asignó: "${newTask.titulo}" en el proyecto "${newTask.proyectoNombre}".`,
                        type: 'task',
                        icon: '🚀',
                        userId: resp.id
                    });
                }
            }
        }

        persistTasks(updated);
        setIsTaskModalOpen(false);
        setSelectedTask(null);

        // Si la ventana de detalle estaba abierta para esta actividad, actualizarla en vivo
        if (detailTask && (selectedTask?.id === detailTask.id || detailTask.id === fullTaskData.id)) {
            setDetailTask(prev => ({ ...prev, ...fullTaskData }));
        }
    };

    // ==========================================
    // DETALLE DE ACTIVIDAD ("INFORMACIÓN SOLICITADA")
    // ==========================================
    const handleOpenTaskDetail = (task) => {
        setDetailTask(task);
        setIsDetailModalOpen(true);
    };

    const handleUpdateTaskStatusDirect = (task, targetStatus) => {
        handleDrop(null, targetStatus, task.id);
        setMobileActiveColumn(targetStatus);
        setDetailTask(prev => prev && prev.id === task.id ? {
            ...prev,
            estado: targetStatus,
            progreso: targetStatus === 'TERMINADO' ? 100 : (targetStatus === 'EN_REVISION' ? 85 : (targetStatus === 'EN_PROCESO' ? 50 : 10))
        } : prev);
    };

    const handleUpdateTaskProgressDirect = (task, newProg) => {
        const val = Math.max(0, Math.min(100, parseInt(newProg) || 0));
        const updated = tasks.map(t => {
            if (t.id === task.id) {
                const isAutoDone = val === 100 && t.estado !== 'TERMINADO';
                return {
                    ...t,
                    progreso: val,
                    estado: isAutoDone ? 'TERMINADO' : t.estado
                };
            }
            return t;
        });

        persistTasks(updated);
        setDetailTask(prev => prev && prev.id === task.id ? { 
            ...prev, 
            progreso: val, 
            estado: val === 100 ? 'TERMINADO' : prev.estado 
        } : prev);
        toast.success(`Progreso actualizado a ${val}%`);
    };

    const handleDeleteTask = async (task) => {
        const res = await Swal.fire({
            title: '¿Retirar esta actividad?',
            text: `Se quitará "${task.titulo}".`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, retirar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#ef4444'
        });

        if (res.isConfirmed) {
            const updated = tasks.filter(t => t.id !== task.id);
            persistTasks(updated);
            toast.success('Actividad retirada');
        }
    };

    // ==========================================
    // FECHAS (JEFE)
    // ==========================================
    const handleOpenDateModal = (task) => {
        setSelectedTask(task);
        setDateForm({
            fechaInicio: task.fechaInicio || format(new Date(), 'yyyy-MM-dd'),
            fechaFin: task.fechaFin || format(addDays(new Date(), 7), 'yyyy-MM-dd'),
            motivo: ''
        });
        setIsDateModalOpen(true);
    };

    const handleSaveDates = async (e) => {
        e.preventDefault();
        if (!selectedTask) return;

        const updated = tasks.map(t => {
            if (t.id === selectedTask.id) {
                return {
                    ...t,
                    fechaInicio: dateForm.fechaInicio,
                    fechaFin: dateForm.fechaFin
                };
            }
            return t;
        });

        persistTasks(updated);
        // Sync detailTask on date update
        setDetailTask(prev => prev && prev.id === selectedTask.id ? {
            ...prev,
            fechaInicio: dateForm.fechaInicio,
            fechaFin: dateForm.fechaFin
        } : prev);
        setIsDateModalOpen(false);
        toast.success('Fechas actualizadas');

        await emitNotification({
            title: '📅 Actualización de Fechas',
            message: `El encargado actualizó la fecha de entrega de "${selectedTask.titulo}" para el ${format(parseISO(dateForm.fechaFin), "dd 'de' MMMM", { locale: es })}.${dateForm.motivo ? ` Nota: ${dateForm.motivo}` : ''}`,
            type: 'calendar',
            icon: '📅',
            userId: selectedTask.responsableId
        });
    };

    // ==========================================
    // NOTAS Y BLOQUEOS (COLABORADOR)
    // ==========================================
    const handleOpenNoteModal = (task) => {
        setSelectedTask(task);
        setNoteForm({ mensaje: '', tipo: 'BLOQUEO' });
        setIsNoteModalOpen(true);
    };

    const handleSaveNote = async (e) => {
        e.preventDefault();
        if (!noteForm.mensaje.trim()) {
            toast.error('Escribe tu mensaje antes de enviar');
            return;
        }

        const newNote = {
            id: 'n-' + Date.now(),
            autor: authUser?.name || 'Colaborador',
            autorId: authUser?.id || 'dev',
            tipo: noteForm.tipo,
            mensaje: noteForm.mensaje.trim(),
            fecha: new Date().toISOString()
        };

        const updated = tasks.map(t => {
            if (t.id === selectedTask.id) {
                return {
                    ...t,
                    notas: [newNote, ...(t.notas || [])]
                };
            }
            return t;
        });

        persistTasks(updated);
        // Sync detailTask on new note
        setDetailTask(prev => prev && prev.id === selectedTask.id ? {
            ...prev,
            notas: [newNote, ...(prev.notas || [])]
        } : prev);
        setIsNoteModalOpen(false);

        Swal.fire({
            title: '¡Nota compartida con el equipo!',
            text: 'Tu encargado ya tiene visibilidad. Es completamente normal tener semanas con otras prioridades u operativos de apoyo.',
            icon: 'success',
            confirmButtonColor: '#3b82f6',
            confirmButtonText: '¡Entendido!'
        });

        await emitNotification({
            title: '📝 Nota de Colaborador',
            message: `${authUser?.name || 'Un colaborador'} dejó una nota en "${selectedTask.titulo}": "${noteForm.mensaje.slice(0, 90)}..."`,
            type: 'note',
            icon: '📝'
        });
    };

    // ==========================================
    // RECONOCIMIENTO CON ESTRELLAS (JEFE)
    // ==========================================
    const handleOpenPraiseModal = (task) => {
        setSelectedTask(task);
        setPraiseForm({
            estrellas: 5,
            felicitacion: '',
            puntosMejora: ''
        });
        setIsPraiseModalOpen(true);
    };

    const handleSavePraise = async (e) => {
        e.preventDefault();
        if (!praiseForm.felicitacion.trim()) {
            toast.error('Agrega unas palabras de felicitación');
            return;
        }

        const newPraise = {
            id: 'ev-' + Date.now(),
            jefeNombre: authUser?.name || 'Encargado de Sistemas',
            estrellas: praiseForm.estrellas,
            felicitacion: praiseForm.felicitacion.trim(),
            puntosMejora: praiseForm.puntosMejora.trim(),
            fecha: new Date().toISOString()
        };

        const updated = tasks.map(t => {
            if (t.id === selectedTask.id) {
                return {
                    ...t,
                    evaluaciones: [newPraise, ...(t.evaluaciones || [])]
                };
            }
            return t;
        });

        persistTasks(updated);
        // Sync detailTask on new praise
        setDetailTask(prev => prev && prev.id === selectedTask.id ? {
            ...prev,
            evaluaciones: [newPraise, ...(prev.evaluaciones || [])]
        } : prev);
        setIsPraiseModalOpen(false);

        Swal.fire({
            title: '¡Reconocimiento entregado!',
            text: 'Un reconocimiento a tiempo motiva al equipo a seguir dando su mejor versión.',
            icon: 'success',
            confirmButtonColor: '#10b981',
            confirmButtonText: '¡Genial!'
        });

        await emitNotification({
            title: `⭐ ¡Felicidades! Recibiste ${praiseForm.estrellas} estrellas`,
            message: `${authUser?.name || 'Tu encargado'} te felicitó en "${selectedTask.titulo}": "${praiseForm.felicitacion.slice(0, 90)}..."`,
            type: 'star',
            icon: '⭐',
            userId: selectedTask.responsableId
        });
    };

    // ==========================================
    // DRAG AND DROP (FILAS Y TARJETAS)
    // ==========================================
    const handleDragStart = (e, taskId) => {
        e.dataTransfer.setData('text/plain', taskId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e, targetStatus, forcedTaskId = null) => {
        if (e && e.preventDefault) e.preventDefault();
        const taskId = forcedTaskId || (e?.dataTransfer ? e.dataTransfer.getData('text/plain') : null);
        if (!taskId) return;

        const task = tasks.find(t => t.id === taskId);
        if (!task || task.estado === targetStatus) return;

        // Si es Colaborador, verificar que solo mueva SUS tareas (o donde sea responsable asignado)
        if (!isJefe) {
            const isMine = (task.responsables && task.responsables.some(r => r.id === authUser?.id)) ||
                           (task.responsableId && task.responsableId === authUser?.id) ||
                           (task.responsableNombre && authUser?.name && task.responsableNombre.toLowerCase().includes(authUser.name.toLowerCase()));
            if (!isMine) {
                toast.error('Solo puedes mover tus propias tareas asignadas.');
                return;
            }
        }

        const updated = tasks.map(t => {
            if (t.id === taskId) {
                const isDone = targetStatus === 'TERMINADO';
                return {
                    ...t,
                    estado: targetStatus,
                    progreso: isDone ? 100 : (targetStatus === 'EN_REVISION' ? 85 : (targetStatus === 'EN_PROCESO' ? 50 : 10))
                };
            }
            return t;
        });

        persistTasks(updated);

        const colObj = WORK_COLUMNS.find(c => c.id === targetStatus);
        toast.success(`Actividad movida a: ${colObj?.title || targetStatus}`);

        if (targetStatus === 'TERMINADO') {
            emitNotification({
                title: '🚀 ¡Meta concluida!',
                message: `"${task.titulo}" fue concluida con éxito.`,
                type: 'scrum',
                icon: '🎉'
            });
        }
    };

    // ==========================================
    // FILTRADO ESTRICTO SEGÚN ROL
    // ==========================================
    const visibleTasks = useMemo(() => {
        return tasks.filter(t => {
            // 1. REGLA ESTRICTA DE COLABORADOR: Solo ve sus propias tareas (o donde esté asignado)
            if (!isJefe) {
                const isMine = (t.responsables && t.responsables.some(r => r.id === authUser?.id)) ||
                               (t.responsableId && t.responsableId === authUser?.id) ||
                               (t.responsableNombre && authUser?.name && t.responsableNombre.toLowerCase().includes(authUser.name.toLowerCase()));
                if (!isMine) return false;
            }

            // 2. Filtro por Proyecto
            if (selectedProjectId !== 'TODOS' && t.proyectoId !== selectedProjectId) {
                return false;
            }

            // 3. Filtro por Colaborador (solo disponible cuando es Jefe)
            if (isJefe && filterCollaborator !== 'TODOS') {
                const matchesCollab = (t.responsables && t.responsables.some(r => r.id === filterCollaborator)) ||
                                      (t.responsableId === filterCollaborator);
                if (!matchesCollab) return false;
            }

            // 4. Búsqueda de texto
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchTitle = t.titulo?.toLowerCase().includes(q);
                const matchDesc = t.descripcion?.toLowerCase().includes(q);
                const matchProj = t.proyectoNombre?.toLowerCase().includes(q);
                const matchResp = (t.responsables?.some(r => r.name?.toLowerCase().includes(q))) ||
                                  (t.responsableNombre?.toLowerCase().includes(q));
                if (!matchTitle && !matchDesc && !matchProj && !matchResp) return false;
            }

            return true;
        });
    }, [tasks, isJefe, authUser, selectedProjectId, filterCollaborator, searchQuery]);

    // Lista de colaboradores activos presentes en las tareas para el filtro del Jefe
    const distinctCollaborators = useMemo(() => {
        const map = new Map();
        tasks.forEach(t => {
            if (Array.isArray(t.responsables)) {
                t.responsables.forEach(r => {
                    if (r.id && r.name) map.set(r.id, r.name);
                });
            }
            if (t.responsableId && t.responsableNombre) {
                map.set(t.responsableId, t.responsableNombre);
            }
        });

        // Filtrar solo colaboradores que sigan activos en teamUsers
        if (teamUsers.length > 0) {
            const activeIds = new Set(teamUsers.map(u => u.id));
            return Array.from(map.entries())
                .filter(([id]) => activeIds.has(id))
                .map(([id, name]) => ({ id, name }));
        }

        return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
    }, [tasks, teamUsers]);

    // Métricas
    const totalVisible = visibleTasks.length;
    const completedVisible = visibleTasks.filter(t => t.estado === 'TERMINADO').length;
    const inProgressVisible = visibleTasks.filter(t => t.estado === 'EN_PROCESO' || t.estado === 'EN_REVISION').length;
    const rateVisible = totalVisible > 0 ? Math.round((completedVisible / totalVisible) * 100) : 0;

    return (
        <div className="space-y-6 animate-fade-in pb-16">
            {/* Header del Área de Sistemas */}
            <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute right-0 top-0 -mt-10 -mr-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="p-2.5 bg-blue-500/20 text-blue-400 rounded-2xl backdrop-blur-sm border border-blue-400/20">
                                <FaFolderOpen className="text-2xl" />
                            </span>
                            <div>
                                <span className="text-xs uppercase tracking-widest text-blue-400 font-extrabold">Departamento de Sistemas</span>
                                <h1 className="text-2xl md:text-3xl font-black tracking-tight">Proyectos y Entregas de Sistemas</h1>
                            </div>
                        </div>
                        <p className="text-sm text-gray-300 max-w-2xl leading-relaxed">
                            {isJefe 
                                ? 'Monitorea el avance integral de los proyectos, asigna actividades y acompaña al equipo con fechas y reconocimientos.'
                                : 'Consulta tus actividades asignadas, mueve tus entregas y déjanos saber cualquier imprevisto de la semana.'}
                        </p>
                    </div>

                    {/* Botones de acción y control según rol */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        {isRealJefe ? (
                            <div className="bg-black/30 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 flex items-center gap-2">
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-xl text-xs font-black">
                                    <FaUserTie /> Modo Encargado
                                </div>
                                <button
                                    onClick={() => setViewAsRole(viewAsRole === 'JEFE' ? 'COLABORADOR' : 'JEFE')}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                        viewAsRole === 'COLABORADOR'
                                        ? 'bg-emerald-600 text-white shadow-md'
                                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                                    }`}
                                    title="Previsualizar el tablero exactamente como lo ve un colaborador"
                                >
                                    <FaExchangeAlt /> {viewAsRole === 'JEFE' ? 'Simular Colaborador' : 'Volver a Encargado'}
                                </button>
                            </div>
                        ) : (
                            <div className="bg-emerald-500/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-emerald-400/20 flex items-center gap-2 text-emerald-300 text-xs font-black">
                                <FaUserCheck className="text-base text-emerald-400" />
                                <div>
                                    <p className="leading-tight font-black uppercase text-[10px] text-emerald-400">Tus Entregas Asignadas</p>
                                    <p className="text-[11px] text-gray-300 font-medium">Solo tú y tu encargado tienen visibilidad de tu avance</p>
                                </div>
                            </div>
                        )}

                        {isJefe && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleOpenCreateProject}
                                    className="flex items-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-2xl border border-white/20 transition-all"
                                >
                                    <FaFolderPlus /> Nuevo Proyecto
                                </button>
                                <button
                                    onClick={handleOpenCreateTask}
                                    className="flex items-center gap-2 px-5 py-3 bg-white text-gray-900 hover:bg-gray-100 font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg transition-transform active:scale-95"
                                >
                                    <FaPlus /> Nueva Actividad
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Resumen de avance */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
                    <div className="bg-white/5 backdrop-blur-sm p-3 rounded-2xl border border-white/5">
                        <span className="text-[10px] uppercase font-bold text-gray-400">
                            {isJefe ? 'Total de Actividades' : 'Mis Actividades'}
                        </span>
                        <p className="text-xl font-black text-white">{totalVisible}</p>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm p-3 rounded-2xl border border-white/5">
                        <span className="text-[10px] uppercase font-bold text-blue-400">En Marcha</span>
                        <p className="text-xl font-black text-blue-400">{inProgressVisible}</p>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm p-3 rounded-2xl border border-white/5">
                        <span className="text-[10px] uppercase font-bold text-emerald-400">Concluidas</span>
                        <p className="text-xl font-black text-emerald-400">{completedVisible}</p>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm p-3 rounded-2xl border border-white/5">
                        <span className="text-[10px] uppercase font-bold text-purple-400">Avance General</span>
                        <div className="flex items-center gap-2">
                            <p className="text-xl font-black text-purple-400">{rateVisible}%</p>
                            <div className="flex-1 bg-white/10 h-2 rounded-full overflow-hidden">
                                <div className="bg-purple-500 h-full rounded-full transition-all duration-500" style={{ width: `${rateVisible}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Selector de Proyectos (Entidad Padre) */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center gap-2">
                        <FaLayerGroup /> Proyectos Registrados
                    </span>
                    <span className="text-xs text-gray-500 font-medium">
                        {projects.length} proyecto{projects.length !== 1 ? 's' : ''} activo{projects.length !== 1 ? 's' : ''}
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {/* Botón para ver todos */}
                    <div
                        onClick={() => setSelectedProjectId('TODOS')}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                            selectedProjectId === 'TODOS'
                            ? 'bg-blue-50/70 dark:bg-blue-900/30 border-blue-500 shadow-sm'
                            : 'bg-gray-50/50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-700 hover:border-gray-300'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <h4 className="font-bold text-sm text-gray-800 dark:text-white">Todos los Proyectos</h4>
                            <span className="text-xs font-black px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                {tasks.length}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Ver conjunto global de entregas</p>
                    </div>

                    {/* Tarjetas individuales de proyecto */}
                    {projects.map((proj) => {
                        const projTasks = tasks.filter(t => t.proyectoId === proj.id);
                        const doneCount = projTasks.filter(t => t.estado === 'TERMINADO').length;
                        const projRate = projTasks.length > 0 ? Math.round((doneCount / projTasks.length) * 100) : 0;
                        const isSelected = selectedProjectId === proj.id;

                        return (
                            <div
                                key={proj.id}
                                onClick={() => setSelectedProjectId(proj.id)}
                                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                                    isSelected
                                    ? 'bg-blue-50/70 dark:bg-blue-900/30 border-blue-500 shadow-sm ring-1 ring-blue-500'
                                    : 'bg-gray-50/50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-start justify-between gap-2 mb-1">
                                    <h4 className="font-bold text-sm text-gray-800 dark:text-white line-clamp-1 flex-1">
                                        {proj.nombre}
                                    </h4>
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                        <span className="text-xs font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                                            {projTasks.length} act.
                                        </span>
                                        {isJefe && (
                                            <div className="flex items-center gap-0.5">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleOpenEditProject(proj);
                                                    }}
                                                    className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors"
                                                    title="Editar nombre y datos del proyecto"
                                                >
                                                    <FaEdit size={11} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteProject(proj);
                                                    }}
                                                    className="p-1 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                                                    title="Eliminar proyecto y sus actividades"
                                                >
                                                    <FaTrash size={11} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mb-2">
                                    {proj.descripcion || 'Sin descripción'}
                                </p>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                        <div className="bg-primary h-full rounded-full" style={{ width: `${projRate}%` }}></div>
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-500">{projRate}%</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Banner si hay un Proyecto filtrado */}
            {selectedProjectId !== 'TODOS' && (() => {
                const activeProj = projects.find(p => p.id === selectedProjectId);
                if (!activeProj) return null;
                return (
                    <div className="bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-800/40 rounded-2xl p-3 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                        <div className="flex items-center gap-3">
                            <span className="p-2 bg-blue-500/10 text-primary rounded-xl">
                                <FaLayerGroup />
                            </span>
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">Filtrando por Proyecto</span>
                                <h3 className="text-sm font-black text-gray-800 dark:text-white">{activeProj.nombre}</h3>
                                {activeProj.descripcion && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{activeProj.descripcion}</p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                            {isJefe && (
                                <button
                                    onClick={() => handleOpenEditProject(activeProj)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-xl hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
                                >
                                    <FaEdit size={11} /> Editar Proyecto
                                </button>
                            )}
                            <button
                                onClick={() => setSelectedProjectId('TODOS')}
                                className="px-3 py-1.5 text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-gray-900 bg-gray-100 dark:bg-gray-800 rounded-xl transition-colors"
                            >
                                Ver todos
                            </button>
                        </div>
                    </div>
                );
            })()}

            {/* Barra de Filtros y Vistas */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                    {/* Botones de Vistas */}
                    <div className="bg-gray-100 dark:bg-gray-900 p-1 rounded-xl flex items-center">
                        <button
                            onClick={() => setViewMode('TABLERO')}
                            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                viewMode === 'TABLERO'
                                ? 'bg-white dark:bg-gray-800 text-primary shadow-sm'
                                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'
                            }`}
                        >
                            <FaThLarge /> Tablero
                        </button>
                        <button
                            onClick={() => setViewMode('GANTT')}
                            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                viewMode === 'GANTT'
                                ? 'bg-white dark:bg-gray-800 text-primary shadow-sm'
                                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'
                            }`}
                        >
                            <FaStream /> Cronograma de Fechas
                        </button>
                        <button
                            onClick={() => setViewMode('NOTAS')}
                            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                viewMode === 'NOTAS'
                                ? 'bg-white dark:bg-gray-800 text-primary shadow-sm'
                                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'
                            }`}
                        >
                            <FaComments /> Bitácora
                        </button>
                    </div>

                    {/* Filtro por Colaborador (Exclusivo para el Jefe) */}
                    {isJefe && distinctCollaborators.length > 0 && (
                        <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-900 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700">
                            <FaFilter className="text-gray-400 text-xs" />
                            <select
                                value={filterCollaborator}
                                onChange={(e) => setFilterCollaborator(e.target.value)}
                                className="bg-transparent text-xs font-bold text-gray-700 dark:text-gray-200 outline-none cursor-pointer"
                            >
                                <option value="TODOS" className="dark:bg-gray-800">Todo el equipo</option>
                                {distinctCollaborators.map(c => (
                                    <option key={c.id} value={c.id} className="dark:bg-gray-800">👤 {c.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {/* Buscador */}
                <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                    <input
                        type="text"
                        placeholder="Buscar por actividad o responsable..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 pr-4 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-primary w-full md:w-64"
                    />
                </div>
            </div>

            {/* ========================================== */}
            {/* VISTA 1: TABLERO DE ACTIVIDADES            */}
            {/* ========================================== */}
            {viewMode === 'TABLERO' && (
                <div className="space-y-4">
                    {/* Selector de columnas exclusivo para Móvil (< md) */}
                    <div className="flex md:hidden items-center gap-1.5 p-1.5 bg-gray-100/90 dark:bg-gray-800/90 rounded-2xl overflow-x-auto custom-scrollbar">
                        {WORK_COLUMNS.map((col) => {
                            const count = visibleTasks.filter(t => t.estado === col.id).length;
                            const isActive = mobileActiveColumn === col.id;
                            return (
                                <button
                                    key={col.id}
                                    type="button"
                                    onClick={() => setMobileActiveColumn(col.id)}
                                    className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-95 ${
                                        isActive
                                            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs font-extrabold ring-1 ring-black/5 dark:ring-white/10'
                                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                                >
                                    <span>{col.title}</span>
                                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                                        isActive ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200'
                                    }`}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {WORK_COLUMNS.map((col) => {
                        const colTasks = visibleTasks.filter(t => t.estado === col.id);
                        const isMobileActive = mobileActiveColumn === col.id;

                        return (
                            <div
                                key={col.id}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, col.id)}
                                className={`bg-gray-50/70 dark:bg-gray-900/40 rounded-3xl p-4 border border-gray-200/70 dark:border-gray-700/60 flex-col min-h-[550px] transition-colors ${
                                    isMobileActive ? 'flex' : 'hidden md:flex'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-3 px-1">
                                    <div>
                                        <h3 className="font-extrabold text-sm text-gray-800 dark:text-white flex items-center gap-1.5">
                                            {col.title}
                                        </h3>
                                        <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">
                                            {col.subtitle}
                                        </p>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-black ${col.badge}`}>
                                        {colTasks.length}
                                    </span>
                                </div>

                                <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                                    {colTasks.length === 0 ? (
                                        <div className="border-2 border-dashed border-gray-200 dark:border-gray-700/50 rounded-2xl p-6 text-center text-gray-400 text-xs flex flex-col items-center justify-center h-44">
                                            <FaTasks className="text-2xl mb-2 opacity-30" />
                                            <span>Arrastra una entrega aquí</span>
                                        </div>
                                    ) : (
                                        colTasks.map((task) => {
                                            const daysLeft = task.fechaFin ? differenceInDays(parseISO(task.fechaFin), new Date()) : null;
                                            const isOverdue = daysLeft !== null && daysLeft < 0 && task.estado !== 'TERMINADO';

                                            return (
                                                <div
                                                    key={task.id}
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, task.id)}
                                                    onClick={() => handleOpenTaskDetail(task)}
                                                    className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700/70 shadow-sm hover:shadow-md transition-all cursor-pointer active:cursor-grabbing group relative hover:border-blue-400 dark:hover:border-blue-500"
                                                >
                                                    {/* Proyecto al que pertenece */}
                                                    <div className="flex items-center justify-between gap-2 mb-2">
                                                        <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md truncate max-w-[150px]">
                                                            📁 {task.proyectoNombre || 'General'}
                                                        </span>

                                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                                            task.prioridad === 'ALTA' 
                                                            ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/40' 
                                                            : (task.prioridad === 'MEDIA' ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/40' : 'text-gray-500 bg-gray-100 dark:bg-gray-700')
                                                        }`}>
                                                            {task.prioridad === 'ALTA' ? '🔥 Alta' : (task.prioridad === 'MEDIA' ? '⚡ Media' : '☕ Normal')}
                                                        </span>
                                                    </div>

                                                    <h4 className="font-bold text-sm text-gray-800 dark:text-white leading-snug mb-1 group-hover:text-primary transition-colors">
                                                        {task.titulo}
                                                    </h4>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
                                                        {task.descripcion || 'Sin descripción detallada. Clic para ver más.'}
                                                    </p>

                                                    {/* Barra de progreso */}
                                                    <div className="mb-3">
                                                        <div className="flex justify-between text-[10px] text-gray-400 font-bold mb-1">
                                                            <span>Progreso</span>
                                                            <span>{task.progreso || 0}%</span>
                                                        </div>
                                                        <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                                            <div 
                                                                className={`h-full rounded-full transition-all duration-300 ${
                                                                    task.progreso >= 100 ? 'bg-emerald-500' : (task.progreso >= 50 ? 'bg-blue-500' : 'bg-amber-500')
                                                                }`} 
                                                                style={{ width: `${task.progreso || 0}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>

                                                    {/* Fechas de entrega */}
                                                    <div className="flex items-center justify-between text-[11px] text-gray-400 dark:text-gray-500 pt-2 border-t border-gray-50 dark:border-gray-700/60 mb-2">
                                                        <div className="flex items-center gap-1">
                                                            <FaCalendarAlt className="text-[10px]" />
                                                            <span>{task.fechaFin ? format(parseISO(task.fechaFin), 'dd MMM', { locale: es }) : 'Sin fecha'}</span>
                                                        </div>
                                                        {task.fechaFin && (
                                                            <span className={`font-bold ${
                                                                isOverdue 
                                                                ? 'text-rose-500 dark:text-rose-400' 
                                                                : (daysLeft <= 3 ? 'text-amber-500' : 'text-gray-400')
                                                            }`}>
                                                                {isOverdue ? '⚠️ Vencida' : (daysLeft === 0 ? 'Hoy vence' : `${daysLeft}d restantes`)}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Responsables (1 o más) & Estrellas */}
                                                    <div className="flex items-center justify-between pt-1">
                                                        <div className="flex items-center gap-1.5 min-w-0 flex-1 pr-2">
                                                            {Array.isArray(task.responsables) && task.responsables.length > 0 ? (
                                                                <div className="flex items-center gap-1.5 min-w-0">
                                                                    <div className="flex -space-x-1.5 overflow-hidden flex-shrink-0">
                                                                        {task.responsables.slice(0, 3).map((r, i) => (
                                                                            <div
                                                                                key={r.id || i}
                                                                                title={r.name}
                                                                                className="inline-flex items-center justify-center w-6 h-6 rounded-full ring-2 ring-white dark:ring-gray-800 bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-[10px] font-black uppercase"
                                                                            >
                                                                                {(r.name || 'C')[0]}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                    <span className="text-[11px] font-medium text-gray-600 dark:text-gray-300 truncate" title={task.responsableNombre}>
                                                                        {task.responsables.length === 1 ? task.responsables[0].name : `${task.responsables.length} asignados`}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-1.5 min-w-0">
                                                                    <div className="w-6 h-6 rounded-full bg-primary/20 text-primary dark:text-primary-light flex items-center justify-center text-[10px] font-black uppercase flex-shrink-0">
                                                                        {(task.responsableNombre || 'S')[0]}
                                                                    </div>
                                                                    <span className="text-[11px] font-medium text-gray-600 dark:text-gray-300 truncate max-w-[120px]">
                                                                        {task.responsableNombre || 'Por asignar'}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {task.evaluaciones && task.evaluaciones.length > 0 && (
                                                            <div className="flex items-center gap-0.5 text-amber-400 text-xs flex-shrink-0" title={`Felicitación de ${task.evaluaciones[0].jefeNombre}`}>
                                                                <FaStar />
                                                                <span className="text-[10px] font-black text-gray-600 dark:text-gray-300">
                                                                    {task.evaluaciones[0].estrellas}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Mensaje de nota previa */}
                                                    {task.notas && task.notas.length > 0 && (
                                                        <div className="mt-2.5 p-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 rounded-xl flex items-start gap-2">
                                                            <FaComments className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0 text-xs" />
                                                            <p className="text-[10px] text-amber-800 dark:text-amber-300 leading-tight line-clamp-1 italic">
                                                                "{task.notas[0].mensaje}"
                                                            </p>
                                                        </div>
                                                    )}

                                                    {/* Hint para ver detalle */}
                                                    <div className="flex items-center justify-between text-[10px] text-blue-600 dark:text-blue-400 font-bold mt-2.5 pt-2 border-t border-gray-100 dark:border-gray-700/60 group-hover:text-primary transition-colors">
                                                        <span className="flex items-center gap-1">
                                                            <FaEye className="text-[11px]" /> Ver detalles y requerimientos
                                                        </span>
                                                        <span>&rarr;</span>
                                                    </div>

                                                    {/* Botonera de acciones */}
                                                    <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleOpenNoteModal(task);
                                                            }}
                                                            className="flex items-center gap-1 text-[11px] font-bold text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                                            title="Dejar nota de avance o imprevisto"
                                                        >
                                                            <FaComments /> Nota ({task.notas?.length || 0})
                                                        </button>

                                                        {isJefe && (
                                                            <div className="flex items-center gap-1">
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleOpenEditTask(task);
                                                                    }}
                                                                    className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors"
                                                                    title="Editar nombre y datos de la actividad"
                                                                >
                                                                    <FaEdit size={12} />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleOpenDateModal(task);
                                                                    }}
                                                                    className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-colors"
                                                                    title="Ajustar fecha de entrega"
                                                                >
                                                                    <FaCalendarAlt size={12} />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleOpenPraiseModal(task);
                                                                    }}
                                                                    className="p-1.5 text-gray-400 hover:text-amber-500 rounded-lg transition-colors"
                                                                    title="Felicitar y otorgar estrellas"
                                                                >
                                                                    <FaStar size={12} />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDeleteTask(task);
                                                                    }}
                                                                    className="p-1.5 text-gray-400 hover:text-rose-500 rounded-lg transition-colors"
                                                                    title="Eliminar actividad"
                                                                >
                                                                    <FaTrash size={11} />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    </div>
                </div>
            )}

            {/* ========================================== */}
            {/* VISTA 2: CRONOGRAMA DE FECHAS (GANTT)      */}
            {/* ========================================== */}
            {viewMode === 'GANTT' && (
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
                    <div>
                        <h3 className="text-lg font-black text-gray-800 dark:text-white flex items-center gap-2">
                            <FaStream className="text-primary" />
                            Cronograma de Fechas y Avance
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Revisa el cumplimiento de fechas de inicio y entrega de cada actividad.
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <div className="min-w-[800px] space-y-4">
                            <div className="grid grid-cols-12 gap-1 text-[10px] font-black text-gray-400 uppercase tracking-wider pb-2 border-b border-gray-100 dark:border-gray-700">
                                <div className="col-span-4">Proyecto & Actividad</div>
                                <div className="col-span-2 text-center">Responsable</div>
                                <div className="col-span-2 text-center">Fechas</div>
                                <div className="col-span-4 text-center">Progreso de Entrega</div>
                            </div>

                            {visibleTasks.map((task) => {
                                const start = task.fechaInicio ? parseISO(task.fechaInicio) : new Date();
                                const end = task.fechaFin ? parseISO(task.fechaFin) : addDays(new Date(), 7);

                                return (
                                    <div 
                                        key={task.id} 
                                        onClick={() => handleOpenTaskDetail(task)}
                                        className="grid grid-cols-12 gap-1 items-center p-3 rounded-2xl bg-gray-50/70 dark:bg-gray-900/40 hover:bg-blue-50/60 dark:hover:bg-blue-950/30 cursor-pointer transition-colors border border-transparent hover:border-blue-200 dark:hover:border-blue-900"
                                        title="Clic para ver detalles de lo solicitado"
                                    >
                                        <div className="col-span-4 pr-2">
                                            <p className="font-bold text-xs text-gray-800 dark:text-white truncate hover:text-primary transition-colors">
                                                {task.titulo}
                                            </p>
                                            <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                                                📁 {task.proyectoNombre || 'General'}
                                            </p>
                                        </div>

                                        <div className="col-span-2 text-center text-xs text-gray-600 dark:text-gray-300 font-medium truncate" title={task.responsableNombre}>
                                            {Array.isArray(task.responsables) && task.responsables.length > 0 
                                                ? task.responsables.map(r => r.name).join(', ') 
                                                : (task.responsableNombre || 'Sin asignar')}
                                        </div>

                                        <div className="col-span-2 text-center text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                                            {format(start, 'dd MMM', { locale: es })} &rarr; {format(end, 'dd MMM', { locale: es })}
                                        </div>

                                        <div className="col-span-4 pl-2">
                                            <div className="relative w-full bg-gray-200 dark:bg-gray-700 h-5 rounded-xl overflow-hidden p-0.5 shadow-inner">
                                                <div 
                                                    className={`h-full rounded-lg transition-all duration-500 flex items-center justify-end pr-2 text-[9px] font-black text-white ${
                                                        task.estado === 'TERMINADO' 
                                                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500' 
                                                        : 'bg-gradient-to-r from-blue-500 to-indigo-600'
                                                    }`}
                                                    style={{ width: `${task.progreso || 5}%` }}
                                                >
                                                    {task.progreso}%
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================== */}
            {/* VISTA 3: BITÁCORA DE NOTAS Y MOTIVOS       */}
            {/* ========================================== */}
            {viewMode === 'NOTAS' && (
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
                    <div>
                        <h3 className="text-lg font-black text-gray-800 dark:text-white flex items-center gap-2">
                            <FaComments className="text-primary" />
                            Bitácora del Equipo: Notas, Imprevistos y Reconocimientos
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Espacio de comunicación transparente donde justificamos imprevistos y celebramos logros.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {visibleTasks.flatMap(t => [
                            ...(t.notas || []).map(n => ({ ...n, taskTitle: t.titulo, proj: t.proyectoNombre, kind: 'NOTA' })),
                            ...(t.evaluaciones || []).map(ev => ({ ...ev, taskTitle: t.titulo, proj: t.proyectoNombre, kind: 'RECONOCIMIENTO' }))
                        ]).length === 0 ? (
                            <div className="text-center py-12 text-gray-400 text-xs">
                                <FaComments className="text-4xl mx-auto mb-2 opacity-30" />
                                <p>Aún no hay notas ni reconocimientos en este filtro.</p>
                            </div>
                        ) : (
                            visibleTasks.flatMap(t => [
                                ...(t.notas || []).map(n => ({ ...n, taskTitle: t.titulo, proj: t.proyectoNombre, kind: 'NOTA' })),
                                ...(t.evaluaciones || []).map(ev => ({ ...ev, taskTitle: t.titulo, proj: t.proyectoNombre, kind: 'RECONOCIMIENTO' }))
                            ])
                            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
                            .map((item, idx) => (
                                <div 
                                    key={idx} 
                                    className={`p-4 rounded-2xl border transition-all ${
                                        item.kind === 'RECONOCIMIENTO'
                                        ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50'
                                        : 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/50'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">
                                                {item.kind === 'RECONOCIMIENTO' ? '⭐' : '📝'}
                                            </span>
                                            <div>
                                                <p className="text-xs font-black text-gray-800 dark:text-white">
                                                    {item.kind === 'RECONOCIMIENTO' ? `Felicitación de ${item.jefeNombre}` : `Nota de ${item.autor}`}
                                                </p>
                                                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                                                    Proyecto: <span className="font-bold">{item.proj}</span> &bull; Entrega: <span className="font-bold">{item.taskTitle}</span>
                                                </p>
                                            </div>
                                        </div>

                                        <span className="text-[10px] text-gray-400 font-medium">
                                            {format(new Date(item.fecha), "dd 'de' MMMM, HH:mm", { locale: es })}
                                        </span>
                                    </div>

                                    <p className="text-xs text-gray-700 dark:text-gray-300 pl-7 leading-relaxed">
                                        {item.kind === 'RECONOCIMIENTO' ? item.felicitacion : item.mensaje}
                                    </p>

                                    {item.puntosMejora && (
                                        <div className="mt-2 ml-7 p-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 rounded-xl text-[11px] text-emerald-800 dark:text-emerald-300">
                                            <span className="font-black">💡 Sugerencia positiva para el futuro:</span> {item.puntosMejora}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* ========================================== */}
            {/* MODAL: NUEVO / EDITAR PROYECTO (JEFE)       */}
            {/* ========================================== */}
            {isProjectModalOpen && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                            <div>
                                <h3 className="text-base font-black text-gray-800 dark:text-white flex items-center gap-2">
                                    {selectedProject ? <FaEdit className="text-primary" /> : <FaFolderPlus className="text-primary" />}
                                    {selectedProject ? 'Editar Proyecto de Sistemas' : 'Nuevo Proyecto de Sistemas'}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {selectedProject 
                                        ? 'Modifica el nombre, fechas u objetivo general de este proyecto.'
                                        : 'Crea el proyecto general del cual partirán las actividades del equipo.'}
                                </p>
                            </div>
                            <button onClick={() => { setIsProjectModalOpen(false); setSelectedProject(null); }} className="text-gray-400 p-2">✕</button>
                        </div>

                        <form onSubmit={handleSaveProject} className="p-6 space-y-4">
                            <div>
                                <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 mb-1">
                                    Nombre del Proyecto *
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ej: Conexión de Terminales Bancarias en Sucursales"
                                    value={projectForm.nombre}
                                    onChange={(e) => setProjectForm({ ...projectForm, nombre: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 mb-1">
                                    Objetivo General del Proyecto
                                </label>
                                <textarea
                                    rows="3"
                                    placeholder="¿Qué beneficio traerá este proyecto a la empresa?"
                                    value={projectForm.descripcion}
                                    onChange={(e) => setProjectForm({ ...projectForm, descripcion: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 mb-1">
                                        Fecha de Inicio
                                    </label>
                                    <input
                                        type="date"
                                        value={projectForm.fechaInicio}
                                        onChange={(e) => setProjectForm({ ...projectForm, fechaInicio: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-xs text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 mb-1">
                                        Fecha Meta
                                    </label>
                                    <input
                                        type="date"
                                        value={projectForm.fechaFin}
                                        onChange={(e) => setProjectForm({ ...projectForm, fechaFin: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-xs text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => { setIsProjectModalOpen(false); setSelectedProject(null); }}
                                    className="flex-1 py-3 text-xs font-bold text-gray-500 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-primary text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg hover:opacity-95 transition-opacity"
                                >
                                    {selectedProject ? 'Guardar Cambios' : 'Registrar Proyecto'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* ========================================== */}
            {/* MODAL: NUEVA ACTIVIDAD (JEFE)              */}
            {/* ========================================== */}
            {isTaskModalOpen && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                            <div>
                                <h3 className="text-lg font-black text-gray-800 dark:text-white flex items-center gap-2">
                                    <FaRocket className="text-primary" />
                                    {selectedTask ? 'Editar Actividad' : 'Nueva Actividad de Sistemas'}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Asigna esta entrega a un proyecto y a un colaborador.
                                </p>
                            </div>
                            <button onClick={() => { setIsTaskModalOpen(false); setSelectedTask(null); }} className="text-gray-400 p-2">✕</button>
                        </div>

                        <form onSubmit={handleSaveTask} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                            <div>
                                <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 mb-1">
                                    Proyecto al que Pertenece *
                                </label>
                                <select
                                    required
                                    value={taskForm.proyectoId}
                                    onChange={(e) => {
                                        const pId = e.target.value;
                                        const found = projects.find(p => p.id === pId);
                                        setTaskForm({
                                            ...taskForm,
                                            proyectoId: pId,
                                            proyectoNombre: found ? found.nombre : 'General'
                                        });
                                    }}
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary font-bold"
                                >
                                    <option value="">Selecciona el proyecto...</option>
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>📁 {p.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 mb-1">
                                    Nombre de la Actividad *
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ej: Integrar lector de huella o tarjeta"
                                    value={taskForm.titulo}
                                    onChange={(e) => setTaskForm({ ...taskForm, titulo: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 mb-1">
                                    Descripción de la Entrega
                                </label>
                                <textarea
                                    rows="3"
                                    placeholder="Detalles sobre lo que se espera..."
                                    value={taskForm.descripcion}
                                    onChange={(e) => setTaskForm({ ...taskForm, descripcion: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 mb-1">
                                    Nivel de Prioridad
                                </label>
                                <select
                                    value={taskForm.prioridad}
                                    onChange={(e) => setTaskForm({ ...taskForm, prioridad: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-xs text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary"
                                >
                                    <option value="BAJA">☕ Normal</option>
                                    <option value="MEDIA">⚡ Media</option>
                                    <option value="ALTA">🔥 Alta</option>
                                </select>
                            </div>

                            {/* SELECTOR MULTI-COLABORADOR (1 O MÁS) */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-[11px] font-black uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                                        <FaUsers className="text-primary text-xs" />
                                        Colaboradores Asignados * ({taskForm.responsables?.length || 0})
                                    </label>
                                    <span className="text-[10px] text-gray-400 font-medium">
                                        Asigna 1 o más compañeros activos
                                    </span>
                                </div>

                                {/* Pills de seleccionados */}
                                {taskForm.responsables && taskForm.responsables.length > 0 ? (
                                    <div className="flex flex-wrap items-center gap-1.5 mb-2.5 p-2 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 rounded-xl">
                                        {taskForm.responsables.map(resp => (
                                            <span 
                                                key={resp.id}
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-700 rounded-lg text-xs font-bold text-gray-800 dark:text-white shadow-xs"
                                            >
                                                <span className="w-4 h-4 rounded-full bg-primary text-white text-[9px] font-black flex items-center justify-center">
                                                    {(resp.name || 'C')[0]}
                                                </span>
                                                <span className="truncate max-w-[130px]">{resp.name}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleCollaborator(resp)}
                                                    className="text-gray-400 hover:text-rose-500 font-black ml-0.5 text-xs"
                                                    title="Quitar"
                                                >
                                                    ✕
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="mb-2 p-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300 font-medium">
                                        ⚠️ Por favor selecciona al menos a un colaborador en la lista abajo.
                                    </div>
                                )}

                                {/* Lista de colaboradores activos disponibles */}
                                <div className="border border-gray-200 dark:border-gray-700 rounded-2xl p-2 bg-gray-50/50 dark:bg-gray-900/40 max-h-44 overflow-y-auto space-y-1">
                                    {teamUsers.length === 0 ? (
                                        <p className="text-xs text-gray-400 p-2 text-center">No se encontraron colaboradores activos.</p>
                                    ) : (
                                        teamUsers.map(user => {
                                            const isSelected = taskForm.responsables?.some(r => r.id === user.id);
                                            return (
                                                <div
                                                    key={user.id}
                                                    onClick={() => handleToggleCollaborator(user)}
                                                    className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                                                        isSelected
                                                        ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 ring-1 ring-blue-500 shadow-xs'
                                                        : 'bg-white dark:bg-gray-800 border-gray-200/80 dark:border-gray-700/80 hover:border-gray-300'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white ${
                                                            isSelected ? 'bg-primary' : 'bg-gray-400 dark:bg-gray-600'
                                                        }`}>
                                                            {(user.name || 'C')[0]}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-bold text-gray-800 dark:text-white truncate">{user.name}</p>
                                                            <p className="text-[10px] text-gray-400 truncate">{user.email || user.role || 'Colaborador'}</p>
                                                        </div>
                                                    </div>
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        readOnly
                                                        className="w-4 h-4 text-primary rounded border-gray-300 pointer-events-none"
                                                    />
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 mb-1">
                                        Fecha de Inicio
                                    </label>
                                    <input
                                        type="date"
                                        value={taskForm.fechaInicio}
                                        onChange={(e) => setTaskForm({ ...taskForm, fechaInicio: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-xs text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 mb-1">
                                        Fecha Límite
                                    </label>
                                    <input
                                        type="date"
                                        value={taskForm.fechaFin}
                                        onChange={(e) => setTaskForm({ ...taskForm, fechaFin: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-xs text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => { setIsTaskModalOpen(false); setSelectedTask(null); }}
                                    className="flex-1 py-3 text-xs font-bold text-gray-500 rounded-xl"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-primary text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg"
                                >
                                    Guardar Actividad
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* ========================================== */}
            {/* MODAL: DEJAR NOTA / MOTIVO (COLABORADOR)   */}
            {/* ========================================== */}
            {isNoteModalOpen && selectedTask && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-blue-50/50 dark:bg-blue-900/20 flex justify-between items-center">
                            <div>
                                <h3 className="text-base font-black text-gray-800 dark:text-white flex items-center gap-2">
                                    <FaComments className="text-blue-500" />
                                    Dejar Nota o Notificar Imprevisto
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-sm">
                                    En: <span className="font-bold">{selectedTask.titulo}</span>
                                </p>
                            </div>
                            <button onClick={() => setIsNoteModalOpen(false)} className="text-gray-400 p-2">✕</button>
                        </div>

                        <form onSubmit={handleSaveNote} className="p-6 space-y-4">
                            <div>
                                <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 mb-1">
                                    Cuéntanos qué surgió esta semana
                                </label>
                                <textarea
                                    required
                                    rows="4"
                                    placeholder="Ejemplo: Hola equipo, esta semana estuve apoyando con urgencias en planta/sucursales y no alcancé a terminar el objetivo programado. Ya lo estoy retomando a primera hora."
                                    value={noteForm.mensaje}
                                    onChange={(e) => setNoteForm({ ...noteForm, mensaje: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-xs text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary resize-none leading-relaxed"
                                />
                                <span className="text-[10px] text-gray-400 italic mt-1 block">
                                    🤝 Todos entendemos que surgen prioridades del negocio. Lo importante es avisar a tiempo.
                                </span>
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsNoteModalOpen(false)}
                                    className="flex-1 py-3 text-xs font-bold text-gray-500 rounded-xl"
                                >
                                    Cerrar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg transition-all"
                                >
                                    Enviar Nota al Encargado
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* ========================================== */}
            {/* MODAL: RECONOCIMIENTO CON ESTRELLAS (JEFE) */}
            {/* ========================================== */}
            {isPraiseModalOpen && selectedTask && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-md shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-amber-50/50 dark:bg-amber-900/20 flex justify-between items-center">
                            <div>
                                <h3 className="text-base font-black text-gray-800 dark:text-white flex items-center gap-2">
                                    <FaAward className="text-amber-500 text-lg" />
                                    Reconocimiento y Estrellas
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    Para: <span className="font-bold">{selectedTask.responsableNombre || 'Compañero'}</span>
                                </p>
                            </div>
                            <button onClick={() => setIsPraiseModalOpen(false)} className="text-gray-400 p-2">✕</button>
                        </div>

                        <form onSubmit={handleSavePraise} className="p-6 space-y-4">
                            <div className="text-center py-2">
                                <label className="block text-[11px] font-black uppercase tracking-wider text-gray-400 mb-2">
                                    Calificación del Esfuerzo
                                </label>
                                <div className="flex items-center justify-center gap-2 text-3xl text-amber-400 cursor-pointer">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            type="button"
                                            key={star}
                                            onClick={() => setPraiseForm({ ...praiseForm, estrellas: star })}
                                            className="transition-transform hover:scale-125 focus:outline-none"
                                        >
                                            {star <= praiseForm.estrellas ? <FaStar /> : <FaRegStar className="text-gray-300 dark:text-gray-600" />}
                                        </button>
                                    ))}
                                </div>
                                <span className="text-xs font-bold text-gray-600 dark:text-gray-300 mt-1 block">
                                    {praiseForm.estrellas === 5 ? '¡Excelente trabajo! ⭐⭐⭐⭐⭐' : (praiseForm.estrellas >= 4 ? '¡Gran avance y dedicación!' : '¡Buen esfuerzo con áreas de oportunidad!')}
                                </span>
                            </div>

                            <div>
                                <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 mb-1">
                                    ¿Qué hizo genial el compañero? *
                                </label>
                                <textarea
                                    required
                                    rows="3"
                                    placeholder="Ej: Reconozco tu iniciativa para resolver rápido la falla en sucursal..."
                                    value={praiseForm.felicitacion}
                                    onChange={(e) => setPraiseForm({ ...praiseForm, felicitacion: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-xs text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-amber-500 resize-none leading-relaxed"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 mb-1">
                                    ¿Qué podríamos pulir juntos para la próxima?
                                </label>
                                <textarea
                                    rows="2"
                                    placeholder="Ej: La próxima podemos avisar con anticipación en el grupo para estar todos al tanto."
                                    value={praiseForm.puntosMejora}
                                    onChange={(e) => setPraiseForm({ ...praiseForm, puntosMejora: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-xs text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-amber-500 resize-none leading-relaxed"
                                />
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsPraiseModalOpen(false)}
                                    className="flex-1 py-3 text-xs font-bold text-gray-500 rounded-xl"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg"
                                >
                                    Enviar Reconocimiento
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* ========================================== */}
            {/* MODAL: AJUSTAR FECHAS (JEFE)               */}
            {/* ========================================== */}
            {isDateModalOpen && selectedTask && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-sm shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-indigo-50/50 dark:bg-indigo-900/20 flex justify-between items-center">
                            <div>
                                <h3 className="text-base font-black text-gray-800 dark:text-white flex items-center gap-2">
                                    <FaCalendarAlt className="text-indigo-500" />
                                    Ajustar Fechas de Entrega
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                                    {selectedTask.titulo}
                                </p>
                            </div>
                            <button onClick={() => setIsDateModalOpen(false)} className="text-gray-400 p-2">✕</button>
                        </div>

                        <form onSubmit={handleSaveDates} className="p-6 space-y-4">
                            <div>
                                <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 mb-1">
                                    Nueva Fecha de Inicio
                                </label>
                                <input
                                    type="date"
                                    value={dateForm.fechaInicio}
                                    onChange={(e) => setDateForm({ ...dateForm, fechaInicio: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-xs text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 mb-1">
                                    Nueva Fecha Límite
                                </label>
                                <input
                                    type="date"
                                    value={dateForm.fechaFin}
                                    onChange={(e) => setDateForm({ ...dateForm, fechaFin: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-xs text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 mb-1">
                                    Motivo del Ajuste
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ej: Se reprogramó por apoyo en soporte de planta"
                                    value={dateForm.motivo}
                                    onChange={(e) => setDateForm({ ...dateForm, motivo: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-xs text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsDateModalOpen(false)}
                                    className="flex-1 py-3 text-xs font-bold text-gray-500 rounded-xl"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg"
                                >
                                    Actualizar Fechas
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* ========================================== */}
            {/* MODAL: DETALLE COMPLETO DE LO SOLICITADO   */}
            {/* ========================================== */}
            {isDetailModalOpen && detailTask && createPortal(
                <div 
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 md:p-6 bg-black/70 backdrop-blur-md animate-fade-in"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setIsDetailModalOpen(false);
                            setDetailTask(null);
                        }
                    }}
                >
                    <div 
                        className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-4xl shadow-2xl border border-gray-100 dark:border-gray-700/80 flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden transform transition-all duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Cabecera elegante y compacta */}
                        <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-gray-100 dark:border-gray-700/80 bg-gradient-to-r from-slate-50 via-white to-blue-50/40 dark:from-gray-900 dark:via-gray-850 dark:to-blue-950/20 flex items-start justify-between gap-4">
                            <div className="space-y-1.5 min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-100/70 dark:bg-blue-900/40 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                        <FaFolderOpen className="text-[9px]" /> {detailTask.proyectoNombre || 'Proyecto General'}
                                    </span>
                                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                                        detailTask.prioridad === 'ALTA' 
                                        ? 'text-rose-700 bg-rose-100 dark:bg-rose-900/40 dark:text-rose-300' 
                                        : (detailTask.prioridad === 'MEDIA' ? 'text-amber-700 bg-amber-100 dark:bg-amber-900/40 dark:text-amber-300' : 'text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-300')
                                    }`}>
                                        {detailTask.prioridad === 'ALTA' ? '🔥 Alta' : (detailTask.prioridad === 'MEDIA' ? '⚡ Media' : '☕ Normal')}
                                    </span>
                                    {(() => {
                                        const curCol = WORK_COLUMNS.find(c => c.id === detailTask.estado);
                                        return (
                                            <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${curCol?.badge || 'bg-gray-100'}`}>
                                                {curCol?.title || detailTask.estado}
                                            </span>
                                        );
                                    })()}
                                </div>
                                <h2 className="text-base sm:text-lg md:text-xl font-black text-gray-900 dark:text-white leading-snug break-words">
                                    {detailTask.titulo}
                                </h2>
                            </div>
                            <button 
                                onClick={() => { setIsDetailModalOpen(false); setDetailTask(null); }} 
                                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0 active:scale-95"
                                title="Cerrar ventana"
                            >
                                <FaTimes className="text-base" />
                            </button>
                        </div>

                        {/* Cuerpo en dos columnas responsivas */}
                        <div className="flex-1 overflow-y-auto p-5 sm:p-6 custom-scrollbar">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
                                {/* COLUMNA IZQUIERDA: Alcance, Estado y Progreso (7 cols) */}
                                <div className="lg:col-span-7 space-y-5">
                                    {/* 1. INFORMACIÓN Y ALCANCE DE LO SOLICITADO */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                            <span className="flex items-center gap-1.5">
                                                <FaInfoCircle className="text-primary text-sm" />
                                                Información y Detalles de lo Solicitado
                                            </span>
                                            {isJefe && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setIsDetailModalOpen(false);
                                                        handleOpenEditTask(detailTask);
                                                    }}
                                                    className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                                >
                                                    <FaEdit size={11} /> Editar
                                                </button>
                                            )}
                                        </div>
                                        <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100/80 dark:border-blue-900/40">
                                            <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-200 whitespace-pre-line leading-relaxed font-normal select-text">
                                                {detailTask.descripcion?.trim() || 'No se registraron especificaciones adicionales escritas para esta actividad. Consulta a tu encargado si tienes alguna duda sobre el alcance.'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* 2. CAMBIO DIRECTO DE ESTADO */}
                                    <div className="space-y-2">
                                        <span className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                            <FaExchangeAlt className="text-primary text-xs" /> Mover Estado de la Entrega
                                        </span>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                            {WORK_COLUMNS.map(col => {
                                                const isCurrent = detailTask.estado === col.id;
                                                return (
                                                    <button
                                                        key={col.id}
                                                        type="button"
                                                        onClick={() => handleUpdateTaskStatusDirect(detailTask, col.id)}
                                                        className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-0.5 active:scale-95 ${
                                                            isCurrent 
                                                            ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-400/40 font-black' 
                                                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/40 dark:hover:bg-blue-950/20'
                                                        }`}
                                                    >
                                                        <span className="text-xs font-bold leading-tight truncate w-full">{col.title}</span>
                                                        <span className={`text-[9px] ${isCurrent ? 'text-blue-100 font-bold' : 'text-gray-400'}`}>
                                                            {isCurrent ? '● Actual' : 'Mover'}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* 3. AVANCE Y PROGRESO INTERACTIVO */}
                                    <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-700/80 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-black uppercase tracking-wider text-gray-600 dark:text-gray-300 flex items-center gap-2">
                                                <FaChartBar className="text-primary text-xs" /> Avance Reportado
                                            </span>
                                            <span className="text-sm font-black text-primary px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800">
                                                {detailTask.progreso || 0}%
                                            </span>
                                        </div>

                                        <div className="w-full bg-gray-200 dark:bg-gray-700 h-2.5 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-300 ${
                                                    (detailTask.progreso || 0) >= 100 
                                                    ? 'bg-emerald-500' 
                                                    : ((detailTask.progreso || 0) >= 50 ? 'bg-blue-500' : 'bg-amber-500')
                                                }`} 
                                                style={{ width: `${detailTask.progreso || 0}%` }}
                                            ></div>
                                        </div>

                                        {/* Botones de actualización rápida */}
                                        <div className="flex items-center justify-between pt-1 gap-1">
                                            <span className="text-[10px] text-gray-400 font-bold">Ajuste rápido:</span>
                                            <div className="flex items-center gap-1.5">
                                                {[0, 25, 50, 75, 100].map(pct => (
                                                    <button
                                                        key={pct}
                                                        type="button"
                                                        onClick={() => handleUpdateTaskProgressDirect(detailTask, pct)}
                                                        className={`px-2.5 py-1 rounded-xl text-[10px] font-black transition-all active:scale-95 ${
                                                            detailTask.progreso === pct 
                                                            ? 'bg-primary text-white shadow-xs' 
                                                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                                        }`}
                                                    >
                                                        {pct}%
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* COLUMNA DERECHA: Equipo, Fechas, Bitácora y Reconocimientos (5 cols) */}
                                <div className="lg:col-span-5 space-y-5">
                                    {/* 1. COLABORADORES ASIGNADOS */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                            <span className="flex items-center gap-1.5">
                                                <FaUsers className="text-primary text-sm" />
                                                Colaboradores Responsables
                                            </span>
                                            <span className="text-[10px] font-bold text-gray-400">
                                                {Array.isArray(detailTask.responsables) && detailTask.responsables.length > 0 
                                                    ? `${detailTask.responsables.length} asignado${detailTask.responsables.length > 1 ? 's' : ''}` 
                                                    : '1 asignado'}
                                            </span>
                                        </div>

                                        <div className="space-y-2 max-h-36 overflow-y-auto custom-scrollbar pr-0.5">
                                            {Array.isArray(detailTask.responsables) && detailTask.responsables.length > 0 ? (
                                                detailTask.responsables.map((r, i) => {
                                                    const isMe = r.id === authUser?.id;
                                                    return (
                                                        <div 
                                                            key={r.id || i}
                                                            className={`p-2.5 rounded-2xl border flex items-center gap-2.5 transition-colors ${
                                                                isMe 
                                                                ? 'bg-emerald-50/70 border-emerald-300 dark:bg-emerald-950/20 dark:border-emerald-800' 
                                                                : 'bg-white dark:bg-gray-800/80 border-gray-200 dark:border-gray-700'
                                                            }`}
                                                        >
                                                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs text-white flex-shrink-0 ${
                                                                isMe ? 'bg-emerald-600 shadow-xs' : 'bg-primary'
                                                            }`}>
                                                                {(r.name || 'C')[0]}
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-center gap-1.5">
                                                                    <p className="text-xs font-bold text-gray-800 dark:text-white truncate">{r.name}</p>
                                                                    {isMe && (
                                                                        <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                                                                            Tú
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {r.email && (
                                                                    <p className="text-[10px] text-gray-400 truncate">{r.email}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <div className="p-2.5 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 flex items-center gap-2.5">
                                                    <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center font-black text-xs">
                                                        {(detailTask.responsableNombre || 'C')[0]}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-gray-800 dark:text-white truncate">{detailTask.responsableNombre || 'Por asignar'}</p>
                                                        <p className="text-[10px] text-gray-400">Responsable asignado</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* 2. CRONOGRAMA Y TIEMPO */}
                                    <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-gray-900/60 border border-slate-200/80 dark:border-gray-700/80 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                                                <FaCalendarAlt className="text-primary text-[10px]" /> Fechas de Compromiso
                                            </span>
                                            {isJefe && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setIsDetailModalOpen(false);
                                                        handleOpenDateModal(detailTask);
                                                    }}
                                                    className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                                                >
                                                    Ajustar fechas
                                                </button>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div>
                                                <span className="text-[9px] uppercase tracking-wider text-gray-400 font-bold block">Inicio</span>
                                                <p className="font-bold text-gray-800 dark:text-gray-200 truncate">
                                                    {detailTask.fechaInicio ? format(parseISO(detailTask.fechaInicio), "dd MMM, yyyy", { locale: es }) : 'Sin fecha'}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-[9px] uppercase tracking-wider text-gray-400 font-bold block">Meta Entrega</span>
                                                <p className="font-bold text-rose-600 dark:text-rose-400 truncate">
                                                    {detailTask.fechaFin ? format(parseISO(detailTask.fechaFin), "dd MMM, yyyy", { locale: es }) : 'Sin fecha'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 3. BITÁCORA Y RECONOCIMIENTOS CON TABS */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700/80 pb-1.5">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setDetailSubTab('NOTAS')}
                                                    className={`text-xs font-black transition-colors flex items-center gap-1.5 pb-1 ${
                                                        detailSubTab === 'NOTAS'
                                                        ? 'text-amber-600 dark:text-amber-400 border-b-2 border-amber-500'
                                                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                                                    }`}
                                                >
                                                    <FaComments size={12} /> Bitácora ({detailTask.notas?.length || 0})
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setDetailSubTab('RECONOCIMIENTOS')}
                                                    className={`text-xs font-black transition-colors flex items-center gap-1.5 pb-1 ${
                                                        detailSubTab === 'RECONOCIMIENTOS'
                                                        ? 'text-amber-600 dark:text-amber-400 border-b-2 border-amber-500'
                                                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                                                    }`}
                                                >
                                                    <FaStar size={12} /> Felicitaciones ({detailTask.evaluaciones?.length || 0})
                                                </button>
                                            </div>

                                            {detailSubTab === 'NOTAS' ? (
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenNoteModal(detailTask)}
                                                    className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                                >
                                                    <FaPlus size={9} /> Dejar Nota
                                                </button>
                                            ) : (
                                                isJefe && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setIsDetailModalOpen(false);
                                                            handleOpenPraiseModal(detailTask);
                                                        }}
                                                        className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                                                    >
                                                        <FaStar size={9} /> Calificar
                                                    </button>
                                                )
                                            )}
                                        </div>

                                        {/* Contenido dinámico según Tab */}
                                        {detailSubTab === 'NOTAS' ? (
                                            detailTask.notas && detailTask.notas.length > 0 ? (
                                                <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-0.5">
                                                    {detailTask.notas.map((n, i) => (
                                                        <div key={n.id || i} className="p-2.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 text-xs">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className="font-bold text-amber-900 dark:text-amber-200 truncate">{n.autor || 'Compañero'}</span>
                                                                <span className="text-[9px] text-gray-400 whitespace-nowrap">
                                                                    {n.fecha ? format(new Date(n.fecha), 'dd MMM, HH:mm', { locale: es }) : ''}
                                                                </span>
                                                            </div>
                                                            <p className="text-gray-700 dark:text-gray-300 italic text-[11px] leading-relaxed">"{n.mensaje}"</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="p-3 text-center rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 text-xs text-gray-400 italic">
                                                    Sin notas ni bloqueos registrados.
                                                </div>
                                            )
                                        ) : (
                                            detailTask.evaluaciones && detailTask.evaluaciones.length > 0 ? (
                                                <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-0.5">
                                                    {detailTask.evaluaciones.map((ev, i) => (
                                                        <div key={ev.id || i} className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs space-y-1">
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-black text-gray-800 dark:text-white truncate">De: {ev.jefeNombre}</span>
                                                                <div className="flex text-amber-400 text-xs gap-0.5">
                                                                    {[...Array(ev.estrellas || 5)].map((_, idx) => (
                                                                        <FaStar key={idx} />
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <p className="text-gray-700 dark:text-gray-200 italic text-[11px]">"{ev.felicitacion}"</p>
                                                            {ev.puntosMejora && (
                                                                <p className="text-[10px] text-gray-500 dark:text-gray-400 pt-1 border-t border-amber-200/50">
                                                                    💡 Sugerencia: {ev.puntosMejora}
                                                                </p>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="p-3 text-center rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 text-xs text-gray-400 italic">
                                                    Aún no hay calificaciones registradas.
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Pie de modal fijo y visible */}
                        <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/90 dark:bg-gray-900/60 flex flex-wrap items-center justify-between gap-2.5">
                            <div className="flex items-center gap-2">
                                {isJefe && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsDetailModalOpen(false);
                                                handleOpenEditTask(detailTask);
                                            }}
                                            className="px-3 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl transition-colors flex items-center gap-1.5 active:scale-95"
                                        >
                                            <FaEdit size={11} /> Editar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsDetailModalOpen(false);
                                                handleOpenDateModal(detailTask);
                                            }}
                                            className="px-3 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl transition-colors flex items-center gap-1.5 active:scale-95"
                                        >
                                            <FaCalendarAlt size={11} /> Fechas
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsDetailModalOpen(false);
                                                handleOpenPraiseModal(detailTask);
                                            }}
                                            className="px-3 py-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl transition-colors flex items-center gap-1.5 active:scale-95"
                                        >
                                            <FaStar size={11} /> Calificar
                                        </button>
                                    </>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => { setIsDetailModalOpen(false); setDetailTask(null); }}
                                className="px-5 py-2 bg-gray-900 text-white dark:bg-gray-700 hover:bg-black dark:hover:bg-gray-600 text-xs font-bold rounded-xl transition-colors active:scale-95 shadow-sm ml-auto"
                            >
                                Cerrar Detalle
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default Sistemas;
