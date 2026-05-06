// next.config PWA optimization
/** @type {import('next').NextConfig} */

const nextConfig = {
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Compression
  compress: true,

  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self), payment=(self)'
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.sentry.io wss: https:;"
          }
        ]
      }
    ]
  },

  // Redirects
  async redirects() {
    return []
  },

  // Rewrites
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/api/:path*',
          destination: '/api/:path*'
        }
      ]
    }
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_APP_NAME: 'PagoIA',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },

  // Webpack optimizations
  webpack: (config: import("webpack").Configuration, { isServer }: { isServer: boolean }) => {
    config.optimization = config.optimization ?? {}
    config.optimization.minimize = true
    return config
  },

  // SWC minification
  swcMinify: true,

  // Experimental features
  experimental: {
    // optimizePackageImports: ['@supabase/supabase-js'],
  }
};

module.exports = nextConfig;
