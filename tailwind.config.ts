import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui"],
        serif: ["var(--font-serif)", "ui-serif", "Georgia"],
        hand: ["var(--font-hand)", "cursive"],
        mono: ["ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        cream: {
          50: "#FBF6EE",
          100: "#F5EBD9",
          200: "#EAD9BA",
        },
        ink: {
          900: "#1A1410",
          700: "#3D2F25",
          500: "#6B5645",
        },
        pop: {
          pink: "#FF6FA5",
          coral: "#FF8A65",
          mint: "#A8D8B9",
          sky: "#9EC5E8",
          butter: "#FFD972",
        },
      },
      boxShadow: {
        card: "0 8px 24px -8px rgba(26, 20, 16, 0.18)",
        printout: "0 14px 28px -12px rgba(26, 20, 16, 0.35)",
        page: "0 4px 14px -6px rgba(0,0,0,0.18)",
      },
      backgroundImage: {
        "paper-grain":
          "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.6), transparent 35%), radial-gradient(circle at 80% 70%, rgba(0,0,0,0.04), transparent 40%)",
      },
    },
  },
  plugins: [],
};

export default config;
