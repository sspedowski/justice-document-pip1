const nextConfig = {
  output: "standalone",
  env: {
    BUILD_TIME: new Date().toISOString(),
  },
};

export default nextConfig;
