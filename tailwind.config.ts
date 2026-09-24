import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#16201d",
        moss: "#315d4c",
        mint: "#dceee5",
        paper: "#f7f8f5",
        coral: "#e27057",
        sky: "#dceaf2",
      },
      boxShadow: {
        soft: "0 18px 60px rgba(28, 45, 39, 0.10)",
      },
    },
  },
  plugins: [],
} satisfies Config;
