/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  distDir: 'dist',
  eslint: {
    dirs: ['src/frontend'],
  },
  // swcMinify и experimental.appDir удалены как устаревшие
};

module.exports = nextConfig;
