import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    appDir: true, // Enables `app` directory
  },
};

export default nextConfig;
