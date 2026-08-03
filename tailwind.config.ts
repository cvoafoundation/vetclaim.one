import type { Config } from "tailwindcss";

// Design tokens — locked from the design-review pass.
// Paper/ink/warm-gray base, one restrained ochre accent.
// Serif for case substance, sans for UI/controls, mono for every
// citation, case ID, and date — the recurring "evidentiary" idiom.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FAFAF8",
        ink: "#1C1C1A",
        muted: "#4A4A46",
        hairline: "#E5E3DD",
        accent: {
          DEFAULT: "#8C6F4E",
          light: "#F4EFE8",
        },
        status: {
          present: "#3B6D11",
          missing: "#993C1D",
          conflicting: "#854F0B",
          neutral: "#4A4A46",
        },
      },
      fontFamily: {
        serif: ["Iowan Old Style", "Georgia", "serif"],
        sans: [
          "-apple-system",
          "Inter",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: ["SF Mono", "Menlo", "Consolas", "monospace"],
      },
      borderRadius: {
        DEFAULT: "2px", // hairline, document-like — not app-y rounded corners
      },
    },
  },
  plugins: [],
};

export default config;
