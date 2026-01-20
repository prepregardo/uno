/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Inline critical CSS to eliminate render-blocking
    optimizeCss: true,
  },
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

module.exports = nextConfig;
