/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'verde-safra': '#10B981',
        'terra-fertil': '#92400E',
        'dourado-milho': '#F59E0B',
        'bege-palha': '#F5DEB3',
        'marrom-solo': '#8B4513',
      },
      fontFamily: {
        'sans': ['Poppins', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}