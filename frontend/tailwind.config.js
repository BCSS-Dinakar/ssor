/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Original colors:
        // primary: '#0B1F3A',
        // secondary: '#1E3A8A',
        // accent: '#F59E0B',
        // background: '#F8FAFC',
        // card: '#FFFFFF',
        // text: '#0F172A',
        // muted: '#64748B',
        // success: '#16A34A',
        // danger: '#DC2626',
        
        // New colors:
        primary: '#8E2F5E',
        secondary: '#C74B7A',
        accent: '#8B7BBF',
        background: '#FFF8FB',
        card: '#FFFFFF',
        text: '#2B1F26',
        muted: '#6B5A63',
        success: '#2E8B57',
        danger: '#C0392B',
      },
      fontFamily: {
        heading: ['Inter', 'Poppins', 'sans-serif'],
        body: ['Inter', 'Roboto', 'sans-serif'],
      },
      spacing: {
        '4.5': '1.125rem',
      },
      keyframes: {
        wave: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        swing: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(12deg)' },
          '75%': { transform: 'rotate(-12deg)' },
        },
      },
      animation: {
        'wave-slow': 'wave 25s linear infinite',
        'wave-medium': 'wave 15s linear infinite',
        'wave-fast': 'wave 10s linear infinite',
        'spin-slow': 'spin 3s linear infinite',
        'swing': 'swing 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
