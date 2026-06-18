import React, { useRef } from 'react';
import { Tree, TreeNode } from 'react-organizational-chart';
import { Link } from 'react-router-dom';
import { 
  MdPerson, 
  MdLocalShipping, 
  MdStorefront, 
  MdTrendingUp, 
  MdAdminPanelSettings, 
  MdWaterDrop,
  MdPictureAsPdf
} from 'react-icons/md';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useAuth } from '../../../context/AuthContext'; // Importar useAuth

const getRoleConfig = (puesto = '') => {
  const p = puesto.toUpperCase();
  if (p.includes('ADMIN') || p.includes('GERENTE') || p.includes('CEO') || p.includes('DUEÑO') || p.includes('DIRECCION')) {
    return {
      color: 'bg-blue-600',
      lightColor: 'bg-blue-50 dark:bg-blue-900/30',
      icon: <MdAdminPanelSettings />,
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-700 dark:text-blue-300'
    };
  }
  if (p.includes('REPARTIDOR') || p.includes('CHOFER') || p.includes('RUTA') || p.includes('LOGISTICA')) {
    return {
      color: 'bg-amber-500',
      lightColor: 'bg-amber-50 dark:bg-amber-900/30',
      icon: <MdLocalShipping />,
      border: 'border-amber-200 dark:border-amber-800',
      text: 'text-amber-700 dark:text-amber-300'
    };
  }
  if (p.includes('MOSTRADOR') || p.includes('CAJA') || p.includes('OPERADOR')) {
    return {
      color: 'bg-emerald-500',
      lightColor: 'bg-emerald-50 dark:bg-emerald-900/30',
      icon: <MdStorefront />,
      border: 'border-emerald-200 dark:border-emerald-800',
      text: 'text-emerald-700 dark:text-emerald-300'
    };
  }
  if (p.includes('VENDEDOR') || p.includes('VENTA') || p.includes('PROSPECCIÓN') || p.includes('MARKETING') || p.includes('COMERCIAL')) {
    return {
      color: 'bg-indigo-500',
      lightColor: 'bg-indigo-50 dark:bg-indigo-900/30',
      icon: <MdTrendingUp />,
      border: 'border-indigo-200 dark:border-indigo-800',
      text: 'text-indigo-700 dark:text-indigo-300'
    };
  }
  return {
    color: 'bg-gray-500',
    lightColor: 'bg-gray-50 dark:bg-gray-800',
    icon: <MdPerson />,
    border: 'border-gray-200 dark:border-gray-700',
    text: 'text-gray-700 dark:text-gray-300'
  };
};

const EmployeeNode = ({ employee }) => {
  const config = getRoleConfig(employee.puesto);
  
  return (
    <div className="inline-block p-2 mt-2">
      <Link to={`/gestion/recursos-humanos/${employee.id}`} className="block outline-none group">
        <div className={`
          relative flex flex-col items-center p-3 pt-5 rounded-xl border-2 transition-all duration-300
          bg-white dark:bg-gray-800 min-w-[140px] shadow-sm hover:shadow-lg hover:-translate-y-0.5
          ${config.border}
        `}>
          {/* Floating Badge (Puesto) */}
          <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest text-white shadow-md ${config.color} whitespace-nowrap z-10`}>
            {employee.puesto}
          </div>

          {/* Icon/Avatar Circle - Smaller */}
          <div className={`
            w-8 h-8 rounded-lg flex items-center justify-center mb-2 shadow-inner
            ${config.lightColor} ${config.text} group-hover:scale-110 transition-transform duration-300
          `}>
            <span className="text-xl">{config.icon}</span>
          </div>

          <div className="text-center mt-1">
            <div className="font-bold text-[10px] text-gray-600 dark:text-gray-300 uppercase tracking-tight leading-tight">
              {employee.nombreCompleto}
            </div>
          </div>

          {/* Status Indicator */}
          {employee.estatus === 'INACTIVO' && (
            <div className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[6px] font-black px-1.5 py-0.5 rounded-full shadow-sm ring-1 ring-white dark:ring-gray-800 z-20">
              BAJA
            </div>
          )}
        </div>
      </Link>
    </div>
  );
};

const renderTree = (nodes) => {
  return nodes.map(node => (
    <TreeNode 
      key={node.id} 
      label={<EmployeeNode employee={node} />}
    >
      {node.children && node.children.length > 0 && renderTree(node.children)}
    </TreeNode>
  ));
};

const Organigrama = ({ empleados }) => {
  const chartRef = useRef(null);
  const { user } = useAuth(); // Obtener el usuario autenticado

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

    // 1. Construir las relaciones padre-hijo para todos
    activeEmployees.forEach(employee => {
      const emp = employeeMap[employee.id];
      if (employee.managerId && employeeMap[employee.managerId]) {
        employeeMap[employee.managerId].children.push(emp);
      }
    });

    Object.values(employeeMap).forEach(emp => {
      emp.children.sort((a, b) => a.puesto.localeCompare(b.puesto));
    });

    // 2. Determinar la raíz basada en los permisos del usuario
    const isAdmin = user?.role === 'ADMIN' || user?.roles?.some(r => r.name === 'ADMIN');
    
    // Buscar el registro de empleado que corresponde al usuario logueado
    const currentUserEmployee = activeEmployees.find(e => e.userId === user?.id);

    let roots = [];

    if (isAdmin || !currentUserEmployee) {
      // Si es admin, o si el usuario no es un empleado registrado (ej. superadmin global),
      // mostrar todo el árbol empezando por los que no tienen jefe (o forzar al CEO a la raíz)
      const ceo = activeEmployees.find(e => {
          const p = e.puesto.toUpperCase();
          return p === 'CEO' || p.includes('DUEÑO') || (p.includes('ADMIN') && !e.managerId);
      });

      activeEmployees.forEach(employee => {
        const emp = employeeMap[employee.id];
        if (!employee.managerId) {
            roots.push(emp);
        } else if (ceo && employee.managerId !== ceo.id && !employeeMap[employee.managerId]) {
             // Fallback: Si tiene manager pero no existe en la lista, lo colgamos de raíz
             roots.push(emp);
        }
      });
      
      // Asegurar que si hay un CEO definido y otros sin manager, se agrupen bajo el CEO
      if (ceo && roots.length > 1) {
          const mainRoot = employeeMap[ceo.id];
          roots.forEach(r => {
              if (r.id !== mainRoot.id) mainRoot.children.push(r);
          });
          roots = [mainRoot];
      }

    } else {
      // Si NO es admin, la raíz del organigrama es el propio usuario logueado
      roots = currentUserEmployee ? [employeeMap[currentUserEmployee.id]] : [];
    }

    return roots;
  };

  const exportToPdf = async () => {
    if (!chartRef.current) return;

    try {
      const canvas = await html2canvas(chartRef.current, {
        scale: 2, // Mayor calidad
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
      pdf.save(`Organigrama_Darmax_${new Date().toLocaleDateString()}.pdf`);
    } catch (error) {
      console.error("Error al exportar PDF:", error);
    }
  };

  const treeData = buildTree(empleados);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm p-6 sm:p-10 overflow-hidden">
      <div className="flex flex-col lg:flex-row justify-between items-center mb-8 gap-6">
        <div>
            <h3 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tighter flex items-center gap-3">
                <span className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                    <MdWaterDrop />
                </span>
                Estructura Organizacional
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">Mapa jerárquico compacto del equipo.</p>
        </div>
        
        <div className="flex flex-wrap items-center justify-center gap-4">
            {/* Legend Compact */}
            <div className="flex gap-3 bg-gray-50 dark:bg-gray-900/50 px-4 py-2 rounded-2xl border border-gray-100 dark:border-gray-700">
                {[
                    { label: 'Dirección', color: 'bg-blue-600' },
                    { label: 'Reparto', color: 'bg-amber-500' },
                    { label: 'Mostrador', color: 'bg-emerald-500' },
                    { label: 'Ventas', color: 'bg-indigo-500' },
                ].map(l => (
                    <div key={l.label} className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${l.color}`}></div>
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{l.label}</span>
                    </div>
                ))}
            </div>

            <button 
                onClick={exportToPdf}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-[10px] font-black uppercase tracking-[0.1em] rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 transition-all"
            >
                <MdPictureAsPdf size={16} />
                Exportar PDF
            </button>
        </div>
      </div>

      <div className="overflow-x-auto custom-scrollbar pb-6">
        <div ref={chartRef} className="flex justify-center min-w-max p-10 bg-white dark:bg-gray-800 transition-colors">
            {treeData.length > 0 ? (
            <Tree
                lineWidth={'2px'}
                lineColor={'#e5e7eb'}
                lineBorderRadius={'15px'}
                label={
                    <div className="mb-8">
                        <span className="px-4 py-1.5 bg-gray-50 dark:bg-gray-700/50 text-gray-400 text-[8px] font-black uppercase tracking-[0.3em] rounded-full border border-gray-100 dark:border-gray-600 shadow-sm">
                            DARMAX AGUA
                        </span>
                    </div>
                }
            >
                {renderTree(treeData)}
            </Tree>
            ) : (
            <div className="text-center py-10">
                <p className="text-gray-400 font-bold italic text-sm">Sin datos para el organigrama.</p>
            </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Organigrama;
