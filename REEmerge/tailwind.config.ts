import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#E9EAE2",
        ink: "#202B36",
        ink2: "#4A5A66",
        rule: "#C7CABC",
        gold: "#A9812F",
        moss: "#3F5C46",
        rust: "#8E4433",
      },
      fontFamily: {
        serif: ["Source Serif 4", "Georgia", "serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
      },
      borderRadius: {
        sm: "2px",
      },
    },
  },
  plugins: [],
};
export default config;
