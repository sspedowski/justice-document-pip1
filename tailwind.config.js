/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./*.{html,js}", "./client/**/*.{html,js}", "./styles/**/*.css"],
  theme: {
    extend: {
      colors: {
        gold: {
          50: "#FFFEF7",
          100: "#FFFACD",
          200: "#FFF8DC",
          300: "#FFE135",
          400: "#FFD700",
          500: "#FFC300",
          600: "#FFB300",
          700: "#DAA520",
          800: "#B8860B",
          900: "#B08D32",
        },
        faith: {
          50: "#F8F9FF",
          100: "#E6E8FF",
          200: "#C3C8FF",
          300: "#9CA3FF",
          400: "#6366F1",
          500: "#4F46E5",
          600: "#4338CA",
          700: "#3730A3",
          800: "#312E81",
          900: "#1E1B4B",
        },
      },
      fontFamily: {
        serif: ["Georgia", "serif"],
        faith: ["Georgia", "Times New Roman", "serif"],
      },
      animation: {
        "spin-slow": "spin 3s linear infinite",
        "bounce-slow": "bounce 2s infinite",
        "pulse-slow": "pulse 3s infinite",
        float: "float 6s ease-in-out infinite",
        glow: "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        glow: {
          "0%": {
            "box-shadow": "0 0 5px #FFD700, 0 0 10px #FFD700, 0 0 15px #FFD700",
          },
          "100%": {
            "box-shadow":
              "0 0 10px #FFD700, 0 0 20px #FFD700, 0 0 30px #FFD700",
          },
        },
      },
      backgroundImage: {
        "faith-gradient":
          "linear-gradient(135deg, #1E1B4B 0%, #4F46E5 50%, #FFD700 100%)",
        "gold-gradient": "linear-gradient(135deg, #FFD700 0%, #FFC300 100%)",
        "heaven-gradient":
          "linear-gradient(to bottom, #4F46E5, #E0E7FF, #FEF3C7)",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
