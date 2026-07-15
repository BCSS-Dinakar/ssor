/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Government design tokens — Police Blue / Slate system
        primary: {
          DEFAULT: '#0B1F3A',
          foreground: '#FFFFFF',
          50: '#E8EEF5',
          100: '#C5D3E4',
          700: '#0E2A4F',
          800: '#0B1F3A',
          900: '#071428',
        },
        secondary: {
          DEFAULT: '#1E3A8A',
          foreground: '#FFFFFF',
          50: '#EEF2FF',
          100: '#E0E7FF',
          600: '#1E3A8A',
          700: '#1E3A8A',
        },
        accent: {
          DEFAULT: '#D97706',
          foreground: '#0B1F3A',
          50: '#FFFBEB',
          100: '#FEF3C7',
          500: '#D97706',
          600: '#B45309',
        },
        success: {
          DEFAULT: '#15803D',
          foreground: '#FFFFFF',
          50: '#F0FDF4',
          100: '#DCFCE7',
          600: '#16A34A',
          700: '#15803D',
          800: '#166534',
        },
        warning: {
          DEFAULT: '#D97706',
          foreground: '#0B1F3A',
          50: '#FFFBEB',
          100: '#FEF3C7',
          600: '#D97706',
          700: '#B45309',
        },
        danger: {
          DEFAULT: '#B91C1C',
          foreground: '#FFFFFF',
          50: '#FEF2F2',
          100: '#FEE2E2',
          600: '#DC2626',
          700: '#B91C1C',
          800: '#991B1B',
        },
        info: {
          DEFAULT: '#1D4ED8',
          foreground: '#FFFFFF',
          50: '#EFF6FF',
          100: '#DBEAFE',
          600: '#2563EB',
          700: '#1D4ED8',
        },
        background: '#F1F5F9',
        card: '#FFFFFF',
        text: '#0F172A',
        muted: {
          DEFAULT: '#64748B',
          foreground: '#475569',
        },
        border: '#E2E8F0',
        ring: '#1E3A8A',
      },
      fontFamily: {
        heading: ['Source Sans 3', 'Inter', 'system-ui', 'sans-serif'],
        body: ['Source Sans 3', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Standard Tailwind scale (compact on small laptops; root bumps only on TV)
        xs: ['0.75rem', { lineHeight: '1.35' }],      // 12px — badges/meta only
        sm: ['0.875rem', { lineHeight: '1.45' }],     // 14px — secondary / nav
        base: ['1rem', { lineHeight: '1.55' }],       // 16px — body
        lg: ['1.125rem', { lineHeight: '1.45' }],     // 18px — emphasized
        xl: ['1.25rem', { lineHeight: '1.35' }],      // 20px — card title
        '2xl': ['1.5rem', { lineHeight: '1.3' }],     // 24px — page title
        '3xl': ['1.875rem', { lineHeight: '1.25' }],  // 30px
        '4xl': ['2.25rem', { lineHeight: '1.2' }],
        '5xl': ['3rem', { lineHeight: '1.15' }],
        // Semantic aliases (aligned to compact laptop UI)
        body: ['1rem', { lineHeight: '1.55' }],
        'body-sm': ['0.875rem', { lineHeight: '1.45' }],
        title: ['1.125rem', { lineHeight: '1.4' }],
        section: ['1.25rem', { lineHeight: '1.35' }],
        heading: ['1.5rem', { lineHeight: '1.3' }],
        display: ['1.875rem', { lineHeight: '1.25' }],
      },
      screens: {
        xs: '480px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
        tv: '1920px',
      },
      spacing: {
        '4.5': '1.125rem',
        '18': '4.5rem',
      },
      minHeight: {
        touch: '2.5rem', // 40px — usable on dense laptop UIs
      },
      minWidth: {
        touch: '2.5rem',
      },
      boxShadow: {
        panel: '0 1px 3px 0 rgb(15 23 42 / 0.06), 0 1px 2px -1px rgb(15 23 42 / 0.06)',
        elevated: '0 4px 12px -2px rgb(15 23 42 / 0.08)',
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
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleUp: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideInFromTop: {
          '0%': { opacity: '0', transform: 'translateY(-0.5rem)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'toast-in': {
          '0%': { opacity: '0', transform: 'translateY(0.75rem)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'toast-out': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
      },
      animation: {
        'wave-slow': 'wave 25s linear infinite',
        'wave-medium': 'wave 15s linear infinite',
        'wave-fast': 'wave 10s linear infinite',
        'spin-slow': 'spin 3s linear infinite',
        swing: 'swing 2s ease-in-out infinite',
        fadeIn: 'fadeIn 0.2s ease-out',
        scaleUp: 'scaleUp 0.2s ease-out',
        'slide-in-from-top-2': 'slideInFromTop 0.15s ease-out',
        'toast-in': 'toast-in 0.2s ease-out',
        'toast-out': 'toast-out 0.15s ease-in',
      },
    },
  },
  plugins: [],
};
