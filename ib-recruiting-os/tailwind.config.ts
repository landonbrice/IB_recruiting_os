import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-space-grotesk)", "system-ui", "sans-serif"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        smoke: {
          DEFAULT: "#2a2826",
          1: "#353230",
          2: "#46423f",
        },
        cream: {
          DEFAULT: "#F5F1EA",
          1: "#e8e4dc",
        },
        terracotta: {
          DEFAULT: "#d4845a",
        },
      },
    },
  },
  plugins: [],
};
export default config;
