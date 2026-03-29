/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark theme palette based on mockup
        background: {
          primary: '#16171D',      // Main background
          secondary: '#1F2128',    // Sidebar
          tertiary: '#1D1F26',     // Alternating rows / subtle differentiation
          highlight: '#323743',    // Borders, subtle highlights, select states
        },
        foreground: {
          primary: '#D4D3D6',      // Main text color
          secondary: '#9a9a9e',    // Muted text
          muted: '#6a6a70',        // Very dim metadata
        },
        accent: {
          primary: '#4a6fa5',      // Muted blue for tags/highlights
          secondary: '#8b7355',    // Warm accent for notes
        },
        sidebar: {
          active: '#2a2d35',       // Selected item background
          hover: '#252830',        // Hover state
        }
      },
      fontFamily: {
        // Germanic medieval blackletter for display/title
        display: ['UnifrakturMaguntia', 'cursive'],
        // Clean sans for body
        body: ['Inter', 'system-ui', 'sans-serif'],
        // Elegant, readable serif for document titles
        heading: ['Playfair Display', 'Georgia', 'serif'],
      },
      fontSize: {
        // More dramatic size differences
        'display': ['3rem', { lineHeight: '1.1', fontWeight: '400' }],
        'title': ['1.375rem', { lineHeight: '1.3', fontWeight: '500' }],
        'section': ['1.0625rem', { lineHeight: '1.4', fontWeight: '500' }],
        'body': ['0.9375rem', { lineHeight: '1.6', fontWeight: '400' }],
        'small': ['0.8125rem', { lineHeight: '1.5', fontWeight: '400' }],
        'tiny': ['0.75rem', { lineHeight: '1.4', fontWeight: '400' }],
      },
      borderRadius: {
        // Hard edges - minimal rounding
        'sm': '2px',
        'md': '3px',
        'lg': '4px',
        'xl': '6px',
      },
      borderWidth: {
        'hairline': '0.5px',
      },
    },
  },
  plugins: [],
}
