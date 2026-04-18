import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      backgroundImage: {
        "page-gradient":
          "linear-gradient(165deg, rgb(248 250 252) 0%, rgb(255 255 255) 42%, rgb(245 243 255) 100%)",
        "brand-gradient":
          "linear-gradient(135deg, rgb(124 58 237) 0%, rgb(79 70 229) 100%)",
      },
      boxShadow: {
        card: "0 1px 2px rgb(15 23 42 / 0.04), 0 8px 24px rgb(15 23 42 / 0.06)",
        "card-hover":
          "0 2px 4px rgb(15 23 42 / 0.05), 0 12px 32px rgb(15 23 42 / 0.08)",
      },
    },
  },
  plugins: [],
};
export default config;
