import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0f172a",
        accent: { DEFAULT: "#4f46e5", dark: "#4338ca", light: "#eef2ff" },
      },
    },
  },
  plugins: [],
} satisfies Config;
