import { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';

const SignaturePad = ({ onSave }) => {
  const sigCanvas = useRef({});

  const clear = () => {
    sigCanvas.current.clear();
  };

  const save = () => {
    onSave(sigCanvas.current.getTrimmedCanvas().toDataURL('image/png'));
    clear();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-gray-200 rounded-lg">
        <SignatureCanvas
          ref={sigCanvas}
          penColor="black"
          canvasProps={{ className: 'w-full h-48 rounded-lg' }}
        />
      </div>
      <div className="flex justify-center gap-4">
        <button onClick={clear} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg">
          Limpiar
        </button>
        <button onClick={save} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg">
          Guardar Firma
        </button>
      </div>
    </div>
  );
};

export default SignaturePad;
