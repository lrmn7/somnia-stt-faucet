/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  async rewrites() {
    return [
      {
        source: '/event/verify-player/:address',
        destination: '/api/event/verify-player/:address',
      },
    ];
  },
};

module.exports = nextConfig;
