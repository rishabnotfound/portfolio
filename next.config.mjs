/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
      },
    ],
  },
  webpack: (config) => {
    config.externals.push({
      'canvas': 'canvas',
    });
    return config;
  },
  // Suppress hydration warnings in development
  reactStrictMode: true,
};

export default nextConfig;
