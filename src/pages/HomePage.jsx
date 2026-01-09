// src/pages/HomePage.jsx
import { Link } from "react-router-dom";
import MainLayout from "../layouts/MainLayout.jsx";

const HomePage = () => {
  return (
    <MainLayout>
      <div
        className="relative w-full max-w-md rounded-2xl bg-white/90 dark:bg-dark/40 
                   shadow-xl backdrop-blur-xl p-8 flex flex-col items-center text-center
                   border border-light/60 dark:border-white/10"
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
        <h1 className="text-dark dark:text-white font-black text-3xl sm:text-4xl tracking-tight">
          Bienvenido a DARMAX
        </h1>

        {/* Descripción */}
        <p className="text-text-secondary dark:text-white/70 text-base leading-relaxed mt-3 mb-8 max-w-xs">
          Tu agua a un clic de distancia.
        </p>

        {/* Botones */}
        <div className="w-full flex flex-col gap-4">

          {/* Botón primario */}
          <Link
            to="/registro"
            className="h-12 flex items-center justify-center rounded-lg
                       bg-primary text-white font-semibold tracking-wide
                       hover:bg-primary-dark hover:text-white active:scale-[0.98]
                       transition-all"
          >
            Registrarse
          </Link>

          {/* Botón secundario */}
          <Link
            to="/login"
            className="h-12 flex items-center justify-center rounded-lg 
                       bg-light text-dark border border-text-secondary/30
                       dark:bg-dark/70 dark:text-white dark:border-white/20
                       font-semibold tracking-wide
                       hover:bg-light/70 dark:hover:bg-dark/60
                       active:scale-[0.98] transition-all"
          >
            Iniciar Sesión
          </Link>
        </div>

        {/* Footer link */}
        <p className="text-text-secondary dark:text-white/60 text-sm mt-10 underline cursor-pointer">
          Términos de servicio y Política de privacidad
        </p>
      </div>
    </MainLayout>
  );
};

export default HomePage;
