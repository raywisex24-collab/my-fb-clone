/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'boss-bg': 'var(--bg-color)',
        'boss-text': 'var(--text-color)',
        'boss-accent': 'var(--accent-color)',
        'boss-card': 'var(--card-bg)',
      },
    },
  },
  plugins: [],
}
