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
        classical: {
          dark: '#1A1210',    // Deep charcoal/brown background
          wood: '#3E2415',    // Rich mahogany (Tabla wood)
          gold: '#E5A937',    // Glowing metallic gold
          sand: '#E3D5CA',    // Soft parchment text
          crimson: '#8B2121', // Deep accent red
        }
      },
      fontFamily: {
        serif: ['Georgia', 'serif'], // Elegant classical text
        sans: ['system-ui', 'sans-serif'],
      },
      animation: {
        'glow-pulse': 'glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        glow: {
          '0%, 100%': { opacity: 1, boxShadow: '0 0 15px rgba(229, 169, 55, 0.2)' },
          '50%': { opacity: .7, boxShadow: '0 0 30px rgba(229, 169, 55, 0.6)' },
        }
      }
    },
  },
  plugins: [],
};