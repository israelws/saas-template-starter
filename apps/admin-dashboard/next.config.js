/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@saas-template/shared'],
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
