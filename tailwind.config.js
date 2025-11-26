/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#137FEC",
        secondary: "#A4D4FF",
        success: "#28A745",
        error: "#DC3545",
        warning: "#FFC107",
        info: "#17A2B8",
        white: "#FFFFFF",
        light: "#F6F7F8",
        dark: "#111418",

        "text-secondary": "#617589",
      },
    },
  },
  plugins: [],
}
