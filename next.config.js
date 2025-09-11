/** Minimal Next config for tests */
module.exports = {
  experimental: {
    esmExternals: 'loose'
  },
  env: {
    BUILD_TIME: new Date().toISOString(),
  },
};
