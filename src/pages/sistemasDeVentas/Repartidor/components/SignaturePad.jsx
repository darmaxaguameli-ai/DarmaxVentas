import { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { MdCheck, MdClear } from 'react-icons/md';

const SignaturePad = ({ onSave, onCancel }) => {
  const sigCanvas = useRef({});

  const clear = () => {
    sigCanvas.current.clear();
  };

  const save = () => {
    if (sigCanvas.current.isEmpty()) {
        // Visual shake or simple red border flash could be better, but for now just avoid saving
        const container = document.getElementById('sig-container');
        if(container) {
            container.classList.add('ring-2', 'ring-red-500');
            setTimeout(() => container.classList.remove('ring-2', 'ring-red-500'), 500);
        }
        return;
    }
    onSave(sigCanvas.current.getCanvas().toDataURL('image/png'));
    clear();
  };

  return (
    <div className="flex flex-col gap-4">
      <div id="sig-container" className="bg-white dark:bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-500 overflow-hidden shadow-inner transition-all">
        <SignatureCanvas
          ref={sigCanvas}
          penColor="black"
          canvasProps={{ className: 'w-full h-48 block cursor-crosshair' }}
          backgroundColor="rgba(0,0,0,0)"
        />
      </div>
      <div className="flex justify-center gap-3">
        <button 
            onClick={clear} 
            className="flex-1 py-3 px-4 font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
        >
          <MdClear className="text-xl" />
          Limpiar
        </button>
        <button 
            onClick={save} 
            className="flex-1 py-3 px-4 font-bold text-white bg-primary rounded-xl hover:bg-primary-dark transition-colors flex items-center justify-center gap-2 shadow-lg shadow-primary/30"
        >
          <MdCheck className="text-xl" />
          Guardar
        </button>
      </div>
    </div>
  );
};

export default SignaturePad;