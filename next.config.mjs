/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    appDir: true,
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/auth/signin',
        permanent: false,
        has: [
          {
            type: 'query',
            key: 'redirect',
            value: 'true',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
