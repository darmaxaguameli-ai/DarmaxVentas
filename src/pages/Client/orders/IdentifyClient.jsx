import { useState } from "react";
import { useNavigate } from "react-router-dom";
import OrderLayout from "../../../layouts/OrderLayout";

const IdentifyClient = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");

  const handleContinue = () => {
    if (!name.trim()) return;

    navigate("/pedidos/rellenar", {
      state: { clientName: name.trim() },
    });
  };

  return (
    <OrderLayout
      title="Identifícate como cliente"
      subtitle="Solo necesitamos tu nombre registrado."
      step={0}
      totalSteps={4}
    >
      <div className="max-w-lg mx-auto mt-8 flex flex-col gap-6">
        
        <label className="text-lg font-medium text-dark dark:text-white">
          Nombre completo
        </label>

        <input
          type="text"
          placeholder="Ejemplo: María López"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-14 w-full rounded-xl border border-slate-300 
                     dark:border-slate-700 bg-white dark:bg-dark px-4
                     text-lg text-dark dark:text-white
                     focus:ring-2 ring-primary outline-none"
        />

        <button
          onClick={handleContinue}
          disabled={!name.trim()}
          className="w-full h-14 rounded-xl bg-primary text-white
                     text-lg font-semibold shadow-md
                     hover:bg-primary/90 transition-all
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continuar
        </button>

      </div>
    </OrderLayout>
  );
};

export default IdentifyClient;
