/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        indian: {
          bg: '#FAF4E6',      // Soft parchment/ivory base
          brown: '#5C3A21',   // Deep mahogany (Tabla wood)
          gold: '#D4AF37',    // Soft golden yellow
          earth: '#8B5A2B',   // Warm earth tone
          dark: '#2A1610',    // Very dark brown for text
        }
      },
      fontFamily: {
        serif: ['Georgia', 'serif'], // Fallback for classic serif
        sans: ['system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
};