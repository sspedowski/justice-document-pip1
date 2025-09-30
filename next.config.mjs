/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Keep routing opinions minimal; do not set basePath or trailingSlash unless required.
  async headers() {
    return [
      // Security headers (global)
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'same-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // Enable a CSP only after auditing all inline scripts/styles
          // {
          //   key: 'Content-Security-Policy',
          //   value: [
          //     "default-src 'self'",
          //     "img-src 'self' data: blob:",
          //     "font-src 'self' data:",
          //     "style-src 'self' 'unsafe-inline'",
          //     "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
          //     "connect-src 'self' https:",
          //   ].join('; ')
          // },
        ],
      },
      // Long-term cache for static assets produced by Vite dashboard build
      {
        source: '/dashboard/assets/:all*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/dashboard/vite.svg',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};

export default nextConfig;
