/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0B1F3A',
        secondary: '#1E3A8A',
        accent: '#F59E0B',
        background: '#F8FAFC',
        card: '#FFFFFF',
        text: '#0F172A',
        muted: '#64748B',
        success: '#16A34A',
        danger: '#DC2626',
      },
      fontFamily: {
        heading: ['Inter', 'Poppins', 'sans-serif'],
        body: ['Inter', 'Roboto', 'sans-serif'],
      },
      keyframes: {
        wave: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'wave-slow': 'wave 25s linear infinite',
        'wave-medium': 'wave 15s linear infinite',
        'wave-fast': 'wave 10s linear infinite',
      },
    },
  },
  plugins: [],
}
