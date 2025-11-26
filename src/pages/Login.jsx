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
      // 🔐 Aquí luego conectarás tu lógica real de login (API + Prisma)
      // Por ahora solo simulamos un login "de prueba":

      if (!email || !password) {
        throw new Error("Campos vacíos");
      }

      // Ejemplo tonto de navegación según correo:
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
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-primary mb-4">
            <span className="material-symbols-outlined text-3xl">
              login
            </span>
          </div>
          <h1 className="text-3xl font-black text-dark dark:text-white tracking-tight">
            Inicia sesión en DARMAX
          </h1>
          <p className="mt-2 text-base text-text-secondary dark:text-gray-400">
            Accede para gestionar tus pedidos de agua de forma rápida y sencilla.
          </p>
        </div>

        {/* Card del formulario */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark p-6 sm:p-8 shadow-sm">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Correo */}
            <label className="flex flex-col">
              <p className="pb-2 text-sm font-medium text-dark dark:text-gray-200">
                Correo electrónico
              </p>
              <input
                type="email"
                placeholder="tu@correo.com"
                className="form-input h-12 w-full rounded-lg border border-[#dbe0e6] bg-white p-3 text-base text-dark placeholder:text-text-secondary 
                focus:border-primary focus:outline-0 focus:ring-2 focus:ring-primary/20 
                dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-primary"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                  placeholder="Introduce tu contraseña"
                  className="form-input h-12 w-full rounded-lg border border-[#dbe0e6] bg-white p-3 pr-10 text-base text-dark placeholder:text-text-secondary 
                  focus:border-primary focus:outline-0 focus:ring-2 focus:ring-primary/20 
                  dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-primary"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            {/* Error */}
            {error && (
              <div className="text-red-500 text-sm text-center">
                {error}
              </div>
            )}

            {/* Recordarme */}
            <div className="flex items-center">
              <input
                type="checkbox"
                className="form-checkbox h-4 w-4 rounded border-gray-300 text-primary 
                focus:ring-primary dark:border-gray-600 dark:bg-gray-800"
              />
              <span className="ml-2 text-sm text-text-secondary dark:text-gray-400">
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
          <p className="text-sm text-text-secondary dark:text-gray-400">
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
