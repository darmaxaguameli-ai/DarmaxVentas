import React, { useRef, useState, useMemo } from 'react';
import { Tree, TreeNode } from 'react-organizational-chart';
import { Link } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useAuth } from '../../../context/AuthContext';
import { toast } from 'sonner';

// Configuración de departamentos y colores por puesto
const getRoleConfig = (puesto = '') => {
  const p = (puesto || '').toUpperCase();
  if (p.includes('ADMIN') || p.includes('GERENTE') || p.includes('CEO') || p.includes('DUEÑO') || p.includes('DIRECCION') || p.includes('DIRECTOR')) {
    return {
      dept: 'Dirección',
      badge: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800',
      borderHover: 'hover:border-blue-500',
      dotColor: 'bg-blue-600'
    };
  }
  if (p.includes('REPARTIDOR') || p.includes('CHOFER') || p.includes('RUTA') || p.includes('LOGISTICA') || p.includes('TRANSPORTE')) {
    return {
      dept: 'Logística',
      badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800',
      borderHover: 'hover:border-amber-500',
      dotColor: 'bg-amber-500'
    };
  }
  if (p.includes('MOSTRADOR') || p.includes('CAJA') || p.includes('OPERADOR') || p.includes('PLANTA') || p.includes('PURIFICADORA') || p.includes('PRODUCCION')) {
    return {
      dept: 'Operaciones',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800',
      borderHover: 'hover:border-emerald-500',
      dotColor: 'bg-emerald-500'
    };
  }
  if (p.includes('VENDEDOR') || p.includes('VENTA') || p.includes('PROSPECCIÓN') || p.includes('MARKETING') || p.includes('COMERCIAL')) {
    return {
      dept: 'Comercial',
      badge: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-800',
      borderHover: 'hover:border-purple-500',
      dotColor: 'bg-purple-500'
    };
  }
  return {
    dept: 'Administración',
    badge: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
    borderHover: 'hover:border-slate-500',
    dotColor: 'bg-slate-500'
  };
};

// Tarjeta ejecutiva individual de colaborador en el organigrama
const EmployeeNode = ({ employee, searchQuery }) => {
  const config = getRoleConfig(employee.puesto);
  const reportsCount = employee.children ? employee.children.length : 0;
  
  const isMatch = Boolean(
    searchQuery && 
    searchQuery.trim().length > 1 && 
    (
      employee.nombreCompleto?.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      employee.puesto?.toLowerCase().includes(searchQuery.toLowerCase().trim())
    )
  );

  return (
    <div className="inline-block p-1.5 sm:p-2">
      <Link 
        to={`/gestion/recursos-humanos/${employee.id}`} 
        className="block outline-none text-left group"
        title={`Ver expediente completo de ${employee.nombreCompleto}`}
      >
        <div className={`
          relative flex flex-col justify-between p-3.5 rounded-2xl border transition-all duration-200
          bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm
          w-48 sm:w-52 shadow-xs hover:shadow-lg hover:-translate-y-1 active:translate-y-0
          ${isMatch 
            ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-gray-900 border-primary shadow-md scale-105' 
            : `border-gray-200/90 dark:border-gray-700/80 ${config.borderHover}`
          }
        `}>
          {/* Fila Superior: Badge de Departamento y Conteo de Reportes a Cargo */}
          <div className="flex items-center justify-between gap-1 mb-2">
            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${config.badge}`}>
              {config.dept}
            </span>

            {reportsCount > 0 && (
              <span 
                className="text-[9px] font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-md flex items-center gap-0.5" 
                title={`${reportsCount} colaborador(es) a su cargo`}
              >
                <span className="material-symbols-outlined text-xs">group</span>
                <span>{reportsCount}</span>
              </span>
            )}
          </div>

          {/* Cuerpo: Nombre Completo y Puesto */}
          <div className="min-w-0">
            <h4 className="font-bold text-xs text-gray-900 dark:text-white truncate leading-tight group-hover:text-primary transition-colors">
              {employee.nombreCompleto}
            </h4>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium truncate mt-0.5">
              {employee.puesto || 'Sin cargo asignado'}
            </p>
          </div>

          {/* Pie de Tarjeta: Sucursal Asignada y Acción Ver Expediente */}
          <div className="mt-2.5 pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[10px]">
            <span className="text-gray-400 truncate flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">store</span>
              <span className="truncate">{employee.user?.store?.name || employee.store?.name || 'Acceso Global'}</span>
            </span>

            <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 font-bold">
              <span>Expediente</span>
              <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
};

const renderTree = (nodes, searchQuery) => {
  return nodes.map(node => (
    <TreeNode 
      key={node.id} 
      label={<EmployeeNode employee={node} searchQuery={searchQuery} />}
    >
      {node.children && node.children.length > 0 && renderTree(node.children, searchQuery)}
    </TreeNode>
  ));
};

const Organigrama = ({ empleados }) => {
  const chartRef = useRef(null);
  const { user, hasPermission } = useAuth();
  const [zoom, setZoom] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  // Zoom handlers
  const handleZoomIn = () => setZoom(z => Math.min(1.4, Number((z + 0.1).toFixed(1))));
  const handleZoomOut = () => setZoom(z => Math.max(0.6, Number((z - 0.1).toFixed(1))));
  const handleZoomReset = () => setZoom(1);

  const buildTree = (employees) => {
    if (!employees || employees.length === 0) return [];

    // Filtrar inactivos y cuentas demo
    const activeEmployees = employees.filter(e => {
        const isActivo = e.estatus === 'ACTIVO';
        const isDemo = e.nombreCompleto?.toLowerCase().includes('demo') || e.puesto?.toLowerCase().includes('demo');
        return isActivo && !isDemo;
    });

    const employeeMap = {};
    activeEmployees.forEach(employee => {
      employeeMap[employee.id] = { ...employee, children: [] };
    });

    // 1. Construir relaciones padre-hijo
    activeEmployees.forEach(employee => {
      const emp = employeeMap[employee.id];
      if (employee.managerId && employeeMap[employee.managerId]) {
        employeeMap[employee.managerId].children.push(emp);
      }
    });

    Object.values(employeeMap).forEach(emp => {
      emp.children.sort((a, b) => (a.puesto || '').localeCompare(b.puesto || ''));
    });

    // 2. Determinar la raíz organizacional
    const canManageAll = user?.role === 'ADMIN' || 
                         user?.roles?.some(r => r.name === 'ADMIN') || 
                         hasPermission('canAccessRH') || 
                         hasPermission('canViewSummary');
                         
    const currentUserEmployee = activeEmployees.find(e => e.userId === user?.id);

    let roots = [];

    if (canManageAll || !currentUserEmployee) {
      // Buscar al CEO o Director Principal
      const ceo = activeEmployees.find(e => {
          const p = (e.puesto || '').toUpperCase();
          return p === 'CEO' || p.includes('DUEÑO') || p.includes('DIRECTOR GENERAL') || (p.includes('ADMIN') && !e.managerId);
      });

      activeEmployees.forEach(employee => {
        const emp = employeeMap[employee.id];
        if (!employee.managerId) {
            roots.push(emp);
        } else if (ceo && employee.managerId !== ceo.id && !employeeMap[employee.managerId]) {
             roots.push(emp);
        }
      });
      
      // Si hay un CEO definido y otros sin manager, agruparlos ordenadamente bajo el CEO
      if (ceo && roots.length > 1) {
          const mainRoot = employeeMap[ceo.id];
          roots.forEach(r => {
              if (r.id !== mainRoot.id && !mainRoot.children.some(c => c.id === r.id)) {
                  mainRoot.children.push(r);
              }
          });
          roots = [mainRoot];
      }
    } else {
      roots = currentUserEmployee ? [employeeMap[currentUserEmployee.id]] : [];
    }

    return roots;
  };

  const exportToPdf = async () => {
    if (!chartRef.current) return;
    setIsExporting(true);

    try {
      toast.info('Generando documento PDF de alta resolución...');
      const canvas = await html2canvas(chartRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`Organigrama_Darmax_${new Date().toLocaleDateString('es-MX')}.pdf`);
      toast.success('Organigrama descargado en PDF exitosamente');
    } catch (error) {
      console.error("Error al exportar PDF:", error);
      toast.error('Error al generar el PDF del organigrama');
    } finally {
      setIsExporting(false);
    }
  };

  const treeData = useMemo(() => buildTree(empleados), [empleados, user]);

  return (
    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/80 dark:border-gray-800/80 rounded-3xl p-5 sm:p-6 shadow-xs overflow-hidden space-y-4">
      {/* Barra de Encabezado y Herramientas del Organigrama */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
              Jerarquía Institucional
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            Estructura Organizacional
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            Mapa jerárquico de mandos y líneas de reporte directo en Darmax.
          </p>
        </div>

        {/* Herramientas de Interacción: Búsqueda, Zoom y Exportar PDF */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Buscador de Colaboradores en el Árbol */}
          <div className="relative flex-1 sm:flex-initial">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
              search
            </span>
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar en organigrama..."
              className="w-full sm:w-52 pl-8 pr-3 py-2 bg-gray-50 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700/60 rounded-xl text-xs font-bold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
            />
            {searchQuery && (
              <button 
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            )}
          </div>

          {/* Controles de Zoom */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800/80 rounded-xl p-0.5 border border-gray-200/60 dark:border-gray-700/60">
            <button 
              type="button" 
              onClick={handleZoomOut} 
              className="p-1.5 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-lg active:scale-95 transition-all"
              title="Alejar vista"
            >
              <span className="material-symbols-outlined text-base">zoom_out</span>
            </button>
            <button 
              type="button" 
              onClick={handleZoomReset} 
              className="px-2 py-1 text-[11px] font-bold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              title="Restablecer tamaño normal (100%)"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button 
              type="button" 
              onClick={handleZoomIn} 
              className="p-1.5 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-lg active:scale-95 transition-all"
              title="Acercar vista"
            >
              <span className="material-symbols-outlined text-base">zoom_in</span>
            </button>
          </div>

          {/* Botón de Exportar a PDF */}
          <button 
            type="button"
            onClick={exportToPdf}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-xs hover:bg-primary-dark active:scale-95 transition-all disabled:opacity-50"
            title="Descargar diagrama del organigrama en PDF"
          >
            <span className="material-symbols-outlined text-base">picture_as_pdf</span>
            <span>{isExporting ? 'Generando...' : 'Exportar PDF'}</span>
          </button>
        </div>
      </div>

      {/* Leyenda de Departamentos */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mr-1">Áreas:</span>
        {[
          { label: 'Dirección', color: 'bg-blue-500' },
          { label: 'Operaciones', color: 'bg-emerald-500' },
          { label: 'Comercial', color: 'bg-purple-500' },
          { label: 'Logística', color: 'bg-amber-500' },
          { label: 'Administración', color: 'bg-slate-400' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 text-[10px] font-bold text-gray-600 dark:text-gray-400">
            <span className={`w-2 h-2 rounded-full ${item.color}`}></span>
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Contenedor del Diagrama con Scroll Horizontal y Transformación de Zoom */}
      <div className="overflow-x-auto overflow-y-hidden custom-scrollbar bg-gray-50/40 dark:bg-gray-950/20 rounded-2xl border border-gray-150 dark:border-gray-800/80 p-4 min-h-[380px] flex justify-center">
        <div 
          ref={chartRef} 
          className="flex justify-center min-w-max p-6 transition-transform duration-200 origin-top"
          style={{ transform: `scale(${zoom})` }}
        >
          {treeData.length > 0 ? (
            <Tree
              lineWidth="2px"
              lineColor="#cbd5e1"
              lineBorderRadius="12px"
              label={
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50/90 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800 mb-6 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary dark:text-blue-300">
                    Corporativo Darmax
                  </span>
                </div>
              }
            >
              {renderTree(treeData, searchQuery)}
            </Tree>
          ) : (
            <div className="text-center py-16 text-gray-400 space-y-2">
              <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600">
                account_tree
              </span>
              <p className="text-sm font-bold text-gray-500 dark:text-gray-400">
                No hay colaboradores activos para estructurar el organigrama
              </p>
              <p className="text-xs text-gray-400">
                Registra colaboradores en "Nuevo Empleado" y define a quién reportan para conectar el árbol.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Organigrama;
