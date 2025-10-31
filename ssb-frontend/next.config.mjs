/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Allow cross-origin requests from network IP
  allowedDevOrigins: [
    "http://192.168.31.214:3000", // Thay bằng IP client cần truy cập
    "http://192.168.31.217:3000", // IP server (nếu cần)
    "http://localhost:3000",
  ],
};

export default nextConfig;
