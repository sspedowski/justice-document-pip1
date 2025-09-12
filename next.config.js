/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure ESLint to run during builds
  eslint: {
    // Allow builds to continue even with ESLint errors during development
    // Set to false once all issues are resolved
    ignoreDuringBuilds: false,
  },
  experimental: {
    // Enable SWC for better performance
    swcMinify: true,
  },
};

export default nextConfig;