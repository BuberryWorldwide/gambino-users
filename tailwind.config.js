/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        gold: "#FFD700",
        coal: "#0b0b0c",
        // Extended yellows and ambers matching homepage
        'yellow-400': '#facc15',
        'yellow-500': '#eab308',
        'amber-400': '#fbbf24',
        'amber-500': '#f59e0b',
        'amber-600': '#d97706',
        // Extended neutrals for better depth
        'neutral-100': '#f5f5f5',
        'neutral-300': '#d4d4d8',
        'neutral-400': '#a1a1aa',
        'neutral-500': '#71717a',
        'neutral-700': '#404040',
        'neutral-800': '#262626',
        'neutral-900': '#171717',
        'neutral-950': '#0a0a0a',
      },
      animation: {
        'float-slow': 'float 6s ease-in-out infinite',
        'float-medium': 'float 4s ease-in-out infinite',
        'float-fast': 'float 3s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'spin-slow': 'spin 20s linear infinite',
        'spin-very-slow': 'spin 30s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseGlow: {
          '0%, 100%': { 
            boxShadow: '0 0 20px rgba(234,179,8,0.3)',
            opacity: '0.6'
          },
          '50%': { 
            boxShadow: '0 0 30px rgba(234,179,8,0.5), 0 0 60px rgba(234,179,8,0.1)',
            opacity: '0.8'
          },
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(234, 179, 8, 0.3)',
        'glow-lg': '0 0 30px rgba(234, 179, 8, 0.4), 0 0 60px rgba(234, 179, 8, 0.1)',
        'inner-glow': 'inset 0 0 20px rgba(234, 179, 8, 0.1)',
      }
    },
  },
  plugins: [],
}