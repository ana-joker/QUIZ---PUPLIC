/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'slate-900': '#0f172a',
        'purple-600': '#7c3aed',
        'purple-500': '#8b5cf6', // Assuming this is the lighter end of the gradient
        'teal-500': '#14b8a6',
        'slate-50': '#f8fafc',
        'slate-700': '#334155', // For cards background, based on #1e293b which is close to slate-800 or slate-700
        'violet-600': '#7c3aed', // Assuming violet for the gradient, same as purple-600 for now
      },
      fontFamily: {
        sans: ['Inter', 'Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
