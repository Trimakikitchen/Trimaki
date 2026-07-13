/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#FF7A00",
          hover: "#E06B00",
          light: "#FFF3E5",
        },
        accent: {
          DEFAULT: "#E53935",
          hover: "#C62828",
          light: "#FFEBEE",
        },
        charcoal: {
          DEFAULT: "#1F1F1F",
          light: "#2D2D2D",
          dark: "#121212",
        },
        muted: {
          DEFAULT: "#F5F5F5",
          medium: "#9CA3AF",
          dark: "#E5E7EB",
        },
        success: "#22C55E",
        warning: "#F59E0B",
      },
      fontFamily: {
        sans: ["Inter", "Outfit", "sans-serif"],
      },
      boxShadow: {
        premium: "0 10px 30px -10px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.02)",
        glow: "0 0 15px rgba(255, 122, 0, 0.15)",
        card: "0 4px 20px rgba(0, 0, 0, 0.03)",
      },
      borderRadius: {
        premium: "16px",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out forwards",
        "slide-up": "slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "slide-down": "slideDown 0.3s ease-out forwards",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
}
