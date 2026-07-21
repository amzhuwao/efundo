/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@efundo/shared-types'],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
