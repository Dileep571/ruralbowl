/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost', 'your-cdn-domain.com', 'images.unsplash.com'], // Add your image domains
    formats: ['image/webp', 'image/avif'], // Modern image formats
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          }
        ],
      },
    ]
  },
  // SEO optimization
  async redirects() {
    return [
      {
        source: '/products',
        destination: '/products/page/1',
        permanent: true,
      },
    ]
  },
  // Environment variables
  env: {
    API_URL: process.env.API_URL || 'http://localhost:3001',
  },
}

module.exports = nextConfig;
