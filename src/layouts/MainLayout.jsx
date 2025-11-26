import { Link } from "react-router-dom";

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header style={{ padding: "12px 24px", borderBottom: "1px solid #ddd" }}>
        <nav style={{ display: "flex", gap: 16 }}>
          <Link to="/">Inicio</Link>
          <Link to="/users">Usuarios</Link>
        </nav>
      </header>

      <main style={{ padding: 24, flex: 1 }}>{children}</main>

      <footer style={{ padding: 12, borderTop: "1px solid #eee", fontSize: 12 }}>
        Proyecto base con Vite + React + Prisma + Vercel
      </footer>
    </div>
  );
}
