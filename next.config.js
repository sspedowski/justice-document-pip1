/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable ESM support
  experimental: {
    esmExternals: true
  },
  
  // Optimize for production
  output: 'standalone',
  
  // Enable SWC minification for better performance
  swcMinify: true,
  
  // Configure Vercel deployment
  env: {
    CUSTOM_KEY: 'my-value',
  },
}

export default nextConfig