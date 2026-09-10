/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  output: 'standalone',
  images: {
    domains: ['images.unsplash.com', 'graph.facebook.com', 'platform-lookaside.fbsbx.com']
  }
};

export default nextConfig;
