// src/pages/Login.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (!email || !password) {
        throw new Error("Campos vacíos");
      }

      // 🔐 Aquí luego irá tu login real (API + Prisma)
      if (email === "admin@darmax.com") {
        navigate("/gestion");
      } else if (email === "driver@darmax.com") {
        navigate("/repartidor");
      } else {
        navigate("/");
      }
    } catch (err) {
      console.error(err);
      setError("No se pudo iniciar sesión. Verifica tus credenciales.");
    }
  };

  return (
    <MainLayout>
      <div className="w-full max-w-md mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary mb-4">
            <span className="material-symbols-outlined text-3xl">
              login
            </span>
          </div>
          <h1 className="text-3xl font-black text-dark dark:text-white tracking-tight">
            Inicia sesión en DARMAX
          </h1>
          <p className="mt-2 text-base text-text-secondary dark:text-white/70">
            Accede para gestionar tus pedidos de agua de forma rápida y sencilla.
          </p>
        </div>

        {/* Card del formulario */}
        <div className="rounded-2xl border border-light/60 dark:border-white/10 bg-white/90 dark:bg-dark/40 p-6 sm:p-8 shadow-xl backdrop-blur-xl">
          <form className="space-y-5" onSubmit={handleSubmit}>
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                  placeholder="Introduce tu contraseña"
                  className="h-12 w-full rounded-lg border border-light bg-white px-3 pr-10 text-base text-dark 
                             placeholder:text-text-secondary
                             focus:border-primary focus:outline-0 focus:ring-2 focus:ring-primary/20
                             dark:border-white/10 dark:bg-dark dark:text-white dark:placeholder:text-white/50"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            {/* Error */}
            {error && (
              <div className="text-error text-sm text-center">
                {error}
              </div>
            )}

            {/* Recordarme */}
            <div className="flex items-center">
              <input
                type="checkbox"
                className="form-checkbox h-4 w-4 rounded border-light text-primary 
                           focus:ring-primary dark:border-white/20 dark:bg-dark"
              />
              <span className="ml-2 text-sm text-text-secondary dark:text-white/70">
                Recuérdame
              </span>
            </div>

            {/* Botón de login */}
            <button
              type="submit"
              className="flex h-12 w-full items-center justify-center rounded-lg bg-primary px-6 
                         text-base font-semibold text-white shadow-sm hover:bg-primary/90 
                         focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary
                         disabled:cursor-not-allowed disabled:opacity-50"
            >
              Iniciar sesión
            </button>
          </form>
        </div>

        {/* Olvidé contraseña */}
        <p className="mt-8 text-center text-sm text-primary font-medium cursor-pointer hover:underline">
          ¿Olvidaste tu contraseña?
        </p>

        {/* Link a registro */}
        <div className="mt-10 text-center">
          <p className="text-sm text-text-secondary dark:text-white/70">
            ¿Aún no tienes cuenta?{" "}
            <Link
              to="/registro"
              className="font-semibold text-primary hover:underline"
            >
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>
    </MainLayout>
  );
};

export default Login;
