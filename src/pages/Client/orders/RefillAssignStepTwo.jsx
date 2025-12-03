// src/pages/cliente/orders/RefillAssignStepTwo.jsx
import { useState, useEffect, useMemo } from "react";
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
// Componente Draggable (Garrafón a la izquierda)
// ====================================================================
const DraggableJug = ({ jug, children }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: jug.id,
      data: { jug, type: "jug" },
    });

  const style = {
    position: "relative",
    // IMPORTANTE PARA MÓVIL: evita que el navegador haga scroll/zoom en vez de arrastrar
    touchAction: "none",
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    zIndex: isDragging ? 9999 : "auto",
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {children}
    </div>
  );
};

// ====================================================================
// Componente Droppable (Tipo de Agua a la derecha)
// ====================================================================
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
// Componente Principal
// ====================================================================
const RefillAssignStepTwo = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const sourceJugsFromState = useMemo(
    () => location.state?.fromStepOne || [],
    [location.state]
  );

  const [sourceJugs, setSourceJugs] = useState([]);
  const [targetWater, setTargetWater] = useState([]);

  const {
    waterTypes: fetchedWaterTypes,
    loading: configLoading,
    error: configError,
  } = useConfig();
  const loading = configLoading;
  const error = configError;

  const [showAnimation, setShowAnimation] = useState(true);

  const maxJugs = useMemo(
    () => sourceJugsFromState.reduce((sum, j) => sum + j.quantity, 0),
    [sourceJugsFromState]
  );

  // Sensores para mouse + touch (dnd-kit)
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5, // píxeles antes de activar drag (evita drags accidentales)
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 120, // ms manteniendo el dedo antes de arrastrar
        tolerance: 5, // cuánto se puede mover el dedo durante el delay
      },
    })
  );

  useEffect(() => {
    if (sourceJugsFromState.length === 0) {
      navigate("/pedidos/rellenar");
      return;
    }
    setSourceJugs(
      sourceJugsFromState.map((jug) => ({
        ...jug,
        initialQuantity: jug.quantity,
      }))
    );

    if (!configLoading && !configError && fetchedWaterTypes.length > 0) {
      const initialWaterTypes = fetchedWaterTypes.map((wt) => ({
        id: wt.id,
        name: `Agua ${wt.name}`,
        quantity: 0,
      }));
      setTargetWater(initialWaterTypes);
    }
  }, [
    sourceJugsFromState,
    fetchedWaterTypes,
    configLoading,
    configError,
    navigate,
  ]);

  useEffect(() => {
    if (!configError && !configLoading) {
      const timer = setTimeout(() => setShowAnimation(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [configError, configLoading]);

  const totalJugsAssigned = useMemo(
    () => targetWater.reduce((sum, p) => sum + p.quantity, 0),
    [targetWater]
  );

  const handleDragEnd = ({ active, over }) => {
    if (
      !over ||
      active.data.current?.type !== "jug" ||
      over.data.current?.type !== "water"
    )
      return;

    const sourceJugId = active.data.current.jug.id;
    const targetWaterId = over.id;

    const sourceJug = sourceJugs.find((j) => j.id === sourceJugId);
    if (!sourceJug || sourceJug.quantity === 0) return;

    setSourceJugs((prev) =>
      prev.map((jug) =>
        jug.id === sourceJugId
          ? { ...jug, quantity: jug.quantity - 1 }
          : jug
      )
    );
    setTargetWater((prev) =>
      prev.map((water) =>
        water.id === targetWaterId
          ? { ...water, quantity: water.quantity + 1 }
          : water
      )
    );
  };

  const handleManualAdd = (waterTypeId) => {
    const firstAvailableJug = sourceJugs.find((jug) => jug.quantity > 0);
    if (!firstAvailableJug) return;
    handleDragEnd({
      active: { data: { current: { jug: firstAvailableJug, type: "jug" } } },
      over: { id: waterTypeId, data: { current: { type: "water" } } },
    });
  };

  const handleManualRemove = (waterTypeId) => {
    const assignedWater = targetWater.find((w) => w.id === waterTypeId);
    if (!assignedWater || assignedWater.quantity === 0) return;

    const jugToReturnTo = sourceJugs.find(
      (j) => j.quantity < j.initialQuantity
    );
    if (!jugToReturnTo) return;

    setSourceJugs((prev) =>
      prev.map((jug) =>
        jug.id === jugToReturnTo.id
          ? { ...jug, quantity: jug.quantity + 1 }
          : jug
      )
    );
    setTargetWater((prev) =>
      prev.map((water) =>
        water.id === waterTypeId
          ? { ...water, quantity: water.quantity - 1 }
          : water
      )
    );
  };

  const handleGoToStart = () => navigate("/pedidos");
  const handleBack = () => navigate("/pedidos/rellenar");
  const handleContinue = () => {
    navigate("/pedidos/rellenar/entrega", {
      state: {
        ...location.state,
        fromStepTwo: targetWater.filter((p) => p.quantity > 0),
        maxJugs,
      },
    });
  };

  const renderContent = () => {
    if (loading) return <div className="text-center py-10">Cargando...</div>;
    if (error)
      return <div className="text-center py-10 text-red-500">{error}</div>;

    return (
      <>
        {showAnimation && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 transition-opacity duration-500"></div>
        )}
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          {showAnimation && (
            <>
              <div className="instruction-animation-container">
                <div className="instruction-jug">
                  <img
                    src="/img/garrafones/turquesa.png"
                    alt="Animación"
                  />
                </div>
              </div>
              <div className="instruction-animation-container-mobile">
                <div className="instruction-jug-mobile">
                  <img
                    src="/img/garrafones/turquesa.png"
                    alt="Animación"
                  />
                </div>
              </div>
            </>
          )}
          <div className="flex flex-wrap justify-between items-start gap-4 mb-6 relative z-40">
            <p
              className={`hidden md:block transition-all duration-300 ${
                showAnimation
                  ? "text-white font-bold"
                  : "text-text-secondary dark:text-white/80"
              }`}
            >
              Arrastra tus garrafones de la izquierda hacia el tipo de agua que
              deseas a la derecha.
            </p>
            <p
              className={`block md:hidden transition-all duration-300 ${
                showAnimation
                  ? "text-white font-bold"
                  : "text-text-secondary dark:text-white/80"
              }`}
            >
              Arrastra tus garrafones de arriba hacia el tipo de agua que deseas
              abajo.
            </p>
            <div className="flex flex-col items-end gap-1">
              <p className="text-sm font-medium">Total Asignado</p>
              <p className="text-3xl font-black">
                <span className="text-primary">{totalJugsAssigned}</span>
                <span className="text-text-secondary dark:text-white/60 text-xl">
                  {" "}
                  / {maxJugs}
                </span>
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 min-h-[300px]">
            <div
              className={`space-y-4 p-4 rounded-xl bg-white/50 dark:bg-gray-900/50 ${
                showAnimation ? "highlight-tutorial" : ""
              }`}
            >
              <h2 className="text-xl font-bold text-center">Mis Garrafones</h2>
              {sourceJugs.map((jug) => (
                <DraggableJug key={jug.id} jug={jug}>
                  <div
                    className={`p-4 rounded-lg shadow flex items-center justify-between bg-white dark:bg-gray-800 transition-opacity ${
                      jug.quantity === 0 ? "opacity-40" : "cursor-grab"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={jug.imageUrl}
                        alt={jug.name}
                        className="h-12 w-12 object-contain"
                      />
                      <span className="font-medium">{jug.name}</span>
                    </div>
                    <span className="text-2xl font-bold">
                      {jug.quantity}
                    </span>
                  </div>
                </DraggableJug>
              ))}
            </div>
            <div
              className={`space-y-4 p-4 rounded-xl bg-white/50 dark:bg-gray-900/50 ${
                showAnimation ? "highlight-tutorial" : ""
              }`}
            >
              <h2 className="text-xl font-bold text-center">Tipos de Agua</h2>
              {targetWater.map((water) => (
                <DroppableWaterType key={water.id} {...water}>
                  <div className="p-4 rounded-lg shadow bg-white dark:bg-gray-800 flex flex-col items-center justify-center gap-2 min-h-[100px] relative overflow-hidden">
                    <div className="wave-container">
                      <div className="wave"></div>
                      <div className="wave two"></div>
                    </div>
                    <div className="relative flex flex-col items-center justify-center gap-2">
                      <p className="text-lg font-bold text-center">
                        {water.name}
                      </p>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => handleManualRemove(water.id)}
                          className="btn-secondary p-2 h-8 w-8 flex items-center justify-center rounded-full"
                        >
                          -
                        </button>
                        <span className="text-3xl font-black text-primary tabular-nums">
                          {water.quantity}
                        </span>
                        <button
                          onClick={() => handleManualAdd(water.id)}
                          className="btn-secondary p-2 h-8 w-8 flex items-center justify-center rounded-full"
                        >
                          +
                        </button>
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
          <button
            type="button"
            onClick={handleBack}
            className="flex h-12 sm:h-14 w-full sm:w-auto items-center justify-center rounded-lg border border-slate-300 bg-slate-100 text-dark dark:bg-slate-800 dark:text-white dark:border-slate-600 text-base sm:text-lg font-semibold px-6 sm:px-8 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
          >
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
