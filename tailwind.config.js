/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{vue,js,ts,tsx}",
    "./components/**/*.{vue,js,ts,tsx}",
    "./layouts/**/*.{vue,js,ts,tsx}",
    "./pages/**/*.{vue,js,ts,tsx}",
    "./plugins/**/*.{vue,js,ts,tsx}",
    "./server/**/*.{vue,js,ts,tsx}",
    "./composables/**/*.{js,ts}",
    // optional: if you use Nuxt templates
    "./nuxt.config.{js,ts}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}