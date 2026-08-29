/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        panel: 'var(--panel)',
        surface: 'var(--surface)',
        foreground: 'var(--foreground)',
        muted: 'var(--muted-text)',
        line: 'var(--line)',
        accent: 'var(--accent)',
        amber: 'var(--amber)',
        critical: 'var(--critical)',
        slate: 'var(--slate)',
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
      },
    },
  },
  plugins: [],
};