import { Link } from "react-router-dom";
import { useState } from "react";

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aquí luego conectarás tu lógica de registro (API, etc.)
    console.log("Submit registro");
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-light dark:bg-dark px-4 sm:px-6 lg:px-8 font-display">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-primary mb-4">
            <span className="material-symbols-outlined text-3xl">
              water_drop
            </span>
          </div>
          <h1 className="text-3xl font-black text-dark dark:text-white tracking-tight">
            Crea tu cuenta para empezar
          </h1>
          <p className="mt-2 text-base text-text-secondary dark:text-gray-400">
            Regístrate para pedir agua de forma rápida y sencilla.
          </p>
        </div>

        {/* Form Container */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark p-6 sm:p-8 shadow-sm">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Nombre y Apellido */}
            <div className="flex flex-col gap-5 sm:flex-row">
              <label className="flex flex-1 flex-col">
                <p className="pb-2 text-sm font-medium text-dark dark:text-gray-200">
                  Nombre
                </p>
                <input
                  type="text"
                  placeholder="Introduce tu nombre"
                  className="form-input h-12 w-full flex-1 resize-none overflow-hidden rounded-lg border border-[#dbe0e6] bg-white p-3 text-base font-normal leading-normal text-dark placeholder:text-text-secondary focus:border-primary focus:outline-0 focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-primary"
                />
              </label>

              <label className="flex flex-1 flex-col">
                <p className="pb-2 text-sm font-medium text-dark dark:text-gray-200">
                  Apellido
                </p>
                <input
                  type="text"
                  placeholder="Introduce tu apellido"
                  className="form-input h-12 w-full flex-1 resize-none overflow-hidden rounded-lg border border-[#dbe0e6] bg-white p-3 text-base font-normal leading-normal text-dark placeholder:text-text-secondary focus:border-primary focus:outline-0 focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-primary"
                />
              </label>
            </div>

            {/* Correo */}
            <label className="flex flex-col">
              <p className="pb-2 text-sm font-medium text-dark dark:text-gray-200">
                Correo Electrónico
              </p>
              <input
                type="email"
                placeholder="tu@correo.com"
                className="form-input h-12 w-full flex-1 resize-none overflow-hidden rounded-lg border border-[#dbe0e6] bg-white p-3 text-base font-normal leading-normal text-dark placeholder:text-text-secondary focus:border-primary focus:outline-0 focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-primary"
              />
            </label>

            {/* Contraseña */}
            <label className="flex flex-col">
              <p className="pb-2 text-sm font-medium text-dark dark:text-gray-200">
                Contraseña
              </p>
              <div className="relative flex w-full items-center">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Crea una contraseña segura"
                  className="form-input h-12 w-full flex-1 resize-none overflow-hidden rounded-lg border border-[#dbe0e6] bg-white p-3 pr-10 text-base font-normal leading-normal text-dark placeholder:text-text-secondary focus:border-primary focus:outline-0 focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 text-text-secondary dark:text-gray-400"
                >
                  <span className="material-symbols-outlined">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </label>

            {/* Confirmar contraseña */}
            <label className="flex flex-col">
              <p className="pb-2 text-sm font-medium text-dark dark:text-gray-200">
                Confirmar Contraseña
              </p>
              <div className="relative flex w-full items-center">
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirma tu contraseña"
                  className="form-input h-12 w-full flex-1 resize-none overflow-hidden rounded-lg border border-[#dbe0e6] bg-white p-3 pr-10 text-base font-normal leading-normal text-dark placeholder:text-text-secondary focus:border-primary focus:outline-0 focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((prev) => !prev)}
                  className="absolute right-3 text-text-secondary dark:text-gray-400"
                >
                  <span className="material-symbols-outlined">
                    {showConfirm ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </label>

            {/* Términos */}
            <div className="flex items-start">
              <input
                id="terms"
                type="checkbox"
                className="form-checkbox mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:ring-offset-dark"
              />
              <label
                htmlFor="terms"
                className="ml-2 text-sm text-text-secondary dark:text-gray-400"
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
            <button
              type="submit"
              className="flex h-12 w-full items-center justify-center rounded-lg bg-primary px-6 text-base font-semibold text-white shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              Registrarse
            </button>
          </form>
        </div>

        {/* Link secundario */}
        <div className="mt-6 text-center">
        <p className="text-sm text-text-secondary dark:text-gray-400">
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
    </div>
  );
};

export default Register;
