/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
      colors: {
        accent: {
          DEFAULT: '#2563eb',
          light: '#eff6ff',
          dark: '#1d4ed8',
        },
        surface: '#f8f9fa',
        border: '#e5e7eb',
        muted: '#6b7280',
        text: {
          primary: '#111827',
          secondary: '#374151',
        }
      },
      typography: {
        DEFAULT: {
          css: {
            color: '#111827',
            a: { color: '#2563eb' },
          }
        }
      }
    },
  },
  plugins: [],
}