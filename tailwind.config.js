/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 🎨 Paleta primaria
        primary: "#137FEC",      // Azul Primario
        "primary-dark": "#0B67C2", // Azul Primario Oscuro
        secondary: "#A4D4FF",    // Azul Secundario

        // 🎨 Colores de sistema
        success: "#28A745",      // Éxito
        error: "#DC3545",        // Error
        warning: "#FFC107",      // Advertencia
        info: "#17A2B8",         // Información

        // 🎨 Neutros
        white: "#FFFFFF",        // Blanco
        light: "#F6F7F8",        // Fondo Claro
        dark: "#111418",         // Texto / Fondo Oscuro
        "text-secondary": "#617589", // Texto Secundario
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Inter", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
