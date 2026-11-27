import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#142D4E",
        emerald: { DEFAULT: "#15966B" },
        surface: "#F8FAFC",
        card: "#FFFFFF",
        ink: "#172033",
        muted: "#64748B",
        line: "#E8EDF2",
      },
      borderRadius: {
        card: "24px",
        panel: "20px",
        image: "18px",
        control: "14px",
        modal: "24px",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(20,45,78,0.04), 0 8px 24px rgba(20,45,78,0.06)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-manrope)", "system-ui", "sans-serif"],
        accent: ["var(--font-jakarta)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
