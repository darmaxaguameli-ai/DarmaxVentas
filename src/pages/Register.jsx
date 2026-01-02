// src/pages/Register.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import axios from "axios";
import Button from "../components/common/Button";
import Swal from 'sweetalert2'; // Import SweetAlert2

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate(); // Initialize useNavigate

  // Form data state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // State for existing user check
  const [searchIdentifier, setSearchIdentifier] = useState(""); // Can be customId or phone
  const [searchType, setSearchType] = useState("customId"); // 'customId' or 'phone'
  const [existingUserFound, setExistingUserFound] = useState(false);
  const [existingUserData, setExistingUserData] = useState(null);
  const [foundUserHasPassword, setFoundUserHasPassword] = useState(false); // New state
  const [searchError, setSearchError] = useState("");
  const [registrationError, setRegistrationError] = useState(""); // New state for registration errors

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCustomIdChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, ""); // Only allow numbers
    setSearchIdentifier(value);
  };

  const handlePhoneChange = (e) => {
    setSearchIdentifier(e.target.value.replace(/[^0-9]/g, "")); // Only allow numbers
  };

  const checkExistingUser = async () => {
    setSearchError("");
    setExistingUserFound(false);
    setExistingUserData(null);
    setFoundUserHasPassword(false); // Reset new state
    setRegistrationError(""); // Clear registration errors

    if (!searchIdentifier) {
      setSearchError("Por favor, introduce un identificador.");
      return;
    }

    let identifierForApi = searchIdentifier;
    if (searchType === "customId") {
      identifierForApi = "CLI-" + searchIdentifier;
    }

    try {
      const response = await axios.get(`/api/users/check`, {
        params: {
          identifier: identifierForApi,
          type: searchType,
        },
      });

      const foundUser = response.data;
      setExistingUserFound(true);
      setExistingUserData(foundUser);
      setFoundUserHasPassword(foundUser.hasPassword); // Set new state
      setFormData((prev) => ({
        ...prev,
        name: foundUser.name,
        email: foundUser.email,
      }));
    } catch (error) {
      console.error("Error checking user:", error);
      if (error.response && error.response.status === 404) {
        setSearchError("No se encontró ningún usuario con ese identificador.");
      } else {
        setSearchError("Ocurrió un error al verificar el usuario. Intenta de nuevo.");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setRegistrationError(""); // Clear previous errors

    // Client-side validation
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setRegistrationError("Por favor, completa todos los campos obligatorios.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setRegistrationError("Las contraseñas no coinciden.");
      return;
    }

    if (formData.password.length < 6) { // Example minimum length
      setRegistrationError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

          try {
            // Si el usuario ya existe, actualizamos su registro (completar perfil)
            if (existingUserFound) {
                if (!existingUserData || !existingUserData.id) {
                    setRegistrationError("Error interno: No se pudo identificar al usuario para actualizar.");
                    return;
                }

                // Usamos el endpoint especial para completar registro sin token
                const updateResponse = await axios.post(`/api/complete-registration`, {
                    userId: existingUserData.id,
                    name: formData.name,
                    email: formData.email,
                    password: formData.password, 
                });

                console.log("Registro completado:", updateResponse.data);
                Swal.fire({
                    title: '¡Éxito!',
                    text: 'Registro completado con éxito. Ahora puedes iniciar sesión.',
                    icon: 'success',
                    confirmButtonColor: '#3085d6',
                    confirmButtonText: 'Ir al Login'
                });
                navigate("/login");
                return;
            }

            // Si es un usuario totalmente nuevo, usamos POST
            const dataToSend = {
              name: formData.name,
              email: formData.email,
              password: formData.password,
              role: "CLIENTE",
            };
    
            const response = await axios.post("/api/users", dataToSend);
            console.log("Registro exitoso:", response.data);
            Swal.fire({
                title: '¡Bienvenido!',
                text: 'Registro exitoso. Ahora puedes iniciar sesión.',
                icon: 'success',
                confirmButtonColor: '#3085d6',
                confirmButtonText: 'Ir al Login'
            });
            navigate("/login"); 
          } catch (error) {      console.error("Error en el registro:", error);
      if (error.response && error.response.data && error.response.data.message) {
        setRegistrationError(error.response.data.message);
      } else {
        setRegistrationError("Ocurrió un error inesperado durante el registro.");
      }
    }
  };

  return (
    <MainLayout>
      <div className="w-full max-w-md mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary mb-4">
            <span className="material-symbols-outlined text-3xl">
              water_drop
            </span>
          </div>
          <h1 className="text-3xl font-black text-dark dark:text-white tracking-tight">
            Crea tu cuenta para empezar
          </h1>
          <p className="mt-2 text-base text-text-secondary dark:text-white/70">
            Regístrate para pedir agua de forma rápida y sencilla.
          </p>
        </div>

        {/* Card del formulario */}
        <div className="rounded-2xl border border-light/60 dark:border-white/10 bg-white/90 dark:bg-dark/40 p-6 sm:p-8 shadow-xl backdrop-blur-xl">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Existing User Check Section */}
            {!existingUserFound && (
              <div className="space-y-4 p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                <p className="text-sm font-medium text-dark dark:text-white">
                  ¿Ya eres cliente? Ingresa tu identificador o teléfono para autocompletar tus datos.
                </p>
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setSearchType("customId")}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                      searchType === "customId"
                        ? "bg-primary text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                    }`}
                  >
                    ID Cliente
                  </button>
                  <button
                    type="button"
                    onClick={() => setSearchType("phone")}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                      searchType === "phone"
                        ? "bg-primary text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                    }`}
                  >
                    Teléfono
                  </button>
                </div>

                {searchType === "customId" && (
                  <label className="flex flex-col">
                    <p className="pb-2 text-sm font-medium text-dark dark:text-white">
                      Identificador de Cliente
                    </p>
                    <div className="flex items-center h-12 w-full rounded-lg border border-light bg-white px-3 text-base text-dark
                                  focus-within:border-primary focus-within:outline-0 focus-within:ring-2 focus-within:ring-primary/20
                                  dark:border-white/10 dark:bg-dark dark:text-white">
                      <span className="text-text-secondary dark:text-white/50 mr-1">CLI-</span>
                      <input
                        type="text"
                        value={searchIdentifier}
                        onChange={handleCustomIdChange}
                        placeholder="12345"
                        className="flex-1 bg-transparent outline-none text-dark dark:text-white placeholder:text-text-secondary dark:placeholder:text-white/50"
                      />
                    </div>
                  </label>
                )}

                {searchType === "phone" && (
                  <label className="flex flex-col">
                    <p className="pb-2 text-sm font-medium text-dark dark:text-white">
                      Número de Teléfono
                    </p>
                    <input
                      type="tel"
                      value={searchIdentifier}
                      onChange={handlePhoneChange}
                      placeholder="Ej. 5512345678"
                      className="h-12 w-full rounded-lg border border-light bg-white px-3 text-base text-dark
                                 placeholder:text-text-secondary
                                 focus:border-primary focus:outline-0 focus:ring-2 focus:ring-primary/20
                                 dark:border-white/10 dark:bg-dark dark:text-white dark:placeholder:text-white/50"
                    />
                  </label>
                )}
                {searchError && <p className="text-red-500 text-sm">{searchError}</p>}
                <Button
                  type="button"
                  onClick={checkExistingUser}
                  variant="secondary"
                >
                  Buscar Cliente
                </Button>
              </div>
            )}

            {/* Full Registration Form (conditionally rendered) */}
            {(existingUserFound || !searchIdentifier) && (
              <>
                {existingUserFound && foundUserHasPassword ? (
                  <div className="text-center space-y-4">
                    <p className="text-lg font-medium text-dark dark:text-white">
                      ¡Ya estás registrado!
                    </p>
                    <p className="text-base text-text-secondary dark:text-white/70">
                      Por favor,{" "}
                      <Link
                        to="/login"
                        className="font-semibold text-primary hover:underline"
                      >
                        inicia sesión
                      </Link>{" "}
                      con tu correo electrónico y contraseña.
                    </p>
                    <Button
                      type="button"
                      onClick={() => {
                        setExistingUserFound(false);
                        setExistingUserData(null);
                        setFoundUserHasPassword(false);
                        setSearchIdentifier("");
                        setSearchError("");
                        setRegistrationError("");
                        setFormData({ name: "", email: "", password: "", confirmPassword: "" });
                      }}
                      variant="secondary"
                      className="mt-4"
                    >
                      Registrar un nuevo usuario
                    </Button>
                  </div>
                ) : (
                  <>
                    {existingUserFound && !foundUserHasPassword && (
                      <p className="text-center text-lg font-medium text-dark dark:text-white mb-4">
                        Hemos encontrado tu cuenta. Por favor, crea una contraseña para completar tu registro.
                      </p>
                    )}

                    {/* Nombre */}
                    <label className="flex flex-col">
                      <p className="pb-2 text-sm font-medium text-dark dark:text-white">
                        Nombre Completo
                      </p>
                      <input
                        type="text"
                        name="name"
                        value={formData.name || ""}
                        onChange={handleChange}
                        placeholder="Introduce tu nombre completo"
                        className="h-12 w-full rounded-lg border border-light bg-white px-3 text-base text-dark
                                   placeholder:text-text-secondary
                                   focus:border-primary focus:outline-0 focus:ring-2 focus:ring-primary/20
                                   dark:border-white/10 dark:bg-dark dark:text-white dark:placeholder:text-white/50"
                        required
                        readOnly={!!existingUserData && !!existingUserData.name} // Only read-only if name is already present
                      />
                    </label>

                    {/* Correo */}
                    <label className="flex flex-col">
                      <p className="pb-2 text-sm font-medium text-dark dark:text-white">
                        Correo electrónico
                      </p>
                      <input
                        type="email"
                        name="email"
                        value={formData.email || ""}
                        onChange={handleChange}
                        placeholder="tu@correo.com"
                        className="h-12 w-full rounded-lg border border-light bg-white px-3 text-base text-dark
                                   placeholder:text-text-secondary
                                   focus:border-primary focus:outline-0 focus:ring-2 focus:ring-primary/20
                                   dark:border-white/10 dark:bg-dark dark:text-white dark:placeholder:text-white/50"
                        required
                        readOnly={!!existingUserData && !!existingUserData.email} // Only read-only if email is already present
                      />
                    </label>

                    {/* Contraseña */}
                    <label className="flex flex-col">
                      <p className="pb-2 text-sm font-medium text-dark dark:text-white">
                        Contraseña
                      </p>
                      <div className="relative flex w-full items-center">
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="Crea una contraseña segura"
                          className="h-12 w-full rounded-lg border border-light bg-white px-3 pr-10 text-base text-dark
                                     placeholder:text-text-secondary
                                     focus:border-primary focus:outline-0 focus:ring-2 focus:ring-primary/20
                                     dark:border-white/10 dark:bg-dark dark:text-white dark:placeholder:text-white/50"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="absolute right-3 text-text-secondary dark:text-white/60"
                        >
                          <span className="material-symbols-outlined">
                            {showPassword ? "visibility_off" : "visibility"}
                          </span>
                        </button>
                      </div>
                    </label>

                    {/* Confirmar contraseña */}
                    <label className="flex flex-col">
                      <p className="pb-2 text-sm font-medium text-dark dark:text-white">
                        Confirmar contraseña
                      </p>
                      <div className="relative flex w-full items-center">
                        <input
                          type={showConfirm ? "text" : "password"}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          placeholder="Confirma tu contraseña"
                          className="h-12 w-full rounded-lg border border-light bg-white px-3 pr-10 text-base text-dark
                                     placeholder:text-text-secondary
                                     focus:border-primary focus:outline-0 focus:ring-2 focus:ring-primary/20
                                     dark:border-white/10 dark:bg-dark dark:text-white dark:placeholder:text-white/50"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm((prev) => !prev)}
                          className="absolute right-3 text-text-secondary dark:text-white/60"
                        >
                          <span className="material-symbols-outlined">
                            {showConfirm ? "visibility_off" : "visibility"}
                          </span>
                        </button>
                      </div>
                    </label>

                    {registrationError && (
                      <p className="text-red-500 text-sm text-center">{registrationError}</p>
                    )}

                    {/* Términos */}
                    <div className="flex items-start">
                      <input
                        id="terms"
                        type="checkbox"
                        className="form-checkbox mt-0.5 h-4 w-4 rounded border-light text-primary
                                   focus:ring-primary dark:border-white/30 dark:bg-dark"
                        required
                      />
                      <label
                        htmlFor="terms"
                        className="ml-2 text-sm text-text-secondary dark:text-white/70"
                      >
                        Acepto los{" "}
                        <a href="#" className="font-medium text-primary hover:underline">
                          Términos y Condiciones
                        </a>{" "}
                        y la{" "}
                        <a href="#" className="font-medium text-primary hover:underline">
                          Política de Privacidad
                        </a>
                        .
                      </label>
                    </div>

                    {/* Botón submit */}
                    <Button
                      type="submit"
                    >
                      Registrarse
                    </Button>
                  </>
                )}
              </>
            )}
          </form>
        </div>

        {/* Link secundario */}
        <div className="mt-6 text-center">
          <p className="text-sm text-text-secondary dark:text-white/70">
            ¿Ya tienes una cuenta?{" "}
            <Link
              to="/login"
              className="font-semibold text-primary hover:underline"
            >
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </MainLayout>
  );
};

export default Register;
