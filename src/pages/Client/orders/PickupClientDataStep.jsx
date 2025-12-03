// src/pages/cliente/orders/PickupClientDataStep.jsx
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import OrderLayout from "../../../layouts/OrderLayout";
import apiClient from "../../../api/apiClient"; // Importar apiClient

const PickupClientDataStep = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const previousState = location.state || {};
  const deliveryMethod = previousState.deliveryMethod || "collect";

  const [form, setForm] = useState({
    name: previousState.clientData?.name || "",
    phone: previousState.clientData?.phone || "",
    street: previousState.clientData?.street || "",
    neighborhood: previousState.clientData?.neighborhood || "",
    city: previousState.clientData?.city || "",
    postalCode: previousState.clientData?.postalCode || "",
    references: previousState.clientData?.references || "",
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        name: form.name,
        phone: form.phone,
        street: form.street,
        neighborhood: form.neighborhood,
        city: form.city,
        postalCode: form.postalCode,
        references: form.references
      };
      
      const response = await apiClient.post('/register-client', payload);
      const newUser = response.data;

      navigate("/pedidos/rellenar/datos-confirmados", {
          state: {
            ...location.state,
            clientData: newUser, // Pasar el objeto de usuario completo
          },
      });

    } catch(err) {
        console.error("Error creating new client:", err);
        setError(err.message || 'Ocurrió un error al registrar tus datos.');
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <OrderLayout
      title="Datos para recolección a domicilio"
      subtitle="Escribe tus datos para que el repartidor encuentre tu domicilio sin problemas."
      step={3}
      totalSteps={4}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <div className="text-red-500 bg-red-100 p-3 rounded-lg">{error}</div>}
        {/* ... (resto del formulario sin cambios) ... */}
        <div className="rounded-xl bg-light/70 dark:bg-dark/70 border border-light/60 dark:border-white/15 p-4">
          <p className="text-sm font-semibold text-text-secondary dark:text-white/70 uppercase tracking-[0.08em] mb-1">
            Método seleccionado
          </p>
          <p className="text-base sm:text-lg font-bold text-dark dark:text-white">
            Recolección a domicilio
          </p>
          <p className="text-sm sm:text-base text-text-secondary dark:text-white/70 mt-1">
            Pasaremos a tu casa por los garrafones vacíos y te los regresamos rellenos.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="fullName"
            className="text-base sm:text-lg font-semibold text-dark dark:text-white"
          >
            Nombre completo <span className="text-primary">*</span>
          </label>
          <input
            id="fullName"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            placeholder="Ejemplo: Juan Pérez Hernández"
            className="h-12 rounded-lg border border-light/70 dark:border-white/20 bg-white dark:bg-dark px-3 text-base sm:text-lg text-dark dark:text-white placeholder:text-text-secondary dark:placeholder:text-white/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        
        <div className="flex flex-col gap-2">
          <label
            htmlFor="phone"
            className="text-base sm:text-lg font-semibold text-dark dark:text-white"
          >
            Teléfono de contacto <span className="text-primary">*</span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            placeholder="Ejemplo: 55 1234 5678"
            className="h-12 rounded-lg border border-light/70 dark:border-white/20 bg-white dark:bg-dark px-3 text-base sm:text-lg text-dark dark:text-white placeholder:text-text-secondary dark:placeholder:text-white/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="street"
            className="text-base sm:text-lg font-semibold text-dark dark:text-white"
          >
            Calle y número <span className="text-primary">*</span>
          </label>
          <input
            id="street"
            name="street"
            type="text"
            value={form.street}
            onChange={handleChange}
            placeholder="Ejemplo: Av. Siempre Viva 742"
            className="h-12 rounded-lg border border-light/70 dark:border-white/20 bg-white dark:bg-dark px-3 text-base sm:text-lg text-dark dark:text-white placeholder:text-text-secondary dark:placeholder:text-white/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="neighborhood"
              className="text-base sm:text-lg font-semibold text-dark dark:text-white"
            >
              Colonia
            </label>
            <input
              id="neighborhood"
              name="neighborhood"
              type="text"
              value={form.neighborhood}
              onChange={handleChange}
              placeholder="Ejemplo: Bosques de Aragón"
              className="h-12 rounded-lg border border-light/70 dark:border-white/20 bg-white dark:bg-dark px-3 text-base sm:text-lg text-dark dark:text-white placeholder:text-text-secondary dark:placeholder:text-white/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="city"
              className="text-base sm:text-lg font-semibold text-dark dark:text-white"
            >
              Ciudad
            </label>
            <input
              id="city"
              name="city"
              type="text"
              value={form.city}
              onChange={handleChange}
              placeholder="Ejemplo: Nezahualcóyotl"
              className="h-12 rounded-lg border border-light/70 dark:border-white/20 bg-white dark:bg-dark px-3 text-base sm:text-lg text-dark dark:text-white placeholder:text-text-secondary dark:placeholder:text-white/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="postalCode"
            className="text-base sm:text-lg font-semibold text-dark dark:text-white"
          >
            Código postal
          </label>
          <input
            id="postalCode"
            name="postalCode"
            type="text"
            value={form.postalCode}
            onChange={handleChange}
            placeholder="Ejemplo: 57170"
            className="h-12 rounded-lg border border-light/70 dark:border-white/20 bg-white dark:bg-dark px-3 text-base sm:text-lg text-dark dark:text-white placeholder:text-text-secondary dark:placeholder:text-white/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="references"
            className="text-base sm:text-lg font-semibold text-dark dark:text-white"
          >
            Referencias para el repartidor
          </label>
          <textarea
            id="references"
            name="references"
            rows={3}
            value={form.references}
            onChange={handleChange}
            placeholder="Ejemplo: Portón negro, al lado de una tienda OXXO, timbre azul."
            className="rounded-lg border border-light/70 dark:border-white/20 bg-white dark:bg-dark px-3 py-2 text-base sm:text-lg text-dark dark:text-white placeholder:text-text-secondary dark:placeholder:text-white/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
          />
        </div>

        <div className="mt-4 flex flex-col-reverse sm:flex-row gap-4 justify-between">
          <button
            type="button"
            onClick={handleBack}
            className="w-full sm:w-auto h-12 sm:h-14 rounded-lg bg-light text-dark dark:bg-dark dark:text-white text-base sm:text-lg font-semibold px-6 sm:px-8 hover:bg-light/80 dark:hover:bg-dark/80 transition-all"
          >
            Volver
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto h-12 sm:h-14 rounded-lg bg-primary px-8 text-base sm:text-lg font-semibold text-white shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isSubmitting ? 'Guardando...' : 'Continuar al resumen'}
          </button>
        </div>
      </form>
    </OrderLayout>
  );
};

export default PickupClientDataStep;
