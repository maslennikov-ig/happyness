/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    appDir: true,
  },
  distDir: 'dist',
  eslint: {
    dirs: ['src/frontend'],
  },
};

module.exports = nextConfig; 