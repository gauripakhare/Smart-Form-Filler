// ✅ New Tailwind + PostCSS config for Next.js 15/16
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {}, // 👈 new package replaces "tailwindcss"
    autoprefixer: {},
  },
}
