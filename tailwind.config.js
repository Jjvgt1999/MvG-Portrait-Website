/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#f5f1e8',
        ink: '#1a1a1a',
        dust: '#7a7a7a',
        editorial: '#1d6fe5',
        polaroid: '#fdfcf7',
      },
      fontFamily: {
        serif: ['"EB Garamond"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        display: ['clamp(3rem, 8vw, 7rem)', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        headline: ['clamp(2rem, 4vw, 3.5rem)', { lineHeight: '1.1' }],
        pullquote: ['clamp(1.75rem, 3.2vw, 3rem)', { lineHeight: '1.3' }],
        body: ['1.25rem', { lineHeight: '1.7' }],
      },
      maxWidth: {
        prose: '38rem',
      },
      letterSpacing: {
        wideish: '0.04em',
      },
    },
  },
  plugins: [],
};
