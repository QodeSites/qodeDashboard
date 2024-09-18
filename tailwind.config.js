// tailwind.config.js
import flattenColorPalette from "tailwindcss/lib/util/flattenColorPalette";

/** @type {import('tailwindcss').Config} */
const config = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#945c39",
        },
        text: {
          DEFAULT: "#000000",
          secondary: "#4A4A4A",
        },
        lightBeige: "#fee9d6",
        beige: "#d1a47b",
        brown: "#945c39",
        white: "#ffffff",
        black: "#000000",
        darkGrey: "#807f7f",
        lightGrey: "#e2e2e2",
      },
      borderWidth: {
        DEFAULT: '1px',
      },
      fontSize: {
        // Font sizes with line height calculated as 1.3 times the body font size
        body: ["16px", { lineHeight: "21px" }],       // Body text
        subheading: ["26px", { lineHeight: "35px" }], // 26px * 1.3
        semiheading: ["42px", { lineHeight: "65px" }], // 26px * 1.3
        heading: ["67px", { lineHeight: "78px" }],    // 41px * 1.3
        xs: ["14px", { lineHeight: "18.2px" }],         // 14px * 1.3
        '1xl': '16px',
        '2xl': '26px',
        '3xl': '42px',
        '4xl': '67px',
        '5xl': '107px',
      },
      fontFamily: {
        heading: ['"Playfair Display"', "serif"],
        body: ['"DM Sans"', "sans-serif"],
      },
      fontWeight: {
        heading: "600", //Semi bold
        subheading: "500", //medium
        body: "400", //normal
      },
      spacing: {
        // Define spacing based on 1.3 times the body font size (16px * 1.3 = 20.8px)
        '18': '16px',
        '1': '21px',  // 1x spacing
        '2': '27px',  // 2x spacing
        '3': '35px',  // 3x spacing
        '4': '46px',  // 4x spacing
        '5': '60px',   // 5x spacing
        '6': '78px', // 6x spacing
        '7': '101px', // 7x spacing
        '8': '131px', // 8x spacing
        '9': '170px', // 9x spacing
        '10': '221px',  // 10x spacing
        '11': '287px',  // 11x spacing
        '12': '373px',// 12x spacing
        '13': '485px',// 13x spacing
        '14': '631px',  // 14x spacing
        '15': '820px',  // 15x spacing
        '16': '1066px',  // 16x spacing
        '17': '1386px',  // 17x spacing
      },
    },
  },
  plugins: [addVariablesForColors],
};

function addVariablesForColors({ addBase, theme }) {
  const allColors = flattenColorPalette(theme("colors"));
  const newVars = Object.fromEntries(
    Object.entries(allColors).map(([key, val]) => [`--${key}`, val])
  );

  addBase({
    ":root": newVars,
  });
}

export default config;
