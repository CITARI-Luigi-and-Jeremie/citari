import type { Config } from "tailwindcss";

export default {
  // lib/ contient aussi des composants (content.tsx) : sans ce glob, leurs classes
  // ne sont pas générées et la mise en page casse silencieusement.
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
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
