import type { Config } from "tailwindcss";

// Phoenix corporate theme — orange/gold accents on deep navy.
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Heebo", "system-ui", "sans-serif"],
      },
      colors: {
        phoenix: {
          DEFAULT: "#F26A1B", // Phoenix orange
          dark: "#C9500E",
          glow: "#FF8C42",
          gold: "#F5A623",
          navy: "#0E2A47",
          "navy-light": "#15385E",
        },
      },
      boxShadow: {
        card: "0 10px 40px -12px rgba(14, 42, 71, 0.25)",
        glow: "0 4px 14px -2px rgba(242, 106, 27, 0.45)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "bounce-dot": {
          "0%, 80%, 100%": { transform: "scale(0.6)", opacity: "0.4" },
          "40%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.25s ease-out",
        "bounce-dot": "bounce-dot 1.2s infinite ease-in-out",
      },
    },
  },
  plugins: [],
} satisfies Config;
