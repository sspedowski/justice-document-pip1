const { defineConfig } = require("cypress");

module.exports = defineConfig({
  projectId: 'mbvhmn',
  e2e: {
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
