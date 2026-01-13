import React, { useState, useEffect, useMemo, useReducer } from 'react';
import { useConfig } from '../../context/ConfigContext';
import QuantityCard from '../../components/order/QuantityCard';
import Swal from 'sweetalert2';
import {
  DndContext,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  MouseSensor,
  TouchSensor,
} from "@dnd-kit/core";
import useHaptic from '../../hooks/useHaptic';

// --- Components for Step 2 (DND) ---

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

// --- Reducer for Step 2 ---

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
      return state;
  }
}

// --- Main Component ---

const PosRefillGrid = ({ onProductSelect, defaultDeliveryMethod = 'mostrador' }) => {
  const { jugBrands, waterTypes, servicePrices, loading, error } = useConfig();
  const { triggerSelection, triggerImpact } = useHaptic();
  
  // Wizard State
  const [step, setStep] = useState(1);
  const [selectedJugs, setSelectedJugs] = useState([]);
  
  // Step 2 Reducer State
  const [assignmentState, dispatch] = useReducer(assignmentReducer, { sourceJugs: [], targetWater: [] });
  const { sourceJugs, targetWater } = assignmentState;

  // Step 3 State
  const [deliveryMethod, setDeliveryMethod] = useState(defaultDeliveryMethod === 'domicilio' ? 'delivery' : 'pickup'); 

  // Sync with prop changes if needed, but usually strictly controlled by internal wizard flow unless reset.
  useEffect(() => {
      setDeliveryMethod(defaultDeliveryMethod === 'domicilio' ? 'delivery' : 'pickup');
  }, [defaultDeliveryMethod]);

  // --- Step 1 Logic ---
  useEffect(() => {
    if (!loading && jugBrands.length > 0 && selectedJugs.length === 0) {
      const initialProducts = jugBrands.map((brand, index) => {
        const lowerName = brand.name.toLowerCase();
        const isBottle = lowerName.includes('1l') || lowerName.includes('1 litro') || lowerName.includes('1lt') || lowerName.includes('1.5l');
        const displayName = isBottle ? `Botella ${brand.name}` : `Garrafón ${brand.name}`;
        
        return {
          id: brand.id,
          name: displayName,
          quantity: 0,
          featured: index === 0,
          imageUrl: brand.imageUrl || '/img/garrafones/turquesa.png',
        };
      });
      setSelectedJugs(initialProducts);
    }
  }, [loading, jugBrands]); // Keep dependency minimal to avoid reset loop

  const handleJugQuantityChange = (id, delta) => {
    setSelectedJugs((prev) =>
      prev.map((p) => {
        if (p.id === id) {
            return { 
                ...p, 
                quantity: Math.max(0, p.quantity + delta),
                featured: true 
            };
        }
        return { ...p, featured: false };
      })
    );
  };

  const totalJugs = useMemo(() => selectedJugs.reduce((sum, p) => sum + p.quantity, 0), [selectedJugs]);

  const goToStep2 = () => {
    if (totalJugs === 0) {
        Swal.fire('Atención', 'Selecciona al menos un garrafón.', 'warning');
        return;
    }
    const jugsToAssign = selectedJugs.filter(j => j.quantity > 0);
    dispatch({ 
        type: 'INITIALIZE', 
        payload: { sourceJugs: jugsToAssign, waterTypes: waterTypes }
      });
    setStep(2);
  };

  // --- Step 2 Logic ---
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 10 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.data.current?.type !== "jug" || over.data.current?.type !== "water") return;
    triggerImpact('medium');
    dispatch({ type: 'ASSIGN_JUG', payload: { sourceJugId: active.id, targetWaterId: over.id } });
  };

  const totalAssigned = useMemo(() => targetWater.reduce((sum, w) => sum + w.quantity, 0), [targetWater]);

  const goToStep3 = () => {
      setStep(3);
  };

  // --- Step 3 Logic ---
  const handleFinish = () => {
      // Logic to resolve products from assignments
      const finalItems = [];

      const findBestPrice = (prices, method, waterTypeId, jugName, jugId) => {
          let backendMethod = 'Mostrador'; // Default
          
          if (method === 'delivery' || method === 'home_collection') {
              backendMethod = 'Domicilio';
          } else if (method === 'pickup') {
              backendMethod = 'Mostrador';
          }

          // Extraer tamaño del nombre del garrafón (ej. "4L", "1 Litro")
          const sizeMatch = jugName ? jugName.match(/(\d+(?:\.\d+)?)\s*(?:l|litros?|lt)/i) : null;
          const sizeSuffix = sizeMatch ? `${sizeMatch[1]}L` : '20L'; // Default 20L
          
          const serviceNameToSearch = `Recarga ${sizeSuffix}`; 

          // Helper to filter candidates
          const getMatches = (targetMethod) => prices.filter(p => {
              const nameMatch = p.name === serviceNameToSearch;
              const methodMatch = p.method === targetMethod;
              // Loose comparison for IDs to handle string/number differences
              const waterMatch = p.waterType?.id == waterTypeId; 
              
              return nameMatch && methodMatch && waterMatch;
          });
          
          let possibleMatches = getMatches(backendMethod);
          let usedFallback = false;

          // Fallback: If Domicilio requested but not found, try Mostrador
          if (!possibleMatches.length && backendMethod === 'Domicilio') {
              console.warn(`[PosRefillGrid] No exact match for ${serviceNameToSearch} - Domicilio. Falling back to Mostrador price.`);
              possibleMatches = getMatches('Mostrador');
              usedFallback = true;
          }
          
          if (!possibleMatches.length) {
              // DEBUG: Log why we didn't find it
              console.warn(`[PosRefillGrid] No match for: Name="${serviceNameToSearch}", Method="${backendMethod}" (nor fallback), WaterID="${waterTypeId}"`);
              console.log("Available prices for this water type:", prices.filter(p => p.waterType?.id == waterTypeId));
              return null;
          }

          // Prioridad 1: Encontrar un precio que liste explícitamente esta marca de garrafón.
          const brandSpecificMatch = possibleMatches.find(p =>
              p.jugBrands && p.jugBrands.length > 0 && p.jugBrands.some(brand => brand.id == jugId)
          );

          if (brandSpecificMatch) {
              return brandSpecificMatch;
          }

          // Prioridad 2: Si no hay uno específico, encontrar un precio "genérico" (que no especifica marcas).
          const genericMatch = possibleMatches.find(p => !p.jugBrands || p.jugBrands.length === 0);

          return genericMatch || null;
      };

      targetWater.forEach(water => {
          water.assignments.forEach(assign => {
              if (assign.quantity > 0) {
                const servicePrice = findBestPrice(servicePrices, deliveryMethod, water.id, assign.jugName, assign.jugId);

                if (servicePrice) {
                    finalItems.push({
                        ...servicePrice,
                        // Add extra metadata if needed by NewOrderFlow/Backend
                        jugBrandId: assign.jugId, // Use original jug brand ID
                        jugBrandName: assign.jugName,
                        jugBrandImageUrl: assign.imageUrl,
                        quantity: assign.quantity,
                        // Override name to be specific? "Recarga Ciel 20L - Agua Purificada"
                        name: `${servicePrice.name} ${assign.jugName} (${water.name})`,
                        servicePriceId: servicePrice.id,
                        price: Number(servicePrice.price) // Ensure number
                    });
                } else {
                    const sizeMatch = assign.jugName ? assign.jugName.match(/(\d+(?:\.\d+)?)\s*(?:l|litros?|lt)/i) : null;
                    const sizeSuffix = sizeMatch ? `${sizeMatch[1]}L` : '20L';
                    console.error(`No price found for Recarga ${sizeSuffix} - ${deliveryMethod} - ${water.name}. Jug: ${assign.jugName}`);
                    
                    finalItems.push({
                        id: `unknown-${Date.now()}-${Math.random()}`,
                        name: `[SIN PRECIO] Recarga ${assign.jugName} (${water.name})`,
                        price: 0,
                        quantity: assign.quantity,
                        jugBrandName: assign.jugName,
                    });
                }
              }
          });
      });

      if (finalItems.length === 0) {
          Swal.fire('Error', 'No se pudieron generar los productos. Verifica la configuración de precios.', 'error');
          return;
      }

      // Add items to cart
      finalItems.forEach(item => {
          onProductSelect(item, item.quantity);
      });

      triggerImpact('heavy');
      Swal.fire({
          icon: 'success',
          title: 'Agregado',
          text: 'Los productos se han agregado al pedido.',
          timer: 1500,
          showConfirmButton: false
      });

      // Reset Wizard
      setStep(1);
      setSelectedJugs(prev => prev.map(p => ({ ...p, quantity: 0, featured: false })));
  };


  if (loading) return <div className="p-8 text-center">Cargando catálogo...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 h-full flex flex-col">
        {/* Wizard Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800 rounded-t-xl">
            <h2 className="font-bold text-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">local_drink</span>
                Asistente de Recarga
            </h2>
            <div className="flex items-center gap-1 text-sm font-medium">
                <span className={`px-2 py-1 rounded-md ${step === 1 ? 'bg-primary text-white' : 'text-gray-400'}`}>1. Garrafones</span>
                <span className="text-gray-300">/</span>
                <span className={`px-2 py-1 rounded-md ${step === 2 ? 'bg-primary text-white' : 'text-gray-400'}`}>2. Agua</span>
                <span className="text-gray-300">/</span>
                <span className={`px-2 py-1 rounded-md ${step === 3 ? 'bg-primary text-white' : 'text-gray-400'}`}>3. Entrega</span>
            </div>
        </div>

        {/* Wizard Content */}
        <div className="flex-grow p-4 overflow-y-auto">
            
            {/* STEP 1 */}
            {step === 1 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {selectedJugs.map((product) => (
                        <QuantityCard
                            key={product.id}
                            name={product.name}
                            imageUrl={product.imageUrl}
                            quantity={product.quantity}
                            featured={product.featured}
                            onIncrease={() => handleJugQuantityChange(product.id, 1)}
                            onDecrease={() => handleJugQuantityChange(product.id, -1)}
                            onCardClick={() => handleJugQuantityChange(product.id, 1)}
                        />
                    ))}
                </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
                <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                         {/* Source Jugs */}
                         <div className="space-y-3">
                            <h3 className="font-semibold text-gray-500 uppercase text-xs tracking-wider">Por Asignar</h3>
                            {sourceJugs.filter(j => j.quantity > 0).length === 0 && (
                                <div className="p-4 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg text-center text-sm">
                                    ¡Todos los garrafones asignados!
                                </div>
                            )}
                            {sourceJugs.map(jug => (
                                <DraggableJug key={jug.id} jug={jug}>
                                    <div className={`p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between shadow-sm ${jug.quantity === 0 ? 'opacity-40 grayscale' : 'hover:border-primary/50'}`}>
                                        <div className="flex items-center gap-3">
                                            <img src={jug.imageUrl} className="w-10 h-10 object-contain" alt="" />
                                            <span className="font-bold text-sm">{jug.name}</span>
                                        </div>
                                        <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md font-mono font-bold text-lg">{jug.quantity}</span>
                                    </div>
                                </DraggableJug>
                            ))}
                         </div>

                         {/* Target Water Types */}
                         <div className="space-y-3">
                            <h3 className="font-semibold text-gray-500 uppercase text-xs tracking-wider">Tipos de Agua</h3>
                            {targetWater.map(water => (
                                <DroppableWaterType key={water.id} {...water}>
                                    <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 min-h-[100px] flex flex-col items-center justify-center gap-2">
                                        <span className="font-bold text-primary">{water.name}</span>
                                        {water.quantity > 0 ? (
                                            <div className="flex flex-wrap gap-1 justify-center">
                                                {water.assignments.filter(a => a.quantity > 0).map((a, i) => (
                                                    <span key={i} className="text-xs bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800 px-2 py-1 rounded-full text-blue-800 dark:text-blue-200 shadow-sm flex items-center gap-1">
                                                        <img src={a.imageUrl} className="w-4 h-4" alt=""/>
                                                        {a.quantity}x
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-400">Arrastra aquí</span>
                                        )}
                                        <div className="mt-2 text-2xl font-black text-blue-600">{water.quantity}</div>
                                        
                                        {/* Manual Controls */}
                                        <div className="flex gap-2 mt-1">
                                            <button 
                                                onClick={() => dispatch({ type: 'UNASSIGN_JUG', payload: { waterTypeId: water.id } })}
                                                className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 shadow text-gray-500 hover:text-red-500 flex items-center justify-center"
                                                disabled={water.quantity === 0}
                                            >
                                                -
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    const first = sourceJugs.find(j => j.quantity > 0);
                                                    if(first) dispatch({ type: 'ASSIGN_JUG', payload: { sourceJugId: first.id, targetWaterId: water.id } });
                                                }}
                                                className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 shadow text-gray-500 hover:text-green-500 flex items-center justify-center"
                                                disabled={!sourceJugs.some(j => j.quantity > 0)}
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                </DroppableWaterType>
                            ))}
                         </div>
                    </div>
                </DndContext>
            )}

            {/* STEP 3 */}
            {step === 3 && (
                <div className="max-w-2xl mx-auto py-8 space-y-6">
                    <h3 className="text-center text-xl font-bold">Método de Recolección</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <button
                            onClick={() => setDeliveryMethod('pickup')}
                            className={`p-6 rounded-xl border-2 transition-all flex flex-col items-center gap-4 ${deliveryMethod === 'pickup' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`}
                        >
                            <span className="material-symbols-outlined text-4xl text-primary">storefront</span>
                            <div className="text-center">
                                <div className="font-bold text-lg">En Tienda</div>
                                <p className="text-sm text-gray-500">Recarga en mostrador.</p>
                            </div>
                            {deliveryMethod === 'pickup' && <span className="material-symbols-outlined text-primary">check_circle</span>}
                        </button>
                        
                        <button
                            onClick={() => setDeliveryMethod('delivery')}
                            className={`p-6 rounded-xl border-2 transition-all flex flex-col items-center gap-4 ${deliveryMethod === 'delivery' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`}
                        >
                            <span className="material-symbols-outlined text-4xl text-primary">local_shipping</span>
                            <div className="text-center">
                                <div className="font-bold text-lg">Entrega</div>
                                <p className="text-sm text-gray-500">Llevamos a domicilio.</p>
                            </div>
                            {deliveryMethod === 'delivery' && <span className="material-symbols-outlined text-primary">check_circle</span>}
                        </button>

                        <button
                            onClick={() => setDeliveryMethod('home_collection')}
                            className={`p-6 rounded-xl border-2 transition-all flex flex-col items-center gap-4 ${deliveryMethod === 'home_collection' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`}
                        >
                            <span className="material-symbols-outlined text-4xl text-primary">recycling</span>
                            <div className="text-center">
                                <div className="font-bold text-lg">Recolección</div>
                                <p className="text-sm text-gray-500">Recogemos envases vacíos.</p>
                            </div>
                            {deliveryMethod === 'home_collection' && <span className="material-symbols-outlined text-primary">check_circle</span>}
                        </button>
                    </div>
                </div>
            )}
        </div>

        {/* Wizard Footer Actions */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-b-xl flex justify-between">
            {step > 1 ? (
                <button 
                    onClick={() => setStep(step - 1)}
                    className="px-6 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700 font-bold"
                >
                    Atrás
                </button>
            ) : (
                <div></div> // Spacer
            )}

            {step === 1 && (
                <button 
                    onClick={goToStep2}
                    disabled={totalJugs === 0}
                    className="px-8 py-2 rounded-lg bg-primary text-white font-bold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Siguiente: Asignar Agua
                </button>
            )}

            {step === 2 && (
                <button 
                    onClick={goToStep3}
                    disabled={totalAssigned < totalJugs} // Ensure all jugs assigned? Or allow partial? Usually must assign all.
                    className="px-8 py-2 rounded-lg bg-primary text-white font-bold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {totalAssigned < totalJugs ? `Faltan ${totalJugs - totalAssigned}` : 'Siguiente: Entrega'}
                </button>
            )}

            {step === 3 && (
                <button 
                    onClick={handleFinish}
                    className="px-8 py-2 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 shadow-lg shadow-green-200 dark:shadow-none"
                >
                    Agregar al Pedido
                </button>
            )}
        </div>
    </div>
  );
};

export default PosRefillGrid;
