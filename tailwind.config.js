/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#14161A",
          soft: "#3A3D45",
        },
        paper: "#FAFAF8",
        line: "#E3E1DA",
        signal: {
          DEFAULT: "#3454D1",
          dark: "#28409E",
          soft: "#EAEDFB",
        },
        published: {
          DEFAULT: "#1F8A70",
          soft: "#E5F3EF",
        },
        draft: {
          DEFAULT: "#B8860B",
          soft: "#FBF3E3",
        },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        sans: ["'IBM Plex Sans'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      boxShadow: {
        panel: "0 1px 2px rgba(20, 22, 26, 0.06)",
      },
    },
  },
  plugins: [],
};
