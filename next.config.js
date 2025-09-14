/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Enable if needed for larger payloads
    // serverComponentsExternalPackages: ['firebase-admin']
  },
  // Optional: skip ESLint during builds if needed
  // eslint: {
  //   ignoreDuringBuilds: true,
  // },
};

export default nextConfig;