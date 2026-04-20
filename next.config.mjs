/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  experimental: {
    serverActions: { bodySizeLimit: '20mb' },
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: 'minio' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
};

export default nextConfig;
