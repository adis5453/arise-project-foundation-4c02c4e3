/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /* Semantic tokens (preferred): bg-background, text-foreground, etc. */
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: 'hsl(var(--card))',
        'card-foreground': 'hsl(var(--card-foreground))',
        popover: 'hsl(var(--popover))',
        'popover-foreground': 'hsl(var(--popover-foreground))',
        muted: 'hsl(var(--muted))',
        'muted-foreground': 'hsl(var(--muted-foreground))',
        /* Keep tokens un-alpha’d; components can control opacity via /xx utilities. */
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        brand: {
          primary: 'hsl(var(--primary))',
          'primary-foreground': 'hsl(var(--primary-foreground))',
          accent: 'hsl(var(--accent))',
          'accent-foreground': 'hsl(var(--accent-foreground))',
          secondary: 'hsl(var(--secondary))',
          'secondary-foreground': 'hsl(var(--secondary-foreground))',
        },
        // Denim Color Palette
        denim: {
          50: '#f0f8fe',
          100: '#deedfb',
          200: '#c4e2f9',
          300: '#9bcff5',
          400: '#6bb5ef',
          500: '#4997e8',
          600: '#347bdc',
          700: '#2962c2',
          800: '#2954a4',
          900: '#264882',
          950: '#1b2d50',
        },
        // Primary uses denim
        primary: {
          50: '#f0f8fe',
          100: '#deedfb',
          200: '#c4e2f9',
          300: '#9bcff5',
          400: '#6bb5ef',
          500: '#4997e8',
          600: '#347bdc',
          700: '#2962c2',
          800: '#2954a4',
          900: '#264882',
          950: '#1b2d50',
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #4997e8 0%, #347bdc 100%)',
        'gradient-dark': 'linear-gradient(135deg, #264882 0%, #1b2d50 100%)',
        'gradient-hero': 'linear-gradient(135deg, #347bdc 0%, #2962c2 50%, #2954a4 100%)',
        'gradient-card': 'linear-gradient(145deg, rgba(73, 151, 232, 0.05) 0%, rgba(52, 123, 220, 0.02) 100%)',
        'glass-light': 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(240, 248, 254, 0.8) 100%)',
        'glass-dark': 'linear-gradient(135deg, rgba(27, 45, 80, 0.9) 0%, rgba(38, 72, 130, 0.85) 100%)',
        'shimmer': 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
      },
      boxShadow: {
        'denim-sm': '0 2px 8px rgba(73, 151, 232, 0.15)',
        'denim-md': '0 4px 16px rgba(73, 151, 232, 0.2)',
        'denim-lg': '0 8px 32px rgba(73, 151, 232, 0.25)',
        'denim-xl': '0 12px 48px rgba(73, 151, 232, 0.3)',
        'denim-glow': '0 0 20px rgba(73, 151, 232, 0.4)',
        'denim-hover': '0 6px 20px rgba(73, 151, 232, 0.25)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.1)',
        'glass-hover': '0 20px 40px rgba(73, 151, 232, 0.2)',
      },
      backdropBlur: {
        'glass': '20px',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'shimmer': 'shimmer 2s infinite',
        'slide-up': 'slideUp 0.5s ease-out',
        'fade-in': 'fadeIn 0.6s ease-out',
        'scale-in': 'scaleIn 0.4s ease-out',
        'count-up': 'countUp 1s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(73, 151, 232, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(73, 151, 232, 0.6)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        slideUp: {
          '0%': { opacity: 0, transform: 'translateY(20px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        scaleIn: {
          '0%': { opacity: 0, transform: 'scale(0.9)' },
          '100%': { opacity: 1, transform: 'scale(1)' },
        },
        countUp: {
          '0%': { opacity: 0, transform: 'translateY(10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
      borderRadius: {
        'glass': '20px',
      },
    },
  },
  plugins: [],
}
