// src/pages/PuntoDeVenta/CrearPedidoFlow.jsx
import React, { useState } from 'react';
import PosStepOne_SelectJugs from './steps/PosStepOne_SelectJugs';
import PosStepTwo_AssignWater from './steps/PosStepTwo_AssignWater';
import PosStepThree_Finalize from './steps/PosStepThree_Finalize';

const CrearPedidoFlow = ({ tipoPedido, onPedidoCancelado, onPedidoGuardado }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [pedidoData, setPedidoData] = useState({ tipo: tipoPedido });

  const handleNextStep = (data) => {
    setPedidoData(prev => ({ ...prev, ...data }));
    setCurrentStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <PosStepOne_SelectJugs
            onBack={onPedidoCancelado} // Volver al panel principal
            onContinue={handleNextStep}
            existingSelection={pedidoData.stepOneData || []}
          />
        );
      case 2:
        return (
          <PosStepTwo_AssignWater
            onBack={handlePrevStep} // Volver al paso 1
            onContinue={handleNextStep}
            pedidoData={pedidoData}
          />
        );
      case 3:
         return (
           <PosStepThree_Finalize
            onBack={handlePrevStep} // Volver al paso 2
            onFinalize={onPedidoGuardado}
            pedidoData={pedidoData}
           />
         );
      default:
        return <p>Paso desconocido.</p>;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <header className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          Nuevo Pedido: <span className="capitalize text-primary">{tipoPedido}</span>
        </h2>
        <p className="text-gray-500">Paso {currentStep} de 3</p>
      </header>
      
      <div>
        {renderCurrentStep()}
      </div>
    </div>
  );
};

export default CrearPedidoFlow;
