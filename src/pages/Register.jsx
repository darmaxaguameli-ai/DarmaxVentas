// src/pages/Register.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aquí luego conectarás tu lógica de registro (API, etc.)
    console.log("Submit registro");
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
            {/* Nombre y Apellido */}
            <div className="flex flex-col gap-5 sm:flex-row">
              <label className="flex flex-1 flex-col">
                <p className="pb-2 text-sm font-medium text-dark dark:text-white">
                  Nombre
                </p>
                <input
                  type="text"
                  placeholder="Introduce tu nombre"
                  className="h-12 w-full rounded-lg border border-light bg-white px-3 text-base text-dark
                             placeholder:text-text-secondary
                             focus:border-primary focus:outline-0 focus:ring-2 focus:ring-primary/20
                             dark:border-white/10 dark:bg-dark dark:text-white dark:placeholder:text-white/50"
                  required
                />
              </label>

              <label className="flex flex-1 flex-col">
                <p className="pb-2 text-sm font-medium text-dark dark:text-white">
                  Apellido
                </p>
                <input
                  type="text"
                  placeholder="Introduce tu apellido"
                  className="h-12 w-full rounded-lg border border-light bg-white px-3 text-base text-dark
                             placeholder:text-text-secondary
                             focus:border-primary focus:outline-0 focus:ring-2 focus:ring-primary/20
                             dark:border-white/10 dark:bg-dark dark:text-white dark:placeholder:text-white/50"
                  required
                />
              </label>
            </div>

            {/* Correo */}
            <label className="flex flex-col">
              <p className="pb-2 text-sm font-medium text-dark dark:text-white">
                Correo electrónico
              </p>
              <input
                type="email"
                placeholder="tu@correo.com"
                className="h-12 w-full rounded-lg border border-light bg-white px-3 text-base text-dark
                           placeholder:text-text-secondary
                           focus:border-primary focus:outline-0 focus:ring-2 focus:ring-primary/20
                           dark:border-white/10 dark:bg-dark dark:text-white dark:placeholder:text-white/50"
                required
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
            <button
              type="submit"
              className="flex h-12 w-full items-center justify-center rounded-lg bg-primary px-6 
                         text-base font-semibold text-white shadow-sm hover:bg-primary/90 
                         focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary
                         disabled:cursor-not-allowed disabled:opacity-50"
            >
              Registrarse
            </button>
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
