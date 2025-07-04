/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@saas-template/shared'],
  experimental: {
    serverActions: true,
  },
}

module.exports = nextConfig