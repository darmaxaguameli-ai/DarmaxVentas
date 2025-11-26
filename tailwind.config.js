/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 🎨 Paleta primaria
        primary: "#137FEC",
        secondary: "#A4D4FF",

        // 🎨 Colores de sistema
        success: "#28A745",
        error: "#DC3545",
        warning: "#FFC107",
        info: "#17A2B8",

        // 🎨 Neutrales
        white: "#FFFFFF",
        light: "#F6F7F8",
        dark: "#111418",
        "text-secondary": "#617589",
      },
    },
  },
  plugins: [],
};
