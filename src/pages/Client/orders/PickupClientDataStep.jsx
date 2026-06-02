// src/pages/Client/orders/PickupClientDataStep.jsx
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import OrderLayout from "../../../layouts/OrderLayout";
import apiClient, { fetchPostalCodeData as apiFetchPostalCode } from "../../../api/apiClient";

const PickupClientDataStep = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const previousState = location.state || {};
  const deliveryMethod = previousState.deliveryMethod || "delivery";

  const [form, setForm] = useState({
    name: previousState.clientData?.name || "",
    phone: previousState.clientData?.phone || "",
    street: previousState.clientData?.street || "",
    neighborhood: previousState.clientData?.neighborhood || "",
    municipality: previousState.clientData?.municipality || "",
    state: previousState.clientData?.state || "",
    city: previousState.clientData?.city || "",
    postalCode: previousState.clientData?.postalCode || "",
    references: previousState.clientData?.references || "",
  });

  const [colonias, setColonias] = useState([]);
  const [postalCodeApiLoading, setPostalCodeApiLoading] = useState(false);
  const [postalCodeApiError, setPostalCodeApiError] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // DIPOMEX API Integration
  useEffect(() => {
    if (form.postalCode && form.postalCode.length === 5) {
      setPostalCodeApiLoading(true);
      setPostalCodeApiError('');
      setColonias([]);

      const loadPostalData = async () => {
        try {
            const data = await apiFetchPostalCode(form.postalCode);
            
            if (!data.error && data.codigo_postal) {
                const { municipio, estado, colonias: coloniasData } = data.codigo_postal;
                
                setForm(prev => ({
                    ...prev,
                    municipality: municipio,
                    state: estado,
                    city: `${municipio}, ${estado}`,
                    neighborhood: coloniasData.length === 1 ? coloniasData[0] : prev.neighborhood, 
                }));
                
                setColonias(coloniasData);
            } else {
                setPostalCodeApiError('Código postal no encontrado.');
            }
        } catch (err) {
            console.error("Error fetching postal code:", err);
            setPostalCodeApiError('Error al consultar el código postal.');
        } finally {
            setPostalCodeApiLoading(false);
        }
      };

      loadPostalData();
    } else if (form.postalCode.length > 0 && form.postalCode.length < 5) {
      setColonias([]);
    }
  }, [form.postalCode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleBack = () => {
    navigate("/pedidos/rellenar/entrega", {
      state: {
        ...previousState,
        deliveryMethod,
      },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!form.name || !form.phone || !form.street) {
      setError("Nombre, teléfono y calle son obligatorios.");
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        ...form,
        city: `${form.municipality}, ${form.state}`
      };
      
      const response = await apiClient.post('/register-client', payload);
      const newUser = response.data;

      navigate("/pedidos/rellenar/resumen", {
          state: {
            ...location.state,
            clientData: newUser,
          },
      });

    } catch(err) {
        console.error("Error creating new client:", err);
        setError(err.message || 'Ocurrió un error al registrar tus datos.');
    } finally {
        setIsSubmitting(false);
    }
  };

  const deliveryMethodLabels = {
      delivery: "Entrega a domicilio",
      home_collection: "Recolección a domicilio",
      pickup: "Recoger en mostrador"
  };

  return (
    <OrderLayout
      title="Datos de contacto y entrega"
      subtitle="Escribe tus datos para procesar tu pedido correctamente."
      step={3}
      totalSteps={4}
    >
      <div className="mx-auto max-w-3xl w-full">
        <form onSubmit={handleSubmit} className="space-y-10">
          
          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative animate-shake">{error}</div>}
          {postalCodeApiError && <div className="bg-orange-100 border border-orange-400 text-orange-700 px-4 py-3 rounded relative">{postalCodeApiError}</div>}

          {/* Info Banner */}
          <div className="rounded-2xl bg-white/50 dark:bg-dark/40 border border-primary/20 p-5 flex items-center gap-4 shadow-sm backdrop-blur-sm">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                <span className="material-symbols-outlined text-2xl">info</span>
            </div>
            <div>
                <p className="text-xs font-bold text-primary uppercase tracking-widest">Método Seleccionado</p>
                <p className="text-lg font-black text-dark dark:text-white">{deliveryMethodLabels[deliveryMethod] || "Entrega"}</p>
            </div>
          </div>

          {/* Personal Data Section */}
          <section className="space-y-6">
            <h2 className="text-xl font-bold text-dark dark:text-white flex items-center gap-2 border-b pb-3 dark:border-white/10">
                <span className="material-symbols-outlined text-primary">person</span> Información Personal
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-text-secondary dark:text-white/70">Nombre completo <span className="text-primary">*</span></label>
                    <input name="name" type="text" value={form.name} onChange={handleChange} placeholder="Ej: Juan Pérez" className="input-style" required />
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-text-secondary dark:text-white/70">Teléfono <span className="text-primary">*</span></label>
                    <input name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="Ej: 5512345678" className="input-style" required />
                </div>
            </div>
          </section>

          {/* Address Section */}
          <section className="space-y-6">
            <h2 className="text-xl font-bold text-dark dark:text-white flex items-center gap-2 border-b pb-3 dark:border-white/10">
                <span className="material-symbols-outlined text-primary">home</span> Dirección de Entrega
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 flex flex-col gap-2">
                    <label className="text-sm font-bold text-text-secondary dark:text-white/70">Código Postal</label>
                    <input type="text" name="postalCode" value={form.postalCode} onChange={handleChange} placeholder="01234" className="input-style" maxLength="5"/>
                    {postalCodeApiLoading && <p className="text-[10px] text-primary mt-1 animate-pulse font-black uppercase">Buscando...</p>}
                </div>
                <div className="md:col-span-2 flex flex-col gap-2">
                    <label className="text-sm font-bold text-text-secondary dark:text-white/70">Calle y Número <span className="text-primary">*</span></label>
                    <input type="text" name="street" value={form.street} onChange={handleChange} placeholder="Av. Principal 123" className="input-style" required />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-text-secondary dark:text-white/70">Colonia/Barrio</label>
                    {colonias.length > 0 ? (
                        <select name="neighborhood" value={form.neighborhood} onChange={handleChange} className="input-style">
                            <option value="">-- Selecciona --</option>
                            {colonias.map((col, idx) => (
                                <option key={`${idx}-${col}`} value={col}>{col}</option>
                            ))}
                        </select>
                    ) : (
                        <input type="text" name="neighborhood" value={form.neighborhood} onChange={handleChange} placeholder="Ej: Centro" className="input-style" />
                    )}
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-text-secondary dark:text-white/70">Municipio</label>
                    <input type="text" name="municipality" value={form.municipality} readOnly className="input-style bg-gray-100/50 dark:bg-dark/50 cursor-not-allowed" />
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-text-secondary dark:text-white/70">Estado</label>
                    <input type="text" name="state" value={form.state} readOnly className="input-style bg-gray-100/50 dark:bg-dark/50 cursor-not-allowed" />
                </div>
            </div>
          </section>

          {/* References */}
          <section className="space-y-6">
            <h2 className="text-xl font-bold text-dark dark:text-white flex items-center gap-2 border-b pb-3 dark:border-white/10">
                <span className="material-symbols-outlined text-primary">notes</span> Referencias
            </h2>
            <textarea name="references" rows={3} value={form.references} onChange={handleChange} placeholder="Ej: Portón negro, frente al parque..." className="input-style resize-none" />
          </section>

          <footer className="mt-12 flex flex-col-reverse sm:flex-row gap-4 justify-between items-center pb-10">
            <button
              type="button"
              onClick={handleBack}
              className="w-full sm:w-auto h-12 px-8 rounded-xl bg-slate-100 dark:bg-dark/60 text-dark dark:text-white font-bold hover:bg-slate-200 dark:hover:bg-dark/80 transition-all border border-slate-200 dark:border-white/10"
            >
              Volver
            </button>

            <button
              type="submit"
              disabled={isSubmitting || postalCodeApiLoading}
              className="w-full sm:w-auto h-14 px-12 rounded-xl bg-primary text-white font-black shadow-xl shadow-primary/20 hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
            >
              {isSubmitting ? 'Guardando...' : 'Confirmar y Continuar'}
            </button>
          </footer>
        </form>
      </div>
    </OrderLayout>
  );
};

export default PickupClientDataStep;