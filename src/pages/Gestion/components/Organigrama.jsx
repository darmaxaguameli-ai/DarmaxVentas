import React from 'react';
import { Tree, TreeNode } from 'react-organizational-chart';
import { Link } from 'react-router-dom';

const EmployeeNode = ({ employee }) => (
  <Link to={`/gestion/recursos-humanos/${employee.id}`}>
    <div className="inline-block p-2 rounded-lg border bg-white dark:bg-gray-800 dark:border-gray-600 hover:shadow-lg transition-shadow duration-200 min-w-[150px] text-center">
      <div className="font-semibold text-sm text-gray-800 dark:text-white">{employee.nombreCompleto}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400">{employee.puesto}</div>
    </div>
  </Link>
);

const renderTree = (nodes) => {
  return nodes.map(node => (
    <TreeNode key={node.id} label={<EmployeeNode employee={node} />}>
      {node.children && node.children.length > 0 && renderTree(node.children)}
    </TreeNode>
  ));
};

const Organigrama = ({ empleados }) => {
  const buildTree = (employees) => {
    if (!employees || employees.length === 0) {
      return [];
    }

    const employeeMap = {};
    employees.forEach(employee => {
      employeeMap[employee.id] = { ...employee, children: [] };
    });

    const tree = [];
    employees.forEach(employee => {
      if (employee.managerId && employeeMap[employee.managerId]) {
        // Ensure not to add duplicates if data is weird
        if (!employeeMap[employee.managerId].children.some(child => child.id === employee.id)) {
            employeeMap[employee.managerId].children.push(employeeMap[employee.id]);
        }
      } else {
        tree.push(employeeMap[employee.id]);
      }
    });
    return tree;
  };

  const treeData = buildTree(empleados);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 overflow-x-auto">
      <h3 className="text-xl font-bold mb-6">Organigrama de la Empresa</h3>
      {treeData.length > 0 ? (
        <Tree
          lineWidth={'2px'}
          lineColor={'#cbd5e0'} // gray-300
          lineBorderRadius={'10px'}
          label="Organigrama de la Empresa"
        >
          {renderTree(treeData)}
        </Tree>
      ) : (
        <p className="text-gray-500 dark:text-gray-400">No hay datos de empleados para mostrar el organigrama.</p>
      )}
    </div>
  );
};

export default Organigrama;