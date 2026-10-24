import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0c1114",
        panel: "#131a1e",
        edge: "#2a3439",
        accent: "#c9f36a",
        muted: "#a0aaa7"
      },
      fontFamily: { sans: ["Arial", "Helvetica", "sans-serif"] }
    }
  },
  plugins: []
};
export default config;
