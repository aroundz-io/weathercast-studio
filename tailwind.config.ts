import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Pretendard",
          "Apple SD Gothic Neo",
          "Malgun Gothic",
          "맑은 고딕",
          "Noto Sans KR",
          "system-ui",
          "sans-serif",
        ],
      },
      colors: {
        ink: {
          900: "#0a0f1e",
          800: "#0f1629",
          700: "#161f38",
          600: "#1e2a47",
        },
        sky: {
          glow: "#38bdf8",
        },
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(56,189,248,0.25), 0 8px 40px -12px rgba(56,189,248,0.35)",
      },
      keyframes: {
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.5s infinite",
        "pulse-soft": "pulse-soft 1.6s ease-in-out infinite",
        "fade-in": "fade-in 0.35s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
