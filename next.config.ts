import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    appDir: true, // Enables `app` directory
    middlewareMatcher: [
      "/api/:path*", // 모든 API에 적용
    ],
  },
};

export default nextConfig;
