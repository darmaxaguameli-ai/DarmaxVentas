import { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';

const SignaturePad = ({ onSave }) => {
  const sigCanvas = useRef({});

  const clear = () => {
    sigCanvas.current.clear();
  };

  const save = () => {
    if (sigCanvas.current.isEmpty()) {
        alert("Por favor, proporciona una firma.");
        return;
    }
    // Usar getCanvas() en lugar de getTrimmedCanvas() para evitar el error
    onSave(sigCanvas.current.getCanvas().toDataURL('image/png'));
    clear();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-gray-100 dark:bg-gray-700 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-500">
        <SignatureCanvas
          ref={sigCanvas}
          penColor="black"
          canvasProps={{ className: 'w-full h-48 rounded-lg' }}
        />
      </div>
      <div className="flex justify-center gap-4">
        <button onClick={clear} className="px-6 py-2 font-semibold text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
          Limpiar
        </button>
        <button onClick={save} className="px-6 py-2 font-semibold text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors">
          Guardar Firma
        </button>
      </div>
    </div>
  );
};

export default SignaturePad;