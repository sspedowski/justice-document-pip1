module.exports = { plugins: [require('tailwindcss'), require('autoprefixer')] }
  plugins: {
    tailwindcss: {},
    autoprefixer: {
      flexbox: 'no-2009',
      grid: 'autoplace'
    }
  }
}
