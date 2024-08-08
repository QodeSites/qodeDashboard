import withMT from "@material-tailwind/react/utils/withMT";

export default withMT({
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@material-tailwind/react/components/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@material-tailwind/react/theme/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1rem" }],    // 12px
        sm: ["0.875rem", { lineHeight: "1.25rem" }], // 14px
        md: ["1rem", { lineHeight: "1.5rem" }],      // 16px
        base: ["1.125rem", { lineHeight: "1.75rem" }], // 18px
        lg: ["1.15rem", { lineHeight: "1.75rem" }],  // 20px
        xl: ["1.25rem", { lineHeight: "2rem" }],      // 24px
        "2xl": ["1.75rem", { lineHeight: "2.25rem" }], // 28px
        "3xl": ["2rem", { lineHeight: "2.5rem" }],   // 32px
        "4xl": ["2.5rem", { lineHeight: "3rem" }],   // 40px
        "5xl": ["3rem", { lineHeight: "3.5rem" }],   // 48px
        "6xl": ["3.75rem", { lineHeight: "4rem" }],  // 60px
        "7xl": ["4.5rem", { lineHeight: "1" }],      // 72px
      },
    },
  },
  plugins: [],
});
