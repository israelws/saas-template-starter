/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@saas-template/shared',
    'reactflow',
    '@reactflow/core',
    '@reactflow/minimap',
    '@reactflow/controls',
    '@reactflow/background',
    '@reactflow/node-toolbar',
    '@reactflow/node-resizer'
  ],
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    // Only add reactflow alias if it's installed
    try {
      const reactflowPath = require.resolve('reactflow');
      config.resolve.alias = {
        ...config.resolve.alias,
        'reactflow': reactflowPath,
      };
    } catch (e) {
      // reactflow not installed yet, skip alias
    }
    return config;
  },
};

module.exports = nextConfig;
