import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import { useGestion } from './context/GestionContext';
import apiClient, {
    fetchRoles,
    createRole,
    updateRole,
    deleteRole,
    fetchModules,
    createModule,
    deleteModule,
    createSubmodule,
    deleteSubmodule,
    createPermission,
    deletePermission,
    fetchCollaborators,
    updateCollaboratorRoles,
    updateCollaboratorPermissions
} from '@/api/apiClient';
import Swal from 'sweetalert2';
import { toast } from 'sonner';

// Catálogo base de respaldo de módulos y permisos (garantiza que la interfaz funcione al 100% incluso si el backend remoto en Vercel aún no se ha desplegado)
const DEFAULT_MODULES_TREE = [
  {
    id: "mod-resumen",
    codigo: "resumenoperativo",
    nombre: "Resumen Operativo",
    icono: "dashboard",
    permisos: [{ id: "p-resumen", codigo: "acceso.resumenoperativo", nombre: "Acceso a Resumen Operativo" }],
    submodulos: []
  },
  {
    id: "mod-cotizadores",
    codigo: "cotizadores",
    nombre: "Cotizadores",
    icono: "request_quote",
    permisos: [{ id: "p-cotizadores", codigo: "acceso.cotizadores", nombre: "Acceso al módulo de Cotizadores" }],
    submodulos: [
      { id: "sub-cotizadordistribuidor", codigo: "cotizadordistribuidor", nombre: "Cotizador Dist.", path: "cotizador-distribuidores", icono: "local_shipping", permisos: [{ id: "p-cotizadordistribuidor", codigo: "acceso.cotizadordistribuidor", nombre: "Acceso a Cotizador Dist." }] },
      { id: "sub-cotizadordarmax", codigo: "cotizadordarmax", nombre: "Cotizador Darmax", path: "cotizador", icono: "request_quote", permisos: [{ id: "p-cotizadordarmax", codigo: "acceso.cotizadordarmax", nombre: "Acceso a Cotizador Darmax" }] }
    ]
  },
  {
    id: "mod-operaciones",
    codigo: "operaciones",
    nombre: "Operaciones",
    icono: "storefront",
    permisos: [{ id: "p-operaciones", codigo: "acceso.operaciones", nombre: "Acceso a Operaciones" }],
    submodulos: [
      { id: "sub-inventarioglobal", codigo: "inventarioglobal", nombre: "Inventario Global", path: "inventario", icono: "inventory_2", permisos: [{ id: "p-inventarioglobal", codigo: "acceso.inventarioglobal", nombre: "Acceso a Inventario Global" }] },
      { id: "sub-cortesvending", codigo: "cortesvending", nombre: "Cortes Vending", path: "vending", icono: "smart_toy", permisos: [{ id: "p-cortesvending", codigo: "acceso.cortesvending", nombre: "Acceso a Cortes Vending" }] }
    ]
  },
  {
    id: "mod-ingenieria",
    codigo: "ingenieriayproyectos",
    nombre: "Ingeniería y Proyectos",
    icono: "engineering",
    permisos: [{ id: "p-ingenieria", codigo: "acceso.ingenieriayproyectos", nombre: "Acceso a Ingeniería y Proyectos" }],
    submodulos: [
      { id: "sub-controlinstalacion", codigo: "controlinstalacion", nombre: "Control de Instalación", path: "instalacion", icono: "construction", permisos: [{ id: "p-controlinstalacion", codigo: "acceso.controlinstalacion", nombre: "Acceso a Control de Instalación" }] },
      { id: "sub-mapainstalaciones", codigo: "mapainstalaciones", nombre: "Mapa de Instalaciones", path: "mapa-instalaciones", icono: "map", permisos: [{ id: "p-mapainstalaciones", codigo: "acceso.mapainstalaciones", nombre: "Acceso a Mapa de Instalaciones" }] }
    ]
  },
  {
    id: "mod-sistemas",
    codigo: "sistemas",
    nombre: "Sistemas",
    icono: "terminal",
    permisos: [{ id: "p-sistemas", codigo: "acceso.sistemas", nombre: "Acceso a Sistemas" }],
    submodulos: [
      { 
        id: "sub-proyectosactividades", 
        codigo: "proyectosactividades", 
        nombre: "Proyectos y Actividades", 
        path: "sistemas", 
        icono: "terminal", 
        permisos: [
          { id: "p-proyectosactividades-jefe", codigo: "proyectosactividades.jefe", nombre: "Jefe / Encargado de Sistemas (Proyectos y Actividades)" },
          { id: "p-proyectosactividades-colab", codigo: "proyectosactividades.colaborador", nombre: "Colaborador de Sistemas (Proyectos y Actividades)" },
          { id: "p-proyectosactividades", codigo: "acceso.proyectosactividades", nombre: "Acceso General a Proyectos y Actividades" }
        ] 
      },
      { 
        id: "sub-rolesypermisos", 
        codigo: "rolesypermisos", 
        nombre: "Roles y Permisos", 
        path: "roles", 
        icono: "security", 
        permisos: [
          { id: "p-permisosyroles", codigo: "acceso.permisosyroles", nombre: "Permisos y Roles (acceso.permisosyroles)" },
          { id: "p-rolesypermisos", codigo: "acceso.rolesypermisos", nombre: "Roles y Permisos (acceso.rolesypermisos)" }
        ] 
      }
    ]
  },
  {
    id: "mod-marketing",
    codigo: "marketingyestrategia",
    nombre: "Marketing y Estrategia",
    icono: "campaign",
    permisos: [{ id: "p-marketing", codigo: "acceso.marketingyestrategia", nombre: "Acceso a Marketing y Estrategia" }],
    submodulos: [
      { 
        id: "sub-plannerdigital", 
        codigo: "plannerdigital", 
        nombre: "Planner Digital", 
        path: "marketing", 
        icono: "ads_click", 
        permisos: [
          { id: "p-plannerdigital-jefe", codigo: "plannerdigital.jefe", nombre: "Jefe / Encargado de Marketing (Planner Digital)" },
          { id: "p-plannerdigital-colab", codigo: "plannerdigital.colaborador", nombre: "Colaborador de Marketing (Planner Digital)" },
          { id: "p-plannerdigital", codigo: "acceso.plannerdigital", nombre: "Acceso General a Planner Digital" }
        ] 
      },
      { id: "sub-promociones", codigo: "promociones", nombre: "Promociones", path: "promociones", icono: "loyalty", permisos: [{ id: "p-promociones", codigo: "acceso.promociones", nombre: "Acceso a Promociones" }] }
    ]
  },
  {
    id: "mod-contenido",
    codigo: "contenidoyrecursos",
    nombre: "Contenido y Recursos",
    icono: "auto_stories",
    permisos: [{ id: "p-contenido", codigo: "acceso.contenidoyrecursos", nombre: "Acceso a Contenido y Recursos" }],
    submodulos: [
      { id: "sub-editorblog", codigo: "editorblog", nombre: "Editor de Blog", path: "blog", icono: "newspaper", permisos: [{ id: "p-editorblog", codigo: "acceso.editorblog", nombre: "Acceso a Editor de Blog" }] },
      { id: "sub-centrodeguias", codigo: "centrodeguias", nombre: "Centro de Guías", path: "guias", icono: "menu_book", permisos: [{ id: "p-centrodeguias", codigo: "acceso.centrodeguias", nombre: "Acceso a Centro de Guías" }] }
    ]
  },
  {
    id: "mod-finanzas",
    codigo: "finanzasycontabilidad",
    nombre: "Finanzas y Contabilidad",
    icono: "account_balance_wallet",
    permisos: [{ id: "p-finanzas", codigo: "acceso.finanzasycontabilidad", nombre: "Acceso a Finanzas y Contabilidad" }],
    submodulos: [
      { id: "sub-tesoreriaingresos", codigo: "tesoreriaingresos", nombre: "Tesorería (Ingresos)", path: "ingresos", icono: "account_balance_wallet", permisos: [{ id: "p-tesoreriaingresos", codigo: "acceso.tesoreriaingresos", nombre: "Acceso a Tesorería (Ingresos)" }] },
      { id: "sub-comprasxcp", codigo: "comprasxcp", nombre: "Compras y CxP", path: "compras", icono: "shopping_cart", permisos: [{ id: "p-comprasxcp", codigo: "acceso.comprasxcp", nombre: "Acceso a Compras y CxP" }] },
      { id: "sub-contabilidaderp", codigo: "contabilidaderp", nombre: "Contabilidad ERP", path: "contabilidad", icono: "account_balance", permisos: [{ id: "p-contabilidaderp", codigo: "acceso.contabilidaderp", nombre: "Acceso a Contabilidad ERP" }] },
      { id: "sub-facturacioncfdi", codigo: "facturacioncfdi", nombre: "Facturación (CFDI 4.0)", path: "fiscal", icono: "receipt_long", permisos: [{ id: "p-facturacioncfdi", codigo: "acceso.facturacioncfdi", nombre: "Acceso a Facturación (CFDI 4.0)" }] },
      { id: "sub-prospeccionleads", codigo: "prospeccionleads", nombre: "Prospección / Leads", path: "prospeccion", icono: "trending_up", permisos: [{ id: "p-prospeccionleads", codigo: "acceso.prospeccionleads", nombre: "Acceso a Prospección / Leads" }] },
      { id: "sub-crmycobranza", codigo: "crmycobranza", nombre: "CRM y Cobranza", path: "crm", icono: "people", permisos: [{ id: "p-crmycobranza", codigo: "acceso.crmycobranza", nombre: "Acceso a CRM y Cobranza" }] }
    ]
  },
  {
    id: "mod-legal",
    codigo: "legal",
    nombre: "Legal",
    icono: "gavel",
    permisos: [{ id: "p-legal", codigo: "acceso.legal", nombre: "Acceso a Legal" }],
    submodulos: [
      { id: "sub-gestiondocumental", codigo: "gestiondocumental", nombre: "Gestión Documental", path: "documentos", icono: "folder_open", permisos: [{ id: "p-gestiondocumental", codigo: "acceso.gestiondocumental", nombre: "Acceso a Gestión Documental" }] },
      { id: "sub-arealegal", codigo: "arealegal", nombre: "Área Legal", path: "legal", icono: "balance", permisos: [{ id: "p-arealegal", codigo: "acceso.arealegal", nombre: "Acceso a Área Legal" }] }
    ]
  },
  {
    id: "mod-administracion",
    codigo: "administracion",
    nombre: "Administración",
    icono: "settings_suggest",
    permisos: [{ id: "p-administracion", codigo: "acceso.administracion", nombre: "Acceso a Administración" }],
    submodulos: [
      { id: "sub-directorio", codigo: "directorio", nombre: "Directorio", path: "usuarios", icono: "group", permisos: [{ id: "p-directorio", codigo: "acceso.directorio", nombre: "Acceso a Directorio" }] },
      { id: "sub-rrhhynominas", codigo: "rrhhynominas", nombre: "RRHH y Nóminas", path: "recursos-humanos", icono: "folder_managed", permisos: [{ id: "p-rrhhynominas", codigo: "acceso.rrhhynominas", nombre: "Acceso a RRHH y Nóminas" }] },
      { id: "sub-configuracionbase", codigo: "configuracionbase", nombre: "Configuración Base", path: "configuracion", icono: "tune", permisos: [{ id: "p-configuracionbase", codigo: "acceso.configuracionbase", nombre: "Acceso a Configuración Base" }] }
    ]
  }
];

// Mapeador de códigos dinámicos a booleanos legacy
const mapPermisoCodesToBooleans = (permCodes) => {
    const s = new Set(permCodes || []);
    return {
        canViewSummary: s.has('acceso.resumenoperativo'),
        canAccessManagement: s.has('acceso.resumenoperativo') || s.has('acceso.sistemas') || s.has('acceso.permisosyroles') || s.has('acceso.rolesypermisos'),
        canAccessQuotes: s.has('acceso.cotizadores') || s.has('acceso.cotizadordarmax'),
        canAccessDistributorQuotes: s.has('acceso.cotizadordistribuidor'),
        canAccessInventory: s.has('acceso.operaciones') || s.has('acceso.inventarioglobal'),
        canAccessVending: s.has('acceso.cortesvending'),
        canAccessInstallation: s.has('acceso.ingenieriayproyectos') || s.has('acceso.controlinstalacion'),
        canAccessShowcase: s.has('acceso.mapainstalaciones'),
        canAccessSistemas: s.has('acceso.sistemas') || s.has('acceso.proyectosactividades') || s.has('proyectosactividades.jefe') || s.has('proyectosactividades.colaborador') || s.has('acceso.permisosyroles') || s.has('acceso.rolesypermisos'),
        canManageSistemas: s.has('acceso.sistemas') || s.has('proyectosactividades.jefe') || s.has('acceso.permisosyroles') || s.has('acceso.rolesypermisos'),
        canAccessMarketing: s.has('acceso.marketingyestrategia') || s.has('acceso.plannerdigital') || s.has('plannerdigital.jefe') || s.has('plannerdigital.colaborador') || s.has('acceso.promociones') || s.has('acceso.contenidoyrecursos') || s.has('acceso.editorblog'),
        canAccessFinances: s.has('acceso.finanzasycontabilidad') || s.has('acceso.tesoreriaingresos') || s.has('acceso.comprasxcp'),
        canAccessAccounting: s.has('acceso.contabilidaderp') || s.has('acceso.facturacioncfdi'),
        canAccessLeads: s.has('acceso.prospeccionleads') || s.has('acceso.crmycobranza'),
        canAccessLegal: s.has('acceso.legal') || s.has('acceso.gestiondocumental') || s.has('acceso.arealegal'),
        canAccessRH: s.has('acceso.administracion') || s.has('acceso.directorio') || s.has('acceso.rrhhynominas'),
        canAccessConfig: s.has('acceso.configuracionbase')
    };
};

const Roles = () => {
    const { user, hasPermission, refreshUser } = useAuth();
    const { fetchManagementData } = useGestion();

    // Verificación de acceso a Roles y Permisos (acceso.permisosyroles, acceso.rolesypermisos, acceso.sistemas o ADMIN)
    const canAccessSection = useMemo(() => {
        if (!user) return false;
        if (user.role === 'ADMIN' || user.roles?.some(r => r.name?.toUpperCase() === 'ADMIN')) return true;
        return hasPermission('acceso.permisosyroles') || hasPermission('acceso.rolesypermisos') || hasPermission('acceso.sistemas') || hasPermission('canAccessSistemas') || hasPermission('canManageSistemas');
    }, [user, hasPermission]);

    // Pestaña activa: 'roles' | 'asignaciones' | 'estructura'
    const [activeTab, setActiveTab] = useState('roles');

    // Estados de datos
    const [roles, setRoles] = useState([]);
    const [modules, setModules] = useState(DEFAULT_MODULES_TREE);
    const [collaborators, setCollaborators] = useState([]);
    const [loading, setLoading] = useState(true);

    // Estados de filtros y búsqueda
    const [searchRolesQuery, setSearchRolesQuery] = useState('');
    const [searchCollabQuery, setSearchCollabQuery] = useState('');
    const [collabRoleFilter, setCollabRoleFilter] = useState('');
    const [expandedModules, setExpandedModules] = useState({});

    // Modales
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);
    const [isCollabModalOpen, setIsCollabModalOpen] = useState(false);
    const [isNewModuleModalOpen, setIsNewModuleModalOpen] = useState(false);
    const [isNewSubmoduleModalOpen, setIsNewSubmoduleModalOpen] = useState(false);
    const [isNewPermisoModalOpen, setIsNewPermisoModalOpen] = useState(false);

    // Selecciones actuales para modales
    const [editingRole, setEditingRole] = useState(null);
    const [editingCollaborator, setEditingCollaborator] = useState(null);

    // Formularios
    const [roleForm, setRoleForm] = useState({
        name: '',
        description: '',
        permisoIds: []
    });

    const [collabFormRoleIds, setCollabFormRoleIds] = useState([]);
    const [collabFormPermisoIds, setCollabFormPermisoIds] = useState([]);
    const [collabModalTab, setCollabModalTab] = useState('roles'); // 'roles' | 'permisos'
    const [collabPermSearch, setCollabPermSearch] = useState('');
    const [selectedRoleUserIds, setSelectedRoleUserIds] = useState([]);

    const [moduleForm, setModuleForm] = useState({
        codigo: '',
        nombre: '',
        icono: 'folder',
        orden: 0
    });

    const [submoduleForm, setSubmoduleForm] = useState({
        moduloId: '',
        codigo: '',
        nombre: '',
        path: '',
        icono: 'circle',
        orden: 0
    });

    const [permisoForm, setPermisoForm] = useState({
        codigo: '',
        nombre: '',
        descripcion: '',
        moduloId: '',
        submoduloId: ''
    });

    // Carga de datos tolerante a fallos independientes
    const loadAllData = async () => {
        try {
            setLoading(true);

            // 1. Cargar Roles (independiente)
            try {
                const rolesData = await fetchRoles();
                setRoles(rolesData || []);
            } catch (rErr) {
                console.error('Error fetching roles:', rErr);
                toast.error('No se pudieron obtener los roles del servidor');
            }

            // 2. Cargar Módulos (con fallback a DEFAULT_MODULES_TREE si el backend aún no tiene la ruta)
            try {
                const modulesData = await fetchModules();
                if (modulesData && modulesData.length > 0) {
                    setModules(modulesData);
                    const exp = {};
                    modulesData.forEach(m => { exp[m.id] = true; });
                    setExpandedModules(exp);
                } else {
                    setModules(DEFAULT_MODULES_TREE);
                }
            } catch (mErr) {
                console.warn('Backend aún no responde a /modules, usando árbol RBAC predeterminado.');
                setModules(DEFAULT_MODULES_TREE);
                const exp = {};
                DEFAULT_MODULES_TREE.forEach(m => { exp[m.id] = true; });
                setExpandedModules(exp);
            }

            // 3. Cargar Colaboradores (con fallback a /users si /collaborators aún no existe en el backend)
            try {
                const collabsData = await fetchCollaborators();
                setCollaborators(collabsData || []);
            } catch (cErr) {
                console.warn('Backend aún no responde a /collaborators, usando fallback /users.');
                try {
                    const usersResponse = await apiClient.get('/users');
                    const usersData = usersResponse.data || [];
                    const filtered = usersData.filter(u => u.type === 'COLABORADOR' || u.role !== 'CLIENTE');
                    setCollaborators(filtered);
                } catch (uErr) {
                    console.error('Error in fallback users fetch:', uErr);
                }
            }

        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (canAccessSection) {
            loadAllData();
        }
    }, [canAccessSection]);

    // Todos los permisos planos para búsquedas rápidas (filtrando duplicados de submódulos)
    const allPermisosList = useMemo(() => {
        const list = [];
        (modules || []).forEach(mod => {
            (mod.permisos || []).filter(p => !p.submoduloId).forEach(p => list.push({ ...p, moduloNombre: mod.nombre, moduloIcono: mod.icono }));
            (mod.submodulos || []).forEach(sub => {
                (sub.permisos || []).forEach(p => list.push({ ...p, moduloNombre: mod.nombre, submoduloNombre: sub.nombre, submoduloIcono: sub.icono }));
            });
        });
        return list;
    }, [modules]);

    // Helper: Extraer identificadores o códigos de permisos de un rol (incluso si viene de formato legado)
    const extractPermisosFromRole = (role) => {
        if (!role) return [];
        // Si el rol ya tiene la relación permisos cargada de la BD
        if (role.permisos && role.permisos.length > 0) {
            return role.permisos.map(p => p.id || p.codigo);
        }

        // Si el rol vino del backend anterior con booleanos legacy
        const matchedCodes = [];
        if (role.canViewSummary || role.canAccessManagement) matchedCodes.push('acceso.resumenoperativo');
        if (role.canAccessQuotes) matchedCodes.push('acceso.cotizadores', 'acceso.cotizadordarmax');
        if (role.canAccessDistributorQuotes) matchedCodes.push('acceso.cotizadordistribuidor');
        if (role.canAccessInventory) matchedCodes.push('acceso.operaciones', 'acceso.inventarioglobal');
        if (role.canAccessVending) matchedCodes.push('acceso.cortesvending');
        if (role.canAccessInstallation) matchedCodes.push('acceso.ingenieriayproyectos', 'acceso.controlinstalacion');
        if (role.canAccessShowcase) matchedCodes.push('acceso.mapainstalaciones');
        if (role.canAccessSistemas || role.canManageSistemas) matchedCodes.push('acceso.sistemas', 'acceso.proyectosactividades', 'acceso.rolesypermisos');
        if (role.canAccessMarketing) matchedCodes.push('acceso.marketingyestrategia', 'acceso.plannerdigital', 'acceso.promociones', 'acceso.contenidoyrecursos', 'acceso.editorblog');
        if (role.canAccessFinances) matchedCodes.push('acceso.finanzasycontabilidad', 'acceso.tesoreriaingresos', 'acceso.comprasxcp');
        if (role.canAccessAccounting) matchedCodes.push('acceso.contabilidaderp', 'acceso.facturacioncfdi');
        if (role.canAccessLeads) matchedCodes.push('acceso.prospeccionleads', 'acceso.crmycobranza');
        if (role.canAccessLegal) matchedCodes.push('acceso.legal', 'acceso.gestiondocumental', 'acceso.arealegal');
        if (role.canAccessRH) matchedCodes.push('acceso.administracion', 'acceso.directorio', 'acceso.rrhhynominas');
        if (role.canAccessConfig) matchedCodes.push('acceso.configuracionbase');

        // Mapear los matchedCodes a los IDs de allPermisosList
        const ids = [];
        matchedCodes.forEach(code => {
            const found = allPermisosList.find(p => p.codigo === code);
            if (found) ids.push(found.id);
            else ids.push(code);
        });
        return Array.from(new Set(ids));
    };

    // Mapa de permisos heredados por los roles seleccionados para el colaborador
    const inheritedPermsMap = useMemo(() => {
        const map = new Map(); // idOrCode -> roleName
        if (!collabFormRoleIds || collabFormRoleIds.length === 0) return map;
        collabFormRoleIds.forEach(roleId => {
            const roleObj = roles.find(r => r.id === roleId);
            if (roleObj) {
                const rPerms = extractPermisosFromRole(roleObj);
                rPerms.forEach(pidOrCode => {
                    const pObj = allPermisosList.find(p => p.id === pidOrCode || p.codigo === pidOrCode);
                    const code = pObj ? pObj.codigo : pidOrCode;
                    const id = pObj ? pObj.id : pidOrCode;
                    map.set(code, roleObj.name);
                    map.set(id, roleObj.name);
                });
            }
        });
        return map;
    }, [collabFormRoleIds, roles, allPermisosList]);

    // =====================================================================
    // ACCIONES: ROLES MAESTROS
    // =====================================================================
    const handleOpenRoleModal = (role = null) => {
        if (role) {
            setEditingRole(role);
            const extractedPerms = extractPermisosFromRole(role);
            setRoleForm({
                name: role.name || '',
                description: role.description || '',
                permisoIds: extractedPerms
            });
        } else {
            setEditingRole(null);
            setRoleForm({
                name: '',
                description: '',
                permisoIds: []
            });
        }
        setIsRoleModalOpen(true);
    };

    const handleTogglePermisoInRole = (permisoId, permisoCodigo) => {
        setRoleForm(prev => {
            const isMatch = (idOrCode) => idOrCode === permisoId || (permisoCodigo && idOrCode === permisoCodigo);
            const exists = prev.permisoIds.some(isMatch);

            return {
                ...prev,
                permisoIds: exists 
                    ? prev.permisoIds.filter(id => !isMatch(id))
                    : [...prev.permisoIds, permisoId]
            };
        });
    };

    const handleToggleAllModulePerms = (mod) => {
        const modPermIds = [];
        (mod.permisos || []).filter(p => !p.submoduloId).forEach(p => modPermIds.push(p.id));
        (mod.submodulos || []).forEach(s => {
            (s.permisos || []).forEach(p => modPermIds.push(p.id));
        });

        const allSelected = modPermIds.every(id => roleForm.permisoIds.includes(id));

        setRoleForm(prev => {
            if (allSelected) {
                return {
                    ...prev,
                    permisoIds: prev.permisoIds.filter(id => !modPermIds.includes(id))
                };
            } else {
                const combined = Array.from(new Set([...prev.permisoIds, ...modPermIds]));
                return {
                    ...prev,
                    permisoIds: combined
                };
            }
        });
    };

    const handleSelectAllPerms = () => {
        const allIds = allPermisosList.map(p => p.id);
        setRoleForm(prev => ({ ...prev, permisoIds: allIds }));
    };

    const handleDeselectAllPerms = () => {
        setRoleForm(prev => ({ ...prev, permisoIds: [] }));
    };

    const handleSaveRole = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            
            // Obtener códigos de permisos seleccionados
            const selectedCodes = [];
            roleForm.permisoIds.forEach(idOrCode => {
                const pObj = allPermisosList.find(p => p.id === idOrCode || p.codigo === idOrCode);
                if (pObj) selectedCodes.push(pObj.codigo);
                else if (typeof idOrCode === 'string') selectedCodes.push(idOrCode);
            });

            // Compatibilidad híbrida: enviar tanto los booleanos legados como permisoIds
            const legacyBooleans = mapPermisoCodesToBooleans(selectedCodes);
            const payload = {
                ...legacyBooleans,
                ...roleForm,
                permisoIds: roleForm.permisoIds
            };

            if (editingRole) {
                await updateRole(editingRole.id, payload);
                toast.success(`Rol "${roleForm.name}" actualizado exitosamente`);
            } else {
                await createRole(payload);
                toast.success(`Rol "${roleForm.name}" creado exitosamente`);
            }
            setIsRoleModalOpen(false);
            setEditingRole(null);
            await loadAllData();
            if (fetchManagementData) fetchManagementData();
            if (refreshUser) await refreshUser();
        } catch (error) {
            console.error('Error saving role:', error);
            toast.error(error.message || 'Error al guardar el rol');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteRole = async (role) => {
        if (role.isSystem) {
            Swal.fire({
                title: 'Rol Protegido',
                text: 'Los roles del sistema no pueden eliminarse por seguridad.',
                icon: 'warning'
            });
            return;
        }

        const confirm = await Swal.fire({
            title: `¿Eliminar rol "${role.name}"?`,
            text: 'Esta acción no se puede deshacer y fallará si hay colaboradores usando este rol actualmente.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (confirm.isConfirmed) {
            try {
                await deleteRole(role.id);
                toast.success('El rol ha sido eliminado');
                await loadAllData();
            } catch (error) {
                toast.error(error.message || 'No se pudo eliminar el rol');
            }
        }
    };

    // =====================================================================
    // ACCIONES: ASIGNACIÓN DE COLABORADORES
    // =====================================================================
    // Modal 1: Desde el Rol (seleccionar qué colaboradores tienen ese rol)
    const handleOpenRoleUsersModal = (role) => {
        setEditingRole(role);
        const userIds = collaborators
            .filter(c => c.roles?.some(r => r.id === role.id) || c.roleId === role.id)
            .map(c => c.id);
        setSelectedRoleUserIds(userIds);
        setIsUsersModalOpen(true);
    };

    const handleSaveRoleUsers = async () => {
        try {
            setLoading(true);
            await updateRole(editingRole.id, {
                name: editingRole.name,
                description: editingRole.description,
                userIds: selectedRoleUserIds
            });
            toast.success(`Personal actualizado: ${selectedRoleUserIds.length} colaboradores asignados a ${editingRole.name}`);
            setIsUsersModalOpen(false);
            setEditingRole(null);
            await loadAllData();
            if (refreshUser) await refreshUser();
        } catch (error) {
            toast.error(error.message || 'Error al actualizar personal del rol');
        } finally {
            setLoading(false);
        }
    };

    // Modal 2: Desde el Colaborador (gestionar roles y permisos directos)
    const handleOpenCollabRolesModal = (collab) => {
        setEditingCollaborator(collab);

        // Roles asignados
        const currentRoleIds = (collab.roles || []).map(r => r.id);
        if (collab.roleId && !currentRoleIds.includes(collab.roleId)) {
            currentRoleIds.push(collab.roleId);
        }
        setCollabFormRoleIds(currentRoleIds);

        // Permisos directos asignados
        const currentPermisoIds = (collab.permisos || []).map(p => p.id || p.codigo);
        setCollabFormPermisoIds(currentPermisoIds);

        setCollabModalTab('roles');
        setCollabPermSearch('');
        setIsCollabModalOpen(true);
    };

    const handleToggleRoleIdInCollab = (roleId) => {
        setCollabFormRoleIds(prev => 
            prev.includes(roleId) ? prev.filter(id => id !== roleId) : [...prev, roleId]
        );
    };

    const handleToggleDirectPermisoInCollab = (permisoId, permisoCodigo) => {
        setCollabFormPermisoIds(prev => {
            const isMatch = (idOrCode) => idOrCode === permisoId || (permisoCodigo && idOrCode === permisoCodigo);
            const exists = prev.some(isMatch);
            return exists
                ? prev.filter(id => !isMatch(id))
                : [...prev, permisoId];
        });
    };

    const handleSaveCollabAccess = async () => {
        try {
            setLoading(true);
            try {
                await updateCollaboratorRoles(editingCollaborator.id, collabFormRoleIds, collabFormPermisoIds);
            } catch (pErr) {
                // Fallback a PUT /users/:id si el endpoint nuevo no estuviese disponible
                await apiClient.put(`/users/${editingCollaborator.id}`, {
                    roleIds: collabFormRoleIds,
                    permisoIds: collabFormPermisoIds
                });
            }
            toast.success(`Roles y permisos actualizados para ${editingCollaborator.name}`);
            setIsCollabModalOpen(false);
            setEditingCollaborator(null);
            await loadAllData();
            if (refreshUser) await refreshUser();
        } catch (error) {
            toast.error(error.message || 'Error al actualizar accesos del colaborador');
        } finally {
            setLoading(false);
        }
    };

    // =====================================================================
    // ACCIONES: MÓDULOS, SUBMÓDULOS Y PERMISOS
    // =====================================================================
    const handleSaveNewModule = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            await createModule(moduleForm);
            toast.success(`Módulo "${moduleForm.nombre}" y permiso "acceso.${moduleForm.codigo.toLowerCase()}" creados`);
            setIsNewModuleModalOpen(false);
            setModuleForm({ codigo: '', nombre: '', icono: 'folder', orden: 0 });
            await loadAllData();
            if (refreshUser) await refreshUser();
        } catch (error) {
            toast.error(error.message || 'Error al crear módulo');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteModule = async (mod) => {
        const confirm = await Swal.fire({
            title: `¿Eliminar módulo "${mod.nombre}"?`,
            text: `Se eliminarán también todos sus submódulos y sus permisos asociados.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Sí, eliminar todo',
            cancelButtonText: 'Cancelar'
        });

        if (confirm.isConfirmed) {
            try {
                await deleteModule(mod.id);
                toast.success('Módulo eliminado');
                await loadAllData();
            } catch (error) {
                toast.error(error.message || 'Error al eliminar módulo');
            }
        }
    };

    const handleSaveNewSubmodule = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            await createSubmodule(submoduleForm);
            toast.success(`Submódulo "${submoduleForm.nombre}" y permiso "acceso.${submoduleForm.codigo.toLowerCase()}" creados`);
            setIsNewSubmoduleModalOpen(false);
            setSubmoduleForm({ moduloId: '', codigo: '', nombre: '', path: '', icono: 'circle', orden: 0 });
            await loadAllData();
            if (refreshUser) await refreshUser();
        } catch (error) {
            toast.error(error.message || 'Error al crear submódulo');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSubmodule = async (sub) => {
        const confirm = await Swal.fire({
            title: `¿Eliminar submódulo "${sub.nombre}"?`,
            text: 'Se eliminarán sus permisos asociados.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (confirm.isConfirmed) {
            try {
                await deleteSubmodule(sub.id);
                toast.success('Submódulo eliminado');
                await loadAllData();
            } catch (error) {
                toast.error(error.message || 'Error al eliminar submódulo');
            }
        }
    };

    const handleSaveNewPermiso = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            await createPermission(permisoForm);
            toast.success(`Permiso "${permisoForm.codigo}" creado exitosamente`);
            setIsNewPermisoModalOpen(false);
            setPermisoForm({ codigo: '', nombre: '', descripcion: '', moduloId: '', submoduloId: '' });
            await loadAllData();
            if (refreshUser) await refreshUser();
        } catch (error) {
            toast.error(error.message || 'Error al crear permiso');
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePermiso = async (perm) => {
        const confirm = await Swal.fire({
            title: `¿Eliminar permiso "${perm.codigo}"?`,
            text: 'Dejará de estar disponible para todos los roles.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (confirm.isConfirmed) {
            try {
                await deletePermission(perm.id);
                toast.success('Permiso eliminado');
                await loadAllData();
                if (refreshUser) await refreshUser();
            } catch (error) {
                toast.error(error.message || 'Error al eliminar permiso');
            }
        }
    };

    // =====================================================================
    // FILTROS
    // =====================================================================
    const filteredRoles = useMemo(() => {
        const q = searchRolesQuery.toLowerCase().trim();
        if (!q) return roles;
        return roles.filter(r => 
            (r.name && r.name.toLowerCase().includes(q)) ||
            (r.description && r.description.toLowerCase().includes(q))
        );
    }, [roles, searchRolesQuery]);

    const filteredCollaborators = useMemo(() => {
        const q = searchCollabQuery.toLowerCase().trim();
        return collaborators.filter(c => {
            const matchesQuery = !q || 
                (c.name && c.name.toLowerCase().includes(q)) ||
                (c.email && c.email.toLowerCase().includes(q)) ||
                (c.customId && c.customId.toLowerCase().includes(q));

            const matchesRole = !collabRoleFilter || 
                c.roles?.some(r => r.id === collabRoleFilter) ||
                c.roleId === collabRoleFilter;

            return matchesQuery && matchesRole;
        });
    }, [collaborators, searchCollabQuery, collabRoleFilter]);

    // Resumen de Métricas
    const totalRolesCount = roles.length;
    const totalPermisosCount = allPermisosList.length;
    const totalCollaboratorsCount = collaborators.length;

    // Si no tiene acceso al módulo de Sistemas
    if (!canAccessSection) {
        return (
            <div className="p-8 sm:p-16 text-center max-w-xl mx-auto space-y-4">
                <div className="w-16 h-16 mx-auto rounded-3xl bg-rose-50 text-rose-500 border border-rose-200 flex items-center justify-center">
                    <span className="material-symbols-outlined text-3xl">lock</span>
                </div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">Acceso Restringido a Sistemas</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Este apartado de administración de roles, submódulos y matriz de permisos requiere la credencial 
                    <strong className="text-primary font-bold"> acceso.sistemas</strong> o rango de Administrador General.
                </p>
                <div className="pt-2">
                    <span className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold rounded-full">
                        RBAC v2 • Área de Sistemas
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-24 animate-fade-in w-full max-w-full min-w-0 overflow-x-hidden">
            {/* CABECERA PRINCIPAL */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800 flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">terminal</span>
                            Sistemas • Control de Acceso RBAC v2
                        </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                        <span>Roles y Permisos</span>
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">
                        Administración centralizada de roles maestros, módulos, submódulos, catálogo de permisos y asignación a colaboradores.
                    </p>
                </div>

                {/* ACCIONES SUPERIORES SEGÚN PESTAÑA */}
                <div className="flex items-center gap-2 flex-wrap">
                    {activeTab === 'roles' && (
                        <button
                            type="button"
                            onClick={() => handleOpenRoleModal()}
                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-white font-bold text-xs shadow-xs hover:bg-primary-dark active:scale-95 transition-all"
                        >
                            <span className="material-symbols-outlined text-base">add_moderator</span>
                            <span>Nuevo Rol Maestro</span>
                        </button>
                    )}

                    {activeTab === 'estructura' && (
                        <>
                            <button
                                type="button"
                                onClick={() => setIsNewModuleModalOpen(true)}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-white font-bold text-xs shadow-xs hover:bg-primary-dark active:scale-95 transition-all"
                            >
                                <span className="material-symbols-outlined text-base">create_new_folder</span>
                                <span>Nuevo Módulo</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsNewSubmoduleModalOpen(true)}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 text-white dark:bg-gray-700 font-bold text-xs shadow-xs hover:bg-slate-900 active:scale-95 transition-all"
                            >
                                <span className="material-symbols-outlined text-base">post_add</span>
                                <span>Nuevo Submódulo</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsNewPermisoModalOpen(true)}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-xs hover:bg-emerald-700 active:scale-95 transition-all"
                            >
                                <span className="material-symbols-outlined text-base">key</span>
                                <span>Nuevo Permiso</span>
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* MÉTRICAS RÁPIDAS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/80 dark:border-gray-800/80 p-4 rounded-2xl shadow-xs">
                    <div className="flex items-center justify-between text-gray-400 mb-1">
                        <span className="text-[10px] font-black uppercase tracking-wider">Roles Maestros</span>
                        <span className="material-symbols-outlined text-base text-blue-500">shield</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">{totalRolesCount}</p>
                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">Puestos definidos</p>
                </div>

                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/80 dark:border-gray-800/80 p-4 rounded-2xl shadow-xs">
                    <div className="flex items-center justify-between text-gray-400 mb-1">
                        <span className="text-[10px] font-black uppercase tracking-wider">Módulos</span>
                        <span className="material-symbols-outlined text-base text-purple-500">folder_open</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400">{modules.length}</p>
                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">Áreas del dashboard</p>
                </div>

                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/80 dark:border-gray-800/80 p-4 rounded-2xl shadow-xs">
                    <div className="flex items-center justify-between text-gray-400 mb-1">
                        <span className="text-[10px] font-black uppercase tracking-wider">Permisos Totales</span>
                        <span className="material-symbols-outlined text-base text-emerald-500">key</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">{totalPermisosCount}</p>
                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">Constantes acceso.*</p>
                </div>

                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/80 dark:border-gray-800/80 p-4 rounded-2xl shadow-xs">
                    <div className="flex items-center justify-between text-gray-400 mb-1">
                        <span className="text-[10px] font-black uppercase tracking-wider">Colaboradores</span>
                        <span className="material-symbols-outlined text-base text-amber-500">groups</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">{totalCollaboratorsCount}</p>
                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">Personal en sistema</p>
                </div>
            </div>

            {/* SELECTOR DE PESTAÑAS (SEGMENTED TABS) CON DESPLAZAMIENTO TÁCTIL */}
            <div className="w-full max-w-full overflow-x-auto overscroll-contain touch-pan-x [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden select-none border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-1 sm:gap-2 min-w-max pb-0.5">
                    <button
                        type="button"
                        onClick={() => setActiveTab('roles')}
                        className={`pb-3 px-3.5 sm:px-4 font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 whitespace-nowrap flex-shrink-0 touch-manipulation active:scale-95 ${
                            activeTab === 'roles'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                        }`}
                    >
                        <span className="material-symbols-outlined text-base">shield</span>
                        <span>Roles Maestros</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                            {roles.length}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('asignaciones')}
                        className={`pb-3 px-3.5 sm:px-4 font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 whitespace-nowrap flex-shrink-0 touch-manipulation active:scale-95 ${
                            activeTab === 'asignaciones'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                        }`}
                    >
                        <span className="material-symbols-outlined text-base">manage_accounts</span>
                        <span>Asignación a Colaboradores</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                            {collaborators.length}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('estructura')}
                        className={`pb-3 px-3.5 sm:px-4 font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 whitespace-nowrap flex-shrink-0 touch-manipulation active:scale-95 ${
                            activeTab === 'estructura'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                        }`}
                    >
                        <span className="material-symbols-outlined text-base">account_tree</span>
                        <span>Módulos y Permisos</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                            {modules.length} mods
                        </span>
                    </button>
                </div>
            </div>

            {/* ================================================================ */}
            {/* PESTAÑA 1: ROLES MAESTROS                                        */}
            {/* ================================================================ */}
            {activeTab === 'roles' && (
                <div className="space-y-5 animate-fade-in">
                    {/* Buscador de Roles */}
                    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/80 dark:border-gray-800/80 p-3 sm:p-4 rounded-2xl shadow-xs flex items-center justify-between gap-4">
                        <div className="relative flex-1">
                            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                                search
                            </span>
                            <input
                                type="text"
                                value={searchRolesQuery}
                                onChange={(e) => setSearchRolesQuery(e.target.value)}
                                placeholder="Buscar rol por nombre o funciones..."
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-950/70 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-bold text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                            />
                        </div>
                        <span className="text-[11px] text-gray-400 font-medium hidden sm:inline whitespace-nowrap">
                            Mostrando <strong>{filteredRoles.length}</strong> de {totalRolesCount} roles
                        </span>
                    </div>

                    {/* Tarjetas de Roles */}
                    {loading ? (
                        <div className="flex justify-center py-20 text-gray-400">
                            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                        </div>
                    ) : filteredRoles.length === 0 ? (
                        <div className="p-16 text-center text-gray-400 bg-white/80 dark:bg-gray-900/80 rounded-3xl border border-gray-200/80 dark:border-gray-800/80">
                            <span className="material-symbols-outlined text-4xl mb-2 text-gray-300">security</span>
                            <p className="text-sm font-bold text-gray-700 dark:text-gray-300">No se encontraron roles</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {filteredRoles.map(role => {
                                const rolePerms = extractPermisosFromRole(role);
                                const assignedPermsCount = rolePerms.length;
                                const assignedUsersCount = role._count?.users || (role.users ? role.users.length : 0);

                                return (
                                    <div
                                        key={role.id}
                                        className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-200/80 dark:border-gray-800/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                                    >
                                        <div>
                                            <div className="flex items-start justify-between gap-3 mb-2">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        {role.isSystem ? (
                                                            <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60">
                                                                Sistema
                                                            </span>
                                                        ) : (
                                                            <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900/60">
                                                                Personalizado
                                                            </span>
                                                        )}
                                                        <span className="text-[9px] font-bold text-gray-400">
                                                            {assignedPermsCount} / {totalPermisosCount} permisos
                                                        </span>
                                                    </div>
                                                    <h3 className="text-base font-bold text-gray-900 dark:text-white uppercase tracking-tight">
                                                        {role.name}
                                                    </h3>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenRoleUsersModal(role)}
                                                    className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/80 text-xs font-bold text-gray-700 dark:text-gray-200 hover:text-primary dark:hover:text-primary transition-colors flex-shrink-0"
                                                    title="Asignar o ver colaboradores con este rol"
                                                >
                                                    <span className="material-symbols-outlined text-sm text-primary">groups</span>
                                                    <span>{assignedUsersCount}</span>
                                                </button>
                                            </div>

                                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 min-h-[32px] mb-4">
                                                {role.description || 'Sin descripción detallada de funciones.'}
                                            </p>

                                            {/* Permisos / Códigos activos (chips) */}
                                            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-1.5 mb-4">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                                                    Permisos Dinámicos Asignados
                                                </p>
                                                <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto custom-scrollbar">
                                                    {rolePerms.length > 0 ? (
                                                        rolePerms.slice(0, 6).map(permIdOrCode => {
                                                            const pObj = allPermisosList.find(p => p.id === permIdOrCode || p.codigo === permIdOrCode);
                                                            const code = pObj ? pObj.codigo : permIdOrCode;
                                                            return (
                                                                <span
                                                                    key={permIdOrCode}
                                                                    className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/60 truncate"
                                                                    title={code}
                                                                >
                                                                    {code}
                                                                </span>
                                                            );
                                                        })
                                                    ) : (
                                                        <span className="text-[10px] text-gray-400 italic">Sin permisos activos</span>
                                                    )}
                                                    {rolePerms.length > 6 && (
                                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-transparent dark:border-gray-700/60">
                                                            +{rolePerms.length - 6} más
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Acciones de la Tarjeta */}
                                        <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                            <button
                                                type="button"
                                                onClick={() => handleOpenRoleUsersModal(role)}
                                                className="flex items-center gap-1.5 text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-base text-primary">person_add</span>
                                                <span>Personal ({assignedUsersCount})</span>
                                            </button>

                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenRoleModal(role)}
                                                    className="p-1.5 text-gray-400 hover:text-primary dark:hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800/80 rounded-xl transition-all"
                                                    title="Editar permisos del rol"
                                                >
                                                    <span className="material-symbols-outlined text-lg">edit</span>
                                                </button>
                                                {!role.isSystem && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteRole(role)}
                                                        className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-all"
                                                        title="Eliminar rol"
                                                    >
                                                        <span className="material-symbols-outlined text-lg">delete</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ================================================================ */}
            {/* PESTAÑA 2: ASIGNACIÓN A COLABORADORES                             */}
            {/* ================================================================ */}
            {activeTab === 'asignaciones' && (
                <div className="space-y-5 animate-fade-in">
                    {/* Filtros de Colaboradores */}
                    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/80 dark:border-gray-800/80 p-4 rounded-2xl shadow-xs flex flex-col sm:flex-row items-center gap-3">
                        <div className="relative flex-1 w-full">
                            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                                search
                            </span>
                            <input
                                type="text"
                                value={searchCollabQuery}
                                onChange={(e) => setSearchCollabQuery(e.target.value)}
                                placeholder="Buscar colaborador por nombre, correo o ID (CO-...)..."
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-950/70 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-bold text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                            />
                        </div>

                        <div className="w-full sm:w-auto">
                            <select
                                value={collabRoleFilter}
                                onChange={(e) => setCollabRoleFilter(e.target.value)}
                                className="w-full sm:w-48 px-3 py-2.5 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/80 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                            >
                                <option value="" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">Todos los roles</option>
                                {roles.map(r => (
                                    <option key={r.id} value={r.id} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">{r.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Tabla de Colaboradores */}
                    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-200/80 dark:border-gray-800/80 overflow-hidden shadow-xs">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-950/90 text-gray-500 dark:text-gray-400">
                                        <th className="py-3.5 px-4 text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">Colaborador</th>
                                        <th className="py-3.5 px-4 text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">Sucursal</th>
                                        <th className="py-3.5 px-4 text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">Roles Asignados</th>
                                        <th className="py-3.5 px-4 text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 text-center">Permisos Efectivos</th>
                                        <th className="py-3.5 px-4 text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 text-right">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {filteredCollaborators.length > 0 ? (
                                        filteredCollaborators.map(collab => {
                                            // Calcular permisos únicos que tiene por sus roles + directos
                                            const rolePermCodes = new Set();
                                            (collab.roles || []).forEach(r => {
                                                const pCodes = extractPermisosFromRole(r);
                                                pCodes.forEach(c => rolePermCodes.add(c));
                                            });
                                            (collab.permisos || []).forEach(p => rolePermCodes.add(p.codigo || p.id));
                                            const directPermsCount = (collab.permisos || []).length;

                                            return (
                                                <tr key={collab.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors">
                                                    <td className="py-3.5 px-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs">
                                                                {collab.name?.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-bold text-gray-900 dark:text-white leading-tight">
                                                                    {collab.name}
                                                                </p>
                                                                <span className="text-[10px] text-gray-400 font-medium">
                                                                    #{collab.customId || 'SIN ID'} • {collab.email || 'Sin correo'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 px-4">
                                                        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                                                            {collab.store?.name || 'Central / Matriz'}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-4">
                                                        <div className="flex flex-wrap gap-1.5 max-w-xs">
                                                            {collab.roles && collab.roles.length > 0 ? (
                                                                collab.roles.map(r => (
                                                                    <span
                                                                        key={r.id}
                                                                        className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/60"
                                                                    >
                                                                        {r.name}
                                                                    </span>
                                                                ))
                                                            ) : (
                                                                <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-lg border border-rose-200 dark:border-rose-900/60">
                                                                    Sin rol asignado
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 px-4 text-center">
                                                        <div className="inline-flex flex-col items-center">
                                                            <span className="text-xs font-black px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60">
                                                                {rolePermCodes.size} permisos
                                                            </span>
                                                            {directPermsCount > 0 && (
                                                                <span className="text-[9px] font-bold text-primary mt-0.5">
                                                                    ★ {directPermsCount} directo{directPermsCount > 1 ? 's' : ''}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 px-4 text-right">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenCollabRolesModal(collab)}
                                                            className="px-3.5 py-1.5 rounded-xl bg-gray-100 hover:bg-primary hover:text-white dark:bg-gray-800 dark:hover:bg-primary dark:hover:text-white text-xs font-bold text-gray-700 dark:text-gray-200 transition-all active:scale-95 flex items-center gap-1.5 ml-auto shadow-xs border border-transparent dark:border-gray-700/60"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">shield</span>
                                                            <span>Asignar Roles y Permisos</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="py-12 text-center text-gray-400 text-xs font-medium">
                                                No se encontraron colaboradores con los criterios seleccionados.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ================================================================ */}
            {/* PESTAÑA 3: ARQUITECTURA DE MÓDULOS, SUBMÓDULOS Y PERMISOS         */}
            {/* ================================================================ */}
            {activeTab === 'estructura' && (
                <div className="space-y-4 animate-fade-in">
                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 p-3.5 rounded-2xl flex items-start gap-3">
                        <span className="material-symbols-outlined text-amber-500 text-xl flex-shrink-0 mt-0.5">info</span>
                        <div className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                            <strong>Catálogo Dinámico del Sistema:</strong> Cada módulo y submódulo que des de alta aquí generará 
                            automáticamente su constante de permiso con formato <code className="bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5 rounded font-black">acceso.[codigo]</code>. 
                            Luego podrás asignarlo a cualquier rol o colaborador.
                        </div>
                    </div>

                    {modules.map(mod => {
                        const isExpanded = !!expandedModules[mod.id];
                        const subCount = mod.submodulos?.length || 0;
                        const modPermsList = (mod.permisos || []).filter(p => !p.submoduloId);

                        return (
                            <div
                                key={mod.id}
                                className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/80 dark:border-gray-800/80 overflow-hidden shadow-xs"
                            >
                                {/* Cabecera del Módulo */}
                                <div className="p-4 bg-gray-50/80 dark:bg-gray-950/90 border-b border-gray-100 dark:border-gray-800/80 flex items-center justify-between gap-3">
                                    <div 
                                        className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                                        onClick={() => setExpandedModules(prev => ({ ...prev, [mod.id]: !prev[mod.id] }))}
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                                            <span className="material-symbols-outlined text-xl">{mod.icono || 'folder'}</span>
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="text-sm font-black text-gray-900 dark:text-white truncate">
                                                    {mod.nombre}
                                                </h3>
                                                <span className="text-[10px] font-black px-2 py-0.2 rounded-full bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 font-mono">
                                                    código: {mod.codigo}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-400 font-mono flex-wrap">
                                                <span>• {subCount} submódulos</span>
                                                <span>• {modPermsList.length} permiso(s) raíz</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setPermisoForm({ codigo: '', nombre: '', descripcion: '', moduloId: mod.id, submoduloId: '' });
                                                setIsNewPermisoModalOpen(true);
                                            }}
                                            className="px-2.5 py-1 text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-lg border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 transition-colors flex items-center gap-1"
                                            title="Agregar permiso a este módulo"
                                        >
                                            <span className="material-symbols-outlined text-xs">key</span>
                                            <span>+ Permiso</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSubmoduleForm(prev => ({ ...prev, moduloId: mod.id }));
                                                setIsNewSubmoduleModalOpen(true);
                                            }}
                                            className="px-2.5 py-1 text-[11px] font-bold bg-white dark:bg-gray-800/90 text-gray-700 dark:text-gray-200 rounded-lg border border-gray-200 dark:border-gray-700 hover:text-primary dark:hover:text-primary transition-colors flex items-center gap-1"
                                            title="Agregar submódulo a este módulo"
                                        >
                                            <span className="material-symbols-outlined text-xs">add</span>
                                            <span>Submódulo</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleDeleteModule(mod)}
                                            className="p-1.5 text-gray-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                            title="Eliminar módulo"
                                        >
                                            <span className="material-symbols-outlined text-base">delete</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setExpandedModules(prev => ({ ...prev, [mod.id]: !prev[mod.id] }))}
                                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-lg">
                                                {isExpanded ? 'expand_less' : 'expand_more'}
                                            </span>
                                        </button>
                                    </div>
                                </div>

                                {/* Lista de Submódulos y Permisos del Módulo */}
                                {isExpanded && (
                                    <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-gray-900/40 space-y-4">
                                        {/* 1. Submódulos */}
                                        {mod.submodulos && mod.submodulos.length > 0 ? (
                                            <div className="space-y-2.5">
                                                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                                                    Submódulos ({mod.submodulos.length})
                                                </span>
                                                {mod.submodulos.map(sub => {
                                                    const subPermsList = sub.permisos || [];
                                                    return (
                                                        <div
                                                            key={sub.id}
                                                            className="p-3.5 rounded-xl bg-gray-50/80 dark:bg-gray-950/60 border border-gray-200/80 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                                        >
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="material-symbols-outlined text-primary text-base">
                                                                        {sub.icono || 'circle'}
                                                                    </span>
                                                                    <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
                                                                        {sub.nombre}
                                                                    </p>
                                                                    <span className="text-[10px] text-gray-400 font-mono">
                                                                        /{sub.path}
                                                                    </span>
                                                                </div>

                                                                {/* Lista de todos los permisos asignados al submódulo */}
                                                                <div className="flex flex-wrap gap-1.5 mt-2">
                                                                    {subPermsList.length > 0 ? (
                                                                        subPermsList.map(p => (
                                                                            <span 
                                                                                key={p.id}
                                                                                className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1.5"
                                                                            >
                                                                                <span>{p.codigo}</span>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => handleDeletePermiso(p)}
                                                                                    className="text-gray-400 hover:text-rose-500 transition-colors ml-0.5"
                                                                                    title={`Eliminar permiso ${p.codigo}`}
                                                                                >
                                                                                    <span className="material-symbols-outlined text-[10px]">close</span>
                                                                                </button>
                                                                            </span>
                                                                        ))
                                                                    ) : (
                                                                        <span className="text-[10px] text-gray-400 font-mono italic">
                                                                            Sin permisos asociados
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-1.5 self-end sm:self-auto flex-shrink-0">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setPermisoForm({ codigo: '', nombre: '', descripcion: '', moduloId: mod.id, submoduloId: sub.id });
                                                                        setIsNewPermisoModalOpen(true);
                                                                    }}
                                                                    className="px-2 py-1 text-[10px] font-bold bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-700 hover:text-emerald-600 transition-colors flex items-center gap-1"
                                                                    title="Agregar permiso específico a este submódulo"
                                                                >
                                                                    <span className="material-symbols-outlined text-[11px]">add</span>
                                                                    <span>Permiso</span>
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDeleteSubmodule(sub)}
                                                                    className="p-1 text-gray-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                                                    title="Eliminar submódulo"
                                                                >
                                                                    <span className="material-symbols-outlined text-sm">delete</span>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-gray-400 italic py-1 pl-2">
                                                Sin submódulos registrados en este módulo.
                                            </p>
                                        )}

                                        {/* 2. Permisos a nivel de Módulo (raíz / adicionales) */}
                                        {modPermsList.length > 0 && (
                                            <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
                                                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-2">
                                                    Permisos a nivel de Módulo ({modPermsList.length})
                                                </span>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                                    {modPermsList.map(p => (
                                                        <div 
                                                            key={p.id}
                                                            className="p-2.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 flex items-center justify-between gap-2"
                                                        >
                                                            <div className="min-w-0">
                                                                <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                                                                    {p.nombre}
                                                                </p>
                                                                <p className="text-[10px] font-mono text-blue-700 dark:text-blue-300 font-bold truncate">
                                                                    {p.codigo}
                                                                </p>
                                                            </div>

                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeletePermiso(p)}
                                                                className="p-1 text-gray-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex-shrink-0"
                                                                title={`Eliminar permiso ${p.codigo}`}
                                                            >
                                                                <span className="material-symbols-outlined text-sm">close</span>
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ================================================================ */}
            {/* MODAL 1: CREAR / EDITAR ROL MAESTRO (CON ÁRBOL DE PERMISOS)      */}
            {/* ================================================================ */}
            {isRoleModalOpen && createPortal(
                <div 
                    className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fade-in"
                    onClick={() => setIsRoleModalOpen(false)}
                >
                    <div 
                        className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-4xl shadow-2xl border border-gray-200/80 dark:border-gray-800 flex flex-col max-h-[94vh] sm:max-h-[88vh] overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Cabecera */}
                        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-slate-50 via-white to-blue-50/40 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950/40 flex items-start justify-between gap-3 flex-shrink-0">
                            <div className="min-w-0 flex-1">
                                <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-100/70 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/60 px-2.5 py-0.5 rounded-full inline-block">
                                    Configuración de Rol
                                </span>
                                <h2 className="text-base sm:text-lg font-black text-gray-900 dark:text-white leading-tight mt-1 truncate">
                                    {editingRole ? `Editar Rol: ${editingRole.name}` : 'Crear Nuevo Rol Maestro'}
                                </h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                                    Selecciona los módulos y submódulos que estarán habilitados para este puesto.
                                </p>
                            </div>

                            <button 
                                type="button"
                                onClick={() => setIsRoleModalOpen(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
                            >
                                <span className="material-symbols-outlined text-xl">close</span>
                            </button>
                        </div>

                        {/* Formulario */}
                        <form onSubmit={handleSaveRole} className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 sm:p-6 space-y-4 sm:space-y-6 custom-scrollbar">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                        Nombre del Rol / Puesto <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        disabled={editingRole?.isSystem}
                                        value={roleForm.name}
                                        onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                                        placeholder="Ej: SUPERVISOR_PRODUCCION"
                                        className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950/70 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-bold text-gray-900 dark:text-white uppercase focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                        Descripción del Rol
                                    </label>
                                    <input
                                        type="text"
                                        value={roleForm.description}
                                        onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                                        placeholder="Funciones y alcance laboral..."
                                        className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950/70 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
                                    />
                                </div>
                            </div>

                            {/* Controles de Selección Masiva de Permisos */}
                            <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                <div className="min-w-0 flex-1">
                                    <h4 className="text-xs font-black uppercase tracking-wider text-gray-800 dark:text-white truncate">
                                        Permisos por Módulo y Submódulo ({roleForm.permisoIds.length} seleccionados)
                                    </h4>
                                    <p className="text-[11px] text-gray-400">
                                        Marca los accesos permitidos. Constantes estándar acceso.*
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <button
                                        type="button"
                                        onClick={handleSelectAllPerms}
                                        className="px-2.5 py-1.5 text-[11px] font-bold rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors whitespace-nowrap active:scale-95"
                                    >
                                        Seleccionar Todos
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleDeselectAllPerms}
                                        className="px-2.5 py-1.5 text-[11px] font-bold rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-transparent dark:border-gray-700/60 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors whitespace-nowrap active:scale-95"
                                    >
                                        Limpiar Selección
                                    </button>
                                </div>
                            </div>

                            {/* Árbol Dinámico de Módulos */}
                            <div className="space-y-3 sm:space-y-4">
                                {modules.map(mod => {
                                    const rootPerms = (mod.permisos || []).filter(p => !p.submoduloId);
                                    const modPerm = rootPerms[0];
                                    const isModPermChecked = modPerm 
                                        ? (roleForm.permisoIds.includes(modPerm.id) || roleForm.permisoIds.includes(modPerm.codigo))
                                        : false;

                                    return (
                                        <div
                                            key={mod.id}
                                            className="rounded-2xl border border-gray-200/80 dark:border-gray-800 p-3 sm:p-4 bg-gray-50/60 dark:bg-gray-950/60 space-y-3 overflow-hidden"
                                        >
                                            {/* Header del Módulo con switch maestro */}
                                            <div className="flex items-center justify-between gap-2 sm:gap-3 min-w-0">
                                                <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
                                                    <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                                                        <span className="material-symbols-outlined text-base sm:text-lg">
                                                            {mod.icono || 'folder'}
                                                        </span>
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <h5 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tight truncate leading-tight" title={mod.nombre}>
                                                            {mod.nombre}
                                                        </h5>
                                                        <span className="text-[10px] text-gray-400 font-mono truncate block leading-tight mt-0.5" title={modPerm?.codigo || `acceso.${mod.codigo}`}>
                                                            {modPerm?.codigo || `acceso.${mod.codigo}`}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleAllModulePerms(mod)}
                                                        className="text-[10px] font-bold text-primary hover:text-primary-dark hover:underline px-1.5 py-0.5 rounded-lg hover:bg-primary/5 transition-colors whitespace-nowrap active:scale-95"
                                                        title="Alternar selección de submódulos"
                                                    >
                                                        <span className="hidden sm:inline">Alternar Módulo</span>
                                                        <span className="sm:hidden">Alternar</span>
                                                    </button>

                                                    {modPerm && (
                                                        <button
                                                            type="button"
                                                            role="switch"
                                                            aria-checked={isModPermChecked}
                                                            onClick={() => handleTogglePermisoInRole(modPerm.id, modPerm.codigo)}
                                                            className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center p-0.5 rounded-full transition-colors duration-200 ease-in-out cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-1 dark:focus:ring-offset-gray-900 ${
                                                                isModPermChecked
                                                                    ? 'bg-primary dark:bg-primary shadow-sm shadow-primary/30'
                                                                    : 'bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600'
                                                            }`}
                                                            title={isModPermChecked ? `Deshabilitar acceso a ${mod.nombre}` : `Habilitar acceso a ${mod.nombre}`}
                                                        >
                                                            <span
                                                                aria-hidden="true"
                                                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out ${
                                                                    isModPermChecked ? 'translate-x-5' : 'translate-x-0'
                                                                }`}
                                                            />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Submódulos del Módulo */}
                                            {mod.submodulos && mod.submodulos.length > 0 && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                                                    {mod.submodulos.flatMap(sub => (sub.permisos || []).map(subPerm => {
                                                        const isChecked = roleForm.permisoIds.includes(subPerm.id) || roleForm.permisoIds.includes(subPerm.codigo);

                                                        return (
                                                            <div
                                                                key={subPerm.id}
                                                                onClick={() => handleTogglePermisoInRole(subPerm.id, subPerm.codigo)}
                                                                className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 active:scale-[0.99] touch-manipulation min-w-0 ${
                                                                    isChecked
                                                                        ? 'bg-blue-50 dark:bg-blue-950/40 border-primary text-primary'
                                                                        : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                                                                }`}
                                                            >
                                                                <div className="min-w-0 flex-1">
                                                                    <p className={`text-xs font-bold truncate leading-tight ${isChecked ? 'text-primary dark:text-blue-300' : 'text-gray-800 dark:text-gray-200'}`} title={subPerm.nombre || sub.nombre}>
                                                                        {subPerm.nombre || sub.nombre}
                                                                    </p>
                                                                    <p className="text-[10px] text-gray-400 font-mono truncate leading-tight mt-0.5" title={subPerm.codigo}>
                                                                        {subPerm.codigo}
                                                                    </p>
                                                                </div>

                                                                <div className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center transition-all flex-shrink-0 ${
                                                                    isChecked
                                                                        ? 'bg-primary border-primary text-white'
                                                                        : 'border-gray-300 dark:border-gray-600'
                                                                }`}>
                                                                    {isChecked && <span className="material-symbols-outlined text-[10px]">check</span>}
                                                                </div>
                                                            </div>
                                                        );
                                                    }))}
                                                </div>
                                            )}

                                            {/* Permisos adicionales a nivel de módulo */}
                                            {rootPerms && rootPerms.length > 1 && (
                                                <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-1.5">
                                                    <span className="text-[10px] font-black uppercase text-gray-400">Permisos Adicionales de Módulo</span>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                        {rootPerms.slice(1).map(modExtraPerm => {
                                                            const isChecked = roleForm.permisoIds.includes(modExtraPerm.id) || roleForm.permisoIds.includes(modExtraPerm.codigo);
                                                            return (
                                                                <div
                                                                    key={modExtraPerm.id}
                                                                    onClick={() => handleTogglePermisoInRole(modExtraPerm.id, modExtraPerm.codigo)}
                                                                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 active:scale-[0.99] touch-manipulation min-w-0 ${
                                                                        isChecked
                                                                            ? 'bg-blue-50 dark:bg-blue-950/40 border-primary text-primary'
                                                                            : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                                                                    }`}
                                                                >
                                                                    <div className="min-w-0 flex-1">
                                                                        <p className={`text-xs font-bold truncate leading-tight ${isChecked ? 'text-primary dark:text-blue-300' : 'text-gray-800 dark:text-gray-200'}`} title={modExtraPerm.nombre}>
                                                                            {modExtraPerm.nombre}
                                                                        </p>
                                                                        <p className="text-[10px] text-gray-400 font-mono truncate leading-tight mt-0.5" title={modExtraPerm.codigo}>
                                                                            {modExtraPerm.codigo}
                                                                        </p>
                                                                    </div>

                                                                    <div className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center transition-all flex-shrink-0 ${
                                                                        isChecked
                                                                            ? 'bg-primary border-primary text-white'
                                                                            : 'border-gray-300 dark:border-gray-600'
                                                                    }`}>
                                                                        {isChecked && <span className="material-symbols-outlined text-[10px]">check</span>}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Footer de Acciones */}
                            <div className="pt-3 sm:pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2 sm:gap-3 flex-shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setIsRoleModalOpen(false)}
                                    className="py-2.5 px-3.5 sm:px-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl text-xs active:scale-95 transition-all border border-transparent dark:border-gray-700/60 whitespace-nowrap"
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    className="py-2.5 px-4 sm:px-5 bg-primary text-white font-bold rounded-xl text-xs shadow-xs hover:bg-primary-dark active:scale-95 transition-all flex items-center gap-1.5 whitespace-nowrap truncate"
                                >
                                    <span className="material-symbols-outlined text-sm">check</span>
                                    <span>{editingRole ? 'Guardar Cambios' : 'Crear Rol Maestro'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* ================================================================ */}
            {/* MODAL 2: ASIGNAR COLABORADORES DESDE EL ROL                      */}
            {/* ================================================================ */}
            {isUsersModalOpen && createPortal(
                <div 
                    className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fade-in"
                    onClick={() => setIsUsersModalOpen(false)}
                >
                    <div 
                        className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-lg shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col max-h-[92vh] sm:max-h-[85vh] overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-slate-50 via-white to-blue-50/40 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950/40 flex items-start justify-between">
                            <div className="min-w-0 flex-1 pr-2">
                                <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/60 px-2.5 py-0.5 rounded-full inline-block">
                                    Personal del Rol
                                </span>
                                <h3 className="text-base font-black text-gray-900 dark:text-white mt-1 truncate">
                                    Colaboradores en: {editingRole?.name}
                                </h3>
                                <p className="text-xs text-gray-400 line-clamp-1">
                                    Marca los colaboradores que tendrán asignado este puesto.
                                </p>
                            </div>

                            <button 
                                type="button"
                                onClick={() => setIsUsersModalOpen(false)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
                            >
                                <span className="material-symbols-outlined text-xl">close</span>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 space-y-2 custom-scrollbar">
                            {collaborators.map(c => {
                                const isSelected = selectedRoleUserIds.includes(c.id);
                                return (
                                    <label
                                        key={c.id}
                                        className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                                            isSelected 
                                                ? 'bg-blue-50/80 dark:bg-blue-950/40 border-primary' 
                                                : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                                        }`}
                                    >
                                        <div className="min-w-0 pr-2">
                                            <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                                                {c.name}
                                            </p>
                                            <span className="text-[10px] text-gray-400">
                                                #{c.customId || 'SIN ID'} • {c.store?.name || 'Central'}
                                            </span>
                                        </div>

                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => {
                                                setSelectedRoleUserIds(prev =>
                                                    prev.includes(c.id) ? prev.filter(id => id !== c.id) : [...prev, c.id]
                                                );
                                            }}
                                            className="w-4 h-4 text-primary rounded"
                                        />
                                    </label>
                                );
                            })}
                        </div>

                        <div className="p-3 sm:p-4 border-t border-gray-100 dark:border-gray-800 flex justify-between gap-3 bg-gray-50/60 dark:bg-gray-950/80">
                            <button
                                type="button"
                                onClick={() => setIsUsersModalOpen(false)}
                                className="py-2 px-3.5 sm:px-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-xs font-bold rounded-xl text-gray-700 dark:text-gray-300 border border-transparent dark:border-gray-700/60 whitespace-nowrap"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveRoleUsers}
                                className="py-2 px-4 sm:px-5 bg-primary text-white text-xs font-bold rounded-xl shadow-xs hover:bg-primary-dark transition-all whitespace-nowrap"
                            >
                                Guardar ({selectedRoleUserIds.length})
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ================================================================ */}
            {/* MODAL 3: GESTIÓN DE ROLES Y PERMISOS DE UN COLABORADOR           */}
            {/* ================================================================ */}
            {isCollabModalOpen && editingCollaborator && createPortal(
                <div 
                    className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fade-in"
                    onClick={() => setIsCollabModalOpen(false)}
                >
                    <div 
                        className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-3xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col max-h-[94vh] sm:max-h-[88vh] overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Cabecera del Modal */}
                        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-slate-50 via-white to-blue-50/40 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950/40 flex items-start justify-between gap-3 flex-shrink-0">
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/60 px-2.5 py-0.5 rounded-full inline-block">
                                        Control de Acceso Individual
                                    </span>
                                    <span className="text-[10px] font-mono text-gray-400">
                                        #{editingCollaborator.customId || 'SIN ID'}
                                    </span>
                                </div>
                                <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white leading-tight truncate">
                                    {editingCollaborator.name}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                                    Personaliza los roles maestros y/o asigna permisos directos individuales a este colaborador.
                                </p>
                            </div>

                            <button 
                                type="button"
                                onClick={() => setIsCollabModalOpen(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
                            >
                                <span className="material-symbols-outlined text-xl">close</span>
                            </button>
                        </div>

                        {/* Sub-pestañas dentro del Modal con scroll táctil */}
                        <div className="w-full max-w-full overflow-x-auto overscroll-contain touch-pan-x [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden select-none px-4 sm:px-6 pt-2.5 sm:pt-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:gray-950/70 flex-shrink-0">
                            <div className="flex items-center gap-2 sm:gap-4 min-w-max">
                                <button
                                    type="button"
                                    onClick={() => setCollabModalTab('roles')}
                                    className={`pb-2.5 font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 whitespace-nowrap flex-shrink-0 touch-manipulation active:scale-95 ${
                                        collabModalTab === 'roles'
                                            ? 'border-primary text-primary'
                                            : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-sm">shield</span>
                                    <span>Roles Maestros</span>
                                    <span className="text-[10px] px-2 py-0.2 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 font-bold">
                                        {collabFormRoleIds.length}
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setCollabModalTab('permisos')}
                                    className={`pb-2.5 font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 whitespace-nowrap flex-shrink-0 touch-manipulation active:scale-95 ${
                                        collabModalTab === 'permisos'
                                            ? 'border-primary text-primary'
                                            : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-sm">key</span>
                                    <span>Permisos Directos</span>
                                    <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-bold">
                                        {collabFormPermisoIds.length}
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Resumen de Métricas de Acceso en Tiempo Real */}
                        <div className="px-4 sm:px-6 py-2 sm:py-2.5 bg-slate-50 dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-bold text-gray-600 dark:text-gray-300 flex-shrink-0">
                            <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                                <span>Roles: <strong className="text-blue-600 dark:text-blue-400">{collabFormRoleIds.length}</strong></span>
                                <span>Heredados: <strong className="text-emerald-600 dark:text-emerald-400">{inheritedPermsMap.size / 2}</strong></span>
                                <span>Directos: <strong className="text-amber-600 dark:text-amber-400">{collabFormPermisoIds.length}</strong></span>
                            </div>

                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-[10px] font-black uppercase self-start sm:self-auto">
                                Total Efectivos: {new Set([...Array.from(inheritedPermsMap.keys()), ...collabFormPermisoIds]).size}
                            </span>
                        </div>

                        {/* CUERPO: PESTAÑA ROLES */}
                        {collabModalTab === 'roles' && (
                            <div className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 sm:p-6 space-y-3 custom-scrollbar">
                                <div className="text-xs text-gray-400 mb-2">
                                    Selecciona los puestos de trabajo. Al asignar un rol maestro, el colaborador adquiere automáticamente todos sus permisos.
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {roles.map(r => {
                                        const isChecked = collabFormRoleIds.includes(r.id);
                                        const rPermCount = extractPermisosFromRole(r).length;

                                        return (
                                            <div
                                                key={r.id}
                                                onClick={() => handleToggleRoleIdInCollab(r.id)}
                                                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                                    isChecked 
                                                        ? 'bg-blue-50/80 dark:bg-blue-950/40 border-primary text-primary shadow-xs' 
                                                        : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                                                }`}
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-xs font-bold leading-tight uppercase text-gray-900 dark:text-white">
                                                            {r.name}
                                                        </p>
                                                        {r.isSystem && (
                                                            <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60">
                                                                Sistema
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] text-gray-400 truncate mt-1">
                                                        {rPermCount} permisos incluidos
                                                    </p>
                                                </div>

                                                <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all flex-shrink-0 ${
                                                    isChecked
                                                        ? 'bg-primary border-primary text-white'
                                                        : 'border-gray-300 dark:border-gray-600'
                                                }`}>
                                                    {isChecked && <span className="material-symbols-outlined text-xs">check</span>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* CUERPO: PESTAÑA PERMISOS DIRECTOS */}
                        {collabModalTab === 'permisos' && (
                            <div className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 sm:p-6 space-y-3 sm:space-y-4 custom-scrollbar">
                                {/* Buscador de Permisos */}
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base">
                                        search
                                    </span>
                                    <input
                                        type="text"
                                        value={collabPermSearch}
                                        onChange={(e) => setCollabPermSearch(e.target.value)}
                                        placeholder="Filtrar permiso por nombre o código (ej: cotizador, sistemas, ventas)..."
                                        className="w-full pl-9 pr-3.5 py-2 bg-gray-50 dark:bg-gray-950/70 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-bold text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/40"
                                    />
                                </div>

                                <div className="space-y-3 sm:space-y-4">
                                    {modules.map(mod => {
                                        // Todos los permisos de este módulo (raíz sin submoduloId, y de submódulos)
                                        const modPerms = [];
                                        (mod.permisos || []).filter(p => !p.submoduloId).forEach(p => modPerms.push({ ...p, isRoot: true, modName: mod.nombre }));
                                        (mod.submodulos || []).forEach(sub => {
                                            (sub.permisos || []).forEach(p => modPerms.push({ ...p, subName: sub.nombre, modName: mod.nombre }));
                                        });

                                        // Filtrar por búsqueda si existe
                                        const q = collabPermSearch.toLowerCase().trim();
                                        const visiblePerms = !q 
                                            ? modPerms 
                                            : modPerms.filter(p => p.nombre.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q));

                                        if (visiblePerms.length === 0) return null;

                                        return (
                                            <div
                                                key={mod.id}
                                                className="rounded-2xl border border-gray-200/80 dark:border-gray-800 p-3 sm:p-4 bg-gray-50/60 dark:bg-gray-950/60 space-y-2.5 overflow-hidden"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-primary text-base">
                                                        {mod.icono || 'folder'}
                                                    </span>
                                                    <h5 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tight">
                                                        {mod.nombre}
                                                    </h5>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-gray-100 dark:border-gray-800">
                                                    {visiblePerms.map(p => {
                                                        const isInherited = inheritedPermsMap.has(p.codigo) || inheritedPermsMap.has(p.id);
                                                        const inheritedRoleName = inheritedPermsMap.get(p.codigo) || inheritedPermsMap.get(p.id);
                                                        const isDirect = collabFormPermisoIds.includes(p.id) || collabFormPermisoIds.includes(p.codigo);
                                                        const isActive = isInherited || isDirect;

                                                        return (
                                                            <div
                                                                key={p.id}
                                                                onClick={() => handleToggleDirectPermisoInCollab(p.id, p.codigo)}
                                                                className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 min-w-0 ${
                                                                    isActive
                                                                        ? isDirect
                                                                            ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-400 dark:border-amber-700/80 text-amber-900 dark:text-amber-200'
                                                                            : 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700/80 text-emerald-900 dark:text-emerald-200'
                                                                        : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                                                                }`}
                                                            >
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                                        <p className="text-xs font-bold truncate" title={p.nombre}>
                                                                            {p.nombre}
                                                                        </p>
                                                                        {isInherited && (
                                                                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 whitespace-nowrap">
                                                                                ✓ Rol: {inheritedRoleName}
                                                                            </span>
                                                                        )}
                                                                        {isDirect && (
                                                                            <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 whitespace-nowrap">
                                                                                ★ Directo
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-[10px] text-gray-400 font-mono truncate mt-0.5" title={p.codigo}>
                                                                        {p.codigo}
                                                                    </p>
                                                                </div>

                                                                <div className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center transition-all flex-shrink-0 ${
                                                                    isActive
                                                                        ? isDirect
                                                                            ? 'bg-amber-500 border-amber-500 text-white'
                                                                            : 'bg-emerald-600 border-emerald-600 text-white'
                                                                        : 'border-gray-300 dark:border-gray-600'
                                                                }`}>
                                                                    {isActive && <span className="material-symbols-outlined text-[10px]">check</span>}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Footer de Acciones */}
                        <div className="p-3 sm:p-4 border-t border-gray-100 dark:border-gray-800 flex justify-between gap-2 sm:gap-3 bg-gray-50/60 dark:bg-gray-950/80 flex-shrink-0">
                            <button
                                type="button"
                                onClick={() => setIsCollabModalOpen(false)}
                                className="py-2 sm:py-2.5 px-3.5 sm:px-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-xs font-bold rounded-xl text-gray-700 dark:text-gray-300 border border-transparent dark:border-gray-700/60 whitespace-nowrap"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveCollabAccess}
                                className="py-2 sm:py-2.5 px-4 sm:px-6 bg-primary text-white text-xs font-bold rounded-xl shadow-xs hover:bg-primary-dark transition-all flex items-center gap-1.5 whitespace-nowrap truncate"
                            >
                                <span className="material-symbols-outlined text-sm">check</span>
                                <span>Guardar Accesos</span>
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ================================================================ */}
            {/* MODAL 4: CREAR NUEVO MÓDULO                                       */}
            {/* ================================================================ */}
            {isNewModuleModalOpen && createPortal(
                <div 
                    className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fade-in"
                    onClick={() => setIsNewModuleModalOpen(false)}
                >
                    <div 
                        className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-800 p-4 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto overflow-x-hidden custom-scrollbar"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-base font-black text-gray-900 dark:text-white">
                            Dar de Alta Nuevo Módulo
                        </h3>
                        <p className="text-xs text-gray-400">
                            Crea una nueva sección para el dashboard. Se auto-generará su permiso raíz acceso.[código].
                        </p>

                        <form onSubmit={handleSaveNewModule} className="space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Nombre del Módulo</label>
                                <input
                                    type="text"
                                    required
                                    value={moduleForm.nombre}
                                    onChange={(e) => setModuleForm({ ...moduleForm, nombre: e.target.value })}
                                    placeholder="Ej: Calidad y Procesos"
                                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-950/70 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-bold text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/40"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Código Identificador (sin espacios)</label>
                                <input
                                    type="text"
                                    required
                                    value={moduleForm.codigo}
                                    onChange={(e) => setModuleForm({ ...moduleForm, codigo: e.target.value })}
                                    placeholder="ej: calidad"
                                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-950/70 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-mono font-bold lowercase text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/40"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Icono (Material)</label>
                                    <input
                                        type="text"
                                        value={moduleForm.icono}
                                        onChange={(e) => setModuleForm({ ...moduleForm, icono: e.target.value })}
                                        placeholder="verified"
                                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-950/70 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-bold text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/40"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Orden</label>
                                    <input
                                        type="number"
                                        value={moduleForm.orden}
                                        onChange={(e) => setModuleForm({ ...moduleForm, orden: parseInt(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-950/70 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
                                    />
                                </div>
                            </div>

                            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsNewModuleModalOpen(false)}
                                    className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-xs font-bold rounded-xl text-gray-700 dark:text-gray-300 border border-transparent dark:border-gray-700/60"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-xs hover:bg-primary-dark transition-all"
                                >
                                    Crear Módulo
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* ================================================================ */}
            {/* MODAL 5: CREAR NUEVO SUBMÓDULO                                    */}
            {/* ================================================================ */}
            {isNewSubmoduleModalOpen && createPortal(
                <div 
                    className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fade-in"
                    onClick={() => setIsNewSubmoduleModalOpen(false)}
                >
                    <div 
                        className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-800 p-4 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto overflow-x-hidden custom-scrollbar"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-base font-black text-gray-900 dark:text-white">
                            Dar de Alta Nuevo Submódulo
                        </h3>
                        <p className="text-xs text-gray-400">
                            Crea una subsección dentro de un módulo. Se auto-generará su permiso acceso.[código].
                        </p>

                        <form onSubmit={handleSaveNewSubmodule} className="space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Módulo Padre</label>
                                <select
                                    required
                                    value={submoduleForm.moduloId}
                                    onChange={(e) => setSubmoduleForm({ ...submoduleForm, moduloId: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-950/70 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                                >
                                    <option value="" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">Selecciona módulo padre...</option>
                                    {modules.map(m => (
                                        <option key={m.id} value={m.id} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">{m.nombre} ({m.codigo})</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Nombre del Submódulo</label>
                                <input
                                    type="text"
                                    required
                                    value={submoduleForm.nombre}
                                    onChange={(e) => setSubmoduleForm({ ...submoduleForm, nombre: e.target.value })}
                                    placeholder="Ej: Bitácora de Filtrado"
                                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-950/70 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-bold text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/40"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Código (sin espacios)</label>
                                    <input
                                        type="text"
                                        required
                                        value={submoduleForm.codigo}
                                        onChange={(e) => setSubmoduleForm({ ...submoduleForm, codigo: e.target.value })}
                                        placeholder="bitacorafiltrado"
                                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-950/70 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-mono font-bold lowercase text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/40"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Ruta (Path)</label>
                                    <input
                                        type="text"
                                        required
                                        value={submoduleForm.path}
                                        onChange={(e) => setSubmoduleForm({ ...submoduleForm, path: e.target.value })}
                                        placeholder="bitacora-filtrado"
                                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-950/70 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-mono font-bold text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/40"
                                    />
                                </div>
                            </div>

                            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsNewSubmoduleModalOpen(false)}
                                    className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-xs font-bold rounded-xl text-gray-700 dark:text-gray-300 border border-transparent dark:border-gray-700/60"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-slate-800 text-white dark:bg-primary text-xs font-bold rounded-xl hover:bg-slate-900 dark:hover:bg-primary-dark transition-all"
                                >
                                    Crear Submódulo
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* ================================================================ */}
            {/* MODAL 6: CREAR NUEVO PERMISO PERSONALIZADO                       */}
            {/* ================================================================ */}
            {isNewPermisoModalOpen && createPortal(
                <div 
                    className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fade-in"
                    onClick={() => setIsNewPermisoModalOpen(false)}
                >
                    <div 
                        className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-800 p-4 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto overflow-x-hidden custom-scrollbar"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-base font-black text-gray-900 dark:text-white">
                            Crear Permiso Adicional
                        </h3>
                        <p className="text-xs text-gray-400">
                            Agrega un permiso granular para acciones específicas (ej. exportar, autorizar, borrar).
                        </p>

                        <form onSubmit={handleSaveNewPermiso} className="space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Código del Permiso</label>
                                <input
                                    type="text"
                                    required
                                    value={permisoForm.codigo}
                                    onChange={(e) => setPermisoForm({ ...permisoForm, codigo: e.target.value.toLowerCase().replace(/[^a-z0-9.]/g, '') })}
                                    placeholder="ej: acceso.sistemas o proyectosactividades.jefe"
                                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-950/70 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-mono font-bold lowercase text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/40"
                                />
                                <p className="text-[10px] text-gray-400 mt-1">
                                    Estándar: <code className="text-primary font-bold">acceso.modulo</code> o especializado como <code className="text-primary font-bold">proyectosactividades.jefe</code>
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Nombre / Título</label>
                                <input
                                    type="text"
                                    required
                                    value={permisoForm.nombre}
                                    onChange={(e) => setPermisoForm({ ...permisoForm, nombre: e.target.value })}
                                    placeholder="Ej: Exportar Cotizaciones a PDF"
                                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-950/70 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-bold text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/40"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Módulo Asociado</label>
                                <select
                                    value={permisoForm.moduloId}
                                    onChange={(e) => setPermisoForm({ ...permisoForm, moduloId: e.target.value, submoduloId: '' })}
                                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-950/70 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                                >
                                    <option value="" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">Selecciona el módulo padre...</option>
                                    {modules.map(m => (
                                        <option key={m.id} value={m.id} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">{m.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            {permisoForm.moduloId && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Submódulo Asociado (Opcional)</label>
                                    <select
                                        value={permisoForm.submoduloId}
                                        onChange={(e) => setPermisoForm({ ...permisoForm, submoduloId: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-950/70 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                                    >
                                        <option value="" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">Ninguno (A nivel general del módulo)</option>
                                        {(modules.find(m => m.id === permisoForm.moduloId)?.submodulos || []).map(s => (
                                            <option key={s.id} value={s.id} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">{s.nombre} (/{s.path})</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsNewPermisoModalOpen(false)}
                                    className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-xs font-bold rounded-xl text-gray-700 dark:text-gray-300 border border-transparent dark:border-gray-700/60"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all"
                                >
                                    Crear Permiso
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default Roles;
