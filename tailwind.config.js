/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0B0F19',
          surface: '#141C2E',
          'surface-alt': '#1A2540',
          hover: '#1E2D4A',
        },
        border: {
          default: '#2A3654',
          focus: '#3B5998',
        },
        text: {
          primary: '#E8ECF4',
          secondary: '#8899B8',
          muted: '#556682',
        },
        accent: {
          green: '#22C55E',
          amber: '#F59E0B',
          red: '#EF4444',
          blue: '#3B82F6',
        },
        glow: {
          green: 'rgba(34, 197, 94, 0.15)',
          amber: 'rgba(245, 158, 11, 0.15)',
          red: 'rgba(239, 68, 68, 0.15)',
          blue: 'rgba(59, 130, 246, 0.15)',
        }
      },
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
