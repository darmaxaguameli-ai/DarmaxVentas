import { useEffect, useMemo, useReducer, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  DndContext,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  MouseSensor,
  TouchSensor,
} from "@dnd-kit/core";
import OrderLayout from "../../../layouts/OrderLayout";
import { useConfig } from "../../../context/ConfigContext";
import "../../../animations.css";

// ====================================================================
// Sub-componentes de UI (sin cambios)
// ====================================================================
const DraggableJug = ({ jug, children }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: jug.id,
      data: { jug, type: "jug" },
    });

  const style = {
    position: "relative",
    touchAction: "none",
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    zIndex: isDragging ? 9999 : "auto",
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {children}
    </div>
  );
};

const DroppableWaterType = ({ id, name, children }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
    data: { id, name, type: "water" },
  });

  return (
    <div
      ref={setNodeRef}
      className={`border-2 border-dashed rounded-2xl transition-all duration-200 ${
        isOver ? "border-primary shadow-lg" : "border-transparent"
      }`}
    >
      {children}
    </div>
  );
};

// ====================================================================
// Reducer para manejar el estado complejo de forma atómica
// ====================================================================
function assignmentReducer(state, action) {
  switch (action.type) {
    case 'INITIALIZE': {
      const { sourceJugs, waterTypes } = action.payload;
      return {
        sourceJugs: sourceJugs.map(jug => ({ ...jug, initialQuantity: jug.quantity })),
        targetWater: waterTypes.map(wt => ({
          id: wt.id,
          name: `Agua ${wt.name}`,
          quantity: 0,
          assignments: [],
        })),
      };
    }
    
    case 'ASSIGN_JUG': {
      const { sourceJugId, targetWaterId } = action.payload;
      const { sourceJugs, targetWater } = state;

      const sourceJug = sourceJugs.find(j => j.id === sourceJugId);
      if (!sourceJug || sourceJug.quantity === 0) return state;

      const newSourceJugs = sourceJugs.map(jug => 
        jug.id === sourceJugId ? { ...jug, quantity: jug.quantity - 1 } : jug
      );

      const newTargetWater = targetWater.map(water => {
        if (water.id !== targetWaterId) return water;
        
        let existingAssignmentFound = false;
        const updatedAssignments = water.assignments.map(assign => {
            if (assign.jugId === sourceJugId) {
                existingAssignmentFound = true;
                return { ...assign, quantity: assign.quantity + 1 };
            }
            return assign;
        });

        if (!existingAssignmentFound) {
          updatedAssignments.push({
            jugId: sourceJug.id,
            jugName: sourceJug.name,
            imageUrl: sourceJug.imageUrl,
            quantity: 1,
          });
        }
        
        return {
          ...water,
          assignments: updatedAssignments,
          quantity: water.quantity + 1,
        };
      });

      return { sourceJugs: newSourceJugs, targetWater: newTargetWater };
    }

    case 'UNASSIGN_JUG': {
      const { waterTypeId } = action.payload;
      const { sourceJugs, targetWater } = state;
      
      const waterType = targetWater.find(w => w.id === waterTypeId);
      if (!waterType || waterType.quantity === 0) return state;

      const assignmentToRemoveFrom = waterType.assignments.find(a => a.quantity > 0);
      if (!assignmentToRemoveFrom) return state;

      const jugIdToReturn = assignmentToRemoveFrom.jugId;

      const newSourceJugs = sourceJugs.map(jug =>
        jug.id === jugIdToReturn ? { ...jug, quantity: jug.quantity + 1 } : jug
      );

      const newTargetWater = targetWater.map(water => {
        if (water.id !== waterTypeId) return water;

        let assignmentUpdated = false;
        const updatedAssignments = water.assignments.map(assign => {
          if (assign.jugId === jugIdToReturn && !assignmentUpdated) {
            assignmentUpdated = true;
            return { ...assign, quantity: assign.quantity - 1 };
          }
          return assign;
        }).filter(assign => assign.quantity > 0);

        return {
          ...water,
          assignments: updatedAssignments,
          quantity: water.quantity - 1,
        };
      });
      
      return { sourceJugs: newSourceJugs, targetWater: newTargetWater };
    }

    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
}


// ====================================================================
// Componente Principal Refactorizado
// ====================================================================
const RefillAssignStepTwo = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const sourceJugsFromState = useMemo(() => location.state?.fromStepOne || [], [location.state]);
  const { waterTypes: fetchedWaterTypes, loading: configLoading, error: configError } = useConfig();
  
  const initialState = { sourceJugs: [], targetWater: [] };
  const [state, dispatch] = useReducer(assignmentReducer, initialState);
  const { sourceJugs, targetWater } = state;

  const [showAnimation, setShowAnimation] = useState(true);

  const maxJugs = useMemo(() => sourceJugsFromState.reduce((sum, j) => sum + j.quantity, 0), [sourceJugsFromState]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 5 } })
  );

  useEffect(() => {
    if (sourceJugsFromState.length === 0) {
      navigate("/pedidos/rellenar");
      return;
    }
    if (!configLoading && !configError && fetchedWaterTypes.length > 0) {
      dispatch({ 
        type: 'INITIALIZE', 
        payload: { sourceJugs: sourceJugsFromState, waterTypes: fetchedWaterTypes }
      });
    }
  }, [sourceJugsFromState, fetchedWaterTypes, configLoading, configError, navigate]);

  useEffect(() => {
    if (!configError && !configLoading) {
      const timer = setTimeout(() => setShowAnimation(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [configError, configLoading]);

  const totalJugsAssigned = useMemo(() => targetWater.reduce((sum, p) => sum + p.quantity, 0), [targetWater]);

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.data.current?.type !== "jug" || over.data.current?.type !== "water") return;
    dispatch({ type: 'ASSIGN_JUG', payload: { sourceJugId: active.id, targetWaterId: over.id } });
  };

  const handleManualAdd = (waterTypeId) => {
    const firstAvailableJug = sourceJugs.find((jug) => jug.quantity > 0);
    if (!firstAvailableJug) return;
    dispatch({ type: 'ASSIGN_JUG', payload: { sourceJugId: firstAvailableJug.id, targetWaterId: waterTypeId } });
  };

  const handleManualRemove = (waterTypeId) => {
    dispatch({ type: 'UNASSIGN_JUG', payload: { waterTypeId } });
  };

  const handleBack = () => navigate("/pedidos/rellenar", { state: location.state });
  
  const handleContinue = () => {
    const fromStepTwoPayload = targetWater
        .map(wt => ({ ...wt, assignments: wt.assignments.filter(a => a.quantity > 0) }))
        .filter(wt => wt.assignments.length > 0);

    navigate("/pedidos/rellenar/entrega", {
      state: {
        ...location.state,
        fromStepTwo: fromStepTwoPayload,
        maxJugs,
        backPath: location.pathname,
      },
    });
  };
  
  const renderContent = () => {
    if (configLoading) return <div className="text-center py-10">Cargando...</div>;
    if (configError) return <div className="text-center py-10 text-red-500">{configError}</div>;

    return (
      <>
        {showAnimation && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 transition-opacity duration-500"></div>}
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          {showAnimation && (
            <>
              <div className="instruction-animation-container">
                <div className="instruction-jug"><img src="/img/garrafones/turquesa.png" alt="Animación" /></div>
              </div>
              <div className="instruction-animation-container-mobile">
                <div className="instruction-jug-mobile"><img src="/img/garrafones/turquesa.png" alt="Animación" /></div>
              </div>
            </>
          )}
          <div className="flex flex-wrap justify-between items-start gap-4 mb-6 relative z-40">
            <p className={`hidden md:block transition-all duration-300 ${showAnimation ? "text-white font-bold" : "text-text-secondary dark:text-white/80"}`}>
              Arrastra tus garrafones de la izquierda hacia el tipo de agua que deseas a la derecha.
            </p>
            <p className={`block md:hidden transition-all duration-300 ${showAnimation ? "text-white font-bold" : "text-text-secondary dark:text-white/80"}`}>
              Arrastra tus garrafones de arriba hacia el tipo de agua que deseas abajo.
            </p>
            <div className="flex flex-col items-end gap-1">
              <p className="text-sm font-medium">Total Asignado</p>
              <p className="text-3xl font-black">
                <span className="text-primary">{totalJugsAssigned}</span>
                <span className="text-text-secondary dark:text-white/60 text-xl"> / {maxJugs}</span>
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 min-h-[300px]">
            <div className={`space-y-4 p-4 rounded-xl bg-white/50 dark:bg-gray-900/50 ${showAnimation ? "highlight-tutorial" : ""}`}>
              <h2 className="text-xl font-bold text-center">Mis Garrafones</h2>
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
            <div className={`space-y-4 p-4 rounded-xl bg-white/50 dark:bg-gray-900/50 ${showAnimation ? "highlight-tutorial" : ""}`}>
              <h2 className="text-xl font-bold text-center">Tipos de Agua</h2>
              {targetWater.map((water) => (
                <DroppableWaterType key={water.id} {...water}>
                  <div className="p-4 rounded-lg shadow bg-white dark:bg-gray-800 flex flex-col items-center justify-center gap-2 min-h-[100px] relative overflow-hidden">
                    <div className="wave-container">
                      <div className="wave"></div>
                      <div className="wave two"></div>
                    </div>
                    <div className="relative flex flex-col items-center justify-center gap-2">
                      <p className="text-lg font-bold text-center">{water.name}</p>
                      <div className="flex items-center gap-4">
                        <button onClick={() => handleManualRemove(water.id)} className="btn-secondary p-2 h-8 w-8 flex items-center justify-center rounded-full">-</button>
                        <span className="text-3xl font-black text-primary tabular-nums">{water.quantity}</span>
                        <button onClick={() => handleManualAdd(water.id)} className="btn-secondary p-2 h-8 w-8 flex items-center justify-center rounded-full">+</button>
                      </div>
                    </div>
                  </div>
                </DroppableWaterType>
              ))}
            </div>
          </div>
        </DndContext>
      </>
    );
  };

  return (
    <OrderLayout
      title="Asigna tus garrafones"
      subtitle="Arrastra cada garrafón al tipo de agua que prefieras."
      step={2}
      totalSteps={4}
    >
      <div className="flex flex-col gap-6">{renderContent()}</div>
      <footer className="mt-auto pt-8">
        <div className="flex flex-col-reverse sm:flex-row gap-4 justify-between items-center">
          <button type="button" onClick={handleBack} className="flex h-12 sm:h-14 w-full sm:w-auto items-center justify-center rounded-lg border border-slate-300 bg-slate-100 text-dark dark:bg-slate-800 dark:text-white dark:border-slate-600 text-base sm:text-lg font-semibold px-6 sm:px-8 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
            Volver al paso 1
          </button>
          <button
            type="button"
            onClick={handleContinue}
            className="flex h-12 w-full sm:w-auto items-center justify-center rounded-lg bg-primary px-8 text-base font-semibold text-white shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={totalJugsAssigned !== maxJugs}
          >
            Continuar al paso 3
          </button>
        </div>
      </footer>
    </OrderLayout>
  );
};

export default RefillAssignStepTwo;