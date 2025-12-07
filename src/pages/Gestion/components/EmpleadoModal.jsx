import { useState } from "react";

const EmpleadoModal = ({ onClose, empleadoToEdit, onSave, empleados = [] }) => {
  const initialEmpleadoState = {
    nombreCompleto: "",
    puesto: "",
    sueldo: 0,
    telefono: "",
    emailPersonal: "",
    street: "",
    neighborhood: "",
    city: "",
    postalCode: "",
    fechaContratacion: new Date().toISOString().split('T')[0],
    estatus: "ACTIVO",
    userId: null,
    managerId: null,
  };

  const [empleado, setEmpleado] = useState(() =>
    empleadoToEdit
      ? {
          ...empleadoToEdit,
          fechaContratacion: new Date(empleadoToEdit.fechaContratacion).toISOString().split('T')[0],
          sueldo: parseFloat(empleadoToEdit.sueldo || 0),
          managerId: empleadoToEdit.managerId || null,
        }
      : initialEmpleadoState
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEmpleado((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const empleadoData = { ...empleado };

    empleadoData.sueldo = parseFloat(empleadoData.sueldo);
    
    // Handle nullable fields
    const fieldsToNullify = ['telefono', 'emailPersonal', 'street', 'neighborhood', 'city', 'postalCode', 'managerId'];
    fieldsToNullify.forEach(field => {
      if (empleadoData[field] === "") {
        empleadoData[field] = null;
      }
    });

    onSave(empleadoData);
    onClose();
  };

  const isEditing = !!empleadoToEdit;
  const potentialManagers = empleados.filter(e => e.id !== empleadoToEdit?.id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-6 text-[#111418] dark:text-white">
          {isEditing ? "Editar Empleado" : "Agregar Nuevo Empleado"}
        </h2>
        <form
          onSubmit={handleSubmit}
          className="space-y-4 max-h-[80vh] overflow-y-auto pr-2"
        >
          {/* ... other form fields ... */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-style">Nombre Completo</label>
              <input name="nombreCompleto" type="text" value={empleado.nombreCompleto || ""} onChange={handleChange} required className="input-style" />
            </div>
            <div>
              <label className="label-style">Puesto</label>
              <input name="puesto" type="text" value={empleado.puesto || ""} onChange={handleChange} required className="input-style" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-style">Sueldo Actual</label>
              <input name="sueldo" type="number" step="0.01" value={empleado.sueldo} onChange={handleChange} required className="input-style" />
            </div>
            <div>
              <label className="label-style">Fecha de Contratación</label>
              <input name="fechaContratacion" type="date" value={empleado.fechaContratacion} onChange={handleChange} required className="input-style" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-style">Email Personal</label>
              <input name="emailPersonal" type="email" value={empleado.emailPersonal || ""} onChange={handleChange} className="input-style" />
            </div>
            <div>
              <label className="label-style">Teléfono</label>
              <input name="telefono" type="tel" value={empleado.telefono || ""} onChange={handleChange} className="input-style" />
            </div>
          </div>

          <div>
            <label className="label-style">Estatus</label>
            <select name="estatus" value={empleado.estatus} onChange={handleChange} className="input-style">
              <option value="ACTIVO">ACTIVO</option>
              <option value="INACTIVO">INACTIVO</option>
            </select>
          </div>

          <div>
            <label className="label-style">Jefe Inmediato (Opcional)</label>
            <select name="managerId" value={empleado.managerId || ""} onChange={handleChange} className="input-style">
              <option value="">Ninguno</option>
              {potentialManagers.map((manager) => (
                <option key={manager.id} value={manager.id}>
                  {manager.nombreCompleto}
                </option>
              ))}
            </select>
          </div>

          <hr className="my-4 border-gray-200 dark:border-gray-700" />
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">Dirección</h3>

          <div>
            <label className="label-style">Calle y Número</label>
            <input name="street" type="text" value={empleado.street || ""} onChange={handleChange} className="input-style" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-style">Colonia/Barrio</label>
              <input name="neighborhood" type="text" value={empleado.neighborhood || ""} onChange={handleChange} className="input-style" />
            </div>
            <div>
              <label className="label-style">Ciudad</label>
              <input name="city" type="text" value={empleado.city || ""} onChange={handleChange} className="input-style" />
            </div>
          </div>

          <div>
            <label className="label-style">Código Postal</label>
            <input name="postalCode" type="text" value={empleado.postalCode || ""} onChange={handleChange} className="input-style" />
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmpleadoModal;
