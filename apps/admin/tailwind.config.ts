import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { accent: { DEFAULT: "#4f46e5", dark: "#4338ca" } },
    },
  },
  plugins: [],
} satisfies Config;
