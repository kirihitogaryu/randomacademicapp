/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark theme palette - easy on eyes
        background: {
          primary: '#1a1a1b',      // Main background (dark grey)
          secondary: '#262628',    // Cards, sidebars
          tertiary: '#333335',     // Hover states
        },
        foreground: {
          primary: '#e4e4e7',      // Main text
          secondary: '#a1a1aa',    // Muted text
        },
        accent: {
          primary: '#6366f1',      // Indigo - primary actions
          secondary: '#8b5cf6',    // Violet - secondary actions
        },
      },
      fontFamily: {
        // Decorative font for app title
        display: ['Georgia', 'serif'],
        // Clean sans for body text
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
