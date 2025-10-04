/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Ignore ESLint during builds for speed - run lint separately in CI
    ignoreDuringBuilds: true
  }
};

export default nextConfig;
