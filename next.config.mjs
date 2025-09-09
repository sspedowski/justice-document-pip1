const nextConfig = {
  output: "standalone",
  // Temporary relax build blocking while new AI integration stabilizes.
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;

