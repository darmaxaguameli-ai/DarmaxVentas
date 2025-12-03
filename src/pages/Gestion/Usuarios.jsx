import { useState, useEffect } from "react";
import { useGestion } from "./context/GestionContext";
import Swal from 'sweetalert2'; // Importar SweetAlert2

const UserRole = {
  ADMIN: "ADMIN",
  VENDEDOR: "VENDEDOR",
  REPARTIDOR: "REPARTIDOR",
  CLIENTE: "CLIENTE",
};

const UserModal = ({ onClose, userToEdit, onSave }) => {
  const initialUserState = {
    name: "",
    email: "",
    password: "",
    phone: "",
    street: "",
    neighborhood: "",
    city: "",
    postalCode: "",
    role: UserRole.CLIENTE,
  };

  // ✅ Inicializamos el estado desde userToEdit una sola vez al montar
  const [user, setUser] = useState(() =>
    userToEdit ? { ...userToEdit, password: "" } : initialUserState
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const userData = { ...user };

    // No mandar password vacía en edición
    if (!userData.password) {
      delete userData.password;
    }

    // Convert empty phone string to null to avoid unique constraint violation
    if (userData.phone === "") {
      userData.phone = null;
    }
    // Convert empty email string to null
    if (userData.email === "") {
      userData.email = null;
    }
    // Convert empty address fields to null
    if (userData.street === "") {
      userData.street = null;
    }
    if (userData.neighborhood === "") {
      userData.neighborhood = null;
    }
    if (userData.city === "") {
      userData.city = null;
    }
    if (userData.postalCode === "") {
      userData.postalCode = null;
    }


    onSave(userData);
    onClose();
  };

  const isEditing = !!userToEdit;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-6 text-[#111418] dark:text-white">
          {isEditing ? "Editar Usuario" : "Agregar Nuevo Usuario"}
        </h2>
        <form
          onSubmit={handleSubmit}
          className="space-y-4 max-h-[80vh] overflow-y-auto pr-2"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-style">Nombre Completo</label>
              <input
                name="name"
                type="text"
                value={user.name || ""}
                onChange={handleChange}
                required
                className="input-style"
              />
            </div>
            <div>
              <label className="label-style">Rol</label>
              <select
                name="role"
                value={user.role || UserRole.CLIENTE}
                onChange={handleChange}
                className="input-style"
              >
                {Object.values(UserRole).map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-style">Email</label>
              <input
                name="email"
                type="email"
                value={user.email || ""}
                onChange={handleChange}
                className="input-style"
              />
            </div>
            <div>
              <label className="label-style">Teléfono</label>
              <input
                name="phone"
                type="tel"
                value={user.phone || ""}
                onChange={handleChange}
                className="input-style"
              />
            </div>
          </div>

          {!isEditing && (
            <div>
              <label className="label-style">Contraseña</label>
              <input
                name="password"
                type="password"
                value={user.password}
                onChange={handleChange}
                required
                className="input-style"
              />
            </div>
          )}

          <hr className="my-4 border-gray-200 dark:border-gray-700" />
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">
            Dirección
          </h3>

          <div>
            <label className="label-style">Calle y Número</label>
            <input
              name="street"
              type="text"
              value={user.street || ""}
              onChange={handleChange}
              className="input-style"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-style">Colonia/Barrio</label>
              <input
                name="neighborhood"
                type="text"
                value={user.neighborhood || ""}
                onChange={handleChange}
                className="input-style"
              />
            </div>
            <div>
              <label className="label-style">Ciudad</label>
              <input
                name="city"
                type="text"
                value={user.city || ""}
                onChange={handleChange}
                className="input-style"
              />
            </div>
          </div>

          <div>
            <label className="label-style">Código Postal</label>
            <input
              name="postalCode"
              type="text"
              value={user.postalCode || ""}
              onChange={handleChange}
              className="input-style"
            />
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Usuarios = () => {
  const { state, addUser, updateUser, deleteUser } = useGestion();
  const { users, loading, error } = state;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);

  const handleOpenModal = (user = null) => {
    setUserToEdit(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setUserToEdit(null);
    setIsModalOpen(false);
  };

  const handleSaveUser = (user) => {
    if (user.id) {
      updateUser(user); // edición
    } else {
      addUser(user); // creación
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: '¡No podrás revertir esto!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      deleteUser(id);
    }
  };

  const RoleBadge = ({ role }) => {
    const roleStyles = {
      ADMIN:
        "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      VENDEDOR:
        "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      REPARTIDOR:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      CLIENTE:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    };
    return (
      <span
        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
          roleStyles[role] || ""
        }`}
      >
        {role}
      </span>
    );
  };

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-[#111418] dark:text-white">
          Gestión de Usuarios
        </h1>
        <button onClick={() => handleOpenModal()} className="btn-primary">
          Agregar Usuario
        </button>
      </div>

      {/* ✅ Ahora el modal solo se monta cuando isModalOpen es true */}
      {isModalOpen && (
        <UserModal
          onClose={handleCloseModal}
          onSave={handleSaveUser}
          userToEdit={userToEdit}
        />
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="th-style">ID</th>
              <th className="th-style">Nombre</th>
              <th className="th-style">Email</th>
              <th className="th-style">Teléfono</th>
              <th className="th-style">Rol</th>
              <th className="th-style text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <tr>
                <td
                  colSpan="6"
                  className="p-6 text-center text-gray-500 dark:text-gray-400"
                >
                  Cargando usuarios...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="6" className="p-6 text-center text-red-500">
                  Error al cargar usuarios: {error}
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  className="p-6 text-center text-gray-500 dark:text-gray-400"
                >
                  No hay usuarios registrados.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td className="td-style font-mono text-xs">
                    {user.customId}
                  </td>
                  <td className="td-style font-medium">{user.name}</td>
                  <td className="td-style">{user.email || "N/A"}</td>
                  <td className="td-style">{user.phone || "N/A"}</td>
                  <td className="td-style">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="td-style text-right space-x-4">
                    <button
                      onClick={() => handleOpenModal(user)}
                      className="text-primary hover:text-primary/90 font-medium"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="text-red-500 hover:text-red-700 font-medium"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Usuarios;
