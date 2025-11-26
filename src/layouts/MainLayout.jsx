const MainLayout = ({ children }) => {
  return (
    <div
      className="min-h-screen w-full bg-light dark:bg-dark text-dark dark:text-white 
                 flex flex-col items-center justify-center transition-colors"
      style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}
    >
      <main className="flex w-full max-w-5xl px-6 py-10 justify-center items-center">
        {children}
      </main>

      <footer className="absolute bottom-4 text-xs text-text-secondary dark:text-white/50">
        © {new Date().getFullYear()} Darmax — Todos los derechos reservados
      </footer>
    </div>
  );
};

export default MainLayout;
