/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        chikarro: {
          50: '#FDF2F2',
          100: '#FDE8E8',
          200: '#FBD5D5',
          500: '#E02424',
          600: '#C8102E', // Chikarro Crimson Red
          700: '#A50D25',
          800: '#840A1D',
          900: '#630716',
        },
        surface: {
          cream: '#FAF6F0', // Soft Warm Cream / Sand
          base: '#FAF6F0',
          warm: '#F5EFE6',
          card: '#FFFFFF',
          charcoal: '#1E293B',
          border: '#E8E1D5',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        display: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(30, 41, 59, 0.05), 0 1px 2px -1px rgba(30, 41, 59, 0.05)',
        'card-hover': '0 4px 12px 0 rgba(30, 41, 59, 0.08), 0 2px 4px -1px rgba(30, 41, 59, 0.06)',
        'touch': '0 10px 25px -5px rgba(200, 16, 46, 0.15), 0 8px 10px -6px rgba(200, 16, 46, 0.1)',
        'dock': '0 -4px 16px -2px rgba(30, 41, 59, 0.06)',
      }
    },
  },
  plugins: [],
}
