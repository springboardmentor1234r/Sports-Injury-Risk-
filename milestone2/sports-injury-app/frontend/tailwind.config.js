/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#070A14",
        surface: "#0F1420",
        "surface-raised": "#161C2C",
        line: "rgba(255,255,255,0.08)",
        "line-soft": "rgba(255,255,255,0.05)",
        cyan: {
          DEFAULT: "#22D3C7",
          soft: "#22D3C71A",
          dim: "#0F766E",
        },
        violet: {
          DEFAULT: "#7C6FFF",
          soft: "#7C6FFF1A",
        },
        coral: {
          DEFAULT: "#FF6B6B",
          soft: "#FF6B6B1A",
        },
        amber: {
          DEFAULT: "#F5A623",
          soft: "#F5A6231A",
        },
        sage: {
          DEFAULT: "#4ADE80",
          soft: "#4ADE801A",
        },
        paper: "#EEF1F8",
        muted: "#8892AB",
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'IBM Plex Sans'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      boxShadow: {
        panel: "0 1px 0 0 rgba(255,255,255,0.06) inset, 0 20px 50px -20px rgba(0,0,0,0.7)",
        glow: "0 0 0 1px rgba(34,211,199,0.15), 0 8px 30px -8px rgba(34,211,199,0.35)",
        "glow-violet": "0 0 0 1px rgba(124,111,255,0.15), 0 8px 30px -8px rgba(124,111,255,0.4)",
      },
      backgroundImage: {
        "gradient-brand": "linear-gradient(135deg, #22D3C7 0%, #7C6FFF 100%)",
        "gradient-mesh":
          "radial-gradient(ellipse 80% 50% at 15% 0%, rgba(124,111,255,0.25), transparent 60%), radial-gradient(ellipse 60% 50% at 85% 20%, rgba(34,211,199,0.18), transparent 60%), radial-gradient(ellipse 60% 40% at 50% 100%, rgba(124,111,255,0.12), transparent 60%)",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
}
