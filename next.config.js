/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Lint only the Next app while legacy dirs are parked
    dirs: ['app', 'lib'],
    // Allow deploys while we finish cleanup
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
