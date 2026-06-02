// src/pages/Client/orders/BuyJugsAssignWaterStepThree.jsx
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
import { useAuth } from "../../../context/AuthContext";
import { useHaptic } from "../../../hooks/useHaptic";
import "../../../animations.css";

// ====================================================================
// Datos de Información de Agua
// ====================================================================
const WATER_INFO = {
  'Alcalina': {
    title: 'Agua Alcalina (pH 8.5+)',
    description: 'Ideal para equilibrar el pH de tu cuerpo. Contiene minerales esenciales como calcio, magnesio y potasio. Ayuda a una hidratación superior y actúa como antioxidante natural.',
    icon: 'water_ph',
    color: 'text-blue-600',
    bg: 'bg-blue-50 dark:bg-blue-900/30'
  },
  'Purificada': {
    title: 'Agua Premium',
    description: 'Nuestra agua premium ofrece una calidad excepcional, comparable a las mejores marcas del mercado como Ciel, Bonafont y Epura. Pasa por un riguroso proceso de ósmosis inversa y ozonificación para garantizar pureza total, libre de sodio y bacterias. Sabor ligero y fresco.',
    icon: 'water_drop',
    color: 'text-cyan-500',
    bg: 'bg-cyan-50 dark:bg-cyan-900/30'
  }
};

const WaterInfoModal = ({ waterName, onClose }) => {
  const infoKey = Object.keys(WATER_INFO).find(key => waterName.includes(key)) || 'Purificada'; 
  const info = WATER_INFO[infoKey];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-200 relative pb-6 sm:pb-0">
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors z-10"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
        
        <div className={`p-6 flex flex-col items-center text-center gap-4 ${info.bg}`}>
          <div className={`h-16 w-16 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm ${info.color}`}>
            <span className="material-symbols-outlined text-4xl">{info.icon}</span>
          </div>
          <h3 className={`text-2xl font-black ${info.color}`}>{info.title}</h3>
        </div>
        
        <div className="p-6 pt-4">
          <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
            {info.description}
          </p>
          <button 
            onClick={onClose}
            className="mt-6 w-full btn-primary py-3 rounded-xl"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

// ====================================================================
// Sub-componentes de UI
// ====================================================================
const DraggableJug = ({ jug, children }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: jug.id,
      data: { jug, type: "jug" },
    });

  const style = {
    position: "relative",
    touchAction: "manipulation", 
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    zIndex: isDragging ? 9999 : "auto",
    cursor: isDragging ? "grabbing" : "grab",
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
// Reducer
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
            dbId: sourceJug.dbId, // Mantener referencia al ID original de la DB
            jugName: sourceJug.name,
            imageUrl: sourceJug.imageUrl,
            quantity: 1,
            isNewPurchase: sourceJug.isNewPurchase !== false
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
// Componente Principal
// ====================================================================
const BuyJugsAssignWaterStepThree = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const previousState = location.state || {};
  
  // Combine new jugs and refills if any
  const sourceJugsFromState = useMemo(() => {
    let source = [];
    if (previousState.buyFlow && previousState.buyFlow.fromStepOneBuy) {
        // Only get Garrafones
        const jugs = previousState.buyFlow.fromStepOneBuy.filter(p => p.category === 'Garrafones');
        source = jugs.map(j => ({ ...j, isNewPurchase: true }));
    }
    
    // Add refills from other flow if present
    if (previousState.fromStepOne) {
        const refills = previousState.fromStepOne.map(j => ({ ...j, isNewPurchase: false }));
        // Combine them if they share the same ID, or keep them separate
        refills.forEach(r => {
            const existing = source.find(s => s.id === r.id && s.isNewPurchase === false);
            if (existing) {
                existing.quantity += r.quantity;
            } else {
                source.push(r);
            }
        });
    }

    // Ensure they have unique IDs for dragging if they are same product but one is new and one is refill
    return source.map((j, index) => ({
      ...j,
      id: j.isNewPurchase ? `new-${j.id}` : `refill-${j.id}`,
      dbId: j.id // Keep reference to original ID
    }));
  }, [previousState]);

  const { waterTypes: fetchedWaterTypes, loading: configLoading, error: configError } = useConfig();
  
  const initialState = { sourceJugs: [], targetWater: [] };
  const [state, dispatch] = useReducer(assignmentReducer, initialState);
  const { sourceJugs, targetWater } = state;
  const [infoModalOpen, setInfoModalOpen] = useState(null);
  const { selection, impact } = useHaptic();

  const [showAnimation, setShowAnimation] = useState(() => {
    if (user) {
      const key = `tutorial_buy_assign_views_${user.id}`;
      const views = parseInt(localStorage.getItem(key) || '0', 10);
      return views < 2;
    }
    return true;
  });

  const maxJugs = useMemo(() => sourceJugsFromState.reduce((sum, j) => sum + j.quantity, 0), [sourceJugsFromState]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 10 } }),
    useSensor(TouchSensor, { 
      activationConstraint: { 
        delay: 250, 
        tolerance: 5 
      } 
    })
  );

  useEffect(() => {
    if (sourceJugsFromState.length === 0) {
      navigate("/pedidos/comprar/opcion-llenado", { state: previousState });
      return;
    }
    if (!configLoading && !configError && fetchedWaterTypes.length > 0) {
      dispatch({ 
        type: 'INITIALIZE', 
        payload: { sourceJugs: sourceJugsFromState, waterTypes: fetchedWaterTypes }
      });
    }
  }, [sourceJugsFromState, fetchedWaterTypes, configLoading, configError, navigate, previousState]);

  useEffect(() => {
    if (!configError && !configLoading && showAnimation) {
      if (user) {
        const key = `tutorial_buy_assign_views_${user.id}`;
        const views = parseInt(localStorage.getItem(key) || '0', 10);
        if (views < 2) {
          localStorage.setItem(key, (views + 1).toString());
        }
      }

      const timer = setTimeout(() => setShowAnimation(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [configError, configLoading, showAnimation, user]);

  const totalJugsAssigned = useMemo(() => targetWater.reduce((sum, p) => sum + p.quantity, 0), [targetWater]);

  const handleDragStart = () => {
    selection();
  };

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

  const handleBack = () => {
    navigate("/pedidos/comprar/opcion-llenado", {
      state: previousState,
    });
  };
  
  const handleContinue = () => {
    const fromStepTwoPayload = targetWater
        .map(wt => ({ ...wt, assignments: wt.assignments.filter(a => a.quantity > 0) }))
        .filter(wt => wt.assignments.length > 0);

    const nextState = {
        ...previousState,
        fromStepTwo: fromStepTwoPayload,
        maxJugs,
        backPath: location.pathname,
        mode: "buy"
    };

    navigate("/pedidos/rellenar/entrega", { state: nextState });
  };
  
  const renderContent = () => {
    if (configLoading) return <div className="text-center py-10">Cargando...</div>;
    if (configError) return <div className="text-center py-10 text-red-500">{configError}</div>;

    return (
      <>
        {showAnimation && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 transition-opacity duration-500"></div>}
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
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
            <div className="flex-1 min-w-[280px]">
                <p className={`hidden md:block transition-all duration-300 ${showAnimation ? "text-white font-bold" : "text-text-secondary dark:text-white/80"}`}>
                  Arrastra tus garrafones nuevos o para recarga hacia el tipo de agua que deseas a la derecha.
                </p>
                <p className={`block md:hidden transition-all duration-300 ${showAnimation ? "text-white font-bold" : "text-text-secondary dark:text-white/80"}`}>
                  Arrastra tus garrafones nuevos o para recarga de arriba hacia el tipo de agua que deseas abajo.
                </p>
                <p className="mt-2 text-xs sm:text-sm text-text-secondary dark:text-white/70">
                  <span className="font-semibold text-dark dark:text-white">Tip:</span> Toca el icono <span className="material-symbols-outlined text-[14px] align-middle">info</span> para conocer los beneficios de cada tipo de agua.
                </p>
            </div>
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
              <h2 className="text-xl font-bold text-center">Tus Garrafones</h2>
              {[...sourceJugs]
                .sort((a, b) => {
                    const getCapacity = (name) => {
                        const nameLower = name.toLowerCase();
                        const match = nameLower.match(/(\d+(?:\.\d+)?)\s*(?:l|litros?|lt)/);
                        if (match) return parseFloat(match[1]);
                        if (nameLower.includes('garrafón') || nameLower.includes('garrafon')) return 20;
                        if (nameLower.includes('botella')) return 1;
                        return 0;
                    };

                    const capA = getCapacity(a.name);
                    const capB = getCapacity(b.name);
                    
                    if (capA !== capB) return capB - capA;
                    return a.name.localeCompare(b.name);
                })
                .map((jug) => (
                <DraggableJug key={jug.id} jug={jug}>
                  <div className={`p-4 rounded-lg shadow flex items-center justify-between bg-white dark:bg-gray-800 transition-opacity ${jug.quantity === 0 ? "opacity-40" : "cursor-grab"}`}>
                    <div className="flex items-center gap-3">
                      <img src={jug.imageUrl} alt={jug.name} className="h-12 w-12 object-contain" />
                      <div className="flex flex-col">
                        <span className="font-medium">{jug.name}</span>
                        {jug.isNewPurchase && (
                          <span className="text-[10px] uppercase font-bold text-primary">Envase Nuevo</span>
                        )}
                      </div>
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
                  <div className="p-4 rounded-lg shadow bg-white dark:bg-gray-800 flex flex-col items-center justify-center gap-2 min-h-[120px] relative overflow-hidden">
                    <div className="wave-container">
                      <div className="wave"></div>
                      <div className="wave two"></div>
                    </div>
                    <div className="relative z-10 flex flex-col items-center justify-center gap-2">
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-bold text-center">{water.name}</p>
                        <button 
                          onClick={() => setInfoModalOpen(water.name)}
                          className="text-gray-400 hover:text-primary transition-colors"
                          title="Ver beneficios"
                        >
                          <span className="material-symbols-outlined text-lg">info</span>
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => handleManualRemove(water.id)} className="btn-secondary flex h-11 w-11 items-center justify-center rounded-full text-xl">-</button>
                        <span className="w-12 text-center text-3xl font-black text-primary tabular-nums">{water.quantity}</span>
                        <button onClick={() => handleManualAdd(water.id)} className="btn-secondary flex h-11 w-11 items-center justify-center rounded-full text-xl">+</button>
                      </div>
                    </div>
                  </div>
                </DroppableWaterType>
              ))}
            </div>
          </div>
        </DndContext>
        {infoModalOpen && <WaterInfoModal waterName={infoModalOpen} onClose={() => setInfoModalOpen(null)} />}
      </>
    );
  };

  return (
    <OrderLayout
      title={
        <>
          <span className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center justify-center p-1 -ml-2 text-inherit rounded-full active:bg-black/5 dark:active:bg-white/10 transition-colors"
            >
              <span className="material-symbols-outlined text-3xl">arrow_back</span>
            </button>
            Asigna el agua
          </span>
          <span className="hidden md:inline">Asigna tus garrafones nuevos al agua</span>
        </>
      }
      subtitle="Arrastra cada garrafón que compraste al tipo de agua que prefieras."
      step={2}
      totalSteps={4}
    >
      <div className="flex flex-col gap-4 sm:gap-6">{renderContent()}</div>
      <footer className="mt-auto pt-4 md:pt-8">
        <div className="flex flex-col-reverse sm:flex-row gap-4 justify-between items-center">
          <button type="button" onClick={handleBack} className="hidden md:flex h-12 sm:h-14 w-full sm:w-auto items-center justify-center rounded-lg border border-slate-300 bg-slate-100 text-dark dark:bg-slate-800 dark:text-white dark:border-slate-600 text-base sm:text-lg font-semibold px-6 sm:px-8 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
            Volver al paso 2
          </button>
          <button
            type="button"
            onClick={handleContinue}
            className="flex h-12 w-full md:w-auto items-center justify-center rounded-xl bg-primary px-8 text-base font-semibold text-white shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={totalJugsAssigned !== maxJugs}
          >
            Continuar al método de entrega
          </button>
        </div>
      </footer>
    </OrderLayout>
  );
};

export default BuyJugsAssignWaterStepThree;

