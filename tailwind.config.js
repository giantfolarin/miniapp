/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        'neon-gradient': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'neon-pink': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'neon-purple': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(139, 92, 246, 0.5)' },
          '100%': { boxShadow: '0 0 30px rgba(236, 72, 153, 0.8)' },
        },
      },
    },
  },
  plugins: [],
}
