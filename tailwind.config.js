/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Barlow', 'system-ui', 'sans-serif'],
        display: ['"Barlow Semi Condensed"', 'Barlow', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Deep obsidian & slate dark theme scale
        ink: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          850: '#151f32',
          900: '#0f172a',
          950: '#080d1a',
        },
        // Electric Blue & Cyan primary accent scale
        road: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#3b82f6',
          500: '#2563eb',
          600: '#1d4ed8',
          700: '#1e40af',
          800: '#1e3a8a',
          900: '#172554',
          950: '#0b132b',
        },
        cyan: {
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
        },
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgb(0 0 0 / 0.2)',
        'glow-sm': '0 0 16px -2px rgba(59, 130, 246, 0.4)',
        'glow-md': '0 0 24px -3px rgba(59, 130, 246, 0.5)',
        'glow-cyan': '0 0 20px -3px rgba(34, 211, 238, 0.4)',
      },
    },
  },
  plugins: [],
};


