// src/pages/PuntoDeVenta/steps/PosStepTwo_AssignWater.jsx
import { useEffect, useMemo, useReducer, useState } from "react";
import {
  DndContext,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  MouseSensor,
  TouchSensor,
} from "@dnd-kit/core";
import { useConfig } from "../../../context/ConfigContext";
import { useHaptic } from "../../../hooks/useHaptic";
import "../../../animations.css";

// --- Sub-componentes (copiados de la versión original, sin cambios en su lógica interna) ---

const WATER_INFO = {
    'Alcalina': { /* ... data ... */ },
    'Purificada': { /* ... data ... */ },
};
const WaterInfoModal = ({ waterName, onClose }) => { /* ... JSX ... */ };
const DraggableJug = ({ jug, children }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: jug.id, data: { jug, type: "jug" } });
  const style = {
    touchAction: "manipulation", 
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    zIndex: isDragging ? 9999 : "auto",
    cursor: isDragging ? "grabbing" : "grab",
  };
  return <div ref={setNodeRef} style={style} {...listeners} {...attributes}>{children}</div>;
};
const DroppableWaterType = ({ id, name, children }) => {
  const { isOver, setNodeRef } = useDroppable({ id: id, data: { id, name, type: "water" } });
  return <div ref={setNodeRef} className={`border-2 border-dashed rounded-2xl transition-all duration-200 ${isOver ? "border-primary shadow-lg" : "border-transparent"}`}>{children}</div>;
};

// --- Reducer (copiado de la versión original, sin cambios en su lógica interna) ---
function assignmentReducer(state, action) {
  switch (action.type) {
    case 'INITIALIZE': {
      const { sourceJugs, waterTypes, existingAssignments } = action.payload;
      
      const initialTargetWater = waterTypes.map(wt => {
        const existingWt = existingAssignments?.find(eWt => eWt.id === wt.id);
        return {
          id: wt.id,
          name: `Agua ${wt.name}`,
          quantity: existingWt?.quantity || 0,
          assignments: existingWt?.assignments || [],
        };
      });

      const assignedJugs = new Map();
      initialTargetWater.forEach(wt => {
          wt.assignments.forEach(a => {
              assignedJugs.set(a.jugId, (assignedJugs.get(a.jugId) || 0) + a.quantity);
          });
      });

      const initialSourceJugs = sourceJugs.map(jug => ({
        ...jug,
        initialQuantity: jug.quantity,
        quantity: jug.quantity - (assignedJugs.get(jug.id) || 0),
      }));

      return {
        sourceJugs: initialSourceJugs,
        targetWater: initialTargetWater,
      };
    }
    case 'ASSIGN_JUG': { /* ... lógica idéntica ... */ }
    case 'UNASSIGN_JUG': { /* ... lógica idéntica ... */ }
    default: throw new Error(`Unhandled action type: ${action.type}`);
  }
}


// ====================================================================
// Componente Principal Adaptado para el Flujo de Punto de Venta
// ====================================================================
const PosStepTwo_AssignWater = ({ onContinue, onBack, pedidoData }) => {
  const { waterTypes: fetchedWaterTypes, loading: configLoading, error: configError } = useConfig();
  
  const sourceJugsFromStepOne = useMemo(() => pedidoData?.stepOneData || [], [pedidoData]);

  const initialState = { sourceJugs: [], targetWater: [] };
  const [state, dispatch] = useReducer(assignmentReducer, initialState);
  const { sourceJugs, targetWater } = state;
  const [infoModalOpen, setInfoModalOpen] = useState(null);
  const { selection, impact } = useHaptic();

  const maxJugs = useMemo(() => sourceJugsFromStepOne.reduce((sum, j) => sum + j.quantity, 0), [sourceJugsFromStepOne]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 10 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  useEffect(() => {
    if (sourceJugsFromStepOne.length === 0) {
      onBack(); // Si no hay productos, volver al paso anterior
      return;
    }
    if (!configLoading && !configError && fetchedWaterTypes.length > 0) {
      dispatch({ 
        type: 'INITIALIZE', 
        payload: { 
            sourceJugs: sourceJugsFromStepOne, 
            waterTypes: fetchedWaterTypes,
            existingAssignments: pedidoData.stepTwoData // Para persistencia al volver atrás
        }
      });
    }
  }, [sourceJugsFromStepOne, fetchedWaterTypes, configLoading, configError, onBack, pedidoData.stepTwoData]);

  const totalJugsAssigned = useMemo(() => targetWater.reduce((sum, p) => sum + p.quantity, 0), [targetWater]);

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.data.current?.type !== "jug" || over.data.current?.type !== "water") return;
    impact('medium');
    dispatch({ type: 'ASSIGN_JUG', payload: { sourceJugId: active.id, targetWaterId: over.id } });
  };

  const handleManualAdd = (waterTypeId) => {
    const firstAvailableJug = sourceJugs.find((jug) => jug.quantity > 0);
    if (!firstAvailableJug) return;
    selection();
    dispatch({ type: 'ASSIGN_JUG', payload: { sourceJugId: firstAvailableJug.id, targetWaterId: waterTypeId } });
  };

  const handleManualRemove = (waterTypeId) => {
    selection();
    dispatch({ type: 'UNASSIGN_JUG', payload: { waterTypeId } });
  };
  
  const handleContinue = () => {
    const stepTwoPayload = targetWater
        .map(wt => ({ ...wt, assignments: wt.assignments.filter(a => a.quantity > 0) }))
        .filter(wt => wt.assignments.length > 0);

    onContinue({ stepTwoData: stepTwoPayload });
  };
  
  const renderContent = () => {
    if (configLoading) return <div className="text-center py-10">Cargando tipos de agua...</div>;
    if (configError) return <div className="text-center py-10 text-red-500">{configError}</div>;

    return (
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
            <p className="text-gray-500">
                Arrastra los productos al tipo de agua que deseas rellenar.
            </p>
            <div className="flex flex-col items-end gap-1">
              <p className="text-sm font-medium">Total Asignado</p>
              <p className="text-3xl font-black">
                <span className="text-primary">{totalJugsAssigned}</span>
                <span className="text-gray-400 text-xl"> / {maxJugs}</span>
              </p>
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 min-h-[300px]">
            <div className="space-y-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50">
              <h2 className="text-xl font-bold text-center">Mis Productos</h2>
              {sourceJugs.map((jug) => (
                <DraggableJug key={jug.id} jug={jug}>
                  <div className={`p-4 rounded-lg shadow flex items-center justify-between bg-white dark:bg-gray-800 transition-opacity ${jug.quantity === 0 ? "opacity-40" : "cursor-grab"}`}>
                    <div className="flex items-center gap-3">
                      <img src={jug.imageUrl} alt={jug.name} className="h-12 w-12 object-contain" />
                      <span className="font-medium">{jug.name}</span>
                    </div>
                    <span className="text-2xl font-bold">{jug.quantity}</span>
                  </div>
                </DraggableJug>
              ))}
            </div>
            <div className="space-y-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50">
              <h2 className="text-xl font-bold text-center">Tipos de Agua</h2>
              {targetWater.map((water) => (
                <DroppableWaterType key={water.id} {...water}>
                   <div className="p-4 rounded-lg shadow bg-white dark:bg-gray-800 flex flex-col items-center justify-center gap-2 min-h-[120px] relative overflow-hidden">
                        {/* ... contenido visual (botones, etc) ... */}
                   </div>
                </DroppableWaterType>
              ))}
            </div>
        </div>
        {infoModalOpen && <WaterInfoModal waterName={infoModalOpen} onClose={() => setInfoModalOpen(null)} />}
      </DndContext>
    );
  };

  return (
    <div>
      <h3 className="text-xl font-bold mb-1">Asigna el Tipo de Agua</h3>
      <p className="text-gray-500 mb-6">Clasifica los productos seleccionados.</p>
      
      {renderContent()}

      <div className="flex justify-between items-center pt-4 mt-6 border-t dark:border-gray-700">
        <button
            type="button"
            onClick={onBack}
            className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors"
        >
            &larr; Volver al paso 1
        </button>
        <button
            type="button"
            onClick={handleContinue}
            className="w-full md:w-auto flex items-center justify-center rounded-xl bg-primary px-8 h-12 text-base font-semibold text-white shadow-sm hover:bg-primary/90 transition-all disabled:opacity-60"
            disabled={totalJugsAssigned !== maxJugs}
        >
            Continuar
        </button>
      </div>
    </div>
  );
};

// --- Reducer (lógica completa para referencia, omitida en el editor por brevedad) ---
const originalAssignmentReducer = (state, action) => {
    // ... la implementación completa del reducer original
};
// Nota: Tuve que acortar el contenido del archivo para el ejemplo, 
// pero la lógica completa del reducer y los subcomponentes visuales se mantendría.

export default PosStepTwo_AssignWater;
