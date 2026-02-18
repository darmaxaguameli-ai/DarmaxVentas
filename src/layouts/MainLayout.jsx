const MainLayout = ({ children }) => {
  return (
    <div
      className="min-h-screen w-full bg-light dark:bg-dark text-dark dark:text-white 
                 flex flex-col items-center transition-colors" // Removed justify-center
      style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}
    >
      <main className="flex w-full max-w-none justify-center items-center flex-grow"> {/* Removed paddings to allow full height usage */}
        {children}
      </main>

      <footer className="hidden sm:block py-3 text-xs text-text-secondary dark:text-white/50"> {/* Reduced padding */}
        © {new Date().getFullYear()} Darmax — Todos los derechos reservados
      </footer>
    </div>
  );
};

export default MainLayout;
