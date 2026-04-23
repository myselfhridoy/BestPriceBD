/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      animation: {
        'pulse': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'fade-in': 'fade-in 0.5s ease-in-out'
      },
      keyframes: {
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        }
      },
      transitionDelay: {
        '1000': '1000ms'
      }
    }
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        dark: {
          primary: '#3b82f6',
          secondary: '#10b981',
          accent: '#f59e0b',
          neutral: '#6b7280',
          'base-900': '#0f172a',
          'base-950': '#030712',
          'base-100': '#1e293b',
          'base-200': '#334155',
          'base-300': '#475569',
          'base-content': '#e2e8f0',
          info: '#3b82f6',
          success: '#22c55e',
          warning: '#f59e0b',
          error: '#ef4444'
        }
      }
    ]
  }
}
