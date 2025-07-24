const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5174',
    supportFile: false,
    specPattern: 'cypress/e2e/**/*.cy.js',
  },
});
