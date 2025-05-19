import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}', 
  ],
  darkMode: 'class', 
  theme: {
    extend: {
      animation: {
        fadeIn: 'fadeIn 0.3s ease-out',
        bounce: 'bounce 1s infinite', 
        pulseCorrect: 'pulseCorrect 1.2s cubic-bezier(0.4, 0, 0.6, 1) 2', 
        pulseIncorrect: 'pulseIncorrect 1.2s cubic-bezier(0.4, 0, 0.6, 1) 2',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite', 
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseCorrect: {
          '0%, 100%': { boxShadow: '0 0 0 0px rgba(74, 222, 128, 0.6)' }, 
          '50%': { boxShadow: '0 0 0 10px rgba(74, 222, 128, 0)' },
        },
        pulseIncorrect: {
          '0%, 100%': { boxShadow: '0 0 0 0px rgba(248, 113, 113, 0.6)' }, 
          '50%': { boxShadow: '0 0 0 10px rgba(248, 113, 113, 0)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      colors: {
        dark: {
          primary: '#0D0D0D',
          secondary: '#1A1A1A', 
          accent: '#F2AC29',
          accenthover: '#e29c20',
          text: '#E0E0E0',
          'text-secondary': '#A0A0A0',
        },
        light: {
          primary: '#FFFFFF',
          secondary: '#F3F4F6',
          accent: '#F2AC29',
          accenthover: '#e29c20',
          text: '#1F2937',
          'text-secondary': '#6B7280',
        }
      }
    },
  },
  plugins: [],
}
export default config