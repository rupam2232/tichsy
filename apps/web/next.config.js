/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@repo/ui"],
  images: {
    remotePatterns: [{
    protocol: 'https',
    hostname: 'res.cloudinary.com',
    pathname: '/rupam-mondal/**',
  },],
  },
};

export default nextConfig;
