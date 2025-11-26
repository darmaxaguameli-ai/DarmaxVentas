// src/pages/HomePage.jsx
import { Link } from "react-router-dom";
import MainLayout from "../layouts/MainLayout.jsx";

const HomePage = () => {
  return (
    <MainLayout>
      <div
        className="relative w-full max-w-md rounded-2xl bg-white/80 dark:bg-white/10 
                   shadow-2xl backdrop-blur-xl p-8 flex flex-col items-center text-center"
      >
        {/* Logo DARMAX */}
        <div
          className="w-full h-16 bg-center bg-no-repeat bg-contain mb-6"
          style={{
            backgroundImage: "url('/img/logos/darmax-logo.png')",
          }}
          aria-label="Logo DARMAX"
        />

        {/* Título */}
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3 text-dark dark:text-white">
          Bienvenido a DARMAX
        </h1>

        {/* Descripción */}
        <p className="text-text-secondary dark:text-white/70 text-base mb-8 max-w-xs">
          Tu agua purificada, a un clic de distancia.
        </p>

        {/* Botones */}
        <div className="w-full flex flex-col gap-4">
          <Link
            to="/registro"
            className="h-12 flex items-center justify-center rounded-lg 
                       bg-primary text-white font-bold tracking-wide
                       transition-all hover:scale-[1.03] active:scale-[0.97]"
          >
            Registrarse
          </Link>

          <Link
            to="/login"
            className="h-12 flex items-center justify-center rounded-lg 
                       bg-white text-dark ring-1 ring-text-secondary/30
                       dark:bg-dark/70 dark:text-white dark:ring-white/20
                       font-bold tracking-wide
                       transition-all hover:scale-[1.03] active:scale-[0.97]"
          >
            Iniciar Sesión
          </Link>
        </div>

        <p className="text-text-secondary dark:text-white/60 text-sm mt-10 underline cursor-pointer">
          Términos de servicio y Política de privacidad
        </p>
      </div>
    </MainLayout>
  );
};

export default HomePage;
