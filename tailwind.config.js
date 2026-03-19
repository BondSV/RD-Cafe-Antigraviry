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
          primary: '#F2F2F2',
          surface: '#FFFFFF',
          'surface-alt': '#F1F5F9',
          hover: '#E2E8F0',
        },
        border: {
          default: '#CBD5E1',
          focus: '#3B82F6',
        },
        text: {
          primary: '#0F172A',
          secondary: '#334155',
          muted: '#64748B',
        },
        accent: {
          green: '#16A34A',
          amber: '#D97706',
          red: '#DC2626',
          blue: '#2563EB',
          indigo: '#6366F1',
          burgundy: '#8B0000',
        },
        glow: {
          green: 'rgba(22, 163, 74, 0.25)',
          amber: 'rgba(217, 119, 6, 0.25)',
          red: 'rgba(220, 38, 38, 0.25)',
          blue: 'rgba(37, 99, 235, 0.25)',
          indigo: 'rgba(99, 102, 241, 0.25)',
          burgundy: 'rgba(139, 0, 0, 0.25)',
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
