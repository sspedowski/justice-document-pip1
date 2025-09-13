/** @type {import('next').NextConfig} */
const nextConfig = {
  // Skip ESLint during `next build` to avoid parser config conflicts
  // while migrating to flat config. Re-enable once ESLint config is unified.
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Use SWC minification
  swcMinify: true,
};

module.exports = nextConfig;
