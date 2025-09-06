/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1B5E20",
          light: "#4CAF50",
          dark: "#0D4B13",
        },
        secondary: {
          DEFAULT: "#263238",
          light: "#37474F",
          dark: "#102027",
        },
        neutral: {
          DEFAULT: "#FAFAFA",
          50: "#FAFAFA",
          100: "#F5F5F5",
          200: "#EEEEEE",
          300: "#E0E0E0",
          400: "#BDBDBD",
          500: "#9E9E9E",
          600: "#757575",
          700: "#616161",
          800: "#424242",
          900: "#212121",
        },
        text: {
          main: "#212121",
          subtle: "#616161",
        },
        status: {
          error: "#D32F2F",
          warning: "#FFA000",
          success: "#388E3C",
        },
      },
      fontFamily: {
        sans: ["Inter", "Roboto", "system-ui", "sans-serif"],
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "32px",
      },
      screens: {
        mobile: { max: "767px" },
        tablet: { min: "768px", max: "1279px" },
        desktop: { min: "1280px" },
      },
      boxShadow: {
        factory: "0 2px 8px rgba(0, 0, 0, 0.08)",
        "factory-lg": "0 4px 16px rgba(0, 0, 0, 0.12)",
      },
      borderRadius: {
        factory: "8px",
        "factory-sm": "4px",
      },
    },
  },
  plugins: [],
};
