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
        // Headings, nav, labels, buttons — condensed industrial grotesque.
        // macOS ships DIN Alternate/Condensed natively; Archivo Narrow is
        // the closest open fallback so it still reads right off-Mac.
        din: [
          "DIN Alternate",
          "DIN Condensed",
          "Archivo Narrow",
          "Arial Narrow",
          "sans-serif",
        ],
        // Body copy, form fields, data, every citation and case ID —
        // a real typewriter face, not a "mono accent." This is what
        // pulls the whole thing away from looking like a generic app.
        mono: ["Courier New", "Courier Prime", "Courier", "monospace"],
      },
      letterSpacing: {
        wide: "0.06em",
      },
      borderRadius: {
        DEFAULT: "0px", // hard corners — case file, not app chrome
      },
    },
  },
  plugins: [],
};

export default config;
