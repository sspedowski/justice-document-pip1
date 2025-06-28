module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {
      browsers: [
        'last 2 versions',
        'not dead',
        'not ie <= 11',
        'not op_mini all'
      ],
      flexbox: 'no-2009',
      grid: 'autoplace'
    }
  }
}
