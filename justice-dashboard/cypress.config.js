const { defineConfig } = require('cypress');

module.exports = defineConfig({
  projectId: 'mbvhmn',
  e2e: {
    baseUrl: 'http://localhost:5174',
    supportFile: false,
    specPattern: 'cypress/e2e/**/*.cy.js',
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
  component: {
    devServer: {
      framework: "react",
      bundler: "webpack",
    },
  },
});
